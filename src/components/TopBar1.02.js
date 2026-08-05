// src/components/TopBar.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProgress } from '../../context/UserProgressContext';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, shadows } from '../theme';
import LoginScreen from '../screens/LoginScreen';

export default function TopBar() {
  const { user, points, rank, progress, loading, pendingRewards, streakDays } = useUserProgress();
  const navigation = useNavigation();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <View style={s.container}>
        {/* Streak */}
        {streakDays > 0 && (
          <View style={s.streakBadge}>
            <Text style={s.streakIcon}>🔥</Text>
            <Text style={s.streakText}>{streakDays}</Text>
          </View>
        )}

        {/* Rank + progress bar (middle — expands) */}
        <TouchableOpacity
          style={s.rankSection}
          onPress={() => user ? navigation.navigate('Profile') : setShowLogin(true)}
        >
          <View style={s.rankRow}>
            <Text style={s.rankText}>
              {user ? `Rank ${rank}` : 'Guest'}
            </Text>
            <Text style={s.progressPct}>
              {user ? `${Math.round(progress)}%` : 'Sign in to save'}
            </Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: user ? `${progress}%` : '0%' }]} />
          </View>
        </TouchableOpacity>

        {/* Points or Sign In CTA */}
        {user ? (
          <View style={s.pointsSection}>
            <Text style={s.pointsText}>{points.toLocaleString()}</Text>
            <Text style={s.pointsLabel}>pts</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.signInBtn} onPress={() => setShowLogin(true)}>
            <Ionicons name="person-circle-outline" size={16} color={colors.white} />
            <Text style={s.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}

        {/* Rewards badge */}
        {user && pendingRewards?.length > 0 && (
          <TouchableOpacity
            style={s.rewardsBadge}
            onPress={() => navigation.navigate('Profile', { tab: 'rewards' })}
          >
            <Text style={s.rewardsIcon}>🎁</Text>
            <View style={s.rewardsDot}>
              <Text style={s.rewardsDotText}>{pendingRewards.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Login modal — slides up over the current screen */}
      <Modal visible={showLogin} animationType="slide" onRequestClose={() => setShowLogin(false)}>
        <LoginScreen onSuccess={() => setShowLogin(false)} onClose={() => setShowLogin(false)} />
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  streakIcon: { fontSize: 13, marginRight: 3 },
  streakText: { fontSize: typography.xs, fontWeight: typography.bold, color: colors.accent },
  rankSection: { flex: 1, marginRight: spacing.sm },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  rankText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.textPrimary },
  progressPct: { fontSize: typography.xs, color: colors.textMuted },
  barBg: { height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  pointsSection: { alignItems: 'flex-end' },
  pointsText: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.primary },
  pointsLabel: { fontSize: 9, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signInText: { fontSize: typography.xs, color: colors.white, fontWeight: typography.semibold },
  rewardsBadge: { marginLeft: spacing.sm, position: 'relative' },
  rewardsIcon: { fontSize: 22 },
  rewardsDot: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: colors.error,
    borderRadius: 9, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  rewardsDotText: { color: colors.white, fontSize: 9, fontWeight: typography.bold },
});
