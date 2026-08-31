// src/components/TopBar.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import { RANK_LABELS, FONTS } from '../theme';
import LoginScreen from '../screens/LoginScreen';

export default function TopBar() {
  const { user, points, rank, progress, loading, pendingRewards, streakDays } = useUserProgress();
  const { colors, typography, spacing, shadows } = useTheme();
  const navigation = useNavigation();
  const [showLogin, setShowLogin] = useState(false);

  const s = makeStyles(colors, typography, spacing, shadows);
  const rankInfo = RANK_LABELS[rank] || RANK_LABELS[20];
  const level = rank ? 21 - rank : 1;

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <View style={s.container}>
        {/* Crest */}
        <TouchableOpacity
          style={s.crest}
          onPress={() => user ? navigation.navigate('Profile') : setShowLogin(true)}
          activeOpacity={0.75}
        >
          <Text style={s.crestEmoji}>{rankInfo.emoji}</Text>
        </TouchableOpacity>

        {/* Rank + progress */}
        <TouchableOpacity
          style={s.rankSection}
          onPress={() => user ? navigation.navigate('Profile') : setShowLogin(true)}
          activeOpacity={0.7}
        >
          <View style={s.rankRow}>
            <Text style={s.rankName}>
              {user ? `LV ${level} · ${rankInfo.label}` : rankInfo.label}
            </Text>
            <Text style={s.rankPct}>
              {user ? `${Math.round(progress)}%` : 'GUEST'}
            </Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: user ? `${Math.min(progress, 100)}%` : '0%' }]} />
          </View>
        </TouchableOpacity>

        {/* Streak */}
        {streakDays > 0 && (
          <View style={s.streak}>
            <Text style={s.streakText}>🔥{streakDays}</Text>
          </View>
        )}

        {/* Points or Sign In */}
        {user ? (
          <View style={s.ptsSection}>
            <Text style={s.ptsNum}>{points.toLocaleString()}</Text>
            <Text style={s.ptsLabel}>PTS</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.signInBtn} onPress={() => setShowLogin(true)}>
            <Ionicons name="person-circle-outline" size={14} color="#fff" />
            <Text style={s.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}

        {/* Pending rewards */}
        {user && pendingRewards?.length > 0 && (
          <TouchableOpacity
            style={s.rewardBtn}
            onPress={() => navigation.navigate('Profile', { tab: 'rewards' })}
          >
            <Text style={{ fontSize: 20 }}>🎁</Text>
            <View style={s.rewardDot}>
              <Text style={s.rewardDotText}>{pendingRewards.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showLogin} animationType="slide" onRequestClose={() => setShowLogin(false)}>
        <LoginScreen onSuccess={() => setShowLogin(false)} onClose={() => setShowLogin(false)} />
      </Modal>
    </>
  );
}

const makeStyles = (c, t, s, sh) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.lg,
    paddingVertical: s.sm,
    backgroundColor: c.headerBg,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    borderTopWidth: 0,
    ...sh.sm,
  },
  crest: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1.5, borderColor: c.gold,
    backgroundColor: c.goldLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: s.sm,
  },
  crestEmoji: { fontSize: 15 },
  streak: {
    backgroundColor: c.goldLight,
    borderWidth: 0.5,
    borderColor: c.gold,
    borderRadius: 10,
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    marginRight: s.sm,
  },
  streakText: { fontSize: t.xs, fontWeight: t.bold, color: c.gold, fontFamily: FONTS.mono },
  rankSection: { flex: 1, marginRight: s.sm },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  rankName: { fontSize: t.sm, fontWeight: t.bold, color: c.gold, fontFamily: FONTS.display, letterSpacing: 0.3 },
  rankPct: { fontSize: t.xs, color: c.text3, fontFamily: FONTS.mono },
  barBg: { height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, backgroundColor: c.goldMid, borderRadius: 3 },
  ptsSection: { alignItems: 'flex-end' },
  ptsNum: { fontSize: t.lg, fontWeight: t.bold, color: c.gold, fontFamily: FONTS.mono },
  ptsLabel: { fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONTS.mono },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.teal, borderRadius: 14,
    paddingHorizontal: s.sm + 2, paddingVertical: 6,
  },
  signInText: { fontSize: t.xs, color: '#fff', fontWeight: t.semibold },
  rewardBtn: { marginLeft: s.sm, position: 'relative' },
  rewardDot: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: c.error, borderRadius: 9,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  rewardDotText: { color: '#fff', fontSize: 9, fontWeight: t.bold },
});
