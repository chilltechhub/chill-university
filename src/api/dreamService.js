// src/api/dreamService.js
//
// Where someone's dream lives (src/logic/dream.js). Same pattern as
// wayfinderService.js: local-first, synced when it can be.
//
// Local-first so a guest, a bad connection or a database without the
// migration never loses what they wrote. Synced to `dreams` (one row per
// ACCOUNT, supabase/migrations/20261017120000_dreams.sql): who you are
// doesn't change when you switch to your side-job profile, so it isn't in
// profileScopedClient's SCOPED_TABLES.
//
// If the table isn't there yet, the first failed call marks the remote as
// missing and everything keeps working on the device.
//
// One copy in memory with listeners, so the Home card and the editor show
// the same thing the moment either saves.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { normalizeDream } from '../logic/dream';

const TABLE = 'dreams';
const localKey = (userId) => `@cth_dream_${userId || 'guest'}`;

let remoteMissing = false;
const pushTimers = {};
const cache = {};           // userId|'guest' -> dream
const listeners = new Set();

function isMissingTable(error) {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  const msg = String(error.message || '');
  return msg.includes(TABLE) && (msg.includes('does not exist') || msg.includes('Could not find'));
}

const keyOf = (userId) => userId || 'guest';

function announce(userId, dream) {
  cache[keyOf(userId)] = dream;
  listeners.forEach(fn => { try { fn(userId, dream); } catch {} });
}

export function onDreamChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function cachedDream(userId) {
  return cache[keyOf(userId)] || null;
}

async function readLocal(userId) {
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function pushRemote(userId, dream) {
  if (!userId || remoteMissing) return;
  try {
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, data: dream, updated_at: dream.updatedAt || new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) {
      if (isMissingTable(error)) remoteMissing = true;
      else console.warn('dream push', error.message);
    }
  } catch (e) {
    console.warn('dream push', e?.message);
  }
}

// The device copy only, no network: for a save that mustn't wait on one
// (onboarding's finish). Normalized.
export async function loadLocalDream(userId) {
  return normalizeDream(cachedDream(userId) || await readLocal(userId));
}

export async function loadDream(userId) {
  const local = await readLocal(userId);
  let result = normalizeDream(local);
  if (userId && !remoteMissing) {
    try {
      const { data, error } = await supabase
        .from(TABLE).select('data, updated_at').eq('user_id', userId).maybeSingle();
      if (error) {
        if (isMissingTable(error)) remoteMissing = true;
        else console.warn('dream load', error.message);
      } else {
        const remote = data?.data || null;
        const remoteAt = Date.parse(remote?.updatedAt || data?.updated_at || '') || 0;
        const localAt = Date.parse(local?.updatedAt || '') || 0;
        if (remote && remoteAt > localAt) {
          AsyncStorage.setItem(localKey(userId), JSON.stringify(remote)).catch(() => {});
          result = normalizeDream(remote);
        } else if (local && localAt > remoteAt) {
          // Written offline, or before the table existed: send it up.
          pushRemote(userId, local);
        }
      }
    } catch (e) {
      console.warn('dream load', e?.message);
    }
  }
  announce(userId, result);
  return result;
}

// Saves on the device first (awaited, so a screen opened right after sees
// it), then to the account a moment later.
export async function saveDream(userId, dream) {
  const next = normalizeDream(dream);
  announce(userId, next);
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify(next)); }
  catch (e) { console.warn('dream local save', e?.message); }
  if (!userId) return next;
  clearTimeout(pushTimers[userId]);
  pushTimers[userId] = setTimeout(() => pushRemote(userId, next), 600);
  return next;
}
