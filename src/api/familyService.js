// src/api/familyService.js
// Parent/child account linking — thin wrappers around the SECURITY DEFINER
// functions in supabase/migrations/20260828_family_linking.sql. Read-only
// progress view only: a linked parent sees level/xp/points/streak, nothing
// else, and has no controls over the child's account.

import { supabase } from './supabaseClient';

// Child side — generates a 15-minute invite code to hand to a parent.
export async function generateFamilyCode() {
  const { data, error } = await supabase.rpc('generate_family_code');
  if (error) throw error;
  return data?.[0] || null; // { code, expires_at }
}

// Parent side — redeems a child's code, linking that child to this account.
export async function redeemFamilyCode(code) {
  const { data, error } = await supabase.rpc('redeem_family_code', { p_code: code.trim() });
  if (error) throw error;
  return data?.[0] || null; // { child_id, display_name }
}

// Parent side — read-only progress for every linked child.
export async function getMyChildren() {
  const { data, error } = await supabase.rpc('get_my_children');
  if (error) throw error;
  return data || [];
}

// Parent side — remove a specific child's link.
export async function unlinkChild(childId) {
  const { error } = await supabase.rpc('unlink_child', { p_child_id: childId });
  if (error) throw error;
}

// Child side — remove your own link to whoever your parent is.
export async function unlinkMyParent() {
  const { error } = await supabase.rpc('unlink_my_parent');
  if (error) throw error;
}
