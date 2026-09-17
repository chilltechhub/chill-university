// src/api/profileAccountsService.js
// CRUD for persona_profiles — the several Profiles one login can hold (two
// jobs, a personal life, three startups) — plus the master roll-up and the
// per-device sign-in/sign-out state.
//
// Naming: "Profiles" in the UI, persona_profiles in the schema. NOT
// "accounts" — this app already has auth accounts and family child accounts
// (real separate logins linked by profiles.parent_id), and a third meaning of
// the word is how the `role` confusion started.
//
// Superseded personaService.js's persona_configs helpers; baseline and
// active_widgets now live on the profile row itself, because a table keyed by
// (user, persona) physically cannot hold two BUSINESS profiles with different
// revenue targets.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { getPersona } from '../data/personas';

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function listProfiles(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('persona_profiles')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('is_master', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('[profiles] listProfiles', error.message);
    return [];
  }
  return data || [];
}

// The signup profile. Everything else hangs off it: it can't be deleted, it
// owns the management actions, and it's the fallback whenever the active
// profile is missing or no longer readable.
export async function getMasterProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('persona_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_master', true)
    .maybeSingle();
  if (error) {
    console.warn('[profiles] getMasterProfile', error.message);
    return null;
  }
  return data;
}

export async function createProfile(userId, { type, name, emoji, isMaster = false, baseline = {} }) {
  if (!userId) throw new Error('Not signed in');
  const def = getPersona(type);
  const clean = Object.fromEntries(
    Object.entries(baseline || {}).filter(([, v]) => v !== '' && v != null)
  );

  // ── Creating the master when one already exists is an UPDATE, not a error ──
  // There is a partial unique index on (user_id) where is_master, so a second
  // insert can only ever fail. It used to fail exactly where it hurt most:
  // the context's backfill effect would create a PERSONAL master seconds
  // after signup, then onboarding's own createMasterProfile({type:'STUDENT'})
  // hit the index, threw, and got swallowed — leaving the account PERSONAL
  // whatever the user picked.
  //
  // The backfill is now gated on onboarding_completed so the race shouldn't
  // recur, but treating this as an upgrade is what heals the accounts already
  // stuck that way: re-running onboarding retypes the existing master instead
  // of losing to it. It's also just the honest reading of the call — "make
  // this account's master be this" — which is idempotent by nature.
  if (isMaster) {
    const current = await getMasterProfile(userId);
    if (current) {
      // NOTE: active_widgets is deliberately NOT set here. That column holds
      // the user's SAVED dashboard layout (an array of {key, hidden} written
      // by HomeScreen's exitWidgetEdit) — not the persona's default key list,
      // which is derivable from personas.js at any time via layoutForPersona.
      // Writing the default here wiped a user's arranged dashboard every time
      // the master got retyped, which is a real way to lose their work.
      const patch = {
        type,
        emoji: emoji || def.emoji,
      };
      // Only take a name if one was given, and never overwrite a name the
      // user chose with a type default — someone renaming their master to
      // "Night Job" shouldn't lose it by re-running onboarding.
      const trimmed = (name || '').trim();
      if (trimmed) patch.name = trimmed;
      else if (current.name === getPersona(current.type).short) patch.name = def.short;
      // Merge rather than replace: baselines are per-type keys (gpa_goal,
      // revenue_target...), and switching type shouldn't discard the old one.
      if (Object.keys(clean).length) patch.baseline = { ...(current.baseline || {}), ...clean };

      const { data, error } = await supabase
        .from('persona_profiles')
        .update(patch)
        .eq('id', current.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  }

  // Append to the end of the user's current ordering.
  const existing = await listProfiles(userId);
  const sortOrder = existing.length;

  const { data, error } = await supabase
    .from('persona_profiles')
    .insert({
      user_id: userId,
      type,
      name: (name || '').trim() || def.short,
      emoji: emoji || def.emoji,
      is_master: isMaster,
      sort_order: sortOrder,
      baseline: clean,
      // Left empty on purpose — see the note in the master-update branch
      // above. An empty active_widgets means "no saved layout yet", and
      // HomeScreen falls back to this persona's default.
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function renameProfile(profileId, name) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Name cannot be empty');
  const { data, error } = await supabase
    .from('persona_profiles')
    .update({ name: trimmed.slice(0, 40) })
    .eq('id', profileId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(profileId, patch) {
  const { data, error } = await supabase
    .from('persona_profiles')
    .update(patch)
    .eq('id', profileId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Soft delete. The vault rows stay — a founder who archives a startup
// shouldn't silently lose the operating agreement worksheet they filled in for
// it, and an accidental tap shouldn't be unrecoverable. The database refuses
// outright if this is the master.
export async function archiveProfile(profileId) {
  const { data, error } = await supabase
    .from('persona_profiles')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function reorderProfiles(orderedIds) {
  // Sequential rather than batched: the list is at most 12 long, and a
  // partial failure here is cosmetic (ordering), not data loss.
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('persona_profiles')
      .update({ sort_order: i })
      .eq('id', orderedIds[i]);
    if (error) { console.warn('[profiles] reorder', error.message); return false; }
  }
  return true;
}

export async function setActiveProfile(userId, profileId) {
  if (!userId) return null;
  const { error } = await supabase
    .from('profiles')
    .update({ active_profile_id: profileId })
    .eq('id', userId);
  if (error) throw error;
  return profileId;
}

// ─── Master roll-up ──────────────────────────────────────────────────────────
// Cross-profile overview: vault progress and last activity per profile. The
// SQL function is scoped by auth.uid(), so it can only ever return the
// caller's own rows.

export async function getProfileRollup() {
  const { data, error } = await supabase.rpc('get_profile_rollup');
  if (error) {
    console.warn('[profiles] getProfileRollup', error.message);
    return [];
  }
  return data || [];
}

// ─── Device-local sign in / sign out ─────────────────────────────────────────
//
// "I want to log into one profile and sign the rest out." This is that, and
// it is deliberately device-local: signing a profile out hides it from this
// device's switcher until it's signed back in. Nothing is deleted, and the
// data still exists on the account.
//
// Be clear-eyed about what this is: a privacy convenience, NOT a security
// boundary. Anyone who can sign into the account itself can sign any profile
// back in, and the optional PIN below is checked by the app, not enforced by
// the database. It keeps your startup's numbers off the screen when you hand
// someone your phone. It does not protect them from someone with your
// password.

const SIGNED_OUT_KEY = '@cth_profiles_signed_out';   // array of profile ids
const PIN_KEY_PREFIX = '@cth_profile_pin_';          // per-profile, hashed

export async function getSignedOutIds() {
  try {
    const raw = await AsyncStorage.getItem(SIGNED_OUT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function writeSignedOutIds(ids) {
  await AsyncStorage.setItem(SIGNED_OUT_KEY, JSON.stringify([...new Set(ids)]));
}

export async function signOutProfile(profileId) {
  const ids = await getSignedOutIds();
  await writeSignedOutIds([...ids, profileId]);
}

export async function signInProfile(profileId) {
  const ids = await getSignedOutIds();
  await writeSignedOutIds(ids.filter(id => id !== profileId));
}

export async function signInAllProfiles() {
  await AsyncStorage.removeItem(SIGNED_OUT_KEY);
}

// Small non-cryptographic digest. A 4-digit PIN has 10,000 possible values,
// so no hash meaningfully resists an offline attack on it — this exists so the
// PIN isn't sitting in AsyncStorage as literal plaintext, not to make it
// strong. Treat it accordingly and don't reuse this for anything real.
function digestPin(pin, profileId) {
  const input = `${profileId}:${pin}`;
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + ch + i, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16) + h2.toString(16));
}

export async function hasPin(profileId) {
  const v = await AsyncStorage.getItem(PIN_KEY_PREFIX + profileId);
  return !!v;
}

export async function setPin(profileId, pin) {
  if (!/^\d{4,8}$/.test(pin || '')) throw new Error('PIN must be 4-8 digits');
  await AsyncStorage.setItem(PIN_KEY_PREFIX + profileId, digestPin(pin, profileId));
}

export async function clearPin(profileId) {
  await AsyncStorage.removeItem(PIN_KEY_PREFIX + profileId);
}

export async function verifyPin(profileId, pin) {
  const stored = await AsyncStorage.getItem(PIN_KEY_PREFIX + profileId);
  if (!stored) return true; // no PIN set on this profile
  return stored === digestPin(pin, profileId);
}
