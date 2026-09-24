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

import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTour } from '../../context/TourContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { markScreensSeen } from './useFirstVisitTutorial';

const key = (uid) => `@cth_welcome_tour_${uid}`;
// Long enough for Home's widgets to load and their TourSpots to measure.
const SETTLE_MS = 1200;

// The running hook read its flag when the account signed in, which for a
// brand-new account was before onboarding queued anything. Told directly,
// same pattern as forgetSeenScreens.
const queueListeners = new Set();

/** Called by onboarding's finish(), before it leaves for Home. */
export async function queueWelcomeTour(uid) {
  if (!uid) return;
  queueListeners.forEach(fn => fn(uid));
  try { await AsyncStorage.setItem(key(uid), 'pending'); } catch { /* the tour stays in Settings */ }
}

/**
 * Call once, from AppInner, with the current route name.
 * @returns {{ holding: boolean }} true until the tour is done (or not due)
 */
export default function useWelcomeTour(routeName) {
  const { user } = useUserProgress();
  const { active: tourActive, startTour } = useTour();
  const uid = user?.id || null;
  // null while loading, then 'pending' | 'done'. Anything but 'pending' in
  // storage (including nothing) means this account isn't due one.
  const [state, setState] = useState(null);

  useEffect(() => {
    let alive = true;
    setState(null);
    if (!uid) { setState('done'); return undefined; }
    AsyncStorage.getItem(key(uid))
      .then(raw => { if (alive) setState(raw === 'pending' ? 'pending' : 'done'); })
      .catch(() => { if (alive) setState('done'); });
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    const onQueued = (queuedUid) => { if (queuedUid === uid) setState('pending'); };
    queueListeners.add(onQueued);
    return () => { queueListeners.delete(onQueued); };
  }, [uid]);

  const finish = useCallback((reason) => {
    // Knocked off by something else starting (rare: everything else is
    // holding). Leave it pending and it runs the next time Home is calm.
    if (reason === 'replaced') return;
    setState('done');
    AsyncStorage.setItem(key(uid), 'done').catch(() => {});
    // The tour just covered these, so their own first-visit tutorials
    // would open by repeating it. They still teach the deeper parts from
    // Screen Tutorial in the menu.
    markScreensSeen(['Home', 'LibraryScreen', 'Training']);
  }, [uid]);

  useEffect(() => {
    if (state !== 'pending' || tourActive || routeName !== 'Home') return undefined;
    const timer = setTimeout(() => startTour({ onEnd: finish, welcome: true }), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [state, tourActive, routeName, startTour, finish]);

  return { holding: state !== 'done' };
}
