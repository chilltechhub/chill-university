
// src/api/plannerService.js
import { supabase } from './supabaseClient';
import { cacheRead, cacheWrite, isOnline } from './offlineCache';
import { todayStr, dateStr } from '../logic/dateUtils';

export const AREAS = {
  physical:     { label: 'Physical',     emoji: '💪', color: '#e05858', preset: 'physical_starter' },
  mental:       { label: 'Mental',       emoji: '🧠', color: '#8b4fc4', preset: 'mental_starter' },
  social:       { label: 'Social',       emoji: '🤝', color: '#2bb5a0', preset: 'social_starter' },
  financial:    { label: 'Financial',    emoji: '💰', color: '#3ac860', preset: 'financial_starter' },
  professional: { label: 'Professional', emoji: '🚀', color: '#c9a84c', preset: 'professional_starter' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#6b9fe8', preset: 'spiritual_starter' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#e0a830', preset: null },
  digital:      { label: 'Digital',      emoji: '💻', color: '#5a9ae0', preset: null },
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
export async function getInstances(userId, {
  date = null, weekStart = null, weekEnd = null,
  month = null, year = null, area = null,
} = {}) {
  const cacheKey = `planner_instances_${userId}_${date || ''}_${weekStart || ''}_${weekEnd || ''}_${month || ''}_${year || ''}_${area || ''}`;

  if (!(await isOnline())) {
    return (await cacheRead(cacheKey)) || [];
  }

  let q = supabase
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
  return data;
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

// ─── Completion stats ─────────────────────────────────────────────────────────

export async function getCompletionRate(userId, area, cadence, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data } = await supabase
    .from('agenda_instances')
    .select('completed, skipped')
    .eq('user_id', userId)
    .eq('area', area)
    .eq('cadence', cadence)
    .gte('date', dateStr(from));

  if (!data?.length) return null;
  const done = data.filter(d => d.completed).length;
  return Math.round((done / data.length) * 100);
}
