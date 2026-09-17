// src/api/personaService.js
// Vault reads and writes.
//
// Profile CRUD used to live here as persona_configs helpers; it moved to
// profileAccountsService.js when a persona stopped being "the one mode this
// account is in" and became the TYPE of a profile. A table keyed by
// (user, persona) could not represent two BUSINESS profiles with different
// revenue targets, which is the whole point of the multi-profile model.
//
// Phase 1 of the Vault is structured worksheet data only — `payload` jsonb,
// no uploads, no credit-report pulls, no bank feeds. See the long note on
// vault_documents in 20260910140000_multi_profile_accounts.sql for why that
// line is drawn where it is.

import { supabase } from './supabaseClient';

// Vault rows belong to a PROFILE, not just a user: two startups under one
// login must not share an Entity Selection Matrix.
export async function listVaultDocuments(userId, { track, profileId } = {}) {
  if (!userId) return [];
  let q = supabase
    .from('vault_documents')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  if (track) q = q.eq('track', track);
  const { data, error } = await q;
  if (error) {
    console.warn('[vault] listVaultDocuments', error.message);
    return [];
  }
  return data || [];
}

// Upsert on (profile_id, lesson_key) so saving a worksheet twice edits it
// rather than stacking duplicates — and so the same lesson filled in under a
// different profile is a genuinely separate document.
export async function saveVaultDocument(userId, { profileId, track, lessonKey, title, payload = {}, status = 'draft' }) {
  if (!userId || !lessonKey) return null;
  const { data, error } = await supabase
    .from('vault_documents')
    .upsert({
      user_id: userId,
      profile_id: profileId || null,
      track,
      lesson_key: lessonKey,
      title,
      payload,
      status,
    }, { onConflict: 'profile_id,lesson_key' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Progress toward a level's gate review. The curriculum's own rule is that a
// level advances when its vault package is complete, not when lessons are
// merely opened — so this is computed from real artifacts, scoped to one
// profile.
export async function getTrackProgress(userId, track, totalDeliverables, profileId) {
  const docs = await listVaultDocuments(userId, { track, profileId });
  const complete = docs.filter(d => d.status === 'complete').length;
  return {
    complete,
    total: totalDeliverables,
    drafts: docs.filter(d => d.status === 'draft').length,
    pct: totalDeliverables ? Math.round((complete / totalDeliverables) * 100) : 0,
    gatePassed: totalDeliverables > 0 && complete >= totalDeliverables,
  };
}
