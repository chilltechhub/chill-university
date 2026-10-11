// src/components/CalendarModal.js
// Notebook-style center popup — 7 horizontal day cards stacked vertically

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { supabase } from '../api/profileScopedClient';
import { unscoped } from '../api/profileScopedClient';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { buildProfileLookup } from '../data/personas';
import useViewScope, { SCOPE_ALL } from '../logic/useViewScope';
import { cacheRead, cacheWrite, isOnline } from '../api/offlineCache';
import { dateStr } from '../logic/dateUtils';
import TimePickerField from './TimePickerField';
import PlanDetailSheet from './PlanDetailSheet';
import { byTime, timeRange } from '../logic/plannerLayout';
import { recordAction } from '../logic/gamificationService';

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
const DAY_PREVIEW = 5; // items a day card shows before "Show all"

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
  const { signalAction } = useAccess();
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
      // Something put on a day counts for a goal's "plan it" step, and a
      // focus for its "set a focus" step, the same as doing it from the
      // Planner or Home. The + button's New Reminder lands here.
      if (type === 'focus') signalAction('focus-set');
      else if (type !== 'task') signalAction('planner-item-added');
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
              <Text style={{ fontSize:11, color: type===tp.key ? tp.color : c.text3, fontWeight: type===tp.key ? '700' : '400' }}>{tp.label}</Text>
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
          <TimePickerField value={time} onChange={setTime} placeholder="Pick a time" style={{ flex:1, paddingVertical:8 }} />
        )}
      </View>
      {!allDay && (
        <View style={{ marginBottom:s.lg }}>
          <Text style={{ fontSize:11, color:c.text3, marginBottom:s.sm, textTransform:'uppercase', letterSpacing:1 }}>🔔 Remind me</Text>
          <View style={{ flexDirection:'row', gap:s.sm, flexWrap:'wrap' }}>
            {REMINDER_OPTS.map(opt => (
              <TouchableOpacity key={String(opt.value)}
                style={{ borderWidth:1, borderRadius:r.full, paddingHorizontal:10, paddingVertical:4, borderColor: reminder===opt.value ? c.teal : c.border, backgroundColor: reminder===opt.value ? (c.tealLight||c.bg2) : 'transparent' }}
                onPress={() => setReminder(opt.value)}>
                <Text style={{ fontSize:11, color: reminder===opt.value ? c.teal : c.text3 }}>{opt.label}</Text>
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
// `onEditPlan(row)` (optional) opens a planner item in the Planner's editor;
// the floating button's copy of this popup lives outside the navigator, so
// it has none and its planner items show no Edit button.
export default function CalendarModal({ visible, onClose, userId, initialDate, autoAdd, quickType, onEditPlan }) {
  const { colors: c, typography: t, spacing: s, radius: r, isDark } = useTheme();
  const today  = new Date();
  const [anchor,  setAnchor]  = useState(initialDate || today);
  const [events,  setEvents]  = useState({});
  const [loading, setLoading] = useState(false);
  const [addDate, setAddDate] = useState(null);
  const [selectedPlannerArea, setSelectedPlannerArea] = useState(null);
  // Tapping an item opens it: a planner item gets the Planner's own detail
  // sheet, anything else unfolds in place with its notes and actions.
  const [openKey,  setOpenKey]  = useState(null);
  const [openPlan, setOpenPlan] = useState(null);
  // A day shows its first few items; the rest behind "Show all". A week of
  // daily habits made every day card a wall of rows.
  const [openDays, setOpenDays] = useState(() => new Set());
  const scrollRef = useRef(null);
  const scrolledTo = useRef(null);
  useEffect(() => { if (!visible) scrolledTo.current = null; }, [visible]);

  // Draggable — the spine (the row of binding rings) is the handle, so
  // moving the popup uses the part that already reads as "grip this" rather
  // than adding a separate bar and disrupting the notebook layout. Same
  // gesture split as WidgetBoard.js / FloatingCard.js: pan runs on the JS
  // thread, the resulting position is still a Reanimated shared value so
  // the motion itself stays smooth.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragStart = useRef({ x: 0, y: 0 });
  useEffect(() => { if (visible) { dragX.value = 0; dragY.value = 0; } }, [visible]);
  const dragGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => { dragStart.current = { x: dragX.value, y: dragY.value }; })
    .onUpdate((e) => {
      dragX.value = dragStart.current.x + e.translationX;
      dragY.value = dragStart.current.y + e.translationY;
    })
    .onEnd(() => {
      dragX.value = withSpring(dragX.value, { damping: 22, stiffness: 220 });
      dragY.value = withSpring(dragY.value, { damping: 22, stiffness: 220 });
    });
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }],
  }));

  // Calendar defaults to showing every profile: a person has one actual day,
  // and the failure this view exists to prevent is double-booking your night
  // job against your startup. The planner list defaults the other way — see
  // useViewScope.js.
  const { showingAll, toggle: toggleScope } = useViewScope('calendar', SCOPE_ALL);
  const { profiles, active } = useProfiles();
  const profileLookup = React.useMemo(() => buildProfileLookup(profiles), [profiles]);

  const weekDays  = getWeekDays(anchor);
  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  const paperBg = isDark ? '#1a1508' : '#fffef8';
  const lineClr = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const redLine = isDark ? '#e0585833' : '#e0585820';

  const loadWeek = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    // Cache key includes the scope AND the active profile — otherwise
    // switching either one serves the previous view's rows from cache.
    const cacheKey = `calendar_week_${userId}_${weekStart}_${weekEnd}_${showingAll ? 'all' : active?.id || 'none'}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) setEvents(cached);

      if (!(await isOnline())) { setLoading(false); return; }

      // `unscoped` deliberately bypasses the per-profile filter for the
      // all-profiles view. Everything is still scoped to this user by RLS —
      // this only widens across the profiles they already own.
      const db = showingAll ? unscoped : supabase;

      const [evtRes, taskRes, focusRes, noteRes, plannerRes] = await Promise.all([
        db.from('calendar_events').select('*').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
        db.from('tasks').select('id,title,notes,due_date,due_time,profile_id').eq('user_id', userId).eq('completed', false).gte('due_date', weekStart).lte('due_date', weekEnd),
        db.from('daily_focus').select('id,focus_text,focus_date,profile_id').eq('user_id', userId).gte('focus_date', weekStart).lte('focus_date', weekEnd),
        db.from('captures').select('id,title,created_at,profile_id').eq('user_id', userId).eq('status','inbox').gte('created_at', weekStart).lte('created_at', weekEnd+'T23:59:59'),
        db.from('agenda_instances').select('*').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd).eq('completed', false).eq('skipped', false),
      ]);
      const map = {};
      const push = (date, item) => { if (!map[date]) map[date]=[]; map[date].push(item); };
      (evtRes.data  ||[]).forEach(e  => push(e.date, {...e, _src:'calendar', _profile:e.profile_id}));
      (taskRes.data ||[]).forEach(tk => { if(tk.due_date) push(tk.due_date,{id:'task_'+tk.id, title:tk.title, description:tk.notes, time:tk.due_time, type:'task', color:TYPE_COLORS.task, _src:'task', _profile:tk.profile_id, raw:tk}); });
      (focusRes.data||[]).forEach(f  => push(f.focus_date, {id:'focus_'+f.id, title:f.focus_text, type:'focus', color:TYPE_COLORS.focus, _src:'focus', _profile:f.profile_id}));
      (noteRes.data ||[]).forEach(n  => { const d=n.created_at?.split('T')[0]; if(d) push(d,{id:'note_'+n.id, title:n.title||'Note', type:'note', color:TYPE_COLORS.note, _src:'note', _profile:n.profile_id}); });
      (plannerRes.data ||[]).forEach(item => {
        const area = PLANNER_AREAS[item.area] || { emoji: '•', color: c.teal };
        push(item.date, { id: 'plan_' + item.id, title: item.title, type: 'planner', color: area.color, _src: 'planner', area: item.area, emoji: area.emoji, time: item.start_time, duration: item.duration_minutes, _profile: item.profile_id, raw: item });
      });
      // Each day in clock order, untimed last — rows used to come out in
      // whatever order the five sources happened to return.
      Object.values(map).forEach(list => list.sort(byTime));
      setEvents(map);
      await cacheWrite(cacheKey, map);
    } catch(e) { console.warn('CalendarModal', e); }
    setLoading(false);
  }, [userId, weekStart, weekEnd, c.teal, showingAll, active?.id]);

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
    try {
      if (evt._src === 'calendar') await supabase.from('calendar_events').delete().eq('id', evt.id);
      else if (evt._src === 'task') await supabase.from('tasks').delete().eq('id', evt.raw.id);
    } catch (e) { Alert.alert("Couldn't delete that", 'Something went wrong — try again.'); }
    setOpenKey(null);
    await loadWeek();
  };
  const completeTaskEvt = async (evt) => {
    try { await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', evt.raw.id); recordAction('task_done', evt.raw.id); }
    catch (e) { Alert.alert("Couldn't update that", 'Something went wrong — try again.'); }
    setOpenKey(null);
    await loadWeek();
  };
  const tapEvt = (evt) => {
    if (evt._src === 'planner') { setOpenPlan(evt.raw); return; }
    setOpenKey(k => (k === evt.id ? null : evt.id));
  };

  const SPINE   = 28;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop — lightened from the old 0.6 so the screen behind this
          stays visible while you're using it, same reasoning as
          FloatingCard.js's popups. Tapping it still closes. */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.18)' }} />
      </TouchableOpacity>

      {/* Notebook popup */}
      <View style={{ ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center' }} pointerEvents="box-none">
        {/* Sized as a PERCENTAGE of this wrapper, not a pixel value computed
            from useWindowDimensions/SW/SH — on Android specifically, a modal
            without a translucent status bar is only ever handed the screen
            area *below* the status bar to lay out in, which is shorter than
            the full window height those hooks report. A pixel height built
            from the wrong (taller) number could exceed what's actually
            available, and centering can't help — the box just gets pinned
            to the top with dead space below it (exactly what was reported).
            A percentage is resolved by the layout engine against this
            wrapper's REAL measured size, so the two numbers can never
            disagree, on Android or otherwise. */}
        <Animated.View style={[{ width:'92%', maxWidth:420, height:'78%', maxHeight:600, backgroundColor:paperBg, borderRadius:8,
          flexDirection:'row', overflow:'hidden',
          shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.45, shadowRadius:24, elevation:20 }, dragStyle]}>

          {/* Spine — also the drag handle. It already reads as "grip this"
              (a notebook's binding), so moving the popup reuses it instead
              of adding a separate bar that would clash with the layout. */}
          <GestureDetector gesture={dragGesture}>
            <View style={{ width:SPINE, backgroundColor:'#c9a84c18', alignItems:'center', paddingVertical:14, gap:12 }}>
              {[0,1,2,3,4,5,6,7].map(i => (
                <View key={i} style={{ width:12, height:12, borderRadius:6, backgroundColor:paperBg, borderWidth:1.5, borderColor:'#c9a84c55' }} />
              ))}
            </View>
          </GestureDetector>

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
              <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={prevWeek} style={{ padding:5 }}>
                <Ionicons name="chevron-back" size={16} color={c.text3} />
              </TouchableOpacity>
              <Text style={{ flex:1, textAlign:'center', fontSize:13, fontWeight:'700', color:c.text1 }}>
                {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
              </Text>
              <TouchableOpacity accessibilityLabel="Next" accessibilityRole="button" onPress={nextWeek} style={{ padding:5 }}>
                <Ionicons name="chevron-forward" size={16} color={c.text3} />
              </TouchableOpacity>
              {/* All-profiles toggle. Ownership never changes — this only
                  widens what's shown, so a clash between two jobs is visible
                  instead of hidden behind a profile switch. */}
              {profiles.length > 1 && (
                <TouchableOpacity
                  onPress={toggleScope}
                  style={{ flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:6, paddingVertical:3,
                           borderRadius:9, borderWidth:1,
                           borderColor: showingAll ? c.teal : c.border,
                           backgroundColor: showingAll ? c.teal + '18' : 'transparent' }}
                  accessibilityRole="button"
                  accessibilityLabel={showingAll ? 'Showing all profiles. Tap to show only this profile.' : 'Showing this profile only. Tap to show all profiles.'}
                >
                  <Ionicons name={showingAll ? 'layers' : 'person'} size={11} color={showingAll ? c.teal : c.text3} />
                  <Text style={{ fontSize:11, fontWeight:'800', color: showingAll ? c.teal : c.text3 }}>
                    {showingAll ? 'ALL' : 'THIS'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={{ padding:5 }}>
                <Ionicons name="close" size={16} color={c.text3} />
              </TouchableOpacity>
            </View>

            {/* Legend — only earns its space when actually showing a mix. */}
            {showingAll && profiles.length > 1 && (
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, paddingRight:12, paddingTop:6, paddingBottom:2 }}>
                {profiles.map(pr => {
                  const meta = profileLookup[pr.id];
                  if (!meta) return null;
                  return (
                    <View key={pr.id} style={{ flexDirection:'row', alignItems:'center', gap:3 }}>
                      <View style={{ width:7, height:7, borderRadius:4, backgroundColor: meta.color }} />
                      <Text style={{ fontSize:11, color:c.text3 }} numberOfLines={1}>{meta.name}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Day cards scrollable */}
            {loading ? (
              <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                <ActivityIndicator color={c.teal} />
              </View>
            ) : (
              <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical:8, paddingRight:12, gap:6 }}>
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
                  const filteredEvs = activeArea ? dayEvs.filter(evt => evt._src !== 'planner' || evt.area === activeArea) : dayEvs;
                  const dayOpen = openDays.has(iso);
                  const visibleEvs = dayOpen ? filteredEvs : filteredEvs.slice(0, DAY_PREVIEW);
                  const dayColor = isToday ? c.teal : c.text3;

                  return (
                    <View key={i}
                      // Open on today, not on Sunday: the week starts there
                      // and today could be five full day cards further down.
                      onLayout={isToday ? (e) => {
                        if (scrolledTo.current === iso) return;
                        scrolledTo.current = iso;
                        const y = e.nativeEvent.layout.y - 8;
                        setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false }), 0);
                      } : undefined}
                      style={{
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
                          <Text style={{ fontSize:13, fontWeight:'800', color: isToday ? c.onFill : c.text1 }}>
                            {day.getDate()}
                          </Text>
                        </View>
                        {/* Day name */}
                        <View style={{ flex:1 }}>
                          <Text style={{ fontSize:12, fontWeight:'700', color: dayColor }}>
                            {DAY_FULL[day.getDay()]}
                          </Text>
                          {dayEvs.length > 0 && (
                            <Text style={{ fontSize:11, color:c.text3, marginTop:1 }}>
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
                                  {items.length > 1 && <View style={{ position: 'absolute', right: -4, top: -5, minWidth: 12, height: 12, paddingHorizontal: 2, borderRadius: 6, backgroundColor: area.color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{items.length}</Text></View>}
                                </TouchableOpacity>;
                              })}
                            </View>
                          )}
                        </View>
                        {/* Add button */}
                        <TouchableOpacity accessibilityLabel="Add" accessibilityRole="button"
                          onPress={() => setAddDate(new Date(iso + 'T12:00:00'))}
                          style={{ padding:5 }}
                        >
                          <Ionicons name="add-circle-outline" size={18} color={isToday ? c.teal : c.text4} />
                        </TouchableOpacity>
                      </View>

                      {/* Items inside the day card: a time column, then the
                          title. Tap to open. */}
                      {visibleEvs.length > 0 && (
                        <View style={{ paddingHorizontal:8, paddingVertical:4 }}>
                          {visibleEvs.map((evt, j) => {
                            const open = openKey === evt.id;
                            const profile = showingAll && evt._profile ? profileLookup[evt._profile] : null;
                            const label = evt._src === 'planner' ? (evt.emoji ? `${evt.emoji} ` : '') + 'plan' : evt.type;
                            return (
                              <View key={evt.id||j} style={{ borderTopWidth: j ? 0.5 : 0, borderTopColor: lineClr }}>
                                <TouchableOpacity onPress={() => tapEvt(evt)} activeOpacity={0.7}
                                  accessibilityRole="button" accessibilityLabel={`${evt.title}${evt.time ? `, ${fmt12(evt.time)}` : ''}. Show details`}
                                  style={{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:7, paddingHorizontal:2 }}>
                                  <Text style={{ width:54, fontSize:11, fontWeight: evt.time ? '700' : '400', color: evt.time ? c.text2 : c.text3 }}>
                                    {evt.time ? fmt12(evt.time) : 'Any time'}
                                  </Text>
                                  {/* In all-profiles mode the marker becomes the
                                      PROFILE's colour, not the item type's —
                                      "whose is this" is the question this view
                                      exists to answer. */}
                                  <View style={{ width:3, alignSelf:'stretch', borderRadius:2, backgroundColor: profile ? profile.color : (evt.color||c.teal), flexShrink:0 }} />
                                  <View style={{ flex:1 }}>
                                    <Text style={{ fontSize:12, fontWeight:'600', color:c.text1 }} numberOfLines={open ? 0 : 2}>
                                      {evt.title}
                                    </Text>
                                    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:1 }}>
                                      <Text style={{ fontSize:11, color:c.text3, textTransform:'uppercase', letterSpacing:0.3 }}>{label}</Text>
                                      {!!profile && (
                                        <Text style={{ fontSize:11, fontWeight:'700', color: profile.color }} numberOfLines={1}>· {profile.name}</Text>
                                      )}
                                      {evt.reminder_min ? <Ionicons name="notifications-outline" size={11} color={c.text3} /> : null}
                                    </View>
                                  </View>
                                  <Ionicons name={evt._src === 'planner' ? 'chevron-forward' : open ? 'chevron-up' : 'chevron-down'} size={13} color={c.text4} />
                                </TouchableOpacity>

                                {open && (
                                  <View style={{ paddingLeft:64, paddingRight:4, paddingBottom:8, gap:6 }}>
                                    {evt.time && (
                                      <Text style={{ fontSize:11, color:c.text2 }}>
                                        {evt.all_day ? 'All day' : timeRange(evt.time, evt.duration)}
                                        {evt.reminder_min ? `  ·  reminder ${evt.reminder_min >= 60 ? `${evt.reminder_min / 60}h` : `${evt.reminder_min} min`} before` : ''}
                                      </Text>
                                    )}
                                    {!!evt.description && <Text style={{ fontSize:12, color:c.text1, lineHeight:17 }}>{evt.description}</Text>}
                                    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                                      {evt._src === 'task' && (
                                        <TouchableOpacity onPress={() => completeTaskEvt(evt)} accessibilityRole="button"
                                          style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:r.md, backgroundColor: TYPE_COLORS.task }}>
                                          <Ionicons name="checkmark" size={12} color={c.onFill} />
                                          <Text style={{ fontSize:11, fontWeight:'700', color:c.onFill }}>Done</Text>
                                        </TouchableOpacity>
                                      )}
                                      {(evt._src === 'calendar' || evt._src === 'task') && (
                                        <TouchableOpacity onPress={() => deleteEvt(evt)} accessibilityRole="button"
                                          style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:r.md, borderWidth:1, borderColor:(c.error||'#e05858')+'88' }}>
                                          <Ionicons name="trash-outline" size={12} color={c.error||'#e05858'} />
                                          <Text style={{ fontSize:11, fontWeight:'700', color:c.error||'#e05858' }}>Delete</Text>
                                        </TouchableOpacity>
                                      )}
                                      {evt._src === 'note' && <Text style={{ fontSize:11, color:c.text3 }}>In your Capture Inbox.</Text>}
                                      {evt._src === 'focus' && <Text style={{ fontSize:11, color:c.text3 }}>This day's focus. Change it on Home.</Text>}
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                          {filteredEvs.length > DAY_PREVIEW && (
                            <TouchableOpacity accessibilityRole="button"
                              onPress={() => setOpenDays(prev => { const n = new Set(prev); n.has(iso) ? n.delete(iso) : n.add(iso); return n; })}
                              style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:4, paddingVertical:6, borderTopWidth:0.5, borderTopColor:lineClr }}>
                              <Text style={{ fontSize:11, fontWeight:'700', color:c.teal }}>
                                {dayOpen ? 'Show fewer' : `Show all ${filteredEvs.length}`}
                              </Text>
                              <Ionicons name={dayOpen ? 'chevron-up' : 'chevron-down'} size={12} color={c.teal} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
                <View style={{ height: 8 }} />
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </View>

      {/* A planner item, tapped open */}
      <PlanDetailSheet
        instance={openPlan}
        onClose={() => setOpenPlan(null)}
        onChanged={loadWeek}
        onEdit={onEditPlan ? (row) => { onClose(); onEditPlan(row); } : null}
      />

      {/* Add sheet */}
      <Modal visible={!!addDate} transparent animationType="slide" onRequestClose={() => setAddDate(null)} statusBarTranslucent>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:20, borderTopRightRadius:20, paddingBottom:40, maxHeight:'85%' }}>
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
