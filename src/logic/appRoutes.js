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

  if (TAB_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', { screen, params });
  }
  if (ROOT_SCREENS.has(screen)) {
    return navigation.navigate(screen, params);
  }
  if (CLASS_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', {
      screen: 'Library',
      params: { screen: 'ClassesStack', params: { screen, params } },
    });
  }
  return navigation.navigate('MainTabs', {
    screen: 'Library',
    params: { screen, params },
  });
}

/** True when `screen` is one this resolver knows how to reach. */
export function isKnownScreen(screen) {
  return TAB_SCREENS.has(screen) || ROOT_SCREENS.has(screen) || CLASS_SCREENS.has(screen);
}
