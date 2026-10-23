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
  // Right now (src/logic/rightNow.js)
  const rsrc = await readFile(new URL('../src/logic/rightNow.js', import.meta.url), 'utf8');
  const R = await import('data:text/javascript,' + encodeURIComponent(rsrc));
  const at = (h, m = 0) => new Date(2026, 9, 15, h, m);
  const items = [
    { id: 'a', title: 'Gym', time: '07:00', duration: 60, src: 'planner' },
    { id: 'b', title: 'Standup', time: '10:00:00', src: 'planner' },
    { id: 'c', title: 'Stretch', time: null, src: 'planner' },
    { id: 'd', title: 'Essay', late: true, src: 'due' },
  ];
  const quiet = { on: true, start: '21:30', end: '08:00' };
  check('right now: inside quiet hours is rest', R.pickRightNow({ items, now: at(23), quiet }).kind === 'rest');
  check('right now: quiet hours wrap past midnight', R.pickRightNow({ items, now: at(7, 30), quiet }).kind === 'rest');
  check('right now: a plan happening now', R.pickRightNow({ items, now: at(7, 30) }).item?.id === 'a');
  check('right now: next within 90 minutes', R.pickRightNow({ items, now: at(9, 0) }).item?.id === 'b');
  check('right now: done items are skipped', R.pickRightNow({ items: items.map(i => (i.id === 'b' ? { ...i, done: true } : i)), now: at(9, 0) }).item?.id === 'd');
  check('right now: late before untimed', R.pickRightNow({ items, now: at(14) }).kind === 'late');
  check('right now: untimed plan in the evening', R.pickRightNow({ items: items.filter(i => i.id !== 'd'), now: at(18) }).label === 'Before the day ends');
  check('right now: desk when nothing is scheduled', R.pickRightNow({ items: [], desk: [{ id: 'x', title: 'Draft' }], now: at(14) }).kind === 'desk');
  check('right now: nothing at all is null', R.pickRightNow({ items: [], desk: [], now: at(14) }) === null);
  check('quick-add: describe', Q.describeQuickAdd({ date: '2026-10-15', time: '16:00', cadence: 'weekly' }, now) === 'Tomorrow · 4:00 PM · every week',
    Q.describeQuickAdd({ date: '2026-10-15', time: '16:00', cadence: 'weekly' }, now));
}

// ── One "today" (src/logic/dayPlan.js, read by useDayPlan) ──────────────────
// The Planner's Day/Week/Month, Home's Today card and Calm's week all merge
// the same sources here, so they can't disagree about a day.
{
  for (const name of ['layoutDay', 'hourRange', 'duplicateIds', 'isSamePlan', 'byTime']) {
    check(`plannerLayout still exports ${name}`, typeof L[name] === 'function');
  }
  const dsrc = await readFile(new URL('../src/logic/dayPlan.js', import.meta.url), 'utf8');
  const P = await import('data:text/javascript,' + encodeURIComponent(dsrc));
  const sources = {
    instances: [
      { id: 'p1', title: 'Gym', date: '2026-10-21', start_time: '18:00', area: 'physical', completed: false },
      { id: 'p2', title: 'Read', date: '2026-10-21', start_time: null, area: 'mental', completed: true },
      { id: 'p3', title: 'Budget', date: '2026-10-22', start_time: '09:00', area: 'financial', skipped: true },
      { id: 'p4', title: 'Call mum', date: '2026-10-21', start_time: '08:30', area: 'social' },
    ],
    due: [{ key: 'task-9', kind: 'task', id: 9, title: 'Essay', date: '2026-10-21', completed: false }],
    events: [
      { id: 7, title: 'Dentist', date: '2026-10-21', time: '16:00', all_day: false },
      { id: 8, title: 'Holiday', date: '2026-10-22', time: '10:00', all_day: true },
    ],
  };
  const items = P.mergeDayPlan(sources);
  check('day plan: every source in one list', items.length === 7, items.length);
  check('day plan: by day, then time, untimed last', items.map(i => i.title).join() === 'Call mum,Dentist,Gym,Read,Essay,Budget,Holiday',
    items.map(i => i.title).join());
  check('day plan: untimed ties keep source order (plans, deadlines, events)', items.filter(i => i.date === '2026-10-21' && !i.time).map(i => i.src).join() === 'planner,due');
  check('day plan: an all-day event has no time', items.find(i => i.title === 'Holiday').time === null);
  check('day plan: done and skipped carried', items.find(i => i.title === 'Read').done === true && items.find(i => i.title === 'Budget').skipped === true);
  check('day plan: raw rows kept as they were', P.rowsOf(items, 'planner').find(r => r.id === 'p4') === sources.instances[3]);
  check('day plan: keys are unique across sources', new Set(items.map(i => i.key)).size === items.length);
  const physical = P.mergeDayPlan(sources, { areas: new Set(['physical']) });
  check('day plan: an area filter keeps that area only', physical.map(i => i.title).join() === 'Gym', physical.map(i => i.title).join());
  check('day plan: an area filter leaves deadlines and events out, as the Planner always has',
    !physical.some(i => i.src !== 'planner'));
  check('day plan: an empty filter is no filter', P.mergeDayPlan(sources, { areas: new Set() }).length === 7 && P.mergeDayPlan(sources, { areas: [] }).length === 7);
  const byDay = P.itemsByDate(items);
  check('day plan: grouped by day in order', Object.keys(byDay).join() === '2026-10-21,2026-10-22' && byDay['2026-10-21'].length === 5);
  check('day plan: missing sources are empty, not errors', P.mergeDayPlan({}).length === 0 && P.mergeDayPlan().length === 0);
  check('day plan: deliverables and assignments slot in when they exist',
    P.mergeDayPlan({ deliverables: [{ id: 'd1', title: 'Money sheet', aimFor: '2026-10-23', status: 'doing' }], assignments: [{ assignment_id: 'a1', title: 'Essay 2', due_date: '2026-10-23' }] })
      .map(i => i.src).join() === 'deliverable,assignment');
  const split = P.splitDue([
    { date: '2026-10-18', completed: false, title: 'old' }, { date: '2026-10-19', completed: true, title: 'done old' },
    { date: '2026-10-21', completed: true, title: 'today done' }, { date: '2026-10-21', completed: false, title: 'today' },
  ], '2026-10-21', true);
  check('day plan: late = earlier and not done; the day keeps its done ones',
    split.late.map(d => d.title).join() === 'old' && split.due.map(d => d.title).join() === 'today done,today');
  check('day plan: no late unless asked', P.splitDue([{ date: '2026-10-18', completed: false }], '2026-10-21').late.length === 0);
}

