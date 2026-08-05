// src/api/plannerService.js
// Data layer for the planner — components, instances, check-ins

import { supabase } from './supabaseClient';

// ─── Area config ──────────────────────────────────────────────────────────────
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

export async function getInstances(userId, { date = null, weekStart = null, weekEnd = null, month = null, year = null, area = null } = {}) {
  let q = supabase
    .from('agenda_instances')
    .select('*, planner_components(library_screen, duration_minutes)')
    .eq('user_id', userId)
    .order('start_time', { ascending: true, nullsFirst: true })
    .order('area');

  if (date)                q = q.eq('date', date);
  if (weekStart && weekEnd) q = q.gte('date', weekStart).lte('date', weekEnd);
  if (month && year)        q = q.gte('date', `${year}-${String(month).padStart(2,'0')}-01`).lte('date', `${year}-${String(month).padStart(2,'0')}-31`);
  if (area)                q = q.eq('area', area);

  const { data, error } = await q;
  if (error) throw error;
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
    })
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

// ─── Rolling window generation ────────────────────────────────────────────────
// Call after user subscribes to a component to generate upcoming instances

export async function generateInstances(userId, component) {
  const today = new Date();
  const instances = [];

  if (component.cadence === 'daily') {
    // 30 days out
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      instances.push(d.toISOString().split('T')[0]);
    }
  } else if (component.cadence === 'weekly') {
    // 12 weeks out — one per week on Monday
    for (let i = 0; i < 12; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i * 7);
      // find next Monday
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? 1 : day === 1 ? 0 : 8 - day));
      instances.push(d.toISOString().split('T')[0]);
    }
  } else if (component.cadence === 'monthly') {
    // 6 months out — first of each month
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      instances.push(d.toISOString().split('T')[0]);
    }
  }

  // Batch insert — ignore conflicts (unique constraint: user+component+date)
  if (instances.length) {
    const rows = instances.map(date => ({
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
    if (error) console.warn('generateInstances', error);
  }
}

// ─── Completion stats ─────────────────────────────────────────────────────────

export async function getCompletionRate(userId, area, cadence, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().split('T')[0];

  const { data } = await supabase
    .from('agenda_instances')
    .select('completed, skipped')
    .eq('user_id', userId)
    .eq('area', area)
    .eq('cadence', cadence)
    .gte('date', fromStr);

  if (!data?.length) return null;
  const done = data.filter(d => d.completed).length;
  return Math.round((done / data.length) * 100);
}
