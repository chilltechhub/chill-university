// src/screens/StatsScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useUserProgress, SUBJECT_CONFIG } from '../../context/UserProgressContext';

export default function StatsScreen() {
  const {
    loading,
    profile,
    points,
    xp,
    level,
    rank,
    streakDays,
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

  // Gameplay stats
  const {
    timePerGame = {},
    totalProblemsAttempted = 0,
    totalProblemsCorrect = 0,
    fastestTime = null,
    avgTime = null,
    levelsCompleted = 0,
  } = gameplayStats;

  const accuracy =
    totalProblemsAttempted > 0
      ? ((totalProblemsCorrect / totalProblemsAttempted) * 100).toFixed(2) + '%'
      : '0%';

  const timeEntries = Object.entries(timePerGame);

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      {/* User Overview */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{profile?.display_name || 'Player'}</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{points.toLocaleString()}</Text>
            <Text style={styles.headerStatLabel}>Points</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>Rank {rank}</Text>
            <Text style={styles.headerStatLabel}>Current Rank</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>Lvl {level}</Text>
            <Text style={styles.headerStatLabel}>Level</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>🔥 {streakDays}</Text>
            <Text style={styles.headerStatLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Gameplay Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Gameplay Stats</Text>
        <View style={styles.card}>
          <StatRow label="Problems Attempted" value={totalProblemsAttempted} />
          <StatRow label="Problems Correct" value={totalProblemsCorrect} />
          <StatRow label="Accuracy" value={accuracy} highlight />
          <StatRow 
            label="Fastest Time" 
            value={fastestTime != null ? `${fastestTime}s` : 'N/A'} 
          />
          <StatRow 
            label="Avg Time per Problem" 
            value={avgTime != null ? `${avgTime.toFixed(2)}s` : 'N/A'} 
          />
          <StatRow label="Games Completed" value={levelsCompleted} />
        </View>
      </View>

      {/* Time Per Game */}
      {timeEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Time Per Game</Text>
          <View style={styles.card}>
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
          </View>
        </View>
      )}

      {/* Subject Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Subject Progress</Text>
        {Object.keys(subjectProgress).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No subject data yet</Text>
            <Text style={styles.emptySubtext}>Start practicing to see your progress!</Text>
          </View>
        ) : (
          Object.entries(subjectProgress).map(([subject, data]) => {
            const config = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
            // Calculate accuracy from correct_answers and questions_answered
            const accuracy = data.questions_answered > 0 
              ? (data.correct_answers / data.questions_answered) * 100 
              : 0;
            
            return (
              <View key={subject} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectIcon}>{config.icon}</Text>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectName}>{config.name}</Text>
                    <Text style={styles.subjectLevel}>Level {data.level}</Text>
                  </View>
                  <View style={styles.subjectStats}>
                    <Text style={styles.subjectAccuracy}>
                      {accuracy.toFixed(0)}%
                    </Text>
                    <Text style={styles.subjectLabel}>Accuracy</Text>
                  </View>
                </View>
                <View style={styles.subjectDetails}>
                  <Text style={styles.subjectDetail}>
                    Questions: {data.questions_answered || 0}
                  </Text>
                  <Text style={styles.subjectDetail}>
                    Correct: {data.correct_answers || 0}
                  </Text>
                  <Text style={styles.subjectDetail}>
                    Streak: {data.streak_days || 0} days
                  </Text>
                </View>
                {/* XP Progress Bar */}
                <View style={styles.xpBar}>
                  <Text style={styles.xpText}>
                    {data.xp || 0} XP
                  </Text>
                  <View style={styles.xpBarBackground}>
                    <View 
                      style={[
                        styles.xpBarFill, 
                        { 
                          width: `${Math.min((data.xp % 100), 100)}%`,
                          backgroundColor: config.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Daily Missions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Daily Missions</Text>
        {dailyMissions && dailyMissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active daily missions</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {(dailyMissions || []).map((mission, i) => (
              <MissionRow
                key={mission.id || i}
                title={mission.missions?.title || 'Mission'}
                subject={mission.subject}
                current={mission.current_value}
                total={mission.target_value}
                status={mission.status}
              />
            ))}
          </View>
        )}
      </View>

      {/* Weekly Missions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Weekly Missions</Text>
        {weeklyMissions && weeklyMissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active weekly missions</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {(weeklyMissions || []).map((mission, i) => (
              <MissionRow
                key={mission.id || i}
                title={mission.missions?.title || 'Mission'}
                subject={mission.subject}
                current={mission.current_value}
                total={mission.target_value}
                status={mission.status}
              />
            ))}
          </View>
        )}
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        {longtermMissions && longtermMissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No achievements tracked yet</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {(longtermMissions || []).map((mission, i) => (
              <MissionRow
                key={mission.id || i}
                title={mission.missions?.title || 'Achievement'}
                subject={mission.subject}
                current={mission.current_value}
                total={mission.target_value}
                status={mission.status}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Helper Components
function StatRow({ label, value, highlight }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

function MissionRow({ title, subject, current, total, status }) {
  const config = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
  const progress = total > 0 ? (current / total) * 100 : 0;
  const isCompleted = status === 'completed';
  
  return (
    <View style={styles.missionRow}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionIcon}>{config.icon}</Text>
        <View style={styles.missionInfo}>
          <Text style={styles.missionTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.missionProgress}>
            {current || 0}/{total || 0}
          </Text>
        </View>
        {isCompleted && (
          <Text style={styles.missionCheck}>✓</Text>
        )}
      </View>
      <View style={styles.missionBar}>
        <View 
          style={[
            styles.missionBarFill, 
            { 
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: isCompleted ? '#4CAF50' : config.color
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for full scroll
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#bbb',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statValueHighlight: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  subjectLevel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  subjectStats: {
    alignItems: 'flex-end',
  },
  subjectAccuracy: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  subjectLabel: {
    fontSize: 10,
    color: '#999',
  },
  subjectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  subjectDetail: {
    fontSize: 12,
    color: '#666',
  },
  xpBar: {
    marginTop: 8,
  },
  xpText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  xpBarBackground: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 6,
    borderRadius: 3,
  },
  missionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  missionProgress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  missionCheck: {
    fontSize: 20,
    color: '#4CAF50',
  },
  missionBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  missionBarFill: {
    height: 6,
    borderRadius: 3,
  },
});