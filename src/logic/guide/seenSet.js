// src/logic/guide/seenSet.js
// Which surfaces the guide has already explained to this person
// (docs/shake-up-plan-2026-10-21.md §7.1). One list of surface ids per
// account, in @cth_guide_seen_v2_<uid>. prefsSync.js syncs every
// '@cth_guide_seen' key, so a note seen on one device stays seen on the next.
//
// Not wired yet: P7's useGuide calls seedGuideSeenOnce at sign-in and reads
// and marks through the functions below.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedGuideSeen, SURFACE_IDS } from './surfaces';

export const GUIDE_SEEN_PREFIX = '@cth_guide_seen';
export const guideSeenKey = (uid) => `${GUIDE_SEEN_PREFIX}_v2_${uid || 'guest'}`;
// The per-route set it replaces (src/logic/useFirstVisitTutorial.js).
const oldSeenKey = (uid) => (uid ? `@cth_screen_tutorials_seen_${uid}` : '@cth_screen_tutorials_seen');

async function readList(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : null;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

export async function loadGuideSeen(uid) {
  return new Set(await readList(guideSeenKey(uid)) || []);
}

export async function markGuideSeen(uid, surfaceId) {
  if (!SURFACE_IDS.includes(surfaceId)) return;
  const seen = await loadGuideSeen(uid);
  if (seen.has(surfaceId)) return;
  seen.add(surfaceId);
  try { await AsyncStorage.setItem(guideSeenKey(uid), JSON.stringify([...seen])); } catch { /* next visit marks it */ }
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
