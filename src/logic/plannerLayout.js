// src/logic/plannerLayout.js
// Pure helpers for the Planner's time-of-day view and its clean-up tools.
// No React, no Supabase, so scripts/check-planner.mjs runs them under node.

export const DEFAULT_MINUTES = 30; // an item with no duration still takes up room

export function toMinutes(t24) {
  if (!t24) return null;
  const [h, m] = String(t24).split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

export function fmt12(t24) {
  const mins = toMinutes(t24);
  if (mins === null) return '';
  return fmtMinutes(mins);
}

function fmtMinutes(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// "7:00 – 7:45 AM", "11:30 AM – 12:15 PM", or just "7:00 AM" with no length.
export function timeRange(start, minutes) {
  const a = toMinutes(start);
  if (a === null) return '';
  if (!minutes) return fmtMinutes(a);
  const b = a + Number(minutes);
  const from = fmtMinutes(a), to = fmtMinutes(b);
  const sameHalf = (a < 720) === ((b % 1440) < 720) && b < 1440;
  return sameHalf ? `${from.replace(/ (AM|PM)$/, '')} – ${to}` : `${from} – ${to}`;
}

// The hours the grid has to show: the usual 6am–10pm, stretched to fit
// anything scheduled earlier or running later (a 5am shift used to vanish
// off the top of the grid, a 10:30pm one hung below its bottom edge).
export function hourRange(items, { start = 6, end = 22 } = {}) {
  let lo = start, hi = end;
  for (const it of items) {
    const a = toMinutes(it.start_time);
    if (a === null) continue;
    const b = a + (Number(it.duration_minutes) || DEFAULT_MINUTES);
    lo = Math.min(lo, Math.floor(a / 60));
    hi = Math.max(hi, Math.ceil(b / 60));
  }
  return { start: Math.max(0, lo), end: Math.min(24, hi) };
}

// Side-by-side columns for items whose times overlap, calendar-app style.
// Every item used to be drawn full width at its start time, so a 7:00 walk
// and a 7:15 breakfast sat on top of each other and only the last was
// readable or tappable.
//
// `minMinutes` is the shortest an item is drawn (a 5-minute pill still needs
// room for its title), and it counts for overlap too: two items that don't
// overlap on the clock but whose boxes would still collide get columns.
// Returns [{ item, top, bottom, col, cols }] in minutes from midnight.
export function layoutDay(items, { minMinutes = DEFAULT_MINUTES } = {}) {
  const boxes = items
    .map(item => {
      const top = toMinutes(item.start_time);
      if (top === null) return null;
      const len = Math.max(Number(item.duration_minutes) || DEFAULT_MINUTES, minMinutes);
      return { item, top, bottom: top + len, col: 0, cols: 1 };
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top || b.bottom - a.bottom);

  let cluster = [];
  let colEnds = [];
  let clusterEnd = -1;
  const close = () => {
    for (const b of cluster) b.cols = colEnds.length;
    cluster = []; colEnds = []; clusterEnd = -1;
  };
  for (const box of boxes) {
    if (cluster.length && box.top >= clusterEnd) close();
    let col = colEnds.findIndex(end => end <= box.top);
    if (col === -1) { col = colEnds.length; colEnds.push(box.bottom); }
    else colEnds[col] = box.bottom;
    box.col = col;
    cluster.push(box);
    clusterEnd = Math.max(clusterEnd, box.bottom);
  }
  close();
  return boxes;
}

// Order for any list of a day's items: timed first by clock, then untimed.
export function byTime(a, b) {
  const x = toMinutes(a.start_time ?? a.time), y = toMinutes(b.start_time ?? b.time);
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return x - y;
}

const titleKey = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Copies of the same plan: same title, same day, same start time. Keeps the
// one that's been ticked off (or skipped) if any, else the first made, and
// returns the ids of the rest.
export function duplicateIds(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${titleKey(row.title)}|${row.date}|${row.start_time ? String(row.start_time).slice(0, 5) : ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const extra = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const rank = (r) => (r.completed ? 0 : r.skipped ? 1 : 2);
    const sorted = [...group].sort((a, b) => rank(a) - rank(b)
      || String(a.created_at || '').localeCompare(String(b.created_at || ''))
      || String(a.id).localeCompare(String(b.id)));
    extra.push(...sorted.slice(1).map(r => r.id));
  }
  return extra;
}

// Is this new plan already on that day? Same rule the AI import uses: same
// title, same day, and the same time or either one untimed.
export function isSamePlan(a, b) {
  return titleKey(a.title) === titleKey(b.title) && a.date === b.date
    && (!a.start_time || !b.start_time || String(a.start_time).slice(0, 5) === String(b.start_time).slice(0, 5));
}
