// src/api/pathService.js
//
// Where someone's Software for You progress lives (src/logic/softwarePath.js).
// Same shape as buildService.js: device first, one copy in memory with
// listeners, so the path list and an open mission agree at once.
//
// Device only for now, like the Studio's Builds; sync comes with them.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyProgress, normalizeProgress, markExported } from '../logic/softwarePath';

const localKey = (userId) => `@cth_softpath_${userId || 'guest'}`;
const keyOf = (userId) => userId || 'guest';

const cache = {};
const listeners = new Set();

function announce(userId, progress) {
  cache[keyOf(userId)] = progress;
  listeners.forEach(fn => { try { fn(userId, progress); } catch {} });
}

export function onPathChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const cachedPath = (userId) => cache[keyOf(userId)] || null;

export async function loadPath(userId) {
  let progress = emptyProgress();
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    progress = normalizeProgress(raw ? JSON.parse(raw) : null);
  } catch (e) {
    console.warn('path load', e?.message);
  }
  announce(userId, progress);
  return progress;
}

export async function savePath(userId, progress) {
  const next = normalizeProgress(progress);
  announce(userId, next);
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify(next)); }
  catch (e) { console.warn('path save', e?.message); }
  return next;
}

// Taking a Build home is the last mission's real step. Called by the Build
// screen, which only knows its own userId.
export async function recordExport(userId) {
  const current = cachedPath(userId) || await loadPath(userId);
  if (current.exported) return current;
  return savePath(userId, markExported(current));
}
