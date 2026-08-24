/**
 * ============================================================
 * Game Registry
 * ------------------------------------------------------------
 * This file is the master list of every game in the app.
 *
 * Every game should be registered here ONE time.
 *
 * Other services (Rewards, Missions, Stats, Game Engine)
 * will use this file instead of hardcoding values.
 *
 * Example:
 * const game = GAME_REGISTRY.factorcraft;
 *
 * console.log(game.subject);
 * -> "math"
 *
 * ============================================================
 */

export const GAME_REGISTRY = {
  factorcraft: {
    id: "factorcraft",
    name: "Factor Craft",

    subject: "math",
    category: "number-sense",

    difficulty: "medium",

    xpMultiplier: 1.2,
    pointMultiplier: 1.1,

    icon: "🔢",

    enabled: true,
  },

  coin: {
    id: "coin",
    name: "Coin Game",

    subject: "math",
    category: "money",

    difficulty: "easy",

    xpMultiplier: 1.0,
    pointMultiplier: 1.0,

    icon: "🪙",

    enabled: true,
  },

  classify: {
    id: "classify",
    name: "Science Sort",

    subject: "science",
    category: "classification",

    difficulty: "medium",

    xpMultiplier: 1.15,
    pointMultiplier: 1.1,

    icon: "🧪",

    enabled: true,
  },

  recipe: {
    id: "recipe",
    name: "Recipe Builder",

    subject: "health",
    category: "nutrition",

    difficulty: "easy",

    xpMultiplier: 1.0,
    pointMultiplier: 1.0,

    icon: "🥗",

    enabled: true,
  },

  junk: {
    id: "junk",
    name: "Food Sort",

    subject: "health",
    category: "nutrition",

    difficulty: "easy",

    xpMultiplier: 1.0,
    pointMultiplier: 1.0,

    icon: "🍎",

    enabled: true,
  },

  exercise: {
    id: "exercise",
    name: "Exercise Match",

    subject: "health",
    category: "fitness",

    difficulty: "easy",

    xpMultiplier: 1.0,
    pointMultiplier: 1.0,

    icon: "🏃",

    enabled: true,
  },

  budget: {
    id: "budget",
    name: "Budget Balance",

    subject: "finance",
    category: "budgeting",

    difficulty: "medium",

    xpMultiplier: 1.25,
    pointMultiplier: 1.2,

    icon: "💰",

    enabled: true,
  },

  tools: {
    id: "tools",
    name: "Tool Match",

    subject: "engineering",
    category: "tools",

    difficulty: "medium",

    xpMultiplier: 1.15,
    pointMultiplier: 1.1,

    icon: "🛠️",

    enabled: true,
  },

  word: {
    id: "word",
    name: "Word Detective",

    subject: "language",
    category: "grammar",

    difficulty: "easy",

    xpMultiplier: 1.0,
    pointMultiplier: 1.0,

    icon: "📚",

    enabled: true,
  },
};

/**
 * Return one game.
 */
export function getGame(gameId) {
  return GAME_REGISTRY[gameId] || null;
}

/**
 * Return all games.
 */
export function getAllGames() {
  return Object.values(GAME_REGISTRY);
}

/**
 * Return games by subject.
 */
export function getGamesBySubject(subject) {
  return Object.values(GAME_REGISTRY).filter(
    game => game.subject === subject
  );
}

/**
 * Return enabled games only.
 */
export function getEnabledGames() {
  return Object.values(GAME_REGISTRY).filter(
    game => game.enabled
  );
}

export default GAME_REGISTRY;