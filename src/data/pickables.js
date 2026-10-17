// src/data/pickables.js
// Every part of the app someone can choose to have, for the "Pick your
// features" screen (onboarding, and Make it yours → My features).
//
// How someone starts (the track, saved on the account):
//   picks  "Just my picks": only what's ticked here. Nothing shows up on its
//          own; finishing a goal SUGGESTS one more thing, and only adds it
//          on a yes.
//   auto   "Level up": the stage path in experienceStages.js, plus anything
//          ticked here, open from day one.
//   full   "All in": everything, minus whatever is unticked here.
//
// Each item says what it puts on the map, in the same terms as a stage:
//   features  featureCatalog ids
//   screens   STAGED_SCREENS routes outside the catalog
//   widgets   Home cards it puts ON Home. One at most: a pick is one card,
//             so a Home made of five picks is five cards, not twelve
//   extraWidgets  its other cards, waiting in Home's Edit tray
//   typeWidgets  tray cards only for account types whose own default
//             dashboard has them (Founder Quest is an Entrepreneur card)
//   fab       quick actions on the + button
//   games     'all' = every training game
//   labs      the experimental opt-in (one switch for all of Labs)
//
// Not here, because they are always on: Home, App Nav (the goal and what's
// next), Profile, Settings, Help and Make it yours.
//
// No imports on purpose, same as featureCatalog.js: plain data a check
// script can load (scripts/check-pickables.mjs makes sure every catalog
// feature and every Home card belongs to exactly one place here).

export const ALWAYS_ON_FEATURES = ['home-desk', 'compass'];

// Home cards everyone has, whatever they pick: who you are, today's focus,
// the goal in flight and its steps. 'stageSteps' (what the next stage
// opens) is added only on the Level up track, where there are stages.
export const BASE_WIDGETS = ['hq', 'focus', 'compass', 'goalSteps'];

export const PICK_GROUPS = [
  { key: 'plan',   label: 'Plan your days',  icon: 'calendar-outline' },
  { key: 'save',   label: 'Save and sort',   icon: 'file-tray-full-outline' },
  { key: 'build',  label: 'Build things',    icon: 'hammer-outline' },
  { key: 'learn',  label: 'Learn and play',  icon: 'school-outline' },
  { key: 'life',   label: 'Your life',       icon: 'leaf-outline' },
  { key: 'people', label: 'People',          icon: 'people-outline' },
  { key: 'more',   label: 'Extras',          icon: 'sparkles-outline' },
];

