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

// ── Deliverables (src/logic/deliverables.js) and the units (src/data/units.js), P6 ──
{
  const asUrl = (code) => 'data:text/javascript,' + encodeURIComponent(code);
  const D = await import(asUrl(await text('src/logic/deliverables.js')));
  const U = await import(asUrl(await text('src/data/units.js')));
  const B = await import(asUrl(await text('src/data/builds.js')));
  const kinds = new Set(B.BUILD_KINDS.map(k => k.id));

  // Every unit is complete enough to walk and hand in.
  for (const u of U.UNITS) {
    const d = u.deliverable || {};
    check(`unit ${u.id}: three self-check lines`, (d.rubric || []).length === 3, d.rubric);
    check(`unit ${u.id}: a deliverable kind`, ['build', 'checklist', 'reflection', 'test'].includes(d.kind), d.kind);
    if (d.kind === 'build') check(`unit ${u.id}: its Build kind exists`, kinds.has(d.buildKind), d.buildKind);
    if (d.kind === 'checklist') check(`unit ${u.id}: checklist items`, (d.items || []).length >= 2);
    if (d.kind === 'reflection' || d.kind === 'test') check(`unit ${u.id}: prompts`, (d.prompts || []).length >= 2);
    const signals = [...u.beats.map(b => U.beatSignal(u, b)), U.handInSignal(u)];
    check(`unit ${u.id}: no two steps share a signal`, new Set(signals).size === signals.length, signals);
    check(`unit ${u.id}: every beat says something short`, u.beats.every(b => b.says && b.says.split(/\s+/).length <= 40));
    // Bold is **pairs**: an odd count, or a star inside a bold run (O*NET),
    // shows raw asterisks (stress test 2026-10-24).
    check(`unit ${u.id}: bold marks pair up`, u.beats.every(b => (b.says.match(/\*\*/g) || []).length % 2 === 0 && !/\*\*[^*]*\*[^*]+\*\*/.test(b.says)));
    check(`unit ${u.id}: every source has a review date`, (u.sources || []).every(s => s.url && s.reviewed && s.license));
  }
  // Map cards: the same template every time, every fact sourced and dated
  // (plan §4.2). maps.js imports the review date from units.js: inline it.
  {
    const mapsSrc = (await text('src/data/maps.js')).replace("from './units'", `from "${asUrl(await text('src/data/units.js'))}"`);
    const M = await import(asUrl(mapsSrc));
    for (const [key, map] of Object.entries(M.MAPS)) {
      for (const card of map.cards) {
        check(`map ${key}/${card.id}: the whole template`, ['what', 'takes', 'costs', 'leadsTo', 'firstStep'].every(f => typeof card[f] === 'string' && card[f].trim()), card.id);
        // A card that states no facts (the gap year) needs no source; one
        // that links out does.
        check(`map ${key}/${card.id}: sourced, licensed, dated`, (!card.link || (card.sources || []).length > 0) && (card.sources || []).every(x => /^https:\/\//.test(x.url) && x.license && /^\d{4}-\d{2}-\d{2}$/.test(x.reviewed)));
      }
    }
    check('maps: every beat that names a map has one', U.UNITS.every(u => u.beats.every(b => !b.map || M.MAPS[b.map])));
  }
  // Credits: every source a unit names is a real link with a licence.
  check('sources: https, a licence, a date', U.UNITS.flatMap(u => u.sources || []).every(x => /^https:\/\//.test(x.url) && x.license && /^\d{4}-\d{2}-\d{2}$/.test(x.reviewed)));
  // Every unit step can tick: a signal of its own or a Done button's (the
  // guide would wait forever on one that can't, plan P7 risks).
  check('unit objectives: every step has a signal or an auto rule', U.UNIT_OBJECTIVES.every(o => o.steps.every(st => st.signal || st.auto)));
  // Guided units (src/logic/guide/lessons/unitLesson.js, P7): generated from
  // each unit's data, four steps the first time with a real quiz last, one
  // note after that; a Build's quiz is its first part's own check.
  {
    const L = await import(asUrl(await text('src/logic/guide/lessons/unitLesson.js')));
    const W = await import(asUrl((await text('src/logic/guide/lessons/welcomeProject.js')).replace("from './unitLesson'", `from "${asUrl(await text('src/logic/guide/lessons/unitLesson.js'))}"`)));
    const kindsById = Object.fromEntries(B.BUILD_KINDS.map(k => [k.id, k]));
    for (const u of U.UNITS) {
      const kind = kindsById[u.deliverable?.buildKind] || null;
      const walk = L.unitLesson(u, { first: true, kind });
      const q = walk[walk.length - 1]?.quiz;
      check(`guided unit ${u.id}: four steps, quiz last`, walk.length === 4 && !!q && q.options.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.options.length);
      if (kind) check(`guided unit ${u.id}: the quiz is the Build's own check`, q.question === kind.parts[0].lesson.check.q);
      const later = L.unitLesson(u, { first: false });
      check(`guided unit ${u.id}: later, one note`, later.length === 1 && later[0].nonBlocking && later[0].title.includes(u.deliverable.title));
    }
    for (const k of B.BUILD_KINDS) {
      const w = W.welcomeProjectLesson({ kind: k });
      check(`welcome lesson ${k.id}: generated, the spots kept, quiz last`, w[0].id === 'welcome-project-preview' && w[1].id === 'welcome-project-look' && w[2].id === 'welcome-project-bar' && !!w[3]?.quiz);
    }
  }
  // Sharing (P8): the feedback shape, the Showcase item, the ask, the links.
  {
    const T0 = '2026-10-23T10:00:00.000Z';
    const u = U.UNIT_BY_ID['unit-like-2'];
    let fd = D.handIn(D.touch(D.newDeliverable(u, T0), { content: { 0: 'Archive.org', 1: 'A sketch class', 2: 'A beat' }, checks: [true, true, true] }, T0), T0);
    fd = D.addFeedback(fd, { who: 'My aunt', said: 'More beats', change: 'Make two more' }, T0);
    check('feedback: who, said, change, changed, at', ['who', 'said', 'change', 'changed', 'at'].every(k => k in fd.feedback[0]) && fd.feedback[0].changed === false);
    fd = D.markChanged(fd, 0, true, T0);
    const item = D.showcaseItem(fd, u, { pathLabel: 'What do I like?' });
    check('showcase item: the answers, not the empty ones', item.answers.length === 3 && item.answers[0].q === u.deliverable.prompts[0]);
    check('showcase item: feedback carried, changed ticked', item.feedback[0].changed === true && item.status === 'Reviewed');
    check('handed-in work only, newest first', D.handedInWork([fd, D.newDeliverable(U.UNIT_BY_ID['unit-like-3'], T0)]).length === 1);
    const ask = D.askFeedbackText(fd, u);
    check('ask for feedback: three things from the self-check', u.deliverable.rubric.every(line => ask.includes(line)) && /What would you change\?/.test(ask));
    check('feedback line: "2 people looked"', D.feedbackLine(D.addFeedback(fd, { who: 'Jo', said: 'Ok' }, T0)) === '2 people looked' && D.feedbackLine(D.newDeliverable(u, T0)) === null);
    const L = await import(asUrl(await text('src/logic/shareLinks.js')));
    const tok = 'a'.repeat(64);
    check('share links: /s/<token> reads the token', L.tokenFromPath(`/s/${tok}`) === tok && L.tokenFromPath(`/s/${tok}/`) === tok);
    check('share links: anything else is not a link', [null, '/s/', '/s/abc', `/s/${tok}x`, `/x/${tok}`, `/s/${'A'.repeat(64)}`].every(p => L.tokenFromPath(p) === null));
    check('share links: the address', L.shareUrlFor('https://example.org/', tok) === `https://example.org/s/${tok}` && L.shareUrlFor(null, tok) === null && L.shareUrlFor('https://x.org', 'bad') === null);
  }
  // Junk in, no crash and no "undefined" out (stress test 2026-10-24).
  {
    const ud = U.UNIT_BY_ID['unit-like-2'];
    const label = (aimFor, today = '2026-10-24') => D.aimForLabel({ aimFor, status: 'doing' }, today);
    check('aim-for: a date that is not a real day says nothing', [ '2026-13-45', '2026-00-10', 'x', 12, {}, null ].every(v => label(v) === null));
    check('aim-for: a bad "today" still names the date', label('2026-11-03', undefined) === 'Aim: Nov 3');
    check('status: no deliverable is To do', D.statusLabel(null) === 'To do' && D.statusLabel(undefined) === 'To do');
    check('showcase item: junk feedback is dropped', D.showcaseItem({ ...D.newDeliverable(ud, '2026-10-24T00:00:00Z'), feedback: 'nope' }, ud).feedback.length === 0);
  }
  check('units: each one opens the Showcase when done', U.UNIT_OBJECTIVES.every(o => o.unlocks.includes('portfolio')));
  const ids = new Set(U.UNITS.map(u => u.id));
  check('units: ids are unique', ids.size === U.UNITS.length);
  check('units: each path has five, Ground one per area', ['like', 'next', 'money', 'career'].every(p => U.unitsForPath(p).length === 5) && U.unitsForPath('ground').length === 8);
  check('units: GED comes first on What\'s next for the GED start', U.unitsForPath('next', { startPoint: 'ged' })[0].id === 'unit-ged-1' && U.unitsForPath('next', { startPoint: 'ged' }).length === 10);
  const byId = Object.fromEntries(U.UNIT_OBJECTIVES.map(o => [o.id, o]));
  check('unit objectives: each unit chains to the next on its path', byId['unit-money-1'].next === 'unit-money-2' && byId['unit-money-5'].next === null && byId['unit-career-5'].next === null);
  check('unit objectives: GED leads into What\'s next', byId['unit-ged-5'].next === 'unit-next-1');
  check('unit objectives: the last step is the hand-in', U.UNIT_OBJECTIVES.every(o => o.steps[o.steps.length - 1].signal === `deliverable-handed-in:${o.id}`));
  check('unit objectives: every next names a real unit', U.UNIT_OBJECTIVES.every(o => !o.next || ids.has(o.next)));

  // The deliverable rules.
  const money2 = U.UNIT_BY_ID['unit-money-2'];
  let d = D.newDeliverable(money2, '2026-10-22T10:00:00Z');
  check('new: To do, nothing ticked', d.status === 'todo' && d.checks.length === 3 && d.checks.every(c => !c) && d.id === 'dlv-unit-money-2');
  check('new: not ready to hand in', !D.canHandIn(d, money2) && D.handInMissing(d, money2).length === 2);
  d = D.touch(d, { ref: 'build-1' }, '2026-10-22T11:00:00Z');
  check('touch: making the Build moves it to Doing', d.status === 'doing');
  d = D.touch(d, { checks: [true, true, false] });
  check('self-check: one line left blocks the hand-in', !D.canHandIn(d, money2) && D.handInMissing(d, money2)[0] === 'Tick 1 more on the self-check');
  d = D.touch(d, { checks: [true, true, true] });
  check('ready: work plus every check', D.canHandIn(d, money2));
  const handed = D.handIn(d, '2026-10-23T09:00:00Z');
  check('hand in: status and snapshot', handed.status === 'handed' && handed.snapshotAt === '2026-10-23T09:00:00Z' && D.statusLabel(handed) === 'Handed in');
  check('hand in: once', !D.canHandIn(handed, money2));
  const shown = D.show(handed, '2026-10-24T09:00:00Z');
  check('show: only after hand-in', shown.status === 'shown' && D.show(D.newDeliverable(money2), 'x').status === 'todo');
  const fb = D.addFeedback(shown, { who: 'my aunt', said: 'Make the goal bigger', change: 'Raise it' }, '2026-10-25T09:00:00Z');
  check('feedback: Reviewed once someone looked', D.statusLabel(fb) === 'Reviewed' && fb.feedback.length === 1);
  check('feedback: an empty note is ignored', D.addFeedback(shown, { who: ' ', said: '' }).feedback.length === 0);
  const changed = D.markChanged(fb, 0);
  {
    const u = U.UNIT_BY_ID['unit-money-1'];
    const fresh = D.newDeliverable(u, '2026-10-23T00:00:00Z');
    check('deliverableStep: a fresh one is 0 done, so not "halfway"', D.deliverableStep(fresh, u).done === 0);
    const half = D.touch(fresh, { checks: [true, false, false] }, '2026-10-23T00:00:00Z');
    const st = D.deliverableStep(half, u);
    check('deliverableStep: counts the work and each self-check line', st.done === 1 && st.total === 1 + u.deliverable.rubric.length, JSON.stringify(st));
    check('deliverableStep: opens its unit', st.open.screen === 'UnitScreen' && st.open.params.unitId === u.id);
    check('deliverableStep: halfway work is the next step', N.nextStep({ deliverable: st, objective }).kind === 'deliverable');
  }
  check('feedback: I changed it', D.deliverableCounts([changed]).changed === 1 && D.deliverableCounts([changed]).looked === 1);

  const ref = U.UNIT_BY_ID['unit-like-2'];
  let r = D.newDeliverable(ref);
  r = D.touch(r, { content: { 0: 'Tried a beat maker' } });
  check('reflection: writing moves it to Doing, all lines needed', r.status === 'doing' && !D.workDone(r, ref));
  r = D.touch(r, { content: { 0: 'a', 1: 'b', 2: 'c' } });
  check('reflection: every line filled is the work', D.workDone(r, ref));
  const list = U.UNIT_BY_ID['unit-money-1'];
  let c = D.newDeliverable(list);
  c = D.touch(c, { content: { 0: true, 1: true } });
  check('checklist: every item ticked', !D.workDone(c, list) && D.workDone(D.touch(c, { content: { 0: true, 1: true, 2: true } }), list));

  const late = { ...D.newDeliverable(money2), aimFor: '2026-10-01' };
  check('aim-for: past is Still open, never overdue', D.aimForLabel(late, TODAY) === 'Still open');
  check('aim-for: today and later', D.aimForLabel({ ...late, aimFor: TODAY }, TODAY) === 'Aim: today' && D.aimForLabel({ ...late, aimFor: '2026-11-03' }, TODAY) === 'Aim: Nov 3');
  check('aim-for: handed-in work has no date nag', D.aimForLabel({ ...handed, aimFor: '2026-10-01' }, TODAY) === null);

  const board = D.boardOf([d, handed, D.newDeliverable(ref), shown]);
  check('board: four columns', board.todo.length === 1 && board.doing.length === 1 && board.handed.length === 1 && board.shown.length === 1);
  check('in flight: Doing first', D.inFlight([D.newDeliverable(ref), d], 'unit-like-2').id === d.id);
  check('in flight: else To do on the active unit', D.inFlight([D.newDeliverable(ref)], 'unit-like-2').unitKey === 'unit-like-2' && D.inFlight([], 'x') === null);
  check('progress: halfway reads as halfway', Math.abs(D.progressOf(D.touch(D.newDeliverable(money2), { ref: 'b', checks: [true, false, false] }), money2) - 0.5) < 0.01);

  const ms = D.milestones({ deliverables: [changed], units: [{ id: 'unit-money-1', at: '2026-10-20T00:00:00Z' }], tastes: [{ at: '2026-10-01' }, { at: '2026-10-02' }, { at: '2026-10-03' }] });
  check('milestones: firsts with dates, in order', ms.map(m => m.key).join() === 'three-tastes,first-unit,first-handed,first-shown,first-feedback', ms.map(m => m.key));
  check('milestones: no counts to chase', ms.every(m => !/\d+ (points|xp|level)/i.test(m.label)));
  check('normalize: junk is dropped', D.normalizeDeliverable(null) === null && D.normalizeDeliverable({ id: 'x', status: 'weird', aimFor: 'soon' }).status === 'todo' && D.normalizeDeliverable({ id: 'x', aimFor: 'soon' }).aimFor === null);
}

if (problems.length) {
  console.error(`check-deliverables: ${problems.length} problem(s)`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-deliverables: ${passed} checks passed (next step).`);
