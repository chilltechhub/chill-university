// src/screens/today/MonthView.js
// The Planner's Month. Was MonthlyView in PlannerScreen.js
// (docs/shake-up-plan-2026-10-21.md P1). Reads useDayPlan; it counts
// Planner items only, so it skips deadlines and events.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FAB_CLEARANCE } from '../../../context/FabPositionContext';
import useDayPlan from '../../logic/useDayPlan';
import { SkeletonRows } from '../../components/Skeleton';
import { toISO } from './plannerShared';

// ─── Monthly view ─────────────────────────────────────────────────────────────
export default function MonthView({ userId, anchor, activeAreas, onDayPress, refreshKey, showingAll, c, t, s }) {
  const today        = toISO(new Date());
  const year         = anchor.getFullYear();
  const month        = anchor.getMonth();
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const dayIso = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const { items, loading } = useDayPlan(
    { from: dayIso(1), to: dayIso(daysInMonth) },
    { userId, allProfiles: showingAll, areas: activeAreas, refreshKey, due: false, events: false },
  );
  const { countByDate, doneByDate } = useMemo(() => {
    const cm = {}, dm = {};
    items.forEach(it => {
      cm[it.date] = (cm[it.date] || 0) + 1;
      if (it.done) dm[it.date] = (dm[it.date] || 0) + 1;
    });
    return { countByDate: cm, doneByDate: dm };
  }, [items]);

  if (loading) return <SkeletonRows count={4} style={{ padding: s.lg }} />;
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: FAB_CLEARANCE }}>
      <View style={{ flexDirection: 'row', marginBottom: s.sm }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: c.text3 }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso     = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count   = countByDate[iso] || 0;
          const done    = doneByDate[iso] || 0;
          const isToday = iso === today;
          const allDone = count > 0 && done === count;
          return (
            <TouchableOpacity key={day} onPress={() => onDayPress(new Date(year, month, day))}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isToday ? c.teal : 'transparent', borderWidth: count > 0 && !isToday ? 1 : 0, borderColor: allDone ? c.teal : c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: isToday ? '800' : '500', color: isToday ? c.onFill : allDone ? c.teal : c.text1 }}>{day}</Text>
              </View>
              {count > 0 && !allDone && (
                <View style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
