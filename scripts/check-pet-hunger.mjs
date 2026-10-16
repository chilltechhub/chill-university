// scripts/check-pet-hunger.mjs
//
// Checks the pet's hunger and bond rules (src/logic/petHunger.js, petBond.js):
// hearts empty one every 6 hours (a full bowl lasts a day), food never
// overfills, a full or broke player can't buy, bond doubles only when fed
// before empty, the reminder stays out of the night, and the SQL (feed_pet,
// collect_pet_coin, claim_pet_gift) charges, fills and pays the same as the
// app says.
//
// Run: node scripts/check-pet-hunger.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/petHunger.js', import.meta.url), 'utf8');
const H = await import('data:text/javascript,' + encodeURIComponent(src));
// The bowl's timing (pet_status, feed_pet, _pet_hearts) lives in the newest
// file, 20261015140000; bond levels, coins and gifts in 20261015130000.
const sql = await readFile(new URL('../supabase/migrations/20261015140000_pet_day_bowl.sql', import.meta.url), 'utf8');

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };

const now = Date.UTC(2026, 9, 15, 12);
const h = (n) => n * 60 * 60 * 1000;

const HH = H.HEART_HOURS;
check('a full bowl lasts one day (daily play)', H.FULL_MS === h(24) && H.MAX_HEARTS === 4 && HH === 6);
check('no clock yet reads as full', H.heartsLeft(null, now) === H.MAX_HEARTS);
check('just fed: every heart', H.heartsLeft(now + H.FULL_MS - 60000, now) === 4);
check(`one heart gone after ${HH}h`, H.heartsLeft(now + H.FULL_MS - h(HH), now) === 3);
check(`a heart stays until its ${HH}h are used`, H.heartsLeft(now + h(HH) + 1, now) === 2 && H.heartsLeft(now + h(HH), now) === 1);
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

check('next heart timing', H.msUntilNextHeartLost(now + h(HH + 2), now) === h(2)
  && H.msUntilNextHeartLost(now + h(2 * HH), now) === h(HH)
  && H.msUntilNextHeartLost(now - 1, now) === null);

// The server must charge and fill what the app shows.
for (const f of H.FOODS) {
  const hours = f.hearts * H.HEART_HOURS;
  const re = new RegExp(`p_food = '${f.id}' then v_cost := ${f.cost};\\s+v_hours := ${hours};`);
  check(`SQL ${f.id} costs ${f.cost} and fills ${hours}h`, re.test(sql));
}
check(`SQL full is ${H.MAX_HEARTS * HH}h`, sql.includes(`least(now() + interval '${H.MAX_HEARTS * HH} hours'`));
check('SQL new pet starts full', sql.includes(`values (v_uid, now() + interval '${H.MAX_HEARTS * HH} hours')`));
check('SQL "already full" = more than 3 hearts of time left',
  sql.includes(`v_full > now() + interval '${(H.MAX_HEARTS - 1) * HH} hours'`));
check('SQL cuts old 32h bowls back to a day', sql.includes(`where full_until > now() + interval '${H.MAX_HEARTS * HH} hours'`));

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

// A meal once a day with a heart still left: 3 hearts × 2 = 6 bond a day.
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
check(`SQL hearts match (${HH}h each, max 4)`, sql.includes(`/ ${HH * 3600}.0`));
check('SQL feed_pet keeps the bond rules', /\(case when v_before > 0 then 2 else 1 end\)/.test(sql)
  && sql.includes("'gained', v_gain"));

// ── The "getting hungry" reminder (local time) ─────────────────────────────
const at = (y, mo, d, h, mi = 0) => new Date(y, mo, d, h, mi).getTime();
const base = at(2026, 9, 15, 12);
// Fed at 6pm: empty at 6pm next day, last heart left at noon.
check('reminder when 1 heart is left', H.reminderAt(at(2026, 9, 15, 18) + H.FULL_MS, base) === at(2026, 9, 16, 12));
// Last heart at 3am: moves to 8am if that's still before empty (9am).
check('night reminder moves to the morning', H.reminderAt(at(2026, 9, 16, 3) + H.HEART_MS, base) === at(2026, 9, 16, 8));
// Last heart at 11pm, empty at 5am: morning is too late, so 9pm before.
check('or to the evening before', H.reminderAt(at(2026, 9, 16, 23) + H.HEART_MS, base) === at(2026, 9, 16, 21));
check('no reminder in the past', H.reminderAt(base + H.HEART_MS - 1000, base) === null && H.reminderAt(null, base) === null);

if (problems.length) {
  console.error(`check-pet-hunger: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-pet-hunger: all ${passed} checks passed.`);