export const PICKABLES = [
  // ── Plan your days ──
  {
    id: 'planner', group: 'plan', icon: 'calendar-outline',
    label: 'Planner', blurb: 'Your day, habits and reminders.',
    features: ['planner'], widgets: ['activities'], extraWidgets: ['habitRings'], typeWidgets: ['studyBlocks', 'recurringOps'],
    fab: ['calendar', 'reminder'],
  },
  {
    id: 'work-mode', group: 'plan', icon: 'timer-outline',
    label: 'Work Mode', blurb: 'A focus timer for one task at a time.',
    features: ['work-mode'],
  },
  {
    id: 'weekly-review', group: 'plan', icon: 'refresh-outline',
    label: 'Weekly Review', blurb: 'Look back at your week and plan the next.',
    features: ['weekly-review'],
  },

  // ── Save and sort ──
  {
    id: 'capture', group: 'save', icon: 'file-tray-full-outline',
    label: 'Capture Inbox', blurb: 'Save a thought or link now, sort it later.',
    features: ['capture'], widgets: ['desk'], fab: ['note', 'inbox'],
  },
  {
    id: 'knowledge-vault', group: 'save', icon: 'library-outline',
    label: 'Knowledge Vault', blurb: 'Notes, links and tools you keep.',
    features: ['knowledge-vault'],
  },
  {
    id: 'import-hub', group: 'save', icon: 'cloud-upload-outline',
    label: 'Bring stuff in', blurb: 'Lists, links and files in bulk, or messy notes with any chatbot.',
    features: ['import-hub'],
  },

  // ── Build things ──
  {
    id: 'workshop', group: 'build', icon: 'hammer-outline',
    label: 'Projects', blurb: 'Every project, its steps and deadlines.',
    features: ['workshop'], widgets: ['builds'], extraWidgets: ['desk'], fab: ['project'],
  },
  {
    id: 'idea-garden', group: 'build', icon: 'leaf-outline',
    label: 'Idea Garden', blurb: 'Grow ideas before they become projects.',
    features: ['idea-garden'], widgets: ['ideas'],
  },
  {
    id: 'portfolio', group: 'build', icon: 'briefcase-outline',
    label: 'Portfolio', blurb: 'A record of what you finished.',
    features: ['portfolio'],
  },

  // ── Learn and play ──
  {
    id: 'classes', group: 'learn', icon: 'ribbon-outline',
    label: 'Classes', blurb: 'Lessons by subject, with quizzes.',
    features: ['classes'], widgets: ['classProgress'], typeWidgets: ['founderQuest', 'vaultStatus', 'targetsReadiness'],
  },
  {
    id: 'quests', group: 'learn', icon: 'flag-outline',
    label: 'Quests', blurb: 'Ten-minute challenges that end in a real task.',
    widgets: ['quests'],
  },
  {
    id: 'training', group: 'learn', icon: 'game-controller-outline',
    label: 'Training games', blurb: 'Short skill games and daily drills.',
    features: ['training'], games: 'all', extraWidgets: ['dailyDrills'],
  },
  {
    id: 'lesson-builder', group: 'learn', icon: 'easel-outline',
    label: 'Lesson Builder', blurb: 'Plan lessons to teach other people.',
    features: ['lesson-builder'],
  },

  // ── Your life ──
  {
    id: 'life-areas', group: 'life', icon: 'pie-chart-outline',
    label: 'Life Areas', blurb: 'Rate each part of life, get one small step.',
    features: ['life-areas'], widgets: ['lifeAreas'], extraWidgets: ['checkins'], typeWidgets: ['systemsCheck'],
  },
  {
    id: 'wayfinder', group: 'life', icon: 'navigate-circle-outline',
    label: 'Wayfinder', blurb: 'Work out what you want, then try it.',
    screens: ['WayfinderScreen'], extraWidgets: ['wayfinder'],
  },
  {
    id: 'career-map', group: 'life', icon: 'compass-outline',
    label: 'Career Explorer', blurb: 'Compare careers and find a next step.',
    features: ['career-map'],
  },
  {
    id: 'savings-investing', group: 'life', icon: 'trending-up-outline',
    label: 'Savings & Investing', blurb: 'How saving and investing grow.',
    features: ['savings-investing'],
  },
  {
    id: 'debt-credit', group: 'life', icon: 'card-outline',
    label: 'Debt & Credit', blurb: 'What you owe and what to pay first.',
    features: ['debt-credit'],
  },

  // ── People ──
  {
    id: 'discover', group: 'people', icon: 'people-outline',
    label: 'Community', blurb: "Other people's projects and wins.",
    features: ['discover'],
  },
  {
    id: 'leaderboard', group: 'people', icon: 'podium-outline',
    label: 'Leaderboard', blurb: 'See how your points compare.',
    screens: ['Leaderboard'],
  },
  {
    id: 'organization', group: 'people', icon: 'business-outline',
    label: 'Organizations', blurb: 'Run a class, team or group.',
    features: ['organization'], widgets: ['orgSnapshot'],
  },

  // ── Extras ──
  {
    id: 'wisdom', group: 'more', icon: 'sunny-outline',
    label: 'Daily Wisdom', blurb: 'What you learned, brought back so it sticks. Plus a daily quote.',
    widgets: ['wisdom'],
  },
  {
    id: 'profiles', group: 'more', icon: 'person-add-outline',
    label: 'Extra profiles', blurb: 'More than one profile on one account.',
    screens: ['AllProfiles'],
  },
  {
    id: 'insights', group: 'more', icon: 'stats-chart-outline',
    label: 'Insights', blurb: 'Your weeks in real life: done, habits, focus. Plus game stats.',
    features: ['insights'],
  },
  {
    id: 'labs', group: 'more', icon: 'flask-outline',
    label: 'Labs', blurb: 'Unfinished extras: mentors, a feed, study buddies.',
    features: ['labs', 'mentors', 'community-feed', 'fellow-scholars'], labs: true,
  },
];

const BY_ID = Object.fromEntries(PICKABLES.map(p => [p.id, p]));
export const getPickable = (id) => BY_ID[id] || null;
export const PICKABLE_IDS = PICKABLES.map(p => p.id);

// The item that owns a catalog feature or a staged screen.
const BY_FEATURE = {};
const BY_SCREEN = {};
PICKABLES.forEach(p => {
  (p.features || []).forEach(f => { BY_FEATURE[f] = p.id; });
  (p.screens || []).forEach(s => { BY_SCREEN[s] = p.id; });
});
export const pickableForFeature = (featureId) => BY_FEATURE[featureId] || null;
export const pickableForScreen = (screen) => BY_SCREEN[screen] || null;

