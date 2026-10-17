// src/logic/dream.js
// The Dream layer (docs/north-star.md, docs/north-star-plan-2026-10-17.md
// Phase 2): the life someone wants, in their own words, sitting above every
// project and task. This file is the shape and the rules; storage is
// src/api/dreamService.js, the Home card is src/components/DreamCard.js.
//
// No imports, so scripts/check-dream.mjs can run it.
//
// Rules the founder set: rough is fine, every field optional, editable any
// time, and the old version is kept when it changes. Drafts (from onboarding
// or the Wayfinder) only ever fill EMPTY fields; nothing overwrites what
// someone wrote themselves.

// The layer's name is still the founder's call (north-star.md, "Open
// questions": Your Why / The Dream / The Way). One constant, so the
// decision is a one-line change.
export const DREAM_NAME = 'The Dream';

export const MAX_PARTS = 3;
export const MAX_DREAM_VALUES = 3;
export const MAX_WONT_TRADE = 3;
// Old versions kept for "then vs now" later. Twenty edits back is plenty.
export const MAX_HISTORY = 20;
const TEXT_MAX = 600;
const LINE_MAX = 80;

export function emptyDream() {
  return {
    life: '',          // "A normal Tuesday in the life I want", their words
    parts: [],         // [{ id, label }] 1-3 things in that life to work toward
    values: [],        // up to 3: Wayfinder value ids, or their own words
    wontTrade: [],     // up to 3 short lines
    becoming: '',      // "someone who finishes things"
    draftedFrom: null, // 'onboarding' | 'wayfinder' | 'typed'
    updatedAt: null,
    history: [],       // [{ savedAt, life, parts, values, wontTrade, becoming }]
  };
}

const clean = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const cleanList = (xs, n, max) => (Array.isArray(xs) ? xs : [])
  .map(x => clean(x, max)).filter(Boolean)
  .filter((x, i, all) => all.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i)
  .slice(0, n);

let idSeq = 0;
export function newPartId() {
  idSeq += 1;
  return `p${Date.now().toString(36)}${idSeq.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

function cleanParts(parts) {
  const out = [];
  (Array.isArray(parts) ? parts : []).forEach((p) => {
    const label = clean(typeof p === 'string' ? p : p?.label, LINE_MAX);
    if (!label || out.some(x => x.label.toLowerCase() === label.toLowerCase())) return;
    // Ids stay put across edits: projects will point at them (Phase 2, PR 2).
    out.push({ id: (p && typeof p === 'object' && typeof p.id === 'string' && p.id) || newPartId(), label });
  });
  return out.slice(0, MAX_PARTS);
}

export function normalizeDream(raw) {
  const base = emptyDream();
  if (!raw || typeof raw !== 'object') return base;
  // Multi-line is fine in the life text; only trim the ends and cap it.
  const life = typeof raw.life === 'string' ? raw.life.trim().slice(0, TEXT_MAX) : '';
  return {
    ...base,
    life,
    parts: cleanParts(raw.parts),
    values: cleanList(raw.values, MAX_DREAM_VALUES, LINE_MAX),
    wontTrade: cleanList(raw.wontTrade, MAX_WONT_TRADE, LINE_MAX),
    becoming: clean(raw.becoming, LINE_MAX),
    draftedFrom: ['onboarding', 'wayfinder', 'typed'].includes(raw.draftedFrom) ? raw.draftedFrom : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    history: (Array.isArray(raw.history) ? raw.history : [])
      .filter(h => h && typeof h === 'object' && typeof h.savedAt === 'string')
      .slice(-MAX_HISTORY),
  };
}

export function isDreamEmpty(d) {
  const x = normalizeDream(d);
  return !x.life && !x.parts.length && !x.values.length && !x.wontTrade.length && !x.becoming;
}

// What a version is, without its bookkeeping. Used to tell "changed" from
// "saved again unchanged".
function content(d) {
  return {
    life: d.life,
    parts: d.parts.map(p => p.label),
    values: d.values,
    wontTrade: d.wontTrade,
    becoming: d.becoming,
  };
}
const same = (a, b) => JSON.stringify(content(a)) === JSON.stringify(content(b));

/**
 * The next saved dream after an edit. Keeps the previous version in
 * `history` when the content actually changed (an empty dream isn't kept:
 * there's no "before" to show).
 *   prev   current dream (any shape; normalized here)
 *   patch  fields to change
 *   from   'onboarding' | 'wayfinder' | 'typed'
 *   now    ISO time (passed in so tests are stable)
 */
export function applyDreamEdit(prev, patch, from = 'typed', now = new Date().toISOString()) {
  const before = normalizeDream(prev);
  const merged = normalizeDream({ ...before, ...(patch || {}), history: before.history, draftedFrom: before.draftedFrom });
  if (same(before, merged)) return before;
  const history = isDreamEmpty(before)
    ? before.history
    : [...before.history, { savedAt: before.updatedAt || now, ...content(before) }].slice(-MAX_HISTORY);
  return { ...merged, draftedFrom: before.draftedFrom || from, updatedAt: now, history };
}

/**
 * A draft from Wayfinder answers, for the fields that are still empty.
 * Returns null when there's nothing to offer.
 *   wf          Wayfinder state (wayfinderScoring.normalizeState shape)
 *   zoneLabel   (id) => label for a Wayfinder life zone, e.g. 'Money at home'
 */
export function draftFromWayfinder(dream, wf, zoneLabel = (id) => id) {
  const d = normalizeDream(dream);
  if (!wf || typeof wf !== 'object') return null;
  const draft = {};
  if (!d.values.length && Array.isArray(wf.values) && wf.values.length) {
    draft.values = wf.values.slice(0, MAX_DREAM_VALUES);
  }
  const self = clean(wf.statement?.self, LINE_MAX);
  if (!d.becoming && self) draft.becoming = `someone who ${self.replace(/^someone who\s+/i, '')}`;
  // "Life beyond work" wants ("Money at home: not stressing every month")
  // are the closest thing the Wayfinder has to parts of a life.
  const wants = wf.life?.wants && typeof wf.life.wants === 'object' ? wf.life.wants : {};
  const zones = Array.isArray(wf.life?.zones) ? wf.life.zones : Object.keys(wants);
  if (!d.parts.length) {
    const parts = zones.map(z => clean(wants[z], LINE_MAX)).filter(Boolean).slice(0, MAX_PARTS);
    if (parts.length) draft.parts = parts;
  }
  if (!Object.keys(draft).length) return null;
  draft.zoneNames = zones.filter(z => clean(wants[z], LINE_MAX)).map(zoneLabel).slice(0, MAX_PARTS);
  return draft;
}
