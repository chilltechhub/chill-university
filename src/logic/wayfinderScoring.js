// src/logic/wayfinderScoring.js
//
// Turns Wayfinder answers into a map. Pure functions, no React, no network —
// the screen, the Home widget and anything else read the same results.
//
// Three rules shape everything in here:
//
//  • What pulls you and what you've done are kept APART. Someone who spent
//    three years caring for a parent has real helping skills, but that
//    doesn't mean they want to do it for a living. The interest score comes
//    only from the activity answers; experience is a smaller, separate
//    signal, and the map draws it as its own outline.
//
//  • Every suggestion carries its reasons. A path that shows up with no
//    "because" reads like a horoscope; one that says "matches what pulls
//    you: Helping · fits: Steady money · you can earn while you learn" is
//    something a person can argue with, which is the point.
//
//  • Real life re-ranks, it never hides. If someone needs income soon, paths
//    you can earn while training for rise. A path that needs training they
//    said they can't do right now drops and says so — it doesn't vanish,
//    because "not right now" isn't "never".

import {
  THEMES, ACTIVITIES, EXPERIENCES, PATHS, PATH_MAP, ROUTE_MAP, VALUE_MAP, THEME_MAP,
} from '../data/wayfinder';
import {
  findItem, PERSONALITY_ITEMS, LEARNING_PREFS, LEARNING_BLOCKERS, LIFE_ZONE_MAP, QUALITY_MAP,
  MAX_LIFE_ZONES, MAX_QUALITIES,
} from '../data/wayfinderDeeper';
import { SITUATION_MAP, MAX_SITUATIONS } from '../data/wayfinderSituations';

const EXPERIENCE_MAP = Object.fromEntries(EXPERIENCES.map(e => [e.id, e]));

export const STATE_VERSION = 1;

export function emptyState() {
  return {
    version: STATE_VERSION,
    startedAt: null,
    updatedAt: null,
    stage: 'intro',          // intro | experiences | interests | values | map
    experiences: [],
    interests: {},           // activityId -> 0 | 1 | 2
    values: [],
    reality: { timeline: null, training: [] },
    mapReadyAt: null,
    saved: [],               // starred path ids
    experiments: [],         // see newExperiment() — work paths, life paths, and quality practices
    statement: null,         // { self, care, grow, exploring, next }

    // ── Go deeper (each optional, each finished on its own) ──
    situations: [],          // situation ids, up to MAX_SITUATIONS
    situationDone: {},       // situationId -> ['n0', 'x1', ...] checked steps
    personality: {},         // itemId -> 1..5
    learning: { prefs: [], blockers: [], doneAt: null },
    life: { zones: [], wants: {}, qualities: [], doneAt: null },
  };
}

// Forward-compatible read: whatever shape comes back from storage, the
// screen gets every field it expects.
export function normalizeState(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    experiences: Array.isArray(raw.experiences) ? raw.experiences.filter(id => EXPERIENCE_MAP[id]) : [],
    interests: raw.interests && typeof raw.interests === 'object' ? raw.interests : {},
    values: Array.isArray(raw.values) ? raw.values.filter(id => VALUE_MAP[id]) : [],
    reality: { ...base.reality, ...(raw.reality || {}) },
    saved: Array.isArray(raw.saved) ? raw.saved.filter(id => PATH_MAP[id]) : [],
    experiments: Array.isArray(raw.experiments) ? raw.experiments.filter(x => x && findItem(x.pathId)) : [],
    situations: Array.isArray(raw.situations) ? raw.situations.filter(id => SITUATION_MAP[id]).slice(0, MAX_SITUATIONS) : [],
    situationDone: raw.situationDone && typeof raw.situationDone === 'object' ? raw.situationDone : {},
    personality: raw.personality && typeof raw.personality === 'object'
      ? Object.fromEntries(Object.entries(raw.personality).filter(([k, v]) => PERSONALITY_ITEMS.some(i => i.id === k) && v >= 1 && v <= 5))
      : {},
    learning: {
      ...base.learning,
      ...(raw.learning || {}),
      prefs: (raw.learning?.prefs || []).filter(id => LEARNING_PREFS.some(p => p.id === id)),
      blockers: (raw.learning?.blockers || []).filter(id => LEARNING_BLOCKERS.some(b => b.id === id)),
    },
    life: {
      ...base.life,
      ...(raw.life || {}),
      zones: (raw.life?.zones || []).filter(id => LIFE_ZONE_MAP[id]).slice(0, MAX_LIFE_ZONES),
      wants: raw.life?.wants && typeof raw.life.wants === 'object' ? raw.life.wants : {},
      qualities: (raw.life?.qualities || []).filter(id => QUALITY_MAP[`q_${id}`]).slice(0, MAX_QUALITIES),
    },
  };
}

