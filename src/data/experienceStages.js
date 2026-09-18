// src/data/experienceStages.js
// How much of the app someone sees, and when they see more.
//
// The app does a great many things. A new account used to get all of them
// at once: ten widgets on Home, thirty-two games behind two rows of filter
// chips, three Library views, and a Compass listing everything still locked.
// Now it grows with you, in three stages:
//
//   1  Getting started   one simple goal, the handful of tools that fit your
//                        profile type, and six games picked for it
//   2  Finding your feet your type's full dashboard, every open tool, every
//                        game. Locked tools stay out of sight until earned.
//   3  Everything        the lot, including the locked tools and how to open
//                        them, experimental work and Plus
//
// This is visibility, NOT a gate. A hidden tool is still open — a step's
// "Open" button, a link from another screen, or a Settings switch all still
// reach it. The gates (src/data/featureCatalog.js) are a separate question,
// and a stage never overrides one.
//
// Nothing here is stored. The stage is worked out from progress the app
// already keeps honestly — finished objectives and level — so it survives a
// reinstall and a new device without a column of its own. The one stored
// thing is the "show me everything" choice (see AccessContext).
//
// No imports on purpose, same as featureCatalog.js and objectives.js: plain
// data a script can load without the React Native graph.

export const STAGES = [
  {
    n: 1,
    key: 'starter',
    label: 'Getting started',
    blurb: 'One goal, a few tools and six games picked for your profile type.',
  },
  {
    n: 2,
    key: 'growing',
    label: 'Finding your feet',
    blurb: 'Your full dashboard, every open tool and every game.',
  },
  {
    n: 3,
    key: 'full',
    label: 'Everything',
    blurb: 'All of it, including locked tools and how to open them.',
  },
];

export const MAX_STAGE = 3;

// What moves you up. Either counts — objectives are the intended route,
// level is there so somebody who mostly plays games isn't held back by a
// checklist they never opened.
export const STAGE_RULES = {
  2: { objectives: 1, level: 3 },
  3: { objectives: 3, level: 6 },
};

// ─── The starting app, per profile type ─────────────────────────────────────
//
//   features    featureCatalog ids shown at stage 1. Everything else in the
//               catalog appears at stage 2 (open) or 3 (locked, Plus).
//   screens     routes that aren't in the catalog but should still show at
//               stage 1 (the Wayfinder, which is ungated on purpose).
//   widgets     the three Home widgets stage 1 shows, in order.
//   games       the six starter games, by gameRegistry id.
//   fab         the quick-action keys the + button offers at stage 1.
//   firstObjective  the simple goal started for you at the end of onboarding.
//   purpose     the purpose set alongside it, so the Compass has one without
//               asking a brand-new account "what are you here for?".
//
// Every step of each firstObjective points at a screen in its own
// `features` list — a first goal whose "Open" button leads somewhere the
// person can't otherwise find would teach them the app is hiding things.

const BASE_FEATURES = ['home-desk', 'training', 'compass', 'life-areas', 'planner', 'capture'];

export const STARTER_PLANS = {
  PERSONAL: {
    features: [...BASE_FEATURES],
    screens: ['WayfinderScreen'],
    widgets: ['hq', 'compass', 'lifeAreas'],
    games: ['mindgym', 'exercise', 'budget', 'people', 'memory', 'snackcatch'],
    fab: ['reminder', 'note', 'inbox'],
    firstObjective: 'first-steps',
    purpose: 'habits',
  },
  STUDENT: {
    features: [...BASE_FEATURES, 'classes', 'knowledge-vault'],
    screens: ['WayfinderScreen'],
    widgets: ['hq', 'compass', 'studyBlocks'],
    games: ['factor', 'word', 'classify', 'world', 'scramble', 'memory'],
    fab: ['calendar', 'note', 'inbox'],
    firstObjective: 'first-study-session',
    purpose: 'learn',
  },
  BUSINESS: {
    features: [...BASE_FEATURES, 'workshop', 'classes'],
    screens: [],
    widgets: ['hq', 'compass', 'recurringOps'],
    games: ['registerready', 'shiftmanager', 'people', 'career', 'budget', 'survivemonth'],
    fab: ['project', 'reminder', 'inbox'],
    firstObjective: 'first-ops-check',
    purpose: 'career',
  },
  ENTREPRENEUR: {
    features: [...BASE_FEATURES, 'idea-garden', 'workshop', 'classes'],
    screens: [],
    widgets: ['hq', 'compass', 'founderQuest'],
    games: ['budget', 'trail', 'survivemonth', 'career', 'people', 'codebreaker'],
    fab: ['project', 'note', 'inbox'],
    firstObjective: 'first-founder-step',
    purpose: 'build',
  },
};

// Onboarding's "I'm not sure yet". Whatever type that landed on, the one
// widget built for not knowing yet leads, and the Wayfinder is reachable.
export const EXPLORING_WIDGETS = ['hq', 'compass', 'wayfinder'];

// Routes outside the feature catalog that still belong to a stage. Anything
// not listed here and not in the catalog is always visible — the Life Area
// sub-sections, Profile, Settings, Help and the rest. Failing open is the
// point: a screen nobody classified should never quietly vanish.
//
// A value is either the stage number it appears at, or a catalog feature id
// it follows (an alias route onto the same screen).
export const STAGED_SCREENS = {
  WayfinderScreen:         2, // stage 1 only where a plan lists it
  Leaderboard:             2,
  AllProfiles:             2,
  ProjectDetail:           'workshop',
  NotesScreen:             'knowledge-vault',
  ResearchScreen:          'knowledge-vault',
  ResourcesToolsScreen:    'knowledge-vault',
  BreakthroughsScreen:     'discover',
  TopTalentScreen:         'discover',
  CommunityProjectsScreen: 'discover',
  ModerationQueueScreen:   'discover',
};

// The lines the "more of the app is open" notice shows on the way up. Kept
// short and concrete — what you can now see, not a feature list.
export const STAGE_OPENS = {
  2: [
    'Your full dashboard, plus the widget editor',
    'Every training game, with subject and type filters',
    'Every open tool in the Library',
    'All the quick actions on the + button',
    'The Getting Started card, to finish setting up',
  ],
  3: [
    'Locked tools, and the objective or test that opens each',
    'Experimental features, if you want them',
    'The Plus tier',
    'Every widget in the dashboard editor',
  ],
};
