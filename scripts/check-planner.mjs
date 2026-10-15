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

// ── Typed quick-add (src/logic/quickAdd.js) ─────────────────────────────────
{
  const qsrc = await readFile(new URL('../src/logic/quickAdd.js', import.meta.url), 'utf8');
  const Q = await import('data:text/javascript,' + encodeURIComponent(qsrc));
  const now = new Date(2026, 9, 14, 10, 0); // Wed Oct 14 2026, 10:00
  const p = (text) => Q.parseQuickAdd(text, now);
  const is = (name, text, want) => {
    const got = p(text);
    const ok = Object.entries(want).every(([k, v]) => got[k] === v);
    check(`quick-add: ${name}`, ok, `${text} → ${show(got)}`);
  };
  is('weekday + pm time', 'dentist thu 4pm', { title: 'Dentist', date: '2026-10-15', time: '16:00', cadence: 'once' });
  is('tomorrow + "at 4" is afternoon', 'call mom tomorrow at 4', { title: 'Call mom', date: '2026-10-15', time: '16:00' });
  is('24h time today', 'standup today 09:30', { title: 'Standup', date: '2026-10-14', time: '09:30' });
  is('same weekday means next week', 'gym wednesday', { date: '2026-10-21' });
  is('next fri skips a week', 'review next fri', { title: 'Review', date: '2026-10-23' });
  is('month name date', 'rent due oct 31', { title: 'Rent due', date: '2026-10-31' });
  is('a passed date is next year', 'taxes apr 15', { date: '2027-04-15' });
  is('slash date', 'party 11/2 at 7pm', { title: 'Party', date: '2026-11-02', time: '19:00' });
  is('in N days', 'follow up in 3 days', { title: 'Follow up', date: '2026-10-17' });
  is('every monday is weekly from next monday', 'team sync every monday 10am', { title: 'Team sync', date: '2026-10-19', time: '10:00', cadence: 'weekly' });
  is('daily habit', 'stretch daily', { title: 'Stretch', cadence: 'daily', date: '2026-10-14' });
  is('tonight sets an evening time', 'read tonight', { title: 'Read', time: '19:00' });
  is('noon', 'lunch with sam noon', { title: 'Lunch with sam', time: '12:00' });
  is('plain text stays today, untimed', 'buy milk', { title: 'Buy milk', date: '2026-10-14', time: null, found: false });
  is('12am is midnight', 'launch 12am', { time: '00:00' });
  is('numbers in a title are left alone', 'read 20 pages', { title: 'Read 20 pages', time: null });
  // Habit streaks (src/logic/habitStreak.js)
  const hsrc = await readFile(new URL('../src/logic/habitStreak.js', import.meta.url), 'utf8');
  const H = await import('data:text/javascript,' + encodeURIComponent(hsrc));
  const day = (d, completed, skipped = false) => ({ date: d, completed, skipped });
  const T = '2026-10-14';
  check('streak: today untouched still counts the run to yesterday',
    H.habitStreak([day('2026-10-11', true), day('2026-10-12', true), day('2026-10-13', true), day(T, false)], 'daily', T) === 3);
  check('streak: today ticked adds one',
    H.habitStreak([day('2026-10-12', true), day('2026-10-13', true), day(T, true)], 'daily', T) === 3);
  check('streak: a missed day breaks it',
    H.habitStreak([day('2026-10-11', true), day('2026-10-12', false), day('2026-10-13', true), day(T, true)], 'daily', T) === 2);
  check('streak: a skipped day is a rest',
    H.habitStreak([day('2026-10-11', true), day('2026-10-12', false, true), day('2026-10-13', true), day(T, true)], 'daily', T) === 3);
  check('streak: weekly counts weeks',
    H.habitStreak([day('2026-09-30', true), day('2026-10-07', true), day(T, false)], 'weekly', T) === 2);
  // Debt payoff + savings goal (src/logic/debtPayoff.js)
  const dsrc = await readFile(new URL('../src/logic/debtPayoff.js', import.meta.url), 'utf8');
  const D = await import('data:text/javascript,' + encodeURIComponent(dsrc));
  const one = D.payoffPlan([{ name: 'Card', balance: 1200, apr: 0, min: 100 }], 0);
  check('payoff: no interest, 1200 at 100/month is 12 months', one.months === 12 && one.interest === 0, show(one));
  const debts = [{ name: 'Card', balance: 3000, apr: 24, min: 90 }, { name: 'Car', balance: 1000, apr: 6, min: 50 }];
  const av = D.payoffPlan(debts, 200, 'avalanche');
  const sb = D.payoffPlan(debts, 200, 'snowball');
  check('payoff: avalanche pays less interest than snowball', av.interest <= sb.interest, `${av.interest} vs ${sb.interest}`);
  check('payoff: snowball clears the small balance first', sb.order[0] === 'Car', show(sb.order));
  check('payoff: avalanche clears the high rate first', av.order[0] === 'Card', show(av.order));
  check('payoff: interest outrunning the payment is "never"', D.payoffPlan([{ name: 'X', balance: 10000, apr: 30, min: 50 }], 0).months === null);
  check('savings: months to goal', D.monthsToGoal(1000, 400, 100) === 6 && D.monthsToGoal(1000, 1000, 0) === 0 && D.monthsToGoal(1000, 0, 0) === null);
  check('quick-add: describe', Q.describeQuickAdd({ date: '2026-10-15', time: '16:00', cadence: 'weekly' }, now) === 'Tomorrow · 4:00 PM · every week',
    Q.describeQuickAdd({ date: '2026-10-15', time: '16:00', cadence: 'weekly' }, now));
}

if (problems.length) {
  console.error(`check-planner: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-planner: all ${passed} checks passed.`);
