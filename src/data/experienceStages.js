// src/data/experienceStages.js
// How much of the app someone sees, and what opens next.
//
// This is question 3 of the four in docs/access-system.md, "Shown now?".
// It decides what is on the map, never what can be opened: a hidden tool is
// still reachable from a goal's "Open" button or a link. The doors
// (src/data/featureCatalog.js) and the age rules (src/logic/allowed.js) are
// separate questions, asked before this one, and a stage never overrides
// either.
//
// The app opens a little at a time. Each account type walks its own path of
// ten small stages, and each goal finished or level gained opens the next
// one. A stage adds a tool, a few games or a widget or two, never the whole
// app at once. Account type decides WHICH things come first; progress
// decides HOW MANY are open.
//
// Nothing here is stored. The stage is worked out from progress the app
// already keeps honestly (finished goals and level), so it survives a
// reinstall without a column of its own. "Show everything" is the one
// stored choice (see AccessContext).
//
// No imports on purpose, same as featureCatalog.js and objectives.js: plain
// data a script can load without the React Native graph.

// ─── What a stage can add ───────────────────────────────────────────────────
//
//   features  featureCatalog ids of OPEN tools now on the map
//   screens   routes outside the catalog now on the map (see STAGED_SCREENS)
//   widgets   Home widgets this stage opens, in order. Home takes them on
//             two per stage (homeWidgetsAt in src/logic/experienceStage.js):
//             the FIRST one listed arrives with the stage, the rest queue
//             behind whatever the aim and stage 1 opened. So put the widget
//             the label promises first, and don't promise the others.
//   games     training games now listed, by gameRegistry id
//   fab       quick actions now on the + button
//   caps      the four bigger openings, one per stage at most:
//               'all-games'  every game, plus Training's filters and Progress tab
//               'dashboard'  your type's full dashboard, the widget editor,
//                            every quick action, the Getting Started card
//               'all-tools'  every open tool, other types' classes, extra
//                            profiles, the leaderboard
//               'doors'      locked tools and the keys that open them, Labs,
//                            Plus once it is on sale, every widget
//   reteach   screens that have noticeably more on them now, so their
//             first-visit tutorial runs again
//
// Every step of a type's first goal (objectives.js, `intro: true`) must point
// at something its stage 1 shows. The guide walks people through that goal,
// so a step that leads somewhere hidden would teach them the app hides things.

export const CAPS = ['all-games', 'dashboard', 'all-tools', 'doors'];

// The last five stages are the same shape for everyone except the first of
// them (stage 6), which is whichever core tool that type hasn't met yet. It
// comes before the bigger caps on purpose: somewhere to put projects and
// notes is the "deepen" step, and a rearrangeable dashboard or every game is
// polish on top of it. It used to be stage 8, so a Personal or Student
// account couldn't see the Workshop until seven goals or levels in.
const tail = (sixth) => [
  sixth,
  {
    key: 'all-games',
    label: 'Every training game',
    blurb: 'All the games, with subject and type filters, and your Progress tab.',
    caps: ['all-games'],
  },
  {
    key: 'dashboard',
    label: 'Your dashboard, your way',
    blurb: 'Your full dashboard to arrange, every quick action on the +, and the rest of setup.',
    caps: ['dashboard'],
    reteach: ['Home'],
  },
  {
    key: 'all-tools',
    label: 'Every open tool',
    blurb: 'The rest of the Library, other tracks in Classes, the leaderboard and extra profiles.',
    caps: ['all-tools'],
    reteach: ['LibraryScreen'],
  },
  {
    key: 'doors',
    label: 'Locked tools and Labs',
    blurb: 'Deeper tools and what opens each one, experimental features, and every widget.',
    caps: ['doors'],
  },
];

const BUILD = {
  key: 'build',
  label: 'The Workshop and Idea Garden',
  blurb: 'Somewhere to grow ideas and build them into projects.',
  features: ['workshop', 'idea-garden'],
};

const VAULT = {
  key: 'vault',
  label: 'The Knowledge Vault',
  blurb: 'Notes, links, papers and tools, all in one searchable place.',
  features: ['knowledge-vault'],
};

