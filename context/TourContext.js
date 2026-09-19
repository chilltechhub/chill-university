// context/TourContext.js
// Coach-mark guided tour of the app's main features. The static spine of
// steps lives in src/logic/tourSteps.js; each real UI element the tour
// points at wraps itself in <TourSpot id="..."> (src/components/TourSpot.js),
// which measures its own on-screen position and registers it here. The
// overlay itself (src/components/TourOverlay.js) reads the current step +
// that element's measured rect and draws the spotlight/tooltip.
//
// On top of that static spine, `setPersonalization()` lets onboarding
// (MultiStepOnboarding.js) tailor the tour to what THIS user actually
// picked: the "Life Areas" step's body names their specific sectors
// instead of listing all eight, and — if their goals/interests point
// clearly at one Library section — an extra step is spliced in pointing
// straight at it (using the per-item `hub-<screen>` TourSpots registered
// in LibraryScreen.js). Persisted to AsyncStorage so it still applies if
// the tour's first auto-run happens after a cold start rather than in the
// same session onboarding finished in.
//
// Cross-screen steps work by calling the real navigator (registered once
// from AppInner, since that's where the NavigationContainer ref lives) —
// advancing past a step for a different tab/screen navigates there first;
// the overlay just waits for that screen's TourSpot to register before it
// has anything to highlight, so it never depends on guessing transition
// timing.

import React, {
  createContext, useContext, useState, useCallback, useRef, useMemo, useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOUR_STEPS } from '../src/logic/tourSteps';
import { buildScreenTutorial } from '../src/logic/screenTutorials';
import { useAccess } from './AccessContext';

const TourContext = createContext(null);
const SEEN_KEY = '@cth_setting_tourSeen';
const PERSONALIZATION_KEY = '@cth_setting_tourPersonalization';

// Splices the personalized touches into the static spine — never mutates
// TOUR_STEPS itself, so a tour started before personalization loads (or
// with none saved at all) still gets the sensible generic copy.
function buildSteps(personalization) {
  if (!personalization) return TOUR_STEPS;
  const { areaLabels, focusHub } = personalization;

  let steps = TOUR_STEPS;
  if (areaLabels?.length) {
    steps = steps.map(step => step.id === 'library-life-areas'
      ? { ...step, body: `${areaLabels.join(', ')} — the sectors you picked at setup. Check in on each and get tips tailored to it. Tap Add on the grid any time to bring in more.` }
      : step);
  }
  if (focusHub) {
    const idx = steps.findIndex(step => step.id === 'library-life-areas');
    const extra = {
      id: `hub-${focusHub.screen}`,
      tab: 'Library',
      title: focusHub.label,
      body: focusHub.reason,
    };
    steps = [...steps.slice(0, idx + 1), extra, ...steps.slice(idx + 1)];
  }
  return steps;
}

