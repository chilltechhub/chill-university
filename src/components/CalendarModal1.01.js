// src/components/CalendarModal.js
// Weekly calendar popup — synced with focus, tasks, and notes
// Tap the date button on HomeScreen to open this

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';

// ─── Notification helper ──────────────────────────────────────────────────────
// Safe import — works in Expo Go, full push in EAS build
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
      content: {
        title: '🗓️ Reminder',
        body: title,
        sound: true,
      },
      trigger: triggerDate,
    });
  } catch { return null; }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const EVENT_TYPES = [
  { key: 'event',    label: 'Event',    icon: 'calendar',          color: '#2bb5a0' },
  { key: 'reminder', label: 'Reminder', icon: 'notifications',     color: '#c9a84c' },
  { key: 'task',     label: 'Task',     icon: 'checkmark-circle',  color: '#3ac860' },
  { key: 'note',     label: 'Note',     icon: 'document-text',     color: '#8b4fc4' },
  { key: 'focus',    label: 'Focus',    icon: 'bookmark',          color: '#e05858' },
];

const REMINDER_OPTIONS = [
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before',  value: 1440 },
];

const TYPE_COLORS = Object.fromEntries(EVENT_TYPES.map(t => [t.key, t.color]));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDays(anchor) {
  const base = new Date(anchor);
  const day  = base.getDay();
  base.setDate(base.getDate() - day); // go to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

// ─── Add Event Form ───────────────────────────────────────────────────────────
function AddEventForm({ date, userId, onSave, onCancel, c, t, s, r }) {
  const [title,       setTitle]       = useState('');
  const [description, setDesc]        = useState('');
  const [type,        setType]        = useState('event');
  const [time,        setTime]        = useState('');
  const [allDay,      setAllDay]      = useState(false);
  const [reminder,    setReminder]    = useState(null);
  const [saving,      setSaving]      = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const item = {
        user_id:      userId,
        title:        title.trim(),
        description:  description.trim() || null,
        date:         toISO(date),
        time:         allDay ? null : (time || null),
        type,
        color:        TYPE_COLORS[type] || '#2bb5a0',
        all_day:      allDay,
        reminder_min: reminder,
      };

      const { data, error } = await supabase
        .from('calendar_events').insert(item).select().single();
      if (error) throw error;

      // Schedule push notification if reminder set
      if (reminder && time && !allDay) {
        await scheduleReminder(title.trim(), toISO(date), time, reminder);
      }

      // If type is task — also create in tasks table
      if (type === 'task') {
        await supabase.from('tasks').insert({
          user_id:  userId,
          title:    title.trim(),
          due_date: toISO(date),
          category: 'personal',
          priority: 2,
        });
      }

      // If type is focus — upsert daily_focus
      if (type === 'focus') {
        await supabase.from('daily_focus').upsert({
          user_id:    userId,
          focus_text: title.trim(),
          date:       toISO(date),
        });
      }

      onSave(data);
    } catch (e) {
      Alert.alert('Error', 'Could not save event. Try again.');
      console.warn('AddEventForm save', e);
    }
    setSaving(false);
  };

  const styles = formStyles(c, t, s, r);
  const typeConfig = EVENT_TYPES.find(tp => tp.key === type);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        {/* Date label */}
        <Text style={styles.formDate}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginBottom: s.md }}>
          {EVENT_TYPES.map(tp => (
            <TouchableOpacity
              key={tp.key}
              style={[styles.typeChip, type === tp.key && { backgroundColor: tp.color + '22', borderColor: tp.color }]}
              onPress={() => setType(tp.key)}
            >
              <Ionicons name={tp.icon} size={13} color={type === tp.key ? tp.color : c.text3} />
              <Text style={[styles.typeText, type === tp.key && { color: tp.color }]}>{tp.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Title */}
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={
            type === 'focus'    ? "Today's main focus..." :
            type === 'task'     ? "What needs to get done?" :
            type === 'note'     ? "Quick note..." :
            type === 'reminder' ? "Remind me to..." :
            "Event title..."
          }
          placeholderTextColor={c.text4}
          autoFocus
        />

        {/* Description */}
        <TextInput
          style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDesc}
          placeholder="Add notes or details (optional)"
          placeholderTextColor={c.text4}
          multiline
        />

        {/* Time + all day */}
        <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.md, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.toggleBtn, allDay && { backgroundColor: typeConfig.color + '22', borderColor: typeConfig.color }]}
            onPress={() => setAllDay(!allDay)}
          >
            <Ionicons name={allDay ? 'checkmark-circle' : 'ellipse-outline'} size={16}
              color={allDay ? typeConfig.color : c.text3} />
            <Text style={[styles.toggleText, allDay && { color: typeConfig.color }]}>All day</Text>
          </TouchableOpacity>

          {!allDay && (
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={time}
              onChangeText={setTime}
              placeholder="Time (e.g. 14:30)"
              placeholderTextColor={c.text4}
              keyboardType="numbers-and-punctuation"
            />
          )}
        </View>

        {/* Reminder */}
        {!allDay && (
          <View style={{ marginBottom: s.md }}>
            <Text style={styles.sectionLabel}>🔔 Reminder</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                <TouchableOpacity
                  style={[styles.reminderChip, reminder === null && styles.reminderChipActive]}
                  onPress={() => setReminder(null)}
                >
                  <Text style={[styles.reminderText, reminder === null && { color: c.teal }]}>None</Text>
                </TouchableOpacity>
                {REMINDER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.reminderChip, reminder === opt.value && styles.reminderChipActive]}
                    onPress={() => setReminder(opt.value)}
                  >
                    <Text style={[styles.reminderText, reminder === opt.value && { color: c.teal }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.formBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: typeConfig.color }, (!title.trim() || saving) && { opacity: 0.5 }]}
            onPress={save}
            disabled={!title.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Calendar Modal ──────────────────────────────────────────────────────
export default function CalendarModal({ visible, onClose, userId, initialDate }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const today  = new Date();
  const [anchor,     setAnchor]     = useState(initialDate || today);
  const [events,     setEvents]     = useState({});  // { 'YYYY-MM-DD': [...] }
  const [selected,   setSelected]   = useState(toISO(today));
  const [loading,    setLoading]    = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deletingId, setDeleting]   = useState(null);

  const weekDays = getWeekDays(anchor);
  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  const styles = makeStyles(c, t, s, r);

  // Load events for this week + synced data
  const loadWeek = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [evtRes, taskRes, focusRes, noteRes] = await Promise.all([
        // Calendar events
        supabase.from('calendar_events')
          .select('*').eq('user_id', userId)
          .gte('date', weekStart).lte('date', weekEnd),
        // Tasks due this week
        supabase.from('tasks')
          .select('id, title, due_date, completed')
          .eq('user_id', userId).eq('completed', false)
          .gte('due_date', weekStart).lte('due_date', weekEnd),
        // Daily focus this week
        supabase.from('daily_focus')
          .select('id, focus_text, date')
          .eq('user_id', userId)
          .gte('date', weekStart).lte('date', weekEnd),
        // Inbox notes/captures
        supabase.from('captures')
          .select('id, title, created_at, type')
          .eq('user_id', userId).eq('status', 'inbox')
          .gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59'),
      ]);

      const map = {};

      // Calendar events
      (evtRes.data || []).forEach(e => {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push({ ...e, _source: 'calendar' });
      });

      // Tasks
      (taskRes.data || []).forEach(t2 => {
        if (!t2.due_date) return;
        if (!map[t2.due_date]) map[t2.due_date] = [];
        // Don't duplicate if already in calendar
        const exists = map[t2.due_date].some(e => e.task_id === t2.id);
        if (!exists) map[t2.due_date].push({
          id: 'task_' + t2.id, title: t2.title, type: 'task',
          color: TYPE_COLORS.task, date: t2.due_date,
          completed: t2.completed, _source: 'task',
        });
      });

      // Focus
      (focusRes.data || []).forEach(f => {
        if (!map[f.date]) map[f.date] = [];
        const exists = map[f.date].some(e => e._source === 'focus');
        if (!exists) map[f.date].push({
          id: 'focus_' + f.id, title: f.focus_text, type: 'focus',
          color: TYPE_COLORS.focus, date: f.date, _source: 'focus',
        });
      });

      // Notes/captures
      (noteRes.data || []).forEach(n => {
        const d = n.created_at?.split('T')[0];
        if (!d) return;
        if (!map[d]) map[d] = [];
        map[d].push({
          id: 'note_' + n.id, title: n.title || 'Untitled note',
          type: 'note', color: TYPE_COLORS.note, date: d, _source: 'note',
        });
      });

      setEvents(map);
    } catch (e) { console.warn('CalendarModal loadWeek', e); }
    setLoading(false);
  }, [userId, weekStart, weekEnd]);

  useEffect(() => { if (visible) loadWeek(); }, [visible, loadWeek]);

  const prevWeek = () => {
    const d = new Date(anchor);
    d.setDate(d.getDate() - 7);
    setAnchor(d);
  };

  const nextWeek = () => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7);
    setAnchor(d);
  };

  const deleteEvent = async (event) => {
    if (event._source !== 'calendar') return; // only delete calendar events
    setDeleting(event.id);
    await supabase.from('calendar_events').delete().eq('id', event.id);
    await loadWeek();
    setDeleting(null);
  };

  const selectedEvents = events[selected] || [];
  const isToday = (d) => toISO(d) === toISO(today);
  const isSelected = (d) => toISO(d) === selected;
  const hasEvents = (d) => (events[toISO(d)] || []).length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={c.text3} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={c.text3} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>

          {/* Week row */}
          <View style={styles.weekRow}>
            {weekDays.map((d, i) => {
              const iso = toISO(d);
              const today2 = isToday(d);
              const sel = isSelected(d);
              const has = hasEvents(d);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayBtn, sel && styles.dayBtnSelected, today2 && !sel && styles.dayBtnToday]}
                  onPress={() => setSelected(iso)}
                >
                  <Text style={[styles.dayName, sel && styles.dayTextSelected, today2 && !sel && { color: c.teal }]}>
                    {DAY_NAMES[d.getDay()]}
                  </Text>
                  <Text style={[styles.dayNum, sel && styles.dayTextSelected, today2 && !sel && { color: c.teal }]}>
                    {d.getDate()}
                  </Text>
                  {has && <View style={[styles.eventDot, { backgroundColor: sel ? '#fff' : c.teal }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected day events */}
          <View style={styles.eventsSection}>
            <View style={styles.eventsHeader}>
              <Text style={styles.eventsTitle}>
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-US',
                  { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: c.teal }]}
                onPress={() => setShowAdd(true)}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={c.teal} />
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {selectedEvents.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyEmoji}>📅</Text>
                    <Text style={styles.emptyText}>Nothing scheduled</Text>
                    <TouchableOpacity onPress={() => setShowAdd(true)}>
                      <Text style={[styles.emptyAction, { color: c.teal }]}>+ Add something</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  selectedEvents.map((evt, i) => (
                    <View key={evt.id || i} style={[styles.eventRow, { borderLeftColor: evt.color || c.teal }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <View style={[styles.typeBadge, { backgroundColor: (evt.color || c.teal) + '22' }]}>
                            <Text style={[styles.typeBadgeText, { color: evt.color || c.teal }]}>
                              {evt.type}
                            </Text>
                          </View>
                          {evt._source !== 'calendar' && (
                            <Text style={styles.sourceText}>from {evt._source}</Text>
                          )}
                        </View>
                        <Text style={styles.eventTitle}>{evt.title}</Text>
                        {evt.time && <Text style={styles.eventTime}>{fmt12(evt.time)}</Text>}
                        {evt.description && <Text style={styles.eventDesc}>{evt.description}</Text>}
                        {evt.reminder_min && (
                          <Text style={styles.reminderBadge}>
                            🔔 {REMINDER_OPTIONS.find(o => o.value === evt.reminder_min)?.label || `${evt.reminder_min}m before`}
                          </Text>
                        )}
                      </View>
                      {evt._source === 'calendar' && (
                        <TouchableOpacity
                          onPress={() => deleteEvent(evt)}
                          style={styles.deleteBtn}
                          disabled={deletingId === evt.id}
                        >
                          {deletingId === evt.id
                            ? <ActivityIndicator size="small" color={c.error} />
                            : <Ionicons name="trash-outline" size={16} color={c.text4} />
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {/* Add event bottom sheet */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: s.xxl }]}>
            <View style={styles.handle} />
            <AddEventForm
              date={new Date(selected + 'T12:00:00')}
              userId={userId}
              c={c} t={t} s={s} r={r}
              onSave={async (newEvt) => {
                setShowAdd(false);
                await loadWeek();
              }}
              onCancel={() => setShowAdd(false)}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (c, t, s, r) => StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: c.modalBg || c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, paddingBottom: 40, maxHeight: '88%' },
  handle:        { width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingVertical: s.md },
  navBtn:        { padding: s.sm },
  monthLabel:    { flex: 1, textAlign: 'center', fontSize: t.md, fontWeight: t.bold, color: c.text1 },
  closeBtn:      { padding: s.sm },
  weekRow:       { flexDirection: 'row', paddingHorizontal: s.md, paddingBottom: s.md, borderBottomWidth: 0.5, borderBottomColor: c.border },
  dayBtn:        { flex: 1, alignItems: 'center', paddingVertical: s.sm, borderRadius: r.md },
  dayBtnSelected:{ backgroundColor: c.gold },
  dayBtnToday:   { backgroundColor: c.tealLight || c.bg2 },
  dayName:       { fontSize: 9, color: c.text4, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  dayNum:        { fontSize: t.md, fontWeight: t.bold, color: c.text1 },
  dayTextSelected:{ color: '#fff' },
  eventDot:      { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  eventsSection: { flex: 1, paddingHorizontal: s.lg, paddingTop: s.md },
  eventsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.md },
  eventsTitle:   { fontSize: t.sm, fontWeight: t.bold, color: c.text1 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 14, paddingHorizontal: s.md, paddingVertical: 6 },
  addBtnText:    { fontSize: t.xs, color: '#fff', fontWeight: t.bold },
  loadingWrap:   { alignItems: 'center', paddingVertical: s.xxl },
  emptyWrap:     { alignItems: 'center', paddingVertical: s.xxl },
  emptyEmoji:    { fontSize: 36, marginBottom: s.sm },
  emptyText:     { fontSize: t.sm, color: c.text3, marginBottom: s.sm },
  emptyAction:   { fontSize: t.sm, fontWeight: t.semibold },
  eventRow:      { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderLeftWidth: 3 },
  typeBadge:     { borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sourceText:    { fontSize: 9, color: c.text4, fontStyle: 'italic' },
  eventTitle:    { fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: 2 },
  eventTime:     { fontSize: t.xs, color: c.teal, marginBottom: 2 },
  eventDesc:     { fontSize: t.xs, color: c.text3, lineHeight: 16 },
  reminderBadge: { fontSize: 10, color: c.gold, marginTop: 4 },
  deleteBtn:     { padding: s.sm, alignSelf: 'center' },
});

const formStyles = (c, t, s, r) => StyleSheet.create({
  form:         { padding: s.lg },
  formDate:     { fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: s.lg, textAlign: 'center' },
  typeChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: c.border, borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6, marginRight: s.sm, backgroundColor: c.bg0 },
  typeText:     { fontSize: t.xs, color: c.text3 },
  input:        { borderWidth: 1, borderColor: c.inputBorder || c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, backgroundColor: c.inputBg || c.bg0, marginBottom: s.sm },
  toggleBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: s.md, paddingVertical: s.sm, backgroundColor: c.bg0 },
  toggleText:   { fontSize: t.xs, color: c.text3 },
  sectionLabel: { fontSize: t.xs, color: c.text3, marginBottom: s.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  reminderChip: { borderWidth: 1, borderColor: c.border, borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6, backgroundColor: c.bg0 },
  reminderChipActive: { backgroundColor: c.tealLight || c.bg2, borderColor: c.teal },
  reminderText: { fontSize: t.xs, color: c.text3 },
  formBtns:     { flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm, marginTop: s.md },
  cancelBtn:    { paddingVertical: s.md, paddingHorizontal: s.lg },
  cancelText:   { fontSize: t.sm, color: c.text3 },
  saveBtn:      { borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl, alignItems: 'center', minWidth: 80 },
  saveText:     { color: '#fff', fontWeight: t.bold, fontSize: t.sm },
});