// ── A guest's planner (src/logic/agendaRows.js, stored by localAgenda.js) ────
{
  const asrc = await readFile(new URL('../src/logic/agendaRows.js', import.meta.url), 'utf8');
  const A = await import('data:text/javascript,' + encodeURIComponent(asrc));
  let n = 0;
  const makeId = () => `local-test-${n++}`;
  let { rows, added } = A.insertRows([], [
    { user_id: 'someone', title: 'Walk', date: '2026-10-21', area: 'physical', cadence: 'once', start_time: '07:00' },
    { title: 'Budget', date: '2026-10-21', area: 'financial', cadence: 'once' },
    { title: 'Stretch', date: '2026-10-22', area: 'physical', cadence: 'daily', start_time: '08:00' },
    { title: 'Stretch', date: '2026-10-23', area: 'physical', cadence: 'daily', start_time: '08:00' },
  ], { makeId, now: '2026-10-21T10:00:00Z' });
  check('guest: new rows get local ids', added.every(r => A.isLocalId(r.id)) && !A.isLocalId('8c1f-uuid') && !A.isLocalId(null));
  check('guest: rows never carry a user id', added.every(r => r.user_id === null));
  check('guest: rows start not done, not skipped', added.every(r => r.completed === false && r.skipped === false));
  check('guest: a day reads in area order like the server', A.selectRows(rows, { date: '2026-10-21' }).map(r => r.title).join() === 'Budget,Walk');
  check('guest: a range reads', A.selectRows(rows, { from: '2026-10-22', to: '2026-10-23' }).length === 2);
  check('guest: an area reads', A.selectRows(rows, { area: 'financial' }).map(r => r.title).join() === 'Budget');
  ({ rows } = A.updateRow(rows, 'local-test-0', { completed: true, user_id: 'x', id: 'hijack' }));
  const walk = rows.find(r => r.title === 'Walk');
  check('guest: tick saves', walk.completed === true);
  check('guest: an update keeps the row\'s id and no user id', walk.id === 'local-test-0' && walk.user_id === null);
  check('guest: updating a missing row changes nothing', A.updateRow(rows, 'local-nope', { title: 'x' }).row === null);
  const series = A.seriesFrom(rows, rows.find(r => r.title === 'Stretch'));
  check('guest: a repeat\'s series is found', series.length === 2, JSON.stringify(series));
  rows = A.deleteRows(rows, ['local-test-1']);
  check('guest: delete removes it', !rows.some(r => r.title === 'Budget') && rows.length === 3);
  check('guest: ids are unique', new Set(Array.from({ length: 50 }, () => A.makeLocalId())).size === 50);

  // Signup: the guest's plans become the account's (src/api/claimLocal.js).
  const guest = [
    { id: 'local-a', user_id: null, title: 'Walk', date: '2026-10-21', start_time: '07:00', area: 'physical', cadence: 'once', completed: true, completed_at: '2026-10-21T07:30:00Z', created_at: 'x' },
    { id: 'local-b', user_id: null, title: 'Budget', date: '2026-10-22', start_time: null, area: 'financial', cadence: 'once' },
    { id: 'local-c', user_id: null, title: 'Budget', date: '2026-10-22', start_time: null, area: 'financial', cadence: 'once' },
    { id: 'local-d', user_id: null, title: '', date: '2026-10-22' },
  ];
  const already = [{ title: 'Walk', date: '2026-10-21', start_time: '07:00' }];
  const claimed = A.claimRows(guest, already, 'user-1', L.isSamePlan);
  check('claim: one already on the account is skipped', !claimed.some(r => r.title === 'Walk'), JSON.stringify(claimed));
  check('claim: a plan in there twice lands once', claimed.filter(r => r.title === 'Budget').length === 1);
  check('claim: an untitled row is dropped', claimed.length === 1);
  check('claim: rows belong to the account, with no local id or timestamp', claimed.every(r => r.user_id === 'user-1' && !('id' in r) && !('created_at' in r)));
  const done = A.claimRows([guest[0]], [], 'user-1', L.isSamePlan)[0];
  check('claim: done carries over', done.completed === true && done.completed_at === '2026-10-21T07:30:00Z' && done.start_time === '07:00');
}

