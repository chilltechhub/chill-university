// src/logic/nextStep.js
// The one next step on Today (docs/shake-up-plan-2026-10-21.md §3.1). One
// place decides it, so the Full board's "Next step" widget, Calm's headline
// and (later) the You page can't disagree. It replaces CompassCard,
// RightNowCard, GettingStartedCard and StageStepsWidget as front doors; each
// of those is now an input here.
//
// In priority order:
//   now          a plan happening right now, soon, or running late
//                (RightNowCard, folded in)
//   deliverable  a deliverable you're halfway through          (P6)
//   unit         the current unit's next step                  (P6)
//   objective    the goal in flight's next unticked step. Before P6 there
//                are no deliverables or units, so this stands in for both.
//   claim        every step of the goal is done: finish it
//   due          something due: today first, then the soonest
//   drill        a drill that's due
//   first        the first goal, not started yet
//   path         otherwise: pick a path
//
// Takes whatever inputs exist and skips the missing ones. Pure, so
// scripts/check-deliverables.mjs runs every rule.
//
// Inputs (all optional):
//   now          { title, kind: 'now'|'soon'|'late', ref }
//   deliverable  { title, step, done, total, open: { screen, params } }
//   unit         { title, step: { label, screen, params }, done, total }
//   objective    { active, complete, label, done, total,
//                  nextStep: { label, hint, screen, params } }
//   due          [{ title, date: 'YYYY-MM-DD', ref }], open items only
//   drill        { due: true, label, gameId }
//   firstGoal    { label, estimate }
//   today        'YYYY-MM-DD' (what "due today" means)
//
// Out: { kind, label, title, why?, progress?: { done, total },
//        action: { type, label, screen?, params?, ref? } }
//   action.type  'open' (go to screen) | 'plan' (open the plan item) |
//                'claim' | 'start' (the first goal) | 'drill' | 'path'

const days = (from, to) => Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86400000);

export function dueWhen(date, today) {
  if (!date || !today) return '';
  const d = days(today, date);
  if (d < 0) return 'Still open';
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  if (d < 7) return `Due ${new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}`;
  return `Due ${new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

const NOW_LABEL = { now: 'Right now', soon: 'Coming up', late: 'Still open' };

export function nextStep({ now, deliverable, unit, objective, due, drill, firstGoal, today } = {}) {
  if (now?.title && NOW_LABEL[now.kind]) {
    return { kind: 'now', label: NOW_LABEL[now.kind], title: now.title, action: { type: 'plan', label: 'Open', ref: now.ref } };
  }
  if (deliverable?.title && deliverable.done > 0 && deliverable.done < deliverable.total) {
    return {
      kind: 'deliverable', label: 'Your deliverable', title: deliverable.step || deliverable.title, why: deliverable.title,
      progress: { done: deliverable.done, total: deliverable.total },
      action: { type: 'open', label: 'Continue', screen: deliverable.open?.screen, params: deliverable.open?.params },
    };
  }
  if (unit?.step?.label) {
    return {
      kind: 'unit', label: 'This unit', title: unit.step.label, why: unit.title,
      progress: Number.isFinite(unit.total) ? { done: unit.done || 0, total: unit.total } : undefined,
      action: { type: 'open', label: 'Start', screen: unit.step.screen, params: unit.step.params },
    };
  }
  if (objective?.active && objective.complete) {
    return {
      kind: 'claim', label: 'Your goal', title: objective.label, why: 'Every step is done.',
      progress: { done: objective.total, total: objective.total },
      action: { type: 'claim', label: 'Finish' },
    };
  }
  if (objective?.active && objective.nextStep?.label) {
    return {
      kind: 'objective', label: 'Your goal', title: objective.nextStep.label, why: objective.label,
      progress: { done: objective.done || 0, total: objective.total || 0 },
      action: { type: 'open', label: 'Start', screen: objective.nextStep.screen, params: objective.nextStep.params },
    };
  }
  const open = (Array.isArray(due) ? due : []).filter(d => d?.title && typeof d.date === 'string').sort((a, b) => a.date.localeCompare(b.date));
  if (open.length) {
    const first = open[0];
    return { kind: 'due', label: dueWhen(first.date, today) || 'Due soon', title: first.title, action: { type: 'plan', label: 'Open', ref: first.ref } };
  }
  if (drill?.due) {
    return { kind: 'drill', label: "Today's drill", title: drill.label || 'Three quick drills', action: { type: 'drill', label: 'Play', gameId: drill.gameId } };
  }
  if (firstGoal?.label) {
    return {
      kind: 'first', label: 'Your first goal', title: firstGoal.label,
      action: { type: 'start', label: firstGoal.estimate ? `Start · ${String(firstGoal.estimate).toLowerCase()}` : 'Start' },
    };
  }
  return { kind: 'path', label: 'Next step', title: 'Pick a path to start on', action: { type: 'path', label: 'Pick a path', screen: 'Compass' } };
}

/**
 * The top bar's path chip and thin bar (shake-up P4, §2.3). Until units
 * exist (P6) it's the goal in flight: its title, and its steps done. With
 * none, it invites a start. `pct` is 0–100, for the bar.
 *   objective  { active, complete, label, done, total }, as nextStep takes it
 */
export function pathChip(objective) {
  if (!objective?.active || !objective.label) {
    return { label: 'Pick where to start', done: 0, total: 0, pct: 0, empty: true };
  }
  const total = Math.max(0, objective.total || 0);
  const done = Math.min(total, Math.max(0, objective.done || 0));
  return {
    label: objective.label,
    done, total,
    pct: total ? Math.round((done / total) * 100) : 0,
    sub: total ? (objective.complete ? 'Done · claim it' : `Step ${Math.min(done + 1, total)} of ${total}`) : null,
    empty: false,
  };
}
