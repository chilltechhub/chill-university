// src/logic/experienceStage.js
// Pure stage logic — no React, no storage. Given what the app knows about an
// account, answers "which stage is this?" and "is this thing shown at it?".
// See src/data/experienceStages.js for what the stages are and why.
//
// AccessContext is the only caller that holds state; everything else asks it
// (isScreenVisible, isGameVisible, ...) so every surface agrees.

import {
  STAGE_RULES, MAX_STAGE, STAGES, STARTER_PLANS, EXPLORING_WIDGETS, STAGED_SCREENS, STAGE_OPENS,
} from '../data/experienceStages';

// 'auto' grows with progress. 'full' is "show me everything", picked in
// onboarding or Settings. Anything else reads as auto.
export const EXPERIENCE_MODES = ['auto', 'full'];

export function stageFromProgress({ completedObjectives = 0, level = 1 } = {}) {
  let stage = 1;
  for (let n = 2; n <= MAX_STAGE; n++) {
    const rule = STAGE_RULES[n];
    if (completedObjectives >= rule.objectives || level >= rule.level) stage = n;
  }
  return stage;
}

export function resolveStage({ derived = 1, mode = 'auto' } = {}) {
  return mode === 'full' ? MAX_STAGE : derived;
}

export function stageMeta(n) {
  return STAGES.find(s => s.n === n) || STAGES[0];
}

// What the next stage needs, phrased for a person. Null at the top.
export function nextStageNeeds({ stage, completedObjectives = 0, level = 1 }) {
  const next = stage + 1;
  const rule = STAGE_RULES[next];
  if (!rule) return null;
  const goalsLeft = Math.max(0, rule.objectives - completedObjectives);
  return {
    next,
    goalsLeft,
    level: rule.level,
    text: `Finish ${goalsLeft} more goal${goalsLeft === 1 ? '' : 's'}, or reach level ${rule.level}`,
  };
}

export function starterPlanFor(persona) {
  return STARTER_PLANS[persona] || STARTER_PLANS.PERSONAL;
}

/* ─── Visibility ──────────────────────────────────────────────────────────── */

// A feature's visibility at a stage, given the access evaluateAccess already
// worked out for it. Separate from `available` on purpose: hiding an entry
// point never shuts the door.
//
//   earned           always shown — nothing somebody worked for disappears
//   open             stage 1 only if the type's plan lists it; stage 2+ yes
//   locked / Plus    stage 3 only
//   experimental     stage 3, and only once opted in (evaluateAccess's own rule)
export function featureShownAtStage(feature, access, { stage = MAX_STAGE, persona } = {}) {
  if (!feature) return true;
  if (access?.status === 'earned' && access.gate !== 'experimental') return true;
  if (feature.gate === 'open') {
    if (stage >= 2) return true;
    return starterPlanFor(persona).features.includes(feature.id);
  }
  return stage >= MAX_STAGE;
}

// Routes outside the catalog. `featureShown(id)` answers for an alias.
export function screenShownAtStage(screen, { stage = MAX_STAGE, persona, featureShown } = {}) {
  const rule = STAGED_SCREENS[screen];
  if (rule === undefined) return true;
  if (typeof rule === 'string') return featureShown ? featureShown(rule) : true;
  if (stage >= rule) return true;
  return starterPlanFor(persona).screens.includes(screen);
}

// Null means "every game" — callers skip the filter rather than building a
// set of all thirty-two.
export function visibleGameIdsFor({ stage = MAX_STAGE, persona } = {}) {
  if (stage >= 2) return null;
  return new Set(starterPlanFor(persona).games);
}

// Null means "every action".
export function fabActionsFor({ stage = MAX_STAGE, persona } = {}) {
  if (stage >= 2) return null;
  return new Set(starterPlanFor(persona).fab);
}

// Stage 1's fixed dashboard: the plan's three widgets, everything else
// hidden. Never persisted — it's derived, like the persona default.
export function starterWidgetLayout(persona, allKeys, { exploring = false } = {}) {
  const wanted = exploring ? EXPLORING_WIDGETS : starterPlanFor(persona).widgets;
  const known = new Set(allKeys);
  const visible = wanted.filter(k => known.has(k));
  const shown = new Set(visible);
  return [
    ...visible.map(key => ({ key, hidden: false })),
    ...allKeys.filter(k => !shown.has(k)).map(key => ({ key, hidden: true })),
  ];
}

export function stageOpens(n) {
  return STAGE_OPENS[n] || [];
}
