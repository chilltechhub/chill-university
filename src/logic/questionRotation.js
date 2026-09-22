// src/logic/questionRotation.js
// Picks the next question so a game works through its whole pool before
// repeating one, across runs as well as within a run. Before this each
// game's pickNext only avoided repeats inside the current run, so replaying
// a game (now 5 rounds, see STAGE_COUNT) kept drawing the same few.
//
// Memory is per pool array and lasts for the app session. That's enough for
// "play it again" to feel fresh; a cold start begins a new cycle.
const asked = new WeakMap(); // pool array -> Set of keys already asked this cycle

export function rotatePick(pool, avoid = [], keyOf = q => q?.prompt) {
  if (!pool?.length) return undefined;
  let seen = asked.get(pool);
  if (!seen) { seen = new Set(); asked.set(pool, seen); }

  const notAvoided = q => !avoid.includes(keyOf(q));
  let fresh = pool.filter(q => !seen.has(keyOf(q)) && notAvoided(q));
  if (!fresh.length) {
    // Whole pool used: start the next cycle (still skipping this run's own).
    seen.clear();
    fresh = pool.filter(notAvoided);
  }
  const list = fresh.length ? fresh : pool;
  const pick = list[Math.floor(Math.random() * list.length)];
  seen.add(keyOf(pick));
  return pick;
}
