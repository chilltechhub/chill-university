// src/logic/useGuidedFirstGoal.js
//
// The guide leads the first goal.
//
// A new account is handed one simple goal at the end of onboarding
// (FIRST_GOALS in src/data/experienceStages.js). This walks through it with
// them, one step at a time: the guide says what's next, takes them there,
// lights up the thing to press, and steps aside while they do it. Each step
// ticks itself when it's actually done (a `signal` or an `auto` counter in
// objectives.js), which is what moves the guide on to the next one. Last of
// all it points at the Finish button on Home, and claiming the goal opens
// the next stage of the app.
//
// Rules it keeps:
//   - It never drags anyone mid-task. New guidance only starts on a calm
//     screen: Home, Training, the Library, or the screen the goal is about.
//     Someone halfway through a game is left alone until they come back.
//   - "Not now" pauses it until the next time they come back to Home. Two
//     in a row turns it off; the Compass card's "Show me how" turns it back
//     on (resumeFirstGoalGuide).
//   - While it's on, screens don't also run their own first-visit
//     tutorials (App.js passes `guiding` to useFirstVisitTutorial) — two
//     voices explaining different things at once is worse than either.
//
// Scripts live in src/data/firstGoalGuide.js.

import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccess } from '../../context/AccessContext';
import { useTour } from '../../context/TourContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { getGuide } from '../data/guides';
import { FIRST_GOAL_GUIDE, CLAIM_STEP } from '../data/firstGoalGuide';
import { markScreensSeen } from './useFirstVisitTutorial';

const modeKey = (uid) => `@cth_first_goal_guide_${uid || 'guest'}`;
const HUBS = new Set(['Home', 'Training', 'LibraryScreen']);
// Long enough for the screen's TourSpots to mount and measure, and for a
// step that just ticked to register as done before the next bubble lands.
const SETTLE_MS = 900;

// "Show me how" on the Compass card. Module-level, like forgetSeenScreens,
// because the card and the running hook don't share a parent to pass it by.
const resumeListeners = new Set();
export function resumeFirstGoalGuide() {
  resumeListeners.forEach(fn => fn());
}

const lowerFirst = (str = '') => str.charAt(0).toLowerCase() + str.slice(1);

/**
 * Call once, from AppInner, with the current route name.
 * @returns {{ guiding: boolean }} true while a first goal is being guided
 */
