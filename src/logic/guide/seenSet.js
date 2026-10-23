// src/logic/guide/seenSet.js
// What the guide has already explained to this person
// (docs/shake-up-plan-2026-10-21.md §7.1). Per account:
//   @cth_guide_seen_v2_<uid>     surface ids whose mentor note has shown
//   @cth_guide_seen_units_<uid>  unit ids whose guided walk has shown
// prefsSync.js syncs every '@cth_guide_seen' key, so a note seen on one
// device stays seen on the next: the first sign-in on a device restores the
// set, and useGuide also reads the copy saved on the account
// (profiles.metadata.prefs), so a note seen on another device since then
// doesn't show here either.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedGuideSeen, SURFACE_IDS } from './surfaces';

export const GUIDE_SEEN_PREFIX = '@cth_guide_seen';
export const guideSeenKey = (uid) => `${GUIDE_SEEN_PREFIX}_v2_${uid || 'guest'}`;
export const unitsSeenKey = (uid) => `${GUIDE_SEEN_PREFIX}_units_${uid || 'guest'}`;
// The per-route set it replaces (src/logic/useFirstVisitTutorial.js).
const oldSeenKey = (uid) => (uid ? `@cth_screen_tutorials_seen_${uid}` : '@cth_screen_tutorials_seen');

const parse = (raw) => {
  try { const list = raw ? JSON.parse(raw) : null; return Array.isArray(list) ? list : null; } catch { return null; }
};
async function readList(key) {
  try { return parse(await AsyncStorage.getItem(key)); } catch { return null; }
}

/**
 * The seen surfaces. `remotePrefs`: profiles.metadata.prefs, if loaded:
 * whatever another device saved there counts as seen here too.
 */
export async function loadGuideSeen(uid, remotePrefs = null) {
  const local = await readList(guideSeenKey(uid)) || [];
  const remote = parse(remotePrefs?.[guideSeenKey(uid)]) || [];
  return new Set([...local, ...remote]);
}

export async function markGuideSeen(uid, surfaceId) {
  if (!SURFACE_IDS.includes(surfaceId)) return;
  const seen = await loadGuideSeen(uid);
  if (seen.has(surfaceId)) return;
  seen.add(surfaceId);
  try { await AsyncStorage.setItem(guideSeenKey(uid), JSON.stringify([...seen])); } catch { /* next visit marks it */ }
}

/** A note knocked off before anyone saw it gets another go. */
export async function unmarkGuideSeen(uid, surfaceId) {
  const seen = await loadGuideSeen(uid);
  if (!seen.delete(surfaceId)) return;
  try { await AsyncStorage.setItem(guideSeenKey(uid), JSON.stringify([...seen])); } catch {}
}

export async function loadUnitsSeen(uid, remotePrefs = null) {
  const local = await readList(unitsSeenKey(uid)) || [];
  const remote = parse(remotePrefs?.[unitsSeenKey(uid)]) || [];
  return new Set([...local, ...remote]);
}

export async function markUnitSeen(uid, unitId) {
  const seen = await loadUnitsSeen(uid);
  if (seen.has(unitId)) return;
  seen.add(unitId);
  try { await AsyncStorage.setItem(unitsSeenKey(uid), JSON.stringify([...seen])); } catch {}
}

/** Settings → "Show page notes again". */
export async function resetGuideSeen(uid) {
  try { await AsyncStorage.setItem(guideSeenKey(uid), JSON.stringify([])); } catch {}
}

/**
 * Writes the v2 set from the old one, once. A set already there (from this
 * device, or restored by prefsSync from another) is left alone.
 * `existingAccount`: the account finished onboarding before the shake-up
 * (no profiles.metadata.shakeup_onboarded_at).
 */
export async function seedGuideSeenOnce(uid, { existingAccount = false } = {}) {
  if (await readList(guideSeenKey(uid))) return;
  const old = await readList(oldSeenKey(uid)) || [];
  try {
    await AsyncStorage.setItem(guideSeenKey(uid), JSON.stringify(seedGuideSeen(old, { existingAccount })));
  } catch { /* tried again next sign-in */ }
}
