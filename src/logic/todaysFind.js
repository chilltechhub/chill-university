// src/logic/todaysFind.js
// Which Find Home shows today (src/components/TodaysFind.js).
//
// One a day, never a feed (docs/refocus-plan-2026-10-18.md):
//   - same day + same person = same Find, however often Home re-renders
//   - the person's own life areas first, plus 'general' (Khan Academy,
//     Wikipedia...), which suits anyone; the whole list only if none fit
//   - never one they've tried or said "Not for me" to
//   - "Not for me" moves on to the next, but only a few times a day
//     (DECLINES_PER_DAY): after that, More Finds is the way to browse
//
// No imports: scripts/check-todays-find.mjs loads it as plain data.

export const DECLINES_PER_DAY = 3;

export const findKey = (f) => String(f?.legacyId || f?.id || f?.url || '');

// FNV-1a: a small, stable string hash, so the pick doesn't depend on
// Math.random or on the order rows come back from the server.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickTodaysFind(finds, { day = '', seed = '', areas = [], skip = [] } = {}) {
  const skipped = new Set(skip.map(String));
  const pool = (finds || []).filter(f => f && f.url && !skipped.has(findKey(f)));
  if (!pool.length) return null;
  const mine = areas.length ? pool.filter(f => areas.includes(f.areaId) || f.areaId === 'general') : [];
  const tier = mine.length ? mine : pool;
  // Sorted by key first, so the same list in any order gives the same pick.
  const sorted = [...tier].sort((a, b) => (findKey(a) < findKey(b) ? -1 : findKey(a) > findKey(b) ? 1 : 0));
  return sorted[hash(`${seed}|${day}`) % sorted.length];
}

// The saved state (one synced setting): what's been tried, what was waved
// off, and how many waves today.
export const EMPTY_FIND_STATE = { tried: [], declined: [], declineDay: '', declines: 0, triedDay: '', triedKey: '' };

export function readFindState(raw) {
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return s && typeof s === 'object' ? { ...EMPTY_FIND_STATE, ...s } : { ...EMPTY_FIND_STATE };
  } catch {
    return { ...EMPTY_FIND_STATE };
  }
}

export function declinesLeft(state, day) {
  return state.declineDay === day ? Math.max(0, DECLINES_PER_DAY - state.declines) : DECLINES_PER_DAY;
}

export function withDecline(state, find, day) {
  const sameDay = state.declineDay === day;
  return {
    ...state,
    declined: [...new Set([...state.declined, findKey(find)])],
    declineDay: day,
    declines: (sameDay ? state.declines : 0) + 1,
  };
}

export function withTried(state, find, day) {
  // triedKey keeps today's card on the one they tried (a "done" state), not
  // the next pick: one a day.
  return { ...state, tried: [...new Set([...state.tried, findKey(find)])], triedDay: day, triedKey: findKey(find) };
}