export function TourProvider({ children }) {
  // Screen tutorials are written for what the current stage shows — early
  // on, Home and the Library get short ones (see STARTER_FEATURES in
  // screenTutorials.js).
  const { can } = useAccess();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targets, setTargets] = useState({});
  const [personalization, setPersonalizationState] = useState(null);
  // Non-null while a single-screen tutorial (FAB → Tutorial) is running —
  // swaps out for the main tour's `steps` entirely and is never allowed to
  // navigate anywhere (see buildScreenTutorial). Cleared on finish/skip and
  // whenever the main tour is (re)started, so the two flows never bleed
  // into each other.
  const [scopedSteps, setScopedSteps] = useState(null);
  const navigateRef = useRef(null);
  // Like navigateRef, but resolves a bare screen name wherever it lives
  // (src/logic/appRoutes.js). Used by a step's `go`, which is how a scoped
  // walkthrough — the guided first goal — takes someone to the next place.
  const goToRef = useRef(null);
  // Told how a walkthrough ended: 'done' (finished, or the thing it asked
  // for was done), 'skip' (the person closed it), 'handoff' (whoever started
  // it ended it, e.g. the tap it asked for opened another screen), or
  // 'replaced' (another tour started over it). Only startLesson sets one.
  const onEndRef = useRef(null);
  const endWith = useCallback((reason) => {
    const cb = onEndRef.current;
    onEndRef.current = null;
    cb?.(reason);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PERSONALIZATION_KEY).then(raw => {
      if (!raw) return;
      try { setPersonalizationState(JSON.parse(raw)); } catch {}
    });
  }, []);

  // Called once, from MultiStepOnboarding.js's finish(), before it
  // navigates away — so the tour's very first auto-run already reflects
  // what this user just told onboarding they cared about.
  const setPersonalization = useCallback((prefs) => {
    setPersonalizationState(prefs);
    AsyncStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(prefs));
  }, []);

  const steps = useMemo(
    () => scopedSteps || buildSteps(personalization),
    [scopedSteps, personalization]
  );

  const registerNavigator = useCallback((fn, goTo) => {
    navigateRef.current = fn;
    if (goTo) goToRef.current = goTo;
  }, []);

  const registerTarget = useCallback((id, rect) => {
    setTargets((prev) => ({ ...prev, [id]: rect }));
  }, []);

  const unregisterTarget = useCallback((id) => {
    setTargets((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const goToStep = useCallback((index) => {
    const step = steps[index];
    if (!step) return;
    if (step.go) goToRef.current?.(step.go, step.goParams);
    else if (step.tab) navigateRef.current?.('MainTabs', { screen: step.tab });
    else if (step.screen) navigateRef.current?.(step.screen);
    setStepIndex(index);
  }, [steps]);

  const start = useCallback(() => {
    endWith('replaced');
    setScopedSteps(null); // the main tour always wins over a scoped one
    setTargets({});
    setActive(true);
    goToStep(0);
  }, [goToStep]);

  // Single-screen walkthrough from the FAB's "Tutorial" action — same
  // overlay, a short list built from src/logic/screenTutorials.js instead
  // of the app-wide spine, and it never navigates (every one of its steps
  // omits `tab`/`screen`, so goToStep is a no-op on that front).
  const startScreenTour = useCallback((routeName) => {
    endWith('replaced');
    // Deliberately NOT clearing `targets` here (unlike start(), above): the
    // main tour clears because it's about to navigate to a fresh screen,
    // whose TourSpots mount from scratch and register themselves via their
    // own onLayout. A screen tutorial never navigates — every TourSpot it
    // could possibly target is already mounted on the screen the user is
    // standing on, and onLayout only re-fires on an actual layout change,
    // not because some unrelated context state got cleared. Wiping targets
    // here left every already-mounted spot with no way to re-register,
    // which is why real content steps silently fell back to an
    // unspotlighted card while only the synthetic Navigation step (which
    // doesn't read the registry at all) ever lit up.
    setScopedSteps(buildScreenTutorial(routeName, personalization, { can }));
    setActive(true);
    setStepIndex(0);
  }, [personalization, can]);

  const finish = useCallback((reason = 'done') => {
    setActive(false);
    endWith(typeof reason === 'string' ? reason : 'done');
    if (scopedSteps) { setScopedSteps(null); return; }
    AsyncStorage.setItem(SEEN_KEY, 'true');
  }, [scopedSteps, endWith]);

  // The overlay's Skip. Wrapped so the press event never reaches finish()
  // as a reason.
  const skip = useCallback(() => finish('skip'), [finish]);
  // For whoever started a walkthrough to end it themselves.
  const endTour = useCallback((reason = 'handoff') => finish(reason), [finish]);

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) { finish('done'); return; }
    goToStep(stepIndex + 1);
  }, [stepIndex, steps.length, goToStep, finish]);

  const back = useCallback(() => {
    if (stepIndex <= 0) return;
    goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  // Auto-starts the tour once, the first time MainTabs is reached after
  // onboarding — a no-op every time after (AsyncStorage flag), and a no-op
  // if already active/started this session.
  const startIfFirstTime = useCallback(async () => {
    if (active) return;
    try {
      const seen = await AsyncStorage.getItem(SEEN_KEY);
      if (!seen) start();
    } catch {}
  }, [active, start]);

  // ── Teaching by doing ─────────────────────────────────────────────────────
  // Two things a step can declare so a walkthrough can hand the controls
  // over instead of narrating:
  //
  //   passthrough: true
  //     TourOverlay stops absorbing touches over the highlighted element, so
  //     the user can actually press the thing being pointed at. The step
  //     offers no Next — pressing the real control is what advances it, via
  //     completeAction() below.
  //
  //   prefill: { ...fields }
  //     Exposed as useTour().prefill for whatever screen owns that form to
  //     read when it opens. The form comes up filled in with a worked
  //     example (see src/config/chilltech.js) that the user can edit or
  //     replace. NOTHING IS WRITTEN by the tutorial — it only becomes a real
  //     row if the user saves, exactly as if they'd typed it.
  //
  // A screen consuming a prefill should clear its own copy on close; the
  // tutorial's copy goes away with the step.
  const currentStep = active ? steps[stepIndex] : null;

  // Called by a screen when the user does the thing a passthrough step asked
  // for. Advancing on the real action rather than on a Next button is the
  // whole point — otherwise it's still just a slideshow with a hole in it.
  const completeAction = useCallback(() => {
    if (!active) return;
    if (!steps[stepIndex]?.passthrough) return;
    next();
  }, [active, steps, stepIndex, next]);

  // ── Guide-taught lessons ──────────────────────────────────────────────────
  // A step can carry a `quiz: { question, options, answerIndex, explain }`
  // instead of plain prose. TourOverlay renders the options inside the speech
  // bubble; answering reveals which was right and why, and only then offers
  // Next. Used by the curriculum walkthroughs in
  // src/data/curriculum/guideLessons.js, where the guide summarises a module
  // and then checks the one thing people actually get wrong about it.
  //
  // The chosen answer lives here rather than in the overlay so it survives
  // the overlay re-rendering, and resets whenever the step changes.
  const [quizAnswer, setQuizAnswer] = useState(null);
  useEffect(() => { setQuizAnswer(null); }, [stepIndex, scopedSteps]);

  // Run an arbitrary step list — used by the curriculum walkthroughs, which
  // are built from content rather than from a screen's TourSpots. Same
  // overlay, same guide; it just never navigates and never spotlights,
  // because there is nothing on screen it is pointing at.
  //
  // `onEnd(reason)` hears how it ended (see onEndRef). A first step with
  // `go` navigates there before it shows, same as any later step.
  const startLesson = useCallback((lessonSteps, { onEnd } = {}) => {
    if (!lessonSteps?.length) return;
    endWith('replaced');
    onEndRef.current = onEnd || null;
    if (lessonSteps[0].go) goToRef.current?.(lessonSteps[0].go, lessonSteps[0].goParams);
    setScopedSteps(lessonSteps);
    setActive(true);
    setStepIndex(0);
  }, [endWith]);

  const answerQuiz = useCallback((optionIndex) => {
    setQuizAnswer(prev => (prev === null ? optionIndex : prev)); // first answer stands
  }, []);

  const value = useMemo(() => ({
    active, stepIndex, targets, steps,
    currentStep,
    isLastStep: stepIndex >= steps.length - 1,
    prefill: currentStep?.prefill || null,
    completeAction,
    quizAnswer, answerQuiz,
    registerNavigator, registerTarget, unregisterTarget, setPersonalization,
    startTour: start, startScreenTour, startLesson, startIfFirstTime, nextStep: next, backStep: back, skipTour: skip, endTour,
  }), [active, stepIndex, targets, steps, currentStep, completeAction, quizAnswer, answerQuiz, registerNavigator, registerTarget, unregisterTarget, setPersonalization, start, startScreenTour, startLesson, startIfFirstTime, next, back, skip, endTour]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}