export const PATHS = {
  PERSONAL: [
    {
      key: 'start',
      label: 'Getting started',
      blurb: 'Home with your first goal and what opens next; Life Areas, the Planner and three games.',
      features: ['home-desk', 'compass', 'training', 'life-areas', 'planner'],
      screens: ['WayfinderScreen'],
      widgets: ['hq', 'stageSteps', 'focus', 'compass', 'goalSteps', 'lifeAreas'],
      games: ['mindgym', 'exercise', 'memory'],
      fab: ['reminder'],
    },
    {
      key: 'capture',
      label: 'The Capture Inbox',
      blurb: 'Get a thought out of your head now, decide where it goes later.',
      features: ['capture'],
      // The desk is where captured things turn into the next action, so it
      // arrives with the inbox rather than three stages later.
      widgets: ['desk'],
      fab: ['note', 'inbox'],
    },
    {
      key: 'games',
      label: 'Three more games and your first quest',
      blurb: 'Budget Balance, People Skills and Snack Catch, and quests: an idea, your own research, one real thing to do.',
      games: ['budget', 'people', 'snackcatch'],
      widgets: ['quests', 'habitRings', 'streak'],
    },
    {
      key: 'wayfinder',
      label: 'The Wayfinder on Home',
      blurb: 'Work out what you want: a few questions, then small things to try.',
      widgets: ['wayfinder', 'dailyDrills'],
    },
    { ...VAULT, widgets: ['wisdom'] },
    ...tail(BUILD),
  ],

  STUDENT: [
    {
      key: 'start',
      label: 'Getting started',
      blurb: 'Home, your first goal, Classes, the Planner and three games.',
      features: ['home-desk', 'compass', 'training', 'classes', 'planner'],
      screens: ['WayfinderScreen'],
      widgets: ['hq', 'stageSteps', 'focus', 'compass', 'goalSteps', 'studyBlocks'],
      games: ['factor', 'word', 'classify'],
      fab: ['calendar'],
    },
    { ...VAULT, widgets: ['classProgress'], fab: ['note'] },
    {
      key: 'games',
      label: 'Three more games and your first quest',
      blurb: 'World Explorer, Word Scramble and Memory Match, and quests: an idea, your own research, one real thing to do.',
      games: ['world', 'scramble', 'memory'],
      widgets: ['quests', 'dailyDrills', 'streak'],
    },
    {
      key: 'capture',
      label: 'The Capture Inbox',
      blurb: 'Get a thought out of your head now, decide where it goes later.',
      features: ['capture'],
      widgets: ['desk', 'activities'],
      fab: ['inbox'],
    },
    {
      key: 'areas',
      label: 'Life Areas',
      blurb: 'Eight sides of a life, each with a rating you set and one small thing to do.',
      features: ['life-areas'],
      widgets: ['wayfinder', 'checkins'],
    },
    ...tail(BUILD),
  ],

  BUSINESS: [
    {
      key: 'start',
      label: 'Getting started',
      blurb: 'Home, your first goal, the Capture Inbox, the Planner and three games.',
      features: ['home-desk', 'compass', 'training', 'capture', 'planner'],
      widgets: ['hq', 'stageSteps', 'focus', 'compass', 'goalSteps', 'desk', 'recurringOps'],
      games: ['registerready', 'shiftmanager', 'people'],
      fab: ['reminder'],
    },
    {
      key: 'workshop',
      label: 'The Workshop',
      blurb: 'Every project in one place, from blueprint to shipped.',
      features: ['workshop'],
      widgets: ['builds'],
      fab: ['project'],
    },
    {
      key: 'games',
      label: 'Three more games and your first quest',
      blurb: 'Career Compass, Budget Balance and Survive the Month, and quests: an idea, your own research, one real thing to do.',
      games: ['career', 'budget', 'survivemonth'],
      widgets: ['quests', 'systemsCheck', 'streak'],
    },
    {
      key: 'classes',
      label: 'Academy Classes',
      blurb: 'The business operations and compliance tracks.',
      features: ['classes'],
    },
    {
      key: 'areas',
      label: 'Life Areas',
      blurb: 'Eight sides of a life, each with a rating you set and one small thing to do.',
      features: ['life-areas'],
      widgets: ['checkins', 'orgSnapshot'],
      fab: ['note', 'inbox'],
    },
    ...tail({ ...VAULT, features: ['knowledge-vault', 'idea-garden'], label: 'The Knowledge Vault and Idea Garden' }),
  ],

  ENTREPRENEUR: [
    {
      key: 'start',
      label: 'Getting started',
      blurb: 'Home, your first goal, the Idea Garden, the Workshop and three games.',
      features: ['home-desk', 'compass', 'training', 'idea-garden', 'workshop'],
      widgets: ['hq', 'stageSteps', 'focus', 'compass', 'goalSteps', 'desk', 'founderQuest'],
      games: ['budget', 'survivemonth', 'trail'],
      fab: ['project'],
    },
    {
      key: 'capture',
      label: 'The Capture Inbox',
      blurb: 'Get a thought out of your head now, decide where it goes later.',
      features: ['capture'],
      widgets: ['ideas'],
      fab: ['note', 'inbox'],
    },
    {
      key: 'games',
      label: 'Three more games and your first quest',
      blurb: 'Career Compass, People Skills and Code Breaker, and quests: an idea, your own research, one real thing to do.',
      games: ['career', 'people', 'codebreaker'],
      widgets: ['quests', 'vaultStatus', 'streak'],
    },
    {
      key: 'classes',
      label: 'Academy Classes',
      blurb: 'The entity, credit and funding tracks.',
      features: ['classes'],
      widgets: ['targetsReadiness'],
    },
    {
      key: 'planner',
      label: 'The Planner and Life Areas',
      blurb: 'Your agenda, and eight sides of a life to keep an eye on.',
      features: ['planner', 'life-areas'],
      widgets: ['builds', 'checkins'],
      fab: ['calendar', 'reminder'],
    },
    ...tail(VAULT),
  ],
};

