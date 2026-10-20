// src/api/buildService.js
//
// Where someone's Studio Builds live (src/logic/builds.js). Same shape as
// dreamService.js: one copy in memory with listeners, so the Studio list
// and an open Build show the same thing the moment either saves.
//
// Device only for now. The Studio is a prototype until five real people
// have used it (docs/studio-plan.md); once it earns a `builds` table, the
// sync goes here the way dreamService does it, and nothing above changes.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeBuild } from '../logic/builds';

const localKey = (userId) => `@cth_builds_${userId || 'guest'}`;
const keyOf = (userId) => userId || 'guest';

const cache = {};          // userId|'guest' -> Build[] (newest first)
const listeners = new Set();

function announce(userId, list) {
  cache[keyOf(userId)] = list;
  listeners.forEach(fn => { try { fn(userId, list); } catch {} });
}

export function onBuildsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const cachedBuilds = (userId) => cache[keyOf(userId)] || null;

const newestFirst = (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));

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
  return list;
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
  return next;
}

export async function deleteBuild(userId, buildId) {
  const current = cachedBuilds(userId) || await loadBuilds(userId);
  return write(userId, current.filter(b => b.id !== buildId));
}
