// src/logic/guide/useGuide.js
// The guide's one front door (docs/shake-up-plan-2026-10-21.md §7.1, P7),
// with the new tabs. One queue, one order:
//
//   1. guided unit     a unit's first time on its screen: the walk generated
//                      from its data (lessons/unitLesson.js), quiz last on
//                      the first one ever; one note on each later one
//   2. first-day walk  four steps on Today, once, for a new account or a
//                      guest who kept going (lessons/firstDayWalk.js)
//   3. mentor note     the first time someone sees a surface, one card
//                      (lessons/notes.js), at most one a session
//
// Kept from the old hooks: the "Page notes" switch
// (SCREEN_TUTORIALS_ENABLED) silences the automatic notes, mark before
// show and un-mark when something else replaced it, and the NEVER list.
// Nothing here changes Calm or Full: Calm users stay in Calm.
//
// Off (the new tabs off, the rollback), it does nothing and App.js runs the
// old welcome tour and first-visit tutorials instead.

import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTour } from '../../../context/TourContext';
import { useUserProgress } from '../../../context/UserProgressContext';
import { useAccess } from '../../../context/AccessContext';
import { SETTING_KEYS, peekSetting } from '../useSetting';
import { whenPrefsReady, onPrefsRestored } from '../prefsSync';
import { surfaceForRoute } from './surfaces';
import { loadGuideSeen, markGuideSeen, unmarkGuideSeen, seedGuideSeenOnce, loadUnitsSeen, markUnitSeen } from './seenSet';
import { getTodayView, onTodayView } from './guideState';
import { noteStep, NOTES } from './lessons/notes';
import { firstDayWalk } from './lessons/firstDayWalk';
import { unitLesson } from './lessons/unitLesson';
import { pageInfoFor } from '../../data/pageInfo';
import { UNIT_BY_ID } from '../../data/units';
import { BUILD_KIND_MAP } from '../../data/builds';
import { onWelcomeTourQueued } from '../useWelcomeTour';
import { loadBuilds } from '../../api/buildService';
import { buildTitle } from '../builds';

// Onboarding and sign-in own their screens; the Wayfinder opens on its own
// intro. Same list the first-visit tutorials kept.
const NEVER = new Set(['Welcome', 'Login', 'MultiStepOnboarding', 'ResetPassword', 'WayfinderScreen', 'Shared']);
// TourSpots measure on layout: a note started the instant a route changes
// has nothing to point at yet.
const SETTLE_MS = 650;
const WALK_SETTLE_MS = 1200;
const NOTES_PER_SESSION = 1;
let notesThisSession = 0;

// The first-day walk's state lives where the welcome tour's did
// (@cth_welcome_tour_<uid>), so whoever was queued for that gets this.
const walkKey = (uid) => `@cth_welcome_tour_${uid || 'guest'}`;
const PENDING = new Set(['pending', 'pending-noaim', 'pending-project']);

const notesOn = () => peekSetting(SETTING_KEYS.SCREEN_TUTORIALS_ENABLED, true) !== false;
const isCalm = () => peekSetting(SETTING_KEYS.HOME_VIEW, 'full') === 'calm';

/**
 * Call once, from AppInner.
 *   route     the focused route's name (routeLabel)
 *   params    its params
 *   enabled   the new tabs are on
 *   guiding   an old goal's walkthrough is running (useGuidedFirstGoal)
 *   canTeach  (route) => false for a screen showing a lock or a sign-in card
 * Returns { holding }: true while the first-day walk is due, so the old
 * goals' walkthrough waits for it.
 */
