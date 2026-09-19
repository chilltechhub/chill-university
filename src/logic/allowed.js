// src/logic/allowed.js
// Question 1 of the four in docs/access-system.md: "Allowed?".
//
// The only question that can make something truly unreachable for an
// account, and the only one nothing below it can override. It asks two
// things: how old is this person, and has a remote switch turned this off.
// Everything that must not happen is also refused in SQL — this file is the
// app's copy of those rules, so it can hide what the database would refuse
// instead of letting someone run into an error.
//
// ─── One meaning of "minor" ─────────────────────────────────────────────────
// Under 18 by birth date, or age unknown. That is the SQL
// is_restricted_account() test, exactly: is_minor, then date_of_birth, then
// restricted.
//
// NOT profiles.is_minor on its own. That column is the digital-consent flag
// (under 13 in the US) and only drives the parent-consent flow; reading it as
// "under 18" is how a 15-year-old once got offered Business. It still counts
// here when it's true, because under 13 is also under 18.
//
// The age band for TAILORING content (ageBandFor in profileResolver.js) is a
// different question — which version of an action to show — and may fall
// back to the stored age_category. Safety never does: no birth date means
// restricted.
//
// No React, no I/O.

import { ageCategoryFromDob, isMinorBand } from './profileResolver';

/**
 * @param {object|null} profile - the profiles row, or null for a guest
 * @returns {{ minor: boolean, known: boolean, reason: 'minor'|'unknown-age'|null, band: string|null }}
 */
export function ageStatus(profile) {
  if (!profile) return { minor: true, known: false, reason: 'unknown-age', band: null };
  const band = ageCategoryFromDob(profile.date_of_birth);
  if (profile.is_minor === true) return { minor: true, known: true, reason: 'minor', band };
  if (band) {
    return isMinorBand(band)
      ? { minor: true, known: true, reason: 'minor', band }
      : { minor: false, known: true, reason: null, band };
  }
  return { minor: true, known: false, reason: 'unknown-age', band: null };
}

/**
 * Publishing, contacting strangers, being listed. The server re-checks every
 * one of these and raises; this is so the button isn't offered.
 * @returns {{restricted: boolean, reason: 'minor'|'unknown-age'|null}}
 */
export function communityAccess(profile) {
  const { minor, reason } = ageStatus(profile);
  return { restricted: minor, reason };
}

/** Copy for the read-only banner, so both Discover screens say the same thing. */
export function restrictionMessage(reason, { action = 'Posting publicly' } = {}) {
  if (reason === 'minor') {
    return `${action} is turned off for accounts under 18, so your profile stays private. You can still read everything here.`;
  }
  return `${action} needs your date of birth first. Add it in Settings. Until then you can read everything here.`;
}

// Content marked `adult: true` (the business-ownership and startup tracks in
// classCatalog.js) is for 18+ only. This used to ride on account type —
// minors can't pick Business, so they never saw it — which meant a safety
// rule depended on a preference. Now it's an age rule, and account type only
// decides what's on the map (question 3).
export function contentAllowed(item, status) {
  return !item?.adult || !status?.minor;
}

// app_config's 'disabled_games' row: a game switched off remotely, no build
// needed. Gone from every list for everyone.
export function gameAllowed(gameId, disabledIds = []) {
  return !Array.isArray(disabledIds) || !disabledIds.includes(gameId);
}
