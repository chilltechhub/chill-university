// src/api/knowledgeUse.js
// Saved knowledge only compounds if it gets used. A Vault item (a captures
// row) can carry, in url_meta:
//
//   takeaway  'the one thing worth remembering'           (one line)
//   use_when  'When I ___, I'll ___'                      (one line)
//   uses      [{ at ISO, plan_id?, note? }]               (show your work)
//
// A plan made from the item (Planner, reminder) links back with
// link_type 'vault', so ticking it Done anywhere records a use here
// (plannerService.completeInstance), and un-ticking takes it back off.
// No migration: url_meta is the jsonb column the Vault already writes.

import { supabase } from './profileScopedClient';

export function usesOf(row) {
  const u = row?.url_meta?.uses;
  return Array.isArray(u) ? u : [];
}

// Notes for a plan made from a Vault item: the reason first, so the Planner
// sheet and the phone reminder show *why* before anything else.
export function planNotesFor(row) {
  const why = (row?.url_meta?.takeaway || '').trim();
  const from = (row?.title || '').trim();
  return [why && `Why: ${why}`, from && from !== why && `From: ${from}`].filter(Boolean).join('\n') || null;
}

// The title for a plan made from a Vault item: the when/then line if there
// is one, since that's the thing to actually do.
export function planTitleFor(row, fallback) {
  return (row?.url_meta?.use_when || '').trim() || fallback;
}

// The "Why: …" line out of a plan's notes, or null.
export function whyFromNotes(notes) {
  const m = /^Why: (.+)$/m.exec(notes || '');
  return m ? m[1].trim() : null;
}

async function readMeta(captureId) {
  const { data, error } = await supabase.from('captures').select('url_meta').eq('id', captureId).maybeSingle();
  if (error || !data) return null;
  return data.url_meta || {};
}

async function writeUses(captureId, meta, uses) {
  const { error } = await supabase.from('captures')
    .update({ url_meta: { ...meta, uses }, updated_at: new Date().toISOString() })
    .eq('id', captureId);
  if (error) throw error;
  return uses;
}

// One use. A plan only ever counts once, however often it's re-ticked.
export async function recordUse(captureId, { planId = null, note = null } = {}) {
  const meta = await readMeta(captureId);
  if (!meta) return null;
  const uses = Array.isArray(meta.uses) ? meta.uses : [];
  if (planId && uses.some(u => u.plan_id === planId)) return uses;
  const entry = { at: new Date().toISOString(), ...(planId ? { plan_id: planId } : {}), ...(note ? { note: note.trim() } : {}) };
  return writeUses(captureId, meta, [...uses, entry]);
}

export async function removePlanUse(captureId, planId) {
  const meta = await readMeta(captureId);
  if (!meta || !Array.isArray(meta.uses)) return null;
  const uses = meta.uses.filter(u => u.plan_id !== planId);
  if (uses.length === meta.uses.length) return meta.uses;
  return writeUses(captureId, meta, uses);
}

// "What happened?" after ticking a plan Done.
export async function setPlanUseNote(captureId, planId, note) {
  const meta = await readMeta(captureId);
  if (!meta) return null;
  const uses = Array.isArray(meta.uses) ? meta.uses : [];
  const text = (note || '').trim();
  const hit = uses.some(u => u.plan_id === planId);
  const next = hit
    ? uses.map(u => (u.plan_id === planId ? { ...u, note: text || undefined } : u))
    : [...uses, { at: new Date().toISOString(), plan_id: planId, ...(text ? { note: text } : {}) }];
  return writeUses(captureId, meta, next);
}

/* ─── Remember this? ──────────────────────────────────────────────────────── */
// Home's Today's Wisdom card brings one of your own takeaways back, spaced
// out: 1, 3, 7, 21, then 60 days. Used it → the gap grows. Not now → same
// gap again from today. url_meta.review = { step, last ISO }.

const GAPS_DAYS = [1, 3, 7, 21, 60];
const DAY = 86400000;

export function dueScore(row, now = Date.now()) {
  const r = row?.url_meta?.review || {};
  const step = Math.min(r.step || 0, GAPS_DAYS.length - 1);
  const last = Date.parse(r.last || row.updated_at || row.created_at) || now;
  return (now - last) / DAY - GAPS_DAYS[step]; // >= 0 means due
}

// The most overdue takeaway, or null if none is due yet.
export function pickRemember(rows, now = Date.now()) {
  let best = null; let bestScore = 0;
  for (const row of rows || []) {
    if (!row?.url_meta?.takeaway) continue;
    const sc = dueScore(row, now);
    if (sc >= 0 && (!best || sc > bestScore)) { best = row; bestScore = sc; }
  }
  return best;
}

export async function getTakeawayRows(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from('captures')
    .select('id,title,url_meta,created_at,updated_at')
    .eq('user_id', userId)
    .not('url_meta->>takeaway', 'is', null)
    .is('deleted_at', null)
    .limit(300);
  if (error) { console.warn('[knowledgeUse] takeaways', error.message); return []; }
  return data || [];
}

// Days until a reviewed item comes back, for "Back in 3 days".
export function nextGapDays(meta) {
  return GAPS_DAYS[Math.min(meta?.review?.step || 0, GAPS_DAYS.length - 1)];
}

export async function markReviewed(captureId, { used = false } = {}) {
  const meta = await readMeta(captureId);
  if (!meta) return null;
  const r = meta.review || {};
  const review = { step: used ? Math.min((r.step || 0) + 1, GAPS_DAYS.length - 1) : (r.step || 0), last: new Date().toISOString() };
  const uses = Array.isArray(meta.uses) ? meta.uses : [];
  const next = { ...meta, review, ...(used ? { uses: [...uses, { at: review.last }] } : {}) };
  const { error } = await supabase.from('captures')
    .update({ url_meta: next, updated_at: review.last })
    .eq('id', captureId);
  if (error) throw error;
  return next;
}

/* ─── The week, for Weekly Review ─────────────────────────────────────────── */
// saved: Vault items saved in the last 7 days. used: uses logged in them.
// toTry: takeaways with nothing done about them for two weeks, newest first,
// offered as next week's priorities.
export async function getKnowledgeWeek(userId) {
  const empty = { saved: 0, used: 0, toTry: [] };
  if (!userId) return empty;
  const weekAgo = Date.now() - 7 * DAY;
  const [savedRes, metaRes] = await Promise.all([
    supabase.from('captures').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).in('type', ['note', 'link', 'resource']).neq('status', 'inbox')
      .is('deleted_at', null).gte('created_at', new Date(weekAgo).toISOString()),
    supabase.from('captures').select('id,title,url_meta,updated_at')
      .eq('user_id', userId).is('deleted_at', null)
      .or('url_meta->>takeaway.not.is.null,url_meta->uses.not.is.null')
      .order('updated_at', { ascending: false }).limit(300),
  ]);
  if (metaRes.error) { console.warn('[knowledgeUse] week', metaRes.error.message); return { ...empty, saved: savedRes.count || 0 }; }
  const rows = metaRes.data || [];
  const used = rows.reduce((n, row) => n + usesOf(row).filter(u => Date.parse(u.at) >= weekAgo).length, 0);
  const twoWeeks = Date.now() - 14 * DAY;
  const toTry = rows
    .filter(row => row.url_meta?.takeaway && !usesOf(row).some(u => Date.parse(u.at) >= twoWeeks))
    .slice(0, 4);
  return { saved: savedRes.count || 0, used, toTry };
}
