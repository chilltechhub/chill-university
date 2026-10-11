
// src/api/plannerService.js
import { supabase, unscoped } from './profileScopedClient';
import { getActiveProfileId } from '../logic/activeProfile';
import { cacheRead, cacheWrite, isOnline } from './offlineCache';
import { todayStr, dateStr } from '../logic/dateUtils';
import { AREA_COLORS } from '../data/areaColors';
import { recordAction } from '../logic/gamificationService';
import { addDaysIso, addMonthsIso } from '../logic/aiBridgeFormat';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AREAS = {
  physical:     { label: 'Physical',     emoji: '💪', color: AREA_COLORS.physical, preset: 'physical_starter' },
  mental:       { label: 'Mental',       emoji: '🧠', color: AREA_COLORS.mental, preset: 'mental_starter' },
  social:       { label: 'Social',       emoji: '🤝', color: AREA_COLORS.social, preset: 'social_starter' },
  financial:    { label: 'Financial',    emoji: '💰', color: AREA_COLORS.financial, preset: 'financial_starter' },
  professional: { label: 'Professional', emoji: '🚀', color: AREA_COLORS.professional, preset: 'professional_starter' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: AREA_COLORS.spiritual, preset: 'spiritual_starter' },
  creative:     { label: 'Creative',     emoji: '🎨', color: AREA_COLORS.creative, preset: null },
  digital:      { label: 'Digital',      emoji: '💻', color: AREA_COLORS.digital, preset: null },
};

export const CADENCES = ['daily', 'weekly', 'monthly'];

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function getCheckin(userId, date) {
  const { data } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  return data;
}

export async function upsertCheckin(userId, date, fields) {
  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert({ user_id: userId, date, ...fields })
    .select()
    .single();
  if (error) throw error;
  recordAction('checkin', date);
  return data;
}

// ─── Components ───────────────────────────────────────────────────────────────

