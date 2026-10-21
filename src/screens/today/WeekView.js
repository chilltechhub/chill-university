// src/screens/today/WeekView.js
// The Planner's Week, as a grid or day rows. Was WeeklyView in
// PlannerScreen.js (docs/shake-up-plan-2026-10-21.md P1). Reads useDayPlan,
// like the Day, Home's Today card and Calm's week.

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB_CLEARANCE } from '../../../context/FabPositionContext';
import { AREAS } from '../../api/plannerService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fmt12, byTime } from '../../logic/plannerLayout';
import { SkeletonRows } from '../../components/Skeleton';
import useDayPlan from '../../logic/useDayPlan';
import { toISO, getWeekDays, isOverdue } from './plannerShared';

// ─── Weekly view ──────────────────────────────────────────────────────────────
export default function WeekView({ userId, anchor, activeAreas, onDayPress, refreshKey, showingAll, c, t, s }) {
  // 'grid': the week side by side, seven columns. 'list': the day rows it
  // used to be, kept for long days. Remembered per device.
  const [layout, setLayout] = useState('grid');
  useEffect(() => {
    AsyncStorage.getItem(WEEK_LAYOUT_KEY).then(v => { if (v === 'list' || v === 'grid') setLayout(v); }).catch(() => {});
  }, []);
  const pickLayout = (v) => { setLayout(v); AsyncStorage.setItem(WEEK_LAYOUT_KEY, v).catch(() => {}); };
  const weekDays = getWeekDays(anchor);
  const today    = toISO(new Date());

  // Plans, deadlines and events for the week; the area filter applies
  // without a refetch (deadlines and events have no area, so it hides them).
  const { items, loading } = useDayPlan(
    { from: toISO(weekDays[0]), to: toISO(weekDays[6]) },
    { userId, allProfiles: showingAll, areas: activeAreas, refreshKey },
  );
  const { byDate, dueByDate, eventsByDate } = useMemo(() => {
    const plans = {}, dues = {}, evs = {};
    const put = (map, it) => { (map[it.date] = map[it.date] || []).push(it.raw); };
    items.forEach(it => put(it.src === 'planner' ? plans : it.src === 'due' ? dues : evs, it));
    Object.values(plans).forEach(list => list.sort(byTime));
    return { byDate: plans, dueByDate: dues, eventsByDate: evs };
  }, [items]);

  if (loading) return <SkeletonRows count={4} style={{ padding: s.lg }} />;

  const allItems = weekDays.flatMap(d => byDate[toISO(d)] || []);
  const allDue = weekDays.flatMap(d => dueByDate[toISO(d)] || []);
  const weekDone = allItems.filter(i => i.completed).length + allDue.filter(d => d.completed).length;
  const weekTotal = allItems.filter(i => !i.skipped).length + allDue.filter(d => d.kind !== 'project').length;

  const Toggle = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
      <Text style={{ flex: 1, fontSize: t.xs, color: c.text3 }}>
        {weekTotal ? `${weekDone} of ${weekTotal} done this week` : 'Nothing planned this week yet'}{allDue.length ? ` · ${allDue.filter(d => !d.completed).length} due` : ''}
      </Text>
      {[['grid', 'grid-outline', 'Week grid'], ['list', 'list-outline', 'Day list']].map(([key, icon, label]) => (
        <TouchableOpacity key={key} onPress={() => pickLayout(key)} accessibilityRole="button"
          accessibilityLabel={label} accessibilityState={{ selected: layout === key }}
          style={{ padding: 6, borderRadius: 8, borderWidth: 1, borderColor: layout === key ? c.teal : c.border, backgroundColor: layout === key ? c.teal + '18' : 'transparent' }}>
          <Ionicons name={icon} size={15} color={layout === key ? c.teal : c.text3} />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (layout === 'grid') return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.md, paddingBottom: FAB_CLEARANCE }}>
      {Toggle}
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {weekDays.map((day, i) => {
          const iso = toISO(day);
          const items = (byDate[iso] || []).filter(x => !x.skipped);
          const dueHere = dueByDate[iso] || [];
          const evHere = eventsByDate[iso] || [];
          const isToday = iso === today;
          const blocks = [
            ...dueHere.map(d => ({ key: d.key, due: d, title: d.kind === 'project' ? `Finish: ${d.title}` : d.title, done: d.completed })),
            ...evHere.map(e => ({ key: `e-${e.id}`, event: e, title: e.title, done: false })),
            ...items.map(x => ({ key: x.id, inst: x, title: x.title, done: x.completed })),
          ];
          const shown = blocks.slice(0, WEEK_GRID_MAX);
          return (
            <TouchableOpacity key={iso} onPress={() => onDayPress(day)} activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}: ${items.length} planned${dueHere.length ? `, ${dueHere.length} due` : ''}${evHere.length ? `, ${evHere.length} event${evHere.length === 1 ? '' : 's'}` : ''}. Open the day`}
              style={{ flex: 1, minWidth: 0, minHeight: 280, backgroundColor: isToday ? c.teal + '10' : c.bg1, borderRadius: 8, borderWidth: isToday ? 1.5 : 0.5, borderColor: isToday ? c.teal : c.border, paddingBottom: 4, overflow: 'hidden' }}>
              <View style={{ alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isToday ? c.teal : c.text3 }}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <View style={{ marginTop: 2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? c.teal : 'transparent' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isToday ? c.onFill : c.text1 }}>{day.getDate()}</Text>
                </View>
              </View>
              {shown.map(b => {
                const color = b.due ? c.gold : b.event ? c.text3 : (AREAS[b.inst.area]?.color || c.teal);
                const time = b.inst?.start_time ? shortTime(b.inst.start_time)
                  : b.event && !b.event.all_day && b.event.time ? shortTime(b.event.time) : null;
                return (
                  <View key={b.key} style={{ marginTop: 3, marginHorizontal: 2, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: color, backgroundColor: color + (b.done ? '12' : '26'), paddingHorizontal: 3, paddingVertical: 2, opacity: b.done ? 0.6 : 1 }}>
                    {b.due ? (
                      <Text style={{ fontSize: 11, fontWeight: '800', color: c.gold }}>{b.due.kind === 'project' ? 'FINISH' : 'DUE'}</Text>
                    ) : time ? (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text2 }}>{time}</Text>
                    ) : null}
                    <Text numberOfLines={3} style={{ fontSize: 11, lineHeight: 13, color: b.done ? c.text3 : c.text1, textDecorationLine: b.done ? 'line-through' : 'none' }}>{b.title}</Text>
                  </View>
                );
              })}
              {blocks.length > shown.length && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, textAlign: 'center', marginTop: 4 }}>+{blocks.length - shown.length}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={{ fontSize: 11, color: c.text3, textAlign: 'center', marginTop: s.sm }}>Tap a day to open it.</Text>
    </ScrollView>
  );

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: FAB_CLEARANCE }}>
      {Toggle}
      {weekDays.map((day, i) => {
        const iso     = toISO(day);
        const items   = byDate[iso] || [];
        const isToday = iso === today;
        const done    = items.filter(i => i.completed).length;
        const notDone = items.filter(i => isOverdue(i)).length;
        const dueHere = dueByDate[iso] || [];
        const evHere  = eventsByDate[iso] || [];
        return (
          <TouchableOpacity key={i} onPress={() => onDayPress(day)}
            style={{ backgroundColor: c.bg1, borderRadius: 12, marginBottom: s.sm, borderWidth: isToday ? 1.5 : 0.5, borderColor: isToday ? c.teal : c.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isToday ? c.teal : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isToday ? c.onFill : c.text1 }}>{day.getDate()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: isToday ? c.teal : c.text1 }}>
                  {day.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>
                  {items.length} {items.length === 1 ? 'item' : 'items'} · {done} done{notDone > 0 ? ` · ${notDone} not done` : ''}{dueHere.some(d => !d.completed) ? ` · ${dueHere.filter(d => !d.completed).length} due` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={c.text4} />
            </View>
            {dueHere.map(d => (
              <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Ionicons name={d.kind === 'project' ? 'flag-outline' : d.completed ? 'checkmark-circle' : 'ellipse-outline'} size={11} color={c.gold} />
                <Text style={{ flex: 1, fontSize: t.xs, color: d.completed ? c.text3 : c.text1, textDecorationLine: d.completed ? 'line-through' : 'none' }} numberOfLines={1}>
                  {d.kind === 'project' ? `Finish: ${d.title}` : `Due: ${d.title}`}
                </Text>
              </View>
            ))}
            {evHere.map(e => (
              <View key={`e-${e.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Ionicons name="calendar-outline" size={11} color={c.text3} />
                <Text style={{ flex: 1, fontSize: t.xs, color: c.text1 }} numberOfLines={1}>{e.title}</Text>
                {!e.all_day && !!e.time && <Text style={{ fontSize: 11, color: c.text3 }}>{fmt12(e.time)}</Text>}
              </View>
            ))}
            {items.slice(0, 3).map((inst, j) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AREAS[inst.area]?.color || c.teal }} />
                <Text style={{ flex: 1, fontSize: t.xs, color: inst.completed ? c.text3 : c.text1, textDecorationLine: inst.completed ? 'line-through' : 'none' }} numberOfLines={1}>{inst.title}</Text>
                {inst.start_time && <Text style={{ fontSize: 11, color: c.text3 }}>{fmt12(inst.start_time)}</Text>}
              </View>
            ))}
            {items.length > 3 && (
              <Text style={{ fontSize: t.xs, color: c.text3, padding: s.sm, paddingLeft: s.md }}>+{items.length - 3} more</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const WEEK_LAYOUT_KEY = '@cth_planner_week_layout';
const WEEK_GRID_MAX = 6;
// '14:30' -> '2:30p', '09:00' -> '9a': room for a time in a seventh of a phone.
function shortTime(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (!Number.isFinite(h)) return '';
  const hr = h % 12 || 12;
  return `${hr}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'a' : 'p'}`;
}
