// src/api/communityService.js
// Everything behind the Library's Discover section.
//
// Same shape as logic/leaderboardService.js and api/organizationService.js:
// every cross-user read/write goes through a SECURITY DEFINER RPC (see
// supabase/migrations/20260906140000_community_discover.sql) rather than a
// broad RLS policy, so other users only ever see the column allowlist those
// functions return — never a full profiles row.
//
// The migration is not applied automatically. Until it is, every call here
// throws COMMUNITY_NOT_CONFIGURED, which the Discover screens render as a
// friendly "not set up yet" state instead of an error.

import { supabase } from './supabaseClient';

export const COMMUNITY_NOT_CONFIGURED = 'COMMUNITY_NOT_CONFIGURED';
export const MINORS_CANNOT_PUBLISH    = 'MINORS_CANNOT_PUBLISH';
export const MINORS_CANNOT_REQUEST    = 'MINORS_CANNOT_REQUEST_MENTORS';
export const CONTENT_BLOCKED          = 'CONTENT_BLOCKED';
export const NOT_AN_ADMIN             = 'NOT_AN_ADMIN';
export const ALREADY_SENT_TODAY       = 'ALREADY_SENT_TODAY';

// PostgREST reports a genuinely missing RPC as PGRST202 rather than
// Postgres's own 42883 — verified against the live endpoint while building
// the leaderboard and institutional layers. Both are matched here for safety.
function isMissingFunction(error) {
  return error?.code === '42883' || error?.code === 'PGRST202'
    || /function .* does not exist/i.test(error?.message || '')
    || /could not find the function/i.test(error?.message || '');
}

// The RPCs raise bare sentinel strings (MINORS_CANNOT_PUBLISH etc). Postgres
// wraps those in its own message text, so match rather than compare.
function translate(error) {
  if (isMissingFunction(error)) return new Error(COMMUNITY_NOT_CONFIGURED);
  const msg = error?.message || '';
  if (msg.includes(MINORS_CANNOT_PUBLISH)) return new Error(MINORS_CANNOT_PUBLISH);
  if (msg.includes(MINORS_CANNOT_REQUEST)) return new Error(MINORS_CANNOT_REQUEST);
  if (msg.includes(CONTENT_BLOCKED))       return new Error(CONTENT_BLOCKED);
  if (msg.includes(NOT_AN_ADMIN))          return new Error(NOT_AN_ADMIN);
  if (msg.includes(ALREADY_SENT_TODAY))    return new Error(ALREADY_SENT_TODAY);
  return error;
}

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw translate(error);
  return data;
}

/* ─── Feeds ──────────────────────────────────────────────────────────────── */

/**
 * Posts newest first. `kind` of null returns every kind, which is what the
 * unified feed's "All Posts" tab reads — one small community split across three
 * screens looked emptier than it actually was.
 * @param {'breakthrough'|'showcase'|'project'|null} kind
 */
export async function getFeed(kind = null, limit = 50) {
  return (await call('get_community_feed', { p_kind: kind, p_limit: limit })) || [];
}

/** Showcase posts ranked by their author's points — "exceptional", not "latest". */
export async function getTopTalent(limit = 30) {
  return (await call('get_top_talent', { p_limit: limit })) || [];
}

/** People whose declared topics overlap the caller's. Discovery only, no contact. */
export async function getFellowScholars(limit = 40) {
  return (await call('get_fellow_scholars', { p_limit: limit })) || [];
}

/* ─── Writes ─────────────────────────────────────────────────────────────── */

export async function publishPost({ kind, title, body = null, link = null, tags = [] }) {
  return call('publish_community_post', {
    p_kind: kind, p_title: title, p_body: body, p_link: link, p_tags: tags,
  });
}

/** Soft-removes one of the caller's own posts. A no-op on anyone else's. */
export async function deleteMyPost(postId) {
  return call('delete_my_community_post', { p_post_id: postId });
}

/** Three distinct reports auto-hide a post pending review. */
export async function reportPost(postId, reason) {
  return call('report_community_post', { p_post_id: postId, p_reason: reason });
}

export async function blockUser(userId) {
  return call('block_community_user', { p_user_id: userId });
}

export async function unblockUser(userId) {
  return call('unblock_community_user', { p_user_id: userId });
}

/* ─── Mentors ────────────────────────────────────────────────────────────── */

export async function getMentors({ subject = null, limit = 50 } = {}) {
  return (await call('get_mentors', { p_subject: subject, p_limit: limit })) || [];
}

export async function requestMentor(mentorId, message) {
  return call('request_mentor', { p_mentor_id: mentorId, p_message: message });
}

/* ─── Kudos ──────────────────────────────────────────────────────────────── */

/**
 * The only interaction Fellow Scholars offers: a counter, no message, no
 * thread. Rate-limited server-side to once per person per 24h; throws
 * ALREADY_SENT_TODAY past that.
 * @returns {Promise<number>} the recipient's new total
 */
export async function sendKudos(toUserId) {
  return call('send_kudos', { p_to_user: toUserId });
}

/* ─── Moderation (admin only) ────────────────────────────────────────────── */

/** Auto-quarantined and reported posts, oldest first. Throws NOT_AN_ADMIN. */
export async function getModerationQueue(limit = 100) {
  return (await call('get_moderation_queue', { p_limit: limit })) || [];
}

/** 'visible' approves and clears reports; 'removed' takes it down. */
export async function setPostState(postId, state) {
  return call('admin_set_post_state', { p_post_id: postId, p_state: state });
}
