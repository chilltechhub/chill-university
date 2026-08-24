/**
 * ============================================================
 * Game Engine V2
 * ------------------------------------------------------------
 * Every game should ONLY call this file.
 *
 * Responsibilities:
 *  - Calculate rewards
 *  - Update stats
 *  - Update missions
 *  - Calculate new level
 *
 * It DOES NOT:
 *  - Save to Supabase
 *  - Update React Context
 * ============================================================
 */

import { getGame } from "./gameRegistry";
import { calculateRewards } from "./rewardService";
import { recordGame } from "./statsService";
import { updateMissionProgress } from "./missionService";
import { getPlayerLevelData } from "./levelService";

/**
 * Processes the end of a game.
 *
 * @param {Object} data
 */
export function finishGame(data) {

  const {
    playerProgress,
    gameplayStats,
    missions,
    gameResult,
  } = data;

  // -----------------------------
  // Validate Game
  // -----------------------------

  const game = getGame(gameResult.gameId);

  if (!game) {
    throw new Error(`Unknown game: ${gameResult.gameId}`);
  }

  // Automatically attach subject
  const result = {
    ...gameResult,
    subject: game.subject,
  };

  // -----------------------------
  // Calculate Rewards
  // -----------------------------

  const rewards = calculateRewards({
    gameId: result.gameId,
    correct: result.correct,
    attempted: result.attempted,
    streak: playerProgress.streakDays || 0,
  });

  // -----------------------------
  // Update Statistics
  // -----------------------------

  const updatedStats = recordGame(gameplayStats, {
    ...result,
    xp: rewards.xp,
    points: rewards.points,
  });

  // -----------------------------
  // Update Missions
  // -----------------------------

  const missionUpdate = updateMissionProgress(
    missions,
    {
      ...result,
      xp: rewards.xp,
      points: rewards.points,
    }
  );

  // -----------------------------
  // Calculate New Level
  // -----------------------------

  const totalXP =
    playerProgress.xp + rewards.xp;

  const levelData =
    getPlayerLevelData(totalXP);

  // -----------------------------
  // Return Updated Data
  // -----------------------------

  return {

    profile: {
      ...playerProgress,
      xp: totalXP,
      points:
        playerProgress.points +
        rewards.points,
      level: levelData.level,
      rank: levelData.rank,
    },

    stats: updatedStats,

    missions: missionUpdate.missions,

    completedMissions:
      missionUpdate.completed,

    rewards,

    levelData,

    game,
  };
}

/**
 * Helper to create a standard game result.
 */
export function createGameResult({
  gameId,
  score = 0,
  attempted = 0,
  correct = 0,
  duration = 0,
  streak = 0,
}) {
  return {
    gameId,
    score,
    attempted,
    correct,
    duration,
    streak,
  };
}

export default {
  finishGame,
  createGameResult,
};