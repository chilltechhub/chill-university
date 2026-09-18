// context/ProfileAccountsContext.js
// The several Profiles one login can hold, and which one is currently active.
// Usage: const { profiles, active, activeType, switchProfile } = useProfiles();
//
// Replaces PersonaContext's single active_persona. A persona is now the TYPE
// of a profile, not the thing you switch between — someone with a day job and
// a night job has two BUSINESS profiles, each with its own name, targets,
// widgets and vault.
//
// ── What stays shared ────────────────────────────────────────────────────────
// XP, level, points and streak live on `profiles` and belong to the human,
// not the profile. One person, one progression, spanning all of them.
// Switching profiles never costs someone their streak. Each profile owns only
// its own context: name, targets, widget layout, curriculum track, vault.
//
// Must be mounted INSIDE UserProgressProvider — it reads `user` and `profile`
// (date_of_birth, active_profile_id) from there.

import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProgress } from './UserProgressContext';
import { setActiveProfileId } from '../src/logic/activeProfile';
import { getPersona, isPersonaAllowed, personasFor, defaultPersonaFor, DEFAULT_PERSONA } from '../src/data/personas';
import { communityAccess } from '../src/logic/accountAccess';
import { ageBandFor } from '../src/logic/profileResolver';
import {
  listProfiles, createProfile, renameProfile, archiveProfile, updateProfile,
  setActiveProfile as persistActiveProfile, reorderProfiles,
  getSignedOutIds, signOutProfile, signInProfile, signInAllProfiles,
  hasPin, setPin, clearPin, verifyPin,
} from '../src/api/profileAccountsService';

const ProfileAccountsContext = createContext(null);
const ACTIVE_KEY = '@cth_active_profile_id';

