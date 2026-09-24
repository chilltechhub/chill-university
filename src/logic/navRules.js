// src/logic/navRules.js
// Two rules for how "go to X" and "back" behave, applied at the router so
// every navigate() in the app follows them, not just the ones that remember.
//
// 1. Going to a screen that's already open goes BACK to it (rootStackRouter).
//    React Navigation 7 changed navigate(): it now always pushes a new copy
//    unless told { pop: true }. So "Home" from inside a game pushed a second
//    MainTabs over the game (stack: MainTabs, Play, MainTabs): the game never
//    closed, back from Home went into the game, and every jump from Settings,
//    Help, search or a notification added another copy of the whole app.
//    This puts back the old behaviour: navigate to a route already in the
//    stack pops to it.
//
// 2. Library tools sit directly on the Library (libraryStackRouter). The
//    Library tab keeps its own stack, and jumps into it from elsewhere (the
//    guide, the Compass, Home's cards, search) used to pile up: Library,
//    Physical, Planner... So back from the Planner went to Physical, and the
//    Library tab reopened on whatever was last on top. Now opening any
//    top-level tool (a life area, the Planner, the Vault, the Workshop...)
//    resets the stack to [Library, that tool], so back and swipe-back always
//    land on the Library. Screens opened FROM a tool (a project, a life-area
//    section) still stack on it as normal, and back returns to the tool.

const withPop = (action) => (
  action?.type === 'NAVIGATE' && action.payload && action.payload.pop === undefined
    ? { ...action, payload: { ...action.payload, pop: true } }
    : action
);

/** For the root Stack.Navigator's UNSTABLE_router. */
export const rootStackRouter = (original) => ({
  ...original,
  getStateForAction(state, action, options) {
    return original.getStateForAction(state, withPop(action), options);
  },
});

const ROOT = 'LibraryScreen';
const rootKey = () => `${ROOT}-${Math.random().toString(36).slice(2, 10)}`;

// A stack that starts on a tool (the tab's first visit came straight from a
// jump elsewhere) still gets the Library underneath it, so back works.
function withLibraryUnder(state, routeParamList) {
  if (!state?.routes?.length || state.routes[0].name === ROOT) return state;
  return {
    ...state,
    index: state.index + 1,
    routes: [{ key: rootKey(), name: ROOT, params: routeParamList?.[ROOT] }, ...state.routes],
  };
}

/**
 * For the Library Stack.Navigator's UNSTABLE_router.
 * @param toolScreens Set of route names that are top-level Library tools.
 */
export const libraryStackRouter = (toolScreens) => (original) => ({
  ...original,
  getInitialState(options) {
    return withLibraryUnder(original.getInitialState(options), options.routeParamList);
  },
  getRehydratedState(partial, options) {
    return withLibraryUnder(original.getRehydratedState(partial, options), options.routeParamList);
  },
  getStateForAction(state, action, options) {
    const name = action?.payload?.name;
    const isOpen = (action?.type === 'NAVIGATE' || action?.type === 'PUSH') && toolScreens.has(name);
    const current = state.routes[state.index];
    // Re-opening the tool that's on screen (Physical → Mental) just updates
    // it in place, which is what navigate already does.
    if (!isOpen || current?.name === name) {
      return original.getStateForAction(state, withPop(action), options);
    }
    const root = state.routes[0]?.name === ROOT
      ? state.routes[0]
      : { key: rootKey(), name: ROOT, params: options.routeParamList?.[ROOT] };
    const base = {
      ...state,
      index: 0,
      routes: [root],
      preloadedRoutes: (state.preloadedRoutes || []).filter(r => r.name !== name),
    };
    return original.getStateForAction(base, { ...action, type: 'PUSH' }, options);
  },
});
