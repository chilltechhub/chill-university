// scripts/check-search.mjs
//
// Checks the search matcher (src/logic/fuzzyMatch.js): exact text still
// wins, words match in any order, and one typo in a longer word is forgiven
// without matching nonsense.
//
// Run: node scripts/check-search.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/fuzzyMatch.js', import.meta.url), 'utf8');
const F = await import('data:text/javascript,' + encodeURIComponent(src));

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const score = (q, t, s) => F.matchScore(q, t, s);

check('exact beats starts-with beats contains',
  score('planner', 'Planner') > score('plan', 'Planner') && score('plan', 'Planner') > score('lann', 'Planner'));
check('words in any order', score('bills rent', 'Rent and bills') > 0);
check('word starts count', score('know vault', 'Knowledge Vault') > 0);
check('one typo forgiven', score('plannr', 'Planner') > 0 && score('wokshop', 'The Workshop') > 0);
check('short words need to match exactly', score('cat', 'Car') === 0);
check('nonsense matches nothing', score('zebra', 'Planner', 'Your days') === 0);
check('subtitle only ranks below title', score('habits', 'Planner', 'Your days, habits and to-dos') < score('habits', 'Habits'));
check('typo ranks below a clean match', score('plannr', 'Planner') < score('plan', 'Planner'));
check('empty query is 0', score('', 'Planner') === 0);

if (problems.length) {
  console.error(`check-search: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-search: all ${passed} checks passed.`);
