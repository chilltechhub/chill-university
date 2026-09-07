// src/components/CommandPalette.js
// Global search / command palette — Cmd+K (Ctrl+K) on web, "Search" in the
// floating action button anywhere else.
//
// The app is ~90 screens deep in places (a life-area section is three taps
// from Home; a class topic four), and the things people save live across
// several tables. This is the one place to type a name and land on it,
// whether "it" is a screen, a note, a saved paper, a project, a class topic,
// or a game.
//
// Two halves, and they behave differently on purpose:
//   • Destinations (screens, life areas, classes, games) match locally from
//     src/logic/searchIndex.js, so they appear on the first keystroke.
//   • Content (captures + projects) is a debounced Supabase query — see
//     src/logic/globalSearch.js.
//
// It renders as a sibling of the navigator (App.js), which is why every jump
// goes through navigateTo()'s explicit nested routes rather than a bare
// navigate() — same constraint the FAB documents at the top of its file.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Modal, Platform, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { supabase } from '../api/supabaseClient';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { searchDestinations, defaultDestinations, navigateTo } from '../logic/searchIndex';
import { searchContent } from '../logic/globalSearch';
import { KINDS, rowKind } from '../screens/library/knowledge';

const RECENTS_KEY = 'command_palette_recents';
const MAX_RECENTS = 6;
const DEBOUNCE_MS = 250;

const isWeb = Platform.OS === 'web';

