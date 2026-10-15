// scripts/check-pet-hunger.mjs
//
// Checks the pet's hunger and bond rules (src/logic/petHunger.js, petBond.js):
// hearts empty one every 8 hours, food never overfills, a full or broke
// player can't buy, bond doubles only when fed before empty, the reminder
// stays out of the night, and the SQL (feed_pet, collect_pet_coin,
// claim_pet_gift) charges, fills and pays the same as the app says.
//
// Run: node scripts/check-pet-hunger.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/petHunger.js', import.meta.url), 'utf8');
const H = await import('data:text/javascript,' + encodeURIComponent(src));
const sql = await readFile(new URL('../supabase/migrations/20261015120000_pet_food.sql', import.meta.url), 'utf8');

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };

const now = Date.UTC(2026, 9, 15, 12);
const h = (n) => n * 60 * 60 * 1000;

check('no clock yet reads as full', H.heartsLeft(null, now) === H.MAX_HEARTS);
check('just fed: every heart', H.heartsLeft(now + H.FULL_MS - 60000, now) === 4);
check('one heart gone after 8h', H.heartsLeft(now + H.FULL_MS - h(8), now) === 3);
check('a heart stays until its 8h are used', H.heartsLeft(now + h(8) + 1, now) === 2 && H.heartsLeft(now + h(8), now) === 1);
check('empty bowl is 0, never negative', H.heartsLeft(now - h(100), now) === 0);

check('moods', H.moodFor(4) === 'full' && H.moodFor(3) === 'full' && H.moodFor(2) === 'peckish'
  && H.moodFor(1) === 'peckish' && H.moodFor(0) === 'hungry');

check('snack on an empty bowl = 1 heart', H.heartsLeft(H.fullUntilAfter(now - h(50), 'snack', now), now) === 1,
  'nothing carries over from a long-empty bowl');
check('snack adds one heart', H.heartsLeft(H.fullUntilAfter(now + h(10), 'snack', now), now) === 3);
check('meal fills up', H.heartsLeft(H.fullUntilAfter(now + h(3), 'meal', now), now) === 4);
check('never past full', H.fullUntilAfter(now + h(30), 'snack', now) === now + H.FULL_MS);

check('full can\'t eat', H.cantFeed('snack', { hearts: 4, wallet: 999 }) === 'full');
check('broke can\'t buy', H.cantFeed('meal', { hearts: 1, wallet: 14 }) === 'points');
check('enough points can', H.cantFeed('meal', { hearts: 1, wallet: 15 }) === null);

check('next heart timing', H.msUntilNextHeartLost(now + h(10), now) === h(2)
  && H.msUntilNextHeartLost(now + h(16), now) === h(8)
  && H.msUntilNextHeartLost(now - 1, now) === null);

// The server must charge and fill what the app shows.
for (const f of H.FOODS) {
  const hours = f.hearts * H.HEART_HOURS;
  const re = new RegExp(`p_food = '${f.id}' then v_cost := ${f.cost};\\s+v_hours := ${hours};`);
  check(`SQL ${f.id} costs ${f.cost} and fills ${hours}h`, re.test(sql));
}
check('SQL full is 32h', sql.includes(`interval '${H.MAX_HEARTS * H.HEART_HOURS} hours'`));
check('SQL "already full" = more than 3 hearts of time left',
  sql.includes(`v_full > now() + interval '${(H.MAX_HEARTS - 1) * H.HEART_HOURS} hours'`));

// ── Bond (src/logic/petBond.js ↔ 20261015130000_pet_bond.sql) ──────────────
const bondSrc = await readFile(new URL('../src/logic/petBond.js', import.meta.url), 'utf8');
const B = await import('data:text/javascript,' + encodeURIComponent(bondSrc));
const bondSql = await readFile(new URL('../supabase/migrations/20261015130000_pet_bond.sql', import.meta.url), 'utf8');

