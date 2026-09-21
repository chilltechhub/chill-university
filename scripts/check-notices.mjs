// scripts/check-notices.mjs
//
// Checks the Notification Center's "Now" list (src/logic/notices.js): each
// kind of notice appears when its reason exists and not otherwise, the caps
// hold (it must stay a short list), dismiss / snooze / category switches hide
// what they should for as long as they should, quiet hours wrap midnight,
// and the one daily phone nudge never picks news, setup or the "up next" plan.
//
// Run: node scripts/check-notices.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/notices.js', import.meta.url), 'utf8');
const N = await import('data:text/javascript,' + encodeURIComponent(src));

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const ids = (list) => list.map(n => n.id.split(':')[0]);
const show = (x) => JSON.stringify(x);

// Monday Sept 21 2026, 2:00 PM local.
const NOW = new Date(2026, 8, 21, 14, 0);
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();
const ENV = { now: NOW, autoRemind: 15, notifyPermission: 'granted', wantsPhone: true, phoneCapable: true };
const build = (data, env = {}) => N.buildNotices(data, { ...ENV, ...env });

// ── Plans & tasks ───────────────────────────────────────────────────────────
{
  const planner = [
    { id: 'p1', title: 'Gym', date: '2026-09-19' },
    { id: 'p2', title: 'Read', date: '2026-09-20', completed: true },
    { id: 'p3', title: 'Old thing', date: '2026-09-01' },
    { id: 'p4', title: 'Call Sam', date: '2026-09-21', start_time: '15:30' },
    { id: 'p5', title: 'Dinner', date: '2026-09-21', start_time: '19:00' },
  ];
  const out = build({ planner, tasks: [{ id: 't1', title: 'Essay', due_date: '2026-09-18', completed: false }] });
  const overdue = out.find(n => n.id.startsWith('plan-overdue'));
  check('overdue: only open, within a week', show(overdue?.primary.payload) === show(['p1']), show(overdue));
  check('overdue: has AI help', overdue?.ai?.target === 'planner');
  const next = out.find(n => n.id.startsWith('plan-next'));
  check('next: the 3:30 plan', next?.id === 'plan-next:p4' && /3:30 PM/.test(next.title), show(next));
  check('next: mentions what follows', /Dinner/.test(next?.body || ''));
  check('tasks overdue', out.some(n => n.id.startsWith('tasks-overdue')));

  const far = build({ planner: [{ id: 'p9', title: 'Late', date: '2026-09-21', start_time: '20:00' }] });
  check('next: nothing more than 3h out', !far.some(n => n.id.startsWith('plan-next')), show(ids(far)));
}

// ── Projects: next step, ship, quiet, cap of three ─────────────────────────
{
  const projects = [
    { id: 'a', title: 'No next', status: 'active', next_action: null, created_at: daysAgo(2), updated_at: daysAgo(1), taskTotal: 2, taskDone: 0 },
    { id: 'b', title: 'All done', status: 'active', next_action: 'x', created_at: daysAgo(20), updated_at: daysAgo(1), taskTotal: 3, taskDone: 3 },
    { id: 'c', title: 'Quiet', status: 'active', next_action: 'Buy wood', created_at: daysAgo(30), updated_at: daysAgo(10), taskTotal: 4, taskDone: 1 },
    { id: 'd', title: 'Fresh', status: 'active', next_action: 'Sketch', created_at: daysAgo(3), updated_at: daysAgo(2), taskTotal: 1, taskDone: 0 },
    { id: 'e', title: 'Another no-next', status: 'active', next_action: '', created_at: daysAgo(3), updated_at: daysAgo(2), taskTotal: 0, taskDone: 0 },
    { id: 'f', title: 'Shipped', status: 'completed', next_action: null, created_at: daysAgo(3), updated_at: daysAgo(2), taskTotal: 0, taskDone: 0 },
  ];
  const out = build({ projects }).filter(n => n.cat === 'projects');
  check('projects: capped at three', out.length === 3, show(ids(out)));
  check('projects: no-next first', out[0].id.startsWith('project-next'), show(out.map(n => n.id)));
  check('projects: fresh one with a next step says nothing', !out.some(n => n.id.endsWith(':d')));
  check('projects: finished projects ignored', !out.some(n => n.id.endsWith(':f')));
  const quietOnly = build({ projects: [projects[2]] })[0];
  check('projects: quiet 10 days', quietOnly?.id === 'project-quiet:c' && /10 days/.test(quietOnly.title) && /Buy wood/.test(quietOnly.body), show(quietOnly));
  const ship = build({ projects: [projects[1]] })[0];
  check('projects: ship it', ship?.id === 'project-ship:b' && !!ship.share, show(ship));
}

