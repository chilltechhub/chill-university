// src/api/claimLocal.js
// At signup, what someone made as a guest becomes theirs on the account
// (docs/shake-up-plan-2026-10-21.md §7.2): their Builds ("A page about
// you" first), the plans they put in the Planner, and their Dream. The
// welcome's answers go into profiles.metadata in finish(); here they're
// forgotten on the phone.
//
// Points and XP don't carry: guest_progress never did (the anti-farming
// rule in UserProgressContext).
//
// Each part runs on its own: one failing leaves the rest done, and leaves
// that part's guest copy where it was, so nothing is lost.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadBuilds, saveBuild } from './buildService';
import { localAll, localDelete } from './localAgenda';
import { insertInstances, findPlansOn } from './plannerService';
import { loadLocalDream, loadDream, saveDream } from './dreamService';
import { forgetWelcomeAnswers } from './welcomeStore';
import { claimRows } from '../logic/agendaRows';
import { isSamePlan } from '../logic/plannerLayout';
import { isDreamEmpty } from '../logic/dream';

/**
 * `profileId`: the profile the plans belong to (the new master profile),
 * set on each row so they land there whatever profile is active yet.
 * Resolves what moved: { builds, plans, dream }.
 */
export async function claimLocal(userId, { profileId = null } = {}) {
  const moved = { builds: 0, plans: 0, dream: false };
  if (!userId) return moved;

  try {
    const guestBuilds = await loadBuilds(null);
    for (const b of [...guestBuilds].reverse()) { // oldest first, so newest ends up on top
      if (await saveBuild(userId, b)) moved.builds++;
    }
    if (guestBuilds.length) await AsyncStorage.removeItem('@cth_builds_guest');
  } catch (e) { console.warn('[claimLocal] builds', e?.message); }

  try {
    const local = await localAll();
    if (local.length) {
      const existing = await findPlansOn(userId, [...new Set(local.map(r => r.date))]);
      const rows = claimRows(local, existing, userId, isSamePlan)
        .map(r => (profileId ? { ...r, profile_id: profileId } : r));
      if (rows.length) await insertInstances(userId, rows);
      await localDelete(local.map(r => r.id));
      moved.plans = rows.length;
    }
  } catch (e) { console.warn('[claimLocal] plans', e?.message); }

  try {
    const guestDream = await loadLocalDream(null);
    if (!isDreamEmpty(guestDream)) {
      // An account that already has a Dream keeps its own.
      if (isDreamEmpty(await loadDream(userId))) {
        await saveDream(userId, guestDream);
        moved.dream = true;
      }
      await AsyncStorage.removeItem('@cth_dream_guest');
    }
  } catch (e) { console.warn('[claimLocal] dream', e?.message); }

  try { await forgetWelcomeAnswers(); } catch (e) { console.warn('[claimLocal] welcome', e?.message); }
  return moved;
}
