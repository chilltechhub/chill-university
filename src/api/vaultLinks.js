// src/api/vaultLinks.js
// The other direction of a Vault note's links. A note links itself to a
// project or an idea from the Vault (components/ItemLinks.js, stored in the
// note's url_meta.links as { kind, refId, title }); the project page and the
// Idea Garden ask here which notes point at them, so "what I learned" shows
// up where the work is, not only in the Vault.

import { supabase } from './profileScopedClient';

const COLS = 'id, title, body, type, created_at, url_meta';

// A raw filter: supabase-js's .contains() formats a JS array as a Postgres
// array literal, which a jsonb path rejects.
const linkedQuery = (match) => supabase.from('captures').select(COLS)
  .filter('url_meta->links', 'cs', JSON.stringify([match]))
  .is('deleted_at', null).neq('status', 'archived')
  .order('created_at', { ascending: false });

/** Notes linked to one project or idea (kind 'project' | 'idea'). */
export async function notesLinkedTo(kind, id) {
  if (!id) return [];
  const { data, error } = await linkedQuery({ kind, refId: id }).limit(20);
  if (error) { console.warn('[vaultLinks]', error.message); return []; }
  return data || [];
}

/** Every note linked to any `kind`, grouped by what it points at: { [refId]: notes[] }. */
export async function notesLinkedByRef(kind) {
  const { data, error } = await linkedQuery({ kind }).limit(200);
  if (error) { console.warn('[vaultLinks]', error.message); return {}; }
  const out = {};
  (data || []).forEach(note => {
    (note.url_meta?.links || []).filter(l => l.kind === kind && l.refId).forEach(l => {
      (out[l.refId] = out[l.refId] || []).push(note);
    });
  });
  return out;
}

/** What to show for a note: a written note's own text (its title is only a
 *  clipped copy of it), anything else by its title. Callers clip it with
 *  numberOfLines. */
export const noteLine = (note) => (
  (note?.type === 'note' ? note?.body || note?.title : note?.title || note?.body) || 'Untitled note'
).replace(/\s+/g, ' ').trim();