export default function useGuide({ route, params = null, enabled = false, guiding = false, canTeach = () => true }) {
  const { active: tourActive, startLesson, endTour } = useTour();
  const { user, profile } = useUserProgress();
  const { activeObjective } = useAccess();
  const uid = user?.id || null;
  const remotePrefs = profile?.metadata?.prefs || null;

  const seen = useRef(null);        // Set of surfaces, once seeded and loaded
  const unitsSeen = useRef(null);   // Set of unit ids
  const [walk, setWalk] = useState(null); // null loading · 'pending…' · 'done'
  const [view, setView] = useState(getTodayView());
  const timer = useRef(null);
  const armed = useRef(null);       // the surface a note is counting down for
  const showingFor = useRef(null);  // the surface the note (or its Show me) on screen is about

  useEffect(() => onTodayView(setView), []);

  // ── Load: after this sign-in's prefs restore, seed once, then read ──────
  const existingAccount = !!(user && profile?.onboarding_completed && !profile?.metadata?.shakeup_onboarded_at);
  const profileReady = !user || !!profile?.id;
  useEffect(() => {
    if (!enabled || !profileReady) return undefined;
    let alive = true;
    seen.current = null;
    unitsSeen.current = null;
    const read = async () => {
      await whenPrefsReady();
      await seedGuideSeenOnce(uid, { existingAccount });
      const [s, u] = await Promise.all([loadGuideSeen(uid, remotePrefs), loadUnitsSeen(uid, remotePrefs)]);
      if (alive) { seen.current = s; unitsSeen.current = u; }
    };
    read();
    const off = onPrefsRestored(read);
    return () => { alive = false; off(); };
  }, [enabled, uid, profileReady, existingAccount, remotePrefs]);

  useEffect(() => {
    let alive = true;
    setWalk(null);
    AsyncStorage.getItem(walkKey(uid))
      .then(raw => { if (alive) setWalk(PENDING.has(raw) ? raw : 'done'); })
      .catch(() => { if (alive) setWalk('done'); });
    const off = onWelcomeTourQueued((queuedUid, value) => { if (queuedUid === uid) setWalk(value || 'pending'); });
    return () => { alive = false; off(); };
  }, [uid]);

  const walkDue = enabled && PENDING.has(walk);

  // ── 1. A guided unit ──────────────────────────────────────────────────
  const unitId = activeObjective?.active && activeObjective.objective?.unit ? activeObjective.objective.id : null;
  useEffect(() => {
    if (!enabled || tourActive || route !== 'UnitScreen' || !unitId || params?.unitId !== unitId) return undefined;
    if (!unitsSeen.current || unitsSeen.current.has(unitId)) return undefined;
    const unit = UNIT_BY_ID[unitId];
    if (!unit) return undefined;
    const t = setTimeout(() => {
      const first = unitsSeen.current.size === 0;
      unitsSeen.current.add(unitId);
      markUnitSeen(uid, unitId);
      // The full walk says what a unit is, so the page's own note would only repeat it.
      if (first) { seen.current?.add('learn.unit'); markGuideSeen(uid, 'learn.unit'); }
      startLesson(unitLesson(unit, { first, kind: BUILD_KIND_MAP[unit.deliverable?.buildKind] || null }));
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [enabled, tourActive, route, params?.unitId, unitId, uid, startLesson]);

  // ── 2. The first-day walk ─────────────────────────────────────────────
  const endWalk = useCallback((reason) => {
    // Knocked off by something else starting: it runs the next time Today is calm.
    if (reason === 'replaced') return;
    setWalk('done');
    AsyncStorage.setItem(walkKey(uid), 'done').catch(() => {});
    // Today has just been shown around.
    ['today.day', 'today.calm'].forEach(id => { seen.current?.add(id); markGuideSeen(uid, id); });
  }, [uid]);

  useEffect(() => {
    if (!walkDue || tourActive || route !== 'Home') return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      const made = await loadBuilds(uid).catch(() => []);
      if (!alive) return;
      startLesson(firstDayWalk({ calm: isCalm(), project: walk === 'pending-project' && made[0] ? buildTitle(made[0]) : null }), { onEnd: endWalk });
    }, WALK_SETTLE_MS);
    return () => { alive = false; clearTimeout(t); };
  }, [walkDue, walk, tourActive, route, uid, startLesson, endWalk]);

  // ── 3. A mentor note ──────────────────────────────────────────────────
  const surface = enabled ? surfaceForRoute(route, { params, calm: isCalm(), view }) : null;
  useEffect(() => {
    // Left the surface we were counting down for: drop it.
    if (armed.current && armed.current !== surface) {
      clearTimeout(timer.current);
      timer.current = null;
      armed.current = null;
    }
    if (!enabled || !surface || !NOTES[surface] || NEVER.has(route) || !canTeach(route)) return;
    if (tourActive || guiding || walkDue) return;
    if (!seen.current || seen.current.has(surface) || armed.current === surface) return;
    if (notesThisSession >= NOTES_PER_SESSION) return;
    armed.current = surface;
    timer.current = setTimeout(() => {
      timer.current = null;
      armed.current = null;
      // Read here, not when armed, so switching it off takes effect at once.
      if (!notesOn() || notesThisSession >= NOTES_PER_SESSION || seen.current?.has(surface)) return;
      notesThisSession += 1;
      // Mark before showing: a note force-quit halfway never comes back.
      seen.current?.add(surface);
      markGuideSeen(uid, surface);
      const info = pageInfoFor(surface, route, {});
      let showing = false;
      const showMe = info?.show?.length ? () => { showing = true; startLesson(info.show); } : null;
      showingFor.current = surface;
      startLesson([noteStep(surface, { showMe })], {
        onEnd: (reason) => {
          // Replaced by something else before anyone read it: another go later.
          if (reason === 'replaced' && !showing) { seen.current?.delete(surface); unmarkGuideSeen(uid, surface); notesThisSession -= 1; }
        },
      });
    }, SETTLE_MS);
  }, [enabled, surface, route, tourActive, guiding, walkDue, uid, startLesson, canTeach]);

  // A note is about one page and one view: moving to another (Week to
  // Month, Today to Learn) ends it, Show me included. A note started with
  // startLesson isn't a screen tour, so nothing else ends it on a route
  // change (stress test 2026-10-24: the week note sat over the month).
  useEffect(() => {
    if (!tourActive) { showingFor.current = null; return; }
    if (showingFor.current && showingFor.current !== surface) {
      showingFor.current = null;
      endTour('left');
    }
  }, [surface, tourActive, endTour]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { holding: walkDue };
}
