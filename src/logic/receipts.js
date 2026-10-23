// src/logic/receipts.js
// Receipts, not a score (docs/shake-up-plan-2026-10-21.md §6.2, P5): what
// you did, counted from data that already exists. Before units and
// deliverables (P6) that's your Builds, your goal steps and the Finds you
// tried. Then momentum: how many days this week you did something, never
// how many you missed.
//
// No imports, so scripts/check-receipts.mjs runs it as-is.

const DAY = 86400000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const dayNum = (iso) => (ISO.test(iso || '') ? Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY : null);

/**
 * The counts.
 *   builds     [{ ... }] with a `receipt` already worked out per Build
 *              ({ total, mastered, changed }, src/logic/builds.js receipt())
 *   stepsDone  goal steps ticked, every goal so far
 *   tastes     Finds tried (Today's Find, Finds, missions)
 * Returns { made, mastered, changed, stepsDone, tastes, items, empty }.
 * `items` is what to show, in order, zeros left out.
 */
export function receipts({ builds = [], stepsDone = 0, tastes = 0 } = {}) {
  const list = Array.isArray(builds) ? builds.filter(Boolean) : [];
  const sum = (k) => list.reduce((n, b) => n + Math.max(0, b.receipt?.[k] || 0), 0);
  const out = {
    made: list.length,
    mastered: sum('mastered'),
    changed: sum('changed'),
    stepsDone: Math.max(0, stepsDone | 0),
    tastes: Math.max(0, tastes | 0),
  };
  out.items = [
    out.made && { key: 'made', value: out.made, label: out.made === 1 ? 'thing made' : 'things made' },
    out.mastered && { key: 'mastered', value: out.mastered, label: out.mastered === 1 ? 'part mastered' : 'parts mastered' },
    out.changed && { key: 'changed', value: out.changed, label: out.changed === 1 ? 'part made yours' : 'parts made yours' },
    out.tastes && { key: 'tastes', value: out.tastes, label: out.tastes === 1 ? 'Find tried' : 'Finds tried' },
    out.stepsDone && { key: 'steps', value: out.stepsDone, label: out.stepsDone === 1 ? 'step done' : 'steps done' },
  ].filter(Boolean);
  out.empty = out.items.length === 0;
  return out;
}

/**
 * Momentum: days you did something in the last seven, from the same run the
 * server keeps (profiles.streak_count, last_active_date). Never a missed-day
 * count, never "at risk". After a gap it's a welcome back.
 *   today  'YYYY-MM-DD'
 * Returns { days, line, comeback }.
 */
export function momentum({ runDays = 0, lastActive = null, today } = {}) {
  const last = dayNum(String(lastActive || '').slice(0, 10));
  const now = dayNum(today);
  if (last == null || now == null) return { days: 0, line: null, comeback: false };
  const gap = Math.max(0, now - last);
  const days = gap >= 7 ? 0 : Math.max(0, Math.min(Math.max(runDays | 0, 1), 7 - gap));
  if (gap >= 2) return { days, line: 'Welcome back. The next step is ready.', comeback: true };
  return { days, line: days ? `You did something on ${days} day${days === 1 ? '' : 's'} this week.` : null, comeback: false };
}

// Where your room shows (§5.2): You (the default), Today, or nowhere.
export const ROOM_PLACES = ['you', 'today', 'off'];
export function roomPlaceOf(setting) {
  return ROOM_PLACES.includes(setting) ? setting : 'you';
}
