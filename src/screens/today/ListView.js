// src/screens/today/ListView.js
// The day as a list. Moved out of PlannerScreen.js for the shake-up
// (docs/shake-up-plan-2026-10-21.md P1).

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB_CLEARANCE } from '../../../context/FabPositionContext';
import { byTime } from '../../logic/plannerLayout';
import SleepyCat from '../../components/SleepyCat';
import { isOverdue } from './plannerShared';
import AgendaRow from './AgendaRow';

// ─── List daily view ──────────────────────────────────────────────────────────
export default function ListView({ instances, onUpdate, onOpen, onAdd, c, t, s, r }) {
  const sorted   = [...instances].sort(byTime);
  const overdue  = sorted.filter(i => isOverdue(i));
  const today    = sorted.filter(i => !isOverdue(i) && !i.skipped);
  const skipped  = sorted.filter(i => i.skipped);

  const Section = ({ label, items, color }) => items.length === 0 ? null : (
    <View style={{ marginBottom: s.lg }}>
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: color || c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
        {label} · {items.filter(i => i.completed).length}/{items.length}
      </Text>
      {items.map(inst => (
        <AgendaRow key={inst.id} instance={inst} onUpdate={onUpdate} onOpen={onOpen} c={c} t={t} s={s} r={r} />
      ))}
    </View>
  );

  if (instances.length === 0) return (
    <View style={{ alignItems: 'center', paddingTop: 60 }}>
      <SleepyCat variant={2} size={88} style={{ marginBottom: s.xs }} />
      <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Nothing scheduled</Text>
      {/* "Tap + to add something" — with two + buttons on screen, which? And
          no reason to. A why, and the button itself. */}
      <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', paddingHorizontal: s.xl, lineHeight: 20 }}>
        A day with one thing on it is easier to start than an empty one.
      </Text>
      {!!onAdd && (
        <TouchableOpacity
          onPress={() => onAdd()}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s.lg, backgroundColor: c.teal, borderRadius: r.lg, paddingHorizontal: s.lg, paddingVertical: 10 }}
        >
          <Ionicons name="add" size={18} color={c.onFill} />
          <Text style={{ fontSize: t.sm, color: c.onFill, fontWeight: t.bold }}>Plan something for today</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: FAB_CLEARANCE }}>
      <Section label="Earlier" items={overdue} />
      <Section label="Today" items={today} />
      <Section label="Skipped" items={skipped} />
    </ScrollView>
  );
}
