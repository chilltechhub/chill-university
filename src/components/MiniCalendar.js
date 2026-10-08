// src/components/MiniCalendar.js
// A small month grid for picking one day. Was the Planner's own (its add
// sheet); shared so a project's finish date and a project task's due date
// can be a real day too, not only "in 1 week / 1 month" (2026-10-07).
//
// Colours come in as props because it sits on two different surfaces: the
// themed Planner and the Workshop's blueprint paper.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dateStr } from '../logic/dateUtils';
import { textOn } from '../logic/contrast';

/**
 * @param {Date} value               the selected day
 * @param {(d: Date) => void} onChange
 * @param {string} color             accent (selection, today ring)
 * @param {{ bg: string, text: string, muted: string }} colors
 * @param {string} [minIso]          'YYYY-MM-DD'; earlier days can't be picked
 */
export default function MiniCalendar({ value, onChange, color, colors, minIso = null }) {
  const [viewMonth, setViewMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days  = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Always 6 week rows. A 5-row month made the calendar shorter, and inside a
  // bottom sheet that moved the month arrows up or down under the finger, so
  // the next tap landed on something else ("In 3 months", or the sheet's
  // toggle). Same height every month keeps the arrows still.
  const cells = [...days, ...Array(42 - days.length).fill(null)];
  const todayIso = dateStr(new Date());
  const selIso   = dateStr(value);

  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: color + '44' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <TouchableOpacity accessibilityLabel="Previous month" accessibilityRole="button" onPress={() => setViewMonth(new Date(year, month - 1, 1))} style={{ padding: 10 }}>
          <Ionicons name="chevron-back" size={16} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity accessibilityLabel="Next month" accessibilityRole="button" onPress={() => setViewMonth(new Date(year, month + 1, 1))} style={{ padding: 10 }}>
          <Ionicons name="chevron-forward" size={16} color={color} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.muted }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso     = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSel   = iso === selIso;
          const isToday = iso === todayIso;
          const before  = !!minIso && iso < minIso;
          return (
            <TouchableOpacity key={day} onPress={() => onChange(new Date(year, month, day))} disabled={before}
              accessibilityRole="button" accessibilityState={{ selected: isSel, disabled: before }}
              accessibilityLabel={new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', opacity: before ? 0.3 : 1 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isSel ? color : 'transparent',
                borderWidth: isToday && !isSel ? 1 : 0, borderColor: color,
              }}>
                <Text style={{ fontSize: 12, fontWeight: isSel ? '800' : '500', color: isSel ? textOn(color) : isToday ? color : colors.text }}>{day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={() => { setViewMonth(new Date()); onChange(new Date()); }} accessibilityRole="button" style={{ marginTop: 8, alignSelf: 'center', padding: 4 }}>
        <Text style={{ fontSize: 11, color, fontWeight: '700' }}>Today</Text>
      </TouchableOpacity>
    </View>
  );
}
