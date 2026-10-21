// src/logic/guide/surfaces.js
// The places the guide talks about (docs/shake-up-plan-2026-10-21.md §7.1).
// Mentor notes, "About this page" and the seen-set are keyed by surface, not
// by route: Today's Day, Week and Month are one route with three surfaces,
// and You will be one route holding two (you, you.room).
//
//   routes  where the surface shows today. Every one must be a registered
//           route or alias (scripts/check-tour-spots.mjs); later phases add
//           the new routes as they land (You, PathScreen...).
//   before  it existed before the shake-up, so an account that predates it
//           has already been taught it and is seeded as seen.
//
// Nothing reads this yet: the guide (useGuide) is wired in P7. P0 only has
// the seen-set seed below. No imports, so the check script can run it.

export const SURFACES = [
  { id: 'today.day',   routes: ['Home', 'PlannerScreen'], before: true },
  { id: 'today.week',  routes: ['PlannerScreen'],         before: true },
  { id: 'today.month', routes: ['PlannerScreen'],         before: true },
  { id: 'today.calm',  routes: ['Home'],                  before: true },
  { id: 'learn.path',  routes: ['Training', 'Compass'],   before: true },
  // Units are new in P6; no route has them yet.
  { id: 'learn.unit',  routes: [],                        before: false },
  { id: 'learn.finds', routes: ['LibraryScreen'],         before: true },
  { id: 'make.board',  routes: ['LibraryScreen', 'StudioScreen', 'ProjectsScreen'], before: true },
  { id: 'make.saved',  routes: ['KnowledgeScreen', 'CaptureInbox'], before: true },
  { id: 'you',         routes: ['Profile'],               before: true },
  { id: 'you.room',    routes: ['Profile'],               before: true },
];

export const SURFACE_IDS = SURFACES.map(s => s.id);

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
