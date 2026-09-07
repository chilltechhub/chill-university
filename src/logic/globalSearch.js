// src/logic/globalSearch.js
// The content half of the command palette: one query against the tables that
// hold what a person actually saved. Screens/classes/games are matched
// locally from the index in searchIndex.js — only these need a round trip.
//
// `captures` covers notes, bookmarks, papers and tools in one shot (they're
// all rows in that table — see src/screens/library/knowledge.js), so two
// queries cover Captures, Notes and Projects. Adding another source later
// (garden_cores for ideas, say) is one more entry in the Promise.all below.

import { supabase } from '../api/supabaseClient';

// PostgREST's `or=` filter is a comma-separated list wrapped in parens, so a
// comma, paren, or wildcard typed into the search box would otherwise be
// read as filter syntax instead of as text to look for.
const sanitize = (q) => q.replace(/[,()%*\\]/g, ' ').trim();

export async function searchContent(userId, rawQuery, { limit = 8 } = {}) {
  const q = sanitize(rawQuery || '');
  if (!userId || q.length < 2) return { captures: [], projects: [] };

  const like = `%${q}%`;

  const [capturesRes, projectsRes] = await Promise.all([
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
  ]);

  if (capturesRes.error) console.warn('[globalSearch] captures', capturesRes.error.message);
  if (projectsRes.error) console.warn('[globalSearch] projects', projectsRes.error.message);

  return {
    captures: capturesRes.data || [],
    projects: projectsRes.data || [],
  };
}
