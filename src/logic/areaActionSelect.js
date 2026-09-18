// src/logic/areaActionSelect.js
//
// Turns a sub-section's action pool into what the screen shows: one Today's
// action, and a deck of a 2-minute win, a one-minute read and a habit.
// Pure — no network, no React — so it can be tested directly and reused by
// the area hub.
//
// Order of preference, everywhere:
//   1. pinned by the person
//   2. ranked higher for their profile type (boost_personas)
//   3. a rotation that is stable for the day, so reopening the screen
//      doesn't reshuffle what you were just looking at
//
// age_bands is a hard filter (forBand); nothing here second-guesses it.

import { bandAllows } from './profileResolver';

export const CUSTOM_PREFIX = 'custom:';
export const DECK_SLOTS = ['quick', 'learn', 'habit'];

// The only payload fields a person may change on a pool action. Anything
// else (a link's url, a screen name) stays what the dashboard says.
export const EDITABLE_PAYLOAD = ['time', 'minutes'];

// Lays a person's edits over the pool. Edits with an action_key change that
// action; edits without one are the person's own actions.
export function applyUserEdits(pool, edits = []) {
  const byKey = new Map(edits.filter(e => e.action_key).map(e => [e.action_key, e]));

  const merged = pool.map((a) => {
    const e = byKey.get(a.key);
    const base = { ...a, pinned: false, hidden: false, edited: false, custom: false, editId: null, original: null };
    if (!e) return base;
    const payload = { ...(a.payload || {}) };
    EDITABLE_PAYLOAD.forEach((k) => { if (e.payload && e.payload[k] != null) payload[k] = e.payload[k]; });
    const payloadEdited = EDITABLE_PAYLOAD.some(k => e.payload && e.payload[k] != null && e.payload[k] !== (a.payload || {})[k]);
    return {
      ...base,
      title: e.title || a.title,
      why: e.why != null ? e.why : a.why,
      payload,
      pinned: !!e.pinned,
      hidden: !!e.hidden,
      edited: !!(e.title || e.why != null || payloadEdited),
      editId: e.id,
      original: { title: a.title, why: a.why, payload: a.payload || {} },
    };
  });

  const customs = edits.filter(e => !e.action_key).map(e => ({
    key: CUSTOM_PREFIX + e.id,
    screen_tag: e.screen_tag,
    area_id: null,
    tier: e.tier || 'habit',
    title: e.title,
    why: e.why || null,
    body: null,
    handler: 'done',
    payload: {},
    age_bands: null,
    boost_personas: [],
    featured: false,
    sort_order: 100000 + (e.sort_order || 0),
    pinned: !!e.pinned,
    hidden: !!e.hidden,
    edited: false,
    custom: true,
    editId: e.id,
    original: null,
  }));

  return [...merged, ...customs];
}

// A person's own actions are always theirs to see.
export function forBand(actions, band) {
  return actions.filter(a => a.custom || bandAllows(a.age_bands, band));
}

// FNV-1a — small, fast, and the same answer on every device.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function rankActions(actions, { persona, dateKey, salt = '' } = {}) {
  const boosted = a => (a.boost_personas || []).includes(persona);
  return actions.slice().sort((a, b) =>
    (Number(b.pinned) - Number(a.pinned))
    || (Number(boosted(b)) - Number(boosted(a)))
    || (hash(`${dateKey}|${salt}|${a.key}`) - hash(`${dateKey}|${salt}|${b.key}`)));
}

// Today's action. Candidates are anything pinned plus the pool's featured
// picks. `skip` walks to the next one ("Another one"). It is NOT replaced
// once done — a finished Today's action shows as finished, which is the
// point of the day.
export function selectToday(actions, { persona, dateKey, skip = 0 } = {}) {
  const live = actions.filter(a => !a.hidden);
  let candidates = live.filter(a => a.pinned || a.featured);
  if (!candidates.length) candidates = live.filter(a => a.tier === 'step' || a.tier === 'quick');
  if (!candidates.length) return null;
  const ranked = rankActions(candidates, { persona, dateKey, salt: 'today' });
  // Prefer a pick that leaves the deck full: taking the only 2-minute win
  // (or read, or habit) for Today would empty that deck slot. A pin still
  // wins — it's what the person asked for.
  const starves = a => DECK_SLOTS.includes(a.tier) && live.filter(x => x.tier === a.tier).length === 1;
  const ordered = [
    ...ranked.filter(a => a.pinned),
    ...ranked.filter(a => !a.pinned && !starves(a)),
    ...ranked.filter(a => !a.pinned && starves(a)),
  ];
  return ordered[((skip % ordered.length) + ordered.length) % ordered.length];
}

// One of each deck slot, never repeating Today's action. A 2-minute win or a
// read already done today steps aside for the next one; a habit stays put
// and shows as ticked, because ticking it is the whole interaction.
export function selectDeck(actions, { persona, dateKey, todayKey = null, doneKeys = new Set() } = {}) {
  const live = actions.filter(a => !a.hidden && a.key !== todayKey);
  return DECK_SLOTS.map((slot) => {
    const ranked = rankActions(live.filter(a => a.tier === slot), { persona, dateKey, salt: slot });
    if (!ranked.length) return null;
    const action = slot === 'habit' ? ranked[0] : (ranked.find(a => !doneKeys.has(a.key)) || ranked[0]);
    return { slot, action };
  }).filter(Boolean);
}
