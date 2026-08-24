/**
 * ============================================================
 * Reward Service
 * ------------------------------------------------------------
 * Calculates all player rewards.
 *
 * This service NEVER updates state.
 * It only calculates rewards.
 *
 * The Game Engine will use these values later.
 * ============================================================
 */

import { getGame } from "./gameRegistry";

/**
 * -----------------------------
 * Base Reward Values
 * -----------------------------
 */

const BASE = {
  xpPerCorrect: 10,
  pointsPerCorrect: 5,

  completionXP: 25,
  completionPoints: 15,

  perfectBonusXP: 50,
  perfectBonusPoints: 25,

  streakBonusXP: 5,
};

/**
 * Calculate rewards after a game.
 */
export function calculateRewards({
  gameId,
  correct = 0,
  attempted = 0,
  streak = 0,
}) {

  const game = getGame(gameId);

  if (!game) {
    throw new Error(`Unknown game: ${gameId}`);
  }

  const accuracy =
    attempted === 0 ? 0 : correct / attempted;

  // -----------------------------
  // Base Rewards
  // -----------------------------

  let xp =
    correct * BASE.xpPerCorrect;

  let points =
    correct * BASE.pointsPerCorrect;

  // -----------------------------
  // Finish Bonus
  // -----------------------------

  xp += BASE.completionXP;
  points += BASE.completionPoints;

  // -----------------------------
  // Accuracy Bonus
  // -----------------------------

  if (accuracy >= 0.90) {

    xp += 25;
    points += 10;

  } else if (accuracy >= 0.75) {

    xp += 10;
    points += 5;

  }

  // -----------------------------
  // Perfect Game Bonus
  // -----------------------------

  if (
    attempted > 0 &&
    correct === attempted
  ) {

    xp += BASE.perfectBonusXP;
    points += BASE.perfectBonusPoints;

  }

  // -----------------------------
  // Streak Bonus
  // -----------------------------

  xp += streak * BASE.streakBonusXP;

  // -----------------------------
  // Game Multipliers
  // -----------------------------

  xp = Math.round(
    xp * game.xpMultiplier
  );

  points = Math.round(
    points * game.pointMultiplier
  );

  return {

    xp,

    points,

    accuracy: Math.round(accuracy * 100),

    bonuses: {

      perfect:
        correct === attempted &&
        attempted > 0,

      highAccuracy:
        accuracy >= 0.90,

      streak,

      multiplier: game.xpMultiplier,
    },
  };
}

/**
 * Small reward for answering one question.
 */
export function calculateQuestionReward(
  correct
) {

  return {

    xp: correct ? 10 : 2,

    points: correct ? 5 : 1,
  };
}