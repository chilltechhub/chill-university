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
import { useUserProgress } from '../../context/UserProgressContext';
import { FIRST_GOAL_GUIDE, CLAIM_STEP } from '../data/firstGoalGuide';
import { markScreensSeen } from './useFirstVisitTutorial';

const modeKey = (uid) => `@cth_first_goal_guide_${uid || 'guest'}`;
const HUBS = new Set(['Home', 'Training', 'LibraryScreen']);
// Where games run. Not calm in general (nobody gets pulled out of a game),
// but once the last step is done the guide says so right there, as a note
// that doesn't block the game, instead of saying nothing until they leave.
const PLAY_ROUTES = new Set(['Play', 'PlayGame']);
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
export default function useGuidedFirstGoal(routeName, { hold = false } = {}) {
  const { user, profile } = useUserProgress();
  const { activeObjective, loading, purpose } = useAccess();
  const { active: tourActive, startLesson, endTour } = useTour();
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
  // "How to get back" is said once, on the first step that takes someone
  // into a page that opens on top of another. The welcome tour used to
  // teach it up front; now it's taught where it's first needed.
  const backTaughtRef = useRef(false);

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

    const first = intro.done === 0 && !greetedRef.current;
    greetedRef.current = true;
    // How to get there without the guide, said once per step. Being carried
    // somewhere teaches nothing about finding it again.
    const pathNote = g.path ? ` To find it yourself later: ${g.path}.` : '';
    const title = key === 'claim'
      ? `${intro.objective.label} · all ${intro.total} done`
      : `Step ${n} of ${intro.total} · ${step.label}`;
    const lead = key === 'claim'
      ? `That's all ${intro.total}. Nice work.`
      : first
        // Said back in their words, so the first thing the guide does is
        // start on what they came for, not on a tour of the app.
        // (The welcome tour has just said "You came here to…", so this
        // doesn't say it again.)
        ? `Your first goal: ${intro.total} quick steps${purpose?.you && purpose.key === intro.objective.purpose ? ` to ${purpose.you}` : ''}, and I'll show you each one. First: ${lowerFirst(step.label)}.`
        : intro.done > 0
          ? `That's ${intro.done} of ${intro.total}. Next: ${lowerFirst(step.label)}.`
          : `Next: ${lowerFirst(step.label)}.`;

    const goParams = g.params === 'firstArea'
      ? { areaId: (Array.isArray(profile?.active_life_areas) && profile.active_life_areas[0]) || 'physical' }
      : (g.params && typeof g.params === 'object' ? g.params : undefined);
    const pushed = g.go && !HUBS.has(g.go);
    const backTip = pushed && !backTaughtRef.current
      ? ' When you are done, tap the arrow at the top left, or swipe right from the left edge, to go back.'
      : '';
    if (backTip) backTaughtRef.current = true;
    const pointAt = {
      title,
      body: g.say + backTip,
      go: g.go,
      goParams,
      id: g.spot || undefined,
      passthrough: g.mode === 'tap' && !!g.spot,
      // A 'point' step has nothing single to light up ("pick any subject
      // below"), so it used to dim and block the very screen it asked
      // them to use until they pressed Done. It's a note instead.
      nonBlocking: g.mode === 'point' || (g.mode === 'tap' && !g.spot),
      skipLabel: 'Not now',
    };
    // Already there: one bubble. Otherwise say what's next first, and the
    // Next button takes them.
    const here = routeName === g.go;
    // The "what's next" bubble doesn't block: the person may still be
    // finishing up where they are (typing the optional note under a rating,
    // or playing on after the round that ticked the step). Next is theirs
    // to press when they're ready.
    const inGame = PLAY_ROUTES.has(routeName);
    setJustTicked(false);
    const lessonSteps = here
      ? [{ ...pointAt, body: `${lead} ${g.say}${backTip}`, go: undefined }]
      : [{
          title,
          body: inGame
            ? `${lead} Keep playing if you like. When you're done, tap X at the top left, or tap Next and I'll take you back.`
            : `${lead} I'll take you there.${pathNote}`,
          skipLabel: 'Not now',
          nonBlocking: true,
          placement: inGame ? 'top' : undefined,
        }, pointAt];

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
  }, [intro, key, script, routeName, profile, purpose, startLesson, persistMode]);

  // Start the next piece of guidance once things are calm.
  const scriptScreens = script ? Object.values(script).map(s => s.go) : [];
  // A step that has just ticked gets its "next" note wherever the person is.
  // It used to wait for a hub, so finishing "open a class" on the Physics
  // page left them there with no word on what came next. The note doesn't
  // block (nonBlocking), so this still never pulls anyone out of a task.
  const [justTicked, setJustTicked] = useState(false);
  const prevKeyRef = useRef(key);
  useEffect(() => {
    const prev = prevKeyRef.current;
    prevKeyRef.current = key;
    if (prev && key && prev !== key) setJustTicked(true);
  }, [key]);
  useEffect(() => { if (tourActive) setJustTicked(false); }, [tourActive]);
  const calm = !!routeName && (HUBS.has(routeName) || scriptScreens.includes(routeName)
    || (key === 'claim' && PLAY_ROUTES.has(routeName))
    || justTicked);
  useEffect(() => {
    if (!guiding || hold || tourActive || !key || waiting || !calm) return;
    const timer = setTimeout(begin, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [guiding, hold, tourActive, key, waiting, calm, begin]);

  return { guiding };
}
