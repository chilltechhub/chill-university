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
import { AREAS } from '../../api/plannerService';
import { supabase } from '../../api/profileScopedClient';
import { todayStr, addDays } from '../../logic/dateUtils';
import { habitStreak } from '../../logic/habitStreak';
import WidgetCard, { StatRow, Bar } from './WidgetCard';

// ─── Habit Rings ─────────────────────────────────────────────────────────────
// Every daily and weekly habit (templates and ones added by hand alike;
// both are agenda_instances rows), one row each by its own name, with:
//   · its streak: days in a row for a daily habit, weeks for a weekly one.
//     Today (or this week) counts once it's ticked, so an untouched today
//     never breaks it; a skipped day is a rest, not a break.
//   · daily: the last seven days as dots (done, missed, today, none), the
//     streak calendar the 2026-10-14 review found missing.
// A habit with no counted day yet reads "starts today".
export function HabitRingsWidget({ userId, onOpenPlanner }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const [rows, setRows] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setRows([]); return; }
      try {
        const today = todayStr();
        const { data, error } = await supabase.from('agenda_instances')
          .select('title, area, date, cadence, completed, skipped')
          .eq('user_id', userId).in('cadence', ['daily', 'weekly'])
          .gte('date', addDays(today, -60)).lte('date', today)
          .limit(1500);
        if (error) throw error;
        const byHabit = new Map();
        (data || []).forEach((r) => {
          const key = `${(r.title || '').trim().toLowerCase()}|${r.cadence}`;
          if (!byHabit.has(key)) byHabit.set(key, { key, title: r.title, area: r.area, cadence: r.cadence, rows: [] });
          byHabit.get(key).rows.push(r);
        });
        const weekFrom = addDays(today, -6);
        const out = [...byHabit.values()].map(h => {
          const recent = h.rows.filter(r => r.date >= weekFrom && !r.skipped);
          const byDate = new Map(h.rows.map(r => [r.date, r]));
          return {
            ...h,
            done: recent.filter(r => r.completed).length,
            days: recent.filter(r => r.date < today || r.completed).length,
            streak: habitStreak(h.rows, h.cadence, today),
            dots: h.cadence === 'daily'
              ? Array.from({ length: 7 }, (_, i) => {
                const d = addDays(today, i - 6);
                const r = byDate.get(d);
                return { d, state: !r ? 'none' : r.completed ? 'done' : r.skipped ? 'rest' : d === today ? 'today' : 'missed' };
              })
              : null,
          };
        }).sort((a, b) => b.streak - a.streak);
        if (alive) setRows(out.slice(0, 6));
      } catch (e) {
        console.warn('habitRings', e?.message);
        if (alive) setRows([]);
      }
    })();
    return () => { alive = false; };
  }, [userId]));

  return (
    <WidgetCard
      title="Habits" icon="repeat-outline" accent={c.success}
      action="Planner →" onAction={onOpenPlanner}
      loading={rows === null}
      empty={rows?.length === 0 ? {
        text: "No habits yet. Add one in the Planner and set it to repeat.",
        cta: 'Open Planner', onPress: onOpenPlanner,
      } : null}
    >
      {rows?.map(({ key, title, area, cadence, done, days, streak, dots }) => {
        const def = AREAS[area] || { color: c.teal, emoji: '•' };
        const unit = cadence === 'weekly' ? 'week' : 'day';
        return (
          <View key={key} style={{ marginBottom: s.md }}
            accessible accessibilityLabel={`${title}. ${streak ? `${streak} ${unit}${streak === 1 ? '' : 's'} in a row` : 'No streak yet'}${dots ? `. ${done} of ${days} days this week` : ''}.`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: t.sm, color: c.text1, flex: 1 }} numberOfLines={1}>{def.emoji} {title}</Text>
              {streak > 0
                ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="flame" size={14} color={c.gold} />
                    <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: t.bold }}>{streak} {unit}{streak === 1 ? '' : 's'}</Text>
                  </View>
                )
                : days === 0
                  ? <Text style={{ fontSize: t.xs, color: c.text3 }}>starts today</Text>
                  : <Text style={{ fontSize: t.xs, color: c.text3 }}>not started yet</Text>}
            </View>
            {dots ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                {dots.map(({ d, state }) => (
                  <View key={d} style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: state === 'done' ? def.color : 'transparent',
                    borderWidth: state === 'done' ? 0 : 1.5,
                    borderColor: state === 'missed' ? c.text3 : state === 'today' ? def.color : c.border,
                    borderStyle: state === 'rest' ? 'dashed' : 'solid',
                  }} />
                ))}
                <Text style={{ fontSize: t.xs, color: c.text3, marginLeft: 4 }}>{done} of {days || 0} this week</Text>
              </View>
            ) : (
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Weekly{done ? ' · done this week' : ''}</Text>
            )}
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
        text: "No check-ins yet. Rate a life area: it takes ten seconds.",
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
            <Text style={{ fontSize: t.xs, color: days === null ? c.text3 : days > 7 ? c.error : c.text3 }}>
              {days === null ? 'not rated yet' : days === 0 ? 'today' : `${days}d ago`}
            </Text>
          </View>
          {/* Ratings are 1-5 (LifeAreaScreen). */}
          <Bar pct={rating * 20} color={area.color} />
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
        cta: 'Practice', onPress: onOpenTraining,
      } : null}
    >
      <StatRow label="Done today" value={`${doneCount} of ${total}`} color={doneCount === total ? c.success : c.text1} />
      <Bar pct={total ? (doneCount / total) * 100 : 0} color={c.gold} />

      {next ? (
        <View style={{ marginTop: s.md, padding: s.md, borderRadius: 10, borderWidth: 1, borderColor: c.gold + '66', backgroundColor: c.gold + '12' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: c.gold, letterSpacing: 1 }}>UP NEXT · {next.progress} / {next.target}</Text>
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
              style={{ fontSize: t.sm, color: m.done ? c.text3 : c.text2, flex: 1, textDecorationLine: m.done ? 'line-through' : 'none' }}
              numberOfLines={1}>
              {m.title || 'Drill'}
            </Text>
            {!m.done && <Text style={{ fontSize: t.xs, color: c.text3 }}>{m.progress}/{m.target}</Text>}
          </View>
        ))}
      </View>
    </WidgetCard>
  );
}
