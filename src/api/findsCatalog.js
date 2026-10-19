// src/api/findsCatalog.js
// "Finds": the curated tools and know-how behind Today's Find on Home and
// the Vault's Discover tab (docs/refocus-plan-2026-10-18.md).
//
// One loader for both. The live list is Supabase app_content (type
// 'featured_resource'), editable from the dashboard with no app update.
// RESOURCE_CATALOG (src/data/knowledgeCatalogs.js) is what shows until that
// loads, and what's used if it fails or comes back empty.
//
// "I tried it" saves the Find to the Vault as a Tool (once: one URL, one
// row) and records a use on it (src/api/knowledgeUse.js), so the Vault shows
// Used N×. That tap is the only sync a Find needs: the tool itself lives in
// its own app or site.

import { supabase } from './profileScopedClient';
import { offlineWrite } from './offlineCache';
import { fetchContentPool } from './remoteConfigService';
import { recordUse } from './knowledgeUse';
import { RESOURCE_CATALOG, DISCOVER_AGE_BANDS } from '../data/knowledgeCatalogs';
import { bandAllows } from '../logic/profileResolver';

// A remote app_content row, in the bundled catalog's shape.
export function findFromRow(row) {
  return {
    id: row.id, areaId: row.key, emoji: row.meta?.emoji, title: row.title, url: row.meta?.url, desc: row.body,
    legacyId: row.meta?.legacy_id, ageBands: row.meta?.age_bands,
    // Optional on the remote rows, so an entry added from the dashboard
    // before anyone fills these in just shows the short description.
    tags: Array.isArray(row.meta?.tags) ? row.meta.tags : null,
    summary: row.meta?.summary || null,
  };
}

export const BUNDLED_FINDS = RESOURCE_CATALOG;

// The live list, or the bundled one. Never throws.
export async function loadFinds() {
  try {
    const rows = await fetchContentPool('featured_resource');
    return rows.length ? rows.map(findFromRow) : BUNDLED_FINDS;
  } catch {
    return BUNDLED_FINDS;
  }
}

// Age: the row's own tag if it has one, else the bundled floor.
export function findAllowed(find, band) {
  return bandAllows(find.ageBands || DISCOVER_AGE_BANDS[find.legacyId || find.id], band);
}

// The captures row a Find becomes in the Vault: a Tool, tagged with its
// life area, the same as saving it from Discover.
export function findCaptureRow(userId, find, urlMeta = {}) {
  const area = find.areaId && find.areaId !== 'general' ? [find.areaId] : [];
  return {
    user_id: userId,
    type: 'resource',
    status: 'active',
    title: find.title || null,
    body: find.summary || find.desc || null,
    url: find.url || null,
    url_meta: { emoji: find.emoji, source: 'catalog', kind: 'tool', ...urlMeta },
    tags: Array.from(new Set([...area, ...(find.tags || [])])),
    source: 'catalog',
  };
}

async function vaultRowForUrl(userId, url) {
  if (!userId || !url) return null;
  const { data } = await supabase.from('captures')
    .select('id, url_meta')
    .eq('user_id', userId)
    .eq('url', url)
    .is('deleted_at', null)
    .limit(1);
  return data?.[0] || null;
}

// "I tried it". Returns the Vault row's id, or null if the save failed.
export async function markFindTried(userId, find, { note = 'Tried it' } = {}) {
  const existing = await vaultRowForUrl(userId, find.url);
  if (existing) {
    await recordUse(existing.id, { note });
    return existing.id;
  }
  const use = { at: new Date().toISOString(), note };
  const { row } = await offlineWrite(supabase, 'captures', findCaptureRow(userId, find, { uses: [use] }));
  return row?.id || null;
}