export function ProfileAccountsProvider({ children }) {
  const { user, profile } = useUserProgress();

  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [signedOutIds, setSignedOutIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadedForUser = useRef(null);
  const backfilledFor = useRef(null);

  // A guest never passed the age gate — LoginScreen's "Continue as guest"
  // resets straight into MainTabs, skipping onboarding and its birth-date
  // step. Unknown age has to read as restricted, or a kid tapping guest lands
  // in a profile full of business-credit content.
  //
  // Restricted = under 18 by birth date, or age unknown — the same test the
  // database's is_restricted_account() makes. NOT profile.is_minor on its
  // own: that's the digital-consent flag (under 13 in the US), so reading it
  // as "minor" let a 15-year-old add a Business profile.
  const ageUnknown = !user;
  const access = communityAccess(user ? profile : null);
  const restricted = access.restricted;
  const ageBand = user ? ageBandFor(profile) : 'teen';
  const personaCtx = useMemo(() => ({ isMinor: restricted, ageBand }), [restricted, ageBand]);
  const allowedTypes = useMemo(() => personasFor(personaCtx), [personaCtx]);

  // ── Load ───────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user) { setProfiles([]); setLoading(false); return []; }
    const rows = await listProfiles(user.id);
    setProfiles(rows);
    setLoading(false);
    return rows;
  }, [user]);

  useEffect(() => {
    getSignedOutIds().then(setSignedOutIds).catch(() => {});
    AsyncStorage.getItem(ACTIVE_KEY).then(saved => { if (saved) setActiveId(saved); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setProfiles([]); setActiveId(null); setLoading(false);
      loadedForUser.current = null; backfilledFor.current = null;
      return;
    }
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    setLoading(true);
    refresh();
  }, [user, refresh]);

  // ── Backfill: every account needs a master ─────────────────────────────────
  // The master profile is created by onboarding's finish(). Anyone who
  // onboarded BEFORE profiles existed — which is every existing user the day
  // this ships — has none, and with no profiles there is no switcher, so
  // there is no way to add one either. Same dead end if onboarding's create
  // ever fails.
  //
  // So: a signed-in account with zero profiles gets its master created here,
  // once. PERSONAL because it's the safe default and the only type that's
  // valid for every account including minors. Renaming or adding others is
  // then a normal in-app action.
  //
  // ── But NOT while onboarding is still running. ────────────────────────────
  // This effect used to fire the moment a new signup had a session, which is
  // milliseconds — while the user was still on the persona step choosing
  // "Student". It created the PERSONAL master first, and onboarding's own
  // createMasterProfile({type:'STUDENT'}) then lost to the partial unique
  // index on (user_id) where is_master, with finish() swallowing the
  // duplicate error as non-fatal. Net effect: every new account came out
  // PERSONAL no matter what was picked.
  //
  // The case this backfill exists for is "onboarding finished and there's
  // still no profile" — so wait until onboarding has actually finished
  // before deciding that. `onboarding_completed` comes from the profiles row
  // via UserProgressContext (getUserProfile selects *), and is set by
  // finish() in the same breath as the master profile it creates.
  //
  // Guarded by a ref (once per user per session) and by the partial unique
  // index — if two devices race, one insert simply loses and re-reads.
  useEffect(() => {
    if (!user || loading) return;
    if (profiles.length > 0) { backfilledFor.current = user.id; return; }
    // Onboarding is in flight (or the profile row hasn't loaded yet). Its
    // finish() creates the master with the type the user actually picked.
    if (profile?.onboarding_completed !== true) return;
    if (backfilledFor.current === user.id) return;
    backfilledFor.current = user.id;
    (async () => {
      // A kid's master profile is Student, not Personal — same rule as the
      // onboarding step, so a missed finish() doesn't land them elsewhere.
      const type = defaultPersonaFor(personaCtx);
      try {
        await createProfile(user.id, {
          type,
          name: getPersona(type).short,
          isMaster: true,
        });
      } catch (e) {
        // A duplicate-master race is expected and harmless; anything else is
        // worth seeing, but never worth blocking the app over.
        if (!/duplicate|unique/i.test(e?.message || '')) {
          console.warn('[profiles] master backfill', e?.message);
        }
      }
      await refresh();
    })();
  }, [user, loading, profiles.length, profile?.onboarding_completed, refresh, personaCtx]);

  // The account row is the cross-device answer for which profile is active.
  useEffect(() => {
    if (profile?.active_profile_id) setActiveId(prev => prev || profile.active_profile_id);
  }, [profile?.active_profile_id]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const master = useMemo(() => profiles.find(p => p.is_master) || null, [profiles]);

  // Profiles signed out on THIS device are hidden from the switcher, but stay
  // on the account untouched.
  const visible = useMemo(
    () => profiles.filter(p => !signedOutIds.includes(p.id)),
    [profiles, signedOutIds],
  );
  const signedOut = useMemo(
    () => profiles.filter(p => signedOutIds.includes(p.id)),
    [profiles, signedOutIds],
  );

  // Resolve the active profile defensively: the saved id may point at a
  // profile that was archived, signed out on this device, or belongs to an
  // account that has since been switched. Fall back to master, then to
  // whatever is visible.
  const active = useMemo(() => {
    if (!visible.length) return null;
    return visible.find(p => p.id === activeId)
        || (master && visible.find(p => p.id === master.id))
        || visible[0];
  }, [visible, activeId, master]);

  // Keep the persisted id in step with what actually resolved, so a stale id
  // doesn't sit in storage forever.
  useEffect(() => {
    if (active && active.id !== activeId) {
      setActiveId(active.id);
      AsyncStorage.setItem(ACTIVE_KEY, active.id).catch(() => {});
    }
  }, [active, activeId]);

  // Push the resolved profile down to the plain service functions, which have
  // no access to React context — see src/logic/activeProfile.js for why that
  // bridge exists. Runs on every change so a switch immediately re-scopes
  // every subsequent query and cache key.
  useEffect(() => {
    setActiveProfileId(active?.id || null);
  }, [active?.id]);

  const activeType = active?.type || DEFAULT_PERSONA;
  const activeDef = getPersona(activeType);
  const isMasterActive = !!active?.is_master;

  // ── Actions ────────────────────────────────────────────────────────────────

  const switchProfile = useCallback(async (profileId) => {
    const target = profiles.find(p => p.id === profileId);
    if (!target || signedOutIds.includes(profileId)) return false;
    setActiveId(profileId);
    AsyncStorage.setItem(ACTIVE_KEY, profileId).catch(() => {});
    if (user) {
      try { await persistActiveProfile(user.id, profileId); }
      catch (e) { console.warn('[profiles] persist active', e?.message); }
    }
    return true;
  }, [profiles, signedOutIds, user]);

  // Activates the new profile itself rather than leaving that to the caller.
  // A caller can't do it: switchProfile validates against the `profiles` array
  // captured in its closure, which by definition does not yet contain the row
  // that was just inserted — so the switch silently no-ops and the user is
  // left staring at the profile they were already on, wondering whether the
  // Create button worked.
  const addProfile = useCallback(async ({ type, name, emoji, baseline, activate = true }) => {
    if (!user) throw new Error('Sign in to add a profile');
    if (!isPersonaAllowed(type, personaCtx)) {
      throw new Error(ageBand === 'kid'
        ? 'Student is the profile type for your age.'
        : 'That profile type requires an adult account.');
    }
    const row = await createProfile(user.id, { type, name, emoji, baseline });
    await refresh();
    if (activate && row?.id) {
      setActiveId(row.id);
      AsyncStorage.setItem(ACTIVE_KEY, row.id).catch(() => {});
      try { await persistActiveProfile(user.id, row.id); }
      catch (e) { console.warn('[profiles] persist active', e?.message); }
    }
    return row;
  }, [user, personaCtx, ageBand, refresh]);

  // Creates the signup profile. Called once from onboarding — it's the master,
  // and it's what every fallback in this file resolves to.
  const createMasterProfile = useCallback(async ({ type, name, emoji, baseline }) => {
    if (!user) throw new Error('Not signed in');
    const safeType = isPersonaAllowed(type, personaCtx) ? type : defaultPersonaFor(personaCtx);
    const row = await createProfile(user.id, { type: safeType, name, emoji, baseline, isMaster: true });
    const rows = await refresh();
    if (row?.id) {
      setActiveId(row.id);
      AsyncStorage.setItem(ACTIVE_KEY, row.id).catch(() => {});
      try { await persistActiveProfile(user.id, row.id); } catch { /* non-fatal */ }
    }
    return row || rows[0];
  }, [user, personaCtx, refresh]);

  const rename = useCallback(async (profileId, name) => {
    await renameProfile(profileId, name);
    await refresh();
  }, [refresh]);

  const patch = useCallback(async (profileId, changes) => {
    await updateProfile(profileId, changes);
    await refresh();
  }, [refresh]);

  // Management actions belong to the master profile — that's what "the first
  // one controls all" means in practice. The database independently refuses
  // to archive or delete a master.
  const archive = useCallback(async (profileId) => {
    const target = profiles.find(p => p.id === profileId);
    if (!target) return;
    if (target.is_master) throw new Error('The master profile cannot be removed.');
    if (!isMasterActive) throw new Error('Switch to your master profile to remove profiles.');
    await archiveProfile(profileId);
    await refresh();
  }, [profiles, isMasterActive, refresh]);

  const reorder = useCallback(async (orderedIds) => {
    await reorderProfiles(orderedIds);
    await refresh();
  }, [refresh]);

  // ── Device sign in / out ───────────────────────────────────────────────────

  const signOut = useCallback(async (profileId) => {
    // Never strand the device with nothing to show.
    if (visible.length <= 1) throw new Error('At least one profile has to stay signed in on this device.');
    await signOutProfile(profileId);
    setSignedOutIds(await getSignedOutIds());
  }, [visible.length]);

  const signIn = useCallback(async (profileId, pin) => {
    if (pin !== undefined) {
      const okPin = await verifyPin(profileId, pin);
      if (!okPin) return false;
    } else if (await hasPin(profileId)) {
      return false; // caller must collect the PIN first
    }
    await signInProfile(profileId);
    setSignedOutIds(await getSignedOutIds());
    return true;
  }, []);

  const signInAll = useCallback(async () => {
    await signInAllProfiles();
    setSignedOutIds(await getSignedOutIds());
  }, []);

  const value = useMemo(() => ({
    // data
    profiles, visible, signedOut, active, master, loading,
    activeType, activeDef, isMasterActive,
    allowedTypes, restricted, ageBand,
    restrictedReason: ageUnknown ? 'guest'
      : ageBand === 'kid' ? 'kid'
      : access.reason === 'unknown-age' ? 'unknown'
      : (restricted ? 'minor' : null),
    // actions
    refresh, switchProfile, addProfile, createMasterProfile,
    rename, patch, archive, reorder,
    signOut, signIn, signInAll,
    hasPin, setPin, clearPin, verifyPin,
  }), [
    profiles, visible, signedOut, active, master, loading,
    activeType, activeDef, isMasterActive, allowedTypes, restricted, ageUnknown, ageBand, access.reason,
    refresh, switchProfile, addProfile, createMasterProfile,
    rename, patch, archive, reorder, signOut, signIn, signInAll,
  ]);

  return (
    <ProfileAccountsContext.Provider value={value}>
      {children}
    </ProfileAccountsContext.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(ProfileAccountsContext);
  if (!ctx) throw new Error('useProfiles must be inside ProfileAccountsProvider');
  return ctx;
}
