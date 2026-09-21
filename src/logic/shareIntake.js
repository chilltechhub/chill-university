// src/logic/shareIntake.js
// Things shared INTO the app, waiting to be filed.
//
// Three ways in, one list:
//   - the phone's Share button in another app (Safari, TikTok, Notes...) —
//     components/ShareIntentListener.js, in a dev/store build only
//   - "Paste something in" on the Notification Center, which works anywhere,
//     Expo Go and web included
//   - anything else that calls addShared()
//
// Kept on the device until it's filed or thrown away. Each one shows as a
// "You shared ..." notice until then (notices.js), so a link shared in a
// hurry doesn't vanish.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cth_shared_inbox_v1';
const MAX = 30;
let cache = null;
const listeners = new Set();

async function read() {
  if (cache) return cache;
  try { cache = JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'); } catch { cache = []; }
  return cache;
}

async function write(list) {
  cache = list.slice(0, MAX);
  try { await AsyncStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* kept in memory */ }
  listeners.forEach(fn => { try { fn(cache); } catch { /* listener's problem */ } });
}

// Splits "look at this https://x.com/y" into text + url.
export function splitShared(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/https?:\/\/[^\s<>"]+/i);
  if (!m) return { text: s, url: null };
  const text = s.replace(m[0], '').trim();
  return { text: text || null, url: m[0].replace(/[).,;]+$/, '') };
}

export async function addShared({ text, url }) {
  const clean = { text: text ? String(text).trim().slice(0, 4000) : null, url: url || null };
  if (!clean.text && !clean.url) return null;
  const list = await read();
  // Sharing the same thing twice in a row is a double tap, not two items.
  const dupe = list.find(x => x.url === clean.url && x.text === clean.text);
  if (dupe) return dupe;
  const item = { id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ...clean, receivedAt: new Date().toISOString() };
  await write([item, ...list]);
  return item;
}

export async function listShared() { return [...(await read())]; }

export async function getShared(id) { return (await read()).find(x => x.id === id) || null; }

export async function removeShared(id) {
  await write((await read()).filter(x => x.id !== id));
}

export function onSharedChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
