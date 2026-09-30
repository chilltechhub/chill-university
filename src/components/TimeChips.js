// src/components/TimeChips.js
// A time picked with one tap from a row of common ones, for use inside a
// sheet that is already a Modal. TimePickerField opens a Modal of its own,
// and on web a Modal opened from inside another one can land behind it.
// Value in and out is 24-hour 'HH:MM', or '' for no set time.
import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { formatTime12 } from './TimePickerField';

const TIMES = ['', '07:00', '09:00', '10:00', '12:00', '15:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

// colors: { on, off, text, textOn, border }
export default function TimeChips({ value, onChange, colors, radius = 999, fontSize = 12, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={style}>
      {TIMES.map(tm => {
        const on = (value || '') === tm;
        return (
          <TouchableOpacity key={tm || 'any'} onPress={() => onChange(tm)} accessibilityRole="button"
            accessibilityState={{ selected: on }} accessibilityLabel={tm ? formatTime12(tm) : 'Any time'}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius, borderWidth: 1, borderColor: on ? colors.on : colors.border, backgroundColor: on ? `${colors.on}22` : colors.off }}>
            <Text style={{ fontSize, color: on ? colors.textOn : colors.text }}>{tm ? formatTime12(tm).replace(':00', '') : 'Any time'}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
