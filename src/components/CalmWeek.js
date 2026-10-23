// src/components/CalmWeek.js
// The Calm view's calendar: this week as one row of days (Sunday first, like
// the Planner), a dot under each day with something on it, and the picked
// day's first few things underneath. It reads useDayPlan, the same as the
// Planner's Week and Home's Today card: Planner items, deadlines and
// calendar events (a guest's plans from the phone).
// Tapping the list or "Planner →" opens the Planner on that day. On Today
// (DASHBOARD_V2) the week follows the control row's ‹ › (anchor) and the
// link opens that day right there (openLabel).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import useDayPlan from '../logic/useDayPlan';
import { dateStr } from '../logic/dateUtils';

const LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WHEN = { planner: 'Any time', event: 'All day', due: 'Due' };
const SHOWN = 3;

function weekOf(d) {
  const base = new Date(d);
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(base); x.setDate(base.getDate() + i); return x; });
}
const fmtTime = (time) => {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (!Number.isFinite(h)) return null;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export default function CalmWeek({ userId, refreshKey, onOpenDay, anchor = null, openLabel = 'Planner →' }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  const today = dateStr(new Date());
  const days = weekOf(anchor || new Date());
  const first = dateStr(days[0]);
  const last = dateStr(days[6]);
  const [picked, setPicked] = useState(today);
  // A new week: today if it's in it, else its Sunday.
  useEffect(() => {
    setPicked(today >= first && today <= last ? today : first);
  }, [first]); // eslint-disable-line react-hooks/exhaustive-deps
  // Wait until we know who's signed in, or a signed-in person would see the
  // phone's guest plans for a moment.
  const { user, loading: authLoading } = useUserProgress();
  const ready = !!userId || (!user && !authLoading);
  const { items, loading, reload } = useDayPlan(
    { from: first, to: last },
    { userId, refreshKey, enabled: ready },
  );
  // Read again on coming back to Home (the first focus is the mount's read).
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    if (focused.current) reload();
    focused.current = true;
  }, [reload]));
  const byDay = useMemo(() => {
    if (loading) return null;
    const by = {};
    items.filter(it => !it.skipped).forEach(it => {
      (by[it.date] = by[it.date] || []).push({
        id: it.key,
        title: it.src === 'due' && it.kind === 'project' ? `Finish: ${it.title}` : it.title,
        time: it.time, done: it.done, when: WHEN[it.src] || 'Any time',
      });
    });
    return by;
  }, [items, loading]);

  const list = byDay?.[picked] || [];
  // Same words the Planner uses for a past day's unticked item: neutral,
  // never "missed" or "overdue" (docs/north-star.md).
  const whenOf = (it) => (picked < today && !it.done ? 'Still open' : fmtTime(it.time) || it.when);
  const pickedDate = days.find(d => dateStr(d) === picked) || days[0];
  const dayName = picked === today ? 'today' : pickedDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: 22, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginTop: s.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', color: c.text3 }}>
          {pickedDate.toLocaleDateString('en-US', { month: 'long' })}
        </Text>
        <TouchableOpacity onPress={() => onOpenDay?.(picked)} hitSlop={8} accessibilityRole="button" accessibilityLabel={openLabel === 'Planner →' ? 'Open the Planner' : `Open ${dayName}`}>
          <Text style={{ fontSize: t.xs, fontWeight: '800', color: accent.primary }}>{openLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row' }} accessibilityRole="tablist">
        {days.map(d => {
          const ds = dateStr(d);
          const items = byDay?.[ds] || [];
          const open = items.filter(i => !i.done).length;
          const missed = ds < today && open > 0;
          const isToday = ds === today;
          const isPicked = ds === picked;
          return (
            <TouchableOpacity key={ds} onPress={() => setPicked(ds)} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}
              accessibilityRole="tab" accessibilityState={{ selected: isPicked }}
              accessibilityLabel={`${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${items.length ? `, ${items.length} planned` : ', nothing planned'}`}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3 }}>{LETTER[d.getDay()]}</Text>
              <View style={{
                width: 34, height: 34, borderRadius: 17, marginTop: 4, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isToday ? accent.primary : 'transparent',
                borderWidth: isPicked && !isToday ? 1.5 : 0, borderColor: accent.primary,
              }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: isToday ? accent.onPrimary : ds < today ? c.text3 : c.text1 }}>{d.getDate()}</Text>
              </View>
              <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 5, backgroundColor: items.length ? (missed ? c.error : open ? accent.primary : c.text4) : 'transparent' }} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.sm }}>
        {byDay === null ? (
          <Text style={{ fontSize: t.sm, color: c.text3, paddingVertical: 6 }}>Loading…</Text>
        ) : list.length === 0 ? (
          <TouchableOpacity onPress={() => onOpenDay?.(picked)} accessibilityRole="button" accessibilityLabel={`Nothing planned ${dayName}. Plan it`}
            style={{ paddingVertical: 6 }}>
            <Text style={{ fontSize: t.sm, color: c.text3 }}>
              Nothing planned {dayName} · <Text style={{ fontWeight: '800', color: accent.primary }}>Plan →</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {list.slice(0, SHOWN).map(it => (
              <TouchableOpacity key={it.id} onPress={() => onOpenDay?.(picked)} accessibilityRole="button"
                accessibilityLabel={`${whenOf(it)}: ${it.title}${it.done ? ', done' : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 6 }}>
                <Text style={{ width: 66, fontSize: 12, fontWeight: '700', color: c.text3 }}>{whenOf(it)}</Text>
                <Text numberOfLines={1} style={{ flex: 1, fontSize: t.sm, fontWeight: '600', color: it.done ? c.text3 : c.text1, textDecorationLine: it.done ? 'line-through' : 'none' }}>
                  {it.title}
                </Text>
              </TouchableOpacity>
            ))}
            {list.length > SHOWN && (
              <TouchableOpacity onPress={() => onOpenDay?.(picked)} accessibilityRole="button" style={{ paddingTop: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>+{list.length - SHOWN} more</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}
