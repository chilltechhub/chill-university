/**
 * ============================================================
 * Game Registry — the ONE list of every game in the app.
 * ------------------------------------------------------------
 * GamesScreen, GameFeed, and the Academy "recommended games"
 * feature (classRecommendations.js) all import from here instead
 * of keeping their own copies. That drift — three separate lists
 * with mismatched ids — was the root cause of several bugs
 * (recommended-game taps that silently went nowhere, filter chips
 * that didn't match any game, etc).
 *
 * `id` matches the game's key everywhere: GameFeed's targetGameKey,
 * PlayScreen's `gameId` route param, and the `component` file.
 *
 * `subject` is the internal key written to Supabase (activity_log,
 * subject_progress) — keep it one of SUBJECT_CONFIG's keys in
 * context/UserProgressContext.js. `subjectLabel` is what's shown
 * on screen and in the Games-tab filter chips.
 * ============================================================
 */

export const GAME_REGISTRY = {
  factor: {
    id: 'factor',
    name: 'Factor Craft',
    component: 'FactorCraftGame',

    subject: 'math',
    subjectLabel: 'Math',
    category: 'number-sense',
    grade: '6-8',
    mechanic: 'puzzle',

    icon: '🔢',
    color: '#3B82F6',
    desc: 'Combine tiles to hit a target number',

    enabled: true,
  },

  coin: {
    id: 'coin',
    name: 'Coin Game',
    component: 'CoinGame',

    subject: 'math',
    subjectLabel: 'Math',
    category: 'money',
    grade: '3-5',
    mechanic: 'puzzle',

    icon: '🪙',
    color: '#3B82F6',
    desc: 'Count coins and make change',

    enabled: true,
  },

  word: {
    id: 'word',
    name: 'Word Detective',
    component: 'WordTypeGame',

    subject: 'language_arts',
    subjectLabel: 'Language Arts',
    category: 'grammar',
    grade: '3-5',
    mechanic: 'quiz',

    icon: '📖',
    color: '#8B5CF6',
    desc: 'Identify parts of speech in context',

    enabled: true,
  },

  classify: {
    id: 'classify',
    name: 'Science Sort',
    component: 'ScienceSortGame',

    subject: 'science',
    subjectLabel: 'Science',
    category: 'classification',
    grade: 'K-2',
    mechanic: 'quiz',

    icon: '🔬',
    color: '#10B981',
    desc: 'Classify animals, matter, cells and more',

    enabled: true,
  },

  recipe: {
    id: 'recipe',
    name: 'Recipe Builder',
    component: 'RecipeBuilderGame',

    subject: 'home_ec',
    subjectLabel: 'Home Ec',
    category: 'sequencing',
    grade: '3-5',
    mechanic: 'building',

    icon: '🍳',
    color: '#e0a830',
    desc: 'Put cooking and safety steps in order',

    enabled: true,
  },

  junk: {
    id: 'junk',
    name: 'Food Sort',
    component: 'FoodSortGame',

    subject: 'health',
    subjectLabel: 'Health',
    category: 'nutrition',
    grade: 'K-2',
    mechanic: 'quiz',

    icon: '🍎',
    color: '#e05858',
    desc: 'Sort foods by how healthy they are',

    enabled: true,
  },

  exercise: {
    id: 'exercise',
    name: 'Exercise Match',
    component: 'ExerciseMatchGame',

    subject: 'health',
    subjectLabel: 'Health',
    category: 'fitness',
    grade: '3-5',
    mechanic: 'quiz',

    icon: '💪',
    color: '#e05858',
    desc: 'Match exercises to what they train',

    enabled: true,
  },

  budget: {
    id: 'budget',
    name: 'Budget Balance',
    component: 'BudgetBalanceGame',

    subject: 'finance',
    subjectLabel: 'Finance',
    category: 'budgeting',
    grade: '6-8',
    mechanic: 'strategy',

    icon: '💰',
    color: '#c9a84c',
    desc: 'Cut wants, keep needs, stay in budget',

    enabled: true,
  },

  tools: {
    id: 'tools',
    name: 'Tool Match',
    component: 'ToolMatchGame',

    subject: 'home_ec',
    subjectLabel: 'Home Ec',
    category: 'tools',
    grade: '6-8',
    mechanic: 'quiz',

    icon: '🔧',
    color: '#e0a830',
    desc: 'Match tools and safety gear to their job',

    enabled: true,
  },

  world: {
    id: 'world',
    name: 'World Explorer',
    component: 'WorldExplorerGame',

    subject: 'social_studies',
    subjectLabel: 'Social Studies',
    category: 'history-geography-civics',
    grade: '3-5',
    mechanic: 'quiz',

    icon: '🌍',
    color: '#F59E0B',
    desc: 'History, geography, and government trivia',

    enabled: true,
  },

  art: {
    id: 'art',
    name: 'Art & Music',
    component: 'ArtMusicGame',

    subject: 'arts',
    subjectLabel: 'Art & Music',
    category: 'creative',
    grade: '3-5',
    mechanic: 'quiz',

    icon: '🎨',
    color: '#EC4899',
    desc: 'Color theory, instruments, and art movements',

    enabled: true,
  },

  tech: {
    id: 'tech',
    name: 'Tech Lab',
    component: 'TechLabGame',

    subject: 'technology',
    subjectLabel: 'Technology',
    category: 'digital-engineering',
    grade: '6-8',
    mechanic: 'quiz',

    icon: '💻',
    color: '#5A80E8',
    desc: 'Computers, coding logic, and online safety',

    enabled: true,
  },

  lingo: {
    id: 'lingo',
    name: 'Lingo Match',
    component: 'LingoMatchGame',

    subject: 'foreign_language',
    subjectLabel: 'Foreign Language',
    category: 'spanish',
    grade: '3-5',
    mechanic: 'quiz',

    icon: '🗣️',
    color: '#14B8A6',
    desc: 'Spanish vocabulary, verbs, and phrases',

    enabled: true,
  },

  mindgym: {
    id: 'mindgym',
    name: 'Mind Gym',
    component: 'MindGymGame',

    subject: 'mental',
    subjectLabel: 'Mental Wellness',
    category: 'emotional-wellness',
    grade: '6-8',
    mechanic: 'quiz',

    icon: '🧠',
    color: '#8B5CF6',
    desc: 'Mindfulness, coping skills, and resilience',

    enabled: true,
  },

  people: {
    id: 'people',
    name: 'People Skills',
    component: 'PeopleSkillsGame',

    subject: 'social_skills',
    subjectLabel: 'Social & Relationships',
    category: 'communication',
    grade: '3-5',
    mechanic: 'quiz',

    icon: '🤝',
    color: '#22C55E',
    desc: 'Communication, empathy, and teamwork',

    enabled: true,
  },

  career: {
    id: 'career',
    name: 'Career Compass',
    component: 'CareerCompassGame',

    subject: 'career',
    subjectLabel: 'Career & Life Skills',
    category: 'career-readiness',
    grade: '6-8',
    mechanic: 'quiz',

    icon: '🧭',
    color: '#84CC16',
    desc: 'Career awareness and workplace skills',

    enabled: true,
  },

  // ── Non-quiz mechanics ─────────────────────────────────────────────────
  memory: {
    id: 'memory',
    name: 'Memory Match',
    component: 'MemoryMatchGame',

    subject: 'general',
    subjectLabel: 'General',
    category: 'matching',
    grade: '3-5',
    mechanic: 'matching',

    icon: '🧩',
    color: '#6366F1',
    desc: 'Flip cards to match terms with their meanings',

    enabled: true,
  },

  build: {
    id: 'build',
    name: 'Build It!',
    component: 'BuildItGame',

    subject: 'technology',
    subjectLabel: 'Technology',
    category: 'building',
    grade: '6-8',
    mechanic: 'building',

    icon: '🏗️',
    color: '#5A80E8',
    desc: 'Place the right piece in the right slot',

    enabled: true,
  },

  trail: {
    id: 'trail',
    name: 'Budget Trail',
    component: 'BudgetTrailGame',

    subject: 'finance',
    subjectLabel: 'Finance',
    category: 'strategy',
    grade: '6-8',
    mechanic: 'strategy',

    icon: '🧳',
    color: '#c9a84c',
    desc: 'Manage a running balance across several rounds',

    enabled: true,
  },

  survivemonth: {
    id: 'survivemonth',
    name: 'Survive the Month',
    component: 'SurviveMonthGame',

    subject: 'finance',
    subjectLabel: 'Finance',
    category: 'strategy',
    grade: '6-8',
    mechanic: 'strategy',

    icon: '📅',
    color: '#e0a830',
    desc: 'One card a day — cash, stress, and smart choices',

    enabled: true,
  },

  codebreaker: {
    id: 'codebreaker',
    name: 'Code Breaker',
    component: 'CodeBreakerGame',

    subject: 'math',
    subjectLabel: 'Math',
    category: 'logic',
    grade: '6-8',
    mechanic: 'thinking',

    icon: '🕵️',
    color: '#3B82F6',
    desc: 'Crack the secret code using logical deduction',

    enabled: true,
  },

  // ── Just for fun — arcade reflexes, lightly themed ─────────────────────
  bugsquash: {
    id: 'bugsquash',
    name: 'Bug Squash',
    component: 'BugSquashGame',

    subject: 'science',
    subjectLabel: 'Science',
    category: 'arcade',
    grade: '3-5',
    mechanic: 'fun',

    icon: '🐛',
    color: '#10B981',
    desc: 'Whack-a-mole with garden bugs — just for fun',

    enabled: true,
  },

  snackcatch: {
    id: 'snackcatch',
    name: 'Snack Catch',
    component: 'SnackCatchGame',

    subject: 'health',
    subjectLabel: 'Health',
    category: 'arcade',
    grade: '3-5',
    mechanic: 'fun',

    icon: '🧺',
    color: '#e05858',
    desc: 'Catch healthy snacks, dodge the junk — just for fun',

    enabled: true,
  },

  reflexrush: {
    id: 'reflexrush',
    name: 'Reflex Rush',
    component: 'ReflexRushGame',

    subject: 'technology',
    subjectLabel: 'Technology',
    category: 'arcade',
    grade: '3-5',
    mechanic: 'fun',

    icon: '⚡',
    color: '#5A80E8',
    desc: 'Test your reaction time — just for fun',

    enabled: true,
  },

  // ── Racing, puzzle, survival, cards, sports ─────────────────────────────
  speedracer: {
    id: 'speedracer',
    name: 'Speed Racer',
    component: 'SpeedRacerGame',

    subject: 'general',
    subjectLabel: 'General',
    category: 'arcade',
    grade: '3-5',
    mechanic: 'racing',

    icon: '🏎️',
    color: '#F59E0B',
    desc: 'Dodge traffic as the road speeds up',

    enabled: true,
  },

  scramble: {
    id: 'scramble',
    name: 'Word Scramble',
    component: 'WordScrambleGame',

    subject: 'language_arts',
    subjectLabel: 'Language Arts',
    category: 'vocabulary',
    grade: '3-5',
    mechanic: 'puzzle',

    icon: '🔤',
    color: '#8B5CF6',
    desc: 'Unscramble letters to spell the word',

    enabled: true,
  },

  survival: {
    id: 'survival',
    name: 'Wild Survival',
    component: 'WildSurvivalGame',

    subject: 'science',
    subjectLabel: 'Science',
    category: 'survival',
    grade: '6-8',
    mechanic: 'survival',

    icon: '🏕️',
    color: '#10B981',
    desc: 'Make it through a multi-round survival scenario',

    enabled: true,
  },

  factbattle: {
    id: 'factbattle',
    name: 'Fact Battle',
    component: 'FactBattleGame',

    subject: 'science',
    subjectLabel: 'Science',
    category: 'card-battle',
    grade: '3-5',
    mechanic: 'cards',

    icon: '🃏',
    color: '#10B981',
    desc: 'Top-Trumps-style animal stat showdowns',

    enabled: true,
  },

  triviacatch: {
    id: 'triviacatch',
    name: 'Trivia Catch',
    component: 'TriviaCatchGame',

    subject: 'social_studies',
    subjectLabel: 'Social Studies',
    category: 'arcade-trivia',
    grade: '3-5',
    mechanic: 'fun',

    icon: '🎯',
    color: '#F59E0B',
    desc: 'Catch the right answer before it lands — a fast-paced World Explorer pilot',

    enabled: true,
  },

  freethrow: {
    id: 'freethrow',
    name: 'Free Throw Frenzy',
    component: 'FreeThrowFrenzyGame',

    subject: 'health',
    subjectLabel: 'Health',
    category: 'sports',
    grade: '3-5',
    mechanic: 'sports',

    icon: '🏀',
    color: '#e05858',
    desc: 'Time your shot for nothing but net',

    enabled: true,
  },
};

