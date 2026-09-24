// src/logic/appRoutes.js
// Turns a bare screen name into a navigate() call that actually lands.
//
// The app has three levels of navigator — the root stack, the bottom tabs,
// and the Library tab's own stack (with Classes nested inside that again).
// A `navigation.navigate('ProjectsScreen')` from the root stack only works
// if the Library tab happens to be mounted already, which is exactly the
// footgun FloatingActionButton.js and searchIndex.js each have their own
// note about. The Compass navigates from all three levels — Home's card,
// the Compass screen on the root stack, and unlock sheets rendered inside
// Library screens — so it needs one resolver rather than a guess per site.
//
// Deliberately free of imports beyond one pure data catalog, for the same
// reason src/data/screenHelp.js is: this is reached from components that
// LibraryScreen itself imports, and pulling LibraryScreen back in the other
// direction would close a require cycle right through the provider tree.

import { CLASS_SCREEN_MAP } from '../data/classCatalog';

// Bottom tabs.
const TAB_SCREENS = new Set(['Home', 'Training', 'Library']);

// Root stack — see App.js's <Stack.Navigator>.
const ROOT_SCREENS = new Set([
  'Login', 'ResetPassword', 'MultiStepOnboarding', 'MainTabs',
  'Profile', 'Settings', 'Play', 'PlayGame', 'Leaderboard', 'Family',
  'ChildProgress', 'Organization', 'CohortRoster', 'Help', 'Compass', 'Stats', 'Plus',
]);

// The Classes stack, two levels down (Library -> ClassesStack -> screen).
// Subject screens come from the class catalog so adding a subject needs no
// edit here; the three that aren't subjects are listed out.
const CLASS_SCREENS = new Set([
  'ClassesMain', 'LessonBuilder', 'MyLessonPlans',
  ...Object.values(CLASS_SCREEN_MAP || {}),
]);

/**
 * Navigates to `screen` wherever it lives. Anything unrecognised is assumed
 * to be a Library-stack screen, which is true of the overwhelming majority
 * of this app's routes and degrades to today's behaviour if it isn't.
 */
export function goToScreen(navigation, screen, params) {
  if (!navigation || !screen) return;

  // Every jump returns to a screen that's already open rather than stacking
  // a copy (src/logic/navRules.js enforces the same at the router). Library
  // screens pass `initial: false` so a first visit to the tab still has the
  // Library underneath to go back to.
  if (screen === 'Library') {
    return navigation.navigate('MainTabs', { screen, params: params || { screen: 'LibraryScreen' } }, { pop: true });
  }
  if (TAB_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', { screen, params }, { pop: true });
  }
  if (ROOT_SCREENS.has(screen)) {
    return navigation.navigate(screen, params, { pop: true });
  }
  if (CLASS_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', {
      screen: 'Library',
      params: { screen: 'ClassesStack', initial: false, params: { screen, params } },
    }, { pop: true });
  }
  return navigation.navigate('MainTabs', {
    screen: 'Library',
    params: { screen, params, initial: false },
  }, { pop: true });
}

/** True when `screen` is one this resolver knows how to reach. */
export function isKnownScreen(screen) {
  return TAB_SCREENS.has(screen) || ROOT_SCREENS.has(screen) || CLASS_SCREENS.has(screen);
}

/**
 * A back button that always lands somewhere known.
 *
 * `navigation.goBack()` pops whatever happens to be underneath, and inside
 * the Library that is not always the screen the user came through. The tab
 * keeps its own stack, so opening a Library screen from Home (or from a
 * search result, a link, or a goal's "Open" button) pushes it on top of
 * whatever was last open in that tab — and Back then returned to a screen
 * the person had not visited in days, which reads as the app losing its
 * place.
 *
 * So: go back only when the thing underneath really is `screen`; otherwise
 * navigate to it. Either way the button means what it says.
 */
export function goBackTo(navigation, screen, params) {
  if (!navigation || !screen) return;
  const state = navigation.getState?.();
  const prev = state?.routes?.[(state.index ?? 0) - 1];
  if (prev && prev.name === screen) return navigation.goBack();
  return navigation.navigate(screen, params);
}
