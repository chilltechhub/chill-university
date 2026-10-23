// src/logic/useWelcomeTour.js
//
// Runs the welcome tour (src/logic/tourSteps.js) once, the first time a new
// account lands on Home after onboarding, and holds everything else back
// until it's over.
//
// Why it exists: after onboarding the guide used to go straight to the first
// goal's tasks, "teleporting" people into Library → Physical and the Planner
// without ever showing the tab bar, the top bar or the + button. Someone
// could finish the first goal and still not know how to get back to the
// Planner. A 2026-09-23 walkthrough on a fresh account found exactly that.
//
// The order is: onboarding → this tour → the guided first goal
// (useGuidedFirstGoal) → each screen's own first-visit tutorial. `holding`
// is what keeps the last two quiet until it's their turn.
//
// Only accounts onboarding queued (queueWelcomeTour) get it automatically.
// Everyone else has Settings → Replay Tutorial, which runs the same steps.
//
// Since 2026-10-21 the welcome queues it too, for a guest who kept going
// (stored under 'guest') or a new account, as 'pending-project': instead
// of the general tour it runs APP_TOUR (src/logic/guide/lessons/appTour.js),
// which starts from the project they just made and ends on their next
// mission, where the guided first goal takes over.

import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTour } from '../../context/TourContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useAccess } from '../../context/AccessContext';
import { markScreensSeen } from './useFirstVisitTutorial';
import { loadBuilds } from '../api/buildService';
import { buildTitle } from './builds';
import { appTour } from './guide/lessons/appTour';

const key = (uid) => `@cth_welcome_tour_${uid || 'guest'}`;
const PENDING = new Set(['pending', 'pending-noaim', 'pending-project']);
// Long enough for Home's widgets to load and their TourSpots to measure.
const SETTLE_MS = 1200;

// The running hook read its flag when the account signed in, which for a
// brand-new account was before onboarding queued anything. Told directly,
// same pattern as forgetSeenScreens.
const queueListeners = new Set();

/** Called by onboarding's finish(), or the welcome, before it leaves for Home. */
// `aimChosen` false when onboarding was skipped before the "What did you
// come here for?" card, so the tour doesn't open with "You came here to…"
// about a purpose they never picked. Stored as its own pending value.
// `afterWelcome`: they came through the welcome (and usually its project),
// so run APP_TOUR. uid null is the guest.
export async function queueWelcomeTour(uid, { aimChosen = true, afterWelcome = false } = {}) {
  const value = afterWelcome ? 'pending-project' : aimChosen ? 'pending' : 'pending-noaim';
  queueListeners.forEach(fn => fn(uid, value));
  try { await AsyncStorage.setItem(key(uid), value); } catch { /* the tour stays in Settings */ }
}

/** Has this account (or the guest, uid null) already had a welcome tour? */
export async function welcomeTourDone(uid) {
  try { return (await AsyncStorage.getItem(key(uid))) === 'done'; } catch { return false; }
}

/**
 * Call once, from AppInner, with the current route name.
 * @returns {{ holding: boolean }} true until the tour is done (or not due)
 */
export default function useWelcomeTour(routeName) {
  const { user } = useUserProgress();
  const { active: tourActive, startTour, startLesson } = useTour();
  const { activeObjective } = useAccess();
  const uid = user?.id || null;
  const mission = activeObjective?.active ? activeObjective.objective?.label || null : null;
  // null while loading, then 'pending' | 'done'. Anything but 'pending' in
  // storage (including nothing) means this account isn't due one.
  const [state, setState] = useState(null);

  useEffect(() => {
    let alive = true;
    setState(null);
    AsyncStorage.getItem(key(uid))
      .then(raw => { if (alive) setState(PENDING.has(raw) ? raw : 'done'); })
      .catch(() => { if (alive) setState('done'); });
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    const onQueued = (queuedUid, value = 'pending') => { if (queuedUid === uid) setState(value); };
    queueListeners.add(onQueued);
    return () => { queueListeners.delete(onQueued); };
  }, [uid]);

  const finish = useCallback((reason) => {
    // Knocked off by something else starting (rare: everything else is
    // holding). Leave it pending and it runs the next time Home is calm.
    if (reason === 'replaced') return;
    setState('done');
    AsyncStorage.setItem(key(uid), 'done').catch(() => {});
    // Only Home: the tour is just the tab bar and the + button now, so the
    // Library and Training still teach their basics (swiping pages, switching
    // games) the first time someone gets there.
    markScreensSeen(['Home']);
  }, [uid]);

  useEffect(() => {
    if (!PENDING.has(state) || tourActive || routeName !== 'Home') return undefined;
    let alive = true;
    const timer = setTimeout(async () => {
      if (state !== 'pending-project') {
        startTour({ onEnd: finish, welcome: true, aimChosen: state !== 'pending-noaim' });
        return;
      }
      const made = await loadBuilds(uid).catch(() => []);
      if (alive) startLesson(appTour({ project: made[0] ? buildTitle(made[0]) : null, mission }), { onEnd: finish });
    }, SETTLE_MS);
    return () => { alive = false; clearTimeout(timer); };
  }, [state, tourActive, routeName, startTour, startLesson, finish, uid, mission]);

  return { holding: state !== 'done' };
}
