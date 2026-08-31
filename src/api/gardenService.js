// src/api/gardenService.js

import { supabase } from './supabaseClient';

// ─── Cores ────────────────────────────────────────────────────────────────────

export async function getCores(userId) {
  const { data, error } = await supabase
    .from('garden_cores')
    .select('*, garden_petals(*), garden_updates(*)')
    .eq('user_id', userId)
    .is('deleted_at', null)
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

// Soft delete — moves the idea to Recently Deleted (Capture Inbox) for 7
// days instead of removing it. See src/api/trashService.js.
export async function deleteCore(coreId) {
  const { error } = await supabase
    .from('garden_cores')
    .update({ deleted_at: new Date().toISOString() })
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

// ─── Workshop link (idea ⇄ real project) ───────────────────────────────────
// An idea and a project can point at the same record via garden_cores.project_id
// (see supabase/migrations/20260826_link_garden_cores_to_projects.sql). Once
// linked, the two screens share one title/objective and the garden shows the
// project's real task progress instead of a hand-set number.

const PLANT_EMOJI = { tree: '🏗️', flower: '💡', plant: '🌱', sprout: '🌱' };

// Turn an idea into a real Workshop build: creates the project row and links
// this core to it.
export async function promoteCoreToProject(userId, core) {
  const { data: project, error } = await supabase.from('projects').insert({
    user_id: userId,
    title: core.title,
    objective: core.description || null,
    emoji: PLANT_EMOJI[core.plant_type] || '🌱',
    color: core.color || '#2e7d32',
    cover_color: core.color || '#2e7d32',
    banner_emoji: PLANT_EMOJI[core.plant_type] || '🌱',
    category: 'general',
    status: 'active',
    sort_order: 0,
  }).select().single();
  if (error) throw error;

  await supabase.from('project_milestones').insert({
    user_id: userId, project_id: project.id,
    title: '🌱 Grown from an idea in the Garden', type: 'project_created',
    date: new Date().toISOString().split('T')[0],
  });

  const { data: updatedCore, error: coreErr } = await supabase
    .from('garden_cores')
    .update({ project_id: project.id, updated_at: new Date().toISOString() })
    .eq('id', core.id)
    .select('*, garden_petals(*), garden_updates(*)')
    .single();
  if (coreErr) throw coreErr;

  return { core: updatedCore, project };
}

// Plant an existing Workshop build as an idea in the Garden.
export async function plantProjectAsIdea(userId, project) {
  const { data, error } = await supabase.from('garden_cores').insert({
    user_id: userId,
    project_id: project.id,
    title: project.title,
    description: project.objective || null,
    plant_type: 'tree',
    is_project: false,
    color: project.color || '#2e7d32',
    color_light: project.color || '#a5d6a7',
    pos_x: 0.15 + Math.random() * 0.7,
    pos_y: 0.15 + Math.random() * 0.55,
  }).select('*, garden_petals(*), garden_updates(*)').single();
  if (error) throw error;
  return data;
}

// Break the link without deleting either record.
export async function unlinkCoreFromProject(coreId) {
  const { data, error } = await supabase
    .from('garden_cores')
    .update({ project_id: null, updated_at: new Date().toISOString() })
    .eq('id', coreId)
    .select('*, garden_petals(*), garden_updates(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function getCoreForProject(userId, projectId) {
  const { data, error } = await supabase
    .from('garden_cores')
    .select('*, garden_petals(*), garden_updates(*)')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Real task-completion progress + live title/status for every linked
// project, keyed by project_id — this is what the garden shows instead of
// the old hand-set project_progress number, once a core is linked.
export async function getLinkedProjectInfo(projectIds) {
  if (!projectIds || !projectIds.length) return {};
  const [{ data: projects }, { data: taskRows }] = await Promise.all([
    supabase.from('projects').select('id, title, objective, status, color, emoji').in('id', projectIds).is('deleted_at', null),
    supabase.from('project_tasks').select('project_id, completed').in('project_id', projectIds),
  ]);
  const byProject = {};
  (taskRows || []).forEach(tk => {
    if (!byProject[tk.project_id]) byProject[tk.project_id] = { total: 0, done: 0 };
    byProject[tk.project_id].total += 1;
    if (tk.completed) byProject[tk.project_id].done += 1;
  });
  const out = {};
  (projects || []).forEach(p => {
    const t = byProject[p.id] || { total: 0, done: 0 };
    out[p.id] = { ...p, tasksTotal: t.total, tasksDone: t.done, pct: t.total > 0 ? Math.round((t.done / t.total) * 100) : null };
  });
  return out;
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