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

// "What stage of life are you at right now?" (the welcome's stage card).
// Replaces the age question; age is asked only at signup. The founder's
// five (college and creator are theirs), plus GED, which keeps its key.
//   portfolio  the portfolio's "Current phase" card it fills in
export const START_POINTS = [
  { key: 'highSchool', label: 'Student', hint: 'High school or early learner building foundational skills.', icon: 'school-outline',
    portfolio: { title: 'Student', sub: 'High School / Learner', desc: 'Focusing on foundational concepts & personal experiments.' } },
  { key: 'college', label: 'College', hint: 'University student mastering major discipline and projects.', icon: 'library-outline',
    portfolio: { title: 'College Student', sub: 'University / Training', desc: 'Studying systems, ideas, and practical applications.' } },
  { key: 'working', label: 'Working Professional', hint: 'Industry specialist seeking to showcase domain expertise.', icon: 'briefcase-outline',
    portfolio: { title: 'Working Professional', sub: 'Industry Specialist', desc: 'Building real work for real teams and clients.' } },
  { key: 'creator', label: 'Freelancer / Creator', hint: 'Independent builder crafting services and digital products.', icon: 'rocket-outline',
    portfolio: { title: 'Freelancer & Creator', sub: 'Independent Builder', desc: 'Creating custom tools, designs, and independent products.' } },
  { key: 'ged', label: 'Getting my GED', hint: "Didn't finish school. Starting from here.", icon: 'ribbon-outline',
    portfolio: { title: 'GED Student', sub: 'Finishing my diploma', desc: 'Starting from here, one step at a time.' } },
  { key: 'unsure', label: 'Life Explorer', hint: 'Polymath learning for intellectual curiosity and growth.', icon: 'compass-outline',
    portfolio: { title: 'Life Explorer', sub: 'Polymath & Thinker', desc: 'Exploring interdisciplinary knowledge & passion projects.' } },
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
export const PLANNED_BUILD_KINDS = ['resume', 'plan'];

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
//   label, blurb  what the welcome's "Want to start here?" card says
//   widgets     Today after CORE_TODAY, at most MAX_PATH_WIDGETS
//               ('room' only shows when the room is placed on Today)
//   calmTiles   what Calm shows besides the next step
//   learnShelves, makeKinds   what Learn and Make put first
//   fabFirst    + button actions shown first (FloatingActionButton keys;
//               "Add plan" is 'calendar', which opens Today's week to plan)
//   tools       featureCatalog ids this path shows
//   notes       guide surfaces whose mentor notes this path meets, in order
//   purpose     the objectives.js purpose a new account on this path gets
//               (its first goal and AIM_OPENS), until P6 adds path purposes
export const PATH_KITS = {
  like: {
    label: 'What do I like?',
    blurb: 'Try small things. Notice what pulls you in.',
    icon: 'sparkles-outline',
    purpose: 'explore',
    widgets: ['deliverable', 'checkin', 'room'],
    calmTiles: ['find', 'unit'],
    learnShelves: ['samplerMap', 'todaysFind'],
    makeKinds: ['page', 'story', 'beat', 'game'],
    fabFirst: ['next', 'note', 'calendar'],
    tools: [],
    notes: ['today.day', 'learn.finds', 'make.board', 'you'],
  },
  next: {
    label: "What's next for me",
    blurb: 'Every road after school, trades included. Try two.',
    icon: 'map-outline',
    purpose: 'direction',
    widgets: ['deliverable', 'dueSoon', 'stillOpen'],
    calmTiles: ['unit', 'dueSoon'],
    learnShelves: ['afterSchoolMap', 'careerExplorer', 'classes'],
    makeKinds: ['page', 'logic', 'plan'],
    fabFirst: ['next', 'note', 'calendar'],
    tools: ['career-map', 'classes'],
    notes: ['today.day', 'learn.path', 'learn.unit', 'make.board', 'you'],
  },
  money: {
    label: 'Money on my own',
    blurb: 'How money works when it’s yours. One step at a time.',
    icon: 'wallet-outline',
    purpose: 'money',
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
    blurb: 'From a job to work that fits you.',
    icon: 'briefcase-outline',
    purpose: 'career',
    widgets: ['deliverable', 'dueSoon', 'missions'],
    calmTiles: ['unit', 'dueSoon'],
    learnShelves: ['careerMap', 'skillClasses'],
    makeKinds: ['resume', 'page', 'launch', 'ai'],
    fabFirst: ['next', 'calendar', 'project'],
    tools: ['career-map', 'portfolio'],
    notes: ['today.day', 'learn.path', 'learn.unit', 'make.board', 'you'],
  },
  // A mini-path, one per life area, for when "the ground" is shakiest. Its
  // deliverable is "My reset plan"; once handed in, the person moves on to
  // the path SUGGESTED_PATH names for them (§4.2).
  ground: {
    label: 'Ground fix',
    blurb: 'One small fix for the shaky part, first.',
    icon: 'leaf-outline',
    purpose: 'areas',
    widgets: ['lifeAreas', 'checkin', 'deliverable', 'dueSoon'],
    calmTiles: ['unit', 'checkin'],
    learnShelves: ['areaLessons', 'lifeArea'],
    makeKinds: ['plan', 'body', 'launch'],
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
  college:    { love: 'like', goodAt: 'next',   needs: 'like', paid: 'money', ground: 'next' },
  working:    { love: 'like', goodAt: 'career', needs: 'like', paid: 'money', ground: 'career' },
  creator:    { love: 'like', goodAt: 'career', needs: 'like', paid: 'money', ground: 'career' },
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
  college:    { say: 'Learn what class skips.',                   classesFirst: true },
  working:    { say: 'Learn without going back to school.',       workMode: true },
  creator:    { say: 'Your own thing, built right.',              workMode: true },
  ged:        { say: "No shame. You're starting from here.",      classesFirst: true, asksState: true, overlay: 'ged' },
  unsure:     { say: "You don't need to know yet.",               reaskStart: true },
};

// ── The Descartes welcome (the founder's onboarding, 2026-10-21) ─────────
// Wording is the founder's own site, word for word where it fits everyone;
// the stage card's portfolio text drops the demo's computer-science
// assumptions (it's editable in the builder anyway). Stored keys
// (@cth_welcome_v1, then profiles.metadata.welcome_goals /
// welcome_interests) are never renamed.

// Step 2, "What brings you here today?" Pick any; the first one picked
// sets the path. `kind` is the project it points at.
export const WELCOME_GOALS = [
  { key: 'portfolio', label: 'Build a personal portfolio webpage', kind: 'page', path: { working: 'career', creator: 'career', college: 'next', default: 'like' } },
  { key: 'habit', label: 'Develop a disciplined habit of building', kind: 'launch', path: { working: 'career', creator: 'career', default: 'like' } },
  { key: 'skills', label: 'Showcase skills & real projects', kind: 'page', path: { working: 'career', creator: 'career', college: 'career', default: 'next' } },
  { key: 'explore', label: 'Explore modern digital tools', kind: null, path: 'like' },
];

// Step 3's cards are START_POINTS (icon, label, hint, portfolio); this is
// the order the welcome shows them in. GED keeps its key, but the welcome
// shows the founder's five.
export const WELCOME_STAGES = ['highSchool', 'college', 'working', 'creator', 'unsure'];

// Step 4, "Pick your skills & interests". `skill` pre-fills the
// portfolio's badges, `role` its headline, `kinds` the projects it points at.
export const WELCOME_INTERESTS = [
  { key: 'web', label: 'Web Dev (HTML/JS/CSS)', icon: 'code-slash-outline', skill: 'Web Development', role: 'Web Developer', kinds: ['page'] },
  { key: 'design', label: 'UI/UX Design & Systems', icon: 'color-palette-outline', skill: 'UI/UX Design', role: 'Designer', kinds: ['page'] },
  { key: 'logic', label: 'Logic & Math Systems', icon: 'extension-puzzle-outline', skill: 'Logic & Algorithmic Math', role: 'Systems Thinker', kinds: ['logic', 'math'] },
  { key: 'finance', label: 'Personal Finance & Wealth', icon: 'trending-up-outline', skill: 'Personal Finance', role: 'Money Builder', kinds: ['money'] },
  { key: 'writing', label: 'Creative & Technical Writing', icon: 'create-outline', skill: 'Creative Writing', role: 'Writer', kinds: ['story'] },
  { key: 'systems', label: 'Software Architecture', icon: 'cog-outline', skill: 'Software Systems', role: 'Software Architect', kinds: ['launch'] },
];

// Step 5, "Recommended Project", and "here's the other options": one per
// site the founder built. Each is a Studio Build kind.
//   stats   the card's three numbers, as on the founder's site
export const WELCOME_PROJECTS = [
  { kind: 'page', title: 'Build Your Personal Portfolio Webpage', desc: 'Combine your life stage, interests, and philosophy into a responsive, customizable live website.', launch: 'Launch Portfolio Builder', stats: [['Features', '6 Components'], ['Output', 'Export HTML'], ['Hosting', 'Publish free']] },
  { kind: 'money', title: 'Wealth Engine', desc: 'Model compound growth, your freedom number, and how markets set prices.', launch: 'Launch Wealth Engine', stats: [['Models', 'Growth + FIRE'], ['Output', 'Export HTML'], ['Data', 'Your numbers']] },
  { kind: 'story', title: 'Narrative Engine', desc: 'Turn one idea into a story arc with hooks, a pull, and a call to action.', launch: 'Launch Narrative Engine', stats: [['Arcs', '3 shapes'], ['Output', 'Markdown outline'], ['Tones', '4 voices']] },
  { kind: 'logic', title: 'Socratic Canvas & Logic Lab', desc: 'Map an argument, test it with logic gates, and catch thinking traps.', launch: 'Launch Logic Lab', stats: [['Gates', '6 types'], ['Output', 'Export HTML'], ['Nodes', 'Unlimited']] },
  { kind: 'math', title: 'Geometry Proof Engine', desc: 'Plot functions, add vectors, and watch classic proofs hold.', launch: 'Launch Proof Engine', stats: [['Curves', '6 rules'], ['Proofs', '4 classics'], ['Output', 'Export HTML']] },
  { kind: 'body', title: 'Bio-Performance Lab', desc: 'Heart zones, a body map, a training plan, water and sleep, on one dashboard.', launch: 'Launch Bio Lab', stats: [['Systems', '4 mapped'], ['Plans', '3 goals'], ['Output', 'Export HTML']] },
  { kind: 'launch', title: 'Developer Launchpad', desc: 'Your links, a deep-work timer, and a consistency habit matrix.', launch: 'Launch Launchpad', stats: [['Timer', 'Deep work'], ['Matrix', 'Habits × days'], ['Output', 'JSON + HTML']] },
];
