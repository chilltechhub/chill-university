// src/api/buildService.js
//
// Where someone's Studio Builds live (src/logic/builds.js). Same shape as
// dreamService.js: one copy in memory with listeners, so the Studio list
// and an open Build show the same thing the moment either saves.
//
// The phone holds them. Signed in, each save also goes to the `builds`
// table (20261023120000_shakeup_p6.sql, shake-up P6), and what was already
// on the phone uploads once. That table is hand-applied: until it exists
// the upload fails quietly and the phone copy is the record.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { normalizeBuild } from '../logic/builds';
import { trophyArts } from '../logic/studio';
import { setEarnedTrophies } from '../logic/stageDecor';

const localKey = (userId) => `@cth_builds_${userId || 'guest'}`;
const keyOf = (userId) => userId || 'guest';

const cache = {};          // userId|'guest' -> Build[] (newest first)
const listeners = new Set();
let latest = null;         // the last list loaded, whoever's it was

// The trophies follow whoever's Builds loaded last: the person using the
// app (a profile switch reloads them).
function announce(userId, list) {
  cache[keyOf(userId)] = list;
  latest = list;
  setEarnedTrophies(trophyArts(list));
  listeners.forEach(fn => { try { fn(userId, list); } catch {} });
}

export function onBuildsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const cachedBuilds = (userId) => cache[keyOf(userId)] || null;

// Before a screen knows who's signed in: the list loaded last (at launch,
// the person using the app), so it doesn't flash empty.
export const latestBuilds = () => latest;

const newestFirst = (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));

const toRow = (userId, b) => ({ id: b.id, user_id: userId, kind: b.kind, data: b, updated_at: b.updatedAt || new Date().toISOString() });
const missingTable = (error) => error && (error.code === '42P01' || error.code === 'PGRST205');

async function pushBuilds(userId, list) {
  if (!userId || !list.length) return false;
  try {
    const { error } = await supabase.from('builds').upsert(list.map(b => toRow(userId, b)), { onConflict: 'user_id,id' });
    if (error) { if (!missingTable(error)) console.warn('builds push', error.message); return false; }
    return true;
  } catch { return false; }
}

// Once per account on this phone: everything made before the table existed.
async function uploadOnce(userId, list) {
  const flag = `@cth_builds_uploaded_${userId}`;
  try {
    if (await AsyncStorage.getItem(flag)) return;
    if (await pushBuilds(userId, list)) await AsyncStorage.setItem(flag, '1');
  } catch {}
}

export async function loadBuilds(userId) {
  let list = [];
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    list = (Array.isArray(parsed) ? parsed : []).map(normalizeBuild).filter(Boolean).sort(newestFirst);
  } catch (e) {
    console.warn('builds load', e?.message);
  }
  announce(userId, list);
  if (userId) uploadOnce(userId, list);
  return list;
}

// For launch (App.js) and anywhere without a userId to hand: whoever is
// signed in, or the guest.
export async function loadMyBuilds() {
  let userId = null;
  try { userId = (await supabase.auth.getSession())?.data?.session?.user?.id || null; } catch {}
  return loadBuilds(userId);
}

async function write(userId, list) {
  announce(userId, list);
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify(list)); }
  catch (e) { console.warn('builds save', e?.message); }
  return list;
}

// Adds or replaces one Build. Resolves the saved (normalized) Build.
export async function saveBuild(userId, build) {
  const next = normalizeBuild(build);
  if (!next) return null;
  const current = cachedBuilds(userId) || await loadBuilds(userId);
  await write(userId, [next, ...current.filter(b => b.id !== next.id)].sort(newestFirst));
  if (userId) pushBuilds(userId, [next]);
  return next;
}

export async function deleteBuild(userId, buildId) {
  const current = cachedBuilds(userId) || await loadBuilds(userId);
  return write(userId, current.filter(b => b.id !== buildId));
}
