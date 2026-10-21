// src/logic/widgetLayout.js
// The dashboard layout rules, kept pure so scripts/check-wiring.mjs can run
// them against saved layouts: a layout is an ordered list of
// { key, hidden } over src/data/dashboardWidgets.js's keys.

import { WIDGET_KEYS, WIDGET_ALIASES, NEW_WIDGETS_SHOWN } from '../data/dashboardWidgets';

// `wanted` visible in that order, then every other widget present but
// hidden (one tap away in the edit tray).
export function layoutFromWanted(wanted, keys = WIDGET_KEYS) {
  const known = new Set(keys);
  const visible = (wanted || []).filter(k => known.has(k));
  const shown = new Set(visible);
  return [
    ...visible.map(key => ({ key, hidden: false })),
    ...keys.filter(k => !shown.has(k)).map(key => ({ key, hidden: true })),
  ];
}

// Reconciles a saved layout against the widgets that exist — drops widgets
// that no longer exist (an older save referencing a removed key) and
// appends any new ones the user's never seen, so an app update that adds a
// widget doesn't silently hide it from someone with a saved layout already.
// A key that was renamed (WIDGET_ALIASES) takes its new name in the same
// place, so a saved order survives the rename; two old keys that became one
// keep the first one's place.
//
// New widgets are appended HIDDEN rather than visible. That was fine when
// one widget joined a list of eight; appending eleven persona widgets
// visible would rearrange the dashboard of every existing user without
// being asked. Someone with a saved layout keeps exactly what they had.
// NEW_WIDGETS_SHOWN are the exceptions.
//
// `fallback()` is the layout for someone with nothing saved.
export function reconcileWidgetLayout(stored, fallback, keys = WIDGET_KEYS) {
  if (!Array.isArray(stored) || stored.length === 0) return fallback();
  const known = new Set(keys);
  const kept = [];
  const seen = new Set();
  stored.forEach(l => {
    if (!l) return;
    const key = known.has(l.key) ? l.key : WIDGET_ALIASES[l.key];
    if (!key || !known.has(key) || seen.has(key)) return;
    seen.add(key);
    kept.push(key === l.key ? l : { ...l, key });
  });
  const added = keys.filter(k => !seen.has(k))
    .map(key => ({ key, hidden: !NEW_WIDGETS_SHOWN.has(key) }));
  // 'goalSteps' and 'stageSteps' go straight under the Compass card they
  // belong to, rather than to the bottom of the board, where the checklist
  // for the goal in flight — and the card saying what opens next — would sit
  // below everything they're meant to lead.
  const NEAR_COMPASS = ['goalSteps', 'stageSteps'];
  const movers = [];
  NEAR_COMPASS.forEach(key => {
    const at = added.findIndex(l => l.key === key);
    if (at >= 0) movers.push(...added.splice(at, 1));
  });
  if (movers.length) {
    const compassAt = kept.findIndex(l => l.key === 'compass');
    const out = [...kept];
    out.splice(compassAt >= 0 ? compassAt + 1 : 0, 0, ...movers);
    return [...out, ...added];
  }
  return [...kept, ...added];
}