// ─── One result row ────────────────────────────────────────────────────────
function ResultRow({ row, active, onPress, c, styles, showEmojis }) {
  const accent = row.color || c.teal;
  return (
    <TouchableOpacity
      style={[styles.row, active && { backgroundColor: `${c.teal}18`, borderColor: `${c.teal}55` }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${accent}22` }]}>
        {showEmojis && row.emoji
          ? <Text style={{ fontSize: 15 }}>{row.emoji}</Text>
          : <Ionicons name={row.icon || 'ellipse-outline'} size={15} color={accent} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{row.title}</Text>
        {!!row.subtitle && <Text style={styles.rowSubtitle} numberOfLines={1}>{row.subtitle}</Text>}
      </View>
      <Ionicons name="arrow-forward" size={13} color={active ? c.teal : c.text4} />
    </TouchableOpacity>
  );
}

export default function CommandPalette() {
  const { open, closePalette } = useCommandPalette();
  const navigation = useNavigation();
  const { colors: c } = useTheme();
  const { showEmojis } = useUIPrefs();
  const styles = makeStyles(c);

  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [content, setContent] = useState({ captures: [], projects: [] });
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState([]);
  const inputRef = useRef(null);
  const requestId = useRef(0);
  const handled = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  // Reset on each open — a palette that reopens showing the last search is
  // a palette you have to clear before you can use it.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setContent({ captures: [], projects: [] });
    setActiveIndex(0);
    handled.current = false;
    cacheRead(RECENTS_KEY).then((saved) => setRecents(Array.isArray(saved) ? saved : []));
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);

  // Debounced content search. requestId guards against an earlier, slower
  // query landing after a later one and overwriting its results.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2 || !userId) { setContent({ captures: [], projects: [] }); setSearching(false); return; }
    setSearching(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const results = await searchContent(userId, q);
      if (id !== requestId.current) return;
      setContent(results);
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, userId, open]);

  const destinations = useMemo(() => (query.trim() ? searchDestinations(query) : []), [query]);

  // Flattened, in the order they're rendered — this is what the arrow keys
  // walk and what Enter opens.
  const sections = useMemo(() => {
    const q = query.trim();
    if (!q) {
      const out = [];
      if (recents.length) out.push({ title: 'Recent', rows: recents });
      out.push({ title: 'Jump to', rows: defaultDestinations() });
      return out;
    }
    const out = [];
    if (destinations.length) out.push({ title: 'Go to', rows: destinations });
    if (content.captures.length) {
      out.push({
        title: 'Notes & saved',
        rows: content.captures.map((row) => {
          const kind = rowKind(row);
          const meta = KINDS[kind];
          return {
            id: `capture:${row.id}`,
            title: row.title || row.body?.slice(0, 60) || 'Untitled',
            subtitle: `${meta.label}${row.url ? ` · ${row.url}` : row.body ? ` · ${row.body.slice(0, 60)}` : ''}`,
            icon: meta.icon,
            color: c[meta.colorKey] || c.teal,
            emoji: meta.emoji,
            route: { type: 'tab', tab: 'Library', screen: 'KnowledgeScreen', params: { initialType: kind, focusId: row.id } },
          };
        }),
      });
    }
    if (content.projects.length) {
      out.push({
        title: 'Projects',
        rows: content.projects.map((p) => ({
          id: `project:${p.id}`,
          title: p.title || 'Untitled project',
          subtitle: p.objective || p.status || 'Project',
          icon: 'hammer-outline',
          color: p.color || c.gold,
          emoji: p.emoji,
          route: { type: 'tab', tab: 'Library', screen: 'ProjectDetail', params: { project: p } },
        })),
      });
    }
    return out;
  }, [query, destinations, content, recents, c]);

  const flat = useMemo(() => sections.flatMap((section) => section.rows), [sections]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  // Enter can reach this twice for one keypress (the capture-phase listener
  // and the input's own onSubmitEditing, which is what carries Enter on
  // mobile). Without the guard that pushes the destination onto the stack
  // twice and the back gesture needs two goes. Reset on each open.
  const select = useCallback((row) => {
    if (!row || handled.current) return;
    handled.current = true;
    closePalette();
    navigateTo(navigation, row.route);
    // Remember it for the next empty-query open. Content rows are stored the
    // same way as screens — they're already flat {title, icon, route}.
    const entry = { id: row.id, title: row.title, subtitle: row.subtitle, icon: row.icon, color: row.color, emoji: row.emoji, route: row.route };
    const next = [entry, ...recents.filter((x) => x.id !== row.id)].slice(0, MAX_RECENTS);
    setRecents(next);
    cacheWrite(RECENTS_KEY, next);
  }, [closePalette, navigation, recents]);

  // Arrows move, Enter opens, Escape closes — web only.
  const handleKey = useCallback((key, meta) => {
    if (key === 'Escape') { closePalette(); return true; }
    if (key === 'ArrowDown') { setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0))); return true; }
    if (key === 'ArrowUp') { setActiveIndex((i) => Math.max(i - 1, 0)); return true; }
    if (key === 'Enter') { select(flat[activeIndex]); return true; }
    if (meta && (key === 'k' || key === 'K')) { closePalette(); return true; }
    return false;
  }, [flat, activeIndex, select, closePalette]);

  useEffect(() => {
    if (!open || !isWeb || typeof document === 'undefined') return;
    const onKeyDown = (e) => {
      if (handleKey(e.key, e.metaKey || e.ctrlKey)) e.preventDefault();
    };
    // Capture phase: React Native Web's TextInput calls stopPropagation on
    // key events, so a normal (bubbling) listener never sees them while the
    // search field has focus.
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, handleKey]);


  if (!open) return null;

  const q = query.trim();
  const nothing = q.length > 0 && flat.length === 0 && !searching;
  let rowIndex = -1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closePalette}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closePalette}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
          {/* Swallow taps inside the card so they don't close the overlay */}
          <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => {}}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={17} color={c.teal} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search screens, notes, projects, classes..."
                placeholderTextColor={c.text4}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={() => select(flat[activeIndex])}
              />
              {searching && <ActivityIndicator size="small" color={c.teal} />}
              {isWeb ? (
                <View style={styles.kbdHint}><Text style={styles.kbdHintText}>ESC</Text></View>
              ) : (
                <TouchableOpacity onPress={closePalette} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={c.text4} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
              {nothing && (
                <View style={styles.empty}>
                  <Ionicons name="telescope-outline" size={28} color={c.border} />
                  <Text style={styles.emptyText}>Nothing matches "{q}"</Text>
                  <Text style={styles.emptyHint}>Try a screen name, a note's words, or a class topic.</Text>
                </View>
              )}
              {sections.map((section) => (
                <View key={section.title}>
                  <Text style={styles.sectionHeader}>{section.title}</Text>
                  {section.rows.map((row) => {
                    rowIndex += 1;
                    const idx = rowIndex;
                    return (
                      <ResultRow
                        key={row.id || `${section.title}-${idx}`}
                        row={row}
                        active={isWeb && idx === activeIndex}
                        onPress={() => select(row)}
                        c={c} styles={styles} showEmojis={showEmojis}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {isWeb && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>↑↓ to move · ↵ to open · esc to close</Text>
                <Text style={styles.footerText}>⌘K / Ctrl+K anywhere</Text>
              </View>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 70, paddingHorizontal: 16 },
  card: { width: '100%', maxWidth: 620, backgroundColor: c.bg1, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  input: { flex: 1, color: c.text1, fontSize: 15, paddingVertical: 2, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
  kbdHint: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg2 },
  kbdHintText: { color: c.text4, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  results: { maxHeight: 430 },
  sectionHeader: { color: c.text4, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 6, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  rowIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: c.text1, fontSize: 13.5, fontWeight: '600' },
  rowSubtitle: { color: c.text3, fontSize: 11, marginTop: 1 },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyText: { color: c.text2, fontSize: 13, fontWeight: '600' },
  emptyHint: { color: c.text4, fontSize: 11 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg2 },
  footerText: { color: c.text4, fontSize: 10 },
});
