// src/components/MissionCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SUBJECT_CONFIG } from '../../context/UserProgressContext';

export default function MissionCard({ mission, onPress }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  // Works with BOTH normalized shape (from context) and raw shape (from Supabase)
  const title       = mission?.title       || mission?.missions?.title       || 'Mission';
  const description = mission?.description || mission?.missions?.description || '';
  const xpReward    = mission?.reward?.xp  || mission?.missions?.xp_reward  || 0;
  const ptReward    = mission?.reward?.points || mission?.missions?.point_reward || 0;
  const progress    = mission?.progress    || mission?.current_value  || 0;
  const target      = mission?.target      || mission?.target_value   || 1;
  const status      = mission?.status      || 'active';
  const subject     = mission?.subject     || 'general';

  if (!title) return null;

  const pct         = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const isCompleted = status === 'completed';
  const isClaimed   = status === 'claimed';
  const isExpired   = status === 'expired';
  const cfg         = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;

  return (
    <TouchableOpacity
      style={[
        styles(c, s, r).card,
        isCompleted && { borderWidth: 1.5, borderColor: c.teal, backgroundColor: c.tealLight },
        isExpired   && { opacity: 0.45 },
      ]}
      onPress={onPress}
      disabled={isExpired || isClaimed}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: s.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, flex: 1 }}>
          <Text style={{ fontSize: 24 }}>{cfg.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ fontSize: t.xs, color: c.text3 }}>{cfg.name}</Text>
          </View>
        </View>
        {isCompleted && !isClaimed && (
          <View style={{ backgroundColor: c.teal, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: t.bold }}>✓ Done</Text>
          </View>
        )}
        {isClaimed && (
          <View style={{ backgroundColor: c.text4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: t.bold }}>Claimed</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {description ? (
        <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.sm, lineHeight: 16 }}>
          {description}
        </Text>
      ) : null}

      {/* Progress */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: t.xs, color: c.text3 }}>{progress} / {target}</Text>
        <Text style={{ fontSize: t.xs, color: isCompleted ? c.teal : c.text4 }}>{Math.round(pct)}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden', marginBottom: s.sm }}>
        <View style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: isCompleted ? c.teal : cfg.color }} />
      </View>

      {/* Rewards */}
      <View style={{ flexDirection: 'row', gap: s.lg }}>
        <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.gold }}>⭐ {ptReward} pts</Text>
        <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.teal }}>✨ {xpReward} XP</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = (c, s, r) => StyleSheet.create({
  card: {
    backgroundColor: c.bg1,
    borderRadius: r.lg,
    padding: s.lg,
    marginBottom: s.md,
    borderWidth: 0.5,
    borderColor: c.border,
  },
});
