// src/logic/routeAliases.js
// Old route names, and the route that answers for each once the shake-up
// moves it (docs/shake-up-plan-2026-10-21.md §2.5). Saved links
// (agenda_instances.link_screen), tours, objectives and 28 files name these
// routes, so the names stay and the alias does the moving.
//
// An alias only resolves when
//   - its target is a route the app has registered (`isKnown`), and
//   - its `gate`, if it has one, has been switched on (setAliasGate).
// So each can be written ahead of its phase and change nothing: `You` and
// `PathScreen` don't exist until P4 / P6, and PlannerScreen keeps opening
// the Planner until Today ships behind DASHBOARD_V2 (P3).
//
// `phase` marks a target that isn't registered yet. scripts/check-tour-spots.mjs
// fails on a target that is neither registered nor marked, so a typo here
// can't sit quietly as a no-op.
//
// No imports, so the check script can load it as-is.

export const ALIASES = {
  // Today is the Planner (§3). Params date / editInstance / review / addFor
  // pass straight through.
  PlannerScreen: { to: 'Home', gate: 'dashboardV2' },
  // You, the full-screen dropdown from the top bar (§2.2).
  Profile: { to: 'You', phase: 'P4' },
  // Goals become the path view in Learn.
  Compass: { to: 'PathScreen', phase: 'P6' },
  // Receipts live on You; the Stats route stays for "See all numbers".
  Stats: { to: 'You', params: { anchor: 'receipts' }, phase: 'P4' },
};

const gates = new Set();

/** Switches a gated alias on or off (DASHBOARD_V2 and the like). */
export function setAliasGate(gate, on) {
  if (on) gates.add(gate); else gates.delete(gate);
}

/** Is a gate on? (The tours ask whether Today is the Planner yet.) */
export function isAliasGateOn(gate) {
  return gates.has(gate);
}

/**
 * The route `screen` really opens, and with which params. Follows one alias
 * at most: an alias of an alias is a mistake the check script catches.
 * `isKnown` says whether a route is registered.
 */
export function resolveAlias(screen, params, isKnown) {
  const a = ALIASES[screen];
  if (!a || (a.gate && !gates.has(a.gate)) || !isKnown(a.to)) return { screen, params };
  return { screen: a.to, params: a.params ? { ...a.params, ...(params || {}) } : params, from: screen };
}
