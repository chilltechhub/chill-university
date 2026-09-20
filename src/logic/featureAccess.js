// src/logic/featureAccess.js
// Pure gate logic — no React, no Supabase, no I/O. Give it a feature and
// what the app knows about an account and it answers one question: can this
// be used right now, and if not, what are the ways in?
//
// Client-side mirror of the 20260915 wayfinder_feature_gating migration, in the same spirit
// as src/logic/allowed.js: the database is the real gate
// (unlock_feature() and record_test_attempt() re-check everything and
// raise), and this exists so the UI can say WHY something is shut and offer
// the route through, instead of letting someone tap a locked screen and
// bounce off an error. Keep the two in step — same checks, same order, same
// fail-closed default.
//
// Everything here is deterministic on its inputs, which is what makes the
// unlock sheet, the Library badges, the Compass rosters and the tests all
// agree without passing state between them.

import { getObjective, getPurpose } from '../data/objectives';
import { getTest } from '../data/competencyTests';
import { featureShownAtStage } from './experienceStage';

/* ─── Plan ────────────────────────────────────────────────────────────────── */

// Mirror of public.is_plan_active(). Anything that isn't an unexpired
// 'plus' is free — an unrecognised plan string fails closed rather than
// being treated as "probably paid".
export function planActive(profile) {
  if (!profile || profile.plan !== 'plus') return false;
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at).getTime() > Date.now();
}

export function experimentalOptedIn(profile) {
  return profile?.experimental_opt_in === true;
}

/* ─── Objective progress ──────────────────────────────────────────────────── */

// `stats` is the honest counter set the app already maintains — see
// UserProgressContext. Anything a step can auto-tick has to come from here,
// because a step that asks you to self-report a number the app is already
// counting is either busywork or an invitation to fudge it.
//   { streakDays, level, points, missionsToday, played }
export function stepSatisfied(step, checked = {}, stats = {}) {
  if (checked[step.id]) return true;
  if (!step.auto) return false;

  const { stat, value } = step.auto;
  const have = {
    streak:   stats.streakDays    || 0,
    level:    stats.level         || 0,
    points:   stats.points        || 0,
    missions: stats.missionsToday || 0,
    played:   stats.played        || 0,
  }[stat];

  return have != null && have >= value;
}

// Everything the UI needs to draw an objective: per-step state, the tally,
// and the single next step — which is the whole product promise, so it is
// computed here once rather than re-derived on each screen.
export function objectiveProgress(objectiveId, record = null, stats = {}) {
  const objective = getObjective(objectiveId);
  if (!objective) return null;

  const checked = record?.steps || {};
  const steps = objective.steps.map(step => {
    const done = stepSatisfied(step, checked, stats);
    return {
      ...step,
      done,
      // An auto step is never hand-tickable, in either direction. The
      // counter is the truth: ticking "reach a 3-day streak" on day one
      // would be lying to yourself with the app's help, and un-ticking it
      // on day three would be arguing with a number the app is already
      // keeping honestly.
      locked: !!step.auto,
    };
  });

  const done = steps.filter(s => s.done).length;
  return {
    objective,
    status: record?.status || null,
    steps,
    done,
    total: steps.length,
    // 'completed' in the record is the server's word for it; all-steps-done
    // is the client noticing before the round-trip. Either counts as done
    // for display, only the former means the unlocks have landed.
    complete: record?.status === 'completed' || done === steps.length,
    settled: record?.status === 'completed',
    active: record?.status === 'active',
    nextStep: steps.find(s => !s.done) || null,
  };
}

/* ─── The gate ────────────────────────────────────────────────────────────── */

// This is question 2 of the four in docs/access-system.md, "Which door?",
// with question 3 ("Shown now?") applied on top by evaluateAccess.
//
// ctx:
//   profile      the profiles row
//   unlocks      { [featureId]: { method, unlocked_at } }
//   attempts     { [featureId]: { passed, score, total, attempted_at } }
//   objectives   { [objectiveId]: { status, steps } }
//   stats        { streakDays, level, points, missionsToday, played }
//   settings     { educatorMode } — switches that are keys to a door
//                (a feature's `settingKey`)
//   plusOnSale   whether Plus can actually be bought yet. Until it can, a
//                Plus door is kept out of sight: there is no key for it.
//   experience   { opened, goalUnlocks } — see src/logic/experienceStage.js.
//                Only ever adds `hidden`; it never changes `available`.
//                Omitted means "show everything".
//
// Returns a single object the UI can render without asking any follow-up
// questions.
export function evaluateAccess(feature, ctx = {}) {
  const access = evaluateGate(feature, ctx);
  // A door with no key hides itself (Labs switched off, Plus not on sale),
  // whatever the stage says.
  if (!feature || !ctx.experience || access.hidden) return access;
  const shown = featureShownAtStage(feature, access, ctx.experience);
  return shown ? access : { ...access, hidden: true };
}

