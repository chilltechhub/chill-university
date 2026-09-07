// src/api/organizationService.js
// Organizations, cohorts, and assignment tracking — thin wrappers around
// the SECURITY DEFINER functions in
// supabase/migrations/20260901_institutional_layer.sql. No direct table
// queries here on purpose, same as familyService.js: every table this
// feature touches is RLS-locked with zero client-facing policies, so the
// only way in is through these RPCs.
//
// The migration isn't applied automatically. Until it is, every call below
// fails with Postgres error 42883 ("function does not exist"), surfaced as
// ORG_NOT_CONFIGURED — the same shape leaderboardService.js already uses —
// so a screen can show a friendly "not set up yet" state instead of a
// crash.

import { supabase } from './supabaseClient';

export const ORG_NOT_CONFIGURED = 'ORG_NOT_CONFIGURED';

function isMissingFunction(error) {
  // PostgREST returns PGRST202/404 ("Could not find the function ... in
  // the schema cache") when an RPC name genuinely doesn't exist yet — not
  // Postgres's own 42883, which is what a raw SQL call against a missing
  // function raises. Checking only 42883 (as leaderboardService.js
  // originally did too — same fix applied there) never actually matched a
  // real pre-migration RPC call in this environment; verified directly
  // against the live endpoint while building this feature.
  return error?.code === '42883' || error?.code === 'PGRST202'
    || /function .* does not exist/i.test(error?.message || '')
    || /could not find the function/i.test(error?.message || '');
}

function unwrap(error) {
  if (isMissingFunction(error)) throw new Error(ORG_NOT_CONFIGURED);
  throw error;
}

// Creates an organization and makes the caller its owner.
export async function createOrganization(name, type) {
  const { data, error } = await supabase.rpc('create_organization', { p_name: name.trim(), p_type: type });
  if (error) unwrap(error);
  return data?.[0] || null; // { id, name, type }
}

// Mints an invite code — org-wide (cohortId omitted) or straight into one
// cohort. role defaults to 'member'; only an org owner/admin can mint an
// 'admin' code.
export async function generateOrgInviteCode({ organizationId, cohortId = null, role = 'member', maxUses = 30, expiresDays = 7 }) {
  const { data, error } = await supabase.rpc('generate_org_invite_code', {
    p_organization_id: organizationId,
    p_cohort_id: cohortId,
    p_role: role,
    p_max_uses: maxUses,
    p_expires_days: expiresDays,
  });
  if (error) unwrap(error);
  return data?.[0] || null; // { code, expires_at, max_uses }
}

// Redeems a code, joining the caller to the organization (and cohort, if
// the code targets one).
export async function redeemOrgInviteCode(code) {
  const { data, error } = await supabase.rpc('redeem_org_invite_code', { p_code: code.trim() });
  if (error) unwrap(error);
  return data?.[0] || null; // { organization_id, organization_name, organization_type, cohort_id, cohort_name, role }
}

// Creates a cohort within an organization the caller already belongs to,
// and makes the caller its manager.
export async function createCohort(organizationId, name) {
  const { data, error } = await supabase.rpc('create_cohort', {
    p_organization_id: organizationId,
    p_name: name.trim(),
  });
  if (error) unwrap(error);
  return data?.[0] || null; // { id, name }
}

// Every organization the caller belongs to, with the cohorts they can see
// in each (one row per org/cohort pair; cohort fields null if the org has
// none visible to the caller yet).
export async function getMyOrganizations() {
  const { data, error } = await supabase.rpc('get_my_organizations');
  if (error) unwrap(error);
  return data || [];
}

// Member roster for a cohort — visible to anyone in it, not just its
// manager.
export async function getCohortRoster(cohortId) {
  const { data, error } = await supabase.rpc('get_cohort_roster', { p_cohort_id: cohortId });
  if (error) unwrap(error);
  return data || [];
}

// Manager-only — creates a freeform assignment (title/description/due
// date) for a cohort.
export async function assignContentToCohort({ cohortId, title, description = null, dueDate = null }) {
  const { data, error } = await supabase.rpc('assign_content_to_cohort', {
    p_cohort_id: cohortId,
    p_title: title.trim(),
    p_description: description,
    p_due_date: dueDate,
  });
  if (error) unwrap(error);
  return data?.[0] || null; // { id, title, description, due_date, created_at }
}

// Updates the caller's own status on one assignment.
export async function updateAssignmentStatus(assignmentId, status) {
  const { data, error } = await supabase.rpc('update_assignment_status', {
    p_assignment_id: assignmentId,
    p_status: status,
  });
  if (error) unwrap(error);
  return data?.[0] || null; // { assignment_id, status, completed_at }
}

// Points leaderboard scoped to one cohort — visible to its members,
// managers, and org admins only.
export async function getCohortLeaderboard(cohortId, limit = 50) {
  const { data, error } = await supabase.rpc('get_cohort_leaderboard', {
    p_cohort_id: cohortId,
    p_limit: limit,
  });
  if (error) unwrap(error);
  return data || [];
}

// The caller's own open (not completed) assignments across every cohort
// they belong to — feeds Home's "On the Desk" rail.
export async function getMyOpenAssignments(limit = 5) {
  const { data, error } = await supabase.rpc('get_my_open_assignments', { p_limit: limit });
  if (error) unwrap(error);
  return data || [];
}

// Leaves an organization (and every cohort in it). If the caller is its
// only member, this deletes the organization outright.
export async function leaveOrganization(organizationId) {
  const { error } = await supabase.rpc('leave_organization', { p_organization_id: organizationId });
  if (error) unwrap(error);
}

// Manager-only — removes someone from a cohort specifically, not the
// parent organization.
export async function removeCohortMember(cohortId, userId) {
  const { error } = await supabase.rpc('remove_cohort_member', { p_cohort_id: cohortId, p_user_id: userId });
  if (error) unwrap(error);
}
