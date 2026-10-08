// src/logic/experienceStage.js
// Pure stage logic — no React, no storage. Given what the app knows about an
// account, answers "which stage is this?" and "is this thing on the map?".
// See src/data/experienceStages.js for the paths and docs/access-system.md
// for where this sits among the four questions.
//
// AccessContext is the only caller that holds state; everything else asks it
// (isScreenVisible, isGameVisible, can(...)) so every surface agrees.

import { PATHS, MAX_STAGE, EXPLORING_WIDGET, STAGED_SCREENS, FIRST_GOALS, AIM_OPENS, CORE_OPENS } from '../data/experienceStages';
import { getPurpose, getObjective } from '../data/objectives';
import { getFeature } from '../data/featureCatalog';

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

// The first goal goes by what the person came for when they've said (the
// purpose's `firstGoal`), and by account type otherwise.
export function firstGoalFor(persona, purposeKey = null) {
  const byAim = getPurpose(purposeKey)?.firstGoal;
  if (byAim && getObjective(byAim)) return { objective: byAim, purpose: purposeKey };
  return FIRST_GOALS[persona] || FIRST_GOALS.PERSONAL;
}

export function stageMeta(n, persona) {
  const path = pathFor(persona);
  return { n, ...(path[n - 1] || path[0]) };
}

// What the next stage is and what it takes, phrased for a person. Null at
// the top.
//
// Named by what it actually brings. What someone came for opens tools early
// (AIM_OPENS), so the stage's own name can be a tool they've had since day
// one: "Get my days in order" opens the Capture Inbox, and Home then said
// "Next unlock: The Capture Inbox" right above a goal step that used it.
// Same rule as the unlock card when the stage arrives (UnlockNotification).
export function nextStageNeeds({ stage, persona, aim = null, exploring = false }) {
  if (stage >= MAX_STAGE) return null;
  const next = pathFor(persona)[stage];
  const base = { next: stage + 1, label: next.label, blurb: next.blurb, text: 'Finish a goal or gain a level' };
  // No early return without an aim any more: CORE_OPENS opens the Planner
  // for everyone, so a stage named "The Planner and Life Areas" can be half
  // old news for any account.
  const before = openedAt(persona, stage, { exploring, aim });
  const after = openedAt(persona, stage + 1, { exploring, aim });
  const features = [...after.features].filter(id => !before.features.has(id));
  const games = [...after.games].filter(id => !before.games.has(id));
  const caps = [...after.caps].filter(id => !before.caps.has(id));
  const widgets = after.homeWidgets.filter(k => !before.homeWidgets.includes(k));
  const isNews = (next.features || []).some(id => features.includes(id))
    || (next.games || []).some(id => games.includes(id))
    || (next.caps || []).some(id => caps.includes(id))
    // A stage that opens only cards is named for its lead one ("The
    // Wayfinder on Home").
    || (!next.features?.length && !next.games?.length && !next.caps?.length
      && (next.widgets || []).slice(0, 1).some(k => widgets.includes(k)));
  // News, but partly not: name only the stage's tools that are new.
  const stale = (next.features || []).some(id => before.features.has(id));
  if (isNews && stale && features.length) {
    const fresh = features.map(getFeature).filter(Boolean);
    if (fresh.length) return { ...base, label: fresh.map(f => f.label).join(' and '), blurb: fresh.length === 1 ? fresh[0].blurb : base.blurb };
  }
  if (isNews) return base;
  const feature = features.map(getFeature).find(Boolean);
  if (feature) return { ...base, label: feature.label, blurb: feature.blurb };
  if (games.length) return { ...base, label: `${games.length} new game${games.length === 1 ? '' : 's'} in Training`, blurb: null };
  if (widgets.length) return { ...base, label: `${widgets.length} new card${widgets.length === 1 ? '' : 's'} on Home`, blurb: null };
  return base;
}

