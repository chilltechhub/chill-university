// src/api/existingWorkService.js
// What someone has already built, for goal steps that say so (objectives.js
// `have`). A goal is started after other goals, and a step like "Plant the
// idea" or "Start a project" only ticked when the person did it again after
// starting: someone with a planned 25-task project was asked to redo the
// three steps they had just finished. AccessContext.startObjective asks here
// once and ticks the steps that are already true.

import { supabase } from './profileScopedClient';

const exists = async (query) => {
  const { count, error } = await query;
  if (error) { console.warn('[existingWork]', error.message); return false; }
  return (count || 0) > 0;
};

const CHECKS = {
  idea:        () => supabase.from('garden_cores').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  project:     () => supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  'next-step': () => supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null)
    .not('next_action', 'is', null).neq('status', 'completed'),
  shipped:     () => supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null)
    .eq('status', 'completed'),
  // A finished project is listed in the Portfolio on its own (portfolio.js
  // derives it); a hand-added entry counts too.
  'in-portfolio': async () => {
    const shipped = await exists(CHECKS.shipped());
    return shipped ? { count: 1 } : supabase.from('portfolio_entries').select('id', { count: 'exact', head: true });
  },
};

/**
 * @param {string[]} kinds  any of 'idea', 'project', 'next-step', 'shipped', 'in-portfolio'
 * @returns {Promise<Set<string>>} the kinds this person already has
 */
export async function alreadyHas(kinds) {
  const wanted = [...new Set(kinds)].filter(k => CHECKS[k]);
  const results = await Promise.all(wanted.map(k => exists(CHECKS[k]())));
  return new Set(wanted.filter((_, i) => results[i]));
}
