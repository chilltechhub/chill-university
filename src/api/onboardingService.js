// src/api/onboardingService.js
//
// The one place that knows which onboarding answers are `profiles` columns
// and which are local-only. Both surfaces that ask onboarding questions go
// through here:
//
//   - src/screens/MultiStepOnboarding.js  (the required core, before the app)
//   - src/components/GettingStartedCard.js (everything else, from Home)
//
// Why an allowlist rather than just upserting whatever it's handed: the
// `profiles` table predates supabase/migrations/ and has drifted from it —
// `active_persona`, for one, is in a migration but is NOT on the live table.
// A single upsert containing one unknown key gets rejected *whole* by
// PostgREST (42703), so before this module a stray field would silently
// throw away every other answer in the same save. Now unknown keys are
// dropped with a warning and the rest still lands.
//
// The answers that have no column — the persona pick, planner selections,
// hidden Library sections, usage patterns — live in the AsyncStorage draft
// below and in their own real homes (persona_profiles, planner
// subscriptions, the HIDDEN_LIBRARY_SECTIONS setting).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { subscribeToComponent, generateInstances } from './plannerService';

const DRAFT_KEY = '@cth_onboarding_draft';

// Verified against the live table. Keep in sync if you add a column.
const PROFILE_COLUMNS = new Set([
  'display_name', 'traveler_name', 'age_category', 'active_life_areas',
  'hidden_life_areas', 'suit_color', 'badge', 'topics', 'formats',
  'tech_level', 'primary_goal', 'daily_minutes', 'life_stage',
  'wants_reflection', 'theme', 'onboarding_completed',
]);

/**
 * Upsert whatever subset of onboarding answers is passed. Unknown keys are
 * dropped rather than allowed to fail the whole write. Returns silently on
 * an empty payload so callers can hand it a partial diff without checking.
 */
export async function saveOnboardingFields(userId, partial) {
  if (!userId || !partial) return;

  const payload = { id: userId };
  const unknown = [];
  for (const [key, value] of Object.entries(partial)) {
    if (PROFILE_COLUMNS.has(key)) payload[key] = value;
    else unknown.push(key);
  }
  if (unknown.length) {
    console.warn('onboarding: not profiles columns, skipped —', unknown.join(', '));
  }
  if (Object.keys(payload).length === 1) return; // id only, nothing to write

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) throw error;
}

// ─── Draft (resume) ─────────────────────────────────────────────────────────
// The old flow kept all eight steps in one useState object and wrote nothing
// until the final tap, so quitting at step 6 lost everything and dropped you
// back at step 1 — `onboarding_completed` was still false. The core steps now
// write to `profiles` as they go; this covers the rest: the step index and
// the answers with no column to land in.
//
// Device-local on purpose. A draft is worth exactly as long as the sitting
// it belongs to; anything that matters past that is already a real row.

// Stamped with the account it belongs to. One key per device meant a second
// account signing up on the same phone opened at the first one's step 6,
// with its persona and theme picks, having answered nothing.
async function currentUserId() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch { return null; }
}

export async function loadOnboardingDraft() {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    const uid = await currentUserId();
    // A draft with no owner predates the stamp; only trust it on the same
    // sitting's account, which we can no longer tell, so drop it.
    if (!draft?.uid || draft.uid !== uid) return null;
    return draft;
  } catch (e) {
    console.warn('onboarding: could not read draft', e?.message);
    return null;
  }
}

export async function saveOnboardingDraft(draft) {
  try {
    const uid = await currentUserId();
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, uid }));
  } catch (e) {
    console.warn('onboarding: could not save draft', e?.message);
  }
}

export async function clearOnboardingDraft() {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch { /* nothing to do about it */ }
}

// ─── Planner starters ───────────────────────────────────────────────────────
// Same subscribeToComponent + generateInstances pair the Planner's own "Add"
// panel calls. Per-item try/catch: one template failing to schedule shouldn't
// cost the user the other four.

export async function applyPlannerPicks(userId, picks) {
  if (!userId || !picks?.length) return;
  for (const comp of picks) {
    try {
      await subscribeToComponent(userId, comp.id);
      await generateInstances(userId, comp);
    } catch (e) {
      console.warn('onboarding planner subscribe', comp.id, e?.message);
    }
  }
}
