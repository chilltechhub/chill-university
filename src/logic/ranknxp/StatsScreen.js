// src/screens/StatsScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useUserProgress, SUBJECT_CONFIG } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';

export default function StatsScreen() {
  const { loading, profile, points, xp, level, rank, rankProgress, subjectProgress, dailyMissions, weeklyMissions, longtermMissions, gameplayStats } = useUserProgress();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={c.teal} />
      <Text style={styles.loadingText}>Loading your chronicles...</Text>
    </View>
  );

  const { totalProblemsAttempted = 0, totalProblemsCorrect = 0, fastestTime = null, avgTime = null, levelsCompleted = 0 } = gameplayStats || {};
  const accuracy = totalProblemsAttempted > 0 ? ((totalProblemsCorrect / totalProblemsAttempted) * 100).toFixed(1) + '%' : '0%';

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroGlyph}>✦ · ✦</Text>
        <Text style={styles.heroName}>{profile?.display_name || 'Scholar'}</Text>
        <View style={styles.heroStats}>
          <HeroStat label="Points" value={points?.toLocaleString() || '0'} c={c} t={t} />
          <HeroStat label="Rank"   value={`#${rank}`}   c={c} t={t} />
          <HeroStat label="Level"  value={level || 1}   c={c} t={t} />
          <HeroStat label="Progress" value={`${Math.round(rankProgress || 0)}%`} c={c} t={t} color={c.teal} />
        </View>
      </View>

      <Section title="📊 Gameplay" styles={styles} c={c} t={t}>
        <StatRow label="Attempted"    value={totalProblemsAttempted} styles={styles} c={c} t={t} />
        <StatRow label="Correct"      value={totalProblemsCorrect}   styles={styles} c={c} t={t} />
        <StatRow label="Accuracy"     value={accuracy}               styles={styles} c={c} t={t} highlight />
        <StatRow label="Fastest"      value={fastestTime != null ? `${fastestTime}s` : 'N/A'} styles={styles} c={c} t={t} />
        <StatRow label="Avg / problem" value={Number.isFinite(avgTime) ? `${avgTime.toFixed(1)}s` : 'N/A'} styles={styles} c={c} t={t} />
        <StatRow label="Games done"   value={levelsCompleted}        styles={styles} c={c} t={t} />
      </Section>

      <Section title="📚 Subject Progress" styles={styles} c={c} t={t}>
        {Object.keys(subjectProgress || {}).length === 0
          ? <Text style={styles.empty}>Start playing to build subject mastery!</Text>
          : Object.entries(subjectProgress).map(([subject, data]) => {
              const cfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
              const acc = data.questions_answered > 0 ? (data.correct_answers / data.questions_answered * 100) : 0;
              return (
                <View key={subject} style={styles.subjectCard}>
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectIcon}>{cfg.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{cfg.name}</Text>
                      <Text style={styles.subjectLevel}>Level {data.level || 1}</Text>
                    </View>
                    <Text style={[styles.subjectAcc, { color: c.teal }]}>{acc.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.xpBg}>
                    <View style={[styles.xpFill, { width: `${Math.min(data.xp % 100, 100)}%`, backgroundColor: cfg.color }]} />
                  </View>
                  <Text style={styles.xpText}>{data.xp || 0} XP</Text>
                </View>
              );
            })
        }
      </Section>

      <MissionSection title="⚔️ Daily Quests"   missions={dailyMissions}    styles={styles} c={c} t={t} />
      <MissionSection title="📅 Weekly Quests"  missions={weeklyMissions}   styles={styles} c={c} t={t} />
      <MissionSection title="🏆 Achievements"   missions={longtermMissions} styles={styles} c={c} t={t} />
    </ScrollView>
  );
}

function HeroStat({ label, value, c, t, color }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: t.bold, color: color || c.gold }}>{value}</Text>
      <Text style={{ fontSize: 10, color: c.text4, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
}

function Section({ title, children, styles, c, t }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function StatRow({ label, value, highlight, styles, c, t }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: c.teal }]}>{value}</Text>
    </View>
  );
}

function MissionSection({ title, missions = [], styles, c, t }) {
  return (
    <Section title={title} styles={styles} c={c} t={t}>
      {missions.length === 0
        ? <Text style={styles.empty}>No active quests</Text>
        : missions.map(m => {
            const pct = m.target > 0 ? (m.progress / m.target) * 100 : 0;
            const done = m.status === 'completed';
            return (
              <View key={m.id} style={styles.missionRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missionTitle}>{m.title}</Text>
                    <Text style={styles.missionProg}>{m.progress}/{m.target}</Text>
                  </View>
                  {done && <Text style={{ color: c.teal, fontSize: 16 }}>✓</Text>}
                </View>
                <View style={styles.mBarBg}>
                  <View style={[styles.mBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: done ? c.teal : c.gold }]} />
                </View>
              </View>
            );
          })
      }
    </Section>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  scroll: { padding: s.lg, paddingBottom: 120, backgroundColor: c.bg0 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg0 },
  loadingText: { marginTop: s.md, color: c.text3, fontSize: t.sm },
  hero: {
    backgroundColor: c.bg1, borderRadius: r.xl, padding: s.xl,
    marginBottom: s.lg, borderWidth: 0.5, borderColor: c.border, alignItems: 'center',
  },
  heroGlyph: { fontSize: t.xs, color: c.gold, letterSpacing: 8, marginBottom: s.sm },
  heroName: { fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: s.lg },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  section: { marginBottom: s.lg },
  sectionTitle: { fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  card: { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border },
  empty: { color: c.text4, textAlign: 'center', paddingVertical: s.lg, fontSize: t.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: s.sm, borderBottomWidth: 0.5, borderBottomColor: c.border },
  statLabel: { fontSize: t.sm, color: c.text3 },
  statValue: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1 },
  subjectCard: { backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: s.sm },
  subjectIcon: { fontSize: 24, marginRight: s.sm },
  subjectName: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1 },
  subjectLevel: { fontSize: t.xs, color: c.text3 },
  subjectAcc: { fontSize: t.sm, fontWeight: t.bold },
  xpBg: { height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  xpFill: { height: 4, borderRadius: 2 },
  xpText: { fontSize: 10, color: c.text4 },
  missionRow: { marginBottom: s.md },
  missionTitle: { fontSize: t.sm, fontWeight: t.medium, color: c.text1 },
  missionProg: { fontSize: t.xs, color: c.text3, marginTop: 2 },
  mBarBg: { height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' },
  mBarFill: { height: 4, borderRadius: 2 },
});
