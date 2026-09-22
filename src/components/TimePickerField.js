// src/components/TimePickerField.js
// A time you pick instead of type. Replaces free-text "e.g. 08:00" fields,
// where "8am", "8:00 pm" and "0800" all silently saved as garbage.
// Value in and out is 24-hour 'HH:MM' (what agenda_instances.start_time
// stores), or '' for no time. Pure JS, so it works in Expo Go and on web.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './ui';

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function parse(value) {
  const m = /^(\d{1,2}):(\d{2})/.exec(value || '');
  if (!m) return { h12: 9, min: '00', pm: false };
  const h = Math.min(23, Number(m[1]));
  const min = String(Math.round(Number(m[2]) / 5) * 5 % 60).padStart(2, '0');
  return { h12: h % 12 || 12, min, pm: h >= 12 };
}

export function formatTime12(value) {
  if (!value) return '';
  const { h12, min, pm } = parse(value);
  return `${h12}:${min} ${pm ? 'PM' : 'AM'}`;
}

export default function TimePickerField({ value, onChange, placeholder = 'Pick a time', style }) {
  const { colors: c, typography: t, spacing: s, radius: r, style: ui, accent } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(parse(value));
  useEffect(() => { if (open) setDraft(parse(value)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    const h24 = (draft.h12 % 12) + (draft.pm ? 12 : 0);
    onChange(`${String(h24).padStart(2, '0')}:${draft.min}`);
    setOpen(false);
  };

  const chip = (on) => ({
    minWidth: 48, paddingVertical: 10, paddingHorizontal: 8, borderRadius: ui.buttonRadius,
    alignItems: 'center', borderWidth: 1,
    borderColor: on ? accent.primary : c.border,
    backgroundColor: on ? accent.primaryLight : c.bg0,
  });
  const chipText = (on) => ({ fontSize: t.sm, fontWeight: on ? t.bold : t.medium, color: on ? accent.primary : c.text2, fontVariant: ['tabular-nums'] });

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `Time, ${formatTime12(value)}. Change` : placeholder}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, backgroundColor: c.bg0 }, style]}
      >
        <Ionicons name="time-outline" size={16} color={value ? accent.primary : c.text3} />
        <Text style={{ flex: 1, fontSize: t.sm, color: value ? c.text1 : c.text3 }}>{value ? formatTime12(value) : placeholder}</Text>
        {!!value && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Clear time">
            <Ionicons name="close-circle" size={16} color={c.text3} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: s.lg }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.lg, maxHeight: '85%' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, textAlign: 'center', marginBottom: s.md, fontVariant: ['tabular-nums'] }}>
                {draft.h12}:{draft.min} {draft.pm ? 'PM' : 'AM'}
              </Text>

              <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 6 }}>Hour</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: s.md }}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} onPress={() => setDraft(d => ({ ...d, h12: h }))} style={chip(draft.h12 === h)}>
                    <Text style={chipText(draft.h12 === h)}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 6 }}>Minute</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: s.md }}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} onPress={() => setDraft(d => ({ ...d, min: m }))} style={chip(draft.min === m)}>
                    <Text style={chipText(draft.min === m)}>:{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: s.lg }}>
                {[false, true].map(pm => (
                  <TouchableOpacity key={String(pm)} onPress={() => setDraft(d => ({ ...d, pm }))} style={[chip(draft.pm === pm), { flex: 1 }]}>
                    <Text style={chipText(draft.pm === pm)}>{pm ? 'PM' : 'AM'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button label="Set time" onPress={save} />
              <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} style={{ marginTop: 4 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
