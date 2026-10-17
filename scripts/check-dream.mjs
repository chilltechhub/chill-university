// scripts/check-dream.mjs
// The Dream layer's rules (src/logic/dream.js): rough is fine, every field
// optional, old versions kept, and drafts never overwrite what someone wrote.
import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/dream.js', import.meta.url), 'utf8');
const D = await import('data:text/javascript,' + encodeURIComponent(src));

const problems = [];
let count = 0;
const check = (name, ok, detail) => { count += 1; if (!ok) problems.push(`${name}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`); };

// ── Shape ────────────────────────────────────────────────────────────────
{
  const e = D.emptyDream();
  check('empty: is empty', D.isDreamEmpty(e));
  check('normalize: junk is empty', D.isDreamEmpty(D.normalizeDream('nope')) && D.isDreamEmpty(D.normalizeDream(null)));
  const n = D.normalizeDream({
    life: '  A small farm.\nHome by 5.  ',
    parts: ['the farm', 'The Farm', '  steady money ', '', 'time with my kids', 'a fourth'],
    values: ['freedom', 'family', 'freedom', 'building', 'learning'],
    wontTrade: ['Sundays with my kids', ''],
    becoming: '  someone   who finishes things ',
    draftedFrom: 'hacker',
  });
  check('normalize: life keeps its line break, trims ends', n.life === 'A small farm.\nHome by 5.', n.life);
  check('normalize: parts deduped (case), blank dropped, capped at 3', n.parts.map(p => p.label).join('|') === 'the farm|steady money|time with my kids', n.parts);
  check('normalize: every part has an id', n.parts.every(p => typeof p.id === 'string' && p.id.length > 3));
  check('normalize: values deduped, capped at 3', n.values.join('|') === 'freedom|family|building', n.values);
  check('normalize: won\'t trade drops blanks', n.wontTrade.length === 1);
  check('normalize: spaces squeezed', n.becoming === 'someone who finishes things', n.becoming);
  check('normalize: unknown draftedFrom dropped', n.draftedFrom === null);
  const again = D.normalizeDream(n);
  check('normalize: part ids stay put', again.parts.map(p => p.id).join() === n.parts.map(p => p.id).join());
}

// ── Edits keep the old version ────────────────────────────────────────────
{
  const t1 = '2026-10-17T10:00:00.000Z', t2 = '2026-10-18T10:00:00.000Z', t3 = '2026-10-19T10:00:00.000Z';
  const first = D.applyDreamEdit(D.emptyDream(), { life: 'A small farm.' }, 'onboarding', t1);
  check('edit: first save stamps time and source', first.updatedAt === t1 && first.draftedFrom === 'onboarding', first);
  check('edit: an empty "before" is not kept', first.history.length === 0, first.history);
  const second = D.applyDreamEdit(first, { life: 'A small farm. I fix things for neighbors.' }, 'typed', t2);
  check('edit: change keeps the old version', second.history.length === 1 && second.history[0].life === 'A small farm.' && second.history[0].savedAt === t1, second.history);
  check('edit: first source stays', second.draftedFrom === 'onboarding');
  const same = D.applyDreamEdit(second, { life: 'A small farm. I fix things for neighbors.' }, 'typed', t3);
  check('edit: saving unchanged adds nothing', same.history.length === 1 && same.updatedAt === t2, same);
  let d = second;
  for (let i = 0; i < 30; i += 1) d = D.applyDreamEdit(d, { becoming: `someone ${i}` }, 'typed', `2026-11-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`);
  check('edit: history capped', d.history.length === D.MAX_HISTORY, d.history.length);
  const parted = D.applyDreamEdit(second, { parts: ['the farm'] }, 'typed', t3);
  const relabel = D.applyDreamEdit(parted, { parts: [{ ...parted.parts[0], label: 'the homestead' }] }, 'typed', t3);
  check('edit: renaming a part keeps its id', relabel.parts[0].id === parted.parts[0].id && relabel.parts[0].label === 'the homestead');
}

// ── Wayfinder drafts fill only what's empty ──────────────────────────────
{
  const wf = {
    values: ['freedom', 'family', 'building', 'learning'],
    statement: { self: 'stays calm when things get hectic' },
    life: { zones: ['financial', 'social'], wants: { financial: 'not stressing every month', social: 'a couple of close friends' } },
  };
  const zone = (id) => ({ financial: 'Money at home', social: 'Friends, family & love' }[id] || id);
  const draft = D.draftFromWayfinder(D.emptyDream(), wf, zone);
  check('draft: top 3 values', draft?.values?.join('|') === 'freedom|family|building', draft);
  check('draft: becoming from "I\'m someone who"', draft?.becoming === 'someone who stays calm when things get hectic', draft?.becoming);
  check('draft: parts from life wants', draft?.parts?.join('|') === 'not stressing every month|a couple of close friends', draft?.parts);
  check('draft: names the zones it used', draft?.zoneNames?.join('|') === 'Money at home|Friends, family & love', draft?.zoneNames);
  const mine = D.normalizeDream({ values: ['faith'], becoming: 'someone who finishes things', parts: ['the farm'] });
  check('draft: never overwrites their own words', D.draftFromWayfinder(mine, wf, zone) === null);
  check('draft: nothing to offer from an empty map', D.draftFromWayfinder(D.emptyDream(), {}, zone) === null);
  const applied = D.applyDreamEdit(D.emptyDream(), draft, 'wayfinder', '2026-10-17T00:00:00.000Z');
  check('draft: applies cleanly (zoneNames not stored)', applied.values.length === 3 && applied.parts.length === 2 && !('zoneNames' in applied) && applied.draftedFrom === 'wayfinder', applied);
}

if (problems.length) {
  console.error(`check-dream: ${problems.length} of ${count} failed`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-dream: all ${count} checks passed.`);
