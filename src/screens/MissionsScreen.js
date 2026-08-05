// src/screens/MissionsScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import MissionCard from '../components/MissionCard';

const TABS = [
  { key: 'daily',    label: 'Daily',        emoji: '⚔️' },
  { key: 'weekly',   label: 'Weekly',       emoji: '📅' },
  { key: 'longterm', label: 'Achievements', emoji: '🏆' },
];

const EMPTY = {
  daily:    { emoji: '⚔️', title: 'No active quests', sub: 'Daily missions reset at midnight.' },
  weekly:   { emoji: '📅', title: 'No weekly quests',  sub: 'Keep playing to unlock weekly challenges.' },
  longterm: { emoji: '🏆', title: 'No achievements',   sub: 'Complete missions to earn achievement badges.' },
};

export default function MissionsScreen({ onClose, initialTab = 'daily' }) {
  const {
    dailyMissions, weeklyMissions, longtermMissions,
    loading, refreshDailyMissions, refreshWeeklyMissions,
  } = useUserProgress();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const styles = makeStyles(c, t, s, r);

  const getMissions = () => ({
    daily: dailyMissions || [],
    weekly: weeklyMissions || [],
    longterm: longtermMissions || [],
  }[activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'daily') await refreshDailyMissions();
      else if (activeTab === 'weekly') await refreshWeeklyMissions();
    } catch {}
    setRefreshing(false);
  };

  const missions = getMissions();
  const empty = EMPTY[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Missions</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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
          <Text style={styles.loadingText}>Loading quests...</Text>
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
            missions.map(m => (
              <MissionCard key={m.id} mission={m} onPress={() => {}} />
            ))
          )}
        </ScrollView>
      )}

      {/* Footer hint */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {activeTab === 'daily'
            ? '✦ Daily quests reset at midnight'
            : activeTab === 'weekly'
            ? '✦ Weekly quests reset each Sunday'
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
