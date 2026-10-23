// scripts/check-receipts.mjs
// Receipts, not a score (docs/shake-up-plan-2026-10-21.md P5): the pure
// counts (src/logic/receipts.js), momentum's words (never a missed-day
// count, never "at risk"), where the room shows, and PROGRESS_V2's rule.
//
//   node scripts/check-receipts.mjs

import { readFile } from 'node:fs/promises';

const text = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const asUrl = (code) => 'data:text/javascript,' + encodeURIComponent(code);
const R = await import(asUrl(await text('src/logic/receipts.js')));
const W = await import(asUrl(await text('src/logic/welcomeCards.js')));

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const show = (v) => JSON.stringify(v);

// ── Receipts ──
const builds = [
  { receipt: { total: 4, mastered: 4, changed: 2 } },
  { receipt: { total: 5, mastered: 1, changed: 0 } },
];
const r = R.receipts({ builds, stepsDone: 7, tastes: 1 });
check('counts add up across Builds', r.made === 2 && r.mastered === 5 && r.changed === 2, show(r));
check('items in order, plurals right', show(r.items.map(i => `${i.value} ${i.label}`)) === show(['2 things made', '5 parts mastered', '2 parts made yours', '1 Find tried', '7 steps done']), show(r.items));
check('zeros are left out', !R.receipts({ builds: [{ receipt: { total: 3, mastered: 0, changed: 0 } }] }).items.some(i => i.key === 'mastered'));
check('nothing yet is empty, not a row of zeros', R.receipts({}).empty && R.receipts().items.length === 0);
check('junk inputs don\'t throw or go negative', R.receipts({ builds: [null, { receipt: { mastered: -3 } }], stepsDone: -2, tastes: 'x' }).mastered === 0 && R.receipts({ stepsDone: -2 }).stepsDone === 0);
check('no points, level or rank in a receipt', !/point|level|rank|xp/i.test(show(r.items)));

// ── Momentum ──
const T = '2026-10-23';
const m0 = R.momentum({ runDays: 3, lastActive: T, today: T });
check('active today: days this week', m0.days === 3 && m0.line === 'You did something on 3 days this week.' && !m0.comeback, show(m0));
check('one day: singular', R.momentum({ runDays: 1, lastActive: T, today: T }).line === 'You did something on 1 day this week.');
check('a long run caps at seven', R.momentum({ runDays: 40, lastActive: T, today: T }).days === 7);
check('yesterday still counts, quietly', R.momentum({ runDays: 5, lastActive: '2026-10-22', today: T }).days === 5 && !R.momentum({ runDays: 5, lastActive: '2026-10-22', today: T }).comeback);
const back = R.momentum({ runDays: 4, lastActive: '2026-10-18', today: T });
check('after a gap: welcome back, the next step', back.comeback && back.line === 'Welcome back. The next step is ready.', show(back));
check('a week away: no days, still a welcome', R.momentum({ runDays: 9, lastActive: '2026-09-01', today: T }).days === 0 && R.momentum({ runDays: 9, lastActive: '2026-09-01', today: T }).comeback);
check('never active: nothing to say', R.momentum({ today: T }).line === null);
const allLines = [m0, back, R.momentum({ runDays: 2, lastActive: '2026-10-21', today: T })].map(x => x.line).join(' ');
check('never guilt: no streak, at risk, missed or keep it', !/streak|at risk|miss|keep it|lose/i.test(allLines), allLines);

// ── Room place ──
check('room: You by default', R.roomPlaceOf(undefined) === 'you' && R.roomPlaceOf('nonsense') === 'you');
check('room: Today and off are kept', R.roomPlaceOf('today') === 'today' && R.roomPlaceOf('off') === 'off');

// ── PROGRESS_V2 ──
check('progress v2: unset follows the new tabs', W.progressV2On(null, true) === true && W.progressV2On(undefined, false) === false);
check('progress v2: a setting wins either way', W.progressV2On(false, true) === false && W.progressV2On(true, false) === true);

if (problems.length) {
  console.error(`check-receipts: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-receipts: all ${passed} checks passed.`);