// ─── Interests ──────────────────────────────────────────────────────────────
// 0–100 per theme, over the questions actually answered. A theme with no
// answers is null, not 0 — "didn't get to it" isn't "not interested".
export function interestScores(interests = {}) {
  const out = {};
  THEMES.forEach(theme => {
    const answered = ACTIVITIES.filter(a => a.theme === theme.id && interests[a.id] !== undefined && interests[a.id] !== null);
    if (!answered.length) { out[theme.id] = null; return; }
    const sum = answered.reduce((acc, a) => acc + Number(interests[a.id] || 0), 0);
    out[theme.id] = Math.round((sum / (answered.length * 2)) * 100);
  });
  return out;
}

export function answeredCount(interests = {}) {
  return ACTIVITIES.filter(a => interests[a.id] !== undefined && interests[a.id] !== null).length;
}

// 0–100 per theme. Each experience touching a theme adds 34, so three is a
// full spoke — enough to register without letting one busy category of life
// flood the chart.
export function experienceScores(experienceIds = []) {
  const out = Object.fromEntries(THEMES.map(t => [t.id, 0]));
  experienceIds.forEach(id => {
    (EXPERIENCE_MAP[id]?.themes || []).forEach(themeId => {
      out[themeId] = Math.min(100, out[themeId] + 34);
    });
  });
  return out;
}

export function rankedThemes(scores) {
  return THEMES
    .map(t => ({ id: t.id, score: scores[t.id] }))
    .filter(t => t.score !== null && t.score !== undefined)
    .sort((a, b) => b.score - a.score);
}

// "Nothing jumped out" is one of the most common honest results, and the
// wrong response to it is to crown whichever theme won by four points. A
// profile is flat when the top theme is weak or barely ahead of the pack.
export function isFlatProfile(scores) {
  const ranked = rankedThemes(scores);
  if (ranked.length < 3) return true;
  const top = ranked[0].score;
  const median = ranked[Math.floor(ranked.length / 2)].score;
  return top < 45 || top - median < 15;
}

// The two (or three, if the third is close) themes that lead.
export function leadingThemes(scores) {
  const ranked = rankedThemes(scores);
  if (!ranked.length) return [];
  const lead = ranked.slice(0, 2);
  if (ranked[2] && ranked[1].score - ranked[2].score <= 5 && ranked[2].score >= 50) lead.push(ranked[2]);
  return lead.map(t => ({ ...t, theme: THEME_MAP[t.id] }));
}

// ─── Skills ─────────────────────────────────────────────────────────────────
export function skillsFromExperiences(experienceIds = []) {
  const seen = new Set();
  const out = [];
  experienceIds.forEach(id => {
    const exp = EXPERIENCE_MAP[id];
    (exp?.skills || []).forEach(skill => {
      if (seen.has(skill)) return;
      seen.add(skill);
      out.push({ skill, from: exp.label, emoji: exp.emoji });
    });
  });
  return out;
}

