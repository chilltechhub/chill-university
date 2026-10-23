// src/components/CalmLibrary.js
// The Library's Calm view, its own switch (SETTING_KEYS.LIBRARY_VIEW, synced)
// apart from Home's. Each page keeps its tab and gets one dark panel: the one
// thing that matters on that page, two real numbers, then what the page holds
// as a short list. "All tools" goes back to the full Library.
//
//   Life       the area most overdue for a check-in · today's left · check-ins due
//   Build      the project you touched last · active · finished this month
//   Knowledge  what's waiting in the Inbox · Vault · Idea Garden
//   Make       (new tabs) as Build, then everything Make holds as the list
//
// Every number comes from the rows the full Library already loads, plus two
// counts of its own (Inbox, ideas): the Library only keeps the newest few.

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/profileScopedClient';
import { todayStr } from '../logic/dateUtils';
import LevelRing from './LevelRing';
import LockBadge from './LockBadge';
import { useCalmPalette, CalmPanel, CalmHeadline, CalmPill, CalmTiles, CalmShowAll, calmEyebrow, plural, ago } from './CalmKit';

const CHECKIN_DUE_DAYS = 7; // same as LibraryScreen

export default function CalmLibrary({
  tab, userId,
  areaStats = [], todayAgenda = [],
  activeProjects = [], trophies = [],
  vaultCount = 0, recentCaptures = [], gardenIdeas = [],
  tools = [],
  canOpen = () => true, captureShown = true, showEmojis = false,
  onOpenArea, onOpenTool, onNavigate, onShowAll,
}) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  const pal = useCalmPalette();

  // Knowledge only: how many are waiting in the Inbox, and how many ideas.
  const [counts, setCounts] = useState(null);
  useFocusEffect(useCallback(() => {
    if (tab !== 'knowledge' || !userId) return undefined;
    let alive = true;
    Promise.all([
      supabase.from('captures').select('id, title', { count: 'exact' })
        .eq('user_id', userId).eq('status', 'inbox').is('deleted_at', null)
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('garden_cores').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).is('deleted_at', null),
    ]).then(([inbox, ideas]) => {
      if (alive) setCounts({ inbox: inbox.count || 0, inboxNewest: inbox.data?.[0]?.title || null, ideas: ideas.count || 0 });
    }).catch(() => { if (alive) setCounts({ inbox: 0, inboxNewest: null, ideas: 0 }); });
    return () => { alive = false; };
  }, [tab, userId]));

  let head = null;      // { label, title, sub, onPress, pill }
  let tiles = [];

  if (tab === 'domains') {
    // Never rated first, then the longest since a check-in.
    const due = areaStats
      .filter(x => x.days === null || x.days >= CHECKIN_DUE_DAYS)
      .sort((a, b) => (a.days === null ? -1 : b.days === null ? 1 : b.days - a.days));
    const first = due[0];
    head = first
      ? {
        label: first.days === null ? 'Check in · not rated yet' : `Check in · ${first.days}d since the last one`,
        title: first.area.label,
        onPress: () => onOpenArea?.(first.area, first.saved, first.rating),
        pill: { label: 'Rate it', icon: 'arrow-forward' },
      }
      : { label: 'Life areas', title: 'All checked in this week.' };
    // Today's list carries late deadlines too. Counted apart, so this card
    // and Home's "Nothing planned today" don't seem to disagree.
    const late = todayAgenda.filter(x => x._due && x._due.date < todayStr()).length;
    const forToday = todayAgenda.filter(x => !(x._due && x._due.date < todayStr()));
    tiles = [
      {
        key: 'today', label: 'Today', screen: 'PlannerScreen',
        value: String(forToday.length),
        unit: 'left today',
        sub: late ? `+${late} late` : forToday[0] ? forToday[0].title : 'All clear',
        warn: late > 0,
      },
      {
        key: 'checkins', label: 'Check-ins', screen: 'LifeAreaScreen',
        value: String(due.length),
        unit: plural(due.length, 'area due', 'areas due'),
        sub: due.length ? due.slice(0, 2).map(x => x.area.label).join(', ') : 'All current',
        open: first ? () => onOpenArea?.(first.area, first.saved, first.rating) : undefined,
      },
    ];
  // Make (the new tabs, shake-up P4) leads with the project, like Build did.
  } else if (tab === 'build' || tab === 'make') {
    const current = activeProjects.slice().sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))[0];
    head = current
      ? {
        label: 'Working on',
        title: current.title,
        sub: current.next_action ? `Next: ${current.next_action}` : 'No next step set',
        onPress: () => onNavigate?.('ProjectDetail', { project: current }),
        pill: { label: 'Open', icon: 'arrow-forward' },
      }
      : tab === 'make' && !canOpen('ProjectsScreen')
        // Make, before projects open: the Studio makes the first thing with you.
        ? {
          label: 'Make', title: 'Make one thing today.',
          sub: 'A page, a game, a beat or a business.',
          onPress: () => onNavigate?.('StudioScreen'),
          pill: { label: 'Make something', icon: 'color-wand-outline', solid: true },
        }
        : {
          label: tab === 'make' ? 'Make' : 'Build', title: 'Start something.',
          sub: 'An idea with a first step is enough.',
          onPress: () => onNavigate?.('ProjectsScreen', { autoOpen: true }),
          pill: { label: 'Start a project', icon: 'add', solid: true },
        };
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = trophies.filter(p => String(p.updated_at || '').startsWith(monthKey)).length;
    const others = activeProjects.length - (current ? 1 : 0);
    tiles = [
      {
        key: 'active', label: 'Projects', screen: 'ProjectsScreen',
        value: String(activeProjects.length),
        unit: plural(activeProjects.length, 'active project', 'active projects'),
        sub: others > 0 ? `+${others} besides this one` : activeProjects.length ? 'Just this one' : 'Start one →',
      },
      {
        key: 'finished', label: 'Finished', screen: 'PortfolioScreen',
        value: String(thisMonth),
        unit: 'this month',
        sub: `${trophies.length} all time`,
      },
    ];
  } else if (tab === 'knowledge') {
    const inbox = counts?.inbox;
    head = captureShown
      ? {
        label: 'Inbox',
        title: inbox == null ? '…' : inbox ? `${inbox} to sort` : 'All sorted.',
        sub: inbox ? `Newest: ${counts.inboxNewest || 'Untitled'}` : 'Capture anything. Sort it later.',
        onPress: () => onNavigate?.('CaptureInbox'),
        pill: inbox ? { label: 'Sort them', icon: 'arrow-forward', solid: true } : { label: 'Capture', icon: 'create-outline' },
      }
      : recentCaptures[0]
        ? { label: 'Newest in your vault', title: recentCaptures[0].title || 'Untitled', onPress: () => onNavigate?.('KnowledgeScreen'), pill: { label: 'Open', icon: 'arrow-forward' } }
        : { label: 'Knowledge', title: 'Save what you learn.' };
    tiles = [
      {
        key: 'vault', label: 'Vault', screen: 'KnowledgeScreen',
        value: String(vaultCount),
        unit: 'saved',
        sub: recentCaptures[0] ? `${recentCaptures[0].title || 'Untitled'} · ${ago(recentCaptures[0].created_at)}` : 'Nothing saved yet',
      },
      {
        key: 'ideas', label: 'Ideas', screen: 'IdeaGardenScreen',
        value: counts ? String(counts.ideas) : '…',
        unit: plural(counts?.ideas, 'idea growing', 'ideas growing'),
        sub: gardenIdeas[0]?.title || 'Plant one →',
      },
    ];
  }
  tiles = tiles.filter(tl => !tl.screen || canOpen(tl.screen));

  const card = { backgroundColor: c.bg1, borderRadius: 22, borderWidth: 0.5, borderColor: c.border, marginTop: s.md, overflow: 'hidden' };
  const listHead = { ...calmEyebrow, color: c.text3, paddingHorizontal: s.md, paddingTop: s.md, paddingBottom: 4 };

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: s.sm }}>
      <CalmPanel id={`calmLibrary-${tab}`} pal={pal}>
        {head && (
          <>
            <CalmHeadline pal={pal} label={head.label} title={head.title} sub={head.sub} onPress={head.onPress}
              style={{ marginTop: s.sm, marginBottom: head.pill ? s.md : 0 }} />
            {head.pill && (
              <View style={{ flexDirection: 'row' }}>
                <CalmPill pal={pal} label={head.pill.label} icon={head.pill.icon} solid={head.pill.solid} onPress={head.onPress} />
              </View>
            )}
          </>
        )}
        {tiles.length > 0 && <View style={{ marginTop: s.sm }}><CalmTiles tiles={tiles} pal={pal} onOpenScreen={(scr) => onNavigate?.(scr)} /></View>}
      </CalmPanel>

      {/* Life: your areas as small rings. Build / Knowledge: the page's tools. */}
      {tab === 'domains' ? (
        areaStats.length > 0 && (
          <View style={card}>
            <Text style={listHead}>Your areas</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: s.sm, paddingBottom: s.sm }}>
              {areaStats.map(({ area, saved, rating }) => (
                <TouchableOpacity key={area.id} onPress={() => onOpenArea?.(area, saved, rating)} activeOpacity={0.8}
                  accessibilityRole="button" accessibilityLabel={`${area.label}, ${rating ? `rated ${rating} of 5` : 'not rated yet'}`}
                  style={{ width: '25%', alignItems: 'center', paddingVertical: 8 }}>
                  <LevelRing pct={(rating / 5) * 100} size={44} strokeWidth={3} color={area.color || accent.primary} trackColor={c.bg2}>
                    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      {showEmojis
                        ? <Text style={{ fontSize: 16 }}>{area.emoji}</Text>
                        : <Ionicons name={area.icon} size={16} color={area.color || accent.primary} />}
                    </View>
                  </LevelRing>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.text2, marginTop: 4 }} numberOfLines={1}>{area.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      ) : (
        tools.length > 0 && (
          <View style={card}>
            <Text style={listHead}>Tools</Text>
            {tools.map((entry, i) => {
              const { item, access } = entry;
              const open = access ? access.available : true;
              return (
                <TouchableOpacity key={item.screen} onPress={() => onOpenTool?.(entry)} activeOpacity={0.75}
                  accessibilityRole="button" accessibilityLabel={`${item.label}${open ? '' : ', locked'}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.md, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
                  <Ionicons name={item.icon} size={18} color={open ? accent.primary : c.text4} />
                  <Text style={{ flex: 1, fontSize: t.sm, fontWeight: '700', color: open ? c.text1 : c.text3 }} numberOfLines={1}>{item.label}</Text>
                  {access && !open
                    ? <LockBadge access={access} size="xs" showLabel={false} />
                    : <Ionicons name="chevron-forward" size={14} color={c.text4} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )
      )}

      <CalmShowAll label="All tools" a11y="Show the full Library" onPress={onShowAll} />
    </View>
  );
}
