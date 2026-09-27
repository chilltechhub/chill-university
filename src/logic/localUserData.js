// src/logic/localUserData.js
// What a signed-in person leaves on the device, and wiping it on the way out.
//
// Sign-out used to call supabase.auth.signOut() and nothing else, so the next
// person to use the phone inherited the last one's cached profile, onboarding
// draft, offline queue, shared-inbox items, reminders state and their own
// Anthropic key. "Close my account" (under-13s) promised to delete "everything,
// including your email and birthday" and left both in @cth_cache_profile_<uid>
// (found 2026-09-27).
//
// Device preferences stay: theme, accent, UI prefs, and remote config/content
// that isn't about the person.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase as rawClient } from '../api/supabaseClient';
import { flushQueue, clearQueueFor } from '../api/offlineCache';
import { clearUserApiKey } from '../api/aiKey';

// Keys that hold one person's data without their id in the name.
const PERSONAL_KEYS = [
  '@cth_onboarding_draft',
  '@cth_active_profile_id',
  '@cth_pending_org_code',
  '@cth_wayfinder_intent',
  '@cth_shared_inbox_v1',
  '@cth_notice_state_v1',
  '@cth_notice_prefs_v1',
  '@cth_hub_suppressed_v1',
  '@cth_hub_auto_v1',
  '@cth_profiles_signed_out',
  '@cth_screen_tutorials_seen',
  '@cth_academy_grade_band',
  'command_palette_recents',
  'plan_reminder_notif_ids',
  'skill_stats_v1',
];
// Prefixes whose keys are per person: every offline cache (profile, missions,
// projects, grade picks, skill stats — a refetch is the only cost), behaviour
// settings (educator mode, hidden sections, tours), per-profile widget state,
// profile PINs and view scopes. Theme, accent, UI prefs and remote content
// stay: they're how the device looks, not who used it.
const PERSONAL_PREFIXES = [
  '@cth_cache_', '@cth_setting_', '@cth_widget_',
  '@cth_profile_pin_', '@cth_view_scope_',
];

/**
 * Wipe the signed-in person's data from this device. Call it BEFORE
 * supabase.auth.signOut(): it first tries to send anything still queued
 * offline, which needs the session.
 */
export async function clearLocalUserData(userId) {
  try { await flushQueue(rawClient); } catch { /* offline — dropped below */ }
  try { await clearQueueFor(userId); } catch {}
  try { await clearUserApiKey(); } catch {}
  try {
    const keys = await AsyncStorage.getAllKeys();
    const doomed = keys.filter(k =>
      (userId && k.includes(userId))
      || PERSONAL_KEYS.includes(k)
      || PERSONAL_PREFIXES.some(p => k.startsWith(p)));
    if (doomed.length) await AsyncStorage.multiRemove(doomed);
  } catch (e) {
    console.warn('[clearLocalUserData]', e?.message || e);
  }
}

/** Sign out and leave nothing of this person behind on the device. */
export async function signOutAndClear() {
  let userId = null;
  try { userId = (await rawClient.auth.getSession())?.data?.session?.user?.id || null; } catch {}
  await clearLocalUserData(userId);
  await rawClient.auth.signOut();
}
