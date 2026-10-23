// src/logic/agendaRows.js
// Planner rows kept on the phone, for someone using the app without an
// account yet (docs/shake-up-plan-2026-10-21.md §3.4). They have the same
// shape as agenda_instances rows, with an id that starts 'local-' and no
// user_id; that prefix is how plannerService.js knows which store a row
// lives in. P2 copies them into the account at signup.
//
// Pure array operations, so scripts/check-planner.mjs can run them.
// src/api/localAgenda.js does the storing.

export const LOCAL_PREFIX = 'local-';
export const isLocalId = (id) => typeof id === 'string' && id.startsWith(LOCAL_PREFIX);

let seq = 0;
export const makeLocalId = (now = Date.now()) => `${LOCAL_PREFIX}${now.toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Rows on `date`, or between `from` and `to` (inclusive), optionally in one area. Area order, like the server's. */
export function selectRows(rows, { date = null, from = null, to = null, area = null } = {}) {
  return (rows || [])
    .filter(r => (!date || r.date === date) && (!from || r.date >= from) && (!to || r.date <= to) && (!area || r.area === area))
    .map((r, i) => [r, i])
    .sort(([a, i], [b, j]) => String(a.area || '').localeCompare(String(b.area || '')) || i - j)
    .map(([r]) => r);
}

/** Adds `list`, each with a fresh local id. Returns the new store and the added rows. */
export function insertRows(rows, list, { now = new Date().toISOString(), makeId = makeLocalId } = {}) {
  const added = (list || []).map(row => ({
    ...row,
    id: makeId(),
    user_id: null,
    completed: !!row.completed,
    skipped: !!row.skipped,
    created_at: now,
  }));
  return { rows: [...(rows || []), ...added], added };
}

/** Merges `patch` into the row with `id`. `row` is null when there's no such row. */
export function updateRow(rows, id, patch) {
  let row = null;
  const next = (rows || []).map(r => {
    if (r.id !== id) return r;
    row = { ...r, ...patch, id: r.id, user_id: r.user_id ?? null };
    return row;
  });
  return { rows: row ? next : rows, row };
}

export function deleteRows(rows, ids) {
  const gone = new Set(ids || []);
  return (rows || []).filter(r => !gone.has(r.id));
}

/**
 * At signup: the guest's rows as new rows for the account, minus any the
 * account already has (`isSame(existing, row)`, plannerService's
 * isSamePlan). Local ids and timestamps stay behind; the server makes its
 * own. Done and skipped carry over.
 */
export function claimRows(localRows, existingRows, userId, isSame) {
  const keep = ['title', 'area', 'cadence', 'type', 'date', 'start_time', 'duration_minutes', 'notes',
    'completed', 'completed_at', 'skipped', 'link_type', 'link_screen', 'link_id'];
  const out = [];
  for (const r of localRows || []) {
    if (!r?.title || !r.date) continue;
    if ((existingRows || []).some(x => isSame(x, r)) || out.some(x => isSame(x, r))) continue;
    const row = { user_id: userId };
    keep.forEach(k => { if (r[k] !== undefined) row[k] = r[k]; });
    out.push(row);
  }
  return out;
}

// The same series rule as plannerService.getSeriesFrom: same title, repeat
// and time (local rows never come from a library component), from this day
// on, this one plus the ones not done yet.
export function seriesFrom(rows, instance) {
  if (!instance) return [];
  return (rows || []).filter(r => r.date >= instance.date
    && !r.component_id
    && r.title === instance.title
    && (r.cadence || 'daily') === (instance.cadence || 'daily')
    && (r.start_time || null) === (instance.start_time || null)
    && (r.id === instance.id || !r.completed))
    .map(r => ({ id: r.id, date: r.date, completed: !!r.completed }));
}