function evaluateGate(feature, ctx = {}) {
  const { profile, unlocks = {}, attempts = {}, objectives = {}, stats = {}, settings = {} } = ctx;

  if (!feature) {
    return {
      feature: null, gate: 'open', status: 'open', available: true,
      method: 'default', headline: '', reason: '', hidden: false,
      routes: { objectives: [], test: null, plan: false, optIn: false },
    };
  }

  const earned = unlocks[feature.id] || null;

  // An earned unlock outranks the gate it was earned against, and is never
  // taken back. Somebody who finished an objective keeps what it opened
  // even if the feature is later moved behind a plan — retroactively
  // repossessing something a person worked for is not a thing this app does.
  if (earned && earned.method !== 'plan') {
    return {
      feature,
      gate: feature.gate,
      status: 'earned',
      available: true,
      method: earned.method,
      headline: earnedHeadline(earned.method),
      reason: earnedReason(earned.method, feature),
      hidden: false,
      routes: { objectives: [], test: null, plan: false, optIn: false },
    };
  }

  if (feature.gate === 'open') {
    return {
      feature, gate: 'open', status: 'open', available: true,
      method: 'default', headline: '', reason: '', hidden: false,
      routes: { objectives: [], test: null, plan: false, optIn: false },
    };
  }

  if (feature.gate === 'paid') {
    const active = planActive(profile);
    // Plus with nothing to buy it with is a lock without a key. Nobody can
    // open it, so nobody is shown it.
    const buyable = ctx.plusOnSale === true;
    return {
      feature,
      gate: 'paid',
      status: active ? 'earned' : 'paid',
      available: active,
      method: active ? 'plan' : null,
      headline: active ? 'Included in your plan' : 'Plus',
      reason: active
        ? 'Part of your plan.'
        : feature.why || 'Part of the Plus plan.',
      hidden: !active && !buyable,
      routes: { objectives: [], test: null, plan: !active && buyable, optIn: false },
    };
  }

  if (feature.gate === 'experimental') {
    const on = experimentalOptedIn(profile);
    return {
      feature,
      gate: 'experimental',
      status: on ? 'earned' : 'experimental',
      available: on,
      method: on ? 'experimental' : null,
      headline: on ? 'Experimental' : 'Experimental',
      reason: feature.why || 'Unfinished work — switch on experimental features to try it.',
      // Kept out of ambient lists until asked for. It stays listed in the
      // Compass, which is where someone goes looking on purpose.
      hidden: !on,
      routes: { objectives: [], test: null, plan: false, optIn: !on },
    };
  }

  /* gate === 'locked' */

  // A Settings switch that is one of this door's keys (Educator Mode for the
  // Lesson Builder). It opens the door the same way an objective does, and
  // switching it off closes it again — nothing was earned, so nothing is
  // kept.
  const settingOn = !!feature.settingKey && settings[feature.settingKey] === true;
  if (settingOn) {
    return {
      feature,
      gate: feature.gate,
      status: 'earned',
      available: true,
      method: 'setting',
      headline: earnedHeadline('setting'),
      reason: earnedReason('setting', feature),
      hidden: false,
      routes: { objectives: [], test: null, plan: false, optIn: false, setting: null },
    };
  }

  const routeObjectives = (feature.unlockedBy || []).map(id => {
    const progress = objectiveProgress(id, objectives[id], stats);
    return {
      id,
      label: progress?.objective.label || id,
      promise: progress?.objective.promise || '',
      done: progress?.done || 0,
      total: progress?.total || 0,
      complete: !!progress?.complete,
      active: !!progress?.active,
      nextStep: progress?.nextStep || null,
    };
  });

  const attempt = attempts[feature.id] || null;
  const test = feature.testable ? getTest(feature.id) : null;

  return {
    feature,
    gate: 'locked',
    status: 'locked',
    available: false,
    method: null,
    headline: 'Locked',
    reason: feature.why || 'Finish the objective that opens this.',
    hidden: false,
    routes: {
      objectives: routeObjectives,
      // A failed attempt closes the test route for good — that is the whole
      // bargain, and it has to read as a closed door here, not a greyed-out
      // button someone will keep poking.
      test: test
        ? {
            title: test.title,
            intro: test.intro,
            questions: test.questions.length,
            passMark: test.passMark,
            available: !attempt,
            closed: !!attempt && !attempt.passed,
            attempt,
          }
        : null,
      plan: false,
      optIn: false,
      setting: feature.settingKey ? { key: feature.settingKey, label: SETTING_KEY_LABELS[feature.settingKey] || 'a Settings switch' } : null,
    },
  };
}

