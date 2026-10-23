// src/api/deliverableService.js
// Where deliverables live (docs/shake-up-plan-2026-10-21.md §4.3, P6).
// Local first, @cth_deliverables_<uid|guest>, with one copy in memory and
// listeners (like buildService), so Make's board, the unit and Today agree
// the moment one saves. Signed in, each save also goes to the `deliverables`
// table (20261023120000_shakeup_p6.sql). That table is hand-applied: until
// it exists the save fails quietly and the phone copy is the record.
//
// A deliverable only overlays the work (src/logic/deliverables.js): the
// Build, checklist or written lines stay where they are.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { normalizeDeliverable, newDeliverable, handIn, deliverableIdFor } from '../logic/deliverables';
import { UNIT_BY_ID } from '../data/units';
import { loadWelcome } from './welcomeStore';
import { loadBuilds } from './buildService';

const localKey = (userId) => `@cth_deliverables_${userId || 'guest'}`;
const keyOf = (userId) => userId || 'guest';
const cache = {};
const listeners = new Set();

export function onDeliverablesChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export const cachedDeliverables = (userId) => cache[keyOf(userId)] || null;

function announce(userId, list) {
  cache[keyOf(userId)] = list;
  listeners.forEach(fn => { try { fn(userId, list); } catch {} });
}

async function readLocal(userId) {
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return (Array.isArray(parsed) ? parsed : []).map(normalizeDeliverable).filter(Boolean);
  } catch { return []; }
}

// The welcome's page (unit 1 of What do I like?) was made before there were
// deliverables: once, it becomes one, handed in, pointing at that Build.
async function fromWelcome(userId, list) {
  if (list.some(d => d.unitKey === 'unit-like-1')) return list;
  let unit1Done = false;
  try { unit1Done = !!(await loadWelcome())?.unit1Done; } catch {}
  if (!unit1Done) return list;
  const page = (await loadBuilds(userId).catch(() => [])).find(b => b.kind === 'page');
  if (!page) return list;
  const unit = UNIT_BY_ID['unit-like-1'];
  const d = handIn({ ...newDeliverable(unit, page.createdAt || undefined), ref: page.id, status: 'doing', checks: [true, true, true] }, page.updatedAt || undefined);
  return [d, ...list];
}

export async function loadDeliverables(userId) {
  let list = await readLocal(userId);
  const seeded = await fromWelcome(userId, list);
  if (seeded !== list) { list = seeded; await writeLocal(userId, list); }
  announce(userId, list);
  return list;
}

async function writeLocal(userId, list) {
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify(list)); }
  catch (e) { console.warn('deliverables save', e?.message); }
}

// The table's row shape (snake_case), from a deliverable.
const toRow = (userId, d) => ({
  id: d.id, user_id: userId, path_key: d.pathKey, unit_key: d.unitKey, kind: d.kind,
  ref_id: d.ref, title: d.title, status: d.status, aim_for: d.aimFor,
  rubric: { checks: d.checks, content: d.content, buildKind: d.buildKind },
  feedback: d.feedback, snapshot_at: d.snapshotAt, shown_at: d.shownAt,
  created_at: d.createdAt, updated_at: d.updatedAt,
});

async function pushRemote(userId, d) {
  if (!userId) return;
  try {
    const { error } = await supabase.from('deliverables').upsert(toRow(userId, d), { onConflict: 'user_id,id' });
    // 42P01: the table isn't there yet (hand-applied SQL). The phone copy holds it.
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') console.warn('deliverables push', error.message);
  } catch {}
}

/** Adds or replaces one deliverable. Resolves the saved one. */
export async function saveDeliverable(userId, d) {
  const next = normalizeDeliverable(d);
  if (!next) return null;
  const current = cachedDeliverables(userId) || await loadDeliverables(userId);
  const list = [next, ...current.filter(x => x.id !== next.id)];
  announce(userId, list);
  await writeLocal(userId, list);
  pushRemote(userId, next);
  return next;
}

/** The deliverable for a unit: the saved one, or a fresh one (not saved until touched). */
export function deliverableForUnit(list, unitId) {
  const unit = UNIT_BY_ID[unitId];
  if (!unit) return null;
  return (list || []).find(d => d.id === deliverableIdFor(unitId)) || newDeliverable(unit);
}

/** At signup: a guest's deliverables become the account's. */
export async function claimDeliverables(userId) {
  if (!userId) return 0;
  const guest = await readLocal(null);
  const seeded = await fromWelcome(null, guest);
  if (!seeded.length) return 0;
  const mine = await readLocal(userId);
  const list = [...seeded, ...mine.filter(d => !seeded.some(g => g.id === d.id))];
  await writeLocal(userId, list);
  announce(userId, list);
  seeded.forEach(d => pushRemote(userId, d));
  await AsyncStorage.removeItem(localKey(null)).catch(() => {});
  return seeded.length;
}
