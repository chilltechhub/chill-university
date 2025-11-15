// src/components/TopBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useNavigation } from '@react-navigation/native';

export default function TopBar() {
  const { points, rank, progress, loading, pendingRewards, streakDays } = useUserProgress();
  const navigation = useNavigation();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Streak Display */}
      {streakDays > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{streakDays}</Text>
        </View>
      )}

      {/* Rank Section */}
      <TouchableOpacity 
        style={styles.rankSection}
        onPress={() => navigation.navigate('Profile')}
      >
        <View style={styles.rankHeader}>
          <Text style={styles.rankText}>Rank {rank}</Text>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
      </TouchableOpacity>

      {/* Points Display */}
      <View style={styles.pointsSection}>
        <Text style={styles.pointsText}>{points.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>

      {/* Rewards Notification */}
      {pendingRewards && pendingRewards.length > 0 && (
        <TouchableOpacity 
          style={styles.rewardsBadge}
          onPress={() => navigation.navigate('Profile', { tab: 'rewards' })}
        >
          <Text style={styles.rewardsIcon}>🎁</Text>
          <View style={styles.rewardsCount}>
            <Text style={styles.rewardsCountText}>{pendingRewards.length}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F57C00',
  },
  rankSection: {
    flex: 1,
    marginRight: 12,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#333',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  pointsSection: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pointsText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#4CAF50',
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  rewardsBadge: {
    marginLeft: 12,
    position: 'relative',
  },
  rewardsIcon: {
    fontSize: 24,
  },
  rewardsCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rewardsCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});