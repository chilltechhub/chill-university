/**
 * ============================================================
 * Stats Service
 * ------------------------------------------------------------
 * Responsible ONLY for gameplay statistics.
 *
 * This service NEVER:
 * - Gives XP
 * - Gives Points
 * - Updates Missions
 * - Saves to Supabase
 *
 * It only updates and calculates stats.
 * ============================================================
 */

/**
 * Creates a brand new stats object.
 * Useful for new players.
 */
export function createDefaultStats() {
  return {
    gamesPlayed: 0,

    questionsAttempted: 0,
    questionsCorrect: 0,

    totalTimePlayed: 0,

    totalPointsEarned: 0,
    totalXPEarned: 0,

    highestScore: 0,
    longestStreak: 0,

    averageAccuracy: 0,
    averageGameTime: 0,

    favoriteGame: null,

    gameStats: {},
  };
}

/**
 * Updates overall statistics after a game.
 */
export function recordGame(stats, gameResult) {
  const {
    gameId,
    attempted = 0,
    correct = 0,
    duration = 0,
    score = 0,
    streak = 0,
    xp = 0,
    points = 0,
  } = gameResult;

  const updated = {
    ...stats,
  };

  updated.gamesPlayed += 1;

  updated.questionsAttempted += attempted;
  updated.questionsCorrect += correct;

  updated.totalTimePlayed += duration;

  updated.totalPointsEarned += points;
  updated.totalXPEarned += xp;

  updated.highestScore = Math.max(
    updated.highestScore,
    score
  );

  updated.longestStreak = Math.max(
    updated.longestStreak,
    streak
  );

  updated.averageAccuracy =
    updated.questionsAttempted === 0
      ? 0
      : Math.round(
          (updated.questionsCorrect /
            updated.questionsAttempted) *
            100
        );

  updated.averageGameTime =
    updated.gamesPlayed === 0
      ? 0
      : Math.round(
          updated.totalTimePlayed /
            updated.gamesPlayed
        );

  // -------------------------
  // Per Game Stats
  // -------------------------

  if (!updated.gameStats[gameId]) {

    updated.gameStats[gameId] = {

      gamesPlayed: 0,

      attempted: 0,

      correct: 0,

      highestScore: 0,

      totalTime: 0,

      averageAccuracy: 0,
    };
  }

  const game = updated.gameStats[gameId];

  game.gamesPlayed++;

  game.attempted += attempted;
  game.correct += correct;

  game.totalTime += duration;

  game.highestScore = Math.max(
    game.highestScore,
    score
  );

  game.averageAccuracy =
    game.attempted === 0
      ? 0
      : Math.round(
          (game.correct /
            game.attempted) *
            100
        );

  updated.favoriteGame =
    getFavoriteGame(updated.gameStats);

  return updated;
}

/**
 * Determines the player's favorite game.
 */
export function getFavoriteGame(gameStats) {

  let favorite = null;

  let highest = -1;

  Object.entries(gameStats).forEach(([id, game]) => {

    if (game.gamesPlayed > highest) {

      highest = game.gamesPlayed;

      favorite = id;
    }

  });

  return favorite;
}

/**
 * Returns player's lifetime accuracy.
 */
export function getAccuracy(stats) {

  if (stats.questionsAttempted === 0)
    return 0;

  return Math.round(
    (stats.questionsCorrect /
      stats.questionsAttempted) *
      100
  );
}

/**
 * Returns total hours played.
 */
export function getHoursPlayed(stats) {

  return Number(
    (stats.totalTimePlayed / 3600).toFixed(1)
  );
}

/**
 * Returns a quick dashboard summary.
 */
export function getSummary(stats) {

  return {

    gamesPlayed: stats.gamesPlayed,

    accuracy: getAccuracy(stats),

    hoursPlayed: getHoursPlayed(stats),

    highestScore: stats.highestScore,

    favoriteGame: stats.favoriteGame,

    longestStreak: stats.longestStreak,
  };
}