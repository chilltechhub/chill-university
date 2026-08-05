// src/components/CalendarModal.js
// Notebook-style center popup calendar — weekly view, lined paper aesthetic

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Notification helper ──────────────────────────────────────────────────────
let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}

async function scheduleReminder(title, date, time, minutesBefore = 30) {
  if (!Notifications) return null;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const [h, m] = (time || '09:00').split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(h, m, 0, 0);
    const triggerDate = new Date(eventDate.getTime() - minutesBefore * 60000);
    if (triggerDate <= new Date()) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: '🗓️ Reminder', body: title, sound: true },
      trigger: triggerDate,
    });
  } catch { return null; }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const EVENT_TYPES = [
  { key: 'event',    label: 'Event',    icon: 'calendar-outline',         color: '#2bb5a0' },
  { key: 'reminder', label: 'Reminder', icon: 'notifications-outline',    color: '#c9a84c' },
  { key: 'task',     label: 'Task',     icon: 'checkmark-circle-outline', color: '#3ac860' },
  { key: 'note',     label: 'Note',     icon: 'document-text-outline',    color: '#8b4fc4' },
  { key: 'focus',    label: 'Focus',    icon: 'bookmark-outline',         color: '#e05858' },
];

const REMINDER_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1 day',  value: 1440 },
];

const TYPE_COLORS = Object.fromEntries(EVENT_TYPES.map(t => [t.key, t.color]));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDays(anchor) {
  const base = new Date(anchor);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}
