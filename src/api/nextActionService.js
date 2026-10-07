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

/**
 * @param {string} userId
 * @param {{ id: string, next_action?: string|null }} project
 * @param {{ done?: boolean, next?: string|null }} opts
 *   done: the current next action was finished (logged + counted)
 *   next: the new next action; null/'' clears it
 * @returns {Promise<string|null>} the next action now on the project
 */
export async function advanceNextAction(userId, project, { done = false, next = null } = {}) {
  if (!userId || !project?.id) throw new Error('No project');
  const finished = (project.next_action || '').trim();
  const upcoming = (next || '').trim() || null;

  if (done && finished) {
    const { error: logError } = await supabase.from('project_milestones').insert({
      user_id: userId, project_id: project.id,
      title: `Done: ${finished}`, type: 'step_done', date: todayStr(),
    });
    // The log line is the nice-to-have; the next action is the point.
    if (logError) console.warn('[nextAction] log', logError.message);
    recordAction('project_step', `${project.id}:${finished}`);
  }

  const { error } = await supabase
    .from('projects')
    .update({ next_action: upcoming, updated_at: new Date().toISOString() })
    .eq('id', project.id);
  if (error) throw error;
  return upcoming;
}
