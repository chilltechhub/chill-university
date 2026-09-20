// src/logic/experienceStage.js
// Pure stage logic — no React, no storage. Given what the app knows about an
// account, answers "which stage is this?" and "is this thing on the map?".
// See src/data/experienceStages.js for the paths and docs/access-system.md
// for where this sits among the four questions.
//
// AccessContext is the only caller that holds state; everything else asks it
// (isScreenVisible, isGameVisible, can(...)) so every surface agrees.

import { PATHS, MAX_STAGE, EXPLORING_WIDGET, STAGED_SCREENS, FIRST_GOALS } from '../data/experienceStages';

// 'auto' grows with progress. 'full' is "show me everything", picked in
// onboarding or Settings. Anything else reads as auto.
export const EXPERIENCE_MODES = ['auto', 'full'];

// One point per finished goal and one per level gained. Each point opens
// one stage, so the app opens a little at a time instead of in two big
// jumps. Goals are the intended route; levels are there so somebody who
// mostly plays games isn't held back by a checklist they never opened.
export function progressPoints({ completedObjectives = 0, level = 1 } = {}) {
  return Math.max(0, completedObjectives) + Math.max(0, (level || 1) - 1);
}

export function stageFromProgress(progress = {}) {
  return Math.min(MAX_STAGE, 1 + progressPoints(progress));
}

export function resolveStage({ derived = 1, mode = 'auto' } = {}) {
  return mode === 'full' ? MAX_STAGE : derived;
}

export function pathFor(persona) {
  return PATHS[persona] || PATHS.PERSONAL;
}

export function firstGoalFor(persona) {
  return FIRST_GOALS[persona] || FIRST_GOALS.PERSONAL;
}

export function stageMeta(n, persona) {
  const path = pathFor(persona);
  return { n, ...(path[n - 1] || path[0]) };
}

// What the next stage is and what it takes, phrased for a person. Null at
// the top.
export function nextStageNeeds({ stage, persona }) {
  if (stage >= MAX_STAGE) return null;
  const next = pathFor(persona)[stage];
  return {
    next: stage + 1,
    label: next.label,
    blurb: next.blurb,
    text: 'Finish a goal or gain a level',
  };
}

// Everything the path has opened up to `stage`, flattened. Memoise it per
// (persona, stage) — every visibility check reads it.
export function openedAt(persona, stage = MAX_STAGE, { exploring = false } = {}) {
  const reached = pathFor(persona).slice(0, Math.max(1, stage));
  const out = {
    features: new Set(),
    screens: new Set(),
    widgets: [],
    games: new Set(),
    fab: new Set(),
    caps: new Set(),
  };
  reached.forEach(step => {
    (step.features || []).forEach(id => out.features.add(id));
    (step.screens || []).forEach(id => out.screens.add(id));
    (step.games || []).forEach(id => out.games.add(id));
    (step.fab || []).forEach(id => out.fab.add(id));
    (step.caps || []).forEach(id => out.caps.add(id));
    (step.widgets || []).forEach(id => { if (!out.widgets.includes(id)) out.widgets.push(id); });
  });
  if (exploring) {
    out.screens.add('WayfinderScreen');
    const rest = out.widgets.filter(k => k !== EXPLORING_WIDGET);
    const at = Math.min(2, rest.length);
    out.widgets = [...rest.slice(0, at), EXPLORING_WIDGET, ...rest.slice(at)];
  }
  return out;
}

/* ─── Visibility ──────────────────────────────────────────────────────────── */

// A feature's place on the map, given the door evaluateAccess already worked
// out for it. Separate from `available` on purpose: hiding an entry point
// never shuts the door.
//
//   earned              always shown — nothing somebody worked for disappears
//   opened by the goal  always shown — the goal you're on says what it opens
//   open door           once a stage lists it, or from 'all-tools'
//   any other door      from 'doors'
export function featureShownAtStage(feature, access, { opened, goalUnlocks } = {}) {
  if (!feature || !opened) return true;
  if (access?.status === 'earned' && access.gate !== 'experimental') return true;
  if (goalUnlocks?.has(feature.id)) return true;
  if (feature.gate === 'open') {
    return opened.caps.has('all-tools') || opened.features.has(feature.id);
  }
  return opened.caps.has('doors');
}

// Routes outside the catalog. `featureShown(id)` answers for an alias.
export function screenShownAtStage(screen, { opened, featureShown } = {}) {
  const rule = STAGED_SCREENS[screen];
  if (rule === undefined || !opened) return true;
  if (typeof rule === 'string') return featureShown ? featureShown(rule) : true;
  return opened.caps.has('all-tools') || opened.screens.has(screen);
}

// Null means "every game" — callers skip the filter rather than building a
// set of all thirty-two.
export function visibleGameIdsFor(opened) {
  if (!opened || opened.caps.has('all-games')) return null;
  return opened.games;
}

// Null means "every action".
export function fabActionsFor(opened) {
  if (!opened || opened.caps.has('dashboard')) return null;
  return opened.fab;
}

// Home before the 'dashboard' stage: the widgets the path has opened, in the
// order it opened them, everything else hidden. Never persisted — it's
// derived, like the persona default.
export function starterWidgetLayout(opened, allKeys) {
  const known = new Set(allKeys);
  const visible = (opened?.widgets || []).filter(k => known.has(k));
  const shown = new Set(visible);
  return [
    ...visible.map(key => ({ key, hidden: false })),
    ...allKeys.filter(k => !shown.has(k)).map(key => ({ key, hidden: true })),
  ];
}

// The stages crossed going from `from` to `to`, for the "new in your app"
// notice.
export function stagesBetween(persona, from, to) {
  return pathFor(persona).slice(from, to).map((step, i) => ({ n: from + i + 1, ...step }));
}

// Screens whose tutorial should run again after crossing these stages.
export function reteachBetween(persona, from, to) {
  return [...new Set(stagesBetween(persona, from, to).flatMap(step => step.reteach || []))];
}
