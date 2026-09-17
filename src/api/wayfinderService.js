// src/api/wayfinderService.js
//
// Where a Wayfinder map lives. Local-first, synced when it can be.
//
// Local-first because this is the one screen in the app most likely to be
// opened by someone who hasn't committed to anything yet — a guest, someone
// on a bad connection, someone who closes it halfway through. None of that
// should lose their answers.
//
// Synced to `wayfinder_maps` (one row per account — see
// supabase/migrations/20260914120000_wayfinder_maps.sql) so the map follows
// the person to another device. It's per ACCOUNT, not per profile, on
// purpose: who you are doesn't change when you switch to your side-job
// profile. The table isn't in profileScopedClient's SCOPED_TABLES for the
// same reason.
//
// If that migration hasn't been applied yet — which has happened to more than
// one migration in this project — the first failed read marks the remote as
// missing and everything keeps working locally for the rest of the session.
// Nothing is thrown at the screen.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { normalizeState } from '../logic/wayfinderScoring';

const TABLE = 'wayfinder_maps';
const localKey = (userId) => `@cth_wayfinder_${userId || 'guest'}`;

// Set by onboarding's "I'm not sure yet" choice. Read by Home (to lead the
// dashboard with Wayfinder) and the Getting Started card (first action).
const INTENT_KEY = '@cth_wayfinder_intent';

let remoteMissing = false;
const pushTimers = {};

function isMissingTable(error) {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  const msg = String(error.message || '');
  return msg.includes(TABLE) && (msg.includes('does not exist') || msg.includes('Could not find'));
}

async function readLocal(userId) {
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function pushRemote(userId, state) {
  if (!userId || remoteMissing) return;
  try {
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, data: state, updated_at: state.updatedAt || new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) {
      if (isMissingTable(error)) remoteMissing = true;
      else console.warn('wayfinder push', error.message);
    }
  } catch (e) {
    console.warn('wayfinder push', e?.message);
  }
}

export async function loadWayfinder(userId) {
  const local = await readLocal(userId);
  if (!userId || remoteMissing) return normalizeState(local);

  try {
    const { data, error } = await supabase
      .from(TABLE).select('data, updated_at').eq('user_id', userId).maybeSingle();
    if (error) {
      if (isMissingTable(error)) remoteMissing = true;
      else console.warn('wayfinder load', error.message);
      return normalizeState(local);
    }

    const remote = data?.data || null;
    const remoteAt = Date.parse(remote?.updatedAt || data?.updated_at || '') || 0;
    const localAt = Date.parse(local?.updatedAt || '') || 0;

    if (remote && remoteAt > localAt) {
      AsyncStorage.setItem(localKey(userId), JSON.stringify(remote)).catch(() => {});
      return normalizeState(remote);
    }
    // Local is newer (edited offline, or before the table existed) — send it up.
    if (local && localAt > remoteAt) pushRemote(userId, local);
  } catch (e) {
    console.warn('wayfinder load', e?.message);
  }
  return normalizeState(local);
}

// Stamps the timestamps synchronously so the caller can put the exact saved
// object into React state, then persists without making anyone wait on it.
export function stampWayfinder(state) {
  const now = new Date().toISOString();
  return { ...state, startedAt: state.startedAt || now, updatedAt: now };
}

export function persistWayfinder(userId, state) {
  AsyncStorage.setItem(localKey(userId), JSON.stringify(state))
    .catch(e => console.warn('wayfinder local save', e?.message));
  if (!userId) return;
  // Answering 30 quick questions shouldn't be 30 network writes.
  clearTimeout(pushTimers[userId]);
  pushTimers[userId] = setTimeout(() => pushRemote(userId, state), 900);
}

export async function resetWayfinder(userId) {
  await AsyncStorage.removeItem(localKey(userId)).catch(() => {});
  if (!userId || remoteMissing) return;
  try {
    const { error } = await supabase.from(TABLE).delete().eq('user_id', userId);
    if (error && isMissingTable(error)) remoteMissing = true;
  } catch (e) {
    console.warn('wayfinder reset', e?.message);
  }
}

export async function getWayfinderIntent() {
  try { return (await AsyncStorage.getItem(INTENT_KEY)) === '1'; } catch { return false; }
}

export async function setWayfinderIntent(on) {
  try {
    if (on) await AsyncStorage.setItem(INTENT_KEY, '1');
    else await AsyncStorage.removeItem(INTENT_KEY);
  } catch (e) {
    console.warn('wayfinder intent', e?.message);
  }
}
