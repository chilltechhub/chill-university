// src/screens/today/DueList.js
// Deadlines on the day. Moved out of PlannerScreen.js for the shake-up
// (docs/shake-up-plan-2026-10-21.md P1).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { BusyDot } from '../../ui';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { setDueItemDone } from '../../api/deadlinesService';
import { openTarget } from '../../logic/openTarget';

// ─── Due ──────────────────────────────────────────────────────────────────────
// Deadlines that live outside the Planner's own rows: project tasks, plain
// tasks and whole projects' finish dates (deadlinesService.js). Before this,
// a project task due Wednesday was nowhere on Wednesday.
const DUE_KIND = { project_task: 'Project task', task: 'Task', project: 'Project finish date' };

export default function DueList({ items, onChange, label = 'Due', c, t, s, r }) {
  const navigation = useNavigation();
  const [busy, setBusy] = useState(null);
  if (!items.length) return null;
  const toggle = async (item) => {
    if (item.kind === 'project' || busy) return;
    setBusy(item.key);
    try { await setDueItemDone(item, !item.completed); onChange?.(); }
    catch (e) { Alert.alert('Could not update that', e.message || 'Try again.'); }
    setBusy(null);
  };
  return (
    <View style={{ paddingHorizontal: s.lg, paddingTop: s.sm, paddingBottom: s.xs }}>
      <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
        {label} · {items.filter(i => i.completed).length}/{items.length}
      </Text>
      {items.map(item => (
        <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.gold, paddingHorizontal: s.md, paddingVertical: s.sm, marginBottom: s.xs }}>
          {item.kind === 'project' ? (
            <Ionicons name="flag-outline" size={18} color={c.gold} />
          ) : (
            <TouchableOpacity onPress={() => toggle(item)} accessibilityRole="checkbox" accessibilityState={{ checked: item.completed }}
              accessibilityLabel={`${item.title}, ${item.completed ? 'done' : 'not done'}`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {busy === item.key ? <BusyDot color={c.gold} size={8} />
                : <Ionicons name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.completed ? c.gold : c.text3} />}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ flex: 1 }} disabled={!item.projectId} accessibilityRole="button"
            accessibilityLabel={item.projectId ? `${item.title}. Open the project` : item.title}
            onPress={() => openTarget(navigation, { kind: 'project', id: item.projectId })}>
            <Text numberOfLines={2} style={{ fontSize: t.sm, fontWeight: t.medium, color: item.completed ? c.text3 : c.text1, textDecorationLine: item.completed ? 'line-through' : 'none' }}>
              {item.kind === 'project' ? `Finish: ${item.title}` : item.title}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>
              {DUE_KIND[item.kind]}{item.projectTitle && item.kind !== 'project' ? ` · ${item.projectTitle}` : ''}
            </Text>
          </TouchableOpacity>
          {!!item.projectId && <Ionicons name="chevron-forward" size={14} color={c.text4} />}
        </View>
      ))}
    </View>
  );
}
