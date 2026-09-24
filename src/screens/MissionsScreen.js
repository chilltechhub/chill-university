// src/screens/MissionsScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import MissionCard from '../components/MissionCard';
import useDrillPlan from '../logic/useDrillPlan';

const TABS = [
  { key: 'daily',    label: 'Daily drills', emoji: '⚔️' },
  { key: 'weekly',   label: 'This week',    emoji: '📅' },
  { key: 'longterm', label: 'Achievements', emoji: '🏆' },
];

const EMPTY = {
  daily:    { emoji: '⚔️', title: 'No drills yet today', sub: "Today's three appear the next time the app loads. They reset at midnight." },
  weekly:   { emoji: '📅', title: 'No weekly challenges',  sub: 'New ones start each week.' },
  longterm: { emoji: '🏆', title: 'No achievements yet',   sub: 'Complete objectives to earn achievement badges.' },
};

// Active missions closest to completion float to the top (most motivating);
// completed ones sink to the bottom so they still confirm the win without
// crowding out what's left to do.
function sortMissions(missions) {
  return [...missions].sort((a, b) => {
    const doneA = a.status === 'completed' || a.status === 'claimed';
    const doneB = b.status === 'completed' || b.status === 'claimed';
    if (doneA !== doneB) return doneA ? 1 : -1;
    const pctA = a.target > 0 ? a.progress / a.target : 0;
    const pctB = b.target > 0 ? b.progress / b.target : 0;
    return pctB - pctA;
  });
}

// `onPlay(gameId)` opens a game that counts toward a drill; the caller
// closes this sheet and navigates (GamesScreen shows it in a Modal).
export default function MissionsScreen({ onClose, initialTab = 'daily', onPlay }) {
  const {
    dailyMissions, weeklyMissions, longtermMissions,
    loading, refreshDailyMissions, refreshWeeklyMissions,
  } = useUserProgress();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const styles = makeStyles(c, t, s, r);
  // The sheet is a full-screen Modal. A SafeAreaView inside a Modal doesn't
  // reliably get the status-bar inset, which left the close X up under the
  // clock; the header takes the real inset itself instead.
  const insets = useSafeAreaInsets();

  const rawMissions = {
    daily: dailyMissions || [],
    weekly: weeklyMissions || [],
    longterm: longtermMissions || [],
  }[activeTab];

  // Daily drills come as a plan (src/logic/useDrillPlan.js): how to do each,
  // the game to open, and which one is up next, which goes first.
  const plan = useDrillPlan();
  const missions = useMemo(() => {
    if (activeTab !== 'daily') return sortMissions(rawMissions);
    const byId = Object.fromEntries(plan.drills.map(d => [d.id, d]));
    return sortMissions(rawMissions)
      .map(m => byId[m.id] || m)
      .sort((a, b) => (b.upNext ? 1 : 0) - (a.upNext ? 1 : 0));
  }, [rawMissions, activeTab, plan]);
  const completedCount = missions.filter(m => m.status === 'completed' || m.status === 'claimed').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'daily') await refreshDailyMissions();
      else if (activeTab === 'weekly') await refreshWeeklyMissions();
    } catch {}
    setRefreshing(false);
  };

  const empty = EMPTY[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + s.md }]}>
        <Text style={styles.title}>{activeTab === 'daily' ? 'Daily drills' : activeTab === 'weekly' ? 'Weekly challenges' : 'Achievements'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={22} color={c.text3} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.teal} />
          <Text style={styles.loadingText}>Loading objectives...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.teal}
            />
          }
        >
          {missions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>{empty.emoji}</Text>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptySub}>{empty.sub}</Text>
            </View>
          ) : (
            <>
              {activeTab === 'weekly' && (
                <Text style={styles.intro}>
                  Bigger targets that run all week. Daily drills are today's three small ones; these add up
                  over several days of playing.
                </Text>
              )}
              {activeTab === 'daily' && (
                <Text style={styles.intro}>
                  Three small targets for today. Every game you play counts toward them on its own, no
                  need to open this first. Finishing one also ticks any goal step that asks for a daily drill.
                </Text>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  {completedCount} of {missions.length} complete
                </Text>
                <View style={styles.summaryBarBg}>
                  <View style={[styles.summaryBarFill, {
                    width: `${missions.length ? (completedCount / missions.length) * 100 : 0}%`,
                  }]} />
                </View>
              </View>
              {missions.map(m => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  onPress={() => {}}
                  how={m.how}
                  upNext={!!m.upNext}
                  onPlay={activeTab === 'daily' && onPlay && m.playGameId ? () => onPlay(m.playGameId) : undefined}
                  playLabel={m.games?.length === 1 ? `Play ${m.games[0].title}` : 'Play'}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Footer hint */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {activeTab === 'daily'
            ? '✦ New drills every day at midnight'
            : activeTab === 'weekly'
            ? '✦ Weekly challenges reset each Sunday'
            : '✦ Achievements are earned through dedication'}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: s.lg, paddingTop: s.xl,
    backgroundColor: c.bg0, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  title: { fontSize: t.xxl, fontWeight: t.bold, color: c.text1 },
  closeBtn: { padding: s.sm },
  tabsRow: {
    flexDirection: 'row', backgroundColor: c.bg0,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: s.md,
    position: 'relative',
  },
  tabActive: {},
  tabEmoji: { fontSize: t.lg, marginBottom: 2 },
  tabLabel: { fontSize: t.xs, fontWeight: t.semibold, color: c.text3 },
  tabLabelActive: { color: c.teal },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: '10%', right: '10%',
    height: 2, backgroundColor: c.teal, borderRadius: 1,
  },
  content: { padding: s.lg, paddingBottom: s.xxxl },
  summaryRow: { marginBottom: s.lg },
  intro: { fontSize: t.sm, color: c.text2, lineHeight: 19, marginBottom: s.lg },
  summaryText: { fontSize: t.xs, color: c.text3, fontWeight: t.semibold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  summaryBarBg: { height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden' },
  summaryBarFill: { height: 5, borderRadius: 3, backgroundColor: c.teal },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl },
  loadingText: { marginTop: s.md, fontSize: t.sm, color: c.text3 },
  emptyWrap: { alignItems: 'center', paddingTop: s.xxxl * 2 },
  emptyEmoji: { fontSize: 52, marginBottom: s.lg },
  emptyTitle: { fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  emptySub: { fontSize: t.sm, color: c.text3, textAlign: 'center', paddingHorizontal: s.xl },
  footer: {
    backgroundColor: c.bg1, padding: s.md,
    borderTopWidth: 1, borderTopColor: c.border,
  },
  footerText: { fontSize: t.xs, color: c.teal, textAlign: 'center', fontWeight: t.medium },
});
