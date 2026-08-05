// src/api/gardenService.js

import { supabase } from './supabaseClient';

// ─── Cores ────────────────────────────────────────────────────────────────────

export async function getCores(userId) {
  const { data, error } = await supabase
    .from('garden_cores')
    .select('*, garden_petals(*), garden_updates(*)')
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function upsertCore(userId, core) {
  const { data, error } = await supabase
    .from('garden_cores')
    .upsert({
      user_id: userId,
      ...core,
      updated_at: new Date().toISOString(),
    })
    .select('*, garden_petals(*), garden_updates(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCorePosition(coreId, posX, posY) {
  const { error } = await supabase
    .from('garden_cores')
    .update({ pos_x: posX, pos_y: posY, updated_at: new Date().toISOString() })
    .eq('id', coreId);
  if (error) throw error;
}

export async function updateCoreProgress(coreId, progress) {
  const { error } = await supabase
    .from('garden_cores')
    .update({ project_progress: progress, updated_at: new Date().toISOString() })
    .eq('id', coreId);
  if (error) throw error;
}

export async function deleteCore(coreId) {
  const { error } = await supabase
    .from('garden_cores')
    .delete()
    .eq('id', coreId);
  if (error) throw error;
}

// ─── Petals ───────────────────────────────────────────────────────────────────

export async function addPetal(userId, coreId, petal) {
  const { data, error } = await supabase
    .from('garden_petals')
    .insert({ user_id: userId, core_id: coreId, ...petal })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePetal(petalId, updates) {
  const { data, error } = await supabase
    .from('garden_petals')
    .update(updates)
    .eq('id', petalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePetal(petalId) {
  const { error } = await supabase
    .from('garden_petals')
    .delete()
    .eq('id', petalId);
  if (error) throw error;
}

export async function togglePetal(petalId, completed) {
  const { error } = await supabase
    .from('garden_petals')
    .update({ completed })
    .eq('id', petalId);
  if (error) throw error;
}

// ─── Vines ────────────────────────────────────────────────────────────────────

export async function getVines(userId) {
  const { data, error } = await supabase
    .from('garden_vines')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function addVine(userId, coreA, coreB, label = null) {
  const { data, error } = await supabase
    .from('garden_vines')
    .insert({ user_id: userId, core_a: coreA, core_b: coreB, label })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVine(vineId, updates) {
  const { data, error } = await supabase
    .from('garden_vines')
    .update(updates)
    .eq('id', vineId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVine(vineId) {
  const { error } = await supabase
    .from('garden_vines')
    .delete()
    .eq('id', vineId);
  if (error) throw error;
}

// ─── Updates / Log ────────────────────────────────────────────────────────────

export async function addUpdate(userId, coreId, entry) {
  const { data, error } = await supabase
    .from('garden_updates')
    .insert({ user_id: userId, core_id: coreId, entry })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUpdate(updateId) {
  const { error } = await supabase
    .from('garden_updates')
    .delete()
    .eq('id', updateId);
  if (error) throw error;
}