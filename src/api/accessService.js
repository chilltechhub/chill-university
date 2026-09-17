// src/api/accessService.js
// Supabase access for the Compass — unlocks, objectives, test attempts and
// the three profile fields that drive them (plan, experimental opt-in,
// purpose). Schema: supabase/migrations/20260915120000_compass_feature_gating.sql
//
// Two rules this module lives by:
//
//  1. It fails soft. The migration may not be applied yet on a given
//     project, and the Compass is an orientation layer, not a paywall —
//     a missing table should mean "nothing is unlocked yet", not a broken
//     app. Same posture as HomeScreen's getMyOpenAssignments() call, which
//     already degrades one rail rather than blanking the desk.
//
//  2. It never grants anything itself. Every unlock goes through an RPC
//     that re-checks the gate server-side. The client decides what to ask
//     for; the database decides whether that was true.
//
// Reads are cache-first (src/api/offlineCache.js) so a cold or offline
// launch still knows what you had unlocked last time rather than briefly
// re-locking the app in front of you.

import { supabase } from './supabaseClient';
import { cacheRead, cacheWrite, isOnline } from './offlineCache';

const cacheKeyFor = (userId) => `compass_access_${userId}`;

// Postgres/PostgREST codes for "that table or function isn't there" — the
// exact case the migration-not-applied fallback exists for. Anything else
// is a real error and gets logged.
const MISSING_SCHEMA_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);

function isMissingSchema(error) {
  if (!error) return false;
  if (MISSING_SCHEMA_CODES.has(error.code)) return true;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('does not exist') || msg.includes('schema cache');
}

function warn(where, error) {
  if (!error || isMissingSchema(error)) return;
  console.warn(`[access] ${where}`, error.message || error);
}

export const EMPTY_ACCESS = {
  unlocks: {},
  attempts: {},
  objectives: {},
  ready: false,
};

/**
 * Everything the gate logic needs for one account, keyed for direct lookup.
 * Always resolves — never throws — so callers can treat it as state, not a
 * request that might fail.
 */
export async function fetchAccessState(userId) {
  if (!userId) return { ...EMPTY_ACCESS, ready: true };

  const key = cacheKeyFor(userId);
  const cached = await cacheRead(key);

  if (!(await isOnline())) {
    return cached ? { ...cached, ready: true } : { ...EMPTY_ACCESS, ready: true };
  }

  const [unlockRes, attemptRes, objectiveRes] = await Promise.all([
    supabase.from('feature_unlocks').select('feature_id, method, unlocked_at').eq('user_id', userId),
    supabase.from('feature_test_attempts').select('feature_id, passed, score, total, attempted_at').eq('user_id', userId),
    supabase.from('user_objectives').select('objective_id, status, steps, started_at, completed_at').eq('user_id', userId),
  ]);

  warn('feature_unlocks', unlockRes.error);
  warn('feature_test_attempts', attemptRes.error);
  warn('user_objectives', objectiveRes.error);

  // A failed read must not look like an empty one — re-locking features
  // somebody already earned because the network hiccuped is the single
  // worst thing this module could do. Fall back to what we last knew.
  if (unlockRes.error || attemptRes.error || objectiveRes.error) {
    if (cached) return { ...cached, ready: true };
    if (!isMissingSchema(unlockRes.error || attemptRes.error || objectiveRes.error)) {
      return { ...EMPTY_ACCESS, ready: true };
    }
  }

  const state = {
    unlocks: Object.fromEntries((unlockRes.data || []).map(r => [r.feature_id, r])),
    attempts: Object.fromEntries((attemptRes.data || []).map(r => [r.feature_id, r])),
    objectives: Object.fromEntries((objectiveRes.data || []).map(r => [r.objective_id, r])),
  };

  await cacheWrite(key, state);
  return { ...state, ready: true };
}

/* ─── Objectives ──────────────────────────────────────────────────────────── */

/**
 * Makes `objectiveId` the one active objective. Anything else currently
 * active is abandoned first — the partial unique index in SQL enforces
 * single-focus, so this is the app being explicit about it rather than
 * discovering it as a constraint violation.
 *
 * Re-starting an objective that was abandoned earlier reactivates that same
 * row (steps and all), which is why it's an upsert rather than an insert.
 */
