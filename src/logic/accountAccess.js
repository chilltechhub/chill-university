// src/logic/accountAccess.js
// Client-side mirror of the SQL is_restricted_account() in
// supabase/migrations/20260906140000_community_discover.sql.
//
// The database is the real gate — every publish/contact RPC re-checks this and
// raises. This exists so the UI can explain *why* an action is unavailable and
// hide the button, instead of letting someone write a post and only then be
// told no. Keep the two in step: same order of checks, same fail-safe default.

/**
 * @param {object|null} profile - the profiles row from UserProgressContext
 * @returns {{restricted: boolean, reason: 'minor'|'unknown-age'|null}}
 *   'minor'       — known to be under 18
 *   'unknown-age' — no is_minor and no date_of_birth, so we can't tell; treated
 *                   as restricted, because guessing wrong the other way means
 *                   exposing a child's profile to strangers
 */
export function communityAccess(profile) {
  if (!profile) return { restricted: true, reason: 'unknown-age' };

  if (profile.is_minor === true) return { restricted: true, reason: 'minor' };

  if (profile.date_of_birth) {
    const dob = new Date(profile.date_of_birth);
    const eighteen = new Date();
    eighteen.setFullYear(eighteen.getFullYear() - 18);
    return dob > eighteen
      ? { restricted: true, reason: 'minor' }
      : { restricted: false, reason: null };
  }

  if (profile.is_minor === false) return { restricted: false, reason: null };

  return { restricted: true, reason: 'unknown-age' };
}

/** Copy for the read-only banner, so both Discover screens say the same thing. */
export function restrictionMessage(reason, { action = 'Posting publicly' } = {}) {
  if (reason === 'minor') {
    return `${action} is turned off for student accounts, so your profile stays private. You can still read everything here.`;
  }
  return `${action} needs your date of birth first — add it in Settings. Until then you can read everything here.`;
}
