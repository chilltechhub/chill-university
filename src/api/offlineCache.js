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

export async function clearQueue() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {}
}

// ─── Network check ────────────────────────────────────────────────────────────

export async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
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
