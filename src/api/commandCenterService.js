// src/api/commandCenterService.js
// All Supabase calls for the Library Command Center

import { supabase } from './supabaseClient';
import { todayStr, dateStr } from '../logic/dateUtils';

const today = todayStr; // local calendar — see logic/dateUtils

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
    .gte('session_date', dateStr(weekAgo));
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
//
// Removed. This was a second implementation of the streak that wrote
// streak_count/last_active_date to `user_settings`, while the whole app reads
// them off `profiles` — and it had no callers, so it never ran either way.
// The single source of truth is now gamificationService.touchStreak(), called
// once per profile load from UserProgressContext.
