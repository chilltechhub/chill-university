// src/logic/todayParams.js
// What a link into the Planner asks for, as one decision. Old links name
// `PlannerScreen` (routeAliases.js sends them to Today once DASHBOARD_V2 is
// on); both screens read their params through this, so a link opens on the
// same day and view either way (docs/shake-up-plan-2026-10-21.md §3.2,
// "Route params editInstance, review, date, addFor").
//
//   editInstance  the row to edit: its day, with the edit sheet open
//   review        "Review & reschedule": today, from-earlier card open
//   date          'YYYY-MM-DD': that day
//   addFor        { date?, area? }: the add sheet, on that day, in that area
//   view          'day' | 'week' | 'month' (the FAB's Calendar opens Week)
//
// No imports, so scripts/check-planner.mjs runs it.

export const VIEW_PARAM = {
  day: 'Daily', daily: 'Daily', Daily: 'Daily',
  week: 'Weekly', weekly: 'Weekly', Weekly: 'Weekly',
  month: 'Monthly', monthly: 'Monthly', Monthly: 'Monthly',
};
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * params → { view, date, edit?, review?, add? } or null when there's
 * nothing to do. `today` is 'YYYY-MM-DD'. The keys it used are listed in
 * `used`, so the screen can clear exactly those.
 */
export function todayParamsAction(params, today) {
  if (!params || typeof params !== 'object') return null;
  const inst = params.editInstance;
  if (inst && typeof inst === 'object' && ISO.test(inst.date || '')) {
    return { view: 'Daily', date: inst.date, edit: inst, used: ['editInstance'] };
  }
  if (params.review) return { view: 'Daily', date: today, review: true, used: ['review'] };
  if (params.addFor && typeof params.addFor === 'object') {
    const date = ISO.test(params.addFor.date || '') ? params.addFor.date : today;
    return { view: 'Daily', date, add: { area: params.addFor.area || null }, used: ['addFor'] };
  }
  if (ISO.test(params.date || '')) {
    return { view: VIEW_PARAM[params.view] || 'Daily', date: params.date, used: ['date', 'view'].filter(k => k in params) };
  }
  if (VIEW_PARAM[params.view]) return { view: VIEW_PARAM[params.view], date: null, used: ['view'] };
  return null;
}

/**
 * A goal step that opens the Planner ("Put one thing in the Planner"), on
 * Today, where the Planner already is: the add sheet instead, in the area
 * its signal names ('planner-item-added:physical'). Null for any other
 * step, or one that already says what to open.
 */
export function plannerStepParams(step) {
  if (!step || step.screen !== 'PlannerScreen' || step.params) return null;
  const area = String(step.signal || '').split(':')[1] || null;
  return { addFor: { area } };
}
