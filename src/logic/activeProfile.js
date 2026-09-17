// src/logic/activeProfile.js
// A module-level handle on which Profile is currently active.
//
// Why this exists rather than everything reading React context: most of this
// app's data access lives in plain async service functions
// (captureService.js, plannerService.js, gardenService.js, ...) that are
// called as `getCaptures(userId)` and have no component, no hooks, and no way
// to reach a provider. Threading a profileId parameter through all 80-odd
// call sites would touch every screen and guarantee some get missed — and a
// missed one is not a cosmetic bug, it's someone's night-job task appearing in
// their personal list.
//
// So ProfileAccountsContext pushes the active profile id here whenever it
// changes, and services read it. One writer, many readers.
//
// The cache key helpers matter as much as the id: offlineCache keys are built
// from userId, and two profiles under one login would otherwise share a cache
// entry and serve each other's rows offline.

let activeProfileId = null;
const listeners = new Set();

// Called only by ProfileAccountsContext.
export function setActiveProfileId(id) {
  if (activeProfileId === id) return;
  activeProfileId = id || null;
  listeners.forEach(fn => { try { fn(activeProfileId); } catch { /* listener's problem */ } });
}

export function getActiveProfileId() {
  return activeProfileId;
}

export function onActiveProfileChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Applies the profile filter to a supabase query builder.
//
// When no profile is resolved yet — a guest, or the instant before the first
// load completes — this deliberately does NOT filter. Filtering on
// `profile_id = null` would return the empty set and flash "you have nothing"
// at someone who has plenty; leaving it unfiltered shows their rows, which is
// the honest fallback given every row is already scoped to their user_id.
export function scopeToProfile(query, { profileId = getActiveProfileId() } = {}) {
  if (!profileId) return query;
  return query.eq('profile_id', profileId);
}

// Stamps the active profile onto a row being written. Falls back to no
// profile_id rather than an invented one; the column is nullable and a null
// row still belongs to the right user.
export function withProfile(row, { profileId = getActiveProfileId() } = {}) {
  const id = profileId;
  if (!id) return row;
  if (Array.isArray(row)) return row.map(r => ({ profile_id: id, ...r }));
  return { profile_id: id, ...row };
}

// Offline cache keys must include the profile, or two profiles under one login
// read each other's cached rows.
export function profileCacheKey(base) {
  const id = getActiveProfileId();
  return id ? `${base}__p:${id}` : base;
}
