// src/logic/useFirstVisitTutorial.js
//
// A short tutorial the first time you open each screen, and never again.
//
// This replaces the old model, where the app's only teaching was one
// fourteen-step tour fired 300ms after onboarding — a walkthrough of nine
// screens delivered before the user had reason to care about any of them,
// and nothing at all afterwards. Explaining the Workshop while someone is
// standing in the Workshop lands; explaining it during a queue of thirteen
// other explanations does not.
//
// Almost none of the machinery here is new. src/logic/screenTutorials.js
// already holds 20 hand-authored walkthroughs plus a fallback that turns
// SCREEN_HELP into steps for ~21 more, and already appends a Navigation step
// explaining the tab bar or back button. TourContext already has
// startScreenTour(). All that was missing was something to call it.
//
// What this adds:
//   - a per-route "seen" set in AsyncStorage, so each screen teaches once
//   - a check that the screen has real content (see hasScreenTutorial)
//   - the timing and the guards that stop it firing over something else

import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasScreenTutorial } from './screenTutorials';
import { SETTING_KEYS } from './useSetting';

const SEEN_KEY = '@cth_screen_tutorials_seen';
// Per account. It was one key per device, so a second account signing up
// on the same phone found Home, the Library and the rest already "seen"
// and was taught nothing. Set by the hook below; the module functions use it.
let activeUid = null;
const seenKey = () => (activeUid ? `${SEEN_KEY}_${activeUid}` : SEEN_KEY);
// Same storage key useSetting writes, read directly rather than through the
// hook: useSetting is built on useFocusEffect, and the only caller (AppInner)
// lives above NavigationContainer where there's no navigation context.
const ENABLED_KEY = '@cth_setting_' + SETTING_KEYS.SCREEN_TUTORIALS_ENABLED;

async function tutorialsEnabled() {
  try {
    const raw = await AsyncStorage.getItem(ENABLED_KEY);
    return raw === null ? true : JSON.parse(raw) !== false; // default on
  } catch {
    return true;
  }
}

// TourSpot measures itself on layout, so a tutorial started the instant a
// route change fires has nothing to spotlight yet and every step falls back
// to an unspotlighted card. Same reason SettingsScreen's Replay Tutorial
// defers before calling startTour.
const SETTLE_MS = 650;

// Never auto-teach these. Onboarding and auth own their whole screen and
// have their own explanation built in; interrupting either with a tutorial
// about it would be talking over the thing doing the talking. Wayfinder
// opens on its own guided intro for the same reason.
const NEVER = new Set(['Login', 'MultiStepOnboarding', 'ResetPassword', 'WayfinderScreen']);

export async function loadSeenScreens() {
  try {
    const raw = await AsyncStorage.getItem(seenKey());
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

// Exported for Settings' "show them all again".
export async function resetSeenScreens() {
  try { await AsyncStorage.removeItem(seenKey()); } catch { /* nothing to do */ }
}

// Lets a screen teach itself once more — used when a new experience stage
// opens (context/AccessContext.js), because Home and the Library genuinely
// have more on them than when their tutorial last ran. The running hook
// holds the seen set in memory, so it's told directly as well as the store.
const forgetListeners = new Set();
export async function forgetSeenScreens(routeNames = []) {
  forgetListeners.forEach(fn => fn(routeNames));
  try {
    const set = await loadSeenScreens();
    routeNames.forEach(n => set.delete(n));
    await AsyncStorage.setItem(seenKey(), JSON.stringify([...set]));
  } catch { /* the next launch just won't re-teach; not worth surfacing */ }
}

// The opposite: a screen that has just been taught some other way (the
// guided first goal teaches Home's goal card) shouldn't then run its own
// tutorial saying the same thing.
const seenListeners = new Set();
export async function markScreensSeen(routeNames = []) {
  seenListeners.forEach(fn => fn(routeNames));
  try {
    const set = await loadSeenScreens();
    routeNames.forEach(n => set.add(n));
    await AsyncStorage.setItem(seenKey(), JSON.stringify([...set]));
  } catch { /* worst case the screen teaches itself once; not worth surfacing */ }
}

/**
 * Returns a function to call with the current route name on every route
 * change. Safe to call repeatedly with the same name — it only ever acts
 * once per screen.
 *
 * @param tourActive true while any tour/tutorial is already running
 * @param startScreenTour  from useTour()
 * @param paused     true while the guide is walking someone through their
 *                   first goal (src/logic/useGuidedFirstGoal.js). Screens
 *                   visited meanwhile aren't marked seen, so they still
 *                   teach themselves on a later visit.
 */
export default function useFirstVisitTutorial({ tourActive, startScreenTour, paused = false, userId = null }) {
  const seen = useRef(null);          // Set, once loaded
  const pending = useRef(null);       // timer handle
  // Route we're currently counting down to teach. Lets a fast navigation
  // away cancel the tutorial for the screen the user already left.
  const armedFor = useRef(null);

  useEffect(() => {
    activeUid = userId || null;
    seen.current = null;
    loadSeenScreens().then(set => { seen.current = set; });
    const forget = (names) => names.forEach(n => seen.current?.delete(n));
    const mark = (names) => names.forEach(n => seen.current?.add(n));
    forgetListeners.add(forget);
    seenListeners.add(mark);
    return () => {
      forgetListeners.delete(forget);
      seenListeners.delete(mark);
      if (pending.current) clearTimeout(pending.current);
    };
  }, [userId]);

  // A tour starting for any reason (the Getting Started card, Settings'
  // replay, the FAB, the guide) cancels a pending auto-tutorial — two
  // overlays fighting over the same screen is worse than missing one.
  useEffect(() => {
    if ((tourActive || paused) && pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
      armedFor.current = null;
    }
  }, [tourActive, paused]);

  const markSeen = useCallback(async (routeName) => {
    const set = seen.current || new Set();
    set.add(routeName);
    seen.current = set;
    try {
      await AsyncStorage.setItem(seenKey(), JSON.stringify([...set]));
    } catch (e) {
      console.warn('screen tutorial: could not persist seen', e?.message);
    }
  }, []);

  return useCallback((routeName) => {
    if (!routeName) return;
    if (NEVER.has(routeName)) return;
    if (tourActive || paused) return;
    // Still loading the seen set. Skipping is the right call: showing a
    // tutorial someone already dismissed is more annoying than showing it
    // one screen visit later.
    if (!seen.current) return;
    if (seen.current.has(routeName)) return;
    if (!hasScreenTutorial(routeName)) return;
    if (armedFor.current === routeName) return;

    if (pending.current) clearTimeout(pending.current);
    armedFor.current = routeName;
    pending.current = setTimeout(async () => {
      pending.current = null;
      armedFor.current = null;
      // Checked here rather than at arm time so toggling it off in Settings
      // takes effect on the very next screen, with no reload.
      if (!(await tutorialsEnabled())) return;
      // Mark before showing, not after: if the user force-quits mid-tutorial
      // we'd rather they never see it again than see it every launch.
      // But one that another walkthrough replaced straight away (an unlock
      // sheet's "Show me", the guide) was never seen at all, and marking it
      // anyway is how Compass and the Library ended up "seen" on a fresh
      // account that had seen neither. Those get another go next visit.
      markSeen(routeName);
      startScreenTour(routeName, {
        onEnd: (reason) => { if (reason === 'replaced') forgetSeenScreens([routeName]); },
      });
    }, SETTLE_MS);
  }, [tourActive, paused, startScreenTour, markSeen]);
}
