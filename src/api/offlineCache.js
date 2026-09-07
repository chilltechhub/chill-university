// src/api/offlineCache.js
// Simple offline cache — write to AsyncStorage always,
// sync to Supabase when online. Read from cache first for instant load.

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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
export async function offlineWrite(supabase, table, data, { type = 'INSERT', selectQuery = '*' } = {}) {
  const row = { ...data, id: data.id || genLocalId() };

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
export async function flushQueue(supabase) {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const remaining = [];
  let synced = 0;
  for (const op of queue) {
    try {
      let query = supabase.from(op.table);
      if (op.type === 'INSERT')      query = query.insert(op.data);
      else if (op.type === 'UPSERT') query = query.upsert(op.data);
      else if (op.type === 'UPDATE') query = query.update(op.data).eq('id', op.data.id);
      else if (op.type === 'DELETE') query = query.delete().eq('id', op.data.id);
      else { remaining.push(op); continue; } // unknown op — keep it, don't drop silently

      const { error } = await query;
      if (error) throw error;
      synced++;
    } catch (e) {
      console.warn('[queue] replay failed, keeping queued', op.table, op.type, e?.message || e);
      remaining.push(op);
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    await clearQueue();
  }
  return { synced, remaining: remaining.length };
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
