// src/components/PlannerQuickAdd.js
// Type a plan, press enter: "dentist thu 4pm" lands on Thursday at 4.
// The Add sheet asks for a title, a day, a time and a repeat one field at a
// time; this reads them from one line (src/logic/quickAdd.js) and shows what
// it read before you commit. No day in the text → the day on screen.

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/profileScopedClient';
import { parseQuickAdd, describeQuickAdd } from '../logic/quickAdd';
import { repeatDates } from '../logic/aiBridgeFormat';
import { isSamePlan } from '../logic/plannerLayout';
import { dateStr } from '../logic/dateUtils';
import { successHaptic } from '../logic/haptics';

export default function PlannerQuickAdd({ userId, date, area = 'physical', onAdded, c, t, s, r }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null); // { kind: 'ok' | 'error', text }

  const pageIso = dateStr(date);
  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    const p = parseQuickAdd(text);
    return p.hasDate ? p : { ...p, date: pageIso };
  }, [text, pageIso]);

  const add = async () => {
    if (!parsed?.title || busy || !userId) return;
    setBusy(true);
    setNote(null);
    try {
      const base = {
        user_id: userId, title: parsed.title, area, cadence: parsed.cadence, type: 'checklist',
        date: parsed.date, start_time: parsed.time, completed: false, skipped: false,
      };
      const dates = parsed.cadence === 'once' ? [base.date] : repeatDates(base.date, parsed.cadence);
      // Same duplicate rule as the Add sheet.
      const { data: existing } = await supabase.from('agenda_instances')
        .select('title, date, start_time').eq('user_id', userId).in('date', dates);
      const free = dates.filter(d => !(existing || []).some(x => isSamePlan(x, { ...base, date: d })));
      if (!free.length) {
        setNote({ kind: 'error', text: `“${base.title}” is already on that day.` });
        setBusy(false);
        return;
      }
      const { data, error } = await supabase.from('agenda_instances')
        .insert(free.map(d => ({ ...base, date: d }))).select();
      if (error) throw error;
      successHaptic();
      setNote({ kind: 'ok', text: `Added: ${describeQuickAdd(parsed)}` });
      setText('');
      onAdded?.(data?.[0] || null);
    } catch (e) {
      console.warn('[quick add]', e?.message || e);
      setNote({ kind: 'error', text: 'Could not add that. Try again.' });
    }
    setBusy(false);
  };

  return (
    <View style={{ marginHorizontal: s.lg, marginBottom: s.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.lg,
        borderWidth: 1, borderColor: text ? c.teal : c.border, paddingLeft: s.md, paddingRight: 6, paddingVertical: 4 }}>
        <Ionicons name="add-circle-outline" size={18} color={text ? c.teal : c.text3} />
        <TextInput
          value={text}
          onChangeText={(v) => { setText(v); if (note) setNote(null); }}
          onSubmitEditing={add}
          placeholder="Type a plan: dentist thu 4pm"
          placeholderTextColor={c.text3}
          returnKeyType="done"
          accessibilityLabel="Quick add a plan. Type what and when, for example dentist Thursday 4pm."
          style={{ flex: 1, fontSize: t.sm, color: c.text1, paddingVertical: 8 }}
        />
        {!!parsed?.title && (
          <TouchableOpacity onPress={add} disabled={busy} accessibilityRole="button" accessibilityLabel={`Add ${parsed.title}`}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.full, backgroundColor: c.teal }}>
            {busy ? <ActivityIndicator size="small" color={c.onFill} />
              : <Text style={{ fontSize: 12, fontWeight: '700', color: c.onFill }}>Add</Text>}
          </TouchableOpacity>
        )}
      </View>
      {/* What it read, before you commit. */}
      {!!parsed?.title && !note && (
        <Text style={{ fontSize: 12, color: c.text3, marginTop: 4, marginLeft: s.md }}>
          <Text style={{ fontWeight: '700', color: c.text2 }}>{parsed.title}</Text> · {describeQuickAdd(parsed)}
        </Text>
      )}
      {!!note && (
        <Text style={{ fontSize: 12, fontWeight: '600', color: note.kind === 'ok' ? c.success : c.error, marginTop: 4, marginLeft: s.md }}>
          {note.text}
        </Text>
      )}
    </View>
  );
}
