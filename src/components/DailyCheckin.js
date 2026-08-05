// src/components/planner/DailyCheckin.js
// Shared daily check-in card — sleep, energy, mood, stress
// Used at top of daily agenda view

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getCheckin, upsertCheckin } from '../../src/api/plannerService';

const FIELDS = [
  { key: 'sleep_quality', label: 'Sleep',  emoji: '😴', max: 5 },
  { key: 'energy',        label: 'Energy', emoji: '⚡', max: 5 },
  { key: 'mood',          label: 'Mood',   emoji: '🌤️', max: 5 },
  { key: 'stress',        label: 'Stress', emoji: '🌊', max: 5, invert: true },
];

function ScalePicker({ value, max = 5, color, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n === value ? null : n)}
          style={{
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: n <= (value || 0) ? color : 'transparent',
            borderWidth: 1,
            borderColor: n <= (value || 0) ? color : '#4a3a6a',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 10, color: n <= (value || 0) ? '#fff' : '#7a6a9a', fontWeight: '700' }}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DailyCheckin({ userId, date, onSaved }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [checkin,  setCheckin]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notes,    setNotes]    = useState('');

  useEffect(() => {
    if (userId && date) load();
  }, [userId, date]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCheckin(userId, date);
      if (data) { setCheckin(data); setNotes(data.notes || ''); }
    } catch {}
    setLoading(false);
  };

  const updateField = async (field, value) => {
    const updated = { ...(checkin || {}), [field]: value };
    setCheckin(updated);
    setSaving(true);
    try {
      const saved = await upsertCheckin(userId, date, updated);
      setCheckin(saved);
      if (onSaved) onSaved(saved);
    } catch {}
    setSaving(false);
  };

  const saveNotes = async () => {
    await updateField('notes', notes);
  };

  const allFilled = FIELDS.every(f => checkin?.[f.key]);
  const fieldColor = (key) => {
    switch (key) {
      case 'sleep_quality': return c.purple || '#8b4fc4';
      case 'energy':        return c.gold;
      case 'mood':          return c.teal;
      case 'stress':        return c.error || '#e05858';
      default:              return c.teal;
    }
  };

  if (loading) return (
    <View style={[s_card.card, { backgroundColor: c.bg1, borderColor: c.border }]}>
      <ActivityIndicator size="small" color={c.teal} />
    </View>
  );

  return (
    <View style={[s_card.card, { backgroundColor: c.bg1, borderColor: c.border, borderLeftColor: c.teal }]}>
      <TouchableOpacity
        style={s_card.header}
        onPress={() => setExpanded(e => !e)}
      >
        <View style={s_card.headerLeft}>
          <Text style={[s_card.title, { color: c.text1 }]}>Daily Check-in</Text>
          {allFilled && <Text style={[s_card.done, { color: c.teal }]}>✓ Done</Text>}
          {saving && <ActivityIndicator size="small" color={c.teal} style={{ marginLeft: 6 }} />}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16} color={c.text3}
        />
      </TouchableOpacity>

      {/* Compact summary row when collapsed */}
      {!expanded && checkin && (
        <View style={s_card.summaryRow}>
          {FIELDS.map(f => checkin[f.key] ? (
            <View key={f.key} style={s_card.summaryItem}>
              <Text style={{ fontSize: 13 }}>{f.emoji}</Text>
              <Text style={[s_card.summaryVal, { color: fieldColor(f.key) }]}>{checkin[f.key]}</Text>
            </View>
          ) : null)}
        </View>
      )}

      {/* Expanded — full pickers */}
      {expanded && (
        <View style={s_card.body}>
          {FIELDS.map(f => (
            <View key={f.key} style={s_card.row}>
              <View style={s_card.rowLabel}>
                <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                <Text style={[s_card.label, { color: c.text2 }]}>{f.label}</Text>
              </View>
              <ScalePicker
                value={checkin?.[f.key]}
                max={f.max}
                color={fieldColor(f.key)}
                onChange={val => updateField(f.key, val)}
              />
            </View>
          ))}

          {/* Sleep hours */}
          <View style={s_card.row}>
            <View style={s_card.rowLabel}>
              <Text style={{ fontSize: 16 }}>🕐</Text>
              <Text style={[s_card.label, { color: c.text2 }]}>Hours slept</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[5, 6, 7, 8, 9].map(h => (
                <TouchableOpacity key={h} onPress={() => updateField('sleep_hours', checkin?.sleep_hours === h ? null : h)}
                  style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: checkin?.sleep_hours === h ? c.purple || '#8b4fc4' : 'transparent', borderWidth: 1, borderColor: checkin?.sleep_hours === h ? c.purple || '#8b4fc4' : '#4a3a6a' }}>
                  <Text style={{ fontSize: 11, color: checkin?.sleep_hours === h ? '#fff' : '#7a6a9a', fontWeight: '700' }}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <TextInput
            style={[s_card.notes, { color: c.text1, borderColor: c.border, backgroundColor: c.bg0 }]}
            value={notes}
            onChangeText={setNotes}
            onBlur={saveNotes}
            placeholder="Any notes for today..."
            placeholderTextColor={c.text4}
            multiline
          />
        </View>
      )}
    </View>
  );
}

const s_card = StyleSheet.create({
  card:        { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderLeftWidth: 3 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:       { fontSize: 13, fontWeight: '700' },
  done:        { fontSize: 11, fontWeight: '600' },
  summaryRow:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  summaryVal:  { fontSize: 12, fontWeight: '700' },
  body:        { marginTop: 12, gap: 12 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:       { fontSize: 13 },
  notes:       { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 50, textAlignVertical: 'top', marginTop: 4 },
});
