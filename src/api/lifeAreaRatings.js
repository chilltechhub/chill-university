// src/api/lifeAreaRatings.js
// Every life-area rating, kept (docs/shake-up-plan-2026-10-21.md §5.1, P6):
// the history behind "then vs now" and the Ground fix's re-rate. The rating
// itself still lands on life_areas.progress where it always has; this keeps
// the trail. Append-only.
//
// Local first (@cth_area_ratings_<uid|guest>), then the life_area_ratings
// table (20261023120000_shakeup_p6.sql, hand-applied; until it exists the
// phone copy is the record).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const localKey = (userId) => `@cth_area_ratings_${userId || 'guest'}`;
const listeners = new Set();
export function onRatingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function loadRatings(userId) {
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(r => r && r.area && Number.isFinite(r.rating)) : [];
  } catch { return []; }
}

/**
 * Adds one rating. Resolves { previous } — the last rating of that area
 * before this one, or null (LifeAreaScreen fires 'area-rerated' when there
 * was one, for the Ground fix's "then vs now" step).
 */
export async function addRating(userId, area, rating, note = '') {
  const value = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  const list = await loadRatings(userId);
  const previous = [...list].reverse().find(r => r.area === area) || null;
  const row = { area, rating: value, note: String(note || '').slice(0, 140), at: new Date().toISOString() };
  const next = [...list, row].slice(-400);
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify(next)); } catch {}
  listeners.forEach(fn => { try { fn(userId, next); } catch {} });
  if (userId) {
    try {
      const { error } = await supabase.from('life_area_ratings').insert({ user_id: userId, area_id: area, rating: value, note: row.note, rated_at: row.at });
      if (error && error.code !== '42P01' && error.code !== 'PGRST205') console.warn('area rating push', error.message);
    } catch {}
  }
  return { previous, row };
}

/** Then vs now for one area: the first rating and the latest. */
export function thenVsNow(list, area) {
  const mine = (list || []).filter(r => r.area === area);
  if (mine.length < 2) return null;
  return { then: mine[0], now: mine[mine.length - 1], change: mine[mine.length - 1].rating - mine[0].rating };
}

/** At signup: a guest's ratings become the account's. */
export async function claimRatings(userId) {
  if (!userId) return 0;
  const guest = await loadRatings(null);
  if (!guest.length) return 0;
  const mine = await loadRatings(userId);
  const merged = [...guest, ...mine].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  try { await AsyncStorage.setItem(localKey(userId), JSON.stringify(merged)); } catch {}
  try { await supabase.from('life_area_ratings').insert(guest.map(r => ({ user_id: userId, area_id: r.area, rating: r.rating, note: r.note || '', rated_at: r.at }))); } catch {}
  await AsyncStorage.removeItem(localKey(null)).catch(() => {});
  return guest.length;
}
