// src/api/captureService.js
// All Supabase + offline cache operations for the Capture Inbox,
// Projects, Tasks, and Save for Later

import { supabase } from './profileScopedClient';
import { cacheWrite, cacheRead, isOnline, smartFetch, offlineWrite } from './offlineCache';
import { todayStr, dateStr } from '../logic/dateUtils';

// ─── CAPTURES ─────────────────────────────────────────────────────────────────

export async function getCaptures(userId, { status = 'inbox', type = null } = {}) {
  const cacheKey = `captures_${userId}_${status}_${type || 'all'}`;

  const fetchFn = async () => {
    let q = supabase
      .from('captures')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .is('deleted_at', null)
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

// Total capture count across every status/type — for a card subtitle like
// "600+ Notes, Bookmarks & Tools", not the inbox-only count getCaptures()
// returns by default. Count-only (head: true) so it doesn't pull every row
// just to measure how many there are.
export async function getCaptureCount(userId) {
  const { count, error } = await supabase
    .from('captures')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (error) { console.warn('getCaptureCount:', error.message); return 0; }
  return count || 0;
}

// ─── DOMAIN CONTENT (Library "Domains" tab filter) ─────────────────────────────
// Tasks, captures, and planner items tagged with one of the 8 life domains,
// merged into one list the same way HomeScreen.js's own multi-source "On
// the Desk" list is — a `kind` field the render side switches on, a
// `source` field for the human-readable badge.
//
// Two different tagging paths feed this, both already real:
//   - tasks/captures.life_area_id — a foreign key to this user's own
//     life_areas row for the domain (ImportScreen.js sets this on import).
//   - captures.tags containing the domain key directly, e.g. 'physical'
//     (also written by ImportScreen.js, alongside life_area_id).
//   - agenda_instances.area — the domain key directly, no resolution
//     needed; the most reliable of the three since Planner routines are
//     tagged by domain from the moment they're created.
// A domain the user has never checked into has no life_areas row yet —
// that's not an error, it just means the life_area_id-based matches below
// come back empty and the tag/planner matches carry the result.
export async function getDomainContent(userId, domainId) {
  const { data: areaRows } = await supabase
    .from('life_areas').select('id, label').eq('user_id', userId);
  const areaRow = (areaRows || []).find(a => a.label?.toLowerCase() === domainId);
  const areaRowId = areaRow?.id || null;

  const past = new Date(); past.setDate(past.getDate() - 30);
  const future = new Date(); future.setDate(future.getDate() + 14);

  const [tasksRes, capturesRes, instancesRes] = await Promise.all([
    areaRowId
      ? supabase.from('tasks').select('id, title, completed, due_date')
          .eq('user_id', userId).eq('life_area_id', areaRowId)
          .order('completed').limit(30)
      : Promise.resolve({ data: [] }),
    supabase.from('captures').select('id, title, type, status, created_at')
      .eq('user_id', userId).is('deleted_at', null)
      .or(areaRowId ? `life_area_id.eq.${areaRowId},tags.cs.{${domainId}}` : `tags.cs.{${domainId}}`)
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('agenda_instances').select('id, title, area, date, start_time, completed')
      .eq('user_id', userId).eq('area', domainId).eq('skipped', false)
      .gte('date', dateStr(past)).lte('date', dateStr(future))
      .order('date').limit(30),
  ]);

  const merged = [
    ...(tasksRes.data || []).map(tk => ({
      id: 'task_' + tk.id, title: tk.title, kind: 'task', source: 'Task',
      done: tk.completed, raw: tk,
    })),
    ...(capturesRes.data || []).map(cp => ({
      id: 'cap_' + cp.id, title: cp.title || 'Untitled', kind: 'capture', source: cp.type || 'note',
      done: cp.status !== 'inbox', raw: cp,
    })),
    ...(instancesRes.data || []).map(inst => ({
      id: 'inst_' + inst.id, title: inst.title, kind: 'planner', source: 'planner',
      done: !!inst.completed, raw: inst,
    })),
  ];
  // Not-done items first, most useful-to-act-on order for a triage view.
  merged.sort((a, b) => (a.done === b.done) ? 0 : a.done ? 1 : -1);
  return merged;
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
      .is('deleted_at', null)
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

  // offlineWrite pre-assigns the same id whether this lands live now or
  // gets queued for later — was 'local_'+Date.now() shown on screen while
  // the queued row itself had no id, so the eventual synced row (a random
  // Postgres-generated uuid) never matched what the UI already had.
  const { row } = await offlineWrite(supabase, 'captures', item);
  return row;
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

// Soft delete — moves the item to Recently Deleted (Capture Inbox) for 7
// days instead of removing it. See src/api/trashService.js.
export async function deleteCapture(captureId) {
  const { error } = await supabase
    .from('captures')
    .update({ deleted_at: new Date().toISOString() })
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
      .is('deleted_at', null)
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
  const item = { user_id: userId, ...project, updated_at: new Date().toISOString() };
  const { row } = await offlineWrite(supabase, 'projects', item, { type: 'UPSERT' });
  return row;
}

// Soft delete — moves the project to Recently Deleted (Capture Inbox) for 7
// days instead of removing it. See src/api/trashService.js.
export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
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
  const d = date || todayStr();
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
    due_date: task.due_date || todayStr(),
    repeat: task.repeat || 'none',
    priority: task.priority || 2,
    estimated_minutes: task.estimated_minutes || null,
    sort_order: task.sort_order || 0,
    ...(task.id ? { id: task.id } : {}),
  };

  // Same id whether this lands live now or gets queued — see offlineWrite's
  // own comment for why that matters (was the same local-id/queued-row
  // mismatch bug as addCapture, above).
  const { row } = await offlineWrite(supabase, 'tasks', item, {
    type: 'UPSERT',
    selectQuery: '*, projects(title, color, emoji)',
  });
  return row;
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
    due_date: dateStr(next),
  });
}
