// src/components/CalendarModal.js
// Notebook-style weekly planner — days as vertical columns with event previews

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
const DAY_SHORT   = ['S','M','T','W','T','F','S'];
const DAY_FULL    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  return `${h % 12 || 12}:${String(m).padStart(2,'0')}${h >= 12 ? 'p' : 'a'}`;
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
      const { data, error } = await supabase
        .from('calendar_events').insert(item).select().single();
      if (error) throw error;
      if (reminder && time && !allDay)
        await scheduleReminder(title.trim(), toISO(date), time, reminder);
      if (type === 'task')
        await supabase.from('tasks').insert({ user_id: userId, title: title.trim(), due_date: toISO(date), category: 'personal', priority: 2 });
      if (type === 'focus')
        await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: title.trim(), date: toISO(date) });
      onSave(data);
    } catch { Alert.alert('Error', 'Could not save. Try again.'); }
    setSaving(false);
  };

  return (
    <View style={{ padding: s.lg }}>
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
              style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:s.sm+2, paddingVertical:5, borderRadius:r.full, borderWidth:1, borderColor: type===tp.key ? tp.color : c.border, backgroundColor: type===tp.key ? tp.color+'18' : 'transparent' }}
              onPress={() => setType(tp.key)}
            >
              <Ionicons name={tp.icon} size={12} color={type===tp.key ? tp.color : c.text4} />
              <Text style={{ fontSize:11, color: type===tp.key ? tp.color : c.text4, fontWeight: type===tp.key ? '700' : '400' }}>{tp.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {/* Title */}
      <TextInput style={[formS.input, { color: c.text1, borderBottomColor: c.border }]} value={title} onChangeText={setTitle}
        placeholder={type==='focus' ? "Today's main focus..." : type==='task' ? "What needs to get done?" : type==='note' ? "Quick note..." : type==='reminder' ? "Remind me to..." : "Event title..."}
        placeholderTextColor={c.text4} autoFocus />
      <TextInput style={[formS.input, { color: c.text2, borderBottomColor: c.border, minHeight: 48 }]} value={desc} onChangeText={setDesc}
        placeholder="Notes..." placeholderTextColor={c.text4} multiline />
      {/* Time */}
      <View style={{ flexDirection:'row', gap:s.sm, marginBottom:s.md, alignItems:'center' }}>
        <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', gap:4 }} onPress={() => setAllDay(!allDay)}>
          <Ionicons name={allDay ? 'checkbox' : 'square-outline'} size={18} color={allDay ? typeConfig.color : c.text4} />
          <Text style={{ fontSize:t.xs, color: allDay ? typeConfig.color : c.text3 }}>All day</Text>
        </TouchableOpacity>
        {!allDay && (
          <TextInput style={{ flex:1, borderBottomWidth:1, borderBottomColor:c.border, paddingVertical:4, fontSize:t.sm, color:c.text1 }}
            value={time} onChangeText={setTime} placeholder="Time (14:30)" placeholderTextColor={c.text4} keyboardType="numbers-and-punctuation" />
        )}
      </View>
      {/* Reminder */}
      {!allDay && (
        <View style={{ marginBottom:s.lg }}>
          <Text style={{ fontSize:10, color:c.text4, marginBottom:s.sm, textTransform:'uppercase', letterSpacing:1 }}>🔔 Remind me</Text>
          <View style={{ flexDirection:'row', gap:s.sm, flexWrap:'wrap' }}>
            {[{ label:'None', value:null }, ...REMINDER_OPTIONS].map(opt => (
              <TouchableOpacity key={String(opt.value)}
                style={{ borderWidth:1, borderRadius:r.full, paddingHorizontal:10, paddingVertical:4, borderColor: reminder===opt.value ? c.teal : c.border, backgroundColor: reminder===opt.value ? (c.tealLight||c.bg2) : 'transparent' }}
                onPress={() => setReminder(opt.value)}>
                <Text style={{ fontSize:11, color: reminder===opt.value ? c.teal : c.text4 }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:s.sm }}>
        <TouchableOpacity onPress={onCancel} style={{ paddingVertical:s.sm, paddingHorizontal:s.lg }}>
          <Text style={{ fontSize:t.sm, color:c.text3 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} disabled={!title.trim()||saving}
          style={{ backgroundColor:typeConfig.color, borderRadius:r.md, paddingVertical:s.sm, paddingHorizontal:s.xl, opacity:(!title.trim()||saving)?0.5:1 }}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color:'#fff', fontWeight:'700', fontSize:t.sm }}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formS = StyleSheet.create({
  input: { fontSize: 14, paddingVertical: 8, paddingHorizontal: 2, borderBottomWidth: 1, marginBottom: 10 },
});

// ─── Day Column ───────────────────────────────────────────────────────────────
function DayColumn({ day, events, isToday, isSelected, onPress, onAdd, c, t }) {
  const iso    = toISO(day);
  const dayEvs = events[iso] || [];

  return (
    <TouchableOpacity
      style={[
        col.wrap,
        { borderColor: c.border },
        isSelected && { backgroundColor: c.gold + '12', borderColor: c.gold },
        isToday && !isSelected && { backgroundColor: c.teal + '08', borderColor: c.teal + '44' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Day header */}
      <View style={[col.header, { borderBottomColor: isToday ? c.teal : isSelected ? c.gold : c.border }]}>
        <Text style={[col.dayName, { color: isToday ? c.teal : isSelected ? c.gold : c.text4 }]}>
          {DAY_FULL[day.getDay()].slice(0,3)}
        </Text>
        <View style={[col.numCircle, isToday && { backgroundColor: c.teal }, isSelected && !isToday && { backgroundColor: c.gold }]}>
          <Text style={[col.dayNum, { color: (isToday || isSelected) ? '#fff' : c.text1 }]}>
            {day.getDate()}
          </Text>
        </View>
      </View>

      {/* Event previews */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {dayEvs.length === 0 ? (
          <TouchableOpacity style={col.addHint} onPress={onAdd}>
            <Text style={{ fontSize: 18, opacity: 0.2 }}>+</Text>
          </TouchableOpacity>
        ) : (
          <>
            {dayEvs.map((evt, i) => (
              <View key={evt.id || i} style={[col.evtChip, { backgroundColor: (evt.color || c.teal) + '22', borderLeftColor: evt.color || c.teal }]}>
                <Text style={[col.evtText, { color: evt.color || c.teal }]} numberOfLines={2}>
                  {evt.title}
                </Text>
                {evt.time && (
                  <Text style={[col.evtTime, { color: evt.color || c.teal }]}>
                    {fmt12(evt.time)}
                  </Text>
                )}
              </View>
            ))}
            <TouchableOpacity style={col.addMore} onPress={onAdd}>
              <Text style={{ fontSize: 11, color: c.text4 }}>+ add</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </TouchableOpacity>
  );
}

const col = StyleSheet.create({
  wrap:     { flex: 1, borderWidth: 0.5, borderRadius: 8, overflow: 'hidden', marginHorizontal: 2 },
  header:   { alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
  dayName:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  numCircle:{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayNum:   { fontSize: 13, fontWeight: '700' },
  evtChip:  { borderLeftWidth: 2, borderRadius: 3, padding: 4, marginHorizontal: 3, marginTop: 3 },
  evtText:  { fontSize: 9, fontWeight: '600', lineHeight: 12 },
  evtTime:  { fontSize: 8, marginTop: 1, opacity: 0.8 },
  addHint:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  addMore:  { alignItems: 'center', paddingVertical: 4 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CalendarModal({ visible, onClose, userId, initialDate }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const today = new Date();
  const [anchor,   setAnchor]   = useState(initialDate || today);
  const [events,   setEvents]   = useState({});
  const [selected, setSelected] = useState(toISO(today));
  const [loading,  setLoading]  = useState(false);
  const [addDate,  setAddDate]  = useState(null);

  const weekDays  = getWeekDays(anchor);
  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  const loadWeek = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [evtRes, taskRes, focusRes, noteRes] = await Promise.all([
        supabase.from('calendar_events').select('*').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('tasks').select('id, title, due_date').eq('user_id', userId).eq('completed', false).gte('due_date', weekStart).lte('due_date', weekEnd),
        supabase.from('daily_focus').select('id, focus_text, date').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('captures').select('id, title, created_at').eq('user_id', userId).eq('status', 'inbox').gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59'),
      ]);
      const map = {};
      const add = (date, item) => { if (!map[date]) map[date] = []; map[date].push(item); };

      (evtRes.data  || []).forEach(e  => add(e.date, { ...e, _source: 'calendar' }));
      (taskRes.data || []).forEach(tk => { if (tk.due_date) add(tk.due_date, { id:'task_'+tk.id, title:tk.title, type:'task', color:TYPE_COLORS.task, date:tk.due_date, _source:'task' }); });
      (focusRes.data|| []).forEach(f  => add(f.date, { id:'focus_'+f.id, title:f.focus_text, type:'focus', color:TYPE_COLORS.focus, date:f.date, _source:'focus' }));
      (noteRes.data || []).forEach(n  => { const d=n.created_at?.split('T')[0]; if(d) add(d,{ id:'note_'+n.id, title:n.title||'Note', type:'note', color:TYPE_COLORS.note, date:d, _source:'note' }); });
      setEvents(map);
    } catch (e) { console.warn('CalendarModal', e); }
    setLoading(false);
  }, [userId, weekStart, weekEnd]);

  useEffect(() => { if (visible) loadWeek(); }, [visible, loadWeek]);

  const prevWeek = () => { const d=new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); };
  const nextWeek = () => { const d=new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); };

  const isDark = c.bg0 === '#0e0818';
  const paperBg = isDark ? '#1a1508' : '#fffef8';
  const lineColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const redLine = isDark ? '#e0585833' : '#e0585822';

  const POPUP_W = Math.min(SW * 0.95, 440);
  const POPUP_H = Math.min(SH * 0.75, 560);
  const SPINE_W = 32;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}
        accessibilityLabel="Close calendar">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)' }} />
      </TouchableOpacity>

      {/* Notebook popup */}
      <View style={{ ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center' }} pointerEvents="box-none">
        <View style={{
          width: POPUP_W, height: POPUP_H,
          backgroundColor: paperBg, borderRadius: 8,
          flexDirection: 'row', overflow: 'hidden',
          shadowColor: '#000', shadowOffset:{width:0,height:10},
          shadowOpacity:0.45, shadowRadius:24, elevation:20,
        }}>
          {/* Spine */}
          <View style={{ width: SPINE_W, backgroundColor: '#c9a84c22', alignItems:'center', paddingVertical:16, gap:14 }}>
            {[0,1,2,3,4,5,6].map(i => (
              <View key={i} style={{ width:14, height:14, borderRadius:7, backgroundColor:paperBg, borderWidth:1.5, borderColor:'#c9a84c66' }} />
            ))}
          </View>

          {/* Red margin */}
          <View style={{ position:'absolute', left: SPINE_W+12, top:0, bottom:0, width:1.5, backgroundColor:redLine }} />

          {/* Ruled lines */}
          {Array.from({ length: 16 }).map((_,i) => (
            <View key={i} style={{ position:'absolute', left: SPINE_W+24, right:0, top: 90+i*28, height:1, backgroundColor:lineColor }} />
          ))}

          {/* Main content */}
          <View style={{ flex:1, paddingLeft: 18 }}>
            {/* Header */}
            <View style={{ flexDirection:'row', alignItems:'center', paddingRight:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:lineColor }}>
              <TouchableOpacity onPress={prevWeek} style={{ padding:6 }}>
                <Ionicons name="chevron-back" size={17} color={c.text3} />
              </TouchableOpacity>
              <Text style={{ flex:1, textAlign:'center', fontSize:13, fontWeight:'700', color:c.text1 }}>
                {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
              </Text>
              <TouchableOpacity onPress={nextWeek} style={{ padding:6 }}>
                <Ionicons name="chevron-forward" size={17} color={c.text3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ padding:6 }}>
                <Ionicons name="close" size={17} color={c.text3} />
              </TouchableOpacity>
            </View>

            {/* Week columns */}
            {loading ? (
              <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                <ActivityIndicator color={c.teal} />
              </View>
            ) : (
              <View style={{ flex:1, flexDirection:'row', padding:6, paddingRight:12 }}>
                {weekDays.map((day, i) => (
                  <DayColumn
                    key={i}
                    day={day}
                    events={events}
                    isToday={toISO(day) === toISO(today)}
                    isSelected={toISO(day) === selected}
                    onPress={() => setSelected(toISO(day))}
                    onAdd={() => setAddDate(day)}
                    c={c}
                    t={t}
                  />
                ))}
              </View>
            )}

            {/* Footer */}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:12, paddingVertical:8, borderTopWidth:1, borderTopColor:lineColor }}>
              <Text style={{ fontSize:10, color:c.text4, fontStyle:'italic' }}>
                Week of {weekDays[0].toLocaleDateString('en-US',{ month:'short', day:'numeric' })}
              </Text>
              <TouchableOpacity
                style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:c.teal, borderRadius:12, paddingHorizontal:12, paddingVertical:5 }}
                onPress={() => setAddDate(new Date(selected + 'T12:00:00'))}
              >
                <Ionicons name="add" size={13} color="#fff" />
                <Text style={{ fontSize:11, color:'#fff', fontWeight:'700' }}>Add to {DAY_FULL[new Date(selected+'T12:00:00').getDay()]}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Add event sheet */}
      <Modal visible={!!addDate} transparent animationType="slide" onRequestClose={() => setAddDate(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:20, borderTopRightRadius:20, paddingBottom:40, maxHeight:SH*0.85 }}>
              <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.border, alignSelf:'center', marginTop:10, marginBottom:6 }} />
              {addDate && (
                <AddEventForm
                  date={addDate}
                  userId={userId}
                  c={c} t={t} s={s} r={r}
                  onSave={async () => { setAddDate(null); await loadWeek(); }}
                  onCancel={() => setAddDate(null)}
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Modal>
  );
}