// ── Phone-calendar sync, gathered (src/logic/coalesce.js) ───────────────────
{
  const csrc = await readFile(new URL('../src/logic/coalesce.js', import.meta.url), 'utf8');
  const { coalesce } = await import('data:text/javascript,' + encodeURIComponent(csrc));
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));
  const runs = [];
  const sync = coalesce(async (who) => { runs.push(who); await sleep(80); }, 10);
  ['a', 'b', 'c', 'd', 'e'].forEach(x => sync(x));
  await sleep(150); // e: fires at 10, runs to 90
  check('phone sync: a burst of changes is one sync, with the latest', runs.join() === 'e', runs.join());
  sync('f'); await sleep(40); sync('g'); // f starts at 10 and is still running when g lands at 40
  await sleep(250);
  check('phone sync: a change during a sync gets one more, never two at once', runs.join() === 'e,f,g', runs.join());
  let overlap = 0, live = 0;
  const busy = coalesce(async () => { live++; overlap = Math.max(overlap, live); await sleep(20); live--; }, 1);
  for (let i = 0; i < 6; i++) { busy(); await sleep(7); }
  await sleep(150);
  check('phone sync: never two at once', overlap === 1, overlap);
}

// ── Today = the Planner as the dashboard (shake-up P3) ───────────────────
// Links in (todayParams.js), Today's own layout (widgetLayout.js), the
// DASHBOARD_V2 rule (welcomeCards.js) and the tours' + Add swap.
{
  const text = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
  const asUrl = (code) => 'data:text/javascript,' + encodeURIComponent(code);
  const P = await import(asUrl(await text('src/logic/todayParams.js')));
  const T = '2026-10-22';
  const inst = { id: 'a1', date: '2026-10-25', title: 'X' };
  const e = P.todayParamsAction({ editInstance: inst }, T);
  check('link: editInstance opens its day with the edit sheet', e.view === 'Daily' && e.date === '2026-10-25' && e.edit === inst && show(e.used) === show(['editInstance']), show(e));
  check('link: review opens today with the review', P.todayParamsAction({ review: 1 }, T).date === T && P.todayParamsAction({ review: 1 }, T).review === true);
  const d = P.todayParamsAction({ date: '2026-11-02' }, T);
  check('link: date opens that day', d.view === 'Daily' && d.date === '2026-11-02');
  const a = P.todayParamsAction({ addFor: { date: '2026-10-30', area: 'physical' } }, T);
  check('link: addFor opens the add sheet on that day, in that area', a.date === '2026-10-30' && a.add.area === 'physical');
  check('link: addFor without a day is today', P.todayParamsAction({ addFor: { area: 'mental' } }, T).date === T);
  const w = P.todayParamsAction({ view: 'week', at: 1 }, T);
  check("link: the FAB's Calendar opens the week", w.view === 'Weekly' && w.date === null && show(w.used) === show(['view']), show(w));
  check('link: a day in a view', P.todayParamsAction({ date: '2026-10-01', view: 'month' }, T).view === 'Monthly');
  check('link: nothing to do is null', P.todayParamsAction({}, T) === null && P.todayParamsAction(null, T) === null && P.todayParamsAction({ date: 'tomorrow' }, T) === null);
  check('link: a bad editInstance is ignored', P.todayParamsAction({ editInstance: { id: 1 } }, T) === null);
  check('goal step: "put one in the Planner" opens the add sheet in its area', show(P.plannerStepParams({ screen: 'PlannerScreen', signal: 'planner-item-added:physical' })) === show({ addFor: { area: 'physical' } }));
  check('goal step: no area named, no area forced', P.plannerStepParams({ screen: 'PlannerScreen', signal: 'planner-item-added' }).addFor.area === null);
  check('goal step: a step that says what to open, or another screen, is left alone', P.plannerStepParams({ screen: 'PlannerScreen', params: { date: T } }) === null && P.plannerStepParams({ screen: 'VaultScreen' }) === null && P.plannerStepParams(null) === null);

  // The Planner's scopes (§3.4): Day keeps "this profile", Week/Month the
  // calendar's "every profile"; Today asks for the calendar one.
  const up = await text('src/screens/today/usePlanner.js');
  check("scope: Day reads the planner's, this profile by default", up.includes("useViewScope('planner', SCOPE_PROFILE)"));
  check("scope: Week/Month read the calendar's, every profile by default", up.includes("useViewScope('calendar', SCOPE_ALL)") && up.includes("calendarScope && view !== 'Daily' ? calScope : plannerScope"));
  check('scope: Today uses the calendar scope for Week/Month', (await text('src/screens/HomeScreen.js')).includes('calendarScope: true'));
  // Every add signals the goal steps, and a new habit tops up its repeats.
  check('add: a new plan signals planner-item-added with its area', up.includes("signalAction('planner-item-added', { area: saved?.area })"));
  check('add: a repeating plan tops up its series at once', up.includes('extendRepeatingPlans(userId, { force: true })'));
  check('phone: Today syncs to the phone gathered, not per render', up.includes('syncPlansToPhoneSoon(userId)') && !up.includes('syncPlansToPhone(userId)'));

  const dwUrl = asUrl(await text('src/data/dashboardWidgets.js'));
  const DW = await import(dwUrl);
  const WL = await import(asUrl((await text('src/logic/widgetLayout.js')).replace("'../data/dashboardWidgets'", `"${dwUrl}"`)));
  const shownKeys = (l) => l.filter(x => !x.hidden).map(x => x.key);
  // A Home layout from before: the goal card, today, the desk, quests, a hidden wisdom.
  const home = [
    { key: 'hq', hidden: false }, { key: 'compass', hidden: false }, { key: 'focus', hidden: false },
    { key: 'desk', hidden: false }, { key: 'quests', hidden: false }, { key: 'wisdom', hidden: true }, { key: 'lifeAreas', hidden: true },
  ];
  const m = WL.todayLayoutFrom({ home, wanted: ['nextStep', 'yourDay', 'find'] });
  const sk = shownKeys(m);
  check('migrate: old cards take their new names in place', sk.indexOf('nextStep') === sk.indexOf('hq') + 1 && sk.includes('missions') && !sk.includes('compass') && !sk.includes('quests'), show(sk));
  check('migrate: focus becomes your day', sk.includes('yourDay') && !sk.includes('focus'), show(sk));
  check("migrate: the old fixed cards and Today's own show", ['dream', 'nextStep', 'quickAdd', 'yourDay', 'find'].every(k => sk.includes(k)), show(sk));
  check('migrate: quick add sits under the next step', sk.indexOf('quickAdd') === sk.indexOf('nextStep') + 1, show(sk));
  // An old layout with today above the goal card: the Find goes under both.
  const sk2 = shownKeys(WL.todayLayoutFrom({ home: [{ key: 'hq', hidden: false }, { key: 'focus', hidden: false }, { key: 'compass', hidden: false }, { key: 'desk', hidden: false }] }));
  check("migrate: today's find sits under the day's cards", sk2.indexOf('find') === Math.max(sk2.indexOf('yourDay'), sk2.indexOf('nextStep'), sk2.indexOf('quickAdd')) + 1, show(sk2));
  check('migrate: a hidden card stays hidden, a retired one is gone', m.some(x => x.key === 'lifeAreas' && x.hidden) && !m.some(x => x.key === 'wisdom'), show(m));
  check('migrate: every Today key is somewhere, once', DW.TODAY_KEYS.every(k => m.filter(x => x.key === k).length === 1) && m.length === DW.TODAY_KEYS.length);
  check('migrate: never touches the Home layout', home[1].key === 'compass' && home.length === 7);
  const saved = [{ key: 'find', hidden: false }, { key: 'nextStep', hidden: true }];
  const sv = WL.todayLayoutFrom({ saved, home, wanted: [] });
  check('saved: a layout saved for Today wins as it is', show(shownKeys(sv)) === show(['find']) && sv.find(x => x.key === 'nextStep').hidden, show(shownKeys(sv)));
  const fresh = WL.todayLayoutFrom({ wanted: ['nextStep', 'yourDay', 'find', 'deliverable', 'checkin'] });
  check('new account: next step, quick add, then the path, unbuilt keys skipped', show(shownKeys(fresh)) === show(['nextStep', 'quickAdd', 'yourDay', 'find', 'checkin']), show(shownKeys(fresh)));
  check('calm draws a subset of the same keys', [...DW.CALM_WIDGETS].every(k => DW.TODAY_KEYS.includes(k)));

  const WC = await import(asUrl(await text('src/logic/welcomeCards.js')));
  check('v2: a setting wins either way', WC.dashboardV2On(true, {}) === true && WC.dashboardV2On(false, { signedIn: true, onboardedAt: 'x' }) === false);
  check('v2: new accounts on, old accounts off', WC.dashboardV2On(null, { signedIn: true, onboardedAt: '2026-10-22' }) === true && WC.dashboardV2On(undefined, { signedIn: true }) === false);
  check('v2: a guest from the welcome on, any other guest off', WC.dashboardV2On(null, { welcomeGuest: true }) === true && WC.dashboardV2On(null, {}) === false);
  // The new tabs (P4) come on with Today unless set on their own.
  check('tabs v2: unset follows Today', WC.tabsV2On(null, true) === true && WC.tabsV2On(undefined, false) === false);
  check('tabs v2: a setting wins either way', WC.tabsV2On(false, true) === false && WC.tabsV2On(true, false) === true);

  const TS = await import(asUrl(await text('src/logic/tourSteps.js')));
  const tv2 = TS.mainTourSteps(true);
  check('tour: + Add stands in for the FAB on Today', tv2.some(st => st.id === 'planner-add') && !tv2.some(st => st.id === 'fab') && tv2.length === TS.TOUR_STEPS.length);
  check('tour: unchanged with Today off', TS.mainTourSteps(false) === TS.TOUR_STEPS);
  // The new tabs (P4): the bar step names Today · Learn · Make, the rest stays.
  const tabsTour = TS.mainTourSteps(false, true);
  check('tour (new tabs): the bar step names Today, Learn and Make', /Today.*Learn.*Make/.test(tabsTour.find(st => st.id === 'nav-tabbar').body) && tabsTour.length === TS.TOUR_STEPS.length && tabsTour.some(st => st.id === 'fab'));
  // appTour reads the tab bar's words from tourSteps.
  const AT = await import(asUrl((await text('src/logic/guide/lessons/appTour.js')).replace("'../../tourSteps'", `"${asUrl(await text('src/logic/tourSteps.js'))}"`)));
  check('app tour (new tabs): the bar step names Today, Learn and Make', /Today.*Learn.*Make/.test(AT.appTour({ project: 'P', mission: 'M', dashboardV2: true, tabsV2: true }).find(st => st.id === 'nav-tabbar').body));
  check('app tour (old tabs): the bar step unchanged', /Library/.test(AT.appTour({ project: 'P', mission: 'M' }).find(st => st.id === 'nav-tabbar').body));
  const ids = (l) => l.map(st => st.id);
  check('app tour (Today): project in Make, then + Add', show(ids(AT.appTour({ project: 'P', mission: 'M', dashboardV2: true }))) === show(['studio-builds', 'nav-tabbar', 'planner-add', 'calm-next']));
  check('app tour (old Home): unchanged', show(ids(AT.appTour({ project: 'P', mission: 'M' }))) === show(['home-studio', 'nav-tabbar', 'fab', 'calm-next']));
  check('app tour (Today, no project): no Studio stop', !ids(AT.appTour({ dashboardV2: true })).includes('studio-builds'));
}

if (problems.length) {
  console.error(`check-planner: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-planner: all ${passed} checks passed.`);
