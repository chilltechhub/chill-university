// src/logic/questionRotation.js
// Picks the next question so a game works through its whole pool before
// repeating one, across runs as well as within a run. Before this each
// game's pickNext only avoided repeats inside the current run, so replaying
// a game (now 5 rounds, see STAGE_COUNT) kept drawing the same few.
//
// Memory is per pool array and lasts for the app session. That's enough for
// "play it again" to feel fresh; a cold start begins a new cycle.
//
// ── Review: missed questions come back ───────────────────────────────────────
// A question you get wrong comes back a day later; get it right then and it
// comes back after 3 days, then 7, then it's learned (miss it on the way and
// the clock starts over). Spaced review is one of the best-evidenced ways to
// make something stick. Due questions are mixed in with new ones, about half
// the time, so a game never turns into a page of re-runs. Kept on this device
// (AsyncStorage) for every game that picks through rotatePick.
//
// How a miss is known: games pick a question, then call game.answer() for it
// (useGame), and only then pick the next. useGame calls noteAnswered(), which
// applies to the question rotatePick last handed out, then forgets it, so a
// game that doesn't pick through here can never touch someone else's.
import AsyncStorage from '@react-native-async-storage/async-storage';

const asked = new WeakMap(); // pool array -> Set of keys already asked this cycle

const DAY = 24 * 60 * 60 * 1000;
const REVIEW_GAPS = [1, 3, 7];     // days after a miss, then after each right answer
const REVIEW_SHARE = 0.5;          // chance a due question goes next
const MAX_REVIEWS = 300;           // oldest drop off past this
const STORE_KEY = '@cth_review_queue_v1';

// key -> { step, dueAt, missedAt }
const reviews = new Map();
let loaded = false;
let lastPick = null; // { key, at }
const listeners = new Set();

AsyncStorage.getItem(STORE_KEY)
  .then(raw => {
    const list = raw ? JSON.parse(raw) : [];
    for (const [k, v] of list) if (!reviews.has(k)) reviews.set(k, v);
  })
  .catch(() => {})
  .finally(() => { loaded = true; notify(); });

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(STORE_KEY, JSON.stringify([...reviews.entries()])).catch(() => {});
  }, 500);
}
function notify() { listeners.forEach(fn => { try { fn(); } catch {} }); }

const isDue = (key, now = Date.now()) => {
  const r = reviews.get(key);
  return !!r && r.dueAt <= now;
};

export function rotatePick(pool, avoid = [], keyOf = q => q?.prompt) {
  if (!pool?.length) return undefined;
  let seen = asked.get(pool);
  if (!seen) { seen = new Set(); asked.set(pool, seen); }

  const notAvoided = q => !avoid.includes(keyOf(q));

  // A due review, if there is one in this pool, about half the time: the
  // longest-overdue first.
  if (reviews.size && Math.random() < REVIEW_SHARE) {
    const now = Date.now();
    const due = pool.filter(q => notAvoided(q) && isDue(keyOf(q), now));
    if (due.length) {
      due.sort((a, b) => reviews.get(keyOf(a)).dueAt - reviews.get(keyOf(b)).dueAt);
      const pick = due[0];
      seen.add(keyOf(pick));
      lastPick = { key: keyOf(pick), at: now };
      return pick;
    }
  }

  let fresh = pool.filter(q => !seen.has(keyOf(q)) && notAvoided(q));
  if (!fresh.length) {
    // Whole pool used: start the next cycle (still skipping this run's own).
    seen.clear();
    fresh = pool.filter(notAvoided);
  }
  const list = fresh.length ? fresh : pool;
  const pick = list[Math.floor(Math.random() * list.length)];
  seen.add(keyOf(pick));
  lastPick = { key: keyOf(pick), at: Date.now() };
  return pick;
}

// Called by useGame for every answer. Applies to the question rotatePick last
// handed out (if it was handed out in the last few minutes), then forgets it.
export function noteAnswered(correct) {
  const p = lastPick;
  lastPick = null;
  if (!p || !p.key || Date.now() - p.at > 5 * 60 * 1000) return;
  const now = Date.now();
  const r = reviews.get(p.key);
  if (!correct) {
    reviews.delete(p.key); // re-insert so the newest miss is last (oldest drop first)
    reviews.set(p.key, { step: 0, dueAt: now + REVIEW_GAPS[0] * DAY, missedAt: now });
    while (reviews.size > MAX_REVIEWS) reviews.delete(reviews.keys().next().value);
  } else if (r && r.dueAt <= now) {
    // A due review answered right: the next gap, or learned.
    const step = r.step + 1;
    if (step >= REVIEW_GAPS.length) reviews.delete(p.key);
    else reviews.set(p.key, { ...r, step, dueAt: now + REVIEW_GAPS[step] * DAY });
  } else {
    return; // right, and not a review: nothing to change
  }
  save();
  notify();
}

// How many questions are due right now, for the Training screen.
export function reviewDueCount() {
  const now = Date.now();
  let n = 0;
  for (const r of reviews.values()) if (r.dueAt <= now) n++;
  return n;
}
export function onReviewsChange(fn) {
  listeners.add(fn);
  if (loaded) fn();
  return () => listeners.delete(fn);
}