/**
 * What kind of gameplay each `mechanic` value means — shared by GamesScreen
 * (badges + filter chips) so a mixed roster of quizzes, matching games,
 * builders, strategy games, logic puzzles, and pure-fun arcade games all
 * read clearly instead of looking like 23 identical cards.
 */
export const MECHANIC_META = {
  quiz:     { emoji: '🧠', icon: 'help-circle-outline',  label: 'Quiz' },
  matching: { emoji: '🧩', icon: 'grid-outline',         label: 'Match' },
  building: { emoji: '🏗️', icon: 'construct-outline',    label: 'Build' },
  strategy: { emoji: '🧳', icon: 'briefcase-outline',    label: 'Strategy' },
  thinking: { emoji: '🕵️', icon: 'bulb-outline',         label: 'Logic' },
  fun:      { emoji: '🎮', icon: 'game-controller-outline', label: 'Just for Fun' },
  racing:   { emoji: '🏎️', icon: 'speedometer-outline',  label: 'Racing' },
  puzzle:   { emoji: '🌀', icon: 'shapes-outline',       label: 'Puzzle' },
  survival: { emoji: '🏕️', icon: 'leaf-outline',         label: 'Survival' },
  cards:    { emoji: '🃏', icon: 'albums-outline',       label: 'Card Game' },
  sports:   { emoji: '🏀', icon: 'basketball-outline',   label: 'Sports' },
};

/** Return one game by id. */
export function getGame(gameId) {
  return GAME_REGISTRY[gameId] || null;
}

/** Return all games, in a stable order. */
export function getAllGames() {
  return Object.values(GAME_REGISTRY);
}

/** Return games matching an internal subject key. */
export function getGamesBySubject(subject) {
  return Object.values(GAME_REGISTRY).filter(game => game.subject === subject);
}

/** Return games matching a gameplay mechanic (quiz, matching, building, strategy, thinking, fun). */
export function getGamesByMechanic(mechanic) {
  return Object.values(GAME_REGISTRY).filter(game => game.mechanic === mechanic);
}

/** Return enabled games only. */
export function getEnabledGames() {
  return Object.values(GAME_REGISTRY).filter(game => game.enabled);
}

export default GAME_REGISTRY;
