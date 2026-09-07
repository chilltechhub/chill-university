// src/data/skillLinks.js
// The bridge between the two halves of the app: Training Center games
// (src/services/gameRegistry.js) and Academy Classes topics
// (src/screens/classes/**, catalogued in src/data/classCatalog.js).
//
// Before this file the two were islands with different vocabularies — a
// game knows it is `subject: 'finance'`, a class page knows it has a topic
// keyed `'needsWants'`, and nothing connected them. Every cross-link in
// the app now reads from the single LINKS table below, so:
//
//   game  -> lessons   "You struggled with Budget Balance — here's the
//                       Needs vs. Wants lesson"   (GameOver.js)
//   lesson -> games    "Practice this topic: Budget Balance"
//                      (ClassTopicScreen.js)
//
// `screen` is the navigation screen name registered in ClassesStack.js,
// `topicKey` is that topic's own `key` inside its class file, and
// `topicTitle` is a DISPLAY COPY of that topic's title. The title is
// duplicated here on purpose: class topics are local `const topics = [...]`
// arrays inside each screen file, not exported, so there is nothing to
// import. Every title below was read from the real class file rather than
// invented — if a topic is ever renamed, this label goes stale (harmless:
// it only affects the link's caption, the navigation still resolves by
// screen + key).
//
// A game with no honest lesson to point at (pure reflex arcade — Reflex
// Rush, Speed Racer) simply has no rows here, and the UI renders nothing
// rather than a forced connection.

import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from './classCatalog';
import { getGame, getEnabledGames } from '../services/gameRegistry';

