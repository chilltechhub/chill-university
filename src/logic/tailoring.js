// src/logic/tailoring.js
// What someone sees, from where they start and which path they're on
// (docs/shake-up-plan-2026-10-21.md §8). One function, so Today, Calm,
// Learn, Make, the + button and the guide can't disagree about it.
//
// In:  { startPoint, shakiest, pathKey, isMinor, roomPlace, buildKind }
//      isMinor comes from the signup birth date; unknown (a guest) counts
//      as under 18 for content.
// Out: the suggested path, Today's default widgets, Calm tiles, Learn
//      shelves, Make kinds, + actions first, tools, mentor notes, the
//      starting point's words, the derived account type and the purpose a
//      new account starts with.
//
// Read by the welcome (its "Want to start here?" card) and by signup's
// finish(), which sets the account type, purpose and first goal from it.
// Pure: it imports only plain data and derivePersona, which import
// nothing, so scripts/check-tailoring.mjs can run it.

import {
  PATH_KITS, SUGGESTED_PATH, START_POINT_KITS, DEFAULT_PATH, CORE_TODAY, MAX_PATH_WIDGETS,
  WELCOME_GOALS, WELCOME_INTERESTS, WELCOME_PROJECTS, START_POINTS,
} from '../data/pathKits';
import { derivePersona } from './derivePersona';

const knownStart = (k) => (Object.hasOwn(SUGGESTED_PATH, k) ? k : 'unsure');
// "Love / not sure" share a column in §8.1.
const knownShakiest = (k) => (Object.hasOwn(SUGGESTED_PATH.unsure, k) ? k : 'love');

/** §8.1: { pathKey, then }. `then` is the path after a Ground fix, else null. */
export function suggestPath(startPoint, shakiest) {
  const row = SUGGESTED_PATH[knownStart(startPoint)];
  const s = knownShakiest(shakiest);
  if (s === 'ground') return { pathKey: 'ground', then: row.ground };
  return { pathKey: row[s] || DEFAULT_PATH, then: null };
}

// The welcome's "What brings you here today?" → a path. A goal's path can
// depend on where they are in life (making something to show is a career
// move at work, a sampler in school).
export function goalPath(goalKey, startPoint) {
  const goal = WELCOME_GOALS.find(g => g.key === goalKey);
  if (!goal) return null;
  if (typeof goal.path === 'string') return goal.path;
  return goal.path[knownStart(startPoint)] || goal.path.default;
}

const goalOf = (key) => WELCOME_GOALS.find(g => g.key === key) || null;
const interestOf = (key) => WELCOME_INTERESTS.find(i => i.key === key) || null;
const PROJECT_KINDS = WELCOME_PROJECTS.map(p => p.kind);
// A little lean by stage: money for people earning, the launchpad for
// people building their own thing, logic for students.
const STAGE_LEAN = { working: { money: 1 }, creator: { launch: 1, money: 1 }, highSchool: { logic: 1 }, college: { logic: 1, math: 1 } };

/**
 * The welcome's recommendation (the founder's step 5: "recommended project
 * to start, or here's the other options").
 *   pathKey  the one they chose, else the first goal they picked, else §8.1
 *   kind     the project with the most picks pointing at it; the first
 *            pick counts most. The portfolio (the founder's flagship) wins
 *            a tie.
 *   others   every other project from the founder's sites, best first
 *   reasons  the labels of the picks that pointed at `kind`
 */
