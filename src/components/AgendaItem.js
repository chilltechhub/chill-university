// src/components/planner/AgendaItem.js
// Single agenda item row — checklist or timed block

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { completeInstance, skipInstance, addNoteToInstance } from '../../src/api/plannerService';
import { AREAS } from '../../src/api/plannerService';

export default function AgendaItem({ instance, onUpdate }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [expanded,  setExpanded]  = useState(false);
  const [note,      setNote]      = useState(instance.notes || '');
  const [updating,  setUpdating]  = useState(false);

  const area    = AREAS[instance.area] || AREAS.physical;
  const isDone  = instance.completed;
  const isSkip  = instance.skipped;

  const handleComplete = async () => {
    setUpdating(true);
    const updated = await completeInstance(instance.id, !isDone);
    if (onUpdate) onUpdate(updated);
    setUpdating(false);
  };

  const handleSkip = async () => {
    setUpdating(true);
    const updated = await skipInstance(instance.id);
    if (onUpdate) onUpdate(updated);
    setUpdating(false);
  };

  const handleSaveNote = async () => {
    if (note === instance.notes) return;
    const updated = await addNoteToInstance(instance.id, note);
    if (onUpdate) onUpdate(updated);
  };

  return (
    <View style={[
      styles.wrap,
      { backgroundColor: c.bg1, borderColor: c.border, borderLeftColor: area.color },
      isDone  && { opacity: 0.55 },
      isSkip  && { opacity: 0.35 },
    ]}>
      {/* Main row */}
      <TouchableOpacity
        style={styles.mainRow}
        onPress={() => !isSkip && handleComplete()}
        activeOpacity={0.7}
        disabled={updating}
      >
        {/* Checkbox / done indicator */}
        <View style={[
          styles.check,
          { borderColor: isDone ? area.color : c.border },
          isDone && { backgroundColor: area.color },
        ]}>
          {isDone && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>

        {/* Title + meta */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: isDone ? c.text3 : c.text1 },
            isDone && { textDecorationLine: 'line-through' }]}>
            {instance.title}
          </Text>
          <View style={styles.meta}>
            {instance.type === 'timed_block' && instance.duration_minutes && (
              <Text style={[styles.metaText, { color: area.color }]}>
                ⏱ {instance.duration_minutes}m
              </Text>
            )}
            {instance.start_time && (
              <Text style={[styles.metaText, { color: c.text4 }]}>
                {formatTime(instance.start_time)}
              </Text>
            )}
            {isSkip && <Text style={[styles.metaText, { color: c.text4 }]}>skipped</Text>}
          </View>
        </View>

        {/* Expand toggle */}
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={{ padding: 4 }}>
          <Ionicons name="ellipsis-horizontal" size={16} color={c.text4} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded actions */}
      {expanded && (
        <View style={[styles.expanded, { borderTopColor: c.border }]}>
          {/* Note input */}
          <TextInput
            style={[styles.noteInput, { color: c.text1, borderColor: c.border, backgroundColor: c.bg0 }]}
            value={note}
            onChangeText={setNote}
            onBlur={handleSaveNote}
            placeholder="Add a note..."
            placeholderTextColor={c.text4}
            multiline
          />

          {/* Actions */}
          <View style={styles.actions}>
            {!isDone && !isSkip && (
              <TouchableOpacity style={[styles.actionBtn, { borderColor: c.teal }]} onPress={handleComplete}>
                <Ionicons name="checkmark-circle-outline" size={14} color={c.teal} />
                <Text style={[styles.actionText, { color: c.teal }]}>Complete</Text>
              </TouchableOpacity>
            )}
            {isDone && (
              <TouchableOpacity style={[styles.actionBtn, { borderColor: c.text4 }]} onPress={handleComplete}>
                <Ionicons name="refresh-outline" size={14} color={c.text4} />
                <Text style={[styles.actionText, { color: c.text4 }]}>Undo</Text>
              </TouchableOpacity>
            )}
            {!isDone && !isSkip && (
              <TouchableOpacity style={[styles.actionBtn, { borderColor: c.text4 }]} onPress={handleSkip}>
                <Ionicons name="arrow-forward-outline" size={14} color={c.text4} />
                <Text style={[styles.actionText, { color: c.text4 }]}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function formatTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const styles = StyleSheet.create({
  wrap:      { borderRadius: 10, marginBottom: 6, borderWidth: 0.5, borderLeftWidth: 3, overflow: 'hidden' },
  mainRow:   { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  check:     { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:     { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  meta:      { flexDirection: 'row', gap: 8, marginTop: 2 },
  metaText:  { fontSize: 10, fontWeight: '500' },
  expanded:  { borderTopWidth: 0.5, padding: 10, gap: 8 },
  noteInput: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 12, minHeight: 40, textAlignVertical: 'top' },
  actions:   { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  actionText:{ fontSize: 11, fontWeight: '600' },
});
