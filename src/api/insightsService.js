// src/api/insightsService.js
// What the Insights screen shows: real life, not games. The last four weeks
// of things done (planner items and to-dos), habits kept, focus time from
// Work Mode, and how much of what you saved you've used.
//
// Read-only and profile-scoped, like every screen that reads content. The
// day series is built here, not in the screen, so a missing table (an older
// database) costs that one number, not the whole page.

import { supabase } from './profileScopedClient';
import { usesOf } from './knowledgeUse';
import { AREAS } from './plannerService';
import { todayStr, addDays, dateStr } from '../logic/dateUtils';

export const INSIGHT_DAYS = 28;

const quiet = (label) => (res) => {
  if (res?.error) console.warn(`[insights] ${label}`, res.error.message);
  return res?.data || [];
};

/**
 * @returns {Promise<{
 *   days: { date: string, done: number }[],   // oldest first, INSIGHT_DAYS long, ends today
 *   doneWeek: number, donePrevWeek: number,
 *   habits: { kept: number, total: number },   // repeating plans due in the last 7 days
 *   focus: { week: number, prevWeek: number },  // minutes
 *   areas: { key: string, label: string, color: string, done: number }[],  // most first, done > 0
 *   knowledge: { saved: number, used: number }, // last INSIGHT_DAYS: saved items, items used at least once
 * }>}
 */
export async function getInsights(userId) {
  const today = todayStr();
  const from = addDays(today, -(INSIGHT_DAYS - 1));
  const fromIso = new Date(`${from}T00:00:00`).toISOString();
  const empty = emptyInsights(today);
  if (!userId) return empty;

  const [plans, tasks, timers, saved, checkins] = await Promise.all([
    supabase.from('agenda_instances').select('date, completed, skipped, cadence, area')
      .eq('user_id', userId).gte('date', from).lte('date', today).limit(2000).then(quiet('plans'), () => []),
    supabase.from('tasks').select('completed_at')
      .eq('user_id', userId).eq('completed', true).gte('completed_at', fromIso).limit(2000).then(quiet('tasks'), () => []),
    supabase.from('timer_sessions').select('session_date, duration_seconds')
      .eq('user_id', userId).gte('session_date', addDays(today, -13)).limit(500).then(quiet('focus'), () => []),
    supabase.from('captures').select('id, created_at, url_meta')
      .eq('user_id', userId).in('type', ['note', 'link', 'resource']).neq('status', 'inbox')
      .is('deleted_at', null).gte('created_at', fromIso).limit(1000).then(quiet('vault'), () => []),
    supabase.from('daily_checkins').select('date, sleep_quality, energy, mood, stress')
      .eq('user_id', userId).gte('date', from).lte('date', today).limit(100).then(quiet('checkins'), () => []),
  ]);

  // ── Done per day ──
  const perDay = new Map(empty.days.map(d => [d.date, 0]));
  const byArea = new Map();
  for (const p of plans) {
    if (!p.completed || !perDay.has(p.date)) continue;
    perDay.set(p.date, perDay.get(p.date) + 1);
    if (p.area) byArea.set(p.area, (byArea.get(p.area) || 0) + 1);
  }
  for (const t of tasks) {
    const d = t.completed_at ? dateStr(new Date(t.completed_at)) : null;
    if (d && perDay.has(d)) perDay.set(d, perDay.get(d) + 1);
  }
  const days = [...perDay.entries()].map(([date, done]) => ({ date, done }));
  const sum = (list) => list.reduce((n, d) => n + d.done, 0);

  // ── Habits: repeating plans due in the last 7 days ──
  const weekFrom = addDays(today, -6);
  const habitRows = plans.filter(p => p.cadence && p.cadence !== 'once' && p.date >= weekFrom && !p.skipped);

  // ── Focus (Work Mode) ──
  const minutes = (rows) => Math.round(rows.reduce((n, r) => n + (r.duration_seconds || 0), 0) / 60);
  const focusWeek = minutes(timers.filter(r => r.session_date >= weekFrom));
  const focusPrev = minutes(timers.filter(r => r.session_date < weekFrom));

  return {
    days,
    doneWeek: sum(days.slice(-7)),
    donePrevWeek: sum(days.slice(-14, -7)),
    habits: { kept: habitRows.filter(p => p.completed).length, total: habitRows.length },
    focus: { week: focusWeek, prevWeek: focusPrev },
    areas: [...byArea.entries()]
      .filter(([key]) => AREAS[key])
      .map(([key, done]) => ({ key, label: AREAS[key].label, color: AREAS[key].color, done }))
      .sort((a, b) => b.done - a.done),
    knowledge: { saved: saved.length, used: saved.filter(row => usesOf(row).length > 0).length },
    feelings: feelingsFrom(days.map(d => d.date), checkins),
  };
}

// The daily check-in (DailyCheckin.js), one series per measure, 1–5.
export const FEELINGS = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'sleep_quality', label: 'Sleep' },
  { key: 'stress', label: 'Stress', lowerIsBetter: true },
];
function feelingsFrom(dates, rows) {
  const byDate = Object.fromEntries((rows || []).map(r => [r.date, r]));
  return {
    count: (rows || []).length,
    series: FEELINGS.map(f => {
      const points = dates.map(date => ({ date, value: byDate[date]?.[f.key] ?? null }));
      const vals = points.map(p => p.value).filter(v => v != null);
      return { ...f, points, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, last: vals.length ? vals[vals.length - 1] : null };
    }),
  };
}

function emptyInsights(today) {
  const days = Array.from({ length: INSIGHT_DAYS }, (_, i) => ({ date: addDays(today, i - (INSIGHT_DAYS - 1)), done: 0 }));
  return {
    days, doneWeek: 0, donePrevWeek: 0,
    habits: { kept: 0, total: 0 }, focus: { week: 0, prevWeek: 0 },
    areas: [], knowledge: { saved: 0, used: 0 },
    feelings: { count: 0, series: [] },
  };
}
