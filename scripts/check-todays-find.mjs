// scripts/check-todays-find.mjs
// Today's Find's rules (src/logic/todaysFind.js): one a day, the same one
// all day, the person's own areas first, never one they've tried or waved
// off, and only a few "Not for me"s a day (never a feed).
import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/todaysFind.js', import.meta.url), 'utf8');
const F = await import('data:text/javascript,' + encodeURIComponent(src));

const problems = [];
let count = 0;
const check = (name, ok, detail) => { count += 1; if (!ok) problems.push(`${name}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`); };

const FINDS = [
  { id: 'g1', areaId: 'general', title: 'Wikipedia', url: 'https://wikipedia.org' },
  { id: 'f1', areaId: 'financial', title: 'Budget tool', url: 'https://example.org/budget' },
  { id: 'f2', areaId: 'financial', title: 'Savings guide', url: 'https://example.org/save' },
  { id: 'p1', areaId: 'physical', title: 'Workout plan', url: 'https://example.org/move' },
  { id: 'd1', areaId: 'digital', title: 'Password manager', url: 'https://example.org/pw' },
  { id: 'x1', areaId: 'creative', title: 'No link' },
];

// ── Same day, same pick ────────────────────────────────────────────────────
{
  const a = F.pickTodaysFind(FINDS, { day: '2026-10-18', seed: 'u1' });
  const b = F.pickTodaysFind([...FINDS].reverse(), { day: '2026-10-18', seed: 'u1' });
  check('same day + person: same Find, whatever the list order', F.findKey(a) === F.findKey(b), [F.findKey(a), F.findKey(b)]);
  const days = new Set(Array.from({ length: 14 }, (_, i) => F.findKey(F.pickTodaysFind(FINDS, { day: `2026-10-${10 + i}`, seed: 'u1' }))));
  check('it changes across days', days.size > 1, [...days]);
  check('never a Find without a link', !days.has('x1'));
}

// ── Own areas first ───────────────────────────────────────────────────────
{
  for (let i = 0; i < 20; i++) {
    const f = F.pickTodaysFind(FINDS, { day: `2026-11-${10 + i}`, seed: 'u2', areas: ['financial'] });
    check(`areas: day ${i} picks financial or general`, ['financial', 'general'].includes(f.areaId), f);
  }
  const none = F.pickTodaysFind(FINDS, { day: '2026-10-18', seed: 'u2', areas: ['spiritual'] });
  check('areas: none match → general still counts', none.areaId === 'general', none);
  const empty = F.pickTodaysFind([{ id: 'p1', areaId: 'physical', url: 'x' }], { day: 'd', areas: ['financial'] });
  check('areas: nothing fits → anything', empty && empty.id === 'p1', empty);
}

// ── Tried and waved off are skipped ────────────────────────────────────────
{
  const all = FINDS.filter(f => f.url).map(F.findKey);
  const skipAllButOne = all.filter(k => k !== 'd1');
  const f = F.pickTodaysFind(FINDS, { day: '2026-10-18', seed: 'u3', skip: skipAllButOne });
  check('skip: the only one left is picked', f && f.id === 'd1', f);
  check('skip: everything skipped → null', F.pickTodaysFind(FINDS, { day: 'd', skip: all }) === null);
}

// ── State: tried keeps the card, declines are capped ───────────────────────
{
  const day = '2026-10-18';
  let s = F.readFindState('not json');
  check('state: junk reads as empty', s.tried.length === 0 && s.declines === 0);
  s = F.withTried(s, FINDS[1], day);
  check('tried: remembered, and today stays on it', s.tried.includes('f1') && s.triedDay === day && s.triedKey === 'f1', s);
  let d = F.readFindState(null);
  for (let i = 0; i < F.DECLINES_PER_DAY; i++) d = F.withDecline(d, FINDS[i], day);
  check('declines: capped per day', F.declinesLeft(d, day) === 0, d);
  check('declines: a new day resets the count', F.declinesLeft(d, '2026-10-19') === F.DECLINES_PER_DAY);
  const next = F.withDecline(d, FINDS[4], '2026-10-19');
  check('declines: next day counts from 1, keeps the old ones', next.declines === 1 && next.declined.length === F.DECLINES_PER_DAY + 1, next);
}

if (problems.length) {
  console.error(`Today's Find: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`Today's Find OK: ${count} checks (one a day, own areas first, tried/declined skipped, declines capped).`);