export const LINKS = [
  // ── Math ────────────────────────────────────────────────────────────
  { game: 'coin',   screen: 'NumbersAndOperations', topicKey: 'counting',    topicTitle: 'Counting & Cardinality' },
  { game: 'coin',   screen: 'BusinessAndFinance',   topicKey: 'earnSaveSpendGive', topicTitle: 'Earn, Save, Spend & Give' },
  { game: 'factor', screen: 'NumbersAndOperations', topicKey: 'whole',       topicTitle: 'Whole Number Operations' },
  { game: 'factor', screen: 'AlgebraAndFunctions',  topicKey: 'expressions', topicTitle: 'Expressions & Equations' },
  { game: 'codebreaker', screen: 'AdvancedMath',    topicKey: 'discrete',    topicTitle: 'Discrete Mathematics' },
  { game: 'codebreaker', screen: 'DataStatisticsProbability', topicKey: 'probability', topicTitle: 'Probability' },

  // ── Language Arts ───────────────────────────────────────────────────
  { game: 'word',     screen: 'Language', topicKey: 'grammarSyntax',     topicTitle: 'Grammar & Syntax' },
  { game: 'word',     screen: 'Language', topicKey: 'wordRelationships', topicTitle: 'Word Relationships (Synonyms & Antonyms)' },
  { game: 'scramble', screen: 'Language', topicKey: 'spelling',          topicTitle: 'Spelling' },
  { game: 'scramble', screen: 'Reading',  topicKey: 'phonicsWordRecognition', topicTitle: 'Phonics & Word Recognition' },
  { game: 'memory',   screen: 'Language', topicKey: 'wordRelationships', topicTitle: 'Word Relationships (Synonyms & Antonyms)' },

  // ── Science ─────────────────────────────────────────────────────────
  { game: 'classify',   screen: 'Biology',   topicKey: 'livingThings',     topicTitle: 'Living Things & Classification' },
  { game: 'classify',   screen: 'Biology',   topicKey: 'cellsBodySystems', topicTitle: 'Cells & Body Systems' },
  { game: 'classify',   screen: 'Chemistry', topicKey: 'statesOfMatter',   topicTitle: 'Matter & States of Matter' },
  { game: 'factbattle', screen: 'Biology',   topicKey: 'livingThings',     topicTitle: 'Living Things & Classification' },
  { game: 'bugsquash',  screen: 'Biology',   topicKey: 'livingThings',     topicTitle: 'Living Things & Classification' },
  { game: 'survival',   screen: 'EarthAndEnvironmental', topicKey: 'weatherClimate', topicTitle: 'Weather & Climate' },
  { game: 'survival',   screen: 'HealthAndWellness',     topicKey: 'firstAid',       topicTitle: 'First Aid & Safety Basics' },

  // ── Social Studies ──────────────────────────────────────────────────
  { game: 'world',       screen: 'Geography',           topicKey: 'mapsContinentsOceans',    topicTitle: 'Maps, Continents & Oceans' },
  { game: 'world',       screen: 'CivicsAndGovernment', topicKey: 'rulesRightsConstitution', topicTitle: 'Rules, Rights & the Constitution' },
  { game: 'world',       screen: 'History',             topicKey: 'earlyCivilizations',      topicTitle: 'Early Civilizations' },
  { game: 'triviacatch', screen: 'Geography',           topicKey: 'mapsContinentsOceans',    topicTitle: 'Maps, Continents & Oceans' },
  { game: 'triviacatch', screen: 'CivicsAndGovernment', topicKey: 'rulesRightsConstitution', topicTitle: 'Rules, Rights & the Constitution' },

  // ── Finance ─────────────────────────────────────────────────────────
  { game: 'budget',       screen: 'BusinessAndFinance', topicKey: 'needsWants',            topicTitle: 'Needs vs. Wants' },
  { game: 'budget',       screen: 'BusinessAndFinance', topicKey: 'budgetingFixedVariable', topicTitle: 'Budgeting & Fixed vs. Variable Costs' },
  { game: 'trail',        screen: 'BusinessAndFinance', topicKey: 'budgetingFixedVariable', topicTitle: 'Budgeting & Fixed vs. Variable Costs' },
  { game: 'trail',        screen: 'BusinessAndFinance', topicKey: 'needsWants',            topicTitle: 'Needs vs. Wants' },
  { game: 'survivemonth', screen: 'BusinessAndFinance', topicKey: 'budgetingFixedVariable', topicTitle: 'Budgeting & Fixed vs. Variable Costs' },
  { game: 'survivemonth', screen: 'BusinessAndFinance', topicKey: 'compoundInterest',      topicTitle: 'The Power of Compound Interest' },

  // ── Health & Nutrition ──────────────────────────────────────────────
  { game: 'junk',       screen: 'HealthAndFitness',  topicKey: 'myPlateFoodGroups', topicTitle: 'MyPlate Food Groups & Balanced Meals' },
  { game: 'junk',       screen: 'NutritionAndFood',  topicKey: 'macroMicro',        topicTitle: 'Macronutrients & Micronutrients' },
  { game: 'snackcatch', screen: 'HealthAndFitness',  topicKey: 'myPlateFoodGroups', topicTitle: 'MyPlate Food Groups & Balanced Meals' },
  { game: 'exercise',   screen: 'HealthAndFitness',  topicKey: 'cardiovascularHeartRate',    topicTitle: 'Cardiovascular Health & Target Heart Rate' },
  { game: 'exercise',   screen: 'HealthAndFitness',  topicKey: 'macronutrientEnergyBalance', topicTitle: 'Energy Balance & Macronutrient Calculations' },
  { game: 'freethrow',  screen: 'HealthAndFitness',  topicKey: 'cardiovascularHeartRate',    topicTitle: 'Cardiovascular Health & Target Heart Rate' },

  // ── Home Ec & Workshop ──────────────────────────────────────────────
  { game: 'recipe', screen: 'NutritionAndFood',           topicKey: 'culinaryTechniques', topicTitle: 'Culinary Techniques' },
  { game: 'recipe', screen: 'NutritionAndFood',           topicKey: 'foodSafety',         topicTitle: 'Food Safety & Sanitation' },
  { game: 'tools',  screen: 'ToolSafetyAndShopPractices', topicKey: 'ppe',                topicTitle: 'Personal Protective Equipment (PPE)' },
  { game: 'tools',  screen: 'ToolSafetyAndShopPractices', topicKey: 'maintenanceOrganization', topicTitle: 'Tool Maintenance & Organization' },
  { game: 'tools',  screen: 'MaterialWorking',            topicKey: 'woodworking',        topicTitle: 'Woodworking' },

  // ── Technology & Engineering ────────────────────────────────────────
  { game: 'tech',   screen: 'TechnologyAndEngineering', topicKey: 'algorithmsSequencing', topicTitle: 'Algorithms & Sequencing' },
  { game: 'tech',   screen: 'TechnologyAndEngineering', topicKey: 'blockCodingLoops',     topicTitle: 'Block-Based Coding & Loops' },
  { game: 'tech',   screen: 'MediaDigitalLiteracy',     topicKey: 'evaluatingSources',    topicTitle: 'Evaluating Sources' },
  { game: 'build',  screen: 'TechnologyAndEngineering', topicKey: 'cadModeling',          topicTitle: '3D Modeling & CAD Fundamentals' },
  { game: 'build',  screen: 'Physics',                  topicKey: 'energyWorkMachines',   topicTitle: 'Energy, Work & Simple Machines' },
  { game: 'build',  screen: 'Construction',             topicKey: 'framingStructural',    topicTitle: 'Framing & Structural Concepts' },

  // ── Arts ────────────────────────────────────────────────────────────
  { game: 'art', screen: 'VisualArt', topicKey: 'elementsPrinciples',  topicTitle: 'Elements & Principles of Art' },
  { game: 'art', screen: 'VisualArt', topicKey: 'artHistoryCriticism', topicTitle: 'Art History & Criticism' },
  { game: 'art', screen: 'Music',     topicKey: 'rhythmMeter',         topicTitle: 'Rhythm & Meter' },

  // ── Foreign Language ────────────────────────────────────────────────
  { game: 'lingo', screen: 'ForeignLanguage', topicKey: 'colorsNumbersFamily', topicTitle: 'Colors, Numbers & Family Words' },
  { game: 'lingo', screen: 'ForeignLanguage', topicKey: 'greetingsManners',    topicTitle: 'Greetings, Feelings & Manners' },
  { game: 'lingo', screen: 'ForeignLanguage', topicKey: 'dailyRoutinesVerbs',  topicTitle: 'Descriptive Sentences & Daily Routines' },

  // ── Wellbeing & People ──────────────────────────────────────────────
  { game: 'mindgym', screen: 'HealthAndWellness',          topicKey: 'stressManagement',      topicTitle: 'Stress Management & Mental Health' },
  { game: 'mindgym', screen: 'PsychologicalAndSociology',  topicKey: 'understandingEmotions', topicTitle: 'Understanding Emotions' },
  { game: 'people',  screen: 'SpeakingAndListening',       topicKey: 'activeListening',       topicTitle: 'Active Listening' },
  { game: 'people',  screen: 'SpeakingAndListening',       topicKey: 'participatingDiscussions', topicTitle: 'Participating in Discussions' },
  { game: 'people',  screen: 'PsychologicalAndSociology',  topicKey: 'socialThinking',        topicTitle: 'How We Think & Relate to Others' },
  { game: 'career',  screen: 'BusinessAndFinance',         topicKey: 'earnSaveSpendGive',     topicTitle: 'Earn, Save, Spend & Give' },
  { game: 'career',  screen: 'SpeakingAndListening',       topicKey: 'oralPresentations',     topicTitle: 'Oral Presentations' },
];

