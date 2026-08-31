// src/logic/difficultyAdapter.js
// Shared "auto-adjust within a run" logic. Every game starts at the grade
// band tier the player picked (1=K-2, 2=3-5, 3=6-8, 4=9-12), then this
// nudges the *effective* tier up on a hot streak and back down after a
// couple of misses — so a run stays challenging without ever leaving the
// player stuck, while still starting where their chosen grade band says it
// should.

const MIN_TIER = 1;
const MAX_TIER = 4;

export function createAdaptiveTier(startTier = 2) {
  return {
    tier: Math.max(MIN_TIER, Math.min(MAX_TIER, Math.round(startTier))),
    hitStreak: 0,
    missStreak: 0,
  };
}

/**
 * Returns a new adapter state after one answer.
 * Bumps up a tier after 3 correct in a row, eases down a tier after 2 wrong
 * in a row. Never leaves the MIN_TIER-MAX_TIER range.
 */
export function nextAdaptiveTier(state, isCorrect) {
  const s = { ...state };
  if (isCorrect) {
    s.hitStreak += 1;
    s.missStreak = 0;
    if (s.hitStreak >= 3 && s.tier < MAX_TIER) {
      s.tier += 1;
      s.hitStreak = 0;
    }
  } else {
    s.missStreak += 1;
    s.hitStreak = 0;
    if (s.missStreak >= 2 && s.tier > MIN_TIER) {
      s.tier -= 1;
      s.missStreak = 0;
    }
  }
  return s;
}
