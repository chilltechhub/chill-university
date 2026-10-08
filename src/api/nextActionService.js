// src/api/nextActionService.js
// Finishing a project's next action, and saying what comes after it.
//
// The next action used to be a field you overwrote: the step you finished
// vanished, nothing counted it, and the project log never showed the work.
// Now finishing one writes a line to the project's log (project_milestones,
// the same place stage changes go), counts as a project step (XP + streak,
// recordAction), and the new next action takes its place. Used by Home's
// "New Step" sheet and Work Mode's finish screen.

import { supabase } from './profileScopedClient';
import { recordAction } from '../logic/gamificationService';
import { todayStr } from '../logic/dateUtils';

const sameTitle = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

// The project's plan, soonest first: dated tasks by due date, then the rest in
// the order they were added (ProjectDetail's planOrder). An AI plan saved in
// two batches would otherwise put batch 2's October task after batch 1's June
// one.
const soonestFirst = (a, b) =>
  (a.due_date && b.due_date ? a.due_date.localeCompare(b.due_date) : (a.due_date ? -1 : b.due_date ? 1 : 0))
  || (new Date(a.created_at) - new Date(b.created_at))
  || ((a.sort_order || 0) - (b.sort_order || 0));

const openTasks = async (projectId) => {
  const { data, error } = await supabase
    .from('project_tasks').select('id, title, due_date, created_at, sort_order, completed')
    .eq('project_id', projectId).eq('completed', false);
  if (error) console.warn('[nextAction] tasks', error.message);
  return data || [];
};

/**
 * The project's soonest open task, for offering as the next step (Home's
 * "What's next" sheet). `skip` is the step being finished, so it isn't
 * offered as its own successor.
 * @returns {Promise<string|null>} its title
 */
export async function suggestNextStep(projectId, skip = null) {
  if (!projectId) return null;
  const open = (await openTasks(projectId)).filter(t => !sameTitle(t.title, skip));
  return open.sort(soonestFirst)[0]?.title || null;
}

/**
 * @param {string} userId
 * @param {{ id: string, next_action?: string|null }} project
 * @param {{ done?: boolean, next?: string|null }} opts
 *   done: the current next action was finished (logged + counted). If an
 *     open task has the same title it is ticked off too, and with no `next`
 *     the project's next open task becomes the next action, so finishing a
 *     step on a planned project never leaves it with "No next step set".
 *   next: the new next action; null/'' clears it (unless done picks one)
 * @returns {Promise<string|null>} the next action now on the project
 */
export async function advanceNextAction(userId, project, { done = false, next = null } = {}) {
  if (!userId || !project?.id) throw new Error('No project');
  const finished = (project.next_action || '').trim();
  let upcoming = (next || '').trim() || null;

  // Writes that don't decide the next step run alongside the ones that do.
  // One after another, a tick on a project sat on a spinner for several
  // seconds (four round trips) before it asked for the next step.
  const sideWrites = [];
  if (done) {
    let open = await openTasks(project.id);
    const match = finished && open.find(t => sameTitle(t.title, finished));
    if (match) {
      sideWrites.push(supabase.from('project_tasks')
        .update({ completed: true, completed_at: new Date().toISOString() }).eq('id', match.id)
        .then(({ error }) => { if (error) console.warn('[nextAction] task', error.message); }));
      open = open.filter(t => t.id !== match.id);
    }
    if (!upcoming) upcoming = [...open].sort(soonestFirst)[0]?.title || null;
  }

  if (done && finished) {
    // The log line is the nice-to-have; the next action is the point.
    sideWrites.push(supabase.from('project_milestones').insert({
      user_id: userId, project_id: project.id,
      title: `Done: ${finished}`, type: 'step_done', date: todayStr(),
    }).then(({ error }) => { if (error) console.warn('[nextAction] log', error.message); }));
    recordAction('project_step', `${project.id}:${finished}`);
  }

  const [{ error }] = await Promise.all([
    supabase
      .from('projects')
      .update({ next_action: upcoming, updated_at: new Date().toISOString() })
      .eq('id', project.id),
    ...sideWrites,
  ]);
  if (error) throw error;
  return upcoming;
}
