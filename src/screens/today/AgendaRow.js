// src/screens/today/AgendaRow.js
// One planned item on the day: tick it, open it. Moved out of
// PlannerScreen.js for the shake-up (docs/shake-up-plan-2026-10-21.md P1).

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AREAS, completeInstance, skipInstance, rescheduleInstance } from '../../api/plannerService';
import { timeRange } from '../../logic/plannerLayout';
import { useProfiles } from '../../../context/ProfileAccountsContext';
import { buildProfileLookup } from '../../data/personas';
import { successHaptic } from '../../logic/haptics';
import { isOverdue } from './plannerShared';

// ─── Agenda item row ──────────────────────────────────────────────────────────
// Tapping the row opens the item's detail sheet (PlanDetailSheet below); the
// circle ticks it off in place. It used to expand in place instead, which
// hid the notes and actions behind a chevron nobody associated with them.
export default function AgendaRow({ instance, onUpdate, onOpen, c, t, s, r }) {
  // Reads the profile list directly rather than having it drilled through
  // ListView/TimeView — the badge is only needed here, and threading a prop
  // through two intermediate components for one label isn't worth it.
  const { profiles, active } = useProfiles();
  const rowProfile = instance.profile_id && instance.profile_id !== active?.id
    ? buildProfileLookup(profiles)[instance.profile_id]
    : null;
  const [saving,   setSaving]   = useState(false);
  // A ref, not just the state: two quick taps both land before `saving`
  // re-renders. And the circle is never `disabled` while saving, because a
  // tap on a disabled touchable falls through to the row and opened the
  // detail sheet on the item as it was before the first tap.
  const busy     = useRef(false);
  const area     = AREAS[instance.area] || AREAS.physical;
  const overdue  = isOverdue(instance);
  const done     = instance.completed;
  const skipped  = instance.skipped;

  const handle = async (fn) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try { const updated = await fn(instance.id); if (onUpdate) onUpdate(updated); }
    catch (e) {
      console.warn('AgendaRow', e);
      Alert.alert("Couldn't update that", 'Something went wrong — try again.');
    }
    busy.current = false;
    setSaving(false);
  };

  return (
    <View style={{
      borderRadius: r.md, marginBottom: s.sm,
      backgroundColor: c.bg1, borderWidth: 0.5,
      // A past item that isn't done keeps its area colour: grey label, no
      // red alarm (North Star: no guilt for gaps).
      borderColor: done ? c.border : area.color + '55',
      borderLeftWidth: 3, borderLeftColor: area.color,
      opacity: skipped ? 0.5 : 1,
    }}>
      {/* Main row */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm }}
        onPress={() => onOpen(instance)} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel={`${instance.title}. Show details`}>
        {/* Check circle */}
        <TouchableOpacity
          onPress={() => { if (busy.current) return; if (!done) successHaptic(); handle(() => completeInstance(instance.id, !done)); }}
          disabled={skipped}
          accessibilityRole="checkbox" accessibilityState={{ checked: !!done }}
          accessibilityLabel={done ? `Mark ${instance.title} not done` : `Mark ${instance.title} done`}
          hitSlop={8}
          style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: done ? area.color : c.border, backgroundColor: done ? area.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {saving ? <ActivityIndicator size="small" color={area.color} />
            : done ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.medium, color: done ? c.text3 : c.text1, textDecorationLine: done || skipped ? 'line-through' : 'none', flex: 1 }} numberOfLines={2}>
              {instance.title}
            </Text>
            {overdue && !done && (
              <View style={{ backgroundColor: c.bg2, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 11, color: c.text3, fontWeight: t.bold }}>Still open</Text>
              </View>
            )}
            {/* Only shown when the item belongs to a profile other than the
                active one — labelling your own items with your own profile
                name on every row would be noise. */}
            {rowProfile && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: rowProfile.color + '22', borderWidth: 0.5, borderColor: rowProfile.color + '88' }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: rowProfile.color }} />
                <Text style={{ fontSize: 11, color: rowProfile.color, fontWeight: t.bold }} numberOfLines={1}>{rowProfile.name}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11 }}>{area.emoji}</Text>
            {instance.start_time ? (
              <Text style={{ fontSize: t.xs, color: c.text2, fontWeight: t.semibold }}>{timeRange(instance.start_time, instance.duration_minutes)}</Text>
            ) : instance.duration_minutes ? (
              <Text style={{ fontSize: t.xs, color: c.text3 }}>{instance.duration_minutes} min</Text>
            ) : null}
            {instance.cadence && instance.cadence !== 'once' && (
              <Text style={{ fontSize: t.xs, color: c.text3 }}>· {instance.cadence} habit</Text>
            )}
            {!!instance.notes && !instance.notes.startsWith('notif:') && (
              <Ionicons name="document-text-outline" size={12} color={c.text3} accessibilityLabel="Has notes" />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={c.text4} />
      </TouchableOpacity>

      {/* Not-done-item quick actions — one tap, no need to open it first.
          Do Now = completeInstance, Move = rescheduleInstance (defaults to
          today), Drop = skipInstance; see plannerService.js. */}
      {overdue && !done && !skipped && (
        <View style={{ flexDirection: 'row', gap: s.sm, paddingHorizontal: s.md, paddingBottom: s.md, flexWrap: 'wrap' }}>
          <ActionBtn label="Do Now" icon="checkmark-circle-outline" color={area.color}
            onPress={() => { successHaptic(); handle(() => completeInstance(instance.id, true)); }} />
          <ActionBtn label="Move to today" icon="calendar-outline" color={c.text3}
            onPress={() => handle(() => rescheduleInstance(instance.id))} />
          <ActionBtn label="Drop" icon="close-circle-outline" color="#e05858"
            onPress={() => handle(() => skipInstance(instance.id))} />
        </View>
      )}
    </View>
  );
}

function ActionBtn({ label, icon, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: color + '88', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={{ fontSize: 12, color, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
