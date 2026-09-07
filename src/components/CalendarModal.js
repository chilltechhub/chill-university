// src/components/CalendarModal.js
// Notebook-style center popup — 7 horizontal day cards stacked vertically

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../api/offlineCache';
import { dateStr } from '../logic/dateUtils';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Notifications ────────────────────────────────────────────────────────────
let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}
async function scheduleReminder(title, date, time, minutesBefore = 30) {
  if (!Notifications) return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const [h, m] = (time || '09:00').split(':').map(Number);
    const d = new Date(date); d.setHours(h, m, 0, 0);
    const trigger = new Date(d.getTime() - minutesBefore * 60000);
    if (trigger <= new Date()) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: '🗓️ Reminder', body: title, sound: true },
      trigger,
    });
  } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const EVENT_TYPES = [
  { key:'event',    label:'Event',    icon:'calendar-outline',         color:'#2bb5a0' },
  { key:'reminder', label:'Reminder', icon:'notifications-outline',    color:'#c9a84c' },
  { key:'task',     label:'Task',     icon:'checkmark-circle-outline', color:'#3ac860' },
  { key:'note',     label:'Note',     icon:'document-text-outline',    color:'#8b4fc4' },
  { key:'focus',    label:'Focus',    icon:'bookmark-outline',         color:'#e05858' },
];
const PLANNER_AREAS = {
  physical:     { emoji: '💪', color: '#e05858' }, mental:       { emoji: '🧠', color: '#8b4fc4' },
  social:       { emoji: '🤝', color: '#2bb5a0' }, financial:    { emoji: '💰', color: '#3ac860' },
  professional: { emoji: '🚀', color: '#c9a84c' }, spiritual:    { emoji: '✨', color: '#6b9fe8' },
  creative:     { emoji: '🎨', color: '#e0a830' }, digital:      { emoji: '💻', color: '#5a9ae0' },
};
const REMINDER_OPTS = [
  { label:'None',    value:null },
  { label:'15 min',  value:15 },
  { label:'30 min',  value:30 },
  { label:'1 hour',  value:60 },
  { label:'1 day',   value:1440 },
];
const TYPE_COLORS = Object.fromEntries(EVENT_TYPES.map(t => [t.key, t.color]));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDays(anchor) {
  const base = new Date(anchor);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base); d.setDate(base.getDate() + i); return d;
  });
}
function toISO(d)    { return dateStr(d); } // local calendar, not UTC
function fmt12(t24)  {
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ─── Add Event Form ───────────────────────────────────────────────────────────
function AddEventForm({ date, userId, onSave, onCancel, c, t, s, r, initialType }) {
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [type,     setType]     = useState(initialType || 'event');
  const [time,     setTime]     = useState('');
  const [allDay,   setAllDay]   = useState(false);
  const [reminder, setReminder] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const tc = EVENT_TYPES.find(tp => tp.key === type);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      // Task and Focus each already have their own dedicated table — and
      // the week load below (loadWeek) fetches both of those AND
      // calendar_events independently, rendering each row it finds. An
      // unconditional calendar_events insert here on top of that dedicated
      // row made every task/focus entry show up twice on the same day.
      let data = null;
      if (type === 'task') {
        const { error: taskErr } = await supabase.from('tasks').insert({ user_id: userId, title: title.trim(), due_date: toISO(date), category: 'personal', priority: 2 });
        if (taskErr) throw taskErr;
      } else if (type === 'focus') {
        const { error: focusErr } = await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: title.trim(), focus_date: toISO(date) });
        if (focusErr) throw focusErr;
      } else {
        const { data: evt, error } = await supabase.from('calendar_events').insert({
          user_id: userId, title: title.trim(),
          description: desc.trim() || null,
          date: toISO(date), time: allDay ? null : (time || null),
          type, color: TYPE_COLORS[type], all_day: allDay, reminder_min: reminder,
        }).select().single();
        if (error) throw error;
        data = evt;
      }
      if (reminder && time && !allDay)
        await scheduleReminder(title.trim(), toISO(date), time, reminder);
      onSave(data);
    } catch { Alert.alert('Error', 'Could not save.'); }
    setSaving(false);
  };

  return (
    <View style={{ padding: s.lg }}>
      <View style={{ borderBottomWidth: 2, borderBottomColor: tc.color, marginBottom: s.md, paddingBottom: s.sm }}>
        <Text style={{ fontSize: t.xs, color: tc.color, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' }}>
          {date.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
        </Text>
      </View>
      {/* Type */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.md }}>
        <View style={{ flexDirection:'row', gap: s.sm }}>
          {EVENT_TYPES.map(tp => (
            <TouchableOpacity key={tp.key}
              style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:r.full, borderWidth:1, borderColor: type===tp.key ? tp.color : c.border, backgroundColor: type===tp.key ? tp.color+'18' : 'transparent' }}
              onPress={() => setType(tp.key)}>
              <Ionicons name={tp.icon} size={12} color={type===tp.key ? tp.color : c.text4} />
              <Text style={{ fontSize:11, color: type===tp.key ? tp.color : c.text4, fontWeight: type===tp.key ? '700' : '400' }}>{tp.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TextInput style={[fS.input, { color:c.text1, borderBottomColor:c.border }]}
        value={title} onChangeText={setTitle}
        placeholder={type==='task' ? 'What needs to get done?' : type==='focus' ? "Today's main focus..." : type==='note' ? 'Quick note...' : type==='reminder' ? 'Remind me to...' : 'Event title...'}
        placeholderTextColor={c.text4} autoFocus />
      <TextInput style={[fS.input, { color:c.text2, borderBottomColor:c.border, minHeight:40 }]}
        value={desc} onChangeText={setDesc} placeholder="Notes (optional)" placeholderTextColor={c.text4} multiline />
      <View style={{ flexDirection:'row', gap:s.sm, marginBottom:s.md, alignItems:'center' }}>
        <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', gap:4 }} onPress={() => setAllDay(!allDay)}>
          <Ionicons name={allDay ? 'checkbox' : 'square-outline'} size={18} color={allDay ? tc.color : c.text4} />
          <Text style={{ fontSize:t.xs, color: allDay ? tc.color : c.text3 }}>All day</Text>
        </TouchableOpacity>
        {!allDay && (
          <TextInput style={{ flex:1, borderBottomWidth:1, borderBottomColor:c.border, paddingVertical:4, fontSize:t.sm, color:c.text1 }}
            value={time} onChangeText={setTime} placeholder="Time (e.g. 14:30)" placeholderTextColor={c.text4} keyboardType="numbers-and-punctuation" />
        )}
      </View>
      {!allDay && (
        <View style={{ marginBottom:s.lg }}>
          <Text style={{ fontSize:10, color:c.text4, marginBottom:s.sm, textTransform:'uppercase', letterSpacing:1 }}>🔔 Remind me</Text>
          <View style={{ flexDirection:'row', gap:s.sm, flexWrap:'wrap' }}>
            {REMINDER_OPTS.map(opt => (
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
          style={{ backgroundColor:tc.color, borderRadius:r.md, paddingVertical:s.sm, paddingHorizontal:s.xl, opacity:(!title.trim()||saving)?0.5:1 }}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color:'#fff', fontWeight:'700', fontSize:t.sm }}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const fS = StyleSheet.create({
  input: { fontSize:14, paddingVertical:8, paddingHorizontal:2, borderBottomWidth:1, marginBottom:10 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CalendarModal({ visible, onClose, userId, initialDate, autoAdd, quickType }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const today  = new Date();
  const [anchor,  setAnchor]  = useState(initialDate || today);
  const [events,  setEvents]  = useState({});
  const [loading, setLoading] = useState(false);
  const [addDate, setAddDate] = useState(null);
  const [selectedPlannerArea, setSelectedPlannerArea] = useState(null);

  const weekDays  = getWeekDays(anchor);
  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  const isDark  = c.bg0 === '#0e0818';
  const paperBg = isDark ? '#1a1508' : '#fffef8';
  const lineClr = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const redLine = isDark ? '#e0585833' : '#e0585820';

  const loadWeek = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const cacheKey = `calendar_week_${userId}_${weekStart}_${weekEnd}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) setEvents(cached);

      if (!(await isOnline())) { setLoading(false); return; }

      const [evtRes, taskRes, focusRes, noteRes, plannerRes] = await Promise.all([
        supabase.from('calendar_events').select('*').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('tasks').select('id,title,due_date').eq('user_id', userId).eq('completed', false).gte('due_date', weekStart).lte('due_date', weekEnd),
        supabase.from('daily_focus').select('id,focus_text,focus_date').eq('user_id', userId).gte('focus_date', weekStart).lte('focus_date', weekEnd),
        supabase.from('captures').select('id,title,created_at').eq('user_id', userId).eq('status','inbox').gte('created_at', weekStart).lte('created_at', weekEnd+'T23:59:59'),
        supabase.from('agenda_instances').select('id,title,area,date,start_time').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd).eq('completed', false).eq('skipped', false),
      ]);
      const map = {};
      const push = (date, item) => { if (!map[date]) map[date]=[]; map[date].push(item); };
      (evtRes.data  ||[]).forEach(e  => push(e.date, {...e, _src:'calendar'}));
      (taskRes.data ||[]).forEach(tk => { if(tk.due_date) push(tk.due_date,{id:'task_'+tk.id, title:tk.title, type:'task', color:TYPE_COLORS.task, _src:'task'}); });
      (focusRes.data||[]).forEach(f  => push(f.focus_date, {id:'focus_'+f.id, title:f.focus_text, type:'focus', color:TYPE_COLORS.focus, _src:'focus'}));
      (noteRes.data ||[]).forEach(n  => { const d=n.created_at?.split('T')[0]; if(d) push(d,{id:'note_'+n.id, title:n.title||'Note', type:'note', color:TYPE_COLORS.note, _src:'note'}); });
      (plannerRes.data ||[]).forEach(item => {
        const area = PLANNER_AREAS[item.area] || { emoji: '•', color: c.teal };
        push(item.date, { ...item, type: 'planner', color: area.color, _src: 'planner', area: item.area, emoji: area.emoji, time: item.start_time });
      });
      setEvents(map);
      await cacheWrite(cacheKey, map);
    } catch(e) { console.warn('CalendarModal', e); }
    setLoading(false);
  }, [userId, weekStart, weekEnd, c.teal]);

  useEffect(() => { if (visible) loadWeek(); }, [visible, loadWeek]);

  // A caller (e.g. the floating action button's "New Reminder") can ask this
  // modal to open straight into the add sheet, pre-typed, instead of making
  // the user tap a day's + button first.
  useEffect(() => {
    if (visible && autoAdd) setAddDate(initialDate || new Date());
  }, [visible, autoAdd]);

  const prevWeek = () => { const d=new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); };
  const nextWeek = () => { const d=new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); };

  const deleteEvt = async (evt) => {
    if (evt._src !== 'calendar') return;
    await supabase.from('calendar_events').delete().eq('id', evt.id);
    await loadWeek();
  };

  const POPUP_W = Math.min(SW * 0.92, 420);
  const POPUP_H = Math.min(SH * 0.78, 600);
  const SPINE   = 28;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)' }} />
      </TouchableOpacity>

      {/* Notebook popup */}
      <View style={{ ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center' }} pointerEvents="box-none">
        <View style={{ width:POPUP_W, height:POPUP_H, backgroundColor:paperBg, borderRadius:8,
          flexDirection:'row', overflow:'hidden',
          shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.45, shadowRadius:24, elevation:20 }}>

          {/* Spine */}
          <View style={{ width:SPINE, backgroundColor:'#c9a84c18', alignItems:'center', paddingVertical:14, gap:12 }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <View key={i} style={{ width:12, height:12, borderRadius:6, backgroundColor:paperBg, borderWidth:1.5, borderColor:'#c9a84c55' }} />
            ))}
          </View>

          {/* Red margin */}
          <View style={{ position:'absolute', left:SPINE+10, top:0, bottom:0, width:1.5, backgroundColor:redLine }} />

          {/* Ruled lines */}
          {Array.from({length:18}).map((_,i) => (
            <View key={i} style={{ position:'absolute', left:SPINE+22, right:0, top:78+i*28, height:1, backgroundColor:lineClr }} />
          ))}

          {/* Content */}
          <View style={{ flex:1, paddingLeft:14 }}>
            {/* Header */}
            <View style={{ flexDirection:'row', alignItems:'center', paddingRight:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:lineClr }}>
              <TouchableOpacity onPress={prevWeek} style={{ padding:5 }}>
                <Ionicons name="chevron-back" size={16} color={c.text3} />
              </TouchableOpacity>
              <Text style={{ flex:1, textAlign:'center', fontSize:13, fontWeight:'700', color:c.text1 }}>
                {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
              </Text>
              <TouchableOpacity onPress={nextWeek} style={{ padding:5 }}>
                <Ionicons name="chevron-forward" size={16} color={c.text3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ padding:5 }}>
                <Ionicons name="close" size={16} color={c.text3} />
              </TouchableOpacity>
            </View>

            {/* Day cards scrollable */}
            {loading ? (
              <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                <ActivityIndicator color={c.teal} />
              </View>
            ) : (
              <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical:8, paddingRight:12, gap:6 }}>
                {weekDays.map((day, i) => {
                  const iso    = toISO(day);
                  const isToday = iso === toISO(today);
                  const dayEvs = events[iso] || [];
                  const plannerByArea = dayEvs.filter(evt => evt._src === 'planner').reduce((result, evt) => {
                    if (!result[evt.area]) result[evt.area] = [];
                    result[evt.area].push(evt);
                    return result;
                  }, {});
                  const activeArea = selectedPlannerArea?.date === iso ? selectedPlannerArea.area : null;
                  const visibleEvs = activeArea ? dayEvs.filter(evt => evt._src !== 'planner' || evt.area === activeArea) : dayEvs;
                  const dayColor = isToday ? c.teal : c.text3;

                  return (
                    <View key={i} style={{
                      backgroundColor: isToday ? c.teal+'0d' : 'transparent',
                      borderRadius: 8,
                      borderWidth: isToday ? 1 : 0.5,
                      borderColor: isToday ? c.teal+'55' : lineClr,
                      overflow: 'hidden',
                    }}>
                      {/* Day header row */}
                      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:10, paddingVertical:7, borderBottomWidth: dayEvs.length > 0 ? 0.5 : 0, borderBottomColor: lineClr }}>
                        {/* Date circle */}
                        <View style={{ width:32, height:32, borderRadius:16, backgroundColor: isToday ? c.teal : c.border+'44', alignItems:'center', justifyContent:'center', marginRight:10 }}>
                          <Text style={{ fontSize:13, fontWeight:'800', color: isToday ? '#fff' : c.text1 }}>
                            {day.getDate()}
                          </Text>
                        </View>
                        {/* Day name */}
                        <View style={{ flex:1 }}>
                          <Text style={{ fontSize:12, fontWeight:'700', color: dayColor }}>
                            {DAY_FULL[day.getDay()]}
                          </Text>
                          {dayEvs.length > 0 && (
                            <Text style={{ fontSize:9, color:c.text4, marginTop:1 }}>
                              {dayEvs.length} {dayEvs.length === 1 ? 'item' : 'items'}
                            </Text>
                          )}
                          {Object.keys(plannerByArea).length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {Object.entries(plannerByArea).map(([areaKey, items]) => {
                                const area = PLANNER_AREAS[areaKey] || { emoji: '•', color: c.teal };
                                const chosen = activeArea === areaKey;
                                return <TouchableOpacity key={areaKey} onPress={() => setSelectedPlannerArea(chosen ? null : { date: iso, area: areaKey })} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: area.color + '22', borderWidth: 1, borderColor: chosen ? area.color : area.color + '88', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`${items.length} ${areaKey} planner items`}>
                                  <Text style={{ fontSize: 12 }}>{area.emoji}</Text>
                                  {items.length > 1 && <View style={{ position: 'absolute', right: -4, top: -5, minWidth: 12, height: 12, paddingHorizontal: 2, borderRadius: 6, backgroundColor: area.color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}>{items.length}</Text></View>}
                                </TouchableOpacity>;
                              })}
                            </View>
                          )}
                        </View>
                        {/* Add button */}
                        <TouchableOpacity
                          onPress={() => setAddDate(new Date(iso + 'T12:00:00'))}
                          style={{ padding:5 }}
                        >
                          <Ionicons name="add-circle-outline" size={18} color={isToday ? c.teal : c.text4} />
                        </TouchableOpacity>
                      </View>

                      {/* Event pills inside the day card */}
                      {visibleEvs.length > 0 && (
                        <View style={{ paddingHorizontal:10, paddingVertical:6, gap:4 }}>
                          {visibleEvs.map((evt, j) => (
                            <View key={evt.id||j} style={{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:3 }}>
                              {/* Color dot */}
                              <View style={{ width:6, height:6, borderRadius:3, backgroundColor:evt.color||c.teal, flexShrink:0 }} />
                              {/* Title + time */}
                              <View style={{ flex:1 }}>
                                <Text style={{ fontSize:11, fontWeight:'600', color:c.text1 }} numberOfLines={1}>
                                  {evt.title}
                                </Text>
                                <View style={{ flexDirection:'row', gap:6, marginTop:1 }}>
                                  {evt.time && <Text style={{ fontSize:9, color:c.teal }}>{fmt12(evt.time)}</Text>}
                                  <Text style={{ fontSize:9, color:evt.color||c.teal, textTransform:'uppercase', letterSpacing:0.3 }}>{evt.type}</Text>
                                  {evt._src !== 'calendar' && <Text style={{ fontSize:9, color:c.text4, fontStyle:'italic' }}>· {evt._src}</Text>}
                                  {evt.reminder_min && <Text style={{ fontSize:9, color:c.gold }}>🔔</Text>}
                                </View>
                              </View>
                              {/* Delete (calendar events only) */}
                              {evt._src === 'calendar' && (
                                <TouchableOpacity onPress={() => deleteEvt(evt)} style={{ padding:3 }}>
                                  <Ionicons name="close-circle-outline" size={14} color={c.text4} />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
                <View style={{ height: 8 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {/* Add sheet */}
      <Modal visible={!!addDate} transparent animationType="slide" onRequestClose={() => setAddDate(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:20, borderTopRightRadius:20, paddingBottom:40, maxHeight:SH*0.85 }}>
              <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.border, alignSelf:'center', marginTop:10, marginBottom:6 }} />
              {addDate && (
                <AddEventForm
                  date={addDate} userId={userId}
                  c={c} t={t} s={s} r={r}
                  initialType={quickType}
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
