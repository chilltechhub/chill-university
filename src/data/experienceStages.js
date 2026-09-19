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
//   widgets   Home widgets added to the fixed dashboard, in order
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

// The last five stages are the same shape for everyone; only the eighth
// differs, because it is whichever core tool that type hasn't met yet.
const tail = (eighth) => [
  {
    key: 'all-games',
    label: 'Every training game',
    blurb: 'All the games, with subject and type filters, and your Progress tab.',
    caps: ['all-games'],
  },
  {
    key: 'dashboard',
    label: 'Your dashboard, your way',
    blurb: 'Rearrange Home, every quick action on the +, and the rest of setup.',
    caps: ['dashboard'],
    reteach: ['Home'],
  },
  eighth,
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
      blurb: 'Home, your first goal, Life Areas, the Planner and three games.',
      features: ['home-desk', 'compass', 'training', 'life-areas', 'planner'],
      screens: ['WayfinderScreen'],
      widgets: ['hq', 'compass', 'lifeAreas'],
      games: ['mindgym', 'exercise', 'memory'],
      fab: ['reminder'],
    },
    {
      key: 'capture',
      label: 'The Capture Inbox',
      blurb: 'Get a thought out of your head now, decide where it goes later.',
      features: ['capture'],
      widgets: ['focus'],
      fab: ['note', 'inbox'],
    },
    {
      key: 'games',
      label: 'Three more games',
      blurb: 'Budget Balance, People Skills and Snack Catch, plus your streak on Home.',
      games: ['budget', 'people', 'snackcatch'],
      widgets: ['habitRings', 'streak'],
    },
    {
      key: 'wayfinder',
      label: 'The Wayfinder on Home',
      blurb: 'Work out what you want, and today’s drills on your dashboard.',
      widgets: ['wayfinder', 'dailyDrills'],
    },
    { ...VAULT, widgets: ['desk', 'wisdom'] },
    ...tail(BUILD),
  ],

  STUDENT: [
    {
      key: 'start',
      label: 'Getting started',
      blurb: 'Home, your first goal, Classes, the Planner and three games.',
      features: ['home-desk', 'compass', 'training', 'classes', 'planner'],
      screens: ['WayfinderScreen'],
      widgets: ['hq', 'compass', 'studyBlocks'],
      games: ['factor', 'word', 'classify'],
      fab: ['calendar'],
    },
    { ...VAULT, widgets: ['classProgress'], fab: ['note'] },
    {
      key: 'games',
      label: 'Three more games',
      blurb: 'World Explorer, Word Scramble and Memory Match, plus your streak on Home.',
      games: ['world', 'scramble', 'memory'],
      widgets: ['dailyDrills', 'streak'],
    },
    {
      key: 'capture',
      label: 'The Capture Inbox',
      blurb: 'Get a thought out of your head now, decide where it goes later.',
      features: ['capture'],
      widgets: ['focus', 'activities'],
      fab: ['inbox'],
    },
    {
      key: 'areas',
      label: 'Life Areas',
      blurb: 'Eight sides of a life, each with a rating you set and one small thing to do.',
      features: ['life-areas'],
      widgets: ['wayfinder', 'desk'],
    },
    ...tail(BUILD),
  ],

  BUSINESS: [
    {
      key: 'start',
      label: 'Getting started',
      blurb: 'Home, your first goal, the Capture Inbox, the Planner and three games.',
      features: ['home-desk', 'compass', 'training', 'capture', 'planner'],
      widgets: ['hq', 'compass', 'recurringOps'],
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
      label: 'Three more games',
      blurb: 'Career Compass, Budget Balance and Survive the Month, plus a systems check.',
      games: ['career', 'budget', 'survivemonth'],
      widgets: ['systemsCheck', 'streak'],
    },
    {
      key: 'classes',
      label: 'Academy Classes',
      blurb: 'The business operations and compliance tracks.',
      features: ['classes'],
      widgets: ['focus'],
    },
    {
      key: 'areas',
      label: 'Life Areas',
      blurb: 'Eight sides of a life, each with a rating you set and one small thing to do.',
      features: ['life-areas'],
      widgets: ['desk', 'orgSnapshot'],
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
      widgets: ['hq', 'compass', 'founderQuest'],
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
      label: 'Three more games',
      blurb: 'Career Compass, People Skills and Code Breaker, plus the Vault on Home.',
      games: ['career', 'people', 'codebreaker'],
      widgets: ['vaultStatus', 'streak'],
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
      widgets: ['builds', 'desk'],
      fab: ['calendar', 'reminder'],
    },
    ...tail(VAULT),
  ],
};

export const MAX_STAGE = PATHS.PERSONAL.length;

// Onboarding's "I'm not sure yet". Whatever type that landed on, the widget
// built for not knowing yet joins stage 1, straight under the Compass.
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

// The simple goal each type is handed at the end of onboarding, and the
// purpose set alongside it so the Compass has one without asking a
// brand-new account "what are you here for?". The guide walks people
// through it step by step (src/logic/useGuidedFirstGoal.js).
export const FIRST_GOALS = {
  PERSONAL:     { objective: 'first-steps',         purpose: 'habits' },
  STUDENT:      { objective: 'first-study-session', purpose: 'learn' },
  BUSINESS:     { objective: 'first-ops-check',     purpose: 'career' },
  ENTREPRENEUR: { objective: 'first-founder-step',  purpose: 'build' },
};
