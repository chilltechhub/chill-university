// src/data/games.js
// Maps game keys (used in GameFeed) to display metadata.

const GAMES = [
  { id: 'factor',   title: 'Factor Craft',    emoji: '🔢', subject: 'math',         component: 'FactorCraftGame' },
  { id: 'coin',     title: 'Coin Game',        emoji: '🪙', subject: 'math',         component: 'CoinGame' },
  { id: 'word',     title: 'Word Detective',   emoji: '📖', subject: 'language_arts', component: 'WordTypeGame' },
  { id: 'classify', title: 'Science Sort',     emoji: '🔬', subject: 'science',      component: 'ScienceSortGame' },
  { id: 'recipe',   title: 'Recipe Builder',   emoji: '🍳', subject: 'science',      component: 'RecipeBuilderGame' },
  { id: 'junk',     title: 'Food Sort',        emoji: '🍎', subject: 'science',      component: 'FoodSortGame' },
  { id: 'exercise', title: 'Exercise Match',   emoji: '💪', subject: 'general',      component: 'ExerciseMatchGame' },
  { id: 'budget',   title: 'Budget Balance',   emoji: '💰', subject: 'math',         component: 'BudgetBalanceGame' },
  { id: 'tools',    title: 'Tool Match',       emoji: '🔧', subject: 'general',      component: 'ToolMatchGame' },
];

export default GAMES;
