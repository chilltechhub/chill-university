// src/components/AreaPlanCalendar.js
// A week of this life area's Planner items, on the life area's own page.
//
// A Planner item tagged Physical never showed up on the Physical page, so
// tagging it looked like it did nothing ("I linked something in the planner
// to physical but when I went to the physical tab there was nothing about
// it", 2026-10-10), and the user asked for "a mini calendar in each". This
// is that: a week strip with a dot on days that have something, the chosen
// day's items (tick them off here), and "+ Plan" straight into the Planner's
// add sheet on that day, already in this area.

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { getInstances, completeInstance } from '../api/plannerService';
import { dateStr } from '../logic/dateUtils';
import { goToScreen } from '../logic/appRoutes';
import { textOn } from '../logic/contrast';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function weekOf(anchor) {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

const timeLabel = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`;
};

export default function AreaPlanCalendar({ areaId, areaLabel, color, navigation }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { user } = useUserProgress();
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dateStr(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const days = weekOf(anchor);
  const from = dateStr(days[0]);
  const to = dateStr(days[6]);

  const load = useCallback(async () => {
    if (!user?.id || !areaId) { setLoading(false); return; }
    try {
      const data = await getInstances(user.id, { weekStart: from, weekEnd: to, area: areaId });
      setRows((data || []).filter(x => !x.skipped));
    } catch (e) {
      console.warn('AreaPlanCalendar', e?.message);
    }
    setLoading(false);
  }, [user?.id, areaId, from, to]);
  // On focus, so something planned in the Planner and come back from is here.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // A guest has no Planner; nothing to show.
  if (!user?.id) return null;

  const todayIso = dateStr(new Date());
  const onColor = textOn(color);
  const byDay = rows.reduce((m, x) => { (m[x.date] = m[x.date] || []).push(x); return m; }, {});
  const dayItems = (byDay[selected] || []).sort((a, b) => (a.start_time || '99').localeCompare(b.start_time || '99'));
  const shiftWeek = (n) => {
    const next = new Date(anchor); next.setDate(anchor.getDate() + n * 7);
    setAnchor(next);
    setSelected(dateStr(weekOf(next)[n > 0 ? 0 : 6]));
    setLoading(true);
  };
  const toggleDone = async (item) => {
    setRows(prev => prev.map(x => (x.id === item.id ? { ...x, completed: !x.completed } : x)));
    try { await completeInstance(item.id, !item.completed); } catch { load(); }
  };
  const planHere = () => goToScreen(navigation, 'PlannerScreen', { addFor: { area: areaId, date: selected } });

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.sm }}>
        <TouchableOpacity onPress={() => shiftWeek(-1)} accessibilityRole="button" accessibilityLabel="Previous week" hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={16} color={color} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>
          {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => shiftWeek(1)} accessibilityRole="button" accessibilityLabel="Next week" hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="chevron-forward" size={16} color={color} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {days.map((d, i) => {
          const iso = dateStr(d);
          const on = iso === selected;
          const count = (byDay[iso] || []).length;
          return (
            <TouchableOpacity
              key={iso}
              onPress={() => setSelected(iso)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${count} planned`}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: r.md, backgroundColor: on ? color : 'transparent', borderWidth: iso === todayIso && !on ? 1 : 0, borderColor: color }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: on ? onColor : c.text3 }}>{DAY_LETTERS[i]}</Text>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: on ? onColor : c.text1, marginTop: 1 }}>{d.getDate()}</Text>
              <View style={{ height: 5, marginTop: 2, flexDirection: 'row', gap: 2 }}>
                {count > 0 && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: on ? onColor : color }} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginTop: s.sm }}>
        {loading ? <ActivityIndicator color={color} style={{ marginVertical: s.sm }} /> : dayItems.length === 0 ? (
          <Text style={{ fontSize: t.xs, color: c.text3, paddingVertical: s.sm }}>
            Nothing for {areaLabel} {selected === todayIso ? 'today' : 'this day'}.
          </Text>
        ) : dayItems.map(item => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: c.border }}>
            <TouchableOpacity
              onPress={() => toggleDone(item)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!item.completed }}
              accessibilityLabel={`${item.completed ? 'Not done' : 'Done'}: ${item.title}`}
              hitSlop={8}
            >
              <Ionicons name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.completed ? color : c.text4} />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: t.sm, color: item.completed ? c.text3 : c.text1, textDecorationLine: item.completed ? 'line-through' : 'none' }} numberOfLines={1}>
              {item.title}
            </Text>
            {item.cadence && item.cadence !== 'once' && <Ionicons name="repeat" size={12} color={c.text3} />}
            {!!item.start_time && <Text style={{ fontSize: t.xs, color: c.text3 }}>{timeLabel(item.start_time)}</Text>}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
        <TouchableOpacity
          onPress={planHere}
          accessibilityRole="button"
          accessibilityLabel={`Plan something for ${areaLabel}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: r.md, backgroundColor: color }}
        >
          <Ionicons name="add" size={16} color={onColor} />
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: onColor }}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => goToScreen(navigation, 'PlannerScreen', { date: selected })}
          accessibilityRole="button"
          style={{ paddingHorizontal: s.md, paddingVertical: 9, borderRadius: r.md, borderWidth: 1, borderColor: color, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color }}>Planner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
