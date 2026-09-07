// src/logic/leaderboardService.js
// Reads the leaderboard via two Postgres RPC functions (see
// supabase/migrations/20260826_leaderboard.sql). Using SECURITY DEFINER
// functions instead of a broad "select * from profiles" RLS policy keeps
// what other players can see limited to exactly: name, points, xp, level,
// position — never email, role, parent linkage, grade, or anything else
// profiles carries. Child accounts (role = 'child') are excluded entirely.
//
// Both functions must be created in Supabase before this works — the
// migration is not applied automatically. Until then, both calls below
// fail with Postgres error 42883 ("function does not exist"), which the
// screen shows as a friendly "not set up yet" state instead of a crash.

import { supabase } from '../api/supabaseClient';

export const LEADERBOARD_NOT_CONFIGURED = 'LEADERBOARD_NOT_CONFIGURED';

function isMissingFunction(error) {
  // PostgREST returns PGRST202/404 ("Could not find the function ... in
  // the schema cache") when an RPC name genuinely doesn't exist yet, not
  // Postgres's own 42883 — verified directly against the live endpoint
  // while adding a second RPC-gated feature (organizationService.js). The
  // 42883/message check below never actually matched here; kept as a
  // fallback in case a different call path does raise it.
  return error?.code === '42883' || error?.code === 'PGRST202'
    || /function .* does not exist/i.test(error?.message || '')
    || /could not find the function/i.test(error?.message || '');
}

/**
 * Top N players by points. Returns [] if nobody has scored yet.
 * Throws LEADERBOARD_NOT_CONFIGURED if the migration hasn't been applied.
 */
export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit });
  if (error) {
    if (isMissingFunction(error)) throw new Error(LEADERBOARD_NOT_CONFIGURED);
    throw error;
  }
  return data || [];
}

/**
 * The current player's own position/points, even when they're outside the
 * top N returned by getLeaderboard. Returns null if the player has no
 * profile row (shouldn't normally happen for a logged-in user).
 */
export async function getMyLeaderboardPosition(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.rpc('get_my_leaderboard_position', { p_user_id: userId });
  if (error) {
    if (isMissingFunction(error)) throw new Error(LEADERBOARD_NOT_CONFIGURED);
    throw error;
  }
  return data?.[0] || null;
}