// ─── Experiments ────────────────────────────────────────────────────────────
export function newExperiment({ pathId, rung, text, dueDate = null, taskId = null }) {
  return {
    id: `x_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    pathId, rung, text,
    status: 'active',
    createdAt: new Date().toISOString(),
    dueDate, taskId,
    reflection: null,        // { energy: -1|0|1, curiosity: -1|0|1, note, at }
  };
}

// Sum of (energy + curiosity) over a path's reflected experiments: -2..+2 each.
export function pathSignal(experiments = [], pathId) {
  return experiments
    .filter(x => x.pathId === pathId && x.status === 'done' && x.reflection)
    .reduce((acc, x) => acc + Number(x.reflection.energy || 0) + Number(x.reflection.curiosity || 0), 0);
}

export function signalVerdict(signal, tried) {
  if (!tried) return null;
  if (signal >= 2) return { tone: 'up', label: 'Worth going further' };
  if (signal <= -2) return { tone: 'down', label: 'Probably not this — useful to know' };
  return { tone: 'mixed', label: 'Mixed so far — try another rung' };
}

// ─── Paths ──────────────────────────────────────────────────────────────────
const PAID_ROUTES = new Set(['onjob', 'apprentice']);
const FAST_ROUTES = new Set(['onjob', 'apprentice', 'cert', 'self']);

export function scorePath(path, ctx) {
  const { interest, experience, values, reality, experiments, experienceIds = [] } = ctx;
  const reasons = [];

  const [primary, secondary] = path.themes;
  const pi = interest[primary] ?? 50;
  const si = secondary ? (interest[secondary] ?? 50) : pi;
  const interestFit = pi * 0.7 + si * 0.3;
  if (interest[primary] >= 60) reasons.push({ kind: 'interest', text: `Matches what pulls you: ${THEME_MAP[primary].short}` });

  const experienceFit = (experience[primary] || 0) * 0.7 + (secondary ? (experience[secondary] || 0) * 0.3 : 0);
  if ((experience[primary] || 0) >= 34) {
    // Name what they actually did — "builds on your experience" with no
    // specifics is exactly the kind of line nobody believes. The experience,
    // not one of its skills: the link is at the theme level, and a
    // hand-picked skill ("tracking medicine" → coaching) overclaims it.
    const source = experienceIds.map(id => EXPERIENCE_MAP[id]).find(e => e?.themes.includes(primary));
    reasons.push({
      kind: 'experience',
      text: source ? `Builds on what you’ve done: ${lowerFirst(source.label)}` : 'Builds on things you’ve already done',
    });
  }

  const valueHits = path.values.filter(v => values.includes(v));
  const valuesFit = values.length ? (valueHits.length / Math.min(3, values.length)) * 100 : 50;
  if (valueHits.length) reasons.push({ kind: 'values', text: `Fits what matters: ${valueHits.map(v => VALUE_MAP[v].label).join(', ')}` });

  let score = interestFit * 0.6 + valuesFit * 0.25 + experienceFit * 0.15;

  // Real life
  let realityNote = null;
  const training = reality?.training || [];
  if (training.length) {
    const reachable = path.routes.filter(r => training.includes(r));
    if (!reachable.length) {
      score -= 18;
      realityNote = `Usually needs ${path.routes.map(r => ROUTE_MAP[r].label.toLowerCase()).join(' or ')} — not something you picked for right now.`;
    }
  }
  if (reality?.timeline === 'now') {
    if (path.routes.some(r => PAID_ROUTES.has(r))) {
      score += 8;
      reasons.push({ kind: 'reality', text: 'You can earn while you learn' });
    } else if (!path.routes.some(r => FAST_ROUTES.has(r))) {
      score -= 10;
      realityNote = realityNote || 'A longer road before it pays — worth knowing if you need income soon.';
    }
  } else if (reality?.timeline === 'year' && path.routes.some(r => FAST_ROUTES.has(r))) {
    score += 3;
  }

  // What actually happened when they tried it outweighs every guess above.
  const tried = experiments.filter(x => x.pathId === path.id && x.status === 'done').length;
  const signal = pathSignal(experiments, path.id);
  score += Math.max(-30, Math.min(30, signal * 8));
  const verdict = signalVerdict(signal, tried);
  if (verdict?.tone === 'up') reasons.unshift({ kind: 'tried', text: 'You tried it and it energized you' });

  return { path, score: Math.round(score), reasons, realityNote, tried, signal, verdict };
}

export function scoreAllPaths(state) {
  // Someone who picked "I just lost my job" needs income soon whether or
  // not they got to the timeline question. Their own answer still wins.
  const needsIncome = (state.situations || []).some(id => SITUATION_MAP[id]?.needsIncome);
  const reality = { ...(state.reality || {}) };
  if (!reality.timeline && needsIncome) reality.timeline = 'now';
  const ctx = {
    interest: interestScores(state.interests),
    experience: experienceScores(state.experiences),
    values: state.values || [],
    reality,
    experiments: state.experiments || [],
    experienceIds: state.experiences || [],
  };
  return PATHS.map(p => scorePath(p, ctx)).sort((a, b) => b.score - a.score);
}

// What the map shows under "Paths worth testing".
//
// Normal profile: the best few, at most two per main theme so one strong
// theme can't fill the whole list with near-duplicates.
// Flat profile: a sampler — the best path from each of the top themes,
// because when nothing stands out the useful move is to try different kinds
// of things, not more of the same kind.
//
// Paths the person tried and didn't like come back separately, so they
// stay visible as a result instead of silently disappearing.
export function suggestPaths(state, { limit = 5 } = {}) {
  const scored = scoreAllPaths(state);
  const ruledOut = scored.filter(r => r.verdict?.tone === 'down');
  const pool = scored.filter(r => r.verdict?.tone !== 'down');
  const flat = isFlatProfile(interestScores(state.interests));

  const perTheme = {};
  const picks = [];
  const cap = flat ? 1 : 2;
  for (const r of pool) {
    const t = r.path.themes[0];
    if ((perTheme[t] || 0) >= cap) continue;
    perTheme[t] = (perTheme[t] || 0) + 1;
    picks.push(r);
    if (picks.length >= (flat ? 6 : limit)) break;
  }

  // Starred paths always show, even if they've slipped down the ranking.
  (state.saved || []).forEach(id => {
    if (picks.some(r => r.path.id === id) || ruledOut.some(r => r.path.id === id)) return;
    const r = scored.find(x => x.path.id === id);
    if (r) picks.push(r);
  });

  return { picks, ruledOut, flat, all: scored };
}

// ─── Statement suggestions ──────────────────────────────────────────────────
// Starting text for each "Who I'm becoming" stem, drawn from the map. Always
// editable — these are drafts, not a description handed down.
export function statementSuggestions(state) {
  const leading = leadingThemes(interestScores(state.interests));
  const { picks } = suggestPaths(state);
  const active = (state.experiments || []).find(x => x.status === 'active');

  // One skill from each of the first few experiences, not three from the
  // first — "handling money, staying calm, working fast" is one job
  // described three ways; the point is the range.
  const self = (state.experiences || [])
    .map(id => EXPERIENCE_MAP[id]?.skills?.[0])
    .filter(Boolean)
    .slice(0, 3)
    .map(lowerFirst);

  // An experiment in progress is the obvious next step. Without one, the
  // Talk rung on the top path — it's the one people skip and the one that
  // tells them the most.
  let next = '';
  if (active) {
    next = lowerFirst(active.text.split(/(?<=\.)\s/)[0]).replace(/\.$/, '');
  } else if (picks[0]) {
    const top = picks[0].path;
    const talked = (state.experiments || []).some(x => x.pathId === top.id && x.rung === 'talk' && x.status === 'done');
    next = talked ? `getting real time around the work of ${top.role}` : `talking to ${top.role}`;
  }

  const care = (state.values || []).slice(0, 3).map(v => lowerFirst(VALUE_MAP[v].label));
  const exploring = picks.slice(0, 2).map(r => r.path.role);

  const grow = (state.life?.qualities || []).map(id => QUALITY_MAP[`q_${id}`]?.label.toLowerCase()).filter(Boolean);

  return {
    self: self.length ? `is good at ${listJoin(self)}` : '',
    care: listJoin(care),
    grow: listJoin(grow),
    exploring: exploring.length
      ? `becoming ${listJoin(exploring, 'or')}`
      : listJoin(leading.map(t => lowerFirst(t.theme.label))),
    next,
  };
}

// "HVAC technician" stays "HVAC", "Steady money" becomes "steady money".
function lowerFirst(str) {
  if (!str) return '';
  if (str.length > 1 && str[1] === str[1].toUpperCase() && str[1] !== str[1].toLowerCase()) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function listJoin(items, conj = 'and') {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conj} ${items[items.length - 1]}`;
}

export function composeStatement(statement) {
  if (!statement) return '';
  const parts = [
    statement.self && `I’m someone who ${statement.self}.`,
    statement.care && `What matters to me is ${statement.care}.`,
    statement.grow && `I’m working on being more ${statement.grow}.`,
    statement.exploring && `Right now I’m exploring ${statement.exploring}.`,
    statement.next && `My next small step is ${statement.next}.`,
  ].filter(Boolean);
  return parts.join(' ');
}

// How far along the three question steps someone is — for the widget and
// the resume prompt.
export function progressOf(state) {
  const steps = [
    state.experiences.length > 0 || ['interests', 'values', 'map'].includes(state.stage),
    answeredCount(state.interests) >= ACTIVITIES.length || ['values', 'map'].includes(state.stage),
    !!state.mapReadyAt,
  ];
  return { done: steps.filter(Boolean).length, total: steps.length, hasMap: !!state.mapReadyAt };
}