export async function getSystemComponents(area = null, cadence = null) {
  let q = supabase
    .from('planner_components')
    .select('*')
    .eq('is_system', true)
    .eq('active', true)
    .order('sort_order');
  if (area)    q = q.eq('area', area);
  if (cadence) q = q.eq('cadence', cadence);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getPresetComponents(presetId) {
  const { data, error } = await supabase
    .from('planner_components')
    .select('*')
    .eq('preset_id', presetId)
    .eq('is_system', true)
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function getUserSubscriptions(userId) {
  const { data, error } = await supabase
    .from('user_planner_components')
    .select('*, planner_components(*)')
    .eq('user_id', userId)
    .eq('enabled', true);
  if (error) throw error;
  return (data || []).map(row => ({ ...row.planner_components, sub_id: row.id }));
}

// The weekly and monthly series someone made themselves in the Planner
// ("Repeats: Monthly"), one row per series. Those live as agenda_instances
// with a cadence, not as subscriptions, so a list built only from
// getUserSubscriptions never showed them.
export async function getRepeatingPlans(userId, cadences = ['weekly', 'monthly']) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('agenda_instances')
    .select('id, title, area, cadence, start_time, component_id, date')
    .eq('user_id', userId)
    .in('cadence', cadences)
    .gte('date', addDaysIso(todayStr(), -35))
    .order('date', { ascending: false })
    .limit(500);
  if (error) throw error;
  const seen = new Map();
  (data || []).forEach(row => { if (!seen.has(seriesKey(row))) seen.set(seriesKey(row), row); });
  return [...seen.values()];
}

export async function subscribeToComponent(userId, componentId) {
  const { error } = await supabase
    .from('user_planner_components')
    .upsert({ user_id: userId, component_id: componentId, enabled: true });
  if (error) throw error;
}

export async function subscribeToPreset(userId, presetId) {
  const components = await getPresetComponents(presetId);
  if (!components.length) return [];
  for (const comp of components) {
    await subscribeToComponent(userId, comp.id);
  }
  return components;
}

export async function unsubscribeFromComponent(userId, componentId) {
  await supabase
    .from('user_planner_components')
    .update({ enabled: false })
    .eq('user_id', userId)
    .eq('component_id', componentId);
}

// ─── Instances ────────────────────────────────────────────────────────────────

// Cache-first, one shared implementation for every view (Daily/Weekly/
// Monthly all call through here with different date-range params) — fixing
// this once here covers all three instead of patching each view's load().
// `allProfiles` widens the read across every profile this user owns — the
// planner's "All" view. Rows are still restricted to the user by RLS; this
// only drops the per-profile filter. Items remain owned by the profile that
// created them either way.
export async function getInstances(userId, {
  date = null, weekStart = null, weekEnd = null,
  month = null, year = null, area = null, allProfiles = false,
} = {}) {
  // Cache key carries the scope and the active profile, or switching either
  // one serves the other view's rows back from cache.
  const scopeKey = allProfiles ? 'all' : (getActiveProfileId() || 'none');
  const cacheKey = `planner_instances_${userId}_${date || ''}_${weekStart || ''}_${weekEnd || ''}_${month || ''}_${year || ''}_${area || ''}_${scopeKey}`;

  if (!(await isOnline())) {
    return (await cacheRead(cacheKey)) || [];
  }

  let q = (allProfiles ? unscoped : supabase)
    .from('agenda_instances')
    .select('*, planner_components(library_screen, duration_minutes)')
    .eq('user_id', userId)
    .order('area');

  if (date)                 q = q.eq('date', date);
  if (weekStart && weekEnd) q = q.gte('date', weekStart).lte('date', weekEnd);
  if (month && year) {
    // `month` is 1-based (1=Jan..12=Dec); Date's day-0-of-next-month trick
    // gives the real last day (28-31) instead of hardcoding 31, which
    // produced an invalid date like "2026-09-31" for any 30-day month.
    const lastDay = new Date(year, month, 0).getDate();
    q = q.gte('date', `${year}-${String(month).padStart(2,'0')}-01`)
         .lte('date', `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`);
  }
  if (area)                 q = q.eq('area', area);

  const { data, error } = await q;
  if (error) {
    // A transient failure (e.g. connection dropped mid-request, isOnline()
    // said yes a moment ago) should still fall back to cache rather than
    // throw and blank the view.
    const cached = await cacheRead(cacheKey);
    if (cached) return cached;
    throw error;
  }
  await cacheWrite(cacheKey, data || []);
  return data || [];
}

export async function createInstance(userId, component, date, startTime = null) {
  const { data, error } = await supabase
    .from('agenda_instances')
    .upsert({
      user_id:          userId,
      component_id:     component.id,
      title:            component.title,
      area:             component.area,
      cadence:          component.cadence,
      type:             component.type,
      date,
      start_time:       startTime,
      duration_minutes: component.duration_minutes,
    }, { onConflict: 'user_id,component_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeInstance(instanceId, completed = true) {
  const { data, error } = await supabase
    .from('agenda_instances')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', instanceId)
    .select()
    .single();
  if (error) throw error;
  // Real work counts: a little XP and the day's streak (record_action).
  if (completed) {
    recordAction('planner_done', instanceId);
    planDoneListeners.forEach(fn => { try { fn(data); } catch { /* a listener's problem, not the save's */ } });
  }
  return data;
}

// "Something planned got done", for goal steps that wait on it
// (objectives.js signal 'planner-item-done'). Done is ticked from six places
// (Planner, Home, the detail sheet, the backlog, a reminder's action...), all
// through completeInstance, so AccessContext listens here once instead.
const planDoneListeners = new Set();
export function onPlanDone(fn) {
  planDoneListeners.add(fn);
  return () => planDoneListeners.delete(fn);
}

export async function skipInstance(instanceId) {
  const { data, error } = await supabase
    .from('agenda_instances')
    .update({ skipped: true })
    .eq('id', instanceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Missed-instance handling (Do Now / Move / Drop) ─────────────────────────
// "Do Now" is completeInstance(id, true) and "Drop" is skipInstance above —
// this is the one piece those two didn't already cover: moving a missed
// instance's date forward so it reappears on an actual day instead of
// aging in the Missed section forever. Defaults to today (PlannerScreen's
// one-tap "Move" action); pass a date to reschedule further out.
export async function rescheduleInstance(instanceId, date = null) {
  const targetDate = date || todayStr();
  const { data, error } = await supabase
    .from('agenda_instances')
    .update({ date: targetDate })
    .eq('id', instanceId)
    .select()
    .single();
  if (error) {
    // A recurring habit's rolling-window generator (generateInstances,
    // below) may have already created *today's own* occurrence of this
    // same component, which collides with agenda_instances' (user_id,
    // component_id, date) unique constraint when this missed one tries to
    // move onto the same date. That fresh instance already covers today,
    // so the stale missed one is redundant — drop it instead of
    // surfacing a raw conflict.
    if (error.code === '23505') return skipInstance(instanceId);
    throw error;
  }
  return data;
}

export async function unskipInstance(instanceId) {
  const { data, error } = await supabase
    .from('agenda_instances')
    .update({ skipped: false })
    .eq('id', instanceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Deletes rows by id, cancelling any phone reminder on each first. Hard
// delete, same as the Planner's trash button always was.
export async function deleteInstances(ids) {
  if (!ids.length) return;
  // Required here, not imported: planReminderActions imports this file.
  const { cancelPlanReminder } = require('../logic/planReminderActions');
  for (const id of ids) { try { await cancelPlanReminder(id); } catch { /* not scheduled */ } }
  const { error } = await supabase.from('agenda_instances').delete().in('id', ids);
  if (error) throw error;
}

// The later copies of a repeating item, this one included. A repeat is
// stored as one row per day with nothing tying them together, so a series
// is: same library component if it came from one, else same title, time and
// repeat, from this day on and not yet done.
export async function getSeriesFrom(instance) {
  let q = supabase.from('agenda_instances')
    .select('id, date, completed')
    .eq('user_id', instance.user_id)
    .gte('date', instance.date);
  if (instance.component_id) q = q.eq('component_id', instance.component_id);
  else {
    q = q.is('component_id', null).eq('title', instance.title).eq('cadence', instance.cadence || 'daily');
    q = instance.start_time ? q.eq('start_time', instance.start_time) : q.is('start_time', null);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).filter(r => r.id === instance.id || !r.completed);
}

// Rows around today, for the "Remove duplicates" clean-up.
export async function getInstancesBetween(userId, from, to) {
  const { data, error } = await supabase.from('agenda_instances')
    .select('id, title, date, start_time, completed, skipped, created_at')
    .eq('user_id', userId).gte('date', from).lte('date', to);
  if (error) throw error;
  return data || [];
}

export async function addNoteToInstance(instanceId, notes) {
  const { data, error } = await supabase
    .from('agenda_instances')
    .update({ notes })
    .eq('id', instanceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Generate rolling window of instances ────────────────────────────────────

export async function generateInstances(userId, component) {
  const today = new Date();
  const dates = [];

  if (component.cadence === 'daily') {
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(dateStr(d));
    }
  } else if (component.cadence === 'weekly') {
    for (let i = 0; i < 12; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i * 7);
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? 1 : day === 1 ? 0 : 8 - day));
      dates.push(dateStr(d));
    }
  } else if (component.cadence === 'monthly') {
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      // Local midnight on the 1st serialised through toISOString() lands on the
      // *last day of the previous month* west of Greenwich, so monthly habits
      // were being generated on the 30th/31st instead of the 1st.
      dates.push(dateStr(d));
    }
  }

  if (!dates.length) return;

  const rows = dates.map(date => ({
    user_id:          userId,
    component_id:     component.id,
    title:            component.title,
    area:             component.area,
    cadence:          component.cadence,
    type:             component.type,
    date,
    duration_minutes: component.duration_minutes,
  }));

  const { error } = await supabase
    .from('agenda_instances')
    .upsert(rows, { onConflict: 'user_id,component_id,date' });

  if (error) console.warn('generateInstances error', error);
}

// ─── Keeping repeating plans going ───────────────────────────────────────────
// A repeating item is stored as one row per day, written ahead of time: the
// Planner's Add wrote 7 days of a daily habit (4 weeks, 3 months), the
// starter templates 30 days. Nothing ever wrote more, so a habit quietly
// disappeared after its first week, along with the Habits card on Home that
// counts it. This tops each running series up so it always reaches a couple
// of weeks ahead. Runs at most once a day per account on this device.
//
// A series is the same item repeating: one template (component_id), or the
// same title, cadence and time for something added by hand (the same match
// getSeriesFrom uses to delete "this and the rest").
//
// Three cases must NOT come back: a series someone ended ("Delete this and
// the rest": markSeriesStopped sets its last remaining day's `type` to
// SERIES_END, in the database, so every device and a fresh sign-in see it;
// adding the habit again writes newer rows, which start it over); one nobody has had on their
// plan for a while (its last day is more than GRACE_DAYS ago, so the person
// stopped, or deleted it on another device); and a single day that was
// edited ("changes apply to this day only" gives that one row a new time,
// which on its own looks like a new series, so a series needs two rows).
// Far enough that a month view never shows a habit just stopping (the user
// asked "is daily only up to 7 days?", 2026-10-10). Reminders aren't
// written per row here, so this costs rows, not notifications.
const AHEAD_DAYS = { daily: 42, weekly: 91, monthly: 183 };
const GRACE_DAYS = 3;
const topupKey = (userId) => `@cth_planner_topup_${userId}_${getActiveProfileId() || 'none'}`;
export const SERIES_END = 'series_end';

export function seriesKey(row) {
  if (row.component_id) return `c:${row.component_id}`;
  return `t:${String(row.title || '').trim().toLowerCase()}|${row.cadence || ''}|${row.start_time || ''}`;
}

// Called after someone deletes "this and the rest" of a repeating item:
// marks the day before as where the series ends.
export async function markSeriesStopped(userId, instance) {
  if (!userId || !instance || !instance.cadence || instance.cadence === 'once') return;
  let q = supabase.from('agenda_instances').select('id')
    .eq('user_id', userId).lt('date', instance.date)
    .order('date', { ascending: false }).limit(1);
  if (instance.component_id) q = q.eq('component_id', instance.component_id);
  else {
    q = q.is('component_id', null).eq('title', instance.title).eq('cadence', instance.cadence);
    q = instance.start_time ? q.eq('start_time', instance.start_time) : q.is('start_time', null);
  }
  const { data, error } = await q;
  if (error) { console.warn('markSeriesStopped', error.message); return; }
  // Nothing earlier left: the whole series is gone, so there is nothing to extend.
  if (!data?.length) return;
  const { error: upErr } = await supabase.from('agenda_instances').update({ type: SERIES_END }).eq('id', data[0].id);
  if (upErr) console.warn('markSeriesStopped', upErr.message);
}

const nextDate = (iso, cadence) => (
  cadence === 'daily' ? addDaysIso(iso, 1)
    : cadence === 'weekly' ? addDaysIso(iso, 7)
      : addMonthsIso(iso, 1)
);

/**
 * Extends every running repeating series so it reaches AHEAD_DAYS past today.
 * @returns {Promise<number>} rows added
 */
// Home and the Planner both call this on load; one run at a time, or two
// first-of-the-day loads would each write the same days.
let topupRun = null;
export function extendRepeatingPlans(userId, opts) {
  if (!topupRun) topupRun = runTopup(userId, opts).finally(() => { topupRun = null; });
  return topupRun;
}

async function runTopup(userId, { force = false } = {}) {
  if (!userId || !(await isOnline())) return 0;
  const today = todayStr();
  if (!force) {
    try { if (await AsyncStorage.getItem(topupKey(userId)) === today) return 0; } catch { /* run anyway */ }
  }
  const read = (cols) => supabase
    .from('agenda_instances')
    .select(cols)
    .eq('user_id', userId)
    .in('cadence', ['daily', 'weekly', 'monthly'])
    .gte('date', addDaysIso(today, -35))
    .order('date', { ascending: false })
    .limit(3000);
  const base = 'title, area, cadence, type, start_time, duration_minutes, component_id, date';
  let { data, error } = await read(`${base}, link_type, link_screen, link_id`);
  // A database without the planner-link columns still gets its habits kept.
  if (error) ({ data, error } = await read(base));
  if (error) { console.warn('extendRepeatingPlans', error.message); return 0; }

  const latest = new Map();
  const count = new Map();
  (data || []).forEach(row => {
    const key = seriesKey(row);
    if (!latest.has(key)) latest.set(key, row);
    count.set(key, (count.get(key) || 0) + 1);
  });
  const since = addDaysIso(today, -GRACE_DAYS);

  const fresh = [];
  latest.forEach((row, key) => {
    if (row.type === SERIES_END || row.date < since || count.get(key) < 2) return;
    const until = addDaysIso(today, AHEAD_DAYS[row.cadence] || 14);
    for (let d = nextDate(row.date, row.cadence); d <= until; d = nextDate(d, row.cadence)) {
      fresh.push({
        user_id: userId,
        title: row.title, area: row.area, cadence: row.cadence, type: row.type || 'checklist',
        start_time: row.start_time, duration_minutes: row.duration_minutes,
        component_id: row.component_id,
        ...(row.link_type ? { link_type: row.link_type, link_screen: row.link_screen, link_id: row.link_id } : {}),
        date: d, completed: false, skipped: false,
      });
    }
  });

  if (fresh.length) {
    const templated = fresh.filter(r => r.component_id);
    const custom = fresh.filter(r => !r.component_id);
    const writes = [];
    if (templated.length) writes.push(supabase.from('agenda_instances').upsert(templated, { onConflict: 'user_id,component_id,date' }));
    if (custom.length) writes.push(supabase.from('agenda_instances').insert(custom));
    const results = await Promise.all(writes);
    const failed = results.find(r => r.error);
    if (failed) { console.warn('extendRepeatingPlans write', failed.error.message); return 0; }
  }
  try { await AsyncStorage.setItem(topupKey(userId), today); } catch { /* runs again next time */ }
  return fresh.length;
}

// ─── Completion stats ─────────────────────────────────────────────────────────

// Areas holding custom items (the Planner's "+ Add", component_id null) at
// this cadence in the last `days` days. Those rows never touch
// user_planner_components, so getUserSubscriptions can't see them.
export async function getCustomItemAreas(userId, cadence, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data, error } = await supabase
    .from('agenda_instances')
    .select('area')
    .eq('user_id', userId)
    .eq('cadence', cadence)
    .is('component_id', null)
    .gte('date', dateStr(from))
    .lte('date', todayStr());
  if (error) throw error;
  return [...new Set((data || []).map(r => r.area).filter(Boolean))];
}

export async function getCompletionRate(userId, area, cadence, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const today = todayStr();
  const { data } = await supabase
    .from('agenda_instances')
    .select('date, completed, skipped')
    .eq('user_id', userId)
    .eq('area', area)
    .eq('cadence', cadence)
    .gte('date', dateStr(from))
    // generateInstances writes a daily habit 30 days ahead, so without an
    // upper bound every future (necessarily unticked) row counted against
    // the "last N days" rate.
    .lte('date', today);

  // Today isn't over: an unticked row for today isn't a miss yet. Counting
  // it made a habit added this morning read "0%" in red on day one.
  const counted = (data || []).filter(d => d.date !== today || d.completed);
  if (!counted.length) return null;
  const done = counted.filter(d => d.completed).length;
  return Math.round((done / counted.length) * 100);
}