export default function useGuidedFirstGoal(routeName) {
  const { user, profile } = useUserProgress();
  const { activeObjective, loading } = useAccess();
  const { active: tourActive, startLesson, endTour } = useTour();
  const { activeType } = useProfiles();
  const uid = user?.id || null;

  const intro = activeObjective?.active && activeObjective.objective?.intro ? activeObjective : null;
  const script = intro ? FIRST_GOAL_GUIDE[intro.objective.id] : null;
  // What the guide is on: the next unticked step, or claiming the goal.
  const key = intro ? (intro.complete ? 'claim' : intro.nextStep?.id || null) : null;

  const [mode, setMode] = useState(null); // null while loading, then 'on' | 'off'
  // A step key the guide has handed over and is waiting on. Cleared when
  // that step gets done, or when the person comes back to Home.
  const [waiting, setWaiting] = useState(null);
  const skipsRef = useRef(0);
  const runRef = useRef(null); // { key, screen, arrived }
  const greetedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    setMode(null);
    setWaiting(null);
    skipsRef.current = 0;
    greetedRef.current = false;
    AsyncStorage.getItem(modeKey(uid))
      .then(raw => { if (alive) setMode(raw === 'off' ? 'off' : 'on'); })
      .catch(() => { if (alive) setMode('on'); });
    return () => { alive = false; };
  }, [uid]);

  const persistMode = useCallback((next) => {
    setMode(next);
    AsyncStorage.setItem(modeKey(uid), next).catch(() => {});
  }, [uid]);

  useEffect(() => {
    const resume = () => {
      skipsRef.current = 0;
      setWaiting(null);
      persistMode('on');
    };
    resumeListeners.add(resume);
    return () => { resumeListeners.delete(resume); };
  }, [persistMode]);

  const guiding = mode === 'on' && !!script && !loading;

  // The step it was waiting on is done — move on.
  useEffect(() => {
    if (waiting && waiting !== key) setWaiting(null);
  }, [waiting, key]);

  // Back on Home from somewhere else: try again from wherever the goal is.
  const prevRoute = useRef(routeName);
  useEffect(() => {
    const prev = prevRoute.current;
    prevRoute.current = routeName;
    if (waiting && routeName === 'Home' && prev && prev !== 'Home') setWaiting(null);
  }, [routeName, waiting]);

  // The walkthrough in flight ends when the step it points at gets done, or
  // when the tap it asked for took the person to another screen (tapping
  // into a game from Training, say) — the overlay must never sit over a
  // screen it isn't about.
  useEffect(() => {
    const run = runRef.current;
    if (!run || !tourActive) return;
    if (run.key !== key) { endTour('done'); return; }
    if (!run.screen) return;
    if (routeName === run.screen) run.arrived = true;
    else if (run.arrived) endTour('handoff');
  }, [key, routeName, tourActive, endTour]);

  const begin = useCallback(() => {
    if (!intro || !key) return;
    const g = key === 'claim' ? CLAIM_STEP : script?.[key];
    if (!g) return;
    const step = intro.steps.find(s => s.id === key);
    const n = intro.steps.findIndex(s => s.id === key) + 1;
    const guideName = getGuide(activeType)?.name;

    const first = intro.done === 0 && !greetedRef.current;
    greetedRef.current = true;
    const title = key === 'claim'
      ? `${intro.objective.label} · all ${intro.total} done`
      : `Step ${n} of ${intro.total} · ${step.label}`;
    const lead = key === 'claim'
      ? `That's all ${intro.total}. Nice work.`
      : first
        ? `Hi, I'm ${guideName || 'your guide'}. Your first goal is ${intro.total} quick steps, and I'll show you each one. First: ${lowerFirst(step.label)}.`
        : intro.done > 0
          ? `That's ${intro.done} of ${intro.total}. Next: ${lowerFirst(step.label)}.`
          : `Next: ${lowerFirst(step.label)}.`;

    const goParams = g.params === 'firstArea'
      ? { areaId: (Array.isArray(profile?.active_life_areas) && profile.active_life_areas[0]) || 'physical' }
      : undefined;
    const pointAt = {
      title,
      body: g.say,
      go: g.go,
      goParams,
      id: g.spot || undefined,
      passthrough: g.mode === 'tap' && !!g.spot,
      skipLabel: 'Not now',
    };
    // Already there: one bubble. Otherwise say what's next first, and the
    // Next button takes them.
    const here = routeName === g.go;
    const lessonSteps = here
      ? [{ ...pointAt, body: `${lead} ${g.say}`, go: undefined }]
      : [{ title, body: `${lead} I'll take you there.`, skipLabel: 'Not now' }, pointAt];

    // The guide just taught Home's one important card, so Home's own
    // first-visit tutorial would only repeat it.
    markScreensSeen(['Home']);
    runRef.current = { key, screen: g.go, arrived: here };
    startLesson(lessonSteps, {
      onEnd: (reason) => {
        runRef.current = null;
        if (reason === 'skip') {
          skipsRef.current += 1;
          if (skipsRef.current >= 2) { persistMode('off'); return; }
        } else if (reason === 'done' || reason === 'handoff') {
          skipsRef.current = 0;
        }
        // Wait for this step either way; if it's already done, the effect
        // above clears the wait at once and the next one starts.
        setWaiting(key);
      },
    });
  }, [intro, key, script, activeType, routeName, profile, startLesson, persistMode]);

  // Start the next piece of guidance once things are calm.
  const scriptScreens = script ? Object.values(script).map(s => s.go) : [];
  const calm = !!routeName && (HUBS.has(routeName) || scriptScreens.includes(routeName));
  useEffect(() => {
    if (!guiding || tourActive || !key || waiting || !calm) return;
    const timer = setTimeout(begin, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [guiding, tourActive, key, waiting, calm, begin]);

  return { guiding };
}
