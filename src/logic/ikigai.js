// src/logic/ikigai.js
// The four circles on You (docs/shake-up-plan-2026-10-21.md §2.2, §8, P6):
// what you love, what you're good at, what the world needs, what you can be
// paid for. Each is filled from things you actually did or said, never a
// quiz score: sparks (what you chose to make and try), receipts (work
// handed in, parts mastered), values (your Dream) and careers (ones you
// targeted, work you did toward a job).
//
// A circle with nothing in it says so, with one step that would fill it.
// The welcome's "shakiest" answer marks one circle as the place to start.
//
// No imports, so scripts/check-receipts.mjs runs it.

export const CIRCLES = [
  { key: 'love', label: 'What you love', icon: 'heart-outline',
    empty: 'Try a few small things. What pulls you in shows here.', go: { screen: 'StudioScreen', label: 'Make something' } },
  { key: 'goodAt', label: "What you're good at", icon: 'ribbon-outline',
    empty: 'Hand in one piece of work. Proof beats a quiz.', go: { screen: 'PathScreen', label: 'My path' } },
  { key: 'needs', label: 'What the world needs', icon: 'earth-outline',
    // The Dream sits on You itself, so this one points up at it.
    empty: 'Name what matters to you in The Dream, above.', go: null },
  { key: 'paid', label: 'What you can be paid for', icon: 'cash-outline',
    empty: 'Target one career that could fit.', go: { screen: 'CareerExplorationScreen', label: 'Career Explorer' } },
];

const uniq = (list) => [...new Set((Array.isArray(list) ? list : []).map(x => (typeof x === 'string' ? x.trim() : '')).filter(Boolean))];

/**
 * Inputs (all optional):
 *   made       labels of what you made (Build kinds, e.g. 'A web page')
 *   tastes     how many Finds you tried
 *   saved      Wayfinder paths you saved (labels)
 *   handedIn   titles of work handed in
 *   mastered   parts mastered, across Builds
 *   values     your Dream's values (labels)
 *   careers    careers you targeted (titles)
 *   paidWork   titles of handed-in work toward pay (resume, money sheet…)
 *   shakiest   'love' | 'goodAt' | 'needs' | 'paid' | other
 * Returns { circles: [{ key, label, icon, items, empty, go, shakiest }],
 *           filled, line, start } where `start` is the circle to work on.
 */
export function ikigaiCircles({
  made = [], tastes = 0, saved = [], handedIn = [], mastered = 0, values = [], careers = [], paidWork = [], shakiest = null,
} = {}) {
  const n = (v) => Math.max(0, v | 0);
  const items = {
    love: [
      ...uniq(made).slice(0, 2),
      n(tastes) ? `${n(tastes)} ${n(tastes) === 1 ? 'Find' : 'Finds'} tried` : null,
      ...uniq(saved).slice(0, 1),
    ],
    goodAt: [
      ...uniq(handedIn).slice(0, 2),
      n(mastered) ? `${n(mastered)} ${n(mastered) === 1 ? 'part' : 'parts'} mastered` : null,
    ],
    needs: uniq(values).slice(0, 3),
    paid: [...uniq(careers).slice(0, 2), ...uniq(paidWork).slice(0, 1)],
  };
  const circles = CIRCLES.map(c => ({
    ...c,
    items: items[c.key].filter(Boolean).slice(0, 3),
    shakiest: c.key === shakiest,
  }));
  const filled = circles.filter(c => c.items.length).length;
  // Where to start: the shakiest one, else the first that's empty.
  const start = circles.find(c => c.shakiest) || circles.find(c => !c.items.length) || null;
  const line = filled === 4
    ? 'All four have something in them. Where they meet is worth walking toward.'
    : filled === 0 ? 'Each circle fills from what you do here.' : `${filled} of 4 have something in them.`;
  return { circles, filled, line, start };
}
