// src/logic/useDayPlan.js
// The one place "what's on" is read from (docs/shake-up-plan-2026-10-21.md
// §3.4): the Planner's rows (the phone's for a guest), deadlines and
// calendar events for a day or a range, merged by src/logic/dayPlan.js.
// Deliverables (P6) and class assignments (P11) join here when they exist.
//
// loadDayPlan is the fetch on its own, for Home, which keeps its own cache
// and instant ticks around it; useDayPlan is the same thing as a hook, for
// the Planner's views and Calm's week.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, unscoped } from '../api/profileScopedClient';
import { getInstances } from '../api/plannerService';
import { getDueItems } from '../api/deadlinesService';
import { mergeDayPlan, itemsByDate, splitDue } from './dayPlan';

async function getEvents(userId, from, to, allProfiles) {
  const { data, error } = await (allProfiles ? unscoped : supabase)
    .from('calendar_events').select('*')
    .eq('user_id', userId).gte('date', from).lte('date', to);
  return { data: data || [], error };
}

/**
 * The sources for `from`..`to` (inclusive, 'YYYY-MM-DD'). With no userId,
 * the guest's plans on the phone (deadlines and events need an account).
 *   allProfiles  every profile's plans and events, not just the active one
 *   due, events  false to skip a source a view doesn't show
 *   lateFrom     also deadlines from this day up to the day before `from`
 *                that aren't done: `late` (Home's "Late" items)
 * Throws if the plans can't be read and nothing is cached; `eventsError`
 * says the events didn't arrive (so a caller can keep what it had).
 */
export async function loadDayPlan(userId, { from, to = from, allProfiles = false, due = true, events = true, lateFrom = null } = {}) {
  const [instances, dueAll, ev] = await Promise.all([
    getInstances(userId, from === to ? { date: from, allProfiles } : { weekStart: from, weekEnd: to, allProfiles }),
    due && userId ? getDueItems(userId, lateFrom && lateFrom < from ? lateFrom : from, to) : [],
    events && userId ? getEvents(userId, from, to, allProfiles) : { data: [], error: null },
  ]);
  return {
    instances: instances || [],
    ...splitDue(dueAll, from, !!lateFrom),
    events: ev.data,
    eventsError: ev.error,
  };
}

/**
 * `range`: a 'YYYY-MM-DD' day or { from, to }. Options as loadDayPlan, plus
 * `areas` (a Set of life areas, applied without a refetch) and `refreshKey`
 * (bump it to re-read). `enabled` false holds off reading (still loading).
 * `loading` is true until the first read of a new range; a re-read keeps
 * the old items on screen until the new ones land.
 * `patchPlan(row)` merges a changed Planner row in place (a tick).
 */
export default function useDayPlan(range, {
  userId = null, allProfiles = false, areas = null, refreshKey = 0,
  due = true, events = true, lateFrom = null, enabled = true,
} = {}) {
  const { from, to } = typeof range === 'string' ? { from: range, to: range } : range;
  const queryKey = `${userId || 'guest'}|${from}|${to}|${allProfiles}|${due}|${events}|${lateFrom || ''}`;
  const [state, setState] = useState({ key: null, sources: null });
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const mine = ++seq.current;
    try {
      const sources = await loadDayPlan(userId, { from, to, allProfiles, due, events, lateFrom });
      if (mine === seq.current) setState({ key: queryKey, sources });
    } catch (e) {
      console.warn('useDayPlan', e?.message || e);
      if (mine === seq.current) setState(prev => (prev.key === queryKey ? prev : { key: queryKey, sources: { instances: [], due: [], late: [], events: [] } }));
    }
  }, [queryKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload, refreshKey]);

  const areaKey = areas ? [...areas].sort().join(',') : '';
  const sources = state.key === queryKey ? state.sources : null;
  const items = useMemo(() => (sources ? mergeDayPlan(sources, { areas }) : []), [sources, areaKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const byDate = useMemo(() => itemsByDate(items), [items]);

  const patchPlan = useCallback((row) => {
    if (!row?.id) return;
    setState(prev => (prev.sources ? {
      ...prev,
      sources: { ...prev.sources, instances: prev.sources.instances.map(i => (i.id === row.id ? { ...i, ...row } : i)) },
    } : prev));
  }, []);

  return { items, byDate, late: sources?.late || [], loading: !sources, reload, patchPlan };
}
