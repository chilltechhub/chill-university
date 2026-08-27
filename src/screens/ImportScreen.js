// src/screens/ImportScreen.js
// Import Hub — lives inside the Capture Inbox. Paste anything (raw URLs,
// browser bookmark exports, markdown link lists, CSV, tab dumps) and it's
// organized into `captures` (status: 'inbox'), same table and shape as
// Quick Capture, via captureService.addCapture so it gets the same
// offline-queue behavior as everything else in the Inbox.
//
// Structured formats (CSV, bookmark HTML, markdown links, "site.com -
// description" lists, URL lists) are parsed deterministically in
// src/logic/importParsers.js — instantly, no AI, no API key needed. Only
// genuinely freeform text with no recognizable structure falls back to AI
// extraction, and every result can optionally be enriched with AI afterward.
// The AI is given your real life areas, active projects, and idea garden
// entries so it can attach an item directly to one of them (project_id /
// life_area_id on the capture) instead of only guessing a generic category —
// so "where did this go" has a concrete answer: your Inbox, and if matched,
// also that project or life area.
//
// The AI call itself never runs in this file — see src/api/importAI.js: it
// uses your own API key (Settings) if you've set one, otherwise the app's
// shared server-side function. A key referenced from client code ships
// inside the downloadable app bundle and can be extracted by anyone, so it
// must never live here.

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { addCapture } from '../api/captureService';
import { analyzeWithAI, hasUserApiKey } from '../api/importAI';
import { detectFormat, parseDeterministic, normalizeUrlForDedupe } from '../logic/importParsers';
import { itemsToMarkdown, itemsToCSV } from '../logic/exportUtils';
import { CAPTURE_TYPES } from './CaptureInbox';
import { LIFE_AREAS } from './library/LifeAreaScreen';
import { FONTS } from '../theme';

const TYPE_MAP = Object.fromEntries(CAPTURE_TYPES.map(t => [t.key, t]));
const LIFE_AREA_MAP = Object.fromEntries(LIFE_AREAS.map(a => [a.id, a]));

const FORMATS = [
  { key: 'auto',      label: 'Auto-detect' },
  { key: 'sitelist',  label: 'Site — description' },
  { key: 'urls',      label: 'URLs only' },
  { key: 'bookmarks', label: 'Bookmarks (HTML)' },
  { key: 'markdown',  label: 'Markdown' },
  { key: 'csv',       label: 'CSV' },
];

const FORMAT_LABEL = { csv: 'CSV', bookmarks: 'browser bookmarks', markdown: 'markdown links', sitelist: 'a site + description list', urls: 'a URL list', freeform: 'freeform text' };

let uidCounter = 0;
const nextId = () => `imp_${Date.now()}_${uidCounter++}`;