check('levels start at New friend', B.bondLevel(0).name === 'New friend' && B.bondLevel(9).level === 1);
check('level thresholds', B.BOND_LEVELS.every(l => B.bondLevel(l.min).level === l.level));
check('top level is Best buddy', B.bondLevel(10000).name === 'Best buddy' && B.bondProgress(10000).next === null);
check('progress toward next', (() => { const p = B.bondProgress(20); return p.level.level === 2 && p.next.level === 3 && p.into === 10 && p.need === 20 && p.pct === 0.5; })());
check('fed on time = double bond', B.bondGain(1, 4) === 6 && B.bondGain(3, 4) === 2);
check('fed when empty = single bond', B.bondGain(0, 4) === 4 && B.bondGain(0, 1) === 1);
check('no hearts refilled = no bond', B.bondGain(4, 4) === 0 && B.bondGain(3, 2) === 0);
check('coin value by level', [1, 2, 3, 4, 5].map(B.coinValue).join() === '1,1,2,2,3');
check('pet grows each level', B.petScale(1) === 1 && Math.abs(B.petScale(5) - 1.2) < 1e-9 && B.petScale(9) === B.petScale(5));
check('names are cleaned', B.cleanPetName('  Sir   Hops  a lot and more  ') === 'Sir Hops a lot a' && B.cleanPetName('   ') === '');
check('gift timing', B.giftReadyAt(null) === 0 && B.giftReadyAt(1000) === 1000 + B.GIFT_GAP_HOURS * 3600000);

// Daily cap: feeding on time every day can't beat 3 hearts a day.
const days = (() => { let bond = 0, d = 0; while (B.bondLevel(bond).level < 5) { bond += B.bondGain(1, 4); d++; } return d; })();
check('Best buddy takes ~3 weeks of on-time daily meals', days >= 20 && days <= 30, `${days} days`);

for (const l of B.BOND_LEVELS.slice(1)) {
  check(`SQL level ${l.level} at ${l.min} bond`, bondSql.includes(`when p_bond >= ${l.min}`) && new RegExp(`>= ${l.min}\\s+then ${l.level}`).test(bondSql));
}
check('SQL coin values', /v_value := case when v_level >= 5 then 3 when v_level >= 3 then 2 else 1 end/.test(bondSql)
  && B.coinValue(5) === 3 && B.coinValue(3) === 2);
check('SQL doubles bond only with a heart left', /\(case when v_before > 0 then 2 else 1 end\)/.test(bondSql));
check(`SQL gift = ${B.GIFT_POINTS} pts every ${B.GIFT_GAP_HOURS}h`, bondSql.includes(`v_pts  int := ${B.GIFT_POINTS}`)
  && bondSql.includes(`interval '${B.GIFT_GAP_HOURS} hours'`));
check(`SQL gift from level ${B.GIFT_LEVEL}, name from ${B.NAME_LEVEL}`,
  bondSql.includes(`_pet_level(coalesce(v_bond, 0)) < ${B.GIFT_LEVEL}`) && bondSql.includes(`_pet_level(coalesce(v_bond, 0)) < ${B.NAME_LEVEL}`));
check(`SQL name max ${B.NAME_MAX}`, bondSql.includes(`'g')), ${B.NAME_MAX})`));
check('SQL hearts match (8h each, max 4)', bondSql.includes('/ 28800.0') && 28800 === H.HEART_HOURS * 3600);
check('SQL food prices unchanged in feed_pet', H.FOODS.every(f => new RegExp(`p_food = '${f.id}' then v_cost := ${f.cost};\\s+v_hours := ${f.hearts * H.HEART_HOURS};`).test(bondSql)));

// ── The "getting hungry" reminder (local time) ─────────────────────────────
const at = (y, mo, d, h, mi = 0) => new Date(y, mo, d, h, mi).getTime();
const base = at(2026, 9, 15, 12);
// Fed at 6pm: last heart left at 6pm next day.
check('reminder when 1 heart is left', H.reminderAt(at(2026, 9, 15, 18) + H.FULL_MS, base) === at(2026, 9, 16, 18));
// Last heart at 2am: moves to 8am if that's still before empty (10am).
check('night reminder moves to the morning', H.reminderAt(at(2026, 9, 16, 2) + H.HEART_MS, base) === at(2026, 9, 16, 8));
// Last heart at 11pm, empty at 7am: morning is too late, so 9pm before.
check('or to the evening before', H.reminderAt(at(2026, 9, 16, 23) + H.HEART_MS, base) === at(2026, 9, 16, 21));
check('no reminder in the past', H.reminderAt(base + H.HEART_MS - 1000, base) === null && H.reminderAt(null, base) === null);

if (problems.length) {
  console.error(`check-pet-hunger: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-pet-hunger: all ${passed} checks passed.`);
