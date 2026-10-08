// src/api/splitTaskService.js
// One task of a big project, made into its own small project.
//
// "Finish Your First Project" ends with "Mark the project done", which a
// nine-month build can't honestly do for months, and the next stage waits
// on it. Instead of a throwaway project, the person picks one real piece
// ("Coop and run built") and finishes that. The task stays in the big plan;
// marking the small project DONE ticks it there.
//
// The link lives in the small project's `links` (a jsonb list nothing else
// uses): { kind: 'part-of', project_id, task_id, title }.

import { supabase } from './profileScopedClient';
import { todayStr } from '../logic/dateUtils';

const partOf = (project) => (Array.isArray(project?.links) ? project.links : [])
  .find(l => l && l.kind === 'part-of' && l.task_id);

/** The live project a task was split into, if any. */
export async function findSplitProject(taskId) {
  if (!taskId) return null;
  const { data, error } = await supabase.from('projects').select('*')
    // A raw filter: supabase-js's .contains() formats a JS array as a
    // Postgres array literal, which a jsonb column rejects.
    .filter('links', 'cs', JSON.stringify([{ kind: 'part-of', task_id: taskId }]))
    .is('deleted_at', null).limit(1).maybeSingle();
  if (error) { console.warn('[splitTask] find', error.message); return null; }
  return data;
}

/** Creates the small project for `task` of `parent` and logs it in both. */
export async function splitTaskIntoProject(userId, parent, task) {
  const { data: project, error } = await supabase.from('projects').insert({
    user_id: userId,
    title: task.title,
    objective: task.notes || null, // the page shows "Part of …" from links
    due_date: task.due_date || null,
    emoji: parent.emoji || '🏗️', color: parent.color, cover_color: parent.cover_color || parent.color,
    banner_emoji: parent.banner_emoji || parent.emoji || '🏗️',
    category: parent.category || 'general',
    status: 'active', sort_order: 0,
    links: [{ kind: 'part-of', project_id: parent.id, task_id: task.id, title: parent.title }],
  }).select().single();
  if (error) throw error;

  const date = todayStr();
  await supabase.from('project_milestones').insert([
    { user_id: userId, project_id: project.id, title: `🧩 A piece of ${parent.title}`, type: 'project_created', date },
    { user_id: userId, project_id: parent.id, title: `🧩 "${task.title}" is now its own project`, type: 'stage_changed', date },
  ]);
  return project;
}

/**
 * A small project was marked done: tick its task in the big plan.
 * @returns {Promise<string|null>} the big project's title, when a task was ticked
 */
export async function finishPartOf(userId, project) {
  const link = partOf(project);
  if (!link) return null;
  const { data, error } = await supabase.from('project_tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', link.task_id).eq('completed', false).select('id');
  if (error) { console.warn('[splitTask] finish', error.message); return null; }
  if (!data?.length) return null;
  await supabase.from('project_milestones').insert({
    user_id: userId, project_id: link.project_id, title: `✅ ${project.title} (finished as its own project)`,
    type: 'step_done', date: todayStr(),
  });
  return link.title || null;
}

export { partOf };
