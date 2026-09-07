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

// Shared "round length" curve for games built around discrete leveling
// rounds (answer N correct to advance — FactorCraft, CoinGame). Round 1 of
// every run is short on purpose, regardless of which grade band/starting
// tier the player picked, so a first win comes quickly; each round
// completed within the SAME run — not the grade-band starting difficulty —
// then makes the next round need a few more correct answers, up to a cap.
// Pair with a game's own per-level difficulty scaling (bigger numbers,
// tighter timers, etc.) for the "harder AND longer as you progress" curve
// the player actually feels — this function only owns the "longer" half.
const ROUND_LEN_START = 4;
const ROUND_LEN_STEP  = 2;   // +1 question needed every this-many rounds cleared
const ROUND_LEN_MAX   = 12;

export function roundLength(roundsCompletedThisRun = 0) {
  return Math.min(ROUND_LEN_START + Math.floor(roundsCompletedThisRun / ROUND_LEN_STEP), ROUND_LEN_MAX);
}

// How many rounds make up one session for games built around a fixed
// number of discrete rounds per run (every game with a RoundCompleteScreen
// prize pick) — round 1 is still short (roundLength(0) = 4), but a player
// who keeps clearing rounds now gets a full 10-round run instead of
// stopping at 3, growing to roundLength(9) = 8 questions in the final
// round (sum: 4+4+5+5+6+6+7+7+8+8 = 60 questions if every round is
// cleared) rather than plateauing early.
export const STAGE_COUNT = 10;
