// scripts/check-planner.mjs
//
// Checks the Planner's time-of-day layout (src/logic/plannerLayout.js):
// overlapping items get side-by-side columns instead of being drawn on top of
// each other, items that don't overlap stay full width, the grid stretches to
// fit early and late items, and the duplicate finder keeps the right copy.
//
// Run: node scripts/check-planner.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/plannerLayout.js', import.meta.url), 'utf8');
const L = await import('data:text/javascript,' + encodeURIComponent(src));

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const show = (x) => JSON.stringify(x);
const cols = (boxes) => Object.fromEntries(boxes.map(b => [b.item.title, `${b.col}/${b.cols}`]));

// ── Overlap columns ─────────────────────────────────────────────────────────
{
  const day = [
    { title: 'Walk',      start_time: '07:00', duration_minutes: 30 },
    { title: 'Breakfast', start_time: '07:15', duration_minutes: 20 },
    { title: 'Meds',      start_time: '07:15' },
    { title: 'Commute',   start_time: '08:00', duration_minutes: 30 },
    { title: 'Standup',   start_time: '09:00', duration_minutes: 15 },
    { title: 'Email',     start_time: '09:30', duration_minutes: 30 },
  ];
  const c = cols(L.layoutDay(day));
  check('three overlapping items get three columns', c.Walk === '0/3' && c.Breakfast === '1/3' && c.Meds === '2/3', show(c));
  check('an item after the cluster is full width again', c.Commute === '0/1', show(c));
  check('back-to-back items do not share columns', c.Standup === '0/1' && c.Email === '0/1', show(c));
}
{
  // A 5-minute item is drawn 30 minutes tall, so the next one 10 minutes
  // later would sit under its box; they need columns even though the clock
  // times don't overlap.
  const c = cols(L.layoutDay([
    { title: 'Vitamins', start_time: '08:00', duration_minutes: 5 },
    { title: 'Feed dog', start_time: '08:10', duration_minutes: 5 },
  ]));
  check('short items whose boxes collide get columns', c.Vitamins === '0/2' && c['Feed dog'] === '1/2', show(c));
}
{
  // A long item keeps its column while shorter ones reuse the free one.
  const c = cols(L.layoutDay([
    { title: 'Work',  start_time: '09:00', duration_minutes: 480 },
    { title: 'Call',  start_time: '10:00', duration_minutes: 30 },
    { title: 'Lunch', start_time: '12:00', duration_minutes: 45 },
  ]));
  check('long item + later shorts reuse column 1', c.Work === '0/2' && c.Call === '1/2' && c.Lunch === '1/2', show(c));
}
check('untimed items are not laid out', L.layoutDay([{ title: 'x' }]).length === 0);

// ── Grid hours ──────────────────────────────────────────────────────────────
check('default hours', show(L.hourRange([])) === show({ start: 6, end: 22 }));
check('early and late items stretch the grid', show(L.hourRange([
  { start_time: '05:00', duration_minutes: 30 }, { start_time: '22:30', duration_minutes: 60 },
])) === show({ start: 5, end: 24 }), show(L.hourRange([{ start_time: '05:00' }, { start_time: '22:30', duration_minutes: 60 }])));

// ── Formatting & order ──────────────────────────────────────────────────────
check('time range same half', L.timeRange('07:00', 45) === '7:00 – 7:45 AM', L.timeRange('07:00', 45));
check('time range across noon', L.timeRange('11:30', 45) === '11:30 AM – 12:15 PM', L.timeRange('11:30', 45));
check('time range no length', L.timeRange('18:05') === '6:05 PM', L.timeRange('18:05'));
check('byTime: timed first, untimed last', show([{ t: 'b' }, { start_time: '09:00', t: 'a' }, { time: '07:00', t: 'c' }].sort(L.byTime).map(x => x.t)) === show(['c', 'a', 'b']));

// ── Duplicates ──────────────────────────────────────────────────────────────
{
  const rows = [
    { id: '1', title: 'Gym', date: '2026-09-30', start_time: '07:00:00', created_at: '2026-09-29T10:00:00Z' },
    { id: '2', title: 'gym ', date: '2026-09-30', start_time: '07:00', created_at: '2026-09-29T09:00:00Z' },
    { id: '3', title: 'Gym', date: '2026-09-30', start_time: '07:00', completed: true, created_at: '2026-09-29T11:00:00Z' },
    { id: '4', title: 'Gym', date: '2026-09-30', start_time: '18:00' },
    { id: '5', title: 'Gym', date: '2026-10-01', start_time: '07:00' },
    { id: '6', title: 'Read', date: '2026-09-30' },
    { id: '7', title: 'Read', date: '2026-09-30' },
  ];
  const extra = L.duplicateIds(rows).sort();
  check('duplicates: keeps the done copy, drops the others', show(extra) === show(['1', '2', '7']), show(extra));
}
check('isSamePlan: untimed matches timed', L.isSamePlan({ title: 'Gym', date: 'd', start_time: '07:00' }, { title: 'gym', date: 'd' }));
check('isSamePlan: different times differ', !L.isSamePlan({ title: 'Gym', date: 'd', start_time: '07:00' }, { title: 'Gym', date: 'd', start_time: '18:00:00' }));

if (problems.length) {
  console.error(`check-planner: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-planner: all ${passed} checks passed.`);
