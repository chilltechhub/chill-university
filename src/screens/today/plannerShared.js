// src/screens/today/plannerShared.js
// What the Planner's parts share: sizes, storage keys and date helpers.
// Moved out of PlannerScreen.js for the shake-up (docs/shake-up-plan-2026-10-21.md P1).

import { Dimensions } from 'react-native';
import { dateStr } from '../../logic/dateUtils';

const { width: SW } = Dimensions.get('window');
export const PANEL_W      = Math.min(SW * 0.82, 370);
export const VIEWS        = ['Daily', 'Weekly', 'Monthly'];
export const VIEW_SHORT   = { Daily: 'Day', Weekly: 'Week', Monthly: 'Month' };
export const HOUR_H       = 80; // px per hour in time view
export const DAY_START    = 6;  // 6am, unless something is planned earlier
export const DAY_END      = 22; // 10pm, unless something runs later
export const MIN_BOX_MINUTES = 30; // shortest an item is drawn, so its title fits
export const UNTIMED_PREVIEW = 3;  // any-time items shown before "Show all"
export const TIME_MODE_KEY = '@cth_planner_time_mode';
export const REPEAT_UNITS = { daily: 'days', weekly: 'weeks', monthly: 'months' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function toISO(d) { return dateStr(d); } // local calendar, not UTC
export function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
export function getWeekDays(anchor) {
  const base = new Date(anchor);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(base, i));
}
export function isOverdue(instance) {
  if (instance.completed || instance.skipped) return false;
  const today = toISO(new Date());
  return instance.date < today;
}

// The running goal's next Planner step, as the new-item sheet should open.
// "Put one small habit in the Planner" comes right after onboarding asked
// for "a habit you want to hold", so that answer is the habit: asking for
// it a second time, in a blank box, was the first thing a new account hit.
//
// The area comes from the goal too: a step that says "tagged Financial"
// (signal 'planner-item-added:financial') opens on Financial, and "plan one
// small thing for it" right after rating an area opens on that area. The
// sheet used to open on the person's first area whatever the goal said.
export function goalIdeaFor(objective, baseline, ratedArea = null) {
  if (!objective?.active || objective.complete) return null;
  const step = objective.nextStep;
  const signal = typeof step?.signal === 'string' ? step.signal : '';
  const named = signal.startsWith('planner-item-added:') ? signal.split(':')[1] : null;
  const ratesAnArea = (objective.objective?.steps || objective.steps || [])
    .some(st => typeof st.signal === 'string' && st.signal.startsWith('area-rated'));
  const goalArea = named || (signal === 'planner-item-added' && ratesAnArea ? ratedArea : null);
  const idea = step?.idea;
  if (!idea) return goalArea ? { area: goalArea } : null;
  const withArea = idea.area || !goalArea ? idea : { ...idea, area: goalArea };
  const own = typeof baseline?.habit_target === 'string' ? baseline.habit_target.trim() : '';
  if (withArea.title || !own || step.id !== 'habit') return withArea;
  return { ...withArea, title: own, mine: true };
}
