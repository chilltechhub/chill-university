// src/api/commandCenterService.js
// All Supabase calls for the Library Command Center

import { supabase } from './supabaseClient';

const today = () => new Date().toISOString().split('T')[0];

// ─── User Settings ────────────────────────────────────────────────────────────

export async function getSettings(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertSettings(userId, settings) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Life Areas ───────────────────────────────────────────────────────────────

export async function getLifeAreas(userId) {
  const { data, error } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function upsertLifeArea(userId, area) {
  const { data, error } = await supabase
    .from('life_areas')
    .upsert({ user_id: userId, ...area })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLifeAreaProgress(areaId, progress) {
  // progress is 1-5 weekly rating
  const { error } = await supabase
    .from('life_areas')
    .update({ progress, last_check_date: new Date().toISOString() })
    .eq('id', areaId);
  if (error) throw error;
}

export async function deleteLifeArea(areaId) {
  const { error } = await supabase
    .from('life_areas')
    .delete()
    .eq('id', areaId);
  if (error) throw error;
}

export async function insertLifeAreas(userId, areas) {
  const rows = areas.map((a, i) => ({ user_id: userId, ...a, sort_order: i }));
  const { data, error } = await supabase
    .from('life_areas')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

// ─── Daily Focus ──────────────────────────────────────────────────────────────

export async function getTodayFocus(userId) {
  const { data, error } = await supabase
    .from('daily_focus')
    .select('*')
    .eq('user_id', userId)
    .eq('focus_date', today())
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertTodayFocus(userId, focusText, tags = []) {
  const { data, error } = await supabase
    .from('daily_focus')
    .upsert({ user_id: userId, focus_date: today(), focus_text: focusText, tags })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Timer Sessions ───────────────────────────────────────────────────────────

export async function getTodaySessions(userId) {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', today());
  if (error) throw error;
  return data || [];
}

export async function getWeekSeconds(userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('session_date', weekAgo.toISOString().split('T')[0]);
  if (error) throw error;
  return (data || []).reduce((sum, s) => sum + s.duration_seconds, 0);
}

export async function saveTimerSession(userId, durationSeconds, lifeAreaId = null) {
  const { data, error } = await supabase
    .from('timer_sessions')
    .insert({
      user_id: userId,
      session_date: today(),
      duration_seconds: durationSeconds,
      life_area_id: lifeAreaId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Priority Tasks ───────────────────────────────────────────────────────────

export async function getTodayTasks(userId) {
  const { data, error } = await supabase
    .from('priority_tasks')
    .select('*, life_areas(label, color)')
    .eq('user_id', userId)
    .eq('task_date', today())
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function upsertTask(userId, task) {
  const { data, error } = await supabase
    .from('priority_tasks')
    .upsert({ user_id: userId, task_date: today(), ...task })
    .select('*, life_areas(label, color)')
    .single();
  if (error) throw error;
  return data;
}

export async function toggleTaskComplete(taskId, completed) {
  const { error } = await supabase
    .from('priority_tasks')
    .update({ completed })
    .eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('priority_tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw error;
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

export async function updateStreak(userId) {
  const settings = await getSettings(userId);
  const lastActive = settings?.last_active_date;
  const todayStr = today();
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = settings?.streak_count || 0;
  if (lastActive === yesterdayStr) {
    newStreak += 1;
  } else if (lastActive !== todayStr) {
    newStreak = 1;
  }

  await upsertSettings(userId, {
    streak_count: newStreak,
    last_active_date: todayStr,
  });
  return newStreak;
}