const clean = (ids) => (Array.isArray(ids) ? ids.filter(id => BY_ID[id]) : []);

// What a set of picks puts on the map. `typeDefaults` is the account type's
// own default dashboard (personas.defaultWidgets), which decides whether the
// type-only cards come along.
export function contributionsOf(pickIds, { typeDefaults = [] } = {}) {
  const out = { features: new Set(), screens: new Set(), widgets: [], extraWidgets: [], fab: new Set(), allGames: false, labs: false };
  const addTo = (list) => (k) => { if (!list.includes(k)) list.push(k); };
  clean(pickIds).forEach(id => {
    const p = BY_ID[id];
    (p.features || []).forEach(f => out.features.add(f));
    (p.screens || []).forEach(s => out.screens.add(s));
    (p.widgets || []).forEach(addTo(out.widgets));
    (p.extraWidgets || []).forEach(addTo(out.extraWidgets));
    (p.typeWidgets || []).filter(k => typeDefaults.includes(k)).forEach(addTo(out.extraWidgets));
    (p.fab || []).forEach(a => out.fab.add(a));
    if (p.games === 'all') out.allGames = true;
    if (p.labs) out.labs = true;
  });
  return out;
}

// Everything the unpicked items would have put on the map, for the tracks
// where unticking hides something (picks and full). A widget or quick
// action shared with a picked item stays (the Desk belongs to both the
// Inbox and Projects).
export function hiddenBy(pickIds) {
  const picked = new Set(clean(pickIds));
  const kept = contributionsOf([...picked], { typeDefaults: ALL_TYPE_WIDGETS });
  const dropped = contributionsOf(PICKABLE_IDS.filter(id => !picked.has(id)), { typeDefaults: ALL_TYPE_WIDGETS });
  return {
    features: new Set([...dropped.features].filter(f => !kept.features.has(f))),
    screens: new Set([...dropped.screens].filter(s => !kept.screens.has(s))),
    widgets: new Set([...dropped.widgets, ...dropped.extraWidgets].filter(k => !kept.widgets.includes(k) && !kept.extraWidgets.includes(k))),
    fab: new Set([...dropped.fab].filter(a => !kept.fab.has(a))),
    games: !kept.allGames,
  };
}
const ALL_TYPE_WIDGETS = PICKABLES.flatMap(p => p.typeWidgets || []);

// The picks that match what a stage-1 account already gets: what "Level up"
// starts with, and what "Just my picks" ticks for you. `opened` is
// openedAt(persona, 1, { aim, exploring }).
export function recommendedFrom(opened) {
  if (!opened) return [];
  return PICKABLES.filter(p => (
    (p.features || []).some(f => opened.features.has(f) && !ALWAYS_ON_FEATURES.includes(f))
    || (p.screens || []).some(s => opened.screens.has(s))
    // Widget-only items (Quests, Daily Wisdom) when the start puts their
    // card on Home.
    || (!p.features?.length && !p.screens?.length && [...(p.widgets || []), ...(p.extraWidgets || [])].some(k => (opened.homeWidgets || []).includes(k)))
  )).map(p => p.id);
}

// Picks for an account that never chose any (made before tracks existed,
// or switched to "Just my picks" later): everything it can see right now,
// so switching never makes anything disappear.
export function picksFromOpened(opened, { allGames = false } = {}) {
  if (!opened) return [];
  return PICKABLES.filter(p => (
    (p.features || []).some(f => opened.features.has(f))
    || (p.screens || []).some(s => opened.screens.has(s))
    || [...(p.widgets || []), ...(p.extraWidgets || [])].some(k => (opened.homeWidgets || opened.widgets || []).includes(k))
    || (p.games === 'all' && allGames)
  )).map(p => p.id);
}

// What to offer after a goal on "Just my picks": first anything the goal
// itself earned, then the next thing on this account type's path, then
// anything else. Never something already picked or turned down.
export function nextSuggestion({ picks = [], declined = [], earnedFeatures = [], pathFeatures = [], allowed = () => true }) {
  const skip = new Set([...clean(picks), ...clean(declined)]);
  const order = [
    ...earnedFeatures.map(pickableForFeature),
    ...pathFeatures.map(f => pickableForFeature(f) || pickableForScreen(f)),
    ...PICKABLE_IDS,
  ];
  return order.find(id => id && !skip.has(id) && allowed(BY_ID[id])) || null;
}

export const TRACKS = ['picks', 'auto', 'full'];
export const normalizeTrack = (t) => (TRACKS.includes(t) ? t : 'auto');
