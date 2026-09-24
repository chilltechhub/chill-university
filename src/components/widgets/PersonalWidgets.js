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
import useDrillPlan from '../../logic/useDrillPlan';
import { getUserSubscriptions, getCustomItemAreas, getCompletionRate, AREAS } from '../../api/plannerService';
import WidgetCard, { StatRow, Bar } from './WidgetCard';

// ─── Habit Rings ─────────────────────────────────────────────────────────────
// Seven-day completion rate per life area, over the daily planner components
// the user is subscribed to *and* any daily item they added themselves with
// the Planner's "+ Add" (those live only in agenda_instances, so reading
// subscriptions alone left this empty for exactly the users the empty
// state's "Open Planner" was sending to the Planner). getCompletionRate returns null for an
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
        const [subs, customAreas] = await Promise.all([
          getUserSubscriptions(userId),
          getCustomItemAreas(userId, 'daily', 7),
        ]);
        const dailyAreas = [...new Set([
          ...subs.filter(x => x.cadence === 'daily').map(x => x.area),
          ...customAreas,
        ])];
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

// Leads with the drill to do next and a button straight into a game that
// counts, because "1 of 3" on its own says nothing about what to do. The
// plan (how, which game, which is next) is shared with the drills list and
// the "drill done" toast: src/logic/useDrillPlan.js.
export function DailyDrillsWidget({ onOpenTraining, onOpenDrills, onPlay }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { drills, next, doneCount, total } = useDrillPlan();

  return (
    <WidgetCard
      title="Today's drills" icon="checkmark-done-outline" accent={c.gold}
      action="All drills →" onAction={onOpenDrills || onOpenTraining}
      empty={total === 0 ? {
        text: "Today's drills haven't been set yet. They appear the next time the app loads.",
        cta: 'Open Training', onPress: onOpenTraining,
      } : null}
    >
      <StatRow label="Done today" value={`${doneCount} of ${total}`} color={doneCount === total ? c.success : c.text1} />
      <Bar pct={total ? (doneCount / total) * 100 : 0} color={c.gold} />

      {next ? (
        <View style={{ marginTop: s.md, padding: s.md, borderRadius: 10, borderWidth: 1, borderColor: c.gold + '66', backgroundColor: c.gold + '12' }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: c.gold, letterSpacing: 1 }}>UP NEXT · {next.progress} / {next.target}</Text>
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginTop: 2 }}>{next.title}</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 16 }}>{next.how}</Text>
          {!!next.playGameId && (
            <TouchableOpacity
              onPress={() => onPlay?.(next.playGameId)}
              accessibilityRole="button"
              style={{ alignSelf: 'flex-start', marginTop: s.sm, backgroundColor: c.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: t.xs, fontWeight: '800', color: '#fff' /* style-ok: white on the gold button in both modes */ }}>
                {next.games?.length === 1 ? `Play ${next.games[0].title} ▸` : 'Play a game ▸'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : total > 0 ? (
        <Text style={{ fontSize: t.sm, color: c.success, marginTop: s.md, fontWeight: t.semibold }}>
          All of today's drills are done. New ones at midnight.
        </Text>
      ) : null}

      <View style={{ marginTop: s.sm }}>
        {drills.filter(d => !d.upNext).map((m, i) => (
          <View key={m.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
            <Ionicons name={m.done ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={m.done ? c.success : c.text4} />
            <Text
              style={{ fontSize: t.sm, color: m.done ? c.text4 : c.text2, flex: 1, textDecorationLine: m.done ? 'line-through' : 'none' }}
              numberOfLines={1}>
              {m.title || 'Drill'}
            </Text>
            {!m.done && <Text style={{ fontSize: t.xs, color: c.text4 }}>{m.progress}/{m.target}</Text>}
          </View>
        ))}
      </View>
    </WidgetCard>
  );
}
