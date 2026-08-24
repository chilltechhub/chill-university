/**
 * ============================================================
 * Level Service
 * ------------------------------------------------------------
 * Handles everything related to:
 *
 * • Player Level
 * • XP Progress
 * • XP Requirements
 * • Rank Titles
 *
 * This file NEVER modifies state.
 * It only performs calculations.
 * ============================================================
 */

const BASE_XP = 100;          // XP required for Level 2
const XP_GROWTH = 1.15;       // Every level needs 15% more XP

/**
 * Returns the total XP required to REACH a level.
 *
 * Example:
 * Level 1 -> 0 XP
 * Level 2 -> 100 XP
 * Level 3 -> 215 XP
 * Level 4 -> 347 XP
 */
export function getXPForLevel(level) {
  if (level <= 1) return 0;

  let total = 0;

  for (let i = 1; i < level; i++) {
    total += Math.floor(BASE_XP * Math.pow(XP_GROWTH, i - 1));
  }

  return total;
}

/**
 * Returns the player's level from total XP.
 */
export function getLevelFromXP(xp) {
  let level = 1;

  while (xp >= getXPForLevel(level + 1)) {
    level++;
  }

  return level;
}

/**
 * Returns XP needed for the NEXT level.
 */
export function getXPToNextLevel(xp) {
  const level = getLevelFromXP(xp);

  return getXPForLevel(level + 1) - xp;
}

/**
 * Returns current level progress.
 */
export function getLevelProgress(xp) {
  const level = getLevelFromXP(xp);

  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);

  return {
    level,

    currentXP: xp,

    currentLevelXP,

    nextLevelXP,

    xpIntoLevel: xp - currentLevelXP,

    xpNeeded: nextLevelXP - currentLevelXP,

    xpRemaining: nextLevelXP - xp,

    progress:
      ((xp - currentLevelXP) /
        (nextLevelXP - currentLevelXP)) * 100,
  };
}

/**
 * Fun rank titles.
 * These can later match your space theme.
 */
export function getRankTitle(level) {

  if (level < 5) return "Cadet";

  if (level < 10) return "Explorer";

  if (level < 20) return "Scientist";

  if (level < 35) return "Commander";

  if (level < 50) return "Captain";

  if (level < 75) return "Admiral";

  if (level < 100) return "Galactic Hero";

  return "Legend";
}

/**
 * Returns everything about the player's level.
 */
export function getPlayerLevelData(xp) {

  const progress = getLevelProgress(xp);

  return {
    ...progress,

    rank: getRankTitle(progress.level),
  };
}