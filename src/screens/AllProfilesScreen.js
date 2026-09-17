// src/screens/AllProfilesScreen.js
// The master profile's cross-profile overview — vault progress, targets and
// last activity for every profile on the account, in one place.
//
// This is what "the first profile controls all" actually buys you: a founder
// running a day job, a night job and two startups can see where each one
// stands without switching into all four. Only reachable from the master
// profile (the switcher only offers it there, and this screen re-checks).
//
// Data comes from the get_profile_rollup() SQL function, which is scoped by
// auth.uid() and cannot return another account's rows.

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { getProfileRollup } from '../api/profileAccountsService';
import { getPersona } from '../data/personas';
import { FONTS } from '../theme';

// Which baseline key each type asks for during setup, and how to label it in
// the overview. Mirrors PERSONA_BASELINE in MultiStepOnboarding.
const BASELINE_LABEL = {
  habit_target:   'Habit',
  gpa_goal:       'GPA goal',
  revenue_target: 'Revenue target',
  venture_stage:  'Stage',
};

export default function AllProfilesScreen() {
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const navigation = useNavigation();
  const { xp, level, streakDays } = useUserProgress();
  const { isMasterActive, switchProfile, active } = useProfiles();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const st = makeStyles(c, t, s, r, sh);

  const load = useCallback(async () => {
    const data = await getProfileRollup();
    setRows(data);
    setLoading(false);
  }, []);

  // Re-pull on focus: coming back from a lesson that completed a vault
  // deliverable should show the new count, not a stale one.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const jumpTo = async (profileId) => {
    if (profileId === active?.id) { navigation.navigate('MainTabs'); return; }
    await switchProfile(profileId);
    navigation.navigate('MainTabs');
  };

  const totals = rows.reduce(
    (acc, row) => ({
      docs: acc.docs + Number(row.docs_total || 0),
      done: acc.done + Number(row.docs_complete || 0),
    }),
    { docs: 0, done: 0 },
  );

  return (
    <ScrollView
      style={st.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
    >
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{showEmojis ? '🗂️ ' : ''}All profiles</Text>
        {showSubtext && (
          <Text style={st.headerSub}>Every profile on this account, and where each one stands.</Text>
        )}
      </View>

      {/* Shared progression — one human, one level and streak, spanning every
          profile. Stated plainly here because the whole screen is otherwise
          about what's separate. */}
      <View style={st.sharedCard}>
        <Text style={st.sharedLabel}>Shared across all profiles</Text>
        <View style={st.sharedRow}>
          <View style={st.sharedStat}>
            <Text style={st.sharedNum}>{level}</Text>
            <Text style={st.sharedCap}>Level</Text>
          </View>
          <View style={st.sharedStat}>
            <Text style={st.sharedNum}>{(xp || 0).toLocaleString()}</Text>
            <Text style={st.sharedCap}>XP</Text>
          </View>
          <View style={st.sharedStat}>
            <Text style={st.sharedNum}>{streakDays || 0}</Text>
            <Text style={st.sharedCap}>Day streak</Text>
          </View>
          <View style={st.sharedStat}>
            <Text style={st.sharedNum}>{totals.done}/{totals.docs}</Text>
            <Text style={st.sharedCap}>Vault docs</Text>
          </View>
        </View>
      </View>

      {!isMasterActive && (
        <View style={st.notice}>
          <Ionicons name="information-circle-outline" size={16} color={c.text3} />
          <Text style={st.noticeText}>
            You're viewing this from a non-master profile. Switch to your master profile to manage the others.
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={c.teal} />
      ) : rows.length === 0 ? (
        <Text style={st.empty}>No profiles yet. Add one from the header switcher.</Text>
      ) : (
        rows.map(row => {
          const def = getPersona(row.type);
          const total = Number(row.docs_total || 0);
          const done = Number(row.docs_complete || 0);
          const pct = total ? Math.round((done / total) * 100) : 0;
          const baselineEntries = Object.entries(row.baseline || {});
          const isActive = row.profile_id === active?.id;

          return (
            <TouchableOpacity
              key={row.profile_id}
              activeOpacity={0.85}
              onPress={() => jumpTo(row.profile_id)}
              style={[st.card, { borderLeftColor: def.color }]}
            >
              <View style={st.cardHead}>
                {showEmojis && <Text style={st.cardEmoji}>{row.emoji || def.emoji}</Text>}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={st.cardName} numberOfLines={1}>{row.name}</Text>
                    {row.is_master && (
                      <View style={[st.tag, { borderColor: def.color }]}>
                        <Text style={[st.tagText, { color: def.color }]}>MASTER</Text>
                      </View>
                    )}
                    {isActive && (
                      <View style={[st.tag, { borderColor: c.teal }]}>
                        <Text style={[st.tagText, { color: c.teal }]}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[st.cardType, { color: def.color }]}>{def.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.text4} />
              </View>

              {baselineEntries.length > 0 && (
                <View style={st.baselineRow}>
                  {baselineEntries.map(([k, v]) => (
                    <View key={k} style={st.baselineChip}>
                      <Text style={st.baselineKey}>{BASELINE_LABEL[k] || k}</Text>
                      <Text style={st.baselineVal} numberOfLines={1}>{String(v)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Real content counts, not just vault docs — what actually
                  lives in this profile. Added by
                  20260910160000_scope_content_to_profiles.sql. */}
              <View style={st.countRow}>
                <View style={st.countChip}>
                  <Ionicons name="hammer-outline" size={12} color={c.text4} />
                  <Text style={st.countText}>{Number(row.projects_count || 0)} projects</Text>
                </View>
                <View style={st.countChip}>
                  <Ionicons name="checkbox-outline" size={12} color={c.text4} />
                  <Text style={st.countText}>{Number(row.tasks_count || 0)} tasks</Text>
                </View>
              </View>

              <View style={st.progressRow}>
                <Text style={st.progressLabel}>
                  Vault {done}/{total}{total === 0 ? ' — nothing saved yet' : ''}
                </Text>
                <Text style={[st.progressPct, { color: def.color }]}>{pct}%</Text>
              </View>
              <View style={st.barBg}>
                <View style={[st.barFill, { width: `${pct}%`, backgroundColor: def.color }]} />
              </View>

              {row.last_activity && (
                <Text style={st.lastSeen}>
                  Last activity {new Date(row.last_activity).toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  header: { paddingHorizontal: s.lg, paddingTop: s.lg, paddingBottom: s.sm },
  headerTitle: { fontSize: 24, fontFamily: FONTS.display, fontWeight: '800', color: c.text1 },
  headerSub: { fontSize: 13, color: c.text3, marginTop: 4 },

  sharedCard: {
    marginHorizontal: s.lg, marginBottom: s.md, padding: s.md,
    borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border,
  },
  sharedLabel: {
    fontSize: 10, color: c.text4, fontFamily: FONTS.mono,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  sharedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sharedStat: { alignItems: 'center', flex: 1 },
  sharedNum: { fontSize: 17, fontWeight: '800', color: c.gold, fontFamily: FONTS.mono },
  sharedCap: { fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 },

  notice: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: s.lg, marginBottom: s.md, padding: s.md,
    borderRadius: r.md, backgroundColor: c.bg2,
  },
  noticeText: { flex: 1, fontSize: 12, color: c.text3, lineHeight: 17 },

  empty: { textAlign: 'center', color: c.text4, fontSize: 13, marginTop: 30 },

  card: {
    marginHorizontal: s.lg, marginBottom: s.sm, padding: s.md,
    borderRadius: r.lg, backgroundColor: c.bg1,
    borderWidth: 1, borderColor: c.border, borderLeftWidth: 3,
    ...sh.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardEmoji: { fontSize: 22 },
  cardName: { fontSize: 15, fontWeight: '700', color: c.text1, flexShrink: 1 },
  cardType: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  tag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  tagText: { fontSize: 8, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5 },

  baselineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  baselineChip: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    backgroundColor: c.bg0, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  baselineKey: { fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5 },
  baselineVal: { fontSize: 11, color: c.text2, fontWeight: '600', maxWidth: 120 },

  countRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  countChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.bg0, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  countText: { fontSize: 11, color: c.text3 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 5 },
  progressLabel: { fontSize: 11, color: c.text3 },
  progressPct: { fontSize: 11, fontWeight: '800', fontFamily: FONTS.mono },
  barBg: { height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },

  lastSeen: { fontSize: 10, color: c.text4, marginTop: 7 },
});
