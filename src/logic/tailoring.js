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
//      starting point's words, and the derived account type.
//
// Not wired yet (P0). Pure: it imports only plain data and derivePersona,
// which import nothing, so scripts/check-tailoring.mjs can run it.

import {
  PATH_KITS, SUGGESTED_PATH, START_POINT_KITS, DEFAULT_PATH, CORE_TODAY, MAX_PATH_WIDGETS,
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
