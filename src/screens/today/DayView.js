// src/screens/today/DayView.js
// The Planner's Day: check-in, quick add, what's left from earlier, what's
// due, events, then the plan by time or as a list. Was DailyPage in
// PlannerScreen.js (docs/shake-up-plan-2026-10-21.md P1). What's on the day
// comes from useDayPlan, the same read as Home's Today card.

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import DailyCheckin from '../../components/DailyCheckin';
import PlannerBacklog from '../../components/PlannerBacklog';
import PlannerQuickAdd from '../../components/PlannerQuickAdd';
import { SkeletonRows } from '../../components/Skeleton';
import { PhoneEventsList } from '../../components/PhoneCalendar';
import useDayPlan from '../../logic/useDayPlan';
import { rowsOf } from '../../logic/dayPlan';
import { toISO } from './plannerShared';
import TimeView from './TimeView';
import ListView from './ListView';
import DueList from './DueList';
import EventsList from './EventsList';

// ─── Daily page ───────────────────────────────────────────────────────────────
// `userId` null: a guest, planning on the phone. The check-in and the list
// of what slipped read the account, so they wait for one.
export default function DayView({ userId, date, activeAreas, timeMode, onOpen, onAdd, onQuickAdded, quickArea, reviewAt, refreshKey, showingAll, c, t, s, r }) {
  const iso = toISO(date);
  // The spinner is for the first load only (the page remounts per day). A
  // reload after ticking or editing something swaps the rows in place, so
  // the page doesn't blank and jump back to the top after every change. The
  // area filter applies without a refetch.
  const { items, loading, reload, patchPlan } = useDayPlan(iso, { userId, allProfiles: showingAll, areas: activeAreas, refreshKey });
  const instances = useMemo(() => rowsOf(items, 'planner'), [items]);
  const due = useMemo(() => rowsOf(items, 'due'), [items]);
  const events = useMemo(() => rowsOf(items, 'event'), [items]);

  const handleUpdate = (updated) => {
    if (!updated) { reload(); return; }
    patchPlan(updated);
  };

  const completed = instances.filter(i => i.completed).length;
  const total     = instances.filter(i => !i.skipped).length;

  if (loading) return <SkeletonRows count={4} style={{ padding: s.lg }} />;

  const sharedProps = { instances, date, onUpdate: handleUpdate, onOpen, onAdd, onAddAt: (time) => onAdd(time), c, t, s, r };
  const isToday = iso === toISO(new Date());

  return (
    <View style={{ flex: 1 }}>
      {/* Check-in + progress */}
      <View style={{ paddingHorizontal: s.lg, paddingTop: s.sm }}>
        {!!userId && <DailyCheckin userId={userId} date={iso} />}
        {total > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
            <View style={{ flex: 1, height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: c.teal, width: `${(completed / total) * 100}%` }} />
            </View>
            <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.bold }}>{completed}/{total}</Text>
          </View>
        )}
      </View>
      {/* Type a plan in one line ("dentist thu 4pm"). */}
      {!showingAll && (
        <PlannerQuickAdd userId={userId} date={date} area={quickArea}
          onAdded={(row) => { reload(); onQuickAdded?.(row); }} c={c} t={t} s={s} r={r} />
      )}
      {/* Today only: what slipped from earlier days, and to-dos with no day. */}
      {isToday && !showingAll && !!userId && (
        <PlannerBacklog userId={userId} onChange={reload} openAt={reviewAt} c={c} t={t} s={s} r={r} />
      )}
      <DueList items={due} onChange={reload} label={isToday ? 'Due today' : 'Due'} c={c} t={t} s={s} r={r} />
      <EventsList events={events} c={c} t={t} s={s} r={r} />
      {/* Events from the phone's calendars, when connected (⋯ → Phone calendar). */}
      {!showingAll && <PhoneEventsList date={iso} c={c} t={t} s={s} r={r} />}
      {timeMode
        ? <TimeView {...sharedProps} />
        : <ListView {...sharedProps} />
      }
    </View>
  );
}
