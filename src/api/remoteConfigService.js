// src/api/remoteConfigService.js
// Reads the app_config (feature flags / remote settings) and app_content
// (quotes, tips, announcements, featured resources, ...) tables — see
// supabase/migrations/20260828_remote_content_config.sql for the schema.
//
// Both are cached in AsyncStorage so the app still has *something* to show
// offline or the instant it launches (before the network round-trip
// resolves) — it just won't reflect the latest edit until the next fetch
// succeeds. Nothing here writes to Supabase; these tables are edited from
// the Supabase dashboard, never from the app.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const CONFIG_CACHE_KEY = '@cth_remote_config';
const CONTENT_CACHE_PREFIX = '@cth_remote_content_';

// ─── Feature flags / app_config ─────────────────────────────────────────────

// Returns { [key]: { value, enabled, description } } for every row.
export async function fetchAppConfig() {
  try {
    const { data, error } = await supabase.from('app_config').select('*');
    if (error) throw error;
    const map = {};
    (data || []).forEach((row) => {
      map[row.key] = { value: row.value, enabled: !!row.enabled, description: row.description };
    });
    await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(map));
    return map;
  } catch (e) {
    console.warn('[remoteConfig] fetchAppConfig failed, falling back to cache', e?.message);
    return readConfigCache();
  }
}

async function readConfigCache() {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Content pools / app_content ────────────────────────────────────────────

// Returns the active rows for one `type` (optionally scoped to a `key`,
// e.g. a life-area id), ordered by sort_order. Empty array on total
// failure with nothing cached — callers should keep their own hardcoded
// fallback content for that case, same as getTodaysQuote() already did.
export async function fetchContentPool(type, key = null) {
  const cacheKey = CONTENT_CACHE_PREFIX + type + (key ? `_${key}` : '');
  try {
    let q = supabase.from('app_content').select('*').eq('type', type).order('sort_order');
    if (key) q = q.eq('key', key);
    const { data, error } = await q;
    if (error) throw error;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data || []));
    return data || [];
  } catch (e) {
    console.warn(`[remoteConfig] fetchContentPool(${type}) failed, falling back to cache`, e?.message);
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
