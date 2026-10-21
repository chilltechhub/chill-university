// src/api/buildProjects.js
// "Grow it into a project": a Studio Build becomes one of their own
// Workshop projects (docs/consolidation-plan-2026-10-20.md §2). The bridge
// from "the app made it with me" to "I'm making it".
//
// The project starts with the Build's name, a line on where it came from,
// and the kind's first real step (builds.js `growNext`) as its next action.
// A milestone records the start, the same way a Garden idea or a Vault note
// does when it becomes a project. The Build keeps the project's id, so its
// screen opens the project instead of making a second one.
import { supabase } from './profileScopedClient';
import { todayStr } from '../logic/dateUtils';
import { kindOf, buildTitle } from '../logic/builds';

export async function growIntoProject(userId, build) {
  const kind = kindOf(build);
  if (!userId || !kind) return null;
  const { data: project, error } = await supabase.from('projects').insert({
    user_id: userId,
    title: buildTitle(build).slice(0, 120),
    objective: `Started in the Studio as ${kind.label.toLowerCase()}. Now it's yours to grow.`,
    next_action: kind.growNext || null,
    emoji: '🎨', color: '#8b4fc4', cover_color: '#8b4fc4', banner_emoji: '🎨', // style-ok: a project's own colour, stored with it
    category: 'general', status: 'active', sort_order: 0,
  }).select().single();
  if (error || !project) throw error || new Error('No project came back');
  supabase.from('project_milestones').insert({
    user_id: userId, project_id: project.id,
    title: '🎨 Grown from a Studio Build', type: 'project_created', date: todayStr(),
  }).then(({ error: e }) => { if (e) console.warn('[studio] milestone', e.message); });
  return project;
}
