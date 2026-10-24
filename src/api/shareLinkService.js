// src/api/shareLinkService.js
// Read-only share links (docs/shake-up-plan-2026-10-21.md §4.5, P8). A link
// is a snapshot of one piece of work or the Showcase, stored rendered and
// shown at /s/<token> on the web build. 18+ only, revocable at once.
//
// Every write goes through a server function
// (20261024120000_shakeup_p8_share_links.sql): the server makes the token,
// refuses under-18 and unknown-age accounts, and caps live links. The app
// hides the button for those accounts too (allowed.js communityAccess), so
// nobody is offered something the server would refuse. Until the SQL is
// applied, making a link fails with a plain message and Take it home
// (a file) still works.

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';
import { tokenFromPath, shareUrlFor } from '../logic/shareLinks';

export { tokenFromPath };

const missingFn = (e) => e && (e.code === 'PGRST202' || e.code === '42883' || /Could not find the function/i.test(e.message || ''));

// Where links open: the web build. In a browser that's this page's own
// address; on a phone it's the configured web address (app.json extra
// SHARE_WEB_URL or EXPO_PUBLIC_SHARE_WEB_URL), or null until there is one.
export function shareBaseUrl() {
  const set = Constants.expoConfig?.extra?.SHARE_WEB_URL || process.env.EXPO_PUBLIC_SHARE_WEB_URL;
  if (set) return String(set).replace(/\/+$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return null;
}

export function shareUrl(token) {
  return shareUrlFor(shareBaseUrl(), token);
}

/**
 * Makes a link. Resolves { token, url } or { error } with words to show.
 *   kind  'deliverable' | 'showcase'
 */
export async function createShareLink({ kind, targetId = null, title = '', html }) {
  try {
    const { data, error } = await supabase.rpc('create_share_link', { p_kind: kind, p_target: targetId, p_title: title, p_html: html });
    if (error) return { error: missingFn(error) ? "Links aren't switched on yet. Take the file home instead." : error.message };
    return { token: data, url: shareUrl(data) };
  } catch (e) {
    return { error: e?.message || "Couldn't make the link." };
  }
}

/** Your live links, newest first: [{ token, title, target_kind, target_id, created_at }]. */
export async function listShareLinks() {
  try {
    const { data, error } = await supabase.from('share_links')
      .select('token, title, target_kind, target_id, created_at')
      .is('revoked_at', null).order('created_at', { ascending: false });
    return error ? [] : data || [];
  } catch { return []; }
}

export async function revokeShareLink(token) {
  try {
    const { data, error } = await supabase.rpc('revoke_share_link', { p_token: token });
    return !error && data === true;
  } catch { return false; }
}

/** What a link shows, for anyone with it: { title, html, created_at } or null. */
export async function fetchSharedPage(token) {
  if (!tokenFromPath(`/s/${token}`)) return null;
  try {
    const { data, error } = await supabase.rpc('get_share_link', { p_token: token });
    if (error || !Array.isArray(data) || !data.length) return null;
    return data[0];
  } catch { return null; }
}