const SETTING_KEY_LABELS = {
  educatorMode: 'Educator Mode',
};

function earnedHeadline(method) {
  if (method === 'test') return 'Tested out';
  if (method === 'objective') return 'Earned';
  if (method === 'granted') return 'Granted';
  if (method === 'setting') return 'Switched on';
  if (method === 'experimental') return 'Experimental';
  return 'Unlocked';
}

function earnedReason(method, feature) {
  if (method === 'test') return `You passed the ${feature.label} check first time.`;
  if (method === 'objective') return `Opened by finishing an objective.`;
  if (method === 'granted') return 'Switched on for your account.';
  if (method === 'setting') return `Opened by ${SETTING_KEY_LABELS[feature.settingKey] || 'a switch'} in Settings.`;
  return 'Unlocked.';
}

/* ─── Personalization ─────────────────────────────────────────────────────── */

// How strongly a feature matches the one purpose the person chose. Used to
// order things, never to remove them — the app pointing at what you said you
// came for is helpful, the app deciding you may not have the rest is not.
export function purposeScore(feature, purposeKey) {
  if (!purposeKey || !feature) return 0;
  const purpose = getPurpose(purposeKey);
  let score = 0;

  if ((feature.purposes || []).includes(purposeKey)) score += 4;
  if (purpose && (purpose.leads || []).includes(feature.id)) score += 6;

  // A brand-new account should meet first steps before deep tooling,
  // whatever it came here for.
  if (feature.depth === 'first-step') score += 2;
  if (feature.depth === 'deep') score -= 1;

  return score;
}

// Sorts a feature list for one purpose without dropping anything. Available
// beats locked at equal relevance, because an ordered list whose top item
// can't be opened is a worse list.
export function rankForPurpose(features, purposeKey, ctx = {}) {
  return [...features]
    .map(f => ({ feature: f, access: evaluateAccess(f, ctx) }))
    .sort((a, b) => {
      const rel = purposeScore(b.feature, purposeKey) - purposeScore(a.feature, purposeKey);
      if (rel !== 0) return rel;
      if (a.access.available !== b.access.available) return a.access.available ? -1 : 1;
      return a.feature.label.localeCompare(b.feature.label);
    });
}

/* ─── Copy helpers ────────────────────────────────────────────────────────── */

// One place for the badge text and tone, so a lock looks the same on the
// Library grid, the Compass roster and the unlock sheet.
export const GATE_META = {
  locked:       { label: 'Locked',       icon: 'lock-closed-outline', colorKey: 'text3' },
  experimental: { label: 'Experimental', icon: 'flask-outline',       colorKey: 'purple' },
  paid:         { label: 'Plus',         icon: 'star-outline',        colorKey: 'gold' },
  earned:       { label: 'Unlocked',     icon: 'checkmark-circle',    colorKey: 'teal' },
};

export function gateMetaFor(access) {
  if (!access || access.available) {
    return access?.status === 'earned' ? GATE_META.earned : null;
  }
  return GATE_META[access.status] || GATE_META.locked;
}

// The one-line nudge under a locked item: the shortest true statement of
// what would open it.
//
// It always mentions an unspent test, including when an objective is already
// under way. Someone mid-objective is exactly the person who most wants to
// know there's a shortcut — burying it until they abandon what they're on
// would make the test a secret, and a shortcut nobody can find isn't one.
export function unlockHint(access) {
  if (!access || access.available) return '';

  if (access.status === 'paid')         return 'Included with Plus';
  if (access.status === 'experimental') return 'Turn on experimental features to try it';

  const objectives = access.routes.objectives || [];
  const test = access.routes.test;

  // Where several objectives open the same feature, naming one of them
  // arbitrarily would be a half-truth — say "an objective" instead.
  const inFlight = objectives.find(o => o.active);
  const named = inFlight
    ? `${inFlight.done}/${inFlight.total} of ${inFlight.label}`
    : objectives.length === 1
      ? `Finish ${objectives[0].label}`
      : objectives.length > 1
        ? 'Finish an objective'
        : null;

  const setting = access.routes.setting;
  if (!named && !test && setting) return `Switch on ${setting.label} in Settings`;

  if (test?.available) return named ? `${named} — or test out` : 'Test out of it';
  if (test?.closed)    return named ? `${named} — the test is spent` : 'The test is spent';

  return named || 'Locked';
}
