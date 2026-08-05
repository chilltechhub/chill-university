// src/logic/statsUtils.js

/**
 * Updates the user's stats after completing a game session.
 *
 * @param {Object} stats            - Current stats object from context.
 * @param {string} gameId           - Identifier for the game just played.
 * @param {number} timeTaken        - Time spent in seconds on this session.
 * @param {number} correct          - Number of problems solved correctly.
 * @param {number} attempted        - Number of problems attempted.
 * @param {boolean} levelComplete   - Whether the user completed the level/game.
 * @returns {Object}                - New stats object (mutated).
 */
export function updateStats(stats, gameId, timeTaken, correct, attempted, levelComplete) {
  // 1. Track total time per game
  stats.timePerGame[gameId] = (stats.timePerGame[gameId] || 0) + timeTaken;

  // 2. Increment problem counts
  stats.totalProblemsAttempted += attempted;
  stats.totalProblemsCorrect   += correct;

  // 3. Recompute average time per problem
  const totalTime = Object.values(stats.timePerGame).reduce((sum, t) => sum + t, 0);
  stats.avgTime = stats.totalProblemsAttempted > 0
    ? totalTime / stats.totalProblemsAttempted
    : 0;

  // 4. Update fastest game/session time
if (timeTaken < stats.fastestTime || stats.fastestTime == null) {
  stats.fastestTime = timeTaken;
}


  // 5. Increment levels/games completed
  if (levelComplete) {
    stats.levelsCompleted += 1;
  }

  return stats;
}

/**
 * Calculates overall accuracy as a percentage.
 *
 * @param {Object} stats  - Current stats object from context.
 * @returns {string}      - Accuracy formatted as "XX.XX%".
 */
export function getAccuracy(stats) {
  if (stats.totalProblemsAttempted === 0) return '0%';
  const pct = (stats.totalProblemsCorrect / stats.totalProblemsAttempted) * 100;
  return pct.toFixed(2) + '%';
}
