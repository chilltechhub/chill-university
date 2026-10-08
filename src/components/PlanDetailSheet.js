// src/components/PlanDetailSheet.js
// One planner item, tapped open: what it is, when, its notes and link, and
// everything you can do with it (done / skip / edit / move / delete). The
// Planner, the Library's "Today" list and Home's Today's Activities all open
// this same sheet, so an item behaves the same wherever you meet it.
//
//   <PlanDetailSheet instance={row | null} onClose onChanged onEdit navigation />
//
// `instance` is a full agenda_instances row. `onChanged` runs after any
// change so the caller can reload; `onEdit(row)` opens the caller's editor
// (outside the Planner, navigate there with { editInstance: row }). Without
// `onEdit` there is no Edit button, and without `navigation` no link button
// (the calendar popup can be opened from outside the navigator).

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/profileScopedClient';
import {
  AREAS, completeInstance, skipInstance, unskipInstance, rescheduleInstance,
  deleteInstances, getSeriesFrom, markSeriesStopped,
} from '../api/plannerService';
import { openTarget, targetFromInstance } from '../logic/openTarget';
import { timeRange } from '../logic/plannerLayout';
import { dateStr } from '../logic/dateUtils';
import { textOn } from '../logic/contrast';

function toISO(d) { return dateStr(d); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isOverdue(instance) {
  if (instance.completed || instance.skipped) return false;
  return instance.date < toISO(new Date());
}

export async function openPlanLink(navigation, instance) {
  // Projects link by id, so this needs a fresh fetch (the project's own
  // title/status can have changed since the item was linked); class and game
  // links carry their destination directly, no lookup needed.
  if (!instance.link_type || !navigation) return;
  // Through openTarget, not a bare navigate('ProjectDetail'): this sheet also
  // opens from Home's calendar, where Library screens can't be reached by name.
  try {
    if (instance.link_type === 'game' && instance.link_screen) {
      navigation.navigate('Play', { gameId: instance.link_screen });
    } else if (['class', 'project', 'quest', 'idea', 'vault'].includes(instance.link_type)) {
      const ok = await openTarget(navigation, targetFromInstance(instance));
      if (!ok) Alert.alert('Not found', instance.link_type === 'project' ? "That project isn't there anymore." : "That isn't there anymore.");
    }
  } catch (e) {
    console.warn('openLink', e);
    Alert.alert("Couldn't open that", 'Something went wrong — try again.');
  }
}

const LINK_LABELS = {
  class: 'Open class', project: 'Open project', game: 'Open game',
  quest: 'Open quest', idea: 'Open idea', vault: 'Open in Vault',
};

function nextDay(iso) { return toISO(addDays(new Date(iso + 'T00:00:00'), 1)); }

export default function PlanDetailSheet({ instance, onClose, onChanged, onEdit, navigation }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [series, setSeries] = useState(null); // this + later copies of a repeat
  const [shown, setShown] = useState(instance); // kept while the sheet slides out

  useEffect(() => {
    if (instance) setShown(instance);
    setConfirmDelete(false); setSeries(null); setBusy(false);
  }, [instance]);

  // Work sessions are written with "Next step: …" copied from the project
  // when they were scheduled (workSessions.buildSessionRows), so weeks later
  // they named a step finished long ago. Show the project's step as it is now.
  const [liveNext, setLiveNext] = useState(undefined); // undefined = not looked up
  useEffect(() => {
    setLiveNext(undefined);
    if (instance?.link_type !== 'project' || !instance.link_id || !instance.notes?.startsWith('Next step: ')) return undefined;
    let live = true;
    supabase.from('projects').select('next_action').eq('id', instance.link_id).maybeSingle()
      .then(({ data }) => { if (live && data) setLiveNext(data.next_action || null); });
    return () => { live = false; };
  }, [instance]);

  const inst = shown;
  if (!inst) return null;
  const area    = AREAS[inst.area] || AREAS.physical;
  const done    = !!inst.completed;
  const skipped = !!inst.skipped;
  const overdue = isOverdue(inst);
  const repeats = inst.cadence && inst.cadence !== 'once';
  const stored  = inst.notes && !inst.notes.startsWith('notif:') ? inst.notes : null;
  const notes   = liveNext === undefined || !stored?.startsWith('Next step: ') ? stored
    : liveNext ? `Next step: ${liveNext}` : null;
  const todayIso = toISO(new Date());
  const danger  = c.error || '#e05858';
  const status = done ? { label: 'Done', color: c.success || '#3ac860' }
    : skipped ? { label: 'Skipped', color: c.text3 }
    : overdue ? { label: 'Missed', color: '#e05858' }
    : null;

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); onChanged(); onClose(); }
    catch (e) {
      console.warn('PlanDetailSheet', e);
      Alert.alert("Couldn't update that", 'Something went wrong — try again.');
      setBusy(false);
    }
  };

  const askDelete = async () => {
    setConfirmDelete(true);
    if (!repeats) return;
    // Capped: one of these requests once never came back in testing, which
    // left the sheet spinning. Without the list it still offers "Delete".
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000));
    try { setSeries(await Promise.race([getSeriesFrom(inst), timeout])); } catch { setSeries([]); }
  };
  const moveTo = overdue ? todayIso : nextDay(inst.date);
  const laterCount = series ? series.filter(x => x.id !== inst.id).length : 0;

  // Render helpers, called as functions rather than used as <Components>: a
  // component declared in here is a new type on every render, so React
  // remounted every button each time and a tap mid-render could be lost.
  const row = (icon, text) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 6 }}>
      <Ionicons name={icon} size={16} color={c.text3} />
      <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{text}</Text>
    </View>
  );
  const btn = ({ label, icon, color, filled, onPress, disabled }) => (
    <TouchableOpacity key={icon} onPress={onPress} disabled={busy || disabled} accessibilityRole="button"
      style={{ flexGrow: 1, flexBasis: '30%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
               paddingVertical: 11, borderRadius: r.md, borderWidth: filled ? 0 : 1, borderColor: color + '88',
               backgroundColor: filled ? color : 'transparent', opacity: busy || disabled ? 0.5 : 1 }}>
      <Ionicons name={icon} size={16} color={filled ? textOn(color) : color} />
      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: filled ? textOn(color) : color }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={!!instance} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} accessibilityLabel="Close details" />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '85%', borderTopWidth: 4, borderTopColor: area.color }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10, marginBottom: s.md }} />
          <ScrollView contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.md }}>
            {/* Area + status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: area.color + '22', borderRadius: r.full, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12 }}>{area.emoji}</Text>
                <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text1 }}>{area.label}</Text>
              </View>
              {status && (
                <View style={{ borderRadius: r.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: status.color }}>
                  <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: status.color }}>{status.label}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={c.text3} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textDecorationLine: done ? 'line-through' : 'none' }}>
              {inst.title}
            </Text>

            {row('calendar-outline', new Date(inst.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))}
            {row('time-outline', inst.start_time
              ? `${timeRange(inst.start_time, inst.duration_minutes)}${inst.duration_minutes ? `  ·  ${inst.duration_minutes} min` : ''}`
              : `Any time${inst.duration_minutes ? `  ·  ${inst.duration_minutes} min` : ''}`)}
            {repeats && row('repeat-outline', `Repeats ${inst.cadence}`)}

            {notes && (
              <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginTop: s.sm }}>
                <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Notes</Text>
                <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{notes}</Text>
              </View>
            )}

            {!!LINK_LABELS[inst.link_type] && !!navigation && (
              <TouchableOpacity onPress={() => { onClose(); openPlanLink(navigation, inst); }} accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.md, padding: s.md, borderRadius: r.md, backgroundColor: area.color + '15' }}>
                <Ionicons name="open-outline" size={16} color={c.text1} />
                <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{LINK_LABELS[inst.link_type]}</Text>
                <Ionicons name="chevron-forward" size={14} color={c.text3} />
              </TouchableOpacity>
            )}

            {/* Actions */}
            {!confirmDelete ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.lg }}>
                {!skipped && (done
                  ? btn({ label: 'Not done', icon: 'arrow-undo-outline', color: c.text2, onPress: () => run(() => completeInstance(inst.id, false)) })
                  : btn({ label: 'Done', icon: 'checkmark-circle', color: area.color, filled: true, onPress: () => run(() => completeInstance(inst.id, true)) }))}
                {!done && (skipped
                  ? btn({ label: 'Unskip', icon: 'play-back-outline', color: c.text2, onPress: () => run(() => unskipInstance(inst.id)) })
                  : btn({ label: 'Skip', icon: 'play-skip-forward-outline', color: c.text2, onPress: () => run(() => skipInstance(inst.id)) }))}
                {!!onEdit && btn({ label: 'Edit', icon: 'pencil-outline', color: c.teal, onPress: () => { onClose(); onEdit(inst); } })}
                {!done && btn({ label: overdue ? 'Move to today' : 'Tomorrow', icon: 'arrow-forward-circle-outline', color: c.text2,
                  onPress: () => run(() => rescheduleInstance(inst.id, moveTo)) })}
                {btn({ label: 'Delete', icon: 'trash-outline', color: danger, onPress: askDelete })}
              </View>
            ) : (
              <View style={{ marginTop: s.lg, padding: s.md, borderRadius: r.md, borderWidth: 1, borderColor: danger + '88', gap: s.sm }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Delete “{inst.title}”?</Text>
                {repeats && series === null && <ActivityIndicator color={c.text3} />}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                  {btn({ label: laterCount > 0 ? 'Just this one' : 'Delete', icon: 'trash-outline', color: danger, filled: true,
                    onPress: () => run(() => deleteInstances([inst.id])) })}
                  {laterCount > 0 && btn({ label: `This + ${laterCount} later`, icon: 'trash-bin-outline', color: danger,
                    // Ending it: the Planner's top-up (extendRepeatingPlans)
                    // must not bring the rest back tomorrow.
                    onPress: () => run(async () => { await deleteInstances(series.map(x => x.id)); await markSeriesStopped(inst.user_id, inst); }) })}
                  {btn({ label: 'Cancel', icon: 'close-outline', color: c.text2, onPress: () => setConfirmDelete(false) })}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
