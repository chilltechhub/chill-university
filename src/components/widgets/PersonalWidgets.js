// src/components/widgets/PersonalWidgets.js
//
// The three widgets that make a PERSONAL dashboard look like a personal
// dashboard: how your habits are holding, where your life areas stand, and
// what's due today.
//
// personas.js has promised these three (`habitRings`, `lifeAreas`,
// `dailyDrills`) since the persona system shipped, but nothing read
// `active_widgets`, so every account got the same nine generic widgets
// regardless of type. These are the real ones.
//
// Every number here comes from a real table. Where there's no data yet, the
// widget says so and offers the action that would create some — see the
// `empty` prop on WidgetCard.

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { getUserSubscriptions, getCompletionRate, AREAS } from '../../api/plannerService';
import WidgetCard, { StatRow, Bar } from './WidgetCard';

// ─── Habit Rings ─────────────────────────────────────────────────────────────
// Seven-day completion rate per life area, over the daily planner components
// the user is actually subscribed to. getCompletionRate returns null for an
// area with no scheduled instances in the window, which is the difference
// between "0% done" and "nothing was scheduled" — those are not the same
// thing and the widget must not conflate them.

export function HabitRingsWidget({ userId, onOpenPlanner }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const [rows, setRows] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setRows([]); return; }
      try {
        const subs = await getUserSubscriptions(userId);
        const dailyAreas = [...new Set(subs.filter(x => x.cadence === 'daily').map(x => x.area))];
        const rates = await Promise.all(
          dailyAreas.map(async area => ({ area, pct: await getCompletionRate(userId, area, 'daily', 7) })),
        );
        if (alive) setRows(rates.filter(r => r.pct !== null));
      } catch (e) {
        console.warn('habitRings', e?.message);
        if (alive) setRows([]);
      }
    })();
    return () => { alive = false; };
  }, [userId]));

  return (
    <WidgetCard
      title="Habits · last 7 days" icon="repeat-outline" accent={c.success}
      action="Planner →" onAction={onOpenPlanner}
      loading={rows === null}
      empty={rows?.length === 0 ? {
        text: "No daily habits scheduled yet. Add a couple and this fills in as you check them off.",
        cta: 'Open Planner', onPress: onOpenPlanner,
      } : null}
    >
      {rows?.map(({ area, pct }) => {
        const def = AREAS[area] || { label: area, color: c.teal, emoji: '•' };
        return (
          <View key={area} style={{ marginBottom: s.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: t.sm, color: c.text2 }}>{def.emoji} {def.label}</Text>
              <Text style={{ fontSize: t.sm, color: def.color, fontWeight: t.bold }}>{pct}%</Text>
            </View>
            <Bar pct={pct} color={def.color} />
          </View>
        );
      })}
    </WidgetCard>
  );
}

// ─── Life Areas ──────────────────────────────────────────────────────────────
// The user's own rating per area, most-stale first. Distinct from Home's
// existing "Check-ins Due" widget, which only lists what's overdue — this is
// the standing picture across every area they've activated.

export function LifeAreasWidget({ areas, onOpenArea, onOpenLibrary }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const rated = (areas || []).filter(a => a.rating > 0);

  return (
    <WidgetCard
      title="Life areas" icon="grid-outline" accent={c.purple}
      action="Library →" onAction={onOpenLibrary}
      empty={rated.length === 0 ? {
        text: "You haven't checked in on any life areas yet. A check-in takes about ten seconds and this starts tracking how each one is trending.",
        cta: 'Check in', onPress: onOpenLibrary,
      } : null}
    >
      {rated.map(({ area, rating, days }) => (
        <TouchableOpacity
          key={area.id}
          onPress={() => onOpenArea?.(area, rating)}
          accessibilityRole="button"
          style={{ marginBottom: s.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: t.sm, color: c.text2 }}>{area.emoji} {area.label}</Text>
            <Text style={{ fontSize: t.xs, color: days === null ? c.text4 : days > 7 ? c.error : c.text4 }}>
              {days === null ? 'never' : days === 0 ? 'today' : `${days}d ago`}
            </Text>
          </View>
          <Bar pct={rating} color={area.color} />
        </TouchableOpacity>
      ))}
    </WidgetCard>
  );
}

// ─── Daily Drills ────────────────────────────────────────────────────────────
// Straight off `dailyMissions` in UserProgressContext — the same list
// Training shows, surfaced on Home for the personas whose day is built
// around it.

export function DailyDrillsWidget({ missions, onOpenTraining }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const list = missions || [];
  const done = list.filter(m => m.completed || m.status === 'completed').length;

  return (
    <WidgetCard
      title="Today's drills" icon="checkmark-done-outline" accent={c.gold}
      action="Training →" onAction={onOpenTraining}
      empty={list.length === 0 ? {
        text: "No drills generated for today yet. They appear once you've played a round or two so we know what to set.",
        cta: 'Open Training', onPress: onOpenTraining,
      } : null}
    >
      <StatRow label="Completed" value={`${done} of ${list.length}`} color={done === list.length ? c.success : c.text1} />
      <Bar pct={list.length ? (done / list.length) * 100 : 0} color={c.gold} />
      <View style={{ marginTop: s.md }}>
        {list.slice(0, 3).map((m, i) => {
          const isDone = m.completed || m.status === 'completed';
          return (
            <View key={m.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
              <Ionicons
                name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                size={15}
                color={isDone ? c.success : c.text4}
              />
              <Text
                style={{ fontSize: t.sm, color: isDone ? c.text4 : c.text2, flex: 1, textDecorationLine: isDone ? 'line-through' : 'none' }}
                numberOfLines={1}>
                {m.missions?.title || m.title || 'Drill'}
              </Text>
            </View>
          );
        })}
      </View>
    </WidgetCard>
  );
}