export function welcomePlan({ goals = [], interests = [], startPoint, pathKey } = {}) {
  const start = knownStart(startPoint);
  const picks = { goals: (goals || []).filter(goalOf), interests: (interests || []).filter(interestOf) };
  const fromGoal = picks.goals.map(g => goalPath(g, start)).find(Boolean);
  const path = Object.hasOwn(PATH_KITS, pathKey) ? pathKey : (fromGoal || suggestPath(start).pathKey);

  const score = Object.fromEntries(PROJECT_KINDS.map(k => [k, 0]));
  const why = Object.fromEntries(PROJECT_KINDS.map(k => [k, []]));
  const add = (kind, n, label) => { if (kind in score) { score[kind] += n; if (label && !why[kind].includes(label)) why[kind].push(label); } };
  // What they came for outweighs what interests them: asking for a
  // portfolio gets the portfolio.
  picks.goals.forEach((g, i) => add(goalOf(g).kind, i === 0 ? 4 : 3, goalOf(g).label));
  picks.interests.forEach((k, i) => interestOf(k).kinds.forEach(kind => add(kind, i === 0 ? 3 : 2, interestOf(k).label)));
  Object.entries(STAGE_LEAN[start] || {}).forEach(([kind, n]) => add(kind, n));
  score.page += 0.5;

  const ranked = [...PROJECT_KINDS].sort((x, y) => score[y] - score[x]);
  return { pathKey: path, kind: ranked[0], others: ranked.slice(1), reasons: why[ranked[0]] };
}

/**
 * The portfolio the welcome starts them with (the founder's
 * launchBuilderWorkspace): their interests become the skill badges, their
 * stage the "Current phase" card and the headline. Nothing about them is
 * made up: the two project cards are this page and a prompt for the next.
 * Returns { answers, content } for newBuild('page', …).
 */
export function portfolioStart({ firstName, startPoint, interests = [] } = {}) {
  const stage = (START_POINTS.find(p => p.key === knownStart(startPoint)) || START_POINTS.find(p => p.key === 'unsure')).portfolio;
  const picked = (interests || []).map(interestOf).filter(Boolean);
  const role = picked[0]?.role;
  return {
    answers: { name: firstName || '', line: role ? `${stage.title} & ${role}` : stage.title },
    content: {
      bio: 'Learning by building, one real project at a time.',
      cta: 'View My Projects',
      quote: 'It is not enough to have a good mind; the main thing is to use it well.',
      skills: picked.map(i => i.skill),
      projects: [
        { title: 'This portfolio', desc: 'Designed, customized and exported by me, with Deskartes.', tag: 'Web' },
        { title: 'Next project', desc: 'What I’m building next. Coming soon.', tag: 'In progress' },
      ],
      stage,
    },
  };
}

export function tailor({ startPoint, shakiest, pathKey, isMinor, roomPlace, buildKind } = {}) {
  const start = knownStart(startPoint);
  const suggested = suggestPath(start, shakiest);
  const path = Object.hasOwn(PATH_KITS, pathKey) ? pathKey : suggested.pathKey;
  const kit = PATH_KITS[path];
  const startKit = START_POINT_KITS[start];
  const then = path === 'ground' ? (suggested.then || DEFAULT_PATH) : null;

  // nextStep, yourDay, find, then the path's own (no repeats, at most 4).
  // The room only when it's placed on Today (§5.2).
  const own = kit.widgets
    .filter(k => !CORE_TODAY.includes(k))
    .filter(k => k !== 'room' || roomPlace === 'today')
    .slice(0, MAX_PATH_WIDGETS);

  const minor = isMinor !== false;
  return {
    startPoint: start,
    shakiest: knownShakiest(shakiest),
    pathKey: path,
    suggested,
    then,
    // GED units go first on What's next for a GED start (§4.2), including
    // the What's next that follows a Ground fix.
    overlay: startKit.overlay && (path === 'next' || then === 'next') ? startKit.overlay : null,
    persona: derivePersona({ startPoint: start, buildKind }),
    // The purpose a new account starts with (objectives.js), until P6.
    purpose: kit.purpose,
    minor,
    // Share links are 18+ (allowed.js: minors can't publish). Export only.
    canShareLinks: !minor,
    todayWidgets: [...CORE_TODAY, ...own],
    calmTiles: [...kit.calmTiles],
    learnShelves: startKit.classesFirst
      ? ['classes', ...kit.learnShelves.filter(k => k !== 'classes')]
      : [...kit.learnShelves],
    makeKinds: [...kit.makeKinds],
    fabFirst: [...kit.fabFirst],
    tools: [...kit.tools],
    notes: [...kit.notes],
    start: { ...startKit },
  };
}