export default function ImportScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [userId, setUserId] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [format, setFormat] = useState('auto');
  const [analyzing, setAnalyzing] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Your real projects/ideas/life-area rows — used to match imports to
  // something that already exists instead of only a generic category.
  const [context, setContext] = useState({ projects: [], ideas: [], lifeAreaRows: [] });

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState(null);
  const [dupSkipped, setDupSkipped] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const [projRes, ideaRes, areaRes] = await Promise.all([
        supabase.from('projects').select('id,title').eq('user_id', user.id).eq('status', 'active').is('deleted_at', null).limit(30),
        supabase.from('garden_cores').select('id,title').eq('user_id', user.id).is('deleted_at', null).limit(30),
        supabase.from('life_areas').select('id,label').eq('user_id', user.id),
      ]);
      setContext({
        projects: projRes.data || [],
        ideas: ideaRes.data || [],
        lifeAreaRows: areaRes.data || [],
      });
    });
    hasUserApiKey().then(setHasKey);
  }, []);

  const detected = useMemo(() => (format === 'auto' ? detectFormat(pasteText) : format), [pasteText, format]);
  const willUseAI = detected === 'freeform';

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setPasteText(text);
      else Alert.alert('Clipboard is empty', 'Copy something first, then try again.');
    } catch {
      Alert.alert('Could not read clipboard');
    }
  };

  const projectTitle = (id) => context.projects.find(p => p.id === id)?.title;
  const ideaTitle = (id) => context.ideas.find(i => i.id === id)?.title;

  // Cross-checks parsed items against captures still sitting unprocessed in
  // your inbox (so a re-paste doesn't clutter it with repeats), drops
  // repeat links within this paste, and resolves AI matches (project/idea
  // ids, life area) into display labels. URLs are compared normalized
  // (scheme, www, trailing slash, case ignored) so "site.com" and
  // "https://www.site.com/" are recognized as the same link.
  //
  // Scoped to status: 'inbox' only, not your whole capture history —
  // anything you've already processed out of the inbox (into Research,
  // Resources, a project, etc.) no longer counts as "already saved" and
  // won't block re-importing it.
  const normalizeItems = async (parsed) => {
    let existingKeys = new Set();
    if (userId) {
      const { data: existing } = await supabase
        .from('captures')
        .select('url')
        .eq('user_id', userId)
        .eq('status', 'inbox')
        .not('url', 'is', null)
        .is('deleted_at', null)
        .limit(5000);
      existingKeys = new Set((existing || []).map(row => normalizeUrlForDedupe(row.url)).filter(Boolean));
    }

    const seenInBatch = new Set();
    let duplicatesSkipped = 0;
    const out = [];

    for (const i of parsed) {
      const key = i.url ? normalizeUrlForDedupe(i.url) : null;
      if (key) {
        if (seenInBatch.has(key)) { duplicatesSkipped++; continue; } // repeat link within this paste
        seenInBatch.add(key);
      }
      const isDupe = !!key && existingKeys.has(key);
      const matchType = i.match_type === 'project' || i.match_type === 'idea' ? i.match_type : null;
      const matchId = matchType && i.match_id ? i.match_id : null;
      const matchLabel = matchType === 'project' ? projectTitle(matchId) : matchType === 'idea' ? ideaTitle(matchId) : null;
      out.push({
        localId: nextId(),
        title: i.title || i.url || 'Untitled',
        url: i.url || null,
        type: TYPE_MAP[i.type] ? i.type : 'link',
        description: i.description || '',
        tags: Array.isArray(i.tags) ? i.tags.slice(0, 4) : [],
        lifeArea: LIFE_AREA_MAP[i.life_area] ? i.life_area : null,
        // Only keep the match if we could actually resolve its title — an
        // id the model invented won't resolve and gets dropped here.
        matchType: matchLabel ? matchType : null,
        matchId: matchLabel ? matchId : null,
        matchLabel: matchLabel || null,
        selected: !isDupe,
        isDupe,
      });
    }
    return { items: out, duplicatesSkipped };
  };

  const analyze = async () => {
    if (!pasteText.trim()) return;
    setSummary(null);
    setDupSkipped(0);

    if (!willUseAI) {
      const { items: parsed } = parseDeterministic(pasteText, format);
      if (parsed.length === 0) {
        Alert.alert('Nothing found', `Detected ${FORMAT_LABEL[detected]}, but couldn't find any items in it.`);
        return;
      }
      try {
        const { items: normalized, duplicatesSkipped } = await normalizeItems(parsed);
        setItems(normalized);
        setDupSkipped(duplicatesSkipped);
      } catch (e) {
        console.error('ImportScreen normalizeItems failed:', e);
        Alert.alert('Could not check for duplicates', e.message || 'Try again in a moment.');
      }
      return;
    }

    setAnalyzing(true);
    try {
      const parsed = await analyzeWithAI(pasteText, 'auto', context);
      if (parsed.length === 0) {
        Alert.alert('Nothing found', "Couldn't find any links or notes worth importing in that paste.");
        setItems([]);
      } else {
        const { items: normalized, duplicatesSkipped } = await normalizeItems(parsed);
        setItems(normalized);
        setDupSkipped(duplicatesSkipped);
      }
    } catch (e) {
      Alert.alert('Could not analyze that', e.message || 'Try again in a moment.');
    }
    setAnalyzing(false);
  };

  const enrich = async () => {
    if (items.length === 0) return;
    setEnriching(true);
    try {
      const slim = items.map(it => ({ title: it.title, url: it.url || undefined }));
      const enriched = await analyzeWithAI(JSON.stringify(slim), 'enrich', context);
      setItems(prev => prev.map((it, i) => {
        const e = enriched[i];
        if (!e) return it;
        const matchType = e.match_type === 'project' || e.match_type === 'idea' ? e.match_type : null;
        const matchId = matchType && e.match_id ? e.match_id : null;
        const matchLabel = matchType === 'project' ? projectTitle(matchId) : matchType === 'idea' ? ideaTitle(matchId) : null;
        return {
          ...it,
          type: TYPE_MAP[e.type] ? e.type : it.type,
          description: e.description || it.description,
          tags: Array.isArray(e.tags) && e.tags.length ? e.tags.slice(0, 4) : it.tags,
          lifeArea: LIFE_AREA_MAP[e.life_area] ? e.life_area : it.lifeArea,
          matchType: matchLabel ? matchType : it.matchType,
          matchId: matchLabel ? matchId : it.matchId,
          matchLabel: matchLabel || it.matchLabel,
        };
      }));
    } catch (e) {
      console.error('ImportScreen enrich failed:', e);
      Alert.alert('Could not enrich with AI', e.message || 'Try again in a moment.');
    }
    setEnriching(false);
  };

  const toggleItem = (localId) => {
    setItems(prev => prev.map(it => it.localId === localId ? { ...it, selected: !it.selected } : it));
  };
  const setAll = (selected) => setItems(prev => prev.map(it => ({ ...it, selected })));
  const updateTitle = (localId, title) => {
    setItems(prev => prev.map(it => it.localId === localId ? { ...it, title } : it));
  };

  const selectedItems = items.filter(it => it.selected);

  const runImport = async () => {
    if (!userId) { Alert.alert('Sign in required', 'You need to be signed in to import.'); return; }
    if (selectedItems.length === 0) { Alert.alert('Nothing selected', 'Check at least one item to import.'); return; }

    setImporting(true);
    setImportProgress({ done: 0, total: selectedItems.length });
    let saved = 0, skipped = 0, attached = 0;

    for (const item of selectedItems) {
      try {
        const areaRow = item.lifeArea ? context.lifeAreaRows.find(a => a.label?.toLowerCase() === LIFE_AREA_MAP[item.lifeArea]?.label.toLowerCase()) : null;
        const tags = item.lifeArea && !item.tags.includes(item.lifeArea) ? [...item.tags, item.lifeArea] : item.tags;

        await addCapture(userId, {
          type: item.type,
          title: item.title,
          body: item.description || null,
          url: item.url,
          tags,
          project_id: item.matchType === 'project' ? item.matchId : null,
          life_area_id: areaRow?.id || null,
          source: 'import',
        });
        saved++;
        if (item.matchType === 'project' || areaRow) attached++;
      } catch (e) {
        console.warn('ImportScreen: failed to save item', item.title, e.message || e);
        skipped++;
      }
      setImportProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setImporting(false);
    setSummary({ saved, skipped, attached });
    setItems(prev => prev.filter(it => !it.selected));
  };

  const exportAs = async (kind) => {
    if (items.length === 0) { Alert.alert('Nothing to export', 'Analyze a paste first.'); return; }
    const text = kind === 'markdown' ? itemsToMarkdown(items) : itemsToCSV(items);
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${items.length} item${items.length === 1 ? '' : 's'} copied as ${kind === 'markdown' ? 'Markdown' : 'CSV'}.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border, padding: s.lg, paddingTop: s.xl, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1 }}>⬇️ Import Hub</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Everything lands in your Inbox — matched items also attach directly</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 4 }}>
          <Ionicons name={hasKey ? 'key' : 'key-outline'} size={20} color={hasKey ? c.gold : c.text4} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

          {!hasKey && (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.goldLight, borderRadius: r.md, padding: s.md, marginBottom: s.lg, borderWidth: 0.5, borderColor: c.gold + '55' }}>
              <Ionicons name="information-circle-outline" size={16} color={c.gold} />
              <Text style={{ flex: 1, fontSize: 11, color: c.gold }}>
                Using the app's shared AI. Add your own Anthropic key in Settings for faster, unlimited imports.
              </Text>
            </TouchableOpacity>
          )}

          {/* ── 1. Paste input ── */}
          <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.sm }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Paste your stuff</Text>
              <TouchableOpacity onPress={pasteFromClipboard} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: s.sm, paddingVertical: 4 }}>
                <Ionicons name="clipboard-outline" size={13} color={c.teal} />
                <Text style={{ fontSize: 11, color: c.teal, fontWeight: '700' }}>Paste from clipboard</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={pasteText}
              onChangeText={setPasteText}
              placeholder={'Drop in raw URLs, "site.com - what it does" one per line, a browser bookmarks export, a markdown list, CSV, tab dumps — whatever you\'ve got.'}
              placeholderTextColor={c.text4}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 140, maxHeight: 260, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
            />
            {pasteText.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.mono, color: willUseAI ? c.gold : c.teal }}>
                  {format === 'auto' ? `Detected: ${FORMAT_LABEL[detected]}` : `Format: ${FORMAT_LABEL[detected] || detected}`}
                  {willUseAI ? ' · uses AI' : ' · parses instantly, no AI'}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: FONTS.mono, color: c.text4 }}>{pasteText.length.toLocaleString()} chars</Text>
              </View>
            )}
          </View>

          {/* ── 2. Format selector ── */}
          <View style={{ marginBottom: s.lg }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: c.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Format</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s.sm }}>
              {FORMATS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFormat(f.key)}
                  style={{
                    paddingHorizontal: s.md, paddingVertical: 8, borderRadius: r.full,
                    backgroundColor: format === f.key ? c.teal : c.bg1,
                    borderWidth: 1, borderColor: format === f.key ? c.teal : c.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: format === f.key ? '#fff' : c.text3 }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── 3. Analyze / Parse ── */}
          <TouchableOpacity
            onPress={analyze}
            disabled={analyzing || !pasteText.trim()}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm,
              backgroundColor: willUseAI ? c.gold : c.teal, borderRadius: r.lg, paddingVertical: s.md,
              opacity: (analyzing || !pasteText.trim()) ? 0.5 : 1, marginBottom: s.xl,
            }}
          >
            {analyzing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name={willUseAI ? 'sparkles' : 'flash'} size={16} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>
              {analyzing ? 'Analyzing…' : willUseAI ? 'Analyze with AI' : 'Parse'}
            </Text>
          </TouchableOpacity>

          {/* ── 4. Preview list ── */}
          {items.length > 0 && (
            <View style={{ marginBottom: s.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.sm, flexWrap: 'wrap', rowGap: 6 }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>
                  {items.length} item{items.length === 1 ? '' : 's'} · {selectedItems.length} selected
                  {dupSkipped > 0 ? ` · ${dupSkipped} repeat link${dupSkipped === 1 ? '' : 's'} skipped` : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: s.md, alignItems: 'center' }}>
                  <TouchableOpacity onPress={enrich} disabled={enriching} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {enriching ? <ActivityIndicator size="small" color={c.gold} /> : <Ionicons name="sparkles-outline" size={13} color={c.gold} />}
                    <Text style={{ fontSize: 12, color: c.gold, fontWeight: '700' }}>{enriching ? 'Enriching…' : 'Enrich with AI'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAll(true)}><Text style={{ fontSize: 12, color: c.teal, fontWeight: '700' }}>Select all</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setAll(false)}><Text style={{ fontSize: 12, color: c.text4, fontWeight: '700' }}>Deselect all</Text></TouchableOpacity>
                </View>
              </View>

              {items.map(item => {
                const typeMeta = TYPE_MAP[item.type];
                const areaMeta = item.lifeArea ? LIFE_AREA_MAP[item.lifeArea] : null;
                return (
                  <View key={item.localId} style={{
                    flexDirection: 'row', gap: s.sm,
                    backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm,
                    borderWidth: 0.5, borderColor: item.isDupe ? c.warning : c.border,
                    opacity: item.selected ? 1 : 0.55,
                  }}>
                    <TouchableOpacity onPress={() => toggleItem(item.localId)} style={{ paddingTop: 2 }}>
                      <Ionicons name={item.selected ? 'checkbox' : 'square-outline'} size={20} color={item.selected ? c.teal : c.text4} />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      {editingId === item.localId ? (
                        <TextInput
                          value={item.title}
                          onChangeText={(v) => updateTitle(item.localId, v)}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          style={{ fontSize: t.sm, fontWeight: '700', color: c.text1, borderBottomWidth: 1, borderBottomColor: c.teal, paddingVertical: 2 }}
                        />
                      ) : (
                        <TouchableOpacity onPress={() => setEditingId(item.localId)}>
                          <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }} numberOfLines={2}>{item.title}</Text>
                        </TouchableOpacity>
                      )}

                      {item.url ? (
                        <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                          <Text style={{ fontSize: 11, color: c.teal, marginTop: 2, textDecorationLine: 'underline' }} numberOfLines={1}>{item.url}</Text>
                        </TouchableOpacity>
                      ) : null}
                      {item.description ? (
                        <Text style={{ fontSize: 11, color: c.text3, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
                      ) : null}

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6, alignItems: 'center' }}>
                        {typeMeta && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: typeMeta.color + '22', borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Ionicons name={typeMeta.icon} size={10} color={typeMeta.color} />
                            <Text style={{ fontSize: 9, fontWeight: '700', color: typeMeta.color }}>{typeMeta.label}</Text>
                          </View>
                        )}
                        {item.matchLabel && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.teal + '22', borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Ionicons name={item.matchType === 'project' ? 'folder-open-outline' : 'leaf-outline'} size={10} color={c.teal} />
                            <Text style={{ fontSize: 9, fontWeight: '700', color: c.teal }} numberOfLines={1}>{item.matchLabel}</Text>
                          </View>
                        )}
                        {areaMeta && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: (areaMeta.color || c.gold) + '22', borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10 }}>{areaMeta.emoji}</Text>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: areaMeta.color || c.gold }}>{areaMeta.label}</Text>
                          </View>
                        )}
                        {item.isDupe && (
                          <View style={{ backgroundColor: c.warningLight, borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: c.warning }}>Already saved</Text>
                          </View>
                        )}
                        {item.tags.map(tg => (
                          <View key={tg} style={{ backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, color: c.text4 }}>#{tg}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── 5. Import ── */}
          {items.length > 0 && (
            <View style={{ marginBottom: s.xl }}>
              <TouchableOpacity
                onPress={runImport}
                disabled={importing || selectedItems.length === 0}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm,
                  backgroundColor: c.teal, borderRadius: r.lg, paddingVertical: s.md,
                  opacity: (importing || selectedItems.length === 0) ? 0.5 : 1,
                }}
              >
                {importing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="download-outline" size={16} color="#fff" />}
                <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>
                  {importing
                    ? `Saving ${importProgress.done} of ${importProgress.total}…`
                    : `Import ${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'}`}
                </Text>
              </TouchableOpacity>

              {summary && (
                <View style={{ marginTop: s.md, backgroundColor: c.successLight, borderRadius: r.md, padding: s.md, alignItems: 'center' }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.success, marginBottom: 2 }}>
                    ✅ Saved {summary.saved} item{summary.saved === 1 ? '' : 's'} to your Inbox
                  </Text>
                  {summary.attached > 0 && (
                    <Text style={{ fontSize: 11, color: c.success, marginBottom: 2 }}>
                      {summary.attached} attached directly to a project or life area
                    </Text>
                  )}
                  {summary.skipped > 0 && (
                    <Text style={{ fontSize: 11, color: c.error }}>{summary.skipped} failed to save</Text>
                  )}
                  <TouchableOpacity onPress={() => navigation.navigate('CaptureInbox')} style={{ marginTop: s.sm }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Go to Inbox →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── 6. Export ── */}
          {items.length > 0 && (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>Export instead</Text>
              <Text style={{ fontSize: 11, color: c.text3, marginBottom: s.md }}>Copies all {items.length} parsed item{items.length === 1 ? '' : 's'} to your clipboard.</Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                <TouchableOpacity onPress={() => exportAs('markdown')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.bg2, borderRadius: r.md, paddingVertical: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                  <Ionicons name="document-text-outline" size={14} color={c.text2} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.text2 }}>Markdown</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => exportAs('csv')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.bg2, borderRadius: r.md, paddingVertical: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                  <Ionicons name="grid-outline" size={14} color={c.text2} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.text2 }}>CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
