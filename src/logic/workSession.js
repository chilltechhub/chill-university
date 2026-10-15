// src/logic/workSession.js
// The running Work Mode session, kept on the device so leaving the screen
// (or the app) doesn't lose it. WorkModeScreen writes it as it changes and
// restores it on open; the top bar shows a timer pill while one is going
// and opens it again. Cleared when the session is saved or discarded.
//
// Time is kept as timestamps (accumulated seconds + running-since), so a
// session left running in the background keeps counting honestly.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cth_work_session_v1';
let current = null;
let loaded = false;
const listeners = new Set();

AsyncStorage.getItem(KEY)
  .then(raw => { try { current = raw ? JSON.parse(raw) : null; } catch { current = null; } })
  .catch(() => {})
  .finally(() => { loaded = true; listeners.forEach(fn => fn(current)); });

export function getWorkSession() { return current; }

export function saveWorkSession(session) {
  current = session;
  AsyncStorage.setItem(KEY, JSON.stringify(session)).catch(() => {});
  listeners.forEach(fn => fn(current));
}

export function clearWorkSession() {
  current = null;
  AsyncStorage.removeItem(KEY).catch(() => {});
  listeners.forEach(fn => fn(current));
}

export function onWorkSessionChange(fn) {
  listeners.add(fn);
  if (loaded) fn(current);
  return () => listeners.delete(fn);
}

export function sessionSeconds(session, now = Date.now()) {
  if (!session) return 0;
  return (session.accumulatedSeconds || 0) + (session.runningSince ? Math.floor((now - session.runningSince) / 1000) : 0);
}
