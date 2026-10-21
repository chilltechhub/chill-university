// src/logic/prefsSync.js
// How the app looks and behaves for a person, kept on their account.
//
// Sign-out wipes a person's settings from the phone (localUserData.js), so
// the next person on it starts clean. But nothing kept them anywhere else:
// signing back in brought back the default character, background, toggles
// and layout (2026-10-15). Now every write to one of the keys below is
// copied to profiles.metadata.prefs (a few seconds later, batched), and the
// first sign-in on a device puts them back before the screens read them.
//
// Which keys: every '@cth_setting_*' toggle, the character loadout, theme,
// style, accent, UI prefs, accessibility, and which tips, Home-card intros
// and stage cards have been seen. Not the offline caches.
//
// Writes are caught by wrapping AsyncStorage.setItem once, at import, so no
// screen has to remember to call anything.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabaseClient';

const EXACT = ['@cth_cache_characterLoadout', '@cth_theme', '@cth_theme_style', '@cth_theme_accent', '@cth_ui_prefs', '@cth_a11y'];
// Also what's already been shown, so tips, "New on Home" intros, stage
// cards and guide notes don't replay after signing back in (some carry the
// account id). '@cth_guide_seen' is the guide's v2 set (src/logic/guide/seenSet.js).
const PREFIXES = ['@cth_setting_', '@cth_screen_tutorials_seen', '@cth_widget_', '@cth_experience_stage_seen', '@cth_guide_seen'];
export const isSyncedPref = (k) => EXACT.includes(k) || PREFIXES.some(p => k.startsWith(p));

let userId = null;
let timer = null;
let restoring = false;
const listeners = new Set();

/** Something that read prefs at startup re-reads them after a restore. */
export function onPrefsRestored(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const origSet = AsyncStorage.setItem.bind(AsyncStorage);
const origRemove = AsyncStorage.removeItem.bind(AsyncStorage);
AsyncStorage.setItem = (key, value, ...rest) => {
  const p = origSet(key, value, ...rest);
  if (isSyncedPref(key)) schedulePush();
  return p;
};
AsyncStorage.removeItem = (key, ...rest) => {
  const p = origRemove(key, ...rest);
  if (isSyncedPref(key)) schedulePush();
  return p;
};

function schedulePush() {
  if (!userId || restoring) return;
  clearTimeout(timer);
  timer = setTimeout(() => { pushPrefs().catch(() => {}); }, 3000);
}

async function gather() {
  const keys = (await AsyncStorage.getAllKeys()).filter(isSyncedPref);
  const pairs = await AsyncStorage.multiGet(keys);
  return Object.fromEntries(pairs.filter(([, v]) => v != null));
}

async function readMetadata(uid) {
  const { data, error } = await supabase.from('profiles').select('metadata').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data?.metadata && typeof data.metadata === 'object' ? data.metadata : {};
}

export async function pushPrefs() {
  const uid = userId;
  if (!uid) return;
  try {
    const prefs = await gather();
    const meta = await readMetadata(uid);
    const { error } = await supabase.from('profiles')
      .update({ metadata: { ...meta, prefs, prefs_at: new Date().toISOString() } }).eq('id', uid);
    if (error) console.warn('[prefsSync] save', error.message);
  } catch (e) { console.warn('[prefsSync] save', e?.message || e); }
}

const restoredKey = (uid) => `@cth_prefs_restored_${uid}`;

/**
 * Called when someone is signed in. The first time on this device (since
 * the last sign-out), the account's saved prefs are written back to the
 * phone and listeners re-read them. After that, the phone's own writes are
 * what gets saved.
 */
export async function startPrefsSync(uid) {
  userId = uid || null;
  if (!uid) return;
  try {
    if (await AsyncStorage.getItem(restoredKey(uid))) return;
    const prefs = (await readMetadata(uid)).prefs;
    if (prefs && typeof prefs === 'object' && Object.keys(prefs).length) {
      restoring = true;
      await AsyncStorage.multiSet(Object.entries(prefs).filter(([k, v]) => isSyncedPref(k) && typeof v === 'string'));
      restoring = false;
      listeners.forEach(fn => { try { fn(); } catch {} });
    } else {
      // Nothing saved yet (first time with this build): save what's here.
      schedulePush();
    }
    await origSet(restoredKey(uid), '1');
  } catch (e) {
    restoring = false;
    console.warn('[prefsSync] restore', e?.message || e);
  }
}

export function stopPrefsSync() {
  clearTimeout(timer);
  userId = null;
}
