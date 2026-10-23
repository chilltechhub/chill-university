// src/logic/deliverables.js
// One deliverable concept (docs/shake-up-plan-2026-10-21.md §4.3, P6): the
// thing a unit asks you to make and hand in, whatever it is underneath (a
// Studio Build, a checklist, a few written lines, a practice test score).
// Source records stay where they are; a deliverable only adds status, an
// aim-for date, the self-check, feedback and the path it belongs to.
//
// Pure (no imports), so scripts/check-deliverables.mjs runs it.
//
//   { id, unitKey, pathKey, kind, title, buildKind?, ref?, status, aimFor,
//     content, checks, feedback, snapshotAt, shownAt, createdAt, updatedAt }
//   kind     build · checklist · reflection · test
//   status   todo · doing · handed · shown  (+ "Reviewed" once feedback exists)
//   aimFor   'YYYY-MM-DD' the student picks. Never red, never "overdue":
//            past it, the card says "Still open".
//   content  answers to prompts / ticks on items (by index)
//   checks   the three self-check lines, ticked before Hand it in
//   feedback [{ who, said, change, changed, at }]

export const STATUS_LABEL = { todo: 'To do', doing: 'Doing', handed: 'Handed in', shown: 'Shown' };
export const BOARD = ['todo', 'doing', 'handed', 'shown'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const deliverableIdFor = (unitId) => `dlv-${unitId}`;

/** A fresh deliverable for a unit (units.js), not started yet. */
export function newDeliverable(unit, now = new Date().toISOString()) {
  const d = unit.deliverable || {};
  return {
    id: deliverableIdFor(unit.id),
    unitKey: unit.id,
    pathKey: unit.path,
    kind: d.kind || 'reflection',
    title: d.title || unit.label,
    buildKind: d.buildKind || null,
    ref: null,
    status: 'todo',
    aimFor: null,
    content: {},
    checks: (d.rubric || []).map(() => false),
    feedback: [],
    snapshotAt: null,
    shownAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Whatever's in storage, made safe to use: unknown fields dropped, bad ones defaulted. */
export function normalizeDeliverable(raw) {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;
  return {
    id: String(raw.id),
    unitKey: raw.unitKey || null,
    pathKey: raw.pathKey || null,
    kind: ['build', 'checklist', 'reflection', 'test'].includes(raw.kind) ? raw.kind : 'reflection',
    title: String(raw.title || 'Untitled'),
    buildKind: raw.buildKind || null,
    ref: raw.ref || null,
    status: BOARD.includes(raw.status) ? raw.status : 'todo',
    aimFor: ISO.test(raw.aimFor || '') ? raw.aimFor : null,
    content: raw.content && typeof raw.content === 'object' ? raw.content : {},
    checks: Array.isArray(raw.checks) ? raw.checks.map(Boolean) : [],
    feedback: Array.isArray(raw.feedback) ? raw.feedback.filter(f => f && (f.said || f.who)) : [],
    snapshotAt: raw.snapshotAt || null,
    shownAt: raw.shownAt || null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
  };
}

const filled = (v) => typeof v === 'string' ? v.trim().length > 0 : !!v;

/**
 * Is the work itself there? A Build needs one made (ref); a checklist every
 * item ticked; written prompts and a test every answer filled.
 *   unit   the unit, for its prompts / items
 */
export function workDone(d, unit) {
  const def = unit?.deliverable || {};
  if (d.kind === 'build') return !!d.ref;
  if (d.kind === 'checklist') return (def.items || []).length > 0 && (def.items || []).every((_, i) => d.content?.[i] === true);
  const prompts = def.prompts || [];
  return prompts.length > 0 && prompts.every((_, i) => filled(d.content?.[i]));
}

/** Ready to hand in: the work is there and every self-check line is ticked. */
export function canHandIn(d, unit) {
  if (!d || d.status === 'handed' || d.status === 'shown') return false;
  const rubric = unit?.deliverable?.rubric || [];
  return workDone(d, unit) && rubric.length > 0 && rubric.every((_, i) => d.checks?.[i] === true);
}

/** What's still missing before Hand it in, in plain words (empty when ready). */
export function handInMissing(d, unit) {
  const out = [];
  if (!workDone(d, unit)) {
    out.push(d.kind === 'build' ? 'Make it first' : d.kind === 'checklist' ? 'Tick every item' : 'Fill in every line');
  }
  const rubric = unit?.deliverable?.rubric || [];
  const unchecked = rubric.filter((_, i) => d.checks?.[i] !== true).length;
  if (unchecked) out.push(`Tick ${unchecked} more on the self-check`);
  return out;
}

/** Started: anything written, ticked or made moves it from To do to Doing. */
export function touch(d, patch, now = new Date().toISOString()) {
  const next = { ...d, ...patch, updatedAt: now };
  if (next.status === 'todo') {
    const started = next.ref || Object.values(next.content || {}).some(filled) || (next.checks || []).some(Boolean);
    if (started) next.status = 'doing';
  }
  return next;
}

export function handIn(d, now = new Date().toISOString()) {
  return { ...d, status: 'handed', snapshotAt: now, updatedAt: now };
}

export function show(d, now = new Date().toISOString()) {
  if (d.status !== 'handed' && d.status !== 'shown') return d;
  return { ...d, status: 'shown', shownAt: d.shownAt || now, updatedAt: now };
}

/** The label a card shows: Reviewed once feedback has come in on handed-in work. */
export function statusLabel(d) {
  if ((d.status === 'handed' || d.status === 'shown') && d.feedback?.length) return 'Reviewed';
  return STATUS_LABEL[d.status] || 'To do';
}

/**
 * The aim-for date, as words. Never red, never "overdue": a date that has
 * passed on work not handed in is "Still open".
 *   today  'YYYY-MM-DD'
 */
export function aimForLabel(d, today) {
  if (!d?.aimFor || d.status === 'handed' || d.status === 'shown') return null;
  if (d.aimFor < today) return 'Still open';
  if (d.aimFor === today) return 'Aim: today';
  const [y, m, day] = d.aimFor.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Aim: ${names[m - 1]} ${day}${y !== +today.slice(0, 4) ? `, ${y}` : ''}`;
}

/** Feedback I got: { who, said, change }; `changed` is ticked later. */
export function addFeedback(d, note, now = new Date().toISOString()) {
  const who = String(note?.who || '').trim().slice(0, 60);
  const said = String(note?.said || '').trim().slice(0, 400);
  const change = String(note?.change || '').trim().slice(0, 200);
  if (!who && !said) return d;
  return { ...d, feedback: [...(d.feedback || []), { who, said, change, changed: false, at: now }], updatedAt: now };
}

export function markChanged(d, index, changed = true, now = new Date().toISOString()) {
  const feedback = (d.feedback || []).map((f, i) => (i === index ? { ...f, changed } : f));
  return { ...d, feedback, updatedAt: now };
}

/** The Make board: the four columns, the newest change first in each. */
export function boardOf(list = []) {
  const by = Object.fromEntries(BOARD.map(k => [k, []]));
  [...list].filter(Boolean)
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .forEach(d => { (by[d.status] || by.todo).push(d); });
  return by;
}

/** What receipts count from deliverables (§6.2). */
export function deliverableCounts(list = []) {
  const done = list.filter(d => d && (d.status === 'handed' || d.status === 'shown'));
  const feedback = list.flatMap(d => d?.feedback || []);
  return {
    handedIn: done.length,
    shown: list.filter(d => d?.status === 'shown').length,
    looked: feedback.length,
    changed: feedback.filter(f => f.changed).length,
  };
}

/**
 * Milestones with dates (§6 "milestones"): the first of each, never a count
 * to chase. `tastes` is [{ at }] for Finds tried; `units` [{ id, at }].
 */
export function milestones({ deliverables = [], units = [], tastes = [] } = {}) {
  const firstAt = (list, key) => list.map(x => x?.[key]).filter(Boolean).sort()[0] || null;
  const out = [];
  const handed = firstAt(deliverables.filter(d => d?.snapshotAt), 'snapshotAt');
  if (handed) out.push({ key: 'first-handed', label: 'First thing handed in', at: handed });
  const unitAt = firstAt(units, 'at');
  if (unitAt) out.push({ key: 'first-unit', label: 'First unit done', at: unitAt });
  const shownAt = firstAt(deliverables, 'shownAt');
  if (shownAt) out.push({ key: 'first-shown', label: 'First time you showed your work', at: shownAt });
  const fb = deliverables.flatMap(d => d?.feedback || []).map(f => f.at).filter(Boolean).sort()[0];
  if (fb) out.push({ key: 'first-feedback', label: 'First feedback you got', at: fb });
  const tasteDates = tastes.map(x => x?.at).filter(Boolean).sort();
  if (tasteDates.length >= 3) out.push({ key: 'three-tastes', label: 'Three things tried', at: tasteDates[2] });
  return out.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

/**
 * The deliverable in flight, for the next step and Today's card: Doing
 * first (the one touched last), then To do on the active unit.
 */
export function inFlight(list = [], activeUnitId = null) {
  const doing = list.filter(d => d?.status === 'doing')
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
  if (doing) return doing;
  return list.find(d => d?.status === 'todo' && d.unitKey === activeUnitId) || null;
}

/**
 * nextStep's `deliverable` input: the work, then each self-check line, as
 * steps. `step` is what's still missing, in plain words.
 */
export function deliverableStep(d, unit) {
  if (!d || !unit) return null;
  const rubric = unit.deliverable?.rubric || [];
  const done = (workDone(d, unit) ? 1 : 0) + rubric.filter((_, i) => d.checks?.[i]).length;
  return {
    title: d.title, step: handInMissing(d, unit)[0] || 'Hand it in', done, total: 1 + rubric.length,
    open: { screen: 'UnitScreen', params: { unitId: unit.id } },
  };
}

/** How far a deliverable is, for nextStep's "halfway" (0..1). */
export function progressOf(d, unit) {
  if (!d) return 0;
  if (d.status === 'handed' || d.status === 'shown') return 1;
  const rubric = unit?.deliverable?.rubric || [];
  const work = workDone(d, unit) ? 1 : 0;
  const checked = rubric.filter((_, i) => d.checks?.[i]).length;
  return (work + checked) / (1 + rubric.length);
}