function toISO(date) { return date.toISOString().split('T')[0]; }
function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ─── Add Event Form ───────────────────────────────────────────────────────────
function AddEventForm({ date, userId, onSave, onCancel, c, t, s, r }) {
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [type,     setType]     = useState('event');
  const [time,     setTime]     = useState('');
  const [allDay,   setAllDay]   = useState(false);
  const [reminder, setReminder] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const typeConfig = EVENT_TYPES.find(tp => tp.key === type);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const item = {
        user_id: userId, title: title.trim(),
        description: desc.trim() || null,
        date: toISO(date), time: allDay ? null : (time || null),
        type, color: TYPE_COLORS[type] || '#2bb5a0',
        all_day: allDay, reminder_min: reminder,
      };
      const { data, error } = await supabase.from('calendar_events').insert(item).select().single();
      if (error) throw error;
      if (reminder && time && !allDay) await scheduleReminder(title.trim(), toISO(date), time, reminder);
      if (type === 'task') {
        await supabase.from('tasks').insert({ user_id: userId, title: title.trim(), due_date: toISO(date), category: 'personal', priority: 2 });
      }
      if (type === 'focus') {
        await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: title.trim(), date: toISO(date) });
      }
      onSave(data);
    } catch (e) {
      Alert.alert('Error', 'Could not save. Try again.');
    }
    setSaving(false);
  };

  return (
    <View style={{ padding: s.lg }}>
      {/* Notebook top line */}
      <View style={{ borderBottomWidth: 2, borderBottomColor: typeConfig.color, marginBottom: s.md, paddingBottom: s.sm }}>
        <Text style={{ fontSize: t.xs, color: typeConfig.color, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' }}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.md }}>
        <View style={{ flexDirection: 'row', gap: s.sm }}>
          {EVENT_TYPES.map(tp => (
            <TouchableOpacity
              key={tp.key}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: s.sm + 2, paddingVertical: 5,
                borderRadius: r.full, borderWidth: 1,
                borderColor: type === tp.key ? tp.color : c.border,
                backgroundColor: type === tp.key ? tp.color + '18' : 'transparent',
              }}
              onPress={() => setType(tp.key)}
            >
              <Ionicons name={tp.icon} size={12} color={type === tp.key ? tp.color : c.text4} />
              <Text style={{ fontSize: 11, color: type === tp.key ? tp.color : c.text4, fontWeight: type === tp.key ? '700' : '400' }}>
                {tp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Title — notebook line style */}
      <View style={nb.lineWrap}>
        <TextInput
          style={[nb.lineInput, { color: c.text1 }]}
          value={title} onChangeText={setTitle}
          placeholder={
            type === 'focus' ? "Today's main focus..." :
            type === 'task'  ? "What needs to get done?" :
            type === 'note'  ? "Quick note..." :
            type === 'reminder' ? "Remind me to..." : "Event title..."
          }
          placeholderTextColor={c.text4}
          autoFocus
        />
        <View style={[nb.underline, { backgroundColor: c.border }]} />
      </View>

      {/* Desc */}
      <View style={[nb.lineWrap, { marginBottom: s.sm }]}>
        <TextInput
          style={[nb.lineInput, { color: c.text2, fontSize: t.xs + 1 }]}
          value={desc} onChangeText={setDesc}
          placeholder="Notes or details..."
          placeholderTextColor={c.text4}
          multiline
        />
        <View style={[nb.underline, { backgroundColor: c.border }]} />
      </View>

      {/* Time row */}
      <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.md, alignItems: 'center' }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          onPress={() => setAllDay(!allDay)}
        >
          <Ionicons
            name={allDay ? 'checkbox' : 'square-outline'}
            size={18} color={allDay ? typeConfig.color : c.text4}
          />
          <Text style={{ fontSize: t.xs, color: allDay ? typeConfig.color : c.text3 }}>All day</Text>
        </TouchableOpacity>
        {!allDay && (
          <TextInput
            style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 4, fontSize: t.sm, color: c.text1 }}
            value={time} onChangeText={setTime}
            placeholder="Time (e.g. 14:30)" placeholderTextColor={c.text4}
            keyboardType="numbers-and-punctuation"
          />
        )}
      </View>

      {/* Reminder */}
      {!allDay && (
        <View style={{ marginBottom: s.lg }}>
          <Text style={{ fontSize: 10, color: c.text4, marginBottom: s.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
            🔔 Remind me
          </Text>
          <View style={{ flexDirection: 'row', gap: s.sm, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={[nb.remChip, reminder === null && { borderColor: c.teal, backgroundColor: c.tealLight || c.bg2 }]}
              onPress={() => setReminder(null)}
            >
              <Text style={[nb.remText, { color: reminder === null ? c.teal : c.text4 }]}>None</Text>
            </TouchableOpacity>
            {REMINDER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[nb.remChip, reminder === opt.value && { borderColor: c.teal, backgroundColor: c.tealLight || c.bg2 }]}
                onPress={() => setReminder(opt.value)}
              >
                <Text style={[nb.remText, { color: reminder === opt.value ? c.teal : c.text4 }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm }}>
        <TouchableOpacity onPress={onCancel} style={{ paddingVertical: s.sm, paddingHorizontal: s.lg }}>
          <Text style={{ fontSize: t.sm, color: c.text3 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={save}
          disabled={!title.trim() || saving}
          style={{
            backgroundColor: typeConfig.color,
            borderRadius: r.md, paddingVertical: s.sm, paddingHorizontal: s.xl,
            opacity: (!title.trim() || saving) ? 0.5 : 1,
          }}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: t.sm }}>Save</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const nb = StyleSheet.create({
  lineWrap:  { marginBottom: s => s?.md || 12 },
  lineInput: { fontSize: 15, paddingVertical: 6, paddingHorizontal: 2, minHeight: 32 },
  underline: { height: 1, marginTop: 2 },
  remChip:   { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  remText:   { fontSize: 11 },
});

// ─── Main Calendar Modal ──────────────────────────────────────────────────────
export default function CalendarModal({ visible, onClose, userId, initialDate }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const today = new Date();
  const [anchor,   setAnchor]   = useState(initialDate || today);
  const [events,   setEvents]   = useState({});
  const [selected, setSelected] = useState(toISO(today));
  const [loading,  setLoading]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [deletingId, setDel]    = useState(null);

  const weekDays  = getWeekDays(anchor);
  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  const loadWeek = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [evtRes, taskRes, focusRes, noteRes] = await Promise.all([
        supabase.from('calendar_events').select('*').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('tasks').select('id, title, due_date, completed').eq('user_id', userId).eq('completed', false).gte('due_date', weekStart).lte('due_date', weekEnd),
        supabase.from('daily_focus').select('id, focus_text, date').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('captures').select('id, title, created_at, type').eq('user_id', userId).eq('status', 'inbox').gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59'),
      ]);
      const map = {};
      (evtRes.data || []).forEach(e => {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push({ ...e, _source: 'calendar' });
      });
      (taskRes.data || []).forEach(tk => {
        if (!tk.due_date) return;
        if (!map[tk.due_date]) map[tk.due_date] = [];
        if (!map[tk.due_date].some(e => e.task_id === tk.id))
          map[tk.due_date].push({ id: 'task_'+tk.id, title: tk.title, type: 'task', color: TYPE_COLORS.task, date: tk.due_date, _source: 'task' });
      });
      (focusRes.data || []).forEach(f => {
        if (!map[f.date]) map[f.date] = [];
        if (!map[f.date].some(e => e._source === 'focus'))
          map[f.date].push({ id: 'focus_'+f.id, title: f.focus_text, type: 'focus', color: TYPE_COLORS.focus, date: f.date, _source: 'focus' });
      });
      (noteRes.data || []).forEach(n => {
        const d = n.created_at?.split('T')[0]; if (!d) return;
        if (!map[d]) map[d] = [];
        map[d].push({ id: 'note_'+n.id, title: n.title || 'Note', type: 'note', color: TYPE_COLORS.note, date: d, _source: 'note' });
      });
      setEvents(map);
    } catch (e) { console.warn('CalendarModal loadWeek', e); }
    setLoading(false);
  }, [userId, weekStart, weekEnd]);

  useEffect(() => { if (visible) loadWeek(); }, [visible, loadWeek]);

  const prevWeek = () => { const d = new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); };
  const nextWeek = () => { const d = new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); };

  const deleteEvent = async (evt) => {
    if (evt._source !== 'calendar') return;
    setDel(evt.id);
    await supabase.from('calendar_events').delete().eq('id', evt.id);
    await loadWeek();
    setDel(null);
  };

  const selectedEvents = events[selected] || [];
  const isToday  = d => toISO(d) === toISO(today);
  const isSel    = d => toISO(d) === selected;
  const hasEvts  = d => (events[toISO(d)] || []).length > 0;

  // Notebook line colors
  const lineColor = c.border + '55';
  const redLine   = '#e05858' + '33';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dark backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Notebook popup — centered */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={[styles.notebook, { backgroundColor: c.name === 'dark' ? '#1a1508' : '#fffef8' }]}>

          {/* Notebook spine holes */}
          <View style={styles.spine}>
            {[0,1,2,3,4,5].map(i => (
              <View key={i} style={[styles.hole, { backgroundColor: c.bg0, borderColor: c.border }]} />
            ))}
          </View>

          {/* Red margin line */}
          <View style={[styles.marginLine, { backgroundColor: redLine }]} />

          {/* Horizontal ruled lines */}
          {Array.from({ length: 22 }).map((_, i) => (
            <View key={i} style={[styles.ruledLine, { top: 110 + i * 28, backgroundColor: lineColor }]} />
          ))}

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={c.text3} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.monthLabel, { color: c.text1 }]}>
                  {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
                </Text>
              </View>
              <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={18} color={c.text3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.navBtn}>
                <Ionicons name="close" size={18} color={c.text3} />
              </TouchableOpacity>
            </View>

            {/* Week strip */}
            <View style={styles.weekRow}>
              {weekDays.map((d, i) => {
                const sel   = isSel(d);
                const tod   = isToday(d);
                const has   = hasEvts(d);
                return (
                  <TouchableOpacity key={i} style={styles.dayCol} onPress={() => setSelected(toISO(d))}>
                    <Text style={[styles.dayName, { color: tod ? '#e05858' : c.text4 }]}>
                      {DAY_NAMES[d.getDay()]}
                    </Text>
                    <View style={[
                      styles.dayNum,
                      sel && { backgroundColor: c.gold },
                      tod && !sel && { borderWidth: 1.5, borderColor: '#e05858' },
                    ]}>
                      <Text style={[styles.dayNumText, { color: sel ? '#fff' : tod ? '#e05858' : c.text1 }]}>
                        {d.getDate()}
                      </Text>
                    </View>
                    {has && <View style={[styles.evtDot, { backgroundColor: sel ? c.gold : c.teal }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected day label */}
            <View style={[styles.dayLabel, { borderBottomColor: '#e05858' + '55' }]}>
              <Text style={[styles.dayLabelText, { color: '#e05858' }]}>
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-US',
                  { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: c.teal }]}
                onPress={() => setShowAdd(true)}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Events list */}
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator color={c.teal} />
              </View>
            ) : (
              <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                {selectedEvents.length === 0 ? (
                  <TouchableOpacity style={styles.emptyRow} onPress={() => setShowAdd(true)}>
                    <Text style={[styles.emptyLine, { color: c.text4 }]}>— nothing scheduled —</Text>
                    <Text style={[styles.emptyAdd, { color: c.teal }]}>+ add something</Text>
                  </TouchableOpacity>
                ) : (
                  selectedEvents.map((evt, i) => (
                    <View key={evt.id || i} style={styles.eventLine}>
                      {/* Bullet */}
                      <View style={[styles.bullet, { backgroundColor: evt.color || c.teal }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.eventTitle, { color: c.text1 }]}>{evt.title}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, alignItems: 'center' }}>
                          {evt.time && <Text style={[styles.eventMeta, { color: c.teal }]}>{fmt12(evt.time)}</Text>}
                          <Text style={[styles.eventMeta, { color: evt.color || c.teal }]}>{evt.type}</Text>
                          {evt._source !== 'calendar' && (
                            <Text style={[styles.eventMeta, { color: c.text4, fontStyle: 'italic' }]}>
                              from {evt._source}
                            </Text>
                          )}
                          {evt.reminder_min && (
                            <Text style={[styles.eventMeta, { color: c.gold }]}>
                              🔔 {REMINDER_OPTIONS.find(o => o.value === evt.reminder_min)?.label}
                            </Text>
                          )}
                        </View>
                      </View>
                      {evt._source === 'calendar' && (
                        <TouchableOpacity onPress={() => deleteEvent(evt)} disabled={deletingId === evt.id}>
                          {deletingId === evt.id
                            ? <ActivityIndicator size="small" color={c.text4} />
                            : <Ionicons name="close-circle-outline" size={16} color={c.text4} />
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {/* Add event — slides up from bottom */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.addOverlay}>
          <View style={[styles.addSheet, { backgroundColor: c.bg1 }]}>
            <View style={[styles.addHandle, { backgroundColor: c.border }]} />
            <AddEventForm
              date={new Date(selected + 'T12:00:00')}
              userId={userId}
              c={c} t={t} s={s} r={r}
              onSave={async () => { setShowAdd(false); await loadWeek(); }}
              onCancel={() => setShowAdd(false)}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const NOTEBOOK_W = Math.min(SW * 0.88, 400);
const NOTEBOOK_H = Math.min(SH * 0.72, 580);
const SPINE_W    = 36;
const MARGIN_X   = SPINE_W + 20;

const styles = StyleSheet.create({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  centerWrap:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  notebook:    {
    width: NOTEBOOK_W, height: NOTEBOOK_H,
    borderRadius: 6, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 16,
    flexDirection: 'row',
  },
  spine:       { width: SPINE_W, backgroundColor: '#c9a84c22', alignItems: 'center', paddingVertical: 20, gap: 18, zIndex: 2 },
  hole:        { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  marginLine:  { position: 'absolute', left: SPINE_W + 14, top: 0, bottom: 0, width: 1.5, zIndex: 1 },
  ruledLine:   { position: 'absolute', left: MARGIN_X, right: 0, height: 1, zIndex: 0 },
  content:     { flex: 1, zIndex: 2 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  navBtn:      { padding: 6 },
  monthLabel:  { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  weekRow:     { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  dayCol:      { flex: 1, alignItems: 'center', gap: 4 },
  dayName:     { fontSize: 9, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  dayNum:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayNumText:  { fontSize: 14, fontWeight: '700' },
  evtDot:      { width: 4, height: 4, borderRadius: 2 },
  dayLabel:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1.5 },
  dayLabelText:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnText:  { fontSize: 11, color: '#fff', fontWeight: '700' },
  eventsList:  { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  emptyRow:    { paddingVertical: 16, alignItems: 'center', gap: 6 },
  emptyLine:   { fontSize: 13, fontStyle: 'italic' },
  emptyAdd:    { fontSize: 12, fontWeight: '600' },
  eventLine:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  bullet:      { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  eventTitle:  { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  eventMeta:   { fontSize: 10, fontWeight: '500' },
  addOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  addSheet:    { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: SH * 0.85 },
  addHandle:   { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
});
