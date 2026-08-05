// src/api/captureService.js
// All Supabase + offline cache operations for the Capture Inbox,
// Projects, Tasks, and Save for Later

import { supabase } from './supabaseClient';
import { cacheWrite, cacheRead, queueWrite, isOnline, smartFetch } from './offlineCache';

// ─── CAPTURES ─────────────────────────────────────────────────────────────────

export async function getCaptures(userId, { status = 'inbox', type = null } = {}) {
  const cacheKey = `captures_${userId}_${status}_${type || 'all'}`;

  const fetchFn = async () => {
    let q = supabase
      .from('captures')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (type) q = q.eq('type', type);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const online = await isOnline();
  if (!online) return (await cacheRead(cacheKey)) || [];

  const data = await fetchFn();
  await cacheWrite(cacheKey, data);
  return data;
}

export async function getSaveForLater(userId, type = null) {
  // type: 'read' | 'watch' | null (both)
  const cacheKey = `save_later_${userId}_${type || 'all'}`;

  const fetchFn = async () => {
    let q = supabase
      .from('captures')
      .select('*')
      .eq('user_id', userId)
      .not('save_for_later', 'is', null)
      .eq('completed', false)
      .order('created_at', { ascending: false });
    if (type) q = q.eq('save_for_later', type);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const online = await isOnline();
  if (!online) return (await cacheRead(cacheKey)) || [];
  const data = await fetchFn();
  await cacheWrite(cacheKey, data);
  return data;
}

export async function addCapture(userId, capture) {
  // Build the item
  const item = {
    user_id: userId,
    type: capture.type || 'note',
    title: capture.title || null,
    body: capture.body || null,
    url: capture.url || null,
    url_meta: capture.url_meta || {},
    tags: capture.tags || [],
    project_id: capture.project_id || null,
    life_area_id: capture.life_area_id || null,
    save_for_later: capture.save_for_later || null,
    status: 'inbox',
    source: capture.source || 'manual',
  };

  const online = await isOnline();
  if (online) {
    const { data, error } = await supabase
      .from('captures')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Offline — create local item with temp id
    const localItem = {
      ...item,
      id: 'local_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await queueWrite({ type: 'INSERT', table: 'captures', data: item });
    return localItem;
  }
}

export async function updateCapture(captureId, updates) {
  const { data, error } = await supabase
    .from('captures')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', captureId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archiveCapture(captureId) {
  return updateCapture(captureId, { status: 'archived' });
}

export async function moveToProject(captureId, projectId) {
  return updateCapture(captureId, { project_id: projectId, status: 'organized' });
}

export async function saveForLater(captureId, type) {
  // type: 'read' | 'watch'
  return updateCapture(captureId, { save_for_later: type });
}

export async function deleteCapture(captureId) {
  const { error } = await supabase
    .from('captures')
    .delete()
    .eq('id', captureId);
  if (error) throw error;
}

// ─── URL METADATA ─────────────────────────────────────────────────────────────
// Fetch page title/description when user pastes a link

export async function fetchUrlMeta(url) {
  try {
    // Use a free metadata API
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=true`;
    const res = await fetch(apiUrl);
    const json = await res.json();
    if (json.status === 'success') {
      return {
        title: json.data.title || url,
        description: json.data.description || '',
        image: json.data.image?.url || null,
        site_name: json.data.publisher || '',
        favicon: json.data.logo?.url || null,
      };
    }
  } catch {}
  // Fallback — just use the URL
  try {
    const { hostname } = new URL(url);
    return { title: hostname, description: '', site_name: hostname };
  } catch {
    return { title: url, description: '' };
  }
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export async function getProjects(userId, status = null) {
  const cacheKey = `projects_${userId}_${status || 'all'}`;

  const fetchFn = async () => {
    let q = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const online = await isOnline();
  if (!online) return (await cacheRead(cacheKey)) || [];
  const data = await fetchFn();
  await cacheWrite(cacheKey, data);
  return data;
}

export async function upsertProject(userId, project) {
  const { data, error } = await supabase
    .from('projects')
    .upsert({
      user_id: userId,
      ...project,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  if (error) throw error;
}

export async function getProjectCaptures(projectId) {
  const { data, error } = await supabase
    .from('captures')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function getTasks(userId, { date = null, completed = null, category = null } = {}) {
  const d = date || new Date().toISOString().split('T')[0];
  const cacheKey = `tasks_${userId}_${d}`;

  const fetchFn = async () => {
    let q = supabase
      .from('tasks')
      .select('*, projects(title, color, emoji)')
      .eq('user_id', userId)
      .or(`due_date.eq.${d},due_date.is.null`)
      .order('priority')
      .order('sort_order');
    if (completed !== null) q = q.eq('completed', completed);
    if (category) q = q.eq('category', category);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const online = await isOnline();
  if (!online) return (await cacheRead(cacheKey)) || [];
  const data = await fetchFn();
  await cacheWrite(cacheKey, data);
  return data;
}

export async function upsertTask(userId, task) {
  const item = {
    user_id: userId,
    title: task.title,
    notes: task.notes || null,
    category: task.category || 'personal',
    project_id: task.project_id || null,
    life_area_id: task.life_area_id || null,
    schedule_block: task.schedule_block || 'anytime',
    due_date: task.due_date || new Date().toISOString().split('T')[0],
    repeat: task.repeat || 'none',
    priority: task.priority || 2,
    estimated_minutes: task.estimated_minutes || null,
    sort_order: task.sort_order || 0,
    ...(task.id ? { id: task.id } : {}),
  };

  const online = await isOnline();
  if (online) {
    const { data, error } = await supabase
      .from('tasks')
      .upsert(item)
      .select('*, projects(title, color, emoji)')
      .single();
    if (error) throw error;
    return data;
  } else {
    const localItem = {
      ...item,
      id: item.id || 'local_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    await queueWrite({ type: 'UPSERT', table: 'tasks', data: item });
    return localItem;
  }
}

export async function completeTask(taskId, completed = true) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

// Handle repeating tasks — create next occurrence when completed
export async function handleRepeat(task) {
  if (!task.repeat || task.repeat === 'none') return;
  const next = new Date(task.due_date || new Date());
  switch (task.repeat) {
    case 'daily':    next.setDate(next.getDate() + 1); break;
    case 'weekdays':
      next.setDate(next.getDate() + 1);
      while ([0, 6].includes(next.getDay())) next.setDate(next.getDate() + 1);
      break;
    case 'weekly':   next.setDate(next.getDate() + 7); break;
    case 'monthly':  next.setMonth(next.getMonth() + 1); break;
  }
  await upsertTask(task.user_id, {
    ...task,
    id: undefined,
    completed: false,
    completed_at: null,
    due_date: next.toISOString().split('T')[0],
  });
}
