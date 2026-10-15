// src/logic/petHunger.js
// The pet's hunger: four hearts that empty over time, and the food that
// fills them. Pure functions, no imports, so scripts/check-pet-hunger.mjs
// can load it straight into Node.
//
// One timestamp holds it all: `fullUntil`, the moment the last heart runs
// out. Each heart lasts HEART_HOURS, so a full pet (4 hearts) lasts a day and
// a bit — someone who opens the app once a day sees it peckish, never starving.
//
//   3-4 hearts  'full'     happy, finds coins
//   1-2 hearts  'peckish'  a food bubble over its head, still finds coins
//   0 hearts    'hungry'   slow, sits more, finds no coins until fed
//
// It never gets sick, runs away, or loses anything. Feeding it is the only
// thing hunger asks for, and food costs points — the first thing points buy.
// XP is never spent (it's your level), and rank counts every point ever
// earned, so feeding never lowers either.
//
// The server (feed_pet, 20261015120000) keeps the same numbers; keep the two
// in step.

export const MAX_HEARTS = 4;
export const HEART_HOURS = 8;
export const HEART_MS = HEART_HOURS * 60 * 60 * 1000;
export const FULL_MS = MAX_HEARTS * HEART_MS;

export const FOODS = [
  { id: 'snack', label: 'Snack', icon: 'nutrition', cost: 5, hearts: 1 },
  { id: 'meal', label: 'Meal', icon: 'restaurant', cost: 15, hearts: MAX_HEARTS },
];

export const foodById = (id) => FOODS.find(f => f.id === id) || null;

// Hearts left at `now`. A heart only empties once its full 8 hours are used,
// so a pet fed a minute ago still shows every heart. No timestamp yet (the
// clock hasn't started) counts as full.
export function heartsLeft(fullUntil, now = Date.now()) {
  if (fullUntil == null) return MAX_HEARTS;
  const ms = fullUntil - now;
  if (ms <= 0) return 0;
  return Math.min(MAX_HEARTS, Math.ceil(ms / HEART_MS));
}

export function moodFor(hearts) {
  if (hearts <= 0) return 'hungry';
  if (hearts <= 2) return 'peckish';
  return 'full';
}

// fullUntil after eating `food`: each heart adds HEART_MS on top of what's
// left (nothing carries over from an empty bowl), never past full.
export function fullUntilAfter(fullUntil, food, now = Date.now()) {
  const f = typeof food === 'string' ? foodById(food) : food;
  if (!f) return fullUntil;
  const base = Math.max(now, fullUntil ?? now);
  return Math.min(now + FULL_MS, base + f.hearts * HEART_MS);
}

// Why a food can't be bought right now, or null if it can.
export function cantFeed(food, { hearts, wallet }) {
  const f = typeof food === 'string' ? foodById(food) : food;
  if (!f) return 'unknown';
  if (hearts >= MAX_HEARTS) return 'full';
  if ((wallet ?? 0) < f.cost) return 'points';
  return null;
}

// The "getting hungry" reminder: when the pet is down to its last heart, so
// there's still time to feed it for double bond (petBond.js). Never at night
// (QUIET_START to QUIET_END, the phone's own time): then it moves to the
// morning if that's still before the bowl empties, or else the evening
// before. null when there's nothing to schedule — no clock yet, or that
// moment has passed (the bubble on screen says it then).
export const QUIET_START = 22;
export const QUIET_END = 8;

export function reminderAt(fullUntil, now = Date.now()) {
  if (fullUntil == null) return null;
  let at = fullUntil - HEART_MS;
  const d = new Date(at);
  const h = d.getHours();
  if (h >= QUIET_START || h < QUIET_END) {
    const morning = new Date(d);
    if (h >= QUIET_START) morning.setDate(morning.getDate() + 1);
    morning.setHours(QUIET_END, 0, 0, 0);
    if (morning.getTime() < fullUntil - 30 * 60 * 1000) {
      at = morning.getTime();
    } else {
      const evening = new Date(d);
      if (h < QUIET_END) evening.setDate(evening.getDate() - 1);
      evening.setHours(QUIET_START - 1, 0, 0, 0);
      at = evening.getTime();
    }
  }
  return at > now ? at : null;
}

// When the next heart empties (ms from now), for re-rendering at the right
// moment instead of polling. null when there's nothing left to lose.
export function msUntilNextHeartLost(fullUntil, now = Date.now()) {
  if (fullUntil == null) return null;
  const ms = fullUntil - now;
  if (ms <= 0) return null;
  const rest = ms % HEART_MS;
  return rest === 0 ? HEART_MS : rest;
}