export const MAX_STAGE = PATHS.PERSONAL.length;

// What onboarding's "What did you come here for?" adds to stage 1, keyed by
// the purpose it was answered with (ONBOARDING_AIMS in objectives.js). The
// thing someone came for is on the map from the first minute, whatever
// their account type, and its widgets sit on Home right under the lead
// cards. Everything else still opens stage by stage, second to it.
//
// Same fields as a stage. Each aim's first goal (its purpose's `firstGoal`)
// must be doable with what this plus any type's stage 1 shows;
// scripts/check-wiring.mjs checks every type against every aim.
export const AIM_OPENS = {
  build: {
    features: ['idea-garden', 'workshop'],
    widgets: ['builds', 'ideas'],
    fab: ['project'],
  },
  learn: {
    features: ['classes', 'planner'],
    widgets: ['classProgress', 'studyBlocks'],
  },
  direction: {
    features: ['life-areas'],
    screens: ['WayfinderScreen'],
    widgets: ['wayfinder'],
  },
  // Someone who came to see what's in here gets the whole Library at once.
  // Holding tools back from a person whose goal is finding tools would be
  // working against them.
  explore: {
    features: ['capture', 'planner', 'knowledge-vault'],
    widgets: ['desk', 'activities', 'ideas'],
    fab: ['note', 'inbox'],
    caps: ['all-tools'],
  },
  areas: {
    features: ['life-areas', 'planner'],
    widgets: ['lifeAreas', 'checkins'],
  },
  snapshot: {
    features: ['life-areas', 'capture'],
    screens: ['WayfinderScreen'],
    widgets: ['lifeAreas', 'checkins'],
    fab: ['inbox'],
  },
  store: {
    features: ['capture', 'knowledge-vault'],
    // Not vaultStatus: that's the ownership curriculum's document vault,
    // not the Knowledge Vault. There's no Knowledge Vault widget; the desk
    // is where saved things turn into the next action.
    widgets: ['desk', 'ideas'],
    fab: ['note', 'inbox'],
  },
  habits: {
    features: ['planner', 'capture'],
    widgets: ['habitRings', 'streak'],
    fab: ['reminder', 'inbox'],
  },
  money: {
    features: ['life-areas', 'capture'],
    games: ['budget', 'survivemonth', 'trail'],
    widgets: ['lifeAreas'],
    fab: ['inbox'],
  },
};

// Onboarding's "Find my way" (it was "I'm not sure yet" on the persona card).
// Whatever type that landed on, the widget built for not knowing yet joins
// stage 1, straight under the Compass.
export const EXPLORING_WIDGET = 'wayfinder';

// Routes outside the feature catalog that still belong to the map. Anything
// not listed here and not in the catalog is always shown — the Life Area
// sub-sections, Profile, Settings, Help and the rest. Failing open is the
// point: a screen nobody classified should never quietly vanish.
//
// `true` means "shown once a stage lists it, or from 'all-tools'". A string
// is a catalog feature id the route follows (an alias onto the same tool).
export const STAGED_SCREENS = {
  WayfinderScreen:         true,
  Leaderboard:             true,
  AllProfiles:             true,
  ProjectDetail:           'workshop',
  NotesScreen:             'knowledge-vault',
  ResearchScreen:          'knowledge-vault',
  ResourcesToolsScreen:    'knowledge-vault',
  BreakthroughsScreen:     'discover',
  TopTalentScreen:         'discover',
  CommunityProjectsScreen: 'discover',
  ModerationQueueScreen:   'discover',
};

// The simple goal each type is handed when there's no answer to "What did
// you come here for?" (an account from before onboarding asked it), and the
// purpose set alongside it. With an answer, the purpose's own `firstGoal`
// wins — see firstGoalFor in src/logic/experienceStage.js. The guide walks
// people through it step by step (src/logic/useGuidedFirstGoal.js).
export const FIRST_GOALS = {
  PERSONAL:     { objective: 'first-steps',         purpose: 'habits' },
  STUDENT:      { objective: 'first-study-session', purpose: 'learn' },
  BUSINESS:     { objective: 'first-ops-check',     purpose: 'career' },
  ENTREPRENEUR: { objective: 'first-founder-step',  purpose: 'build' },
};
