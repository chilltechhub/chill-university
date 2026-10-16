// src/components/CalmWeek.js
// The Calm view's calendar: this week as one row of days (Sunday first, like
// the Planner), a dot under each day with something on it, and the picked
// day's first few things underneath. Same three sources as Home's Today's
// Activities and CalendarModal: Planner items, calendar events, tasks due.
// Tapping the list or "Planner →" opens the Planner on that day.

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/profileScopedClient';
import { dateStr } from '../logic/dateUtils';

const LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

export default function CalmWeek({ userId, refreshKey, onOpenDay }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  const today = dateStr(new Date());
  const days = weekOf(new Date());
  const [picked, setPicked] = useState(today);
  const [byDay, setByDay] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setByDay({}); return; }
      const week = weekOf(new Date());
      const from = dateStr(week[0]), to = dateStr(week[6]);
      try {
        const [ag, ev, tk] = await Promise.all([
          supabase.from('agenda_instances').select('id, title, date, start_time, completed, skipped').eq('user_id', userId).gte('date', from).lte('date', to),
          supabase.from('calendar_events').select('id, title, date, time, all_day').eq('user_id', userId).gte('date', from).lte('date', to),
          supabase.from('tasks').select('id, title, due_date, completed').eq('user_id', userId).gte('due_date', from).lte('due_date', to),
        ]);
        const by = {};
        const put = (d, item) => { (by[d] = by[d] || []).push(item); };
        (ag.data || []).filter(r => !r.skipped).forEach(r => put(r.date, { id: 'a' + r.id, title: r.title, time: r.start_time, done: !!r.completed, when: 'Any time' }));
        (ev.data || []).forEach(r => put(r.date, { id: 'e' + r.id, title: r.title, time: r.all_day ? null : r.time, done: false, when: 'All day' }));
        (tk.data || []).forEach(r => put(r.due_date, { id: 't' + r.id, title: r.title, time: null, done: !!r.completed, when: 'Due' }));
        Object.values(by).forEach(list => list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')));
        if (alive) setByDay(by);
      } catch (e) {
        console.warn('calmWeek', e?.message);
        if (alive) setByDay({});
      }
    })();
    return () => { alive = false; };
  }, [userId, today, refreshKey]));

  const list = byDay?.[picked] || [];
  // Same word the Planner uses for a past day's unticked item.
  const whenOf = (it) => (picked < today && !it.done ? 'Missed' : fmtTime(it.time) || it.when);
  const pickedDate = days.find(d => dateStr(d) === picked) || days[0];
  const dayName = picked === today ? 'today' : pickedDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: 22, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginTop: s.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', color: c.text3 }}>
          {pickedDate.toLocaleDateString('en-US', { month: 'long' })}
        </Text>
        <TouchableOpacity onPress={() => onOpenDay?.(picked)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open the Planner">
          <Text style={{ fontSize: t.xs, fontWeight: '800', color: accent.primary }}>Planner →</Text>
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
                <Text style={{ width: 66, fontSize: 12, fontWeight: '700', color: whenOf(it) === 'Missed' ? c.error : c.text3 }}>{whenOf(it)}</Text>
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
