// scripts/check-deliverables.mjs
// The rules behind Today's one next step (src/logic/nextStep.js), and later
// deliverables and receipts (docs/shake-up-plan-2026-10-21.md §11: this is
// the plan's check-deliverables). Run: node scripts/check-deliverables.mjs
// (or `npm run check`).

import { readFile } from 'node:fs/promises';

const text = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const N = await import('data:text/javascript,' + encodeURIComponent(await text('src/logic/nextStep.js')));

const problems = [];
let passed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else problems.push(`${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`); };

const TODAY = '2026-10-22';
const objective = { active: true, complete: false, label: 'First Steps', done: 1, total: 3, nextStep: { label: 'Log one thing', screen: 'LibraryScreen' } };
const due = [{ title: 'Essay', date: '2026-10-24' }, { title: 'Form', date: '2026-10-22' }];

// ── Priority ────────────────────────────────────────────────────────────
{
  const all = {
    now: { title: 'Dentist', kind: 'now' },
    deliverable: { title: 'Money sheet', step: 'Add your income', done: 1, total: 4 },
    unit: { title: 'Unit 2', step: { label: 'Read the lesson' } },
    objective, due, drill: { due: true }, firstGoal: { label: 'First Steps' }, today: TODAY,
  };
  const order = ['now', 'deliverable', 'unit', 'objective', 'due', 'drill', 'first', 'path'];
  const drop = { now: 'now', deliverable: 'deliverable', unit: 'unit', objective: 'objective', due: 'due', drill: 'drill', first: 'firstGoal' };
  let inputs = { ...all };
  for (const kind of order) {
    const got = N.nextStep(inputs);
    check(`priority: ${kind} wins over what's left`, got.kind === kind, got.kind);
    if (drop[kind]) { inputs = { ...inputs }; delete inputs[drop[kind]]; }
  }
}

// ── Each kind says what to do ───────────────────────────────────────────
{
  const o = N.nextStep({ objective });
  check('objective: the next unticked step, with the goal as the why', o.title === 'Log one thing' && o.why === 'First Steps' && o.progress.done === 1 && o.progress.total === 3);
  check('objective: opens the step\'s screen', o.action.type === 'open' && o.action.screen === 'LibraryScreen');
  const c = N.nextStep({ objective: { ...objective, complete: true } });
  check('claim: a finished goal asks to be finished', c.kind === 'claim' && c.action.type === 'claim' && c.progress.done === 3);
  check('claim beats due items', N.nextStep({ objective: { ...objective, complete: true }, due }).kind === 'claim');
  const d = N.nextStep({ due, today: TODAY });
  check('due: today first', d.title === 'Form' && d.label === 'Due today', d);
  check('due: an older open item says still open, never overdue', N.nextStep({ due: [{ title: 'Old', date: '2026-10-20' }], today: TODAY }).label === 'Still open');
  check('due: tomorrow', N.dueWhen('2026-10-23', TODAY) === 'Due tomorrow');
  check('due: within a week names the day', /^Due [A-Z][a-z]+day$/.test(N.dueWhen('2026-10-26', TODAY)), N.dueWhen('2026-10-26', TODAY));
  check('due: later names the date', N.dueWhen('2026-11-20', TODAY) === 'Due Nov 20');
  check('deliverable: not started is not "halfway"', N.nextStep({ deliverable: { title: 'X', done: 0, total: 4 }, objective }).kind === 'objective');
  check('deliverable: finished is not next', N.nextStep({ deliverable: { title: 'X', done: 4, total: 4 }, objective }).kind === 'objective');
  check('first: offers the first goal with its estimate', N.nextStep({ firstGoal: { label: 'First Steps', estimate: 'About 5 minutes' } }).action.label === 'Start · about 5 minutes');
  const p = N.nextStep({});
  check('nothing at all: pick a path', p.kind === 'path' && p.action.type === 'path');
  check('a soon plan counts as now', N.nextStep({ now: { title: 'Gym', kind: 'soon' } }).label === 'Coming up');
  check('an unknown now-kind is ignored', N.nextStep({ now: { title: 'X', kind: 'rest' }, objective }).kind === 'objective');
  check('junk inputs don\'t throw', N.nextStep({ due: [null, { title: '' }], objective: { active: true } }).kind === 'path');

  // The top bar's path chip (P4): the goal in flight until units exist.
  const chip = N.pathChip({ active: true, label: 'First Steps', done: 1, total: 4 });
  check('chip: the goal, its step, the bar', chip.label === 'First Steps' && chip.sub === 'Step 2 of 4' && chip.pct === 25 && !chip.empty);
  check('chip: no goal invites a start', N.pathChip(null).label === 'Pick where to start' && N.pathChip({ active: false }).empty);
  const claim = N.pathChip({ active: true, complete: true, label: 'X', done: 3, total: 3 });
  check('chip: a finished goal says claim it, bar full', claim.sub === 'Done · claim it' && claim.pct === 100);
  check('chip: junk counts are clamped', N.pathChip({ active: true, label: 'X', done: 9, total: 2 }).pct === 100 && N.pathChip({ active: true, label: 'X', done: -1, total: 0 }).pct === 0);
}

if (problems.length) {
  console.error(`check-deliverables: ${problems.length} problem(s)`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-deliverables: ${passed} checks passed (next step).`);
