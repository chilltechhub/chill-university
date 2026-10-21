// src/data/pathKits.js
// What each path and starting point shows (docs/shake-up-plan-2026-10-21.md
// §8). "Your dream picks your kit": the core is always there, a path's kit
// shows only while you're on it.
//
// Skeleton (P0): the shape and the §8.1 / §8.2 tables, so src/logic/tailoring.js
// and scripts/check-tailoring.mjs have something real to run. Nothing reads
// it yet. P6 adds each path's units, maps and shelves, and the wording is the
// founder's to review before then (plan, founder answer 12).
//
// The keys are stored (@cth_welcome_v1, then profiles.metadata.start_point /
// shakiest / path_key), so never rename one; add a new key instead.
//
// No imports: plain data.

// "Where are you in life right now?" (welcome W4). Replaces the age question;
// age is asked only at signup.
export const START_POINTS = [
  { key: 'highSchool', label: 'Finishing high school' },
  { key: 'working',    label: 'Working, no career yet' },
  { key: 'ged',        label: "Didn't finish school (GED)" },
  { key: 'unsure',     label: 'Not sure / something else' },
];

// "Which feels shakiest right now?" (W5): the four ikigai circles and the
// ground under them.
export const SHAKIEST = [
  { key: 'love',   label: 'Love' },
  { key: 'goodAt', label: 'Good at' },
  { key: 'needs',  label: 'World needs' },
  { key: 'paid',   label: 'Getting paid' },
  { key: 'ground', label: 'The ground' },
];

// Every path's Today starts with these, then its own widgets (§3.1). All of
// them can be moved or hidden; nothing is pinned.
export const CORE_TODAY = ['nextStep', 'yourDay', 'find'];
export const MAX_PATH_WIDGETS = 4;

// Studio kinds the paths need that P6 builds (check-tailoring accepts them).
export const PLANNED_BUILD_KINDS = ['money', 'resume', 'plan'];

// Learn shelves a path can put first (§8.2). P6 builds them.
export const LEARN_SHELVES = {
  samplerMap:       'Sampler map',
  todaysFind:       "Today's Find",
  afterSchoolMap:   'After-school map',
  careerExplorer:   'Career Explorer',
  classes:          'Classes',
  moneyMap:         'Money map',
  moneyLessons:     'Money lessons',
  moneyCalculators: 'Savings and debt calculators',
  careerMap:        'Career map',
  skillClasses:     'Skill classes',
  areaLessons:      "That area's lessons",
  lifeArea:         'The life area',
};

// §8.2, one row per path.
//   widgets     Today after CORE_TODAY, at most MAX_PATH_WIDGETS
//               ('room' only shows when the room is placed on Today)
//   calmTiles   what Calm shows besides the next step
//   learnShelves, makeKinds   what Learn and Make put first
//   fabFirst    + button actions shown first (FloatingActionButton keys;
//               "Add plan" is 'calendar', which opens Today's week to plan)
//   tools       featureCatalog ids this path shows
//   notes       guide surfaces whose mentor notes this path meets, in order
export const PATH_KITS = {
  like: {
    label: 'What do I like?',
    icon: 'sparkles-outline',
    widgets: ['deliverable', 'checkin', 'room'],
    calmTiles: ['find', 'unit'],
    learnShelves: ['samplerMap', 'todaysFind'],
    makeKinds: ['page', 'beat', 'game'],
    fabFirst: ['next', 'note', 'calendar'],
    tools: [],
    notes: ['today.day', 'learn.finds', 'make.board', 'you'],
  },
  next: {
    label: "What's next for me",
    icon: 'map-outline',
    widgets: ['deliverable', 'dueSoon', 'stillOpen'],
    calmTiles: ['unit', 'dueSoon'],
    learnShelves: ['afterSchoolMap', 'careerExplorer', 'classes'],
    makeKinds: ['page', 'plan'],
    fabFirst: ['next', 'note', 'calendar'],
    tools: ['career-map', 'classes'],
    notes: ['today.day', 'learn.path', 'learn.unit', 'make.board', 'you'],
  },
  money: {
    label: 'Money on my own',
    icon: 'wallet-outline',
    widgets: ['deliverable', 'money', 'dueSoon', 'stillOpen'],
    calmTiles: ['money', 'dueSoon'],
    learnShelves: ['moneyMap', 'moneyLessons', 'moneyCalculators'],
    makeKinds: ['money', 'business'],
    fabFirst: ['next', 'calendar', 'reminder'],
    tools: ['savings-investing', 'debt-credit'],
    notes: ['today.day', 'learn.path', 'learn.unit', 'make.board', 'you'],
  },
  career: {
    label: 'Job to career',
    icon: 'briefcase-outline',
    widgets: ['deliverable', 'dueSoon', 'missions'],
    calmTiles: ['unit', 'dueSoon'],
    learnShelves: ['careerMap', 'skillClasses'],
    makeKinds: ['resume', 'page', 'ai'],
    fabFirst: ['next', 'calendar', 'project'],
    tools: ['career-map', 'portfolio'],
    notes: ['today.day', 'learn.path', 'learn.unit', 'make.board', 'you'],
  },
  // A mini-path, one per life area, for when "the ground" is shakiest. Its
  // deliverable is "My reset plan"; once handed in, the person moves on to
  // the path SUGGESTED_PATH names for them (§4.2).
  ground: {
    label: 'Ground fix',
    icon: 'leaf-outline',
    widgets: ['lifeAreas', 'checkin', 'deliverable', 'dueSoon'],
    calmTiles: ['unit', 'checkin'],
    learnShelves: ['areaLessons', 'lifeArea'],
    makeKinds: ['plan'],
    fabFirst: ['next', 'calendar', 'reminder'],
    tools: ['life-areas'],
    notes: ['today.day', 'you', 'learn.unit', 'make.board'],
  },
};

// Anyone unsure starts here.
export const DEFAULT_PATH = 'like';

// §8.1: the suggested path, by starting point × shakiest circle. For
// `ground` the path is always the Ground fix first; the value here is the
// path that comes after it.
export const SUGGESTED_PATH = {
  highSchool: { love: 'like', goodAt: 'next',   needs: 'like', paid: 'money', ground: 'like' },
  working:    { love: 'like', goodAt: 'career', needs: 'like', paid: 'money', ground: 'career' },
  ged:        { love: 'next', goodAt: 'next',   needs: 'next', paid: 'money', ground: 'next' },
  unsure:     { love: 'like', goodAt: 'like',   needs: 'like', paid: 'money', ground: 'like' },
};

// §8.2, second table: what a starting point changes, whatever the path.
//   say         the line that sets the tone
//   classesFirst  Learn opens on Classes
//   asksState   asks which state (GED rules vary; kept on the phone)
//   overlay     units laid over the What's next path
//   reaskStart  asks "Where are you in life?" again after a few tastes
//   workMode    Work Mode in Today's ⋯
export const START_POINT_KITS = {
  highSchool: { say: 'After graduation, your way.',               classesFirst: true },
  working:    { say: 'Learn without going back to school.',       workMode: true },
  ged:        { say: "No shame. You're starting from here.",      classesFirst: true, asksState: true, overlay: 'ged' },
  unsure:     { say: "You don't need to know yet.",               reaskStart: true },
};
