// src/screens/family/ChildProgressScreen.js
// Read-only progress view for one linked child — level/xp/points/streak
// only, nothing else, no controls. Receives the row already fetched by
// FamilyScreen's get_my_children() call via route params, so this screen
// needs no fetch of its own.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import LevelRing from '../../components/LevelRing';
import { getRank, getRankProgress, getRankLabel } from '../../logic/rankUtils';

export default function ChildProgressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const child = route.params?.child;

  if (!child) return null;

  const rank = getRank(child.points || 0);
  const { progress } = getRankProgress(child.points || 0);
  const rankInfo = getRankLabel(rank);

  // Same "checked in today" definition as UserProgressContext's streakDays.
  const checkedInToday = child.last_active_date
    ? new Date(child.last_active_date).toDateString() === new Date().toDateString()
    : false;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{child.display_name}</Text>
      </View>

      <View style={{ padding: s.lg }}>
        <View style={{ backgroundColor: c.bg1, borderRadius: r.xl, padding: s.xl, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 2, borderTopColor: rankInfo.color, alignItems: 'center' }}>
          <LevelRing pct={progress} size={80} strokeWidth={5} color={rankInfo.color} trackColor={c.bg2} style={{ marginBottom: s.md }}>
            <Text style={{ fontSize: 32 }}>{rankInfo.emoji}</Text>
          </LevelRing>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>Level {child.level}</Text>
          <Text style={{ fontSize: t.xs, color: rankInfo.color, fontWeight: t.semibold, marginBottom: s.lg }}>{rankInfo.label}</Text>

          <View style={{ flexDirection: 'row', gap: s.xl }}>
            {[
              { label: 'Points', val: (child.points || 0).toLocaleString(), color: c.gold },
              { label: 'XP',     val: child.xp || 0,                        color: c.teal },
              { label: 'Streak', val: (child.streak_count || 0) + 'd',      color: '#FF4081' },
            ].map((st) => (
              <View key={st.label} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: st.color }}>{st.val}</Text>
                <Text style={{ fontSize: t.xs, color: c.text4 }}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginTop: s.lg, borderWidth: 0.5, borderColor: c.border }}>
          <Ionicons name={checkedInToday ? 'checkmark-circle' : 'time-outline'} size={18} color={checkedInToday ? c.teal : c.text4} />
          <Text style={{ fontSize: t.sm, color: c.text2 }}>
            {checkedInToday ? 'Checked in today' : 'No activity yet today'}
          </Text>
        </View>

        <Text style={{ fontSize: 11, color: c.text4, marginTop: s.lg, textAlign: 'center' }}>
          This is a read-only view — you can't change anything on their account from here.
        </Text>
      </View>
    </View>
  );
}
