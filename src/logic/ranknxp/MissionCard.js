// src/components/MissionCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SUBJECT_CONFIG } from '../../context/UserProgressContext';

export default function MissionCard({ mission, onPress }) {
  if (!mission || !mission.missions) return null;

  const data = mission.missions;
  const progressPct =
    mission.target_value > 0
      ? (mission.current_value / mission.target_value) * 100
      : 0;

  const isCompleted = mission.status === 'completed';
  const isClaimed = mission.status === 'claimed';
  const isExpired = mission.status === 'expired';

  const subjectConfig =
    SUBJECT_CONFIG[mission.subject] || SUBJECT_CONFIG.general;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompleted && styles.completedCard,
        isExpired && styles.expiredCard,
      ]}
      onPress={onPress}
      disabled={isExpired || isClaimed}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{subjectConfig.icon}</Text>
          <View>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subject}>{subjectConfig.name}</Text>
          </View>
        </View>

        {isCompleted && !isClaimed && (
          <View style={styles.readyBadge}>
            <Text style={styles.badgeText}>✓ Ready</Text>
          </View>
        )}
        {isClaimed && (
          <View style={styles.claimedBadge}>
            <Text style={styles.badgeText}>Claimed</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.description}>{data.description}</Text>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {mission.current_value} / {mission.target_value}
        </Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(progressPct, 100)}%`,
              backgroundColor: isCompleted
                ? '#4CAF50'
                : subjectConfig.color,
            },
          ]}
        />
      </View>

      {/* Rewards */}
      <View style={styles.rewards}>
        <Text style={styles.reward}>⭐ {data.point_reward || 0}</Text>
        <Text style={styles.reward}>✨ {data.xp_reward || 0} XP</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  completedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  expiredCard: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subject: {
    fontSize: 12,
    color: '#666',
  },
  readyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimedBadge: {
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  progressRow: {
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
  },
  rewards: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  reward: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
