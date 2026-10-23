// src/logic/appRoutes.js
// Turns a bare screen name into a navigate() call that actually lands.
//
// The app has three levels of navigator — the root stack, the bottom tabs,
// and the Library and Training tabs' own stacks (Classes nests inside
// Training's).
// A `navigation.navigate('ProjectsScreen')` from the root stack only works
// if the Library tab happens to be mounted already, which is exactly the
// footgun FloatingActionButton.js and searchIndex.js each have their own
// note about. The Compass navigates from all three levels — Home's card,
// the Compass screen on the root stack, and unlock sheets rendered inside
// Library screens — so it needs one resolver rather than a guess per site.
//
// Deliberately free of imports beyond one pure data catalog, for the same
// reason src/data/pageInfo.js is: this is reached from components that
// LibraryScreen itself imports, and pulling LibraryScreen back in the other
// direction would close a require cycle right through the provider tree.

import { CLASS_SCREEN_MAP } from '../data/classCatalog';
import { resolveAlias } from './routeAliases';

export { setAliasGate } from './routeAliases';

// Bottom tabs.
const TAB_SCREENS = new Set(['Home', 'Training', 'Library']);

// Root stack — see App.js's <Stack.Navigator>.
const ROOT_SCREENS = new Set([
  'Welcome', 'Login', 'ResetPassword', 'MultiStepOnboarding', 'MainTabs',
  'Profile', 'Settings', 'Play', 'PlayGame', 'Leaderboard', 'Family',
  'ChildProgress', 'Organization', 'CohortRoster', 'Help', 'Compass', 'Stats', 'Plus', 'WorkMode',
  'MakeItYours',
  'MyFeatures',
  'ConnectedApps',
  'Notifications', 'AllProfiles',
  // You, the dropdown from the top bar (shake-up P4).
  'You',
  // Sources and credits (shake-up P6).
  'Credits',
]);

// Learn's own stack, on top of its first screen (TrainingNav.js): Practice
// (shake-up P4), My path and its units (P6). Back returns to Learn.
const TRAINING_SCREENS = new Set(['Practice', 'PathScreen', 'UnitScreen']);

// The Classes stack, two levels down (Training -> ClassesStack -> screen).
// Subject screens come from the class catalog so adding a subject needs no
// edit here; the ones that aren't subjects are listed out.
const CLASS_SCREENS = new Set([
  'ClassesMain', 'LessonBuilder', 'MyLessonPlans', 'Quest', 'TopicCatalog', 'CurriculumModule',
  ...Object.values(CLASS_SCREEN_MAP || {}),
]);

/**
 * Navigates to `screen` wherever it lives. Anything unrecognised is assumed
 * to be a Library-stack screen, which is true of the overwhelming majority
 * of this app's routes and degrades to today's behaviour if it isn't.
 */
export function goToScreen(navigation, target, targetParams) {
  if (!navigation || !target) return;
  // An old name lands where it lives now (src/logic/routeAliases.js).
  const { screen, params } = resolveAlias(target, targetParams, isKnownScreen);

  // Every jump returns to a screen that's already open rather than stacking
  // a copy (src/logic/navRules.js enforces the same at the router). Library
  // screens pass `initial: false` so a first visit to the tab still has the
  // Library underneath to go back to.
  if (screen === 'Library') {
    return navigation.navigate('MainTabs', { screen, params: params || { screen: 'LibraryScreen' } }, { pop: true });
  }
  // Training is a stack too: its games screen is 'TrainingHome', and params
  // (openDrills) are that screen's, not the tab's.
  if (screen === 'Training' || screen === 'TrainingHome') {
    return navigation.navigate('MainTabs', { screen: 'Training', params: { screen: 'TrainingHome', params } }, { pop: true });
  }
  // Practice, My path, a unit: on top of Learn, so back returns there.
  if (TRAINING_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', { screen: 'Training', params: { screen, initial: false, params } }, { pop: true });
  }
  // `params` here is the Classes stack's own: { screen, params } inside it.
  if (screen === 'ClassesStack') {
    return navigation.navigate('MainTabs', {
      screen: 'Training',
      params: { screen: 'ClassesStack', initial: false, params: params || { screen: 'ClassesMain' } },
    }, { pop: true });
  }
  if (TAB_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', { screen, params }, { pop: true });
  }
  if (ROOT_SCREENS.has(screen)) {
    return navigation.navigate(screen, params, { pop: true });
  }
  if (CLASS_SCREENS.has(screen)) {
    return navigation.navigate('MainTabs', {
      screen: 'Training',
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
  return TAB_SCREENS.has(screen) || ROOT_SCREENS.has(screen) || CLASS_SCREENS.has(screen)
    || TRAINING_SCREENS.has(screen) || screen === 'ClassesStack' || screen === 'TrainingHome';
}

// The name a route goes by for tutorials, the guide and the top bar. The
// Training tab's first screen is 'TrainingHome' (src/screens/TrainingNav.js)
// but everything else knows it as 'Training'. An old name that now redirects
// goes by the route that answers for it.
export function routeLabel(name) {
  if (name === 'TrainingHome') return 'Training';
  return resolveAlias(name, undefined, isKnownScreen).screen;
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
