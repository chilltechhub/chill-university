// src/api/areaLinks.js
// "This belongs to that part of my life": a Note, Project or Resource linked
// to a life area. Stored as area_notes rows whose content starts with
// LINK_PREFIX, so they never show up as text in an area's notes feed (every
// screen that lists area_notes excludes the prefix, see EXCLUDE_LINK_FILTER in
// screens/library/RelatedLinks.js, which writes the same rows from the area's
// side). The Project Overview reads and writes them from the project's side.

import { supabase } from './profileScopedClient';

export const LINK_PREFIX = '__LINK__:';

export function encodeLink(kind, refId, title) {
  return LINK_PREFIX + JSON.stringify({ kind, refId, title });
}

export function decodeLink(content) {
  try { return JSON.parse(String(content).slice(LINK_PREFIX.length)); }
  catch { return null; }
}

/** The life areas a project is linked to: [{ id (row), areaId }]. */
export async function areasForProject(projectId) {
  if (!projectId) return [];
  const { data, error } = await supabase.from('area_notes').select('id, area_id, content')
    .ilike('content', `${LINK_PREFIX}%`).ilike('content', `%"refId":"${projectId}"%`);
  if (error) { console.warn('[areaLinks]', error.message); return []; }
  return (data || [])
    .map(row => ({ id: row.id, areaId: row.area_id, link: decodeLink(row.content) }))
    .filter(r => r.link?.kind === 'project' && r.link.refId === projectId)
    .map(({ id, areaId }) => ({ id, areaId }));
}

export async function linkProjectToArea(userId, areaId, project) {
  const { data, error } = await supabase.from('area_notes').insert({
    user_id: userId, area_id: areaId,
    content: encodeLink('project', project.id, project.title || 'Untitled'),
    created_at: new Date().toISOString(),
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function unlinkAreaRow(rowId) {
  const { error } = await supabase.from('area_notes').delete().eq('id', rowId);
  if (error) throw error;
}
