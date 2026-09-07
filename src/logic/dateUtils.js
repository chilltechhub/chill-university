// src/logic/dateUtils.js
// Local-calendar date helpers.
//
// Everything in this app that has a *daily cadence* — today's focus, daily
// missions, streaks, planner rows, task due dates — keys off a 'YYYY-MM-DD'
// string. Those strings were being produced with `toISOString()`, which is
// always UTC, so "today" flipped at UTC midnight rather than at the user's
// own midnight:
//
//   • US Pacific (UTC-7): the date rolls forward at 5:00pm local. A student
//     opening the app after dinner got tomorrow's (empty) focus, saw today's
//     missions expire, and had evening tasks filed under tomorrow.
//   • NZ (UTC+13): the reverse — local mornings still counted as yesterday
//     until 1:00pm, so the first session of the day never registered.
//
// Evening is exactly when this app expects to be used, so the UTC version was
// wrong during peak hours for most of the world. These helpers use the local
// calendar instead, which is what a user means by "today".

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' for a Date in the device's own timezone. */
export function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today, local. The direct replacement for `new Date().toISOString().split('T')[0]`. */
export function todayStr() {
  return dateStr();
}

/**
 * Parses 'YYYY-MM-DD' as local midnight.
 *
 * `new Date('2026-09-05')` is specified to parse as *UTC* midnight, so in any
 * negative-offset timezone it lands on Sep 4 locally — which is what made
 * day-difference math off by one. Passing the parts to the constructor
 * individually is the documented way to get a local date.
 */
export function parseLocal(str) {
  if (!str) return null;
  const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** `str` shifted by n calendar days (n may be negative), as 'YYYY-MM-DD'. */
export function addDays(str, n) {
  const d = parseLocal(str) || new Date();
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

/** Yesterday, local. */
export function yesterdayStr() {
  return addDays(todayStr(), -1);
}

/**
 * Whole calendar days from `from` to `to` (both 'YYYY-MM-DD'), e.g.
 * daysBetween('2026-09-05', '2026-09-06') === 1. Null if either is unparseable.
 *
 * Both sides are normalised to local midnight first, so this counts date
 * boundaries crossed rather than elapsed hours — a 9pm-to-8am gap is 1 day,
 * not 0, which is what streak logic needs.
 */
export function daysBetween(from, to) {
  const a = parseLocal(from);
  const b = parseLocal(to);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}

/** True if 'YYYY-MM-DD' (or a date-ish value) is the local today. */
export function isToday(str) {
  if (!str) return false;
  return String(str).slice(0, 10) === todayStr();
}