// screen name -> the Academy subject that owns it ('BusinessAndFinance' ->
// 'Business & Finance'), derived from classCatalog rather than duplicated,
// so a subject rename only has to happen in one place.
const SUBJECT_BY_SCREEN = (() => {
  const map = {};
  CLASS_SUBJECTS.forEach((subject) => {
    const children = subject.children || [];
    if (!children.length) {
      const own = CLASS_SCREEN_MAP[subject.title];
      if (own) map[own] = subject;
      return;
    }
    children.forEach((child) => {
      const screen = CLASS_SCREEN_MAP[child.label];
      if (screen) map[screen] = subject;
    });
  });
  return map;
})();

function decorate(link) {
  const subject = SUBJECT_BY_SCREEN[link.screen];
  return {
    ...link,
    subjectTitle: subject?.title || null,
    subjectColor: subject?.color || null,
    subjectIcon: subject?.icon || null,
  };
}

/** Lessons that teach what a given game tests. Empty for pure-arcade games. */
export function lessonsForGame(gameId) {
  return LINKS.filter(l => l.game === gameId).map(decorate);
}

/** Games that practise one specific class topic (screen + that topic's own key). */
export function gamesForTopic(screen, topicKey) {
  const ids = LINKS.filter(l => l.screen === screen && l.topicKey === topicKey).map(l => l.game);
  return [...new Set(ids)].map(getGame).filter(Boolean).filter(g => g.enabled);
}

/** Every game linked anywhere on one class screen — for a page-level header row. */
export function gamesForScreen(screen) {
  const ids = LINKS.filter(l => l.screen === screen).map(l => l.game);
  return [...new Set(ids)].map(getGame).filter(Boolean).filter(g => g.enabled);
}

/** Games linked to any topic under an Academy subject title ('Math'). */
export function gamesForSubjectTitle(subjectTitle) {
  const screens = Object.keys(SUBJECT_BY_SCREEN)
    .filter(screen => SUBJECT_BY_SCREEN[screen]?.title === subjectTitle);
  const ids = LINKS.filter(l => screens.includes(l.screen)).map(l => l.game);
  return [...new Set(ids)].map(getGame).filter(Boolean).filter(g => g.enabled);
}

/** True when a game has at least one lesson to point at. */
export function hasLessons(gameId) {
  return LINKS.some(l => l.game === gameId);
}

// Opening an Academy class screen from ANYWHERE in the app. The Classes
// screens live three navigators deep (root stack -> MainTabs -> Library
// tab -> ClassesStack), and which of those is already mounted depends on
// where the call comes from — so this primes the tab first and pushes the
// destination a tick later, the same two-step HomeScreen's
// goToLibraryScreen already uses for Library destinations (see the comment
// there for why one synchronous pair of navigate() calls isn't enough).
export function openLessonScreen(navigation, screen) {
  if (!screen) return;
  const target = { screen: 'ClassesStack', params: { screen } };
  navigation.navigate('MainTabs', { screen: 'Library' });
  setTimeout(() => {
    navigation.navigate('MainTabs', { screen: 'Library', params: target });
  }, 0);
}

/** Opening a game from anywhere — the Play route lives on the root stack. */
export function openGame(navigation, gameId) {
  navigation.navigate('Play', { gameId });
}

/** Sanity helper for tests/dev: link rows pointing at a game that no longer exists. */
export function findBrokenLinks() {
  const valid = new Set(getEnabledGames().map(g => g.id));
  return LINKS.filter(l => !valid.has(l.game));
}
