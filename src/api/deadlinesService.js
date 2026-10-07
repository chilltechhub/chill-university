// src/api/deadlinesService.js
// What is due on which day, from the places that hold due dates outside the
// Planner's own rows: project tasks, plain tasks (the Inbox's "Create a
// Task", a life area's "add to today's tasks") and whole projects' finish
// dates.
//
// The Planner only read agenda_instances, so a project task due Wednesday
// never appeared on Wednesday: someone planning their week from the Planner
// couldn't see their deadlines (ship test, 2026-10-07). This feeds the
// Planner's "Due" rows. Read-mostly: ticking one off writes the same columns
// its own screen writes.

import { supabase } from './profileScopedClient';
import { recordAction } from '../logic/gamificationService';

const safe = async (fn) => { try { return await fn(); } catch (e) { console.warn('[deadlines]', e?.message || e); return []; } };

/**
 * Everything due from `from` to `to` (inclusive, 'YYYY-MM-DD'), for the
 * active profile. Each row:
 *   { key, kind: 'project_task' | 'task' | 'project', id, title, date,
 *     completed, projectId, projectTitle }
 */
export async function getDueItems(userId, from, to) {
  if (!userId || !from || !to) return [];

  // Live projects first: they're the parents of project tasks (which carry
  // no profile_id of their own) and their finish dates are deadlines too.
  const projects = await safe(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, status, due_date, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  });
  const live = projects.filter(p => p.status !== 'completed');
  const titleOf = Object.fromEntries(projects.map(p => [p.id, p.title]));

  const [projectTasks, tasks] = await Promise.all([
    live.length ? safe(async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('id, title, completed, due_date, project_id')
        .in('project_id', live.map(p => p.id))
        .gte('due_date', from)
        .lte('due_date', to);
      if (error) throw error;
      return data || [];
    }) : [],
    safe(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, completed, due_date, project_id')
        .eq('user_id', userId)
        .gte('due_date', from)
        .lte('due_date', to);
      if (error) throw error;
      return data || [];
    }),
  ]);

  return [
    ...live.filter(p => p.due_date && p.due_date >= from && p.due_date <= to).map(p => ({
      key: `project-${p.id}`, kind: 'project', id: p.id, title: p.title, date: p.due_date,
      completed: false, projectId: p.id, projectTitle: p.title,
    })),
    ...projectTasks.map(t => ({
      key: `ptask-${t.id}`, kind: 'project_task', id: t.id, title: t.title, date: t.due_date,
      completed: !!t.completed, projectId: t.project_id, projectTitle: titleOf[t.project_id] || null,
    })),
    ...tasks.map(t => ({
      key: `task-${t.id}`, kind: 'task', id: t.id, title: t.title, date: t.due_date,
      completed: !!t.completed, projectId: t.project_id || null, projectTitle: t.project_id ? titleOf[t.project_id] || null : null,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || Number(a.completed) - Number(b.completed));
}

/** Ticks a project task or a plain task. A project's finish date isn't ticked here. */
export async function setDueItemDone(item, completed) {
  const table = item.kind === 'project_task' ? 'project_tasks' : item.kind === 'task' ? 'tasks' : null;
  if (!table) return;
  const { error } = await supabase
    .from(table)
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', item.id);
  if (error) throw error;
  if (completed) recordAction(item.kind === 'project_task' ? 'project_step' : 'task_done', item.id);
}
