// src/components/MissionCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SUBJECT_CONFIG } from '../../context/UserProgressContext';

export default function MissionCard({ mission, onPress }) {
  if (!mission || !mission.missions) return null;

  const missionData = mission.missions;
  const progress = (mission.current_value / mission.target_value) * 100;
  const isCompleted = mission.status === 'completed';
  const isClaimed = mission.status === 'claimed';
  const isExpired = mission.status === 'expired';
  
  const subjectConfig = SUBJECT_CONFIG[mission.subject] || SUBJECT_CONFIG.general;
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!mission.expires_at) return null;
    
    const now = new Date();
    const expires = new Date(mission.expires_at);
    const diff = expires - now;
    
    if (diff < 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompleted && styles.completedCard,
        isExpired && styles.expiredCard,
      ]}
      onPress={onPress}
      disabled={isCompleted || isExpired || isClaimed}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{subjectConfig.icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {missionData.title}
            </Text>
            <Text style={styles.subject}>
              {subjectConfig.name}
            </Text>
          </View>
        </View>
        
        {/* Status Badge */}
        {isCompleted && !isClaimed && (
          <View style={[styles.badge, styles.completedBadge]}>
            <Text style={styles.badgeText}>✓ Ready</Text>
          </View>
        )}
        {isClaimed && (
          <View style={[styles.badge, styles.claimedBadge]}>
            <Text style={styles.badgeText}>✓ Claimed</Text>
          </View>
        )}
        {isExpired && (
          <View style={[styles.badge, styles.expiredBadge]}>
            <Text style={styles.badgeText}>Expired</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {missionData.description && (
        <Text style={styles.description} numberOfLines={2}>
          {missionData.description}
        </Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {mission.current_value} / {mission.target_value}
          </Text>
          {timeRemaining && !isExpired && (
            <Text style={styles.timeText}>{timeRemaining}</Text>
          )}
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isCompleted ? '#4CAF50' : subjectConfig.color,
              },
            ]}
          />
        </View>
      </View>

      {/* Rewards */}
      <View style={styles.rewardsRow}>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardIcon}>⭐</Text>
          <Text style={styles.rewardValue}>+{missionData.point_reward || 0}</Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardIcon}>✨</Text>
          <Text style={styles.rewardValue}>+{missionData.xp_reward || 0} XP</Text>
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  completedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  expiredCard: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  subject: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  claimedBadge: {
    backgroundColor: '#9E9E9E',
  },
  expiredBadge: {
    backgroundColor: '#FF5722',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF9800',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  rewardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
});