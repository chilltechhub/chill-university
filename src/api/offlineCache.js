// src/api/offlineCache.js
// Simple offline cache — write to AsyncStorage always,
// sync to Supabase when online. Read from cache first for instant load.

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SCOPED_TABLES } from './profileScopedClient';
import { getActiveProfileId } from '../logic/activeProfile';

const PREFIX = '@cth_cache_';

// ─── Core cache ops ───────────────────────────────────────────────────────────

export async function cacheWrite(key, data) {
  try {
    await AsyncStorage.setItem(
      PREFIX + key,
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch (e) {
    console.warn('[cache] write failed', key, e);
  }
}

export async function cacheRead(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch (e) {
    console.warn('[cache] read failed', key, e);
    return null;
  }
}

export async function cacheDelete(key) {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {}
}

// ─── Pending sync queue ───────────────────────────────────────────────────────
// When offline, writes are queued and replayed when back online

const QUEUE_KEY = '@cth_sync_queue';

export async function queueWrite(operation) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...operation, queued_at: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[cache] queue failed', e);
  }
}

export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// A real-looking id, generated up front, used whether the insert happens
// live right now or gets queued for later. Without this, "offline add"
// implementations tended to hand the UI a throwaway id (e.g. 'local_' +
// Date.now()) while queuing the row with NO id — so when flushQueue()
// finally synced it, Postgres generated a brand-new random id that never
// matched what was already showing on screen, and the two copies never
// reconciled. Pre-assigning the id here means the row Supabase ends up
// with is the exact same one the UI has been showing the whole time.
function genLocalId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Offline-aware insert/upsert ─────────────────────────────────────────
// The one thing every "add something new" action should call instead of
// hand-rolling its own online/offline branch. Tries a real write when
// online; if that's not possible (offline, or the request fails outright —
// a connection that drops mid-request), queues the exact same row
// (same id either way) for flushQueue() to replay, and hands back a row
// that looks exactly like what a real insert would have returned, so the
// caller can push it straight into its list — no separate "pending" data
// shape to maintain, and nothing to reconcile once it actually syncs.
//
// Profile-scoped tables get the active profile stamped on the row HERE,
// before either path. The scoped client stamps inserts itself, but a queued
// row never goes through it — it was replayed later with no profile_id, and
// scoped reads never return a null-profile row, so anything saved offline
// vanished once it synced (and so did every project made from the + button,
// which used the raw client). Stamping at write time also means a replay
// lands in the profile it was written in, not whichever is active later.
export async function offlineWrite(supabase, table, data, { type = 'INSERT', selectQuery = '*' } = {}) {
  const row = withActiveProfile(table, { ...data, id: data.id || genLocalId() });

  if (await isOnline()) {
    const query = type === 'UPSERT'
      ? supabase.from(table).upsert(row).select(selectQuery).single()
      : supabase.from(table).insert(row).select(selectQuery).single();
    const { data: result, error } = await query;
    if (!error) return { row: result, queued: false };
    // A real failure (not just "offline") still queues rather than losing
    // what the user just typed — same fallback as the offline branch.
  }

  await queueWrite({ table, type, data: row });
  return { row, queued: true };
}

export async function clearQueue() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {}
}

// Replays every queued write against Supabase and drops each one that
// actually lands. Nothing called this before — queueWrite() had no
// counterpart, so anything that ever got queued (any write made while
// isOnline() said no) sat in AsyncStorage forever, invisible, and never
// reached the account. Call this on launch and whenever connectivity comes
// back, so a queued write is a delay, not a silent loss.
//
// Pass the RAW client: the rows already carry their profile_id (see
// offlineWrite), and the scoped client would filter an UPDATE/DELETE to the
// profile that happens to be active now.
//
// Only the signed-in user's writes are replayed; another account's stay
// queued for when they sign back in. A write the server rejects for good (bad
// data, a constraint, a permission) is dropped instead of retried on every
// launch forever, and counted in `dropped` so the caller can say so. One flush
// runs at a time — launch, reconnect and foreground can all ask at once.
let flushing = null;
export function flushQueue(supabase) {
  if (!flushing) flushing = doFlush(supabase).finally(() => { flushing = null; });
  return flushing;
}

async function doFlush(supabase) {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0, dropped: 0 };

  let uid = null;
  try { uid = (await supabase.auth.getSession())?.data?.session?.user?.id || null; } catch {}
  if (!uid) return { synced: 0, remaining: queue.length, dropped: 0 };

  const remaining = [];
  let synced = 0;
  let dropped = 0;
  for (const raw of queue) {
    const op = { ...raw, data: withActiveProfile(raw.table, raw.data || {}) };
    if (op.data.user_id && op.data.user_id !== uid) { remaining.push(raw); continue; }
    try {
      let query = supabase.from(op.table);
      if (op.type === 'INSERT')      query = query.insert(op.data);
      else if (op.type === 'UPSERT') query = query.upsert(op.data);
      else if (op.type === 'UPDATE') query = query.update(op.data).eq('id', op.data.id);
      else if (op.type === 'DELETE') query = query.delete().eq('id', op.data.id);
      else { remaining.push(raw); continue; } // unknown op — keep it, don't drop silently

      const { error, status } = await query;
      if (error) throw Object.assign(error, { status });
      synced++;
    } catch (e) {
      // The same id is already there: an earlier attempt landed but its
      // response was lost. That's a success, not a failure.
      if (e?.code === '23505' && (op.type === 'INSERT' || op.type === 'UPSERT')) { synced++; continue; }
      if (isPermanentError(e)) {
        dropped++;
        console.warn('[queue] server refused, dropping', op.table, op.type, e?.code, e?.message);
        continue;
      }
      console.warn('[queue] replay failed, keeping queued', op.table, op.type, e?.message || e);
      remaining.push(raw);
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    await clearQueue();
  }
  return { synced, remaining: remaining.length, dropped };
}

// Drops the queued writes that belong to one account — used on sign-out, after
// a last flush attempt, so they can't replay under whoever signs in next.
export async function clearQueueFor(userId) {
  const queue = await getQueue();
  const keep = queue.filter(op => op?.data?.user_id && op.data.user_id !== userId);
  if (keep.length) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(keep));
  else await clearQueue();
}

// Postgres data/constraint/permission classes (22, 23, 42), PostgREST request
// errors, and 4xx other than timeout/rate-limit will fail the same way every
// time. Network errors carry no code and are worth retrying.
function isPermanentError(e) {
  const code = String(e?.code || '');
  if (/^(22|23|42|PGRST)/.test(code)) return true;
  const status = Number(e?.status || 0);
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

function withActiveProfile(table, row) {
  if (!SCOPED_TABLES.has(table) || row.profile_id !== undefined) return row;
  const profileId = getActiveProfileId();
  return profileId ? { ...row, profile_id: profileId } : row;
}

// ─── Network check ────────────────────────────────────────────────────────────

export async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    // On web, NetInfo often can't determine reachability at all and reports
    // isInternetReachable as null rather than true/false — `&&`-ing that
    // straight into the result makes isOnline() falsy while the browser is
    // genuinely online (navigator.onLine === true), which is exactly what
    // silently routed captures into the write queue above instead of
    // Supabase. Only treat connectivity as down when NetInfo actively says
    // so (=== false); null/undefined means "unknown", not "offline".
    if (state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
  } catch { return true; } // assume online if can't check
}

// ─── Smart fetch — cache first, then network ──────────────────────────────────
// Use this for reads: returns cached data immediately,
// then fetches fresh data and updates cache in background

export async function smartFetch(cacheKey, fetchFn, onUpdate) {
  // 1. Return cached data immediately
  const cached = await cacheRead(cacheKey);
  if (cached) onUpdate(cached);

  // 2. Fetch fresh in background if online
  const online = await isOnline();
  if (online) {
    try {
      const fresh = await fetchFn();
      if (fresh) {
        await cacheWrite(cacheKey, fresh);
        onUpdate(fresh);
      }
    } catch (e) {
      console.warn('[smartFetch] network fetch failed, using cache', e);
    }
  }

  return cached;
}
