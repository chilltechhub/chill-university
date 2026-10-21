// src/logic/dayPlan.js
// One answer to "what's on that day" (docs/shake-up-plan-2026-10-21.md §3.4).
// Home's Today card, Calm's week and the Planner's Day, Week and Month each
// asked on their own, and they disagreed: the Planner never showed calendar
// events, Calm's week skipped project deadlines. Now every one of them reads
// the same sources (src/logic/useDayPlan.js) merged here, once.
//
// An item:
//   { key, src, id, title, date, time, done, skipped, area, kind, raw }
//   src   'planner' (agenda_instances) · 'due' (deadlinesService: tasks,
//         project tasks, project finish dates) · 'event' (calendar_events) ·
//         'deliverable' (P6) · 'assignment' (P11)
//   raw   the source row, unchanged, for the screens that act on it
//
// Pure, so scripts/check-planner.mjs runs it.

export function planItem(src, raw) {
  switch (src) {
    case 'planner':
      return { key: `plan-${raw.id}`, src, id: raw.id, title: raw.title, date: raw.date, time: raw.start_time || null,
        done: !!raw.completed, skipped: !!raw.skipped, area: raw.area || null, kind: 'plan', raw };
    case 'due':
      return { key: raw.key || `due-${raw.kind}-${raw.id}`, src, id: raw.id, title: raw.title, date: raw.date, time: null,
        done: !!raw.completed, skipped: false, area: null, kind: raw.kind, raw };
    case 'event':
      return { key: `event-${raw.id}`, src, id: raw.id, title: raw.title, date: raw.date, time: raw.all_day ? null : (raw.time || null),
        done: false, skipped: false, area: null, kind: 'event', raw };
    case 'deliverable':
      return { key: `deliverable-${raw.id}`, src, id: raw.id, title: raw.title, date: raw.aimFor || null, time: null,
        done: raw.status === 'handed_in' || raw.status === 'shown', skipped: false, area: null, kind: raw.kind || 'deliverable', raw };
    case 'assignment':
      return { key: `assignment-${raw.assignment_id || raw.id}`, src, id: raw.assignment_id || raw.id, title: raw.title, date: raw.due_date || null,
        time: null, done: false, skipped: false, area: null, kind: 'assignment', raw };
    default:
      return null;
  }
}

const minutes = (time) => {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

/**
 * Every source merged into one list: by day, then by time with untimed
 * items after timed ones, otherwise in the order the sources gave them.
 * `areas` (a Set or array of life areas) keeps only items in those areas;
 * deadlines and events carry no area, so a filter leaves them out, as the
 * Planner always has.
 */
export function mergeDayPlan({ instances = [], due = [], events = [], deliverables = [], assignments = [] } = {}, { areas = null } = {}) {
  const want = areas && (areas.size ?? areas.length) ? new Set(areas) : null;
  const items = [
    ...instances.map(r => planItem('planner', r)),
    ...due.map(r => planItem('due', r)),
    ...events.map(r => planItem('event', r)),
    ...deliverables.map(r => planItem('deliverable', r)),
    ...assignments.map(r => planItem('assignment', r)),
  ].filter(it => it && it.date && (!want || (it.area && want.has(it.area))));
  return items
    .map((it, i) => [it, i])
    .sort(([a, i], [b, j]) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const x = minutes(a.time), y = minutes(b.time);
      if (x !== y) return x === null ? 1 : y === null ? -1 : x - y;
      return i - j;
    })
    .map(([it]) => it);
}

/** { 'YYYY-MM-DD': items } in the merged order. */
export function itemsByDate(items) {
  const out = {};
  (items || []).forEach(it => { (out[it.date] = out[it.date] || []).push(it); });
  return out;
}

/**
 * Deadlines fetched from before `from` through the range, split: `due` is the
 * range's own, `late` the earlier ones not done yet (Home's "Late").
 */
export function splitDue(dueAll, from, withLate = false) {
  const rows = dueAll || [];
  return {
    due: rows.filter(d => d.date >= from),
    late: withLate ? rows.filter(d => d.date < from && !d.completed) : [],
  };
}

/** The rows of one source, back in their own shape (what the Planner's views take). */
export const rowsOf = (items, src) => (items || []).filter(it => it.src === src).map(it => it.raw);
