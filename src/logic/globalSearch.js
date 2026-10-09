// src/logic/globalSearch.js
// The content half of the command palette: one query against the tables that
// hold what a person actually saved. Screens/classes/games are matched
// locally from the index in searchIndex.js — only these need a round trip.
//
// `captures` covers notes, bookmarks, papers and tools in one shot (they're
// all rows in that table — see src/screens/library/knowledge.js), so two
// queries cover Captures, Notes and Projects. Adding another source later
// (garden_cores for ideas, say) is one more entry in the Promise.all below.

import { supabase } from '../api/profileScopedClient';
import { todayStr, addDays } from './dateUtils';

const EMPTY = { captures: [], projects: [], ideas: [], plans: [], tasks: [] };

// PostgREST's `or=` filter is a comma-separated list wrapped in parens, so a
// comma, paren, or wildcard typed into the search box would otherwise be
// read as filter syntax instead of as text to look for.
const sanitize = (q) => q.replace(/[,()%*\\]/g, ' ').trim();

export async function searchContent(userId, rawQuery, { limit = 8 } = {}) {
  const q = sanitize(rawQuery || '');
  if (!userId || q.length < 2) return EMPTY;

  const like = `%${q}%`;

  const today = todayStr();
  const [capturesRes, projectsRes, ideasRes, plansRes, tasksRes] = await Promise.all([
    supabase
      .from('captures')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .neq('status', 'archived')
      .or(`title.ilike.${like},body.ilike.${like},url.ilike.${like}`)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or(`title.ilike.${like},objective.ilike.${like}`)
      .order('updated_at', { ascending: false })
      .limit(limit),
    // Ideas in the Idea Garden.
    supabase
      .from('garden_cores')
      .select('id, title, description')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or(`title.ilike.${like},description.ilike.${like}`)
      .order('created_at', { ascending: false })
      .limit(limit),
    // Planner items from a month back to two months ahead. A daily habit is
    // a row per day, so this reads more and keeps one per title below.
    supabase
      .from('agenda_instances')
      .select('id, title, date, cadence, area, start_time')
      .eq('user_id', userId)
      .ilike('title', like)
      .gte('date', addDays(today, -30))
      .lte('date', addDays(today, 60))
      .order('date', { ascending: true })
      .limit(60),
    // Open to-dos.
    supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('user_id', userId)
      .eq('completed', false)
      .ilike('title', like)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  if (capturesRes.error) console.warn('[globalSearch] captures', capturesRes.error.message);
  if (projectsRes.error) console.warn('[globalSearch] projects', projectsRes.error.message);
  [ideasRes, plansRes, tasksRes].forEach((r) => { if (r.error) console.warn('[globalSearch]', r.error.message); });

  // One row per planned thing: its next day on or after today, else its last.
  const byTitle = new Map();
  (plansRes.data || []).forEach((p) => {
    const key = `${(p.title || '').toLowerCase()}|${p.cadence}`;
    const prev = byTitle.get(key);
    if (!prev || (prev.date < today && p.date >= today) || (prev.date < today && p.date > prev.date)) byTitle.set(key, p);
  });

  return {
    captures: capturesRes.data || [],
    projects: projectsRes.data || [],
    ideas: ideasRes.data || [],
    plans: [...byTitle.values()].slice(0, limit),
    tasks: tasksRes.data || [],
  };
}
