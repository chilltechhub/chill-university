// src/logic/rightNow.js
// The one thing that matters at this minute, from today's schedule
// (Home's "Right now" card, src/components/RightNowCard.js). In order:
//   rest   inside your quiet hours (Notification Center settings)
//   now    a timed plan happening right now
//   soon   the next timed plan, within 90 minutes
//   late   something late, or due today
//   today  a plan for today with no time (habits), firmer in the evening
//   desk   the top thing on your desk
// Done and skipped items never count. No imports: check-planner runs it.

const toMin = (t) => {
  if (!t) return null;
  const [h, m] = String(t).split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};
const fmt = (min) => {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export function inQuietHours(quiet, nowMin) {
  if (!quiet?.on) return false;
  const a = toMin(quiet.start), b = toMin(quiet.end);
  if (a == null || b == null || a === b) return false;
  return a < b ? nowMin >= a && nowMin < b : nowMin >= a || nowMin < b;
}

/**
 * @param {object} o
 * @param {{ id, title, time?, duration?, done?, late?, due?, src }[]} o.items  today's things
 * @param {{ id, title }[]} o.desk   Home's desk, best first
 * @param {Date} o.now
 * @param {{ on, start, end }} o.quiet
 * @returns {null | { kind, item?, title, label }}
 */
export function pickRightNow({ items = [], desk = [], now = new Date(), quiet = null }) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (inQuietHours(quiet, nowMin)) {
    return { kind: 'rest', title: 'Quiet hours. Rest is part of the plan.', label: 'Right now' };
  }
  const open = items.filter(i => !i.done);
  const timed = open.map(i => ({ ...i, start: toMin(i.time) })).filter(i => i.start != null).sort((a, b) => a.start - b.start);
  const current = timed.find(i => i.start <= nowMin && nowMin < i.start + (i.duration || 30));
  if (current) {
    const end = current.start + (current.duration || 30);
    return { kind: 'now', item: current, title: current.title, label: `Now · until ${fmt(end)}` };
  }
  const next = timed.find(i => i.start > nowMin && i.start - nowMin <= 90);
  if (next) {
    const mins = next.start - nowMin;
    return { kind: 'soon', item: next, title: next.title, label: `Next · ${mins <= 1 ? 'in a minute' : `in ${mins} min`} (${fmt(next.start)})` };
  }
  const late = open.find(i => i.late) || open.find(i => i.due);
  if (late) return { kind: 'late', item: late, title: late.title, label: late.late ? 'From earlier' : 'Due today' };
  const untimed = open.find(i => i.time == null && i.src === 'planner');
  if (untimed) {
    return { kind: 'today', item: untimed, title: untimed.title, label: nowMin >= 17 * 60 ? 'Before the day ends' : 'For today' };
  }
  if (desk[0]) return { kind: 'desk', item: desk[0], title: desk[0].title, label: 'Up next on your desk' };
  return null;
}
