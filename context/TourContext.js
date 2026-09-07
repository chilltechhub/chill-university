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

  const registerNavigator = useCallback((fn) => { navigateRef.current = fn; }, []);

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
    if (step.tab) navigateRef.current?.('MainTabs', { screen: step.tab });
    else if (step.screen) navigateRef.current?.(step.screen);
    setStepIndex(index);
  }, [steps]);

  const start = useCallback(() => {
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
    setScopedSteps(buildScreenTutorial(routeName, personalization));
    setActive(true);
    setStepIndex(0);
  }, [personalization]);

  const finish = useCallback(() => {
    setActive(false);
    if (scopedSteps) { setScopedSteps(null); return; }
    AsyncStorage.setItem(SEEN_KEY, 'true');
  }, [scopedSteps]);

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) { finish(); return; }
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

  const value = useMemo(() => ({
    active, stepIndex, targets, steps,
    currentStep: active ? steps[stepIndex] : null,
    isLastStep: stepIndex >= steps.length - 1,
    registerNavigator, registerTarget, unregisterTarget, setPersonalization,
    startTour: start, startScreenTour, startIfFirstTime, nextStep: next, backStep: back, skipTour: finish,
  }), [active, stepIndex, targets, steps, registerNavigator, registerTarget, unregisterTarget, setPersonalization, start, startScreenTour, startIfFirstTime, next, back, finish]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}