export async function startObjective(userId, objectiveId) {
  if (!userId || !objectiveId) return { error: new Error('Missing user or objective') };

  const { error: clearError } = await supabase
    .from('user_objectives')
    .update({ status: 'abandoned' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('objective_id', objectiveId);
  warn('abandon previous objective', clearError);
  if (clearError && isMissingSchema(clearError)) return { error: clearError, missingSchema: true };

  const { data, error } = await supabase
    .from('user_objectives')
    .upsert(
      { user_id: userId, objective_id: objectiveId, status: 'active' },
      { onConflict: 'user_id,objective_id' }
    )
    .select()
    .maybeSingle();

  warn('startObjective', error);
  return { data, error, missingSchema: isMissingSchema(error) };
}

/** Persists the checked-off step map for an objective. */
export async function saveObjectiveSteps(userId, objectiveId, steps) {
  const { data, error } = await supabase
    .from('user_objectives')
    .update({ steps })
    .eq('user_id', userId)
    .eq('objective_id', objectiveId)
    .select()
    .maybeSingle();

  warn('saveObjectiveSteps', error);
  return { data, error, missingSchema: isMissingSchema(error) };
}

/** Completes the active objective and grants its unlocks in one transaction. */
export async function completeObjective(objectiveId, unlockIds = []) {
  const { data, error } = await supabase.rpc('complete_objective', {
    p_objective_id: objectiveId,
    p_unlock_ids: unlockIds,
  });

  warn('completeObjective', error);
  return { data, error, missingSchema: isMissingSchema(error) };
}

export async function abandonObjective(userId, objectiveId) {
  const { error } = await supabase
    .from('user_objectives')
    .update({ status: 'abandoned' })
    .eq('user_id', userId)
    .eq('objective_id', objectiveId)
    .eq('status', 'active');

  warn('abandonObjective', error);
  return { error, missingSchema: isMissingSchema(error) };
}

/* ─── Unlocks ─────────────────────────────────────────────────────────────── */

/**
 * Asks the server to grant a feature. `method` is which gate the caller
 * believes it cleared — unlock_feature() re-checks it and raises if not, so
 * a rejection here is information, not a bug to route around.
 */
export async function unlockFeature(featureId, method, objectiveId = null) {
  const { data, error } = await supabase.rpc('unlock_feature', {
    p_feature_id: featureId,
    p_method: method,
    p_objective_id: objectiveId,
  });

  warn('unlockFeature', error);
  return { data, error, missingSchema: isMissingSchema(error) };
}

/**
 * The one allowed test-out attempt. A second call for the same feature comes
 * back as an error from the unique constraint, which is the rule working —
 * callers surface it rather than retrying.
 */
export async function recordTestAttempt({ featureId, score, total, passMark }) {
  const { data, error } = await supabase.rpc('record_test_attempt', {
    p_feature_id: featureId,
    p_score: score,
    p_total: total,
    p_pass_mark: passMark,
  });

  warn('recordTestAttempt', error);
  return { data, error, missingSchema: isMissingSchema(error) };
}

/* ─── Profile fields ──────────────────────────────────────────────────────── */

export async function setPurpose(userId, purposeKey) {
  const { error } = await supabase
    .from('profiles')
    .update({ purpose_key: purposeKey })
    .eq('id', userId);

  warn('setPurpose', error);
  return { error, missingSchema: isMissingSchema(error) };
}

export async function setExperimentalOptIn(userId, on) {
  const { error } = await supabase
    .from('profiles')
    .update({ experimental_opt_in: !!on })
    .eq('id', userId);

  warn('setExperimentalOptIn', error);
  return { error, missingSchema: isMissingSchema(error) };
}

/** Drops the cached snapshot — used on sign-out so the next account starts clean. */
export async function clearAccessCache(userId) {
  if (!userId) return;
  await cacheWrite(cacheKeyFor(userId), { unlocks: {}, attempts: {}, objectives: {} });
}
