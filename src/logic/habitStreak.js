// src/logic/habitStreak.js
// A habit's streak from its planner rows (agenda_instances for one habit):
// days in a row for a daily habit, weeks in a row for a weekly one.
//   · today (or this week) counts once it's ticked; untouched, the streak
//     runs to yesterday, so the morning never shows a broken streak
//   · a skipped day is a rest: it neither adds nor breaks
//   · a day with no row ends it (the habit didn't exist yet)
// No imports, so scripts/check-planner.mjs can run it.

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (day, n) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + n); return iso(d); };
const weekOf = (day) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() - d.getDay()); return iso(d); };

export function habitStreak(rows, cadence, today) {
  if (cadence === 'weekly') {
    const done = new Set(rows.filter(r => r.completed).map(r => weekOf(r.date)));
    const had = new Set(rows.filter(r => !r.skipped).map(r => weekOf(r.date)));
    let wk = weekOf(today);
    if (!done.has(wk)) wk = weekOf(shift(wk, -1));
    let n = 0;
    while (had.has(wk) && done.has(wk)) { n += 1; wk = weekOf(shift(wk, -1)); }
    return n;
  }
  const byDate = new Map(rows.map(r => [r.date, r]));
  let d = byDate.get(today)?.completed ? today : shift(today, -1);
  let n = 0;
  for (let guard = 0; guard < 400; guard++) {
    const r = byDate.get(d);
    if (!r) break;
    if (r.completed) n += 1;
    else if (!r.skipped) break;
    d = shift(d, -1);
  }
  return n;
}
