// src/components/ReminderComposer.js
// "New reminder" — one sheet for the Notification Center, projects, quests,
// ideas and anything shared into the app. Saves through
// src/api/reminderService.js: a planner item at that time, linked to what
// it's about, plus a phone notification when asked for.
//
// initial: { title, target, targetLabel, notes, area }

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Switch,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createReminder } from '../api/reminderService';
import { parseTime, INVALID } from '../logic/aiBridgeParse';
import { isoDate, addDaysIso, REPEAT_COUNTS } from '../logic/aiBridgeFormat';
import { TARGET_LABEL } from '../logic/openTarget';
import { AREA_COLORS } from '../data/areaColors';
import { PHONE_CAPABLE } from '../logic/noticeStore';
import TimePickerField from './TimePickerField';

const AREAS = [
  ['physical', '💪', 'Physical'], ['mental', '🧠', 'Mental'], ['social', '🤝', 'Social'], ['financial', '💰', 'Financial'],
  ['professional', '🚀', 'Work & school'], ['spiritual', '✨', 'Spiritual'], ['creative', '🎨', 'Creative'], ['digital', '💻', 'Digital'],
];
const LEADS = [[0, 'At the time'], [5, '5 min before'], [15, '15 min before'], [30, '30 min before']];
const REPEATS = [[null, 'Once'], ['daily', `Daily ×${REPEAT_COUNTS.daily}`], ['weekly', `Weekly ×${REPEAT_COUNTS.weekly}`], ['monthly', `Monthly ×${REPEAT_COUNTS.monthly}`]];
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

function quickPicks(now) {
  const today = isoDate(now);
  const inHour = new Date(now.getTime() + 60 * 60000);
  inHour.setMinutes(Math.ceil(inHour.getMinutes() / 5) * 5, 0, 0);
  const sat = (6 - now.getDay() + 7) % 7 || 7;
  return [
    { key: 'hour', label: 'In 1 hour', date: isoDate(inHour), time: hhmm(inHour) },
    ...(now.getHours() < 20 ? [{ key: 'tonight', label: 'Tonight 8 PM', date: today, time: '20:00' }] : []),
    { key: 'tomorrow', label: 'Tomorrow 9 AM', date: addDaysIso(today, 1), time: '09:00' },
    { key: 'weekend', label: 'Saturday 10 AM', date: addDaysIso(today, sat), time: '10:00' },
  ];
}

