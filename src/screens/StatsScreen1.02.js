import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useUserProgress, SUBJECT_CONFIG } from '../../context/UserProgressContext';
import { colors, typography } from '../theme';

export default function StatsScreen() {
  const {
    loading,
    profile,
    points,
    xp,
    level,
    rank,
    rankProgress,
    subjectProgress,
    dailyMissions,
    weeklyMissions,
    longtermMissions,
    gameplayStats,
  } = useUserProgress();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  /* ================================
     GAMEPLAY STATS
  ================================ */

  const {
    timePerGame = {},
    totalProblemsAttempted = 0,
    totalProblemsCorrect = 0,
    fastestTime = null,
    avgTime = null,
    levelsCompleted = 0,
  } = gameplayStats || {};

  const accuracy =
    totalProblemsAttempted > 0
      ? ((totalProblemsCorrect / totalProblemsAttempted) * 100).toFixed(2) + '%'
      : '0%';

  const timeEntries = Object.entries(timePerGame);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ================================
          USER OVERVIEW
      ================================ */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>
          {profile?.display_name || 'Player'}
        </Text>

        <View style={styles.headerStats}>
          <HeaderStat label="Points" value={points.toLocaleString()} />
          <HeaderStat label="Rank" value={`#${rank}`} />
          <HeaderStat label="Level" value={level} />
          <HeaderStat label="Rank Progress" value={`${Number(rankProgress || 0).toFixed(0)}%`} />
        </View>
      </View>

      {/* ================================
          GAMEPLAY STATS
      ================================ */}
      <Section title="📊 Gameplay Stats">
        <StatRow label="Problems Attempted" value={totalProblemsAttempted} />
        <StatRow label="Problems Correct" value={totalProblemsCorrect} />
        <StatRow label="Accuracy" value={accuracy} highlight />
        <StatRow
          label="Fastest Session"
          value={fastestTime != null ? `${fastestTime}s` : 'N/A'}
        />
        <StatRow
          label="Avg Time / Problem"
          value={
  Number.isFinite(avgTime)
    ? `${avgTime.toFixed(2)}s`
    : 'N/A'
}

        />
        <StatRow label="Games Completed" value={levelsCompleted} />
      </Section>

      {/* ================================
          TIME PER GAME
      ================================ */}
      {timeEntries.length > 0 && (
        <Section title="⏱️ Time Per Game">
          {timeEntries.map(([gameId, seconds]) => {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return (
              <StatRow
                key={gameId}
                label={gameId}
                value={`${minutes}m ${secs}s`}
              />
            );
          })}
        </Section>
      )}

      {/* ================================
          SUBJECT PROGRESS
      ================================ */}
      <Section title="📚 Subject Progress">
        {Object.keys(subjectProgress || {}).length === 0 ? (
          <EmptyCard text="Start playing to build subject mastery!" />
        ) : (
          Object.entries(subjectProgress).map(([subject, data]) => {
            const config = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
            const subjectAccuracy =
              data.questions_answered > 0
                ? (data.correct_answers / data.questions_answered) * 100
                : 0;

            return (
              <View key={subject} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectIcon}>{config.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>{config.name}</Text>
                    <Text style={styles.subjectLevel}>Level {data.level}</Text>
                  </View>
                  <Text style={styles.subjectAccuracy}>
                    {subjectAccuracy.toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.subjectDetails}>
                  <Text style={styles.subjectDetail}>
                    Questions: {data.questions_answered || 0}
                  </Text>
                  <Text style={styles.subjectDetail}>
                    Correct: {data.correct_answers || 0}
                  </Text>
                </View>

                <View style={styles.xpBar}>
                  <View style={styles.xpBarBackground}>
                    <View
                      style={[
                        styles.xpBarFill,
                        {
                          width: `${Math.min(data.xp % 100, 100)}%`,
                          backgroundColor: config.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.xpText}>{data.xp || 0} XP</Text>
                </View>
              </View>
            );
          })
        )}
      </Section>

      {/* ================================
          MISSIONS
      ================================ */}
      <MissionSection title="🎯 Daily Missions" missions={dailyMissions} />
      <MissionSection title="📅 Weekly Missions" missions={weeklyMissions} />
      <MissionSection title="🏆 Achievements" missions={longtermMissions} />
    </ScrollView>
  );
}

/* ================================
   REUSABLE COMPONENTS
================================ */

function HeaderStat({ label, value }) {
  return (
    <View style={styles.headerStatItem}>
      <Text style={styles.headerStatValue}>{value}</Text>
      <Text style={styles.headerStatLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function EmptyCard({ text }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.highlight]}>
        {value}
      </Text>
    </View>
  );
}

function MissionSection({ title, missions = [] }) {
  return (
    <Section title={title}>
      {missions.length === 0 ? (
        <EmptyCard text="No active missions" />
      ) : (
        missions.map(m => (
          <MissionRow
            key={m.id}
            title={m.title}
            subject={m.subject}
            current={m.progress}
            total={m.target}
            status={m.status}
          />
        ))
      )}
    </Section>
  );
}

function MissionRow({ title, subject, current, total, status }) {
  const config = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
  const pct = total > 0 ? (current / total) * 100 : 0;
  const complete = status === 'completed';

  return (
    <View style={styles.missionRow}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionIcon}>{config.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.missionTitle}>{title}</Text>
          <Text style={styles.missionProgress}>
            {current}/{total}
          </Text>
        </View>
        {complete && <Text style={styles.missionCheck}>✓</Text>}
      </View>
      <View style={styles.missionBar}>
        <View
          style={[
            styles.missionBarFill,
            {
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: complete ? '#4CAF50' : config.color,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* ================================
   STYLES
================================ */

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 200, backgroundColor: colors.background },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: { marginTop: 10, color: colors.textMuted },

  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  headerStatItem: { alignItems: 'center' },

  headerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  headerStatLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },

  section: { marginBottom: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },

  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },

  emptyText: { color: colors.textLight },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  statLabel: { color: colors.textMuted },

  statValue: { fontWeight: '600' },

  highlight: { color: colors.primary },

  subjectCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  subjectIcon: { fontSize: 28, marginRight: 10 },

  subjectName: { fontWeight: '700' },

  subjectLevel: { fontSize: 12, color: colors.textMuted },

  subjectAccuracy: { fontWeight: '700', color: colors.primary },

  subjectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  subjectDetail: { fontSize: 12, color: colors.textMuted },

  xpBarBackground: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },

  xpBarFill: { height: 6 },

  xpText: { fontSize: 11, color: colors.textLight, marginTop: 4 },

  missionRow: { marginBottom: 12 },

  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  missionIcon: { fontSize: 18, marginRight: 6 },

  missionTitle: { fontWeight: '600' },

  missionProgress: { fontSize: 12, color: colors.textMuted },

  missionCheck: { color: colors.primary, fontSize: 18 },

  missionBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },

  missionBarFill: { height: 6 },
});
