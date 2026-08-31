// context/TourContext.js
// Coach-mark guided tour of the app's main features. Steps live in
// src/logic/tourSteps.js; each real UI element the tour points at wraps
// itself in <TourSpot id="..."> (src/components/TourSpot.js), which
// measures its own on-screen position and registers it here. The overlay
// itself (src/components/TourOverlay.js) reads the current step + that
// element's measured rect and draws the spotlight/tooltip.
//
// Cross-screen steps work by calling the real navigator (registered once
// from AppInner, since that's where the NavigationContainer ref lives) —
// advancing past a step for a different tab/screen navigates there first;
// the overlay just waits for that screen's TourSpot to register before it
// has anything to highlight, so it never depends on guessing transition
// timing.

import React, {
  createContext, useContext, useState, useCallback, useRef, useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOUR_STEPS } from '../src/logic/tourSteps';

const TourContext = createContext(null);
const SEEN_KEY = '@cth_setting_tourSeen';

export function TourProvider({ children }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targets, setTargets] = useState({});
  const navigateRef = useRef(null);

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
    const step = TOUR_STEPS[index];
    if (!step) return;
    if (step.tab) navigateRef.current?.('MainTabs', { screen: step.tab });
    else if (step.screen) navigateRef.current?.(step.screen);
    setStepIndex(index);
  }, []);

  const start = useCallback(() => {
    setTargets({});
    setActive(true);
    goToStep(0);
  }, [goToStep]);

  const finish = useCallback(() => {
    setActive(false);
    AsyncStorage.setItem(SEEN_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) { finish(); return; }
    goToStep(stepIndex + 1);
  }, [stepIndex, goToStep, finish]);

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
    active, stepIndex, targets, steps: TOUR_STEPS,
    currentStep: active ? TOUR_STEPS[stepIndex] : null,
    isLastStep: stepIndex >= TOUR_STEPS.length - 1,
    registerNavigator, registerTarget, unregisterTarget,
    startTour: start, startIfFirstTime, nextStep: next, backStep: back, skipTour: finish,
  }), [active, stepIndex, targets, registerNavigator, registerTarget, unregisterTarget, start, startIfFirstTime, next, back, finish]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}