// ── Ideas, inbox, life areas, quests, weekly review ─────────────────────────
{
  const ideas = [
    { id: 'i1', title: 'Old sprout', plant_type: 'sprout', created_at: daysAgo(40) },
    { id: 'i2', title: 'Young', plant_type: 'sprout', created_at: daysAgo(5) },
    { id: 'i3', title: 'Linked', plant_type: 'plant', project_id: 'x', created_at: daysAgo(90) },
    { id: 'i4', title: 'Tree', plant_type: 'tree', created_at: daysAgo(90) },
  ];
  const out = build({ ideas });
  check('ideas: only old, unlinked sprouts/plants', show(out.map(n => n.id)) === show(['idea-idle:i1']), show(out.map(n => n.id)));
  check('ideas: weeks in title', /5 weeks/.test(out[0]?.title || ''), out[0]?.title);

  check('inbox: 2 is quiet', !build({ inboxCount: 2 }).length);
  check('inbox: 5 speaks up', build({ inboxCount: 5 })[0]?.cat === 'inbox');

  const areas = [
    { key: 'mental', label: 'Mental', last_check_date: null },
    { key: 'physical', label: 'Physical', last_check_date: '2026-09-19' },
    { key: 'social', label: 'Social', last_check_date: '2026-09-01' },
    { key: 'financial', label: 'Financial', last_check_date: '2026-09-10' },
  ];
  const a = build({ areas });
  check('areas: two most overdue, never-rated first', show(a.map(n => n.primary.target.key)) === show(['mental', 'social']), show(a.map(n => n.id)));

  const quests = [
    { id: 'feynman', title: 'Feynman', step: 'research', stepLabel: 'Research', done: false },
    { id: 'budget', title: 'Budget', step: 'spark', stepLabel: 'The idea', done: false },
    { id: 'pw', title: 'Passwords', step: 'done', stepLabel: 'Done', done: true },
  ];
  const q = build({ quests });
  check('quests: only one past the first step', show(q.map(n => n.id)) === show(['quest:feynman:research']), show(q.map(n => n.id)));
  check('quests: has a remind shortcut', q[0]?.remind?.target?.key === 'feynman');

  const sunday = build({}, { now: new Date(2026, 8, 27, 10, 0) });
  check('weekly review on Sunday', sunday.some(n => n.id.startsWith('weekly-review')));
  check('no weekly review on Monday', !build({}).some(n => n.id.startsWith('weekly-review')));
}

// ── Setup notices ───────────────────────────────────────────────────────────
{
  const planner = [{ id: 'p', title: 'Later', date: '2026-09-22', start_time: '09:00' }];
  check('setup: offer reminders when off and plans are timed', build({ planner }, { autoRemind: 'off' }).some(n => n.id === 'setup-reminders'));
  check('setup: not on web', !build({ planner }, { autoRemind: 'off', phoneCapable: false }).some(n => n.id === 'setup-reminders'));
  check('setup: blocked permission flagged', build({}, { notifyPermission: 'denied' }).some(n => n.id === 'setup-permission'));
  check('setup: blocked permission quiet when nothing wants it', !build({}, { notifyPermission: 'denied', wantsPhone: false }).some(n => n.id === 'setup-permission'));
}

// ── Shared + ordering ───────────────────────────────────────────────────────
{
  const out = build({ shared: [{ id: 's1', url: 'https://www.example.com/a', receivedAt: daysAgo(0) }], inboxCount: 9 });
  check('shared: first, filed via action', out[0]?.cat === 'shared' && out[0].primary.action === 'file-shared' && /example\.com/.test(out[0].title), show(out[0]));
  const pr = out.map(n => n.priority);
  check('sorted by priority', pr.every((p, i) => i === 0 || pr[i - 1] >= p), show(pr));
}

// ── Dismiss, snooze, categories ─────────────────────────────────────────────
{
  const list = [
    { id: 'inbox:x', cat: 'inbox' },
    { id: 'news:1:t', cat: 'news' },
    { id: 'project-next:a', cat: 'projects' },
    { id: 'idea-idle:i', cat: 'ideas' },
  ];
  const v = N.visibleNotices(list, {
    dismissed: { 'inbox:x': daysAgo(2), 'news:1:t': daysAgo(30) },
    snoozed: { 'project-next:a': new Date(NOW.getTime() + 3600000).toISOString() },
    cats: { ideas: false },
  }, NOW);
  check('hidden: dismissed, dismissed news, snoozed, category off', v.length === 0, show(v));
  const later = N.visibleNotices(list, { dismissed: { 'inbox:x': daysAgo(8) }, snoozed: { 'project-next:a': daysAgo(1) } }, NOW);
  check('back: old dismissal and past snooze', later.some(n => n.id === 'inbox:x') && later.some(n => n.id === 'project-next:a'), show(later));
}

// ── Nudge, quiet hours, AI starter ──────────────────────────────────────────
{
  const nudge = N.pickNudge([
    { id: 'news:1', cat: 'news' }, { id: 'setup-reminders', cat: 'setup' }, { id: 'shared:s', cat: 'shared' },
    { id: 'plan-next:p', cat: 'schedule' }, { id: 'project-next:a', cat: 'projects' },
  ]);
  check('nudge skips news/setup/shared/up-next', nudge?.id === 'project-next:a', show(nudge));
  const q = { on: true, start: '21:30', end: '08:00' };
  check('quiet: 23:00 inside', N.inQuietHours('23:00', q));
  check('quiet: 07:59 inside', N.inQuietHours('07:59', q));
  check('quiet: 08:00 outside', !N.inQuietHours('08:00', q));
  check('quiet: 17:00 outside', !N.inQuietHours('17:00', q));
  check('quiet: off means never', !N.inQuietHours('23:00', { ...q, on: false }));
  check('quiet: same-day window', N.inQuietHours('13:00', { on: true, start: '12:00', end: '14:00' }));
  const idea = N.planWithAIIdea([{ cat: 'news', title: 'News' }, { cat: 'schedule', title: '2 plans slipped past', body: 'Gym' }]);
  check('AI starter lists real items, not news', /slipped/.test(idea) && !/News/.test(idea), idea);
}

if (problems.length) {
  console.error(`check-notices: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-notices: all ${passed} checks passed.`);
