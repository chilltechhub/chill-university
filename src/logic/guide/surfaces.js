// src/logic/guide/surfaces.js
// The places the guide talks about (docs/shake-up-plan-2026-10-21.md §7.1).
// Mentor notes, "About this page" and the seen-set are keyed by surface, not
// by route: Today's Day, Week and Month are one route with three surfaces,
// and You is one route holding two (you, you.room).
//
//   routes  where the surface shows. Every one must be a registered route or
//           alias (scripts/check-tour-spots.mjs).
//   before  it existed before the shake-up, so an account that predates it
//           has already been taught it and is seeded as seen.
//
// No imports, so the check script can run it.

export const SURFACES = [
  { id: 'today.day',   routes: ['Home', 'PlannerScreen'], before: true },
  { id: 'today.week',  routes: ['PlannerScreen'],         before: true },
  { id: 'today.month', routes: ['PlannerScreen'],         before: true },
  { id: 'today.calm',  routes: ['Home'],                  before: true },
  { id: 'learn.path',  routes: ['Training', 'Compass', 'PathScreen'], before: true },
  // Units are new in P6: everyone gets this one once.
  { id: 'learn.unit',  routes: ['UnitScreen'],            before: false },
  { id: 'learn.finds', routes: ['KnowledgeScreen'],       before: true },
  { id: 'make.board',  routes: ['LibraryScreen', 'StudioScreen', 'ProjectsScreen'], before: true },
  { id: 'make.saved',  routes: ['KnowledgeScreen', 'CaptureInbox'], before: true },
  { id: 'you',         routes: ['Profile', 'You'],        before: true },
  { id: 'you.room',    routes: ['Profile', 'You'],        before: true },
];

export const SURFACE_IDS = SURFACES.map(s => s.id);

/**
 * The surface a screen is, as shown right now.
 *   route   the route name (appRoutes routeLabel)
 *   params  its params: KnowledgeScreen opened on Discover is Learn's Finds
 *   calm    Today in Calm
 *   view    Today's view: 'Daily' | 'Weekly' | 'Monthly'
 * Returns a surface id, or null for a screen the guide has nothing to say
 * about on its own (Settings, a game, a life area...).
 */
export function surfaceForRoute(route, { params = null, calm = false, view = 'Daily' } = {}) {
  if (route === 'Home' || route === 'PlannerScreen') {
    if (view === 'Weekly') return 'today.week';
    if (view === 'Monthly') return 'today.month';
    return calm && route === 'Home' ? 'today.calm' : 'today.day';
  }
  if (route === 'KnowledgeScreen') return params?.initialTab === 'discover' ? 'learn.finds' : 'make.saved';
  if (route === 'You' || route === 'Profile') return 'you';
  const hit = SURFACES.find(s => s.routes.includes(route));
  return hit ? hit.id : null;
}

// The old per-route seen-set (@cth_screen_tutorials_seen_<uid>) read into
// surfaces: a route whose screen tutorial someone has seen marks every
// surface that tutorial covered. Routes not listed taught nothing the new
// guide repeats.
export const ROUTE_TO_SURFACE = {
  Home:            ['today.day', 'today.calm'],
  PlannerScreen:   ['today.day', 'today.week', 'today.month'],
  Training:        ['learn.path'],
  Compass:         ['learn.path'],
  LibraryScreen:   ['learn.finds', 'make.board'],
  StudioScreen:    ['make.board'],
  ProjectsScreen:  ['make.board'],
  KnowledgeScreen: ['make.saved'],
  CaptureInbox:    ['make.saved'],
  Profile:         ['you', 'you.room'],
};

/**
 * The guide's seen-set for someone moving to v2, as surface ids in SURFACES
 * order. `oldSeen` is the route names from the old set. An existing account
 * has every surface that existed before marked seen as well, so nobody is
 * re-taught a page they already know, on any device.
 */
export function seedGuideSeen(oldSeen, { existingAccount = false } = {}) {
  const seen = new Set();
  (oldSeen || []).forEach(route => (ROUTE_TO_SURFACE[route] || []).forEach(id => seen.add(id)));
  if (existingAccount) SURFACES.forEach(s => { if (s.before) seen.add(s.id); });
  return SURFACE_IDS.filter(id => seen.has(id));
}