// Everything the path has opened up to `stage`, flattened. Memoise it per
// (persona, stage, aim) — every visibility check reads it.
//
// `aim` is the purpose key someone answered "What did you come here for?"
// with. What it opens (AIM_OPENS) joins stage 1, and its widgets go first
// after the lead cards: the thing they came for comes before the rest.
export function openedAt(persona, stage = MAX_STAGE, { exploring = false, aim = null } = {}) {
  const extra = AIM_OPENS[aim];
  const reached = pathFor(persona).slice(0, Math.max(1, stage));
  if (extra) reached.unshift({ ...extra });
  const out = {
    features: new Set(),
    screens: new Set(),
    widgets: [],
    games: new Set(),
    fab: new Set(),
    caps: new Set(),
  };
  (CORE_OPENS.features || []).forEach(id => out.features.add(id));
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
  // Each stage from 2 on leads with one widget of its own (the one its
  // label promises, like the Quests card); `reached` has the aim's
  // openings in front when there is an aim, so the path's stages start
  // one further along.
  const pathStages = extra ? reached.slice(1) : reached;
  const headlines = pathStages.slice(1).map(st => (st.widgets || [])[0]).filter(Boolean);
  // What someone came for shows on Home from the first day: a builder's
  // projects, a learner's classes, a habit-keeper's rings.
  if (extra?.widgets?.[0]) headlines.unshift(extra.widgets[0]);
  out.homeWidgets = homeWidgetsAt(out.widgets, stage, headlines);
  return out;
}

// What Home actually shows before the 'dashboard' stage. The stages open
// widgets faster than anyone can take them in (stage 1 alone used to put
// six on a brand-new Home), so Home starts with the three cards that say
// who you are, what to do and what's next, and takes on the rest a couple
// per stage, in the order they opened: what you came for first. Each one
// that arrives gets pointed at and explained on Home (HomeScreen's
// "new on Home" note), so two is about as many as is worth reading.
// 'desk' and 'activities' since 2026-10-07: the next thing to pick up and
// what is on today are the core loop, not a reward for reaching a stage.
// A builder's first project used to be nowhere on Home.
export const HOME_BASICS = ['hq', 'compass', 'goalSteps', 'stageSteps', 'desk', 'activities'];
export const WIDGETS_PER_STAGE = 2;

// `headlines` is each reached stage's own lead widget: it arrives with its
// stage, so a stage that says "your first quest" has the Quests card. The
// rest (what the aim and stage 1 opened, then the other stage widgets) fill
// the remaining room in the order they opened.
export function homeWidgetsAt(openedWidgets = [], stage = 1, headlines = []) {
  const heads = [...new Set(headlines)].filter(k => !HOME_BASICS.includes(k));
  const queue = openedWidgets.filter(k => !HOME_BASICS.includes(k) && !heads.includes(k));
  const room = Math.max(0, (stage - 1) * WIDGETS_PER_STAGE - heads.length);
  const shown = new Set([...heads, ...queue.slice(0, room)]);
  // In the order they opened, so Home doesn't reshuffle as more arrive.
  return [...HOME_BASICS, ...openedWidgets.filter(k => shown.has(k))];
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
// Whatever else a stage has opened, Home opens with the same four, in the
// same order as every persona default (see defaultWidgets in
// src/data/personas.js — the two have to agree, or the dashboard silently
// rearranges itself the day the 'dashboard' stage arrives): who you are,
// today's focus, the goal in flight, then where you are in the app and the
// next action. The goal comes before the stage card: on a new account the
// stage card used to push the one thing to do now below the fold.
const LEAD_WIDGETS = ['hq', 'focus', 'compass', 'goalSteps', 'stageSteps', 'desk', 'activities'];

export function starterWidgetLayout(opened, allKeys) {
  const known = new Set(allKeys);
  const opens = (opened?.homeWidgets || opened?.widgets || []).filter(k => known.has(k));
  const visible = [...LEAD_WIDGETS.filter(k => opens.includes(k)), ...opens.filter(k => !LEAD_WIDGETS.includes(k))];
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