export default function ReminderComposer({ visible, onClose, userId, initial = {}, onSaved }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const now = useMemo(() => new Date(), [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = isoDate(now);
  const picks = useMemo(() => quickPicks(now), [now]);

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(null);
  const [targetLabel, setTargetLabel] = useState('');
  const [date, setDate] = useState(today);
  const [timeText, setTimeText] = useState('');
  const [repeat, setRepeat] = useState(null);
  const [area, setArea] = useState('physical');
  const [notify, setNotify] = useState(PHONE_CAPABLE);
  const [lead, setLead] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!visible) return;
    const first = picks.find(p => p.key === 'tomorrow');
    setTitle(initial.title || '');
    setTarget(initial.target || null);
    setTargetLabel(initial.targetLabel || '');
    setDate(first.date);
    setTimeText(first.time || "");
    setRepeat(null);
    setArea(initial.area || (initial.target?.kind === 'project' ? 'professional' : 'physical'));
    setNotify(PHONE_CAPABLE);
    setLead(0);
    setError(null);
    setDone(null);
    setSaving(false);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = timeText.trim() ? parseTime(timeText) : null;
  const time = parsed && parsed !== INVALID ? parsed : null;
  const timeBad = !!timeText.trim() && !time;
  const past = time && date === today && time <= hhmm(now);
  const days = Array.from({ length: 8 }, (_, i) => addDaysIso(today, i));
  const dayLabel = (d, i) => (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${DAY[new Date(`${d}T12:00:00`).getDay()]} ${Number(d.slice(8))}`);

  const save = async () => {
    if (!title.trim()) { setError('Give it a title.'); return; }
    if (timeBad) { setError('That time didn’t make sense. Try something like 5pm or 17:30.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await createReminder(userId, {
        title, date, time, repeat, area, target, notes: initial.notes, notify: notify && !!time, lead,
      });
      const bits = [`Saved to your Planner${res.rows.length > 1 ? ` (${res.rows.length} times)` : ''}.`];
      if (notify && time && PHONE_CAPABLE) bits.push(res.notified ? 'Your phone will remind you.' : 'Phone notifications are off, so check the Planner.');
      if (res.linkDropped) bits.push('The link will work once the latest database update is run.');
      setDone(bits.join(' '));
      onSaved?.(res);
    } catch (e) {
      setError(e?.message || 'Couldn’t save that. Try again.');
    }
    setSaving(false);
  };

  const chip = (key, label, on, onPress, color = c.teal) => (
    <TouchableOpacity key={key} onPress={onPress}
      style={{ paddingHorizontal: s.md, paddingVertical: 7, borderRadius: r.full, borderWidth: 1, borderColor: on ? color : c.border, backgroundColor: on ? `${color}22` : c.bg0 }}>
      <Text style={{ fontSize: 12, fontWeight: on ? '700' : '500', color: on ? color : c.text2 }}>{label}</Text>
    </TouchableOpacity>
  );
  const label = (txt) => <Text style={{ fontSize: 11, fontWeight: '800', color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginTop: s.lg, marginBottom: s.sm }}>{txt}</Text>;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={onClose} />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.lg, paddingBottom: s.sm }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>⏰ New reminder</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close"><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>

          {done ? (
            <View style={{ padding: s.lg, paddingBottom: s.xxl }}>
              <View style={{ flexDirection: 'row', gap: s.sm, alignItems: 'flex-start' }}>
                <Ionicons name="checkmark-circle" size={22} color={c.success} />
                <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{done}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ marginTop: s.lg, backgroundColor: c.teal, borderRadius: r.lg, paddingVertical: s.md, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: t.bold }}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.xxl }} keyboardShouldPersistTaps="handled">
              <TextInput
                value={title} onChangeText={setTitle} placeholder="Remind me to…" placeholderTextColor={c.text4} autoFocus={!initial.title}
                style={{ fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
              />
              {!!target && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s.sm, alignSelf: 'flex-start', backgroundColor: c.bg2, borderRadius: r.full, paddingLeft: s.md, paddingRight: 6, paddingVertical: 4 }}>
                  <Ionicons name="link-outline" size={13} color={c.teal} />
                  <Text style={{ fontSize: 12, color: c.text2 }} numberOfLines={1}>{TARGET_LABEL[target.kind] || 'Link'}{targetLabel ? `: ${targetLabel}` : ''}</Text>
                  <TouchableOpacity onPress={() => setTarget(null)} accessibilityLabel="Remove link"><Ionicons name="close-circle" size={16} color={c.text4} /></TouchableOpacity>
                </View>
              )}

              {label('When')}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                {picks.map(p => chip(p.key, p.label, date === p.date && time === p.time, () => { setDate(p.date); setTimeText(p.time || ""); }))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: s.md }} contentContainerStyle={{ gap: s.sm }}>
                {days.map((d, i) => chip(d, dayLabel(d, i), date === d, () => setDate(d)))}
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.md }}>
                <TimePickerField value={timeText} onChange={setTimeText} placeholder="Any time (tap to pick)" style={{ flex: 1, padding: s.sm }} />
              </View>
              {past && <Text style={{ fontSize: 11, color: c.gold, marginTop: 4 }}>That time has already passed today.</Text>}

              {label('Repeat')}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                {REPEATS.map(([k, l]) => chip(String(k), l, repeat === k, () => setRepeat(k)))}
              </View>

              {label('Life area')}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                {AREAS.map(([k, e, l]) => chip(k, `${e} ${l}`, area === k, () => setArea(k), AREA_COLORS[k]))}
              </View>

              {PHONE_CAPABLE ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s.lg }}>
                    <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Notify me on this phone</Text>
                    <Switch value={notify} onValueChange={setNotify} trackColor={{ true: c.teal }} />
                  </View>
                  {notify && !time && <Text style={{ fontSize: 11, color: c.text3, marginTop: 4 }}>Add a time to get a notification.</Text>}
                  {notify && !!time && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm }}>
                      {LEADS.map(([k, l]) => chip(String(k), l, lead === k, () => setLead(k)))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={{ fontSize: 11, color: c.text3, marginTop: s.lg }}>
                  Phone notifications only go off in the app on your phone. This still goes in your Planner.
                </Text>
              )}

              {!!error && <Text style={{ fontSize: 12, color: c.error, marginTop: s.md }}>{error}</Text>}
              <TouchableOpacity onPress={save} disabled={saving}
                style={{ marginTop: s.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: s.sm, backgroundColor: c.teal, borderRadius: r.lg, paddingVertical: s.md, opacity: saving ? 0.6 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="alarm-outline" size={16} color="#fff" />}
                <Text style={{ color: '#fff', fontWeight: t.bold }}>Save reminder</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
