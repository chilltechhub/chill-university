// src/screens/PlannerScreen.js
// Full agenda/planner — time-based + list view, full CRUD, reminders, sync

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
  Dimensions, TextInput, Modal, KeyboardAvoidingView,
  Platform, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { supabase } from '../api/supabaseClient';
import {
  AREAS, getInstances, getPresetComponents,
  getUserSubscriptions, generateInstances,
  completeInstance, skipInstance, rescheduleInstance, addNoteToInstance,
} from '../api/plannerService';
import { schedulePlanReminder, cancelPlanReminder, hasScheduledReminder } from '../logic/planReminderActions';
import DailyCheckin from '../components/DailyCheckin';
import TourSpot from '../components/TourSpot';
import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from '../data/classCatalog';
import { getEnabledGames, getGame } from '../services/gameRegistry';
import { dateStr } from '../logic/dateUtils';

const { width: SW } = Dimensions.get('window');
const PANEL_W      = Math.min(SW * 0.82, 370);
const VIEWS        = ['Daily', 'Weekly', 'Monthly'];
const HOUR_H       = 64; // px per hour in time view
const DAY_START    = 6;  // 6am
const DAY_END      = 22; // 10pm

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toISO(d) { return dateStr(d); } // local calendar, not UTC
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getWeekDays(anchor) {
  const base = new Date(anchor);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(base, i));
}
function fmt12(t24) {
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function timeToY(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return (h - DAY_START + m / 60) * HOUR_H;
}
function isOverdue(instance) {
  if (instance.completed || instance.skipped) return false;
  const today = toISO(new Date());
  return instance.date < today;
}

// ─── Compact calendar — used by InstanceModal to pick a date ─────────────────
function MiniCalendar({ value, onChange, color, c, t, s, r }) {
  const [viewMonth, setViewMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayIso = toISO(new Date());
  const selIso   = toISO(value);

  return (
    <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: color + '44' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.sm }}>
        <TouchableOpacity onPress={() => setViewMonth(new Date(year, month - 1, 1))} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={16} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => setViewMonth(new Date(year, month + 1, 1))} style={{ padding: 4 }}>
          <Ionicons name="chevron-forward" size={16} color={color} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: c.text4 }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso     = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSel   = iso === selIso;
          const isToday = iso === todayIso;
          return (
            <TouchableOpacity key={day} onPress={() => onChange(new Date(year, month, day))}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isSel ? color : 'transparent',
                borderWidth: isToday && !isSel ? 1 : 0, borderColor: color,
              }}>
                <Text style={{ fontSize: 12, fontWeight: isSel ? '800' : '500', color: isSel ? '#fff' : isToday ? color : c.text1 }}>{day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={() => { setViewMonth(new Date()); onChange(new Date()); }} style={{ marginTop: s.sm, alignSelf: 'center', padding: 4 }}>
        <Text style={{ fontSize: 11, color, fontWeight: '700' }}>Today</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Add / Edit instance modal ────────────────────────────────────────────────
function InstanceModal({ visible, instance, userId, date, onSave, onDelete, onClose, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  const [title,       setTitle]       = useState('');
  const [area,        setArea]        = useState('physical');
  const [cadence,     setCadence]     = useState('daily');
  const [selectedDate,setSelectedDate]= useState(new Date());
  const [showCal,     setShowCal]     = useState(false);
  const [timeVal,     setTimeVal]     = useState('');
  const [duration,    setDuration]    = useState('');
  const [notes,       setNotes]       = useState('');
  const [reminder,    setReminder]    = useState(false);
  const [reminderMin, setReminderMin] = useState(15);
  const [saving,      setSaving]      = useState(false);
  // Link to Class / Project / Game — see supabase/migrations/20260905150000_planner_links.sql.
  // linkScreen carries a ClassesStack screen name for 'class' or a
  // gameRegistry id for 'game'; linkId carries a projects.id for 'project'.
  // Only one of the two is ever meaningful, matching the columns' own split.
  const [linkType,    setLinkType]    = useState(null);
  const [linkScreen,  setLinkScreen]  = useState(null);
  const [linkId,      setLinkId]      = useState(null);
  const [linkLabel,   setLinkLabel]   = useState('');
  const [linkSubject, setLinkSubject] = useState(null); // class-picker browsing state only
  const [projects,       setProjects]       = useState(null); // null = not fetched yet
  const [loadingProjects, setLoadingProjects] = useState(false);
  const isEdit = !!instance;

  useEffect(() => {
    setShowCal(false);
    if (instance) {
      setTitle(instance.title || '');
      setArea(instance.area || 'physical');
      setCadence(instance.cadence || 'daily');
      setSelectedDate(instance.date ? new Date(instance.date + 'T00:00:00') : new Date());
      setTimeVal(instance.start_time || '');
      setDuration(instance.duration_minutes ? String(instance.duration_minutes) : '');
      setNotes(instance.notes || '');
      setReminder(false); // corrected right after, once the id-map lookup below resolves
      hasScheduledReminder(instance.id).then(setReminder);

      // Resolve a display label for whatever's already linked, if anything.
      setLinkType(instance.link_type || null);
      setLinkScreen(instance.link_screen || null);
      setLinkId(instance.link_id || null);
      setLinkSubject(null);
      if (instance.link_type === 'class') {
        const found = Object.entries(CLASS_SCREEN_MAP).find(([, screen]) => screen === instance.link_screen);
        setLinkLabel(found ? found[0] : (instance.link_screen || ''));
      } else if (instance.link_type === 'game') {
        setLinkLabel(getGame(instance.link_screen)?.name || instance.link_screen || '');
      } else if (instance.link_type === 'project' && instance.link_id) {
        setLinkLabel('');
        supabase.from('projects').select('title').eq('id', instance.link_id).maybeSingle()
          .then(({ data }) => { if (data) setLinkLabel(data.title); });
      } else {
        setLinkLabel('');
      }
    } else {
      setTitle(''); setArea('physical'); setCadence('daily');
      setSelectedDate(date ? new Date(date + 'T00:00:00') : new Date());
      setTimeVal(''); setDuration(''); setNotes(''); setReminder(false);
      setLinkType(null); setLinkScreen(null); setLinkId(null); setLinkLabel(''); setLinkSubject(null);
      setProjects(null);
    }
  }, [instance, visible, date]);

  // Lazy-load the user's open projects the first time the Project link tab
  // is opened, instead of fetching on every modal open regardless of need.
  useEffect(() => {
    if (linkType === 'project' && projects === null && userId) {
      setLoadingProjects(true);
      supabase.from('projects').select('id,title,next_action,status')
        .eq('user_id', userId).is('deleted_at', null).neq('status', 'completed')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error) setProjects(data || []);
          setLoadingProjects(false);
        });
    }
  }, [linkType]);

  const clearLink = () => { setLinkScreen(null); setLinkId(null); setLinkLabel(''); setLinkSubject(null); };
  const pickClass = (label) => {
    setLinkScreen(CLASS_SCREEN_MAP[label] || null);
    setLinkId(null);
    setLinkLabel(label);
    if (!title.trim()) setTitle(`Study: ${label}`);
  };
  const pickProject = (p) => {
    setLinkId(p.id);
    setLinkScreen(null);
    setLinkLabel(p.title);
    if (!title.trim()) setTitle(p.next_action || p.title);
  };
  const pickGame = (g) => {
    setLinkScreen(g.id);
    setLinkId(null);
    setLinkLabel(g.name);
    if (!title.trim()) setTitle(`Practice: ${g.name}`);
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const basePayload = {
        user_id:          userId,
        title:            title.trim(),
        area,
        cadence,
        type:             'checklist',
        date:             toISO(selectedDate),
        start_time:       timeVal || null,
        duration_minutes: duration ? parseInt(duration) : null,
        notes:            notes || null,
        completed:        false,
        skipped:          false,
      };
      const linkFields = {
        link_type:   linkType || null,
        link_screen: (linkType === 'class' || linkType === 'game') ? linkScreen : null,
        link_id:     linkType === 'project' ? linkId : null,
      };

      const writeRow = (payload) => isEdit
        ? supabase.from('agenda_instances').update(payload).eq('id', instance.id).select().single()
        : supabase.from('agenda_instances').insert(payload).select().single();

      let saved;
      let { data, error } = await writeRow({ ...basePayload, ...linkFields });
      if (error) {
        // supabase/migrations/20260905150000_planner_links.sql hasn't been
        // run yet on this database — the link_type/link_screen/link_id
        // columns don't exist. Rather than blocking Add/Edit entirely until
        // the user applies it, retry once without them so everything else
        // still works; the link itself is just silently dropped this once.
        const missingLinkColumns = error.code === 'PGRST204'
          || /link_type|link_screen|link_id/i.test(error.message || '');
        if (!missingLinkColumns) throw error;
        console.warn('planner link columns missing — retrying without them; run the migration to enable links', error);
        ({ data, error } = await writeRow(basePayload));
        if (error) throw error;
      }
      saved = data;

      // Sync to other tables
      if (area === 'professional' && !isEdit) {
        const { error } = await supabase.from('tasks').insert({ user_id: userId, title: title.trim(), due_date: basePayload.date, category: 'professional', priority: 2 });
        if (error) throw error;
      }
      if (area === 'mental' && title.toLowerCase().includes('focus')) {
        const { error } = await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: title.trim(), focus_date: basePayload.date });
        if (error) throw error;
      }

      // Schedule (or cancel) the reminder. Its notification id lives in a
      // local id map, not this row — see planReminderActions.js — so this
      // never touches (and can't clobber) whatever the user actually typed
      // in Notes above.
      if (reminder && timeVal && saved) {
        await schedulePlanReminder(saved, reminderMin);
      } else if (saved) {
        await cancelPlanReminder(saved.id);
      }

      onSave(saved);
    } catch (e) {
      console.warn('InstanceModal save', e);
      Alert.alert("Couldn't save", e?.message || 'Something went wrong — try again.');
    }
    setSaving(false);
  };

  const deleteInstance = () => {
    Alert.alert('Remove', 'Remove this item from your agenda?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await cancelPlanReminder(instance.id);
        await supabase.from('agenda_instances').delete().eq('id', instance.id);
        onDelete(instance.id);
      }},
    ]);
  };

  const areaColor = AREAS[area]?.color || c.teal;
  const REMINDER_OPTS = [
    { label: '5 min', val: 5 }, { label: '15 min', val: 15 },
    { label: '30 min', val: 30 }, { label: '1 hour', val: 60 },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '90%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10, marginBottom: s.lg }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, marginBottom: s.lg }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>
              {isEdit ? 'Edit Item' : 'Add to Agenda'}
            </Text>
            {isEdit && (
              <TouchableOpacity onPress={deleteInstance} style={{ padding: s.sm, marginRight: s.sm }}>
                <Ionicons name="trash-outline" size={18} color={c.error || '#e05858'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={{ padding: s.sm }}>
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: s.lg, gap: s.md, paddingBottom: s.xl }}>
            {/* Title */}
            <TextInput
              style={{ borderWidth: 1, borderColor: areaColor, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.bg0 }}
              value={title} onChangeText={setTitle}
              placeholder="What are you scheduling?" placeholderTextColor={c.text4}
              autoFocus={!isEdit}
            />

            {/* Date */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Date</Text>
              <TouchableOpacity onPress={() => setShowCal(v => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, backgroundColor: c.bg0 }}>
                <Ionicons name="calendar-outline" size={16} color={areaColor} />
                <Text style={{ flex: 1, fontSize: t.sm, color: c.text1, fontWeight: t.medium }}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name={showCal ? 'chevron-up' : 'chevron-down'} size={14} color={c.text4} />
              </TouchableOpacity>
              {showCal && (
                <View style={{ marginTop: s.sm }}>
                  <MiniCalendar value={selectedDate} onChange={(d) => { setSelectedDate(d); setShowCal(false); }}
                    color={areaColor} c={c} t={t} s={s} r={r} />
                </View>
              )}
            </View>

            {/* Area picker */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Life Area</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: s.sm }}>
                  {Object.entries(AREAS).map(([key, ar]) => (
                    <TouchableOpacity key={key} onPress={() => setArea(key)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: s.sm, paddingVertical: 6, borderRadius: r.full, borderWidth: 1, borderColor: area === key ? ar.color : c.border, backgroundColor: area === key ? ar.color + '22' : 'transparent' }}>
                      <Text style={{ fontSize: 13 }}>{ar.emoji}</Text>
                      <Text style={{ fontSize: t.xs, color: area === key ? ar.color : c.text3, fontWeight: area === key ? t.bold : t.regular }}>{ar.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Cadence */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Repeats</Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                {['once','daily','weekly','monthly'].map(cad => (
                  <TouchableOpacity key={cad} onPress={() => setCadence(cad)}
                    style={{ flex: 1, padding: s.sm, borderRadius: r.md, borderWidth: 1, alignItems: 'center', borderColor: cadence === cad ? areaColor : c.border, backgroundColor: cadence === cad ? areaColor + '22' : 'transparent' }}>
                    <Text style={{ fontSize: t.xs, color: cadence === cad ? areaColor : c.text3, fontWeight: cadence === cad ? t.bold : t.regular, textTransform: 'capitalize' }}>{cad}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Link to Class / Project / Game */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Link to (optional)</Text>
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                {[
                  { key: null,      label: 'None',    icon: 'close-outline' },
                  { key: 'class',   label: 'Class',   icon: 'school-outline' },
                  { key: 'project', label: 'Project', icon: 'hammer-outline' },
                  { key: 'game',    label: 'Game',    icon: 'game-controller-outline' },
                ].map(opt => (
                  <TouchableOpacity key={opt.label} onPress={() => { setLinkType(opt.key); clearLink(); }}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: s.sm, borderRadius: r.md, borderWidth: 1, borderColor: linkType === opt.key ? areaColor : c.border, backgroundColor: linkType === opt.key ? areaColor + '22' : 'transparent' }}>
                    <Ionicons name={opt.icon} size={13} color={linkType === opt.key ? areaColor : c.text3} />
                    <Text style={{ fontSize: t.xs, color: linkType === opt.key ? areaColor : c.text3, fontWeight: linkType === opt.key ? t.bold : t.regular }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {linkType && linkLabel ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: areaColor + '15', borderRadius: r.md, padding: s.sm }}>
                  <Ionicons name="link-outline" size={13} color={areaColor} />
                  <Text style={{ flex: 1, fontSize: t.xs, color: areaColor, fontWeight: t.semibold }} numberOfLines={1}>{linkLabel}</Text>
                  <TouchableOpacity onPress={clearLink}>
                    <Ionicons name="close-circle" size={15} color={areaColor} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {linkType === 'class' && !linkLabel && (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: s.sm }}>
                      {CLASS_SUBJECTS.filter(sub => sub.children).map(sub => (
                        <TouchableOpacity key={sub.title} onPress={() => setLinkSubject(linkSubject === sub.title ? null : sub.title)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: linkSubject === sub.title ? sub.color : c.border, backgroundColor: linkSubject === sub.title ? sub.color + '22' : 'transparent' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: linkSubject === sub.title ? sub.color : c.text3 }}>{sub.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {linkSubject && (
                    <View style={{ marginTop: s.sm, gap: 6 }}>
                      {CLASS_SUBJECTS.find(sub => sub.title === linkSubject)?.children.map(ch => (
                        <TouchableOpacity key={ch.label} onPress={() => pickClass(ch.label)}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: s.sm, borderRadius: r.sm, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
                          <Text style={{ fontSize: t.xs, color: c.text1 }}>{ch.label}</Text>
                          <Ionicons name="chevron-forward" size={13} color={c.text4} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {linkType === 'project' && !linkLabel && (
                loadingProjects ? <ActivityIndicator color={areaColor} style={{ marginTop: s.sm }} /> :
                !projects || projects.length === 0 ? (
                  <Text style={{ fontSize: t.xs, color: c.text4, marginTop: s.sm }}>No open projects in the Workshop yet.</Text>
                ) : (
                  <View style={{ gap: 6, marginTop: s.sm }}>
                    {projects.map(p => (
                      <TouchableOpacity key={p.id} onPress={() => pickProject(p)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: s.sm, borderRadius: r.sm, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
                        <Text style={{ flex: 1, fontSize: t.xs, color: c.text1 }} numberOfLines={1}>{p.title}</Text>
                        <Ionicons name="chevron-forward" size={13} color={c.text4} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              )}

              {linkType === 'game' && !linkLabel && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: s.sm }}>
                  {getEnabledGames().map(g => (
                    <TouchableOpacity key={g.id} onPress={() => pickGame(g)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0 }}>
                      <Text style={{ fontSize: 11 }}>{g.icon}</Text>
                      <Text style={{ fontSize: 10, color: c.text3, fontWeight: '600' }}>{g.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Time + duration */}
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Time</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0 }}
                  value={timeVal} onChangeText={setTimeVal}
                  placeholder="e.g. 08:00" placeholderTextColor={c.text4}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Duration (min)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0 }}
                  value={duration} onChangeText={setDuration}
                  placeholder="e.g. 30" placeholderTextColor={c.text4}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Reminder */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: reminder ? s.sm : 0 }}>
                <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1 }}>{showEmojis ? '🔔 ' : ''}Reminder</Text>
                <Switch value={reminder} onValueChange={setReminder}
                  trackColor={{ false: c.bg2, true: areaColor + '88' }}
                  thumbColor={reminder ? areaColor : c.text4} />
              </View>
              {reminder && (
                <View style={{ flexDirection: 'row', gap: s.sm }}>
                  {REMINDER_OPTS.map(opt => (
                    <TouchableOpacity key={opt.val} onPress={() => setReminderMin(opt.val)}
                      style={{ flex: 1, padding: s.sm, borderRadius: r.md, borderWidth: 1, alignItems: 'center', borderColor: reminderMin === opt.val ? areaColor : c.border, backgroundColor: reminderMin === opt.val ? areaColor + '22' : 'transparent' }}>
                      <Text style={{ fontSize: t.xs, color: reminderMin === opt.val ? areaColor : c.text3 }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Notes</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, minHeight: 60, textAlignVertical: 'top' }}
                value={notes} onChangeText={setNotes}
                placeholder="Optional notes..." placeholderTextColor={c.text4}
                multiline
              />
            </View>

            {/* Save */}
            <TouchableOpacity onPress={save} disabled={!title.trim() || saving}
              style={{ backgroundColor: areaColor, borderRadius: r.md, padding: s.lg, alignItems: 'center', opacity: (!title.trim() || saving) ? 0.5 : 1 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>{isEdit ? 'Save Changes' : 'Add to Agenda'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Agenda item row ──────────────────────────────────────────────────────────
function AgendaRow({ instance, onUpdate, onEdit, navigation, c, t, s, r }) {
  const [expanded, setExpanded] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const area     = AREAS[instance.area] || AREAS.physical;
  const overdue  = isOverdue(instance);
  const done     = instance.completed;
  const skipped  = instance.skipped;

  const handle = async (fn) => {
    setSaving(true);
    try { const updated = await fn(instance.id); if (onUpdate) onUpdate(updated); }
    catch (e) {
      console.warn('AgendaRow', e);
      Alert.alert("Couldn't update that", 'Something went wrong — try again.');
    }
    setSaving(false);
  };

  // Jump to whatever this item is linked to (Class topic / Workshop project /
  // Training game) — see supabase/migrations/20260905150000_planner_links.sql.
  // Projects link by id, so this needs a fresh fetch (the project's own
  // title/status can have changed since the item was linked); class and game
  // links carry their destination directly, no lookup needed.
  const openLink = async () => {
    if (!instance.link_type || !navigation) return;
    try {
      if (instance.link_type === 'class' && instance.link_screen) {
        navigation.navigate('ClassesStack', { screen: instance.link_screen });
      } else if (instance.link_type === 'game' && instance.link_screen) {
        navigation.navigate('Play', { gameId: instance.link_screen });
      } else if (instance.link_type === 'project' && instance.link_id) {
        const { data, error } = await supabase.from('projects').select('*').eq('id', instance.link_id).maybeSingle();
        if (error || !data) { Alert.alert('Not found', "That project isn't there anymore."); return; }
        navigation.navigate('ProjectDetail', { project: data });
      }
    } catch (e) {
      console.warn('openLink', e);
      Alert.alert("Couldn't open that", 'Something went wrong — try again.');
    }
  };
  const linkLabel = instance.link_type === 'class' ? 'Open Class'
    : instance.link_type === 'project' ? 'Open Project'
    : instance.link_type === 'game' ? 'Open Game' : null;

  return (
    <View style={{
      borderRadius: r.md, marginBottom: s.sm,
      backgroundColor: c.bg1, borderWidth: 0.5,
      borderColor: overdue ? '#e05858' : done ? c.border : area.color + '55',
      borderLeftWidth: 3, borderLeftColor: overdue ? '#e05858' : area.color,
      opacity: skipped ? 0.4 : 1,
    }}>
      {/* Main row */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm }}
        onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        {/* Check circle */}
        <TouchableOpacity
          onPress={() => handle(() => completeInstance(instance.id, !done))}
          disabled={saving || skipped}
          style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: done ? area.color : c.border, backgroundColor: done ? area.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {saving ? <ActivityIndicator size="small" color={area.color} />
            : done ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.medium, color: done ? c.text4 : c.text1, textDecorationLine: done ? 'line-through' : 'none', flex: 1 }} numberOfLines={expanded ? 0 : 1}>
              {instance.title}
            </Text>
            {overdue && !done && (
              <View style={{ backgroundColor: '#e0585822', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 9, color: '#e05858', fontWeight: t.bold }}>MISSED</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: 2, alignItems: 'center' }}>
            <Text style={{ fontSize: 10 }}>{area.emoji}</Text>
            {instance.start_time && (
              <Text style={{ fontSize: t.xs, color: area.color, fontWeight: t.semibold }}>{fmt12(instance.start_time)}</Text>
            )}
            {instance.duration_minutes && (
              <Text style={{ fontSize: t.xs, color: c.text4 }}>· {instance.duration_minutes}m</Text>
            )}
            {instance.cadence && instance.cadence !== 'once' && (
              <Text style={{ fontSize: t.xs, color: c.text4 }}>· {instance.cadence}</Text>
            )}
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={c.text4} />
      </TouchableOpacity>

      {/* Missed-item quick actions — one tap, no need to expand first.
          Do Now = completeInstance, Move = rescheduleInstance (defaults to
          today), Drop = skipInstance; see plannerService.js. */}
      {overdue && !done && (
        <View style={{ flexDirection: 'row', gap: s.sm, paddingHorizontal: s.md, paddingBottom: s.md, flexWrap: 'wrap' }}>
          <ActionBtn label="Do Now" icon="checkmark-circle-outline" color={area.color}
            onPress={() => handle(() => completeInstance(instance.id, true))} />
          <ActionBtn label="Move" icon="calendar-outline" color={c.text3}
            onPress={() => handle(() => rescheduleInstance(instance.id))} />
          <ActionBtn label="Drop" icon="close-circle-outline" color="#e05858"
            onPress={() => handle(() => skipInstance(instance.id))} />
        </View>
      )}

      {/* Expanded actions */}
      {expanded && (
        <View style={{ paddingHorizontal: s.md, paddingBottom: s.md, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.sm, gap: s.sm }}>
          {instance.notes && !instance.notes.startsWith('notif:') && (
            <Text style={{ fontSize: t.xs, color: c.text3, lineHeight: 16 }}>{instance.notes}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: s.sm, flexWrap: 'wrap' }}>
            {!done && !skipped && (
              <ActionBtn label="Complete" icon="checkmark-circle-outline" color={area.color}
                onPress={() => handle(() => completeInstance(instance.id, true))} />
            )}
            {done && (
              <ActionBtn label="Undo" icon="refresh-outline" color={c.text4}
                onPress={() => handle(() => completeInstance(instance.id, false))} />
            )}
            {!done && !skipped && (
              <ActionBtn label="Skip" icon="play-skip-forward-outline" color={c.text4}
                onPress={() => handle(() => skipInstance(instance.id))} />
            )}
            <ActionBtn label="Edit" icon="pencil-outline" color={c.text3}
              onPress={() => onEdit(instance)} />
            {linkLabel && (
              <ActionBtn label={linkLabel} icon="open-outline" color={area.color} onPress={openLink} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function ActionBtn({ label, icon, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: color + '88', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={{ fontSize: 11, color, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Time-based daily view ────────────────────────────────────────────────────
function TimeView({ instances, onUpdate, onEdit, navigation, c, t, s, r }) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const timed   = instances.filter(i => i.start_time);
  const untimed = instances.filter(i => !i.start_time && !i.skipped);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Untimed items at top */}
      {untimed.length > 0 && (
        <View style={{ padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>No time set</Text>
          {untimed.map(inst => (
            <AgendaRow key={inst.id} instance={inst} onUpdate={onUpdate} onEdit={onEdit} navigation={navigation} c={c} t={t} s={s} r={r} />
          ))}
        </View>
      )}

      {/* Hour grid */}
      <View style={{ position: 'relative', paddingLeft: 56 }}>
        {hours.map(h => (
          <View key={h} style={{ height: HOUR_H, borderTopWidth: 0.5, borderTopColor: c.border }}>
            <Text style={{ position: 'absolute', left: -48, top: -8, fontSize: 10, color: c.text4, width: 44, textAlign: 'right' }}>
              {h % 12 || 12}{h < 12 ? 'am' : 'pm'}
            </Text>
          </View>
        ))}

        {/* Timed events overlaid */}
        {timed.map(inst => {
          const y = timeToY(inst.start_time);
          if (y === null || y < 0) return null;
          const h  = inst.duration_minutes ? (inst.duration_minutes / 60) * HOUR_H : HOUR_H * 0.75;
          const area = AREAS[inst.area] || AREAS.physical;
          return (
            <TouchableOpacity key={inst.id}
              onPress={() => onEdit(inst)}
              style={{ position: 'absolute', left: 0, right: s.lg, top: y, height: Math.max(h, 28), backgroundColor: area.color + (inst.completed ? '44' : '22'), borderLeftWidth: 3, borderLeftColor: area.color, borderRadius: r.sm, padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: t.bold, color: area.color, textDecorationLine: inst.completed ? 'line-through' : 'none' }} numberOfLines={1}>
                {inst.title}
              </Text>
              {inst.duration_minutes && (
                <Text style={{ fontSize: 9, color: area.color, opacity: 0.8 }}>
                  {fmt12(inst.start_time)} · {inst.duration_minutes}m
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Current time line */}
        <CurrentTimeLine c={c} />
      </View>
    </ScrollView>
  );
}

function CurrentTimeLine({ c }) {
  const now   = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const y     = (hours - DAY_START) * HOUR_H;
  if (y < 0 || y > (DAY_END - DAY_START) * HOUR_H) return null;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: y, flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#e05858' }} />
      <View style={{ flex: 1, height: 1.5, backgroundColor: '#e05858' }} />
    </View>
  );
}

// ─── List daily view ──────────────────────────────────────────────────────────
function ListView({ instances, onUpdate, onEdit, navigation, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  const overdue  = instances.filter(i => isOverdue(i));
  const today    = instances.filter(i => !isOverdue(i) && !i.skipped);
  const skipped  = instances.filter(i => i.skipped);

  const Section = ({ label, items, color }) => items.length === 0 ? null : (
    <View style={{ marginBottom: s.lg }}>
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: color || c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
        {label} · {items.filter(i => i.completed).length}/{items.length}
      </Text>
      {items.map(inst => (
        <AgendaRow key={inst.id} instance={inst} onUpdate={onUpdate} onEdit={onEdit} navigation={navigation} c={c} t={t} s={s} r={r} />
      ))}
    </View>
  );

  if (instances.length === 0) return (
    <View style={{ alignItems: 'center', paddingTop: 60 }}>
      {showEmojis ? <Text style={{ fontSize: 44, marginBottom: s.lg }}>📋</Text> : <Ionicons name="clipboard-outline" size={40} color={c.text3} style={{ marginBottom: s.lg }} />}
      <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Nothing scheduled</Text>
      <Text style={{ fontSize: t.sm, color: c.text3 }}>Tap + to add something</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      <Section label={showEmojis ? '⚠️ Missed' : 'Missed'} items={overdue} color="#e05858" />
      <Section label="Today" items={today} />
      <Section label="Skipped" items={skipped} />
    </ScrollView>
  );
}

// ─── Daily page ───────────────────────────────────────────────────────────────
function DailyPage({ userId, date, activeAreas, timeMode, onUpdate, onEdit, navigation, refreshKey, c, t, s, r }) {
  const [instances,  setInstances]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // activeAreas has to be a dependency here — load() reads it to filter the
  // fetched rows, so without it in the array, toggling a filter chip updates
  // the parent's state and re-renders this component with a new prop, but
  // never actually re-runs load() to apply it. The chip would visually
  // highlight while the list underneath stayed exactly as it was.
  useEffect(() => { load(); }, [date, refreshKey, activeAreas]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { date: toISO(date) });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      setInstances(data);
    } catch (e) { console.warn('DailyPage', e); }
    setLoading(false);
  };

  const handleUpdate = (updated) => {
    if (!updated) { load(); return; }
    setInstances(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const completed = instances.filter(i => i.completed).length;
  const total     = instances.filter(i => !i.skipped).length;

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  const sharedProps = { instances, onUpdate: handleUpdate, onEdit, navigation, c, t, s, r };

  return (
    <View style={{ flex: 1 }}>
      {/* Check-in + progress */}
      <View style={{ paddingHorizontal: s.lg, paddingTop: s.sm }}>
        <DailyCheckin userId={userId} date={toISO(date)} />
        {total > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
            <View style={{ flex: 1, height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: c.teal, width: `${(completed / total) * 100}%` }} />
            </View>
            <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.bold }}>{completed}/{total}</Text>
          </View>
        )}
      </View>
      {timeMode
        ? <TimeView {...sharedProps} />
        : <ListView {...sharedProps} />
      }
    </View>
  );
}

// ─── Weekly view ──────────────────────────────────────────────────────────────
function WeeklyView({ userId, anchor, activeAreas, onDayPress, refreshKey, c, t, s }) {
  const [byDate,  setByDate]  = useState({});
  const [loading, setLoading] = useState(true);
  const weekDays = getWeekDays(anchor);
  const today    = toISO(new Date());

  // Same missing-dependency bug as DailyPage — see its comment above.
  useEffect(() => { load(); }, [anchor, refreshKey, activeAreas]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { weekStart: toISO(weekDays[0]), weekEnd: toISO(weekDays[6]) });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      const map = {};
      data.forEach(inst => { if (!map[inst.date]) map[inst.date] = []; map[inst.date].push(inst); });
      setByDate(map);
    } catch (e) { console.warn('WeeklyView', e); }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  return (
    <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      {weekDays.map((day, i) => {
        const iso     = toISO(day);
        const items   = byDate[iso] || [];
        const isToday = iso === today;
        const done    = items.filter(i => i.completed).length;
        const missed  = items.filter(i => isOverdue(i)).length;
        return (
          <TouchableOpacity key={i} onPress={() => onDayPress(day)}
            style={{ backgroundColor: c.bg1, borderRadius: 12, marginBottom: s.sm, borderWidth: isToday ? 1.5 : 0.5, borderColor: isToday ? c.teal : missed > 0 ? '#e05858' : c.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isToday ? c.teal : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isToday ? '#fff' : c.text1 }}>{day.getDate()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: isToday ? c.teal : c.text1 }}>
                  {day.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <Text style={{ fontSize: t.xs, color: c.text4, marginTop: 1 }}>
                  {items.length} items · {done} done{missed > 0 ? ` · ${missed} missed` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={c.text4} />
            </View>
            {items.slice(0, 3).map((inst, j) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AREAS[inst.area]?.color || c.teal }} />
                <Text style={{ flex: 1, fontSize: t.xs, color: inst.completed ? c.text4 : c.text1, textDecorationLine: inst.completed ? 'line-through' : 'none' }} numberOfLines={1}>{inst.title}</Text>
                {inst.start_time && <Text style={{ fontSize: 9, color: c.text4 }}>{fmt12(inst.start_time)}</Text>}
              </View>
            ))}
            {items.length > 3 && (
              <Text style={{ fontSize: t.xs, color: c.text4, padding: s.sm, paddingLeft: s.md }}>+{items.length - 3} more</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Monthly view ─────────────────────────────────────────────────────────────
function MonthlyView({ userId, anchor, activeAreas, onDayPress, refreshKey, c, t, s }) {
  const [countByDate, setCount]   = useState({});
  const [doneByDate,  setDone]    = useState({});
  const [loading,     setLoading] = useState(true);
  const today        = toISO(new Date());
  const year         = anchor.getFullYear();
  const month        = anchor.getMonth();
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  // Same missing-dependency bug as DailyPage — see its comment above.
  useEffect(() => { load(); }, [anchor, refreshKey, activeAreas]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { month: month + 1, year });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      const cm = {}, dm = {};
      data.forEach(inst => {
        cm[inst.date] = (cm[inst.date] || 0) + 1;
        if (inst.completed) dm[inst.date] = (dm[inst.date] || 0) + 1;
      });
      setCount(cm); setDone(dm);
    } catch (e) { console.warn('MonthlyView', e); }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      <View style={{ flexDirection: 'row', marginBottom: s.sm }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: c.text4 }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso     = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count   = countByDate[iso] || 0;
          const done    = doneByDate[iso] || 0;
          const isToday = iso === today;
          const allDone = count > 0 && done === count;
          return (
            <TouchableOpacity key={day} onPress={() => onDayPress(new Date(year, month, day))}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isToday ? c.teal : 'transparent', borderWidth: count > 0 && !isToday ? 1 : 0, borderColor: allDone ? c.teal : c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: isToday ? '800' : '500', color: isToday ? '#fff' : allDone ? c.teal : c.text1 }}>{day}</Text>
              </View>
              {count > 0 && !allDone && (
                <View style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Side panel (add components) ─────────────────────────────────────────────
function SidePanel({ visible, onClose, userId, onAdded, c, t, s, r }) {
  const slideX  = useRef(new Animated.Value(PANEL_W)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [selectedArea, setArea]       = useState(null);
  const [components,   setComponents] = useState([]);
  const [loading,      setLoading]    = useState(false);
  const [scheduled,    setScheduled]  = useState(new Set());
  const [busy,         setBusy]       = useState({});

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideX, { toValue: visible ? 0 : PANEL_W, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
    if (!visible) setTimeout(() => { setArea(null); setComponents([]); setScheduled(new Set()); }, 250);
  }, [visible]);

  const selectArea = async (key) => {
    setArea(key);
    setLoading(true);
    try {
      const comps = await getPresetComponents(AREAS[key].preset);
      setComponents(comps || []);
    } catch (e) { console.warn('SidePanel', e); }
    setLoading(false);
  };

  const schedule = async (comp) => {
    if (scheduled.has(comp.id) || busy[comp.id]) return;
    setBusy(prev => ({ ...prev, [comp.id]: true }));
    try {
      await generateInstances(userId, comp);
      setScheduled(prev => new Set([...prev, comp.id]));
      onAdded();
    } catch (e) { console.warn('schedule', e); }
    setBusy(prev => ({ ...prev, [comp.id]: false }));
  };

  const scheduleAll = async () => {
    for (const comp of components) {
      if (!scheduled.has(comp.id)) await schedule(comp);
    }
  };

  const areaObj   = selectedArea ? AREAS[selectedArea] : null;
  const areaColor = areaObj?.color || c.teal;
  const byGroup   = { daily: [], weekly: [], monthly: [] };
  components.forEach(comp => { if (byGroup[comp.cadence]) byGroup[comp.cadence].push(comp); });

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000', opacity: Animated.multiply(opacity, 0.5) }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: PANEL_W, backgroundColor: c.bg0, transform: [{ translateX: slideX }], shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 }}>
        {/* Header */}
        <View style={{ backgroundColor: c.headerBg, padding: s.lg, paddingTop: 50, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="chevron-forward" size={22} color={c.text3} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Add to Planner</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Tap any item to schedule it</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {!selectedArea ? (
            <View style={{ padding: s.lg, gap: s.sm }}>
              {Object.entries(AREAS).filter(([, a]) => a.preset).map(([key, area]) => (
                <TouchableOpacity key={key} onPress={() => selectArea(key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
                  <Text style={{ fontSize: 26 }}>{area.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{area.label}</Text>
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Daily, weekly & monthly</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.text4} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ padding: s.lg }}>
              <TouchableOpacity onPress={() => { setArea(null); setComponents([]); setScheduled(new Set()); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                <Ionicons name="chevron-back" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.semibold }}>All areas</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
                <Text style={{ fontSize: 22 }}>{areaObj?.emoji}</Text>
                <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: areaColor }}>{areaObj?.label}</Text>
              </View>

              {loading ? <ActivityIndicator color={areaColor} style={{ marginTop: s.xl }} /> : (
                <>
                  {components.length > 0 && scheduled.size < components.length && (
                    <TouchableOpacity onPress={scheduleAll}
                      style={{ backgroundColor: areaColor, borderRadius: r.md, padding: s.md, alignItems: 'center', marginBottom: s.lg }}>
                      <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Schedule all {components.length}</Text>
                    </TouchableOpacity>
                  )}
                  {scheduled.size === components.length && components.length > 0 && (
                    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, alignItems: 'center', marginBottom: s.lg, borderWidth: 1, borderColor: c.teal }}>
                      <Text style={{ color: c.teal, fontWeight: t.bold }}>✓ All scheduled</Text>
                    </View>
                  )}
                  {['daily','weekly','monthly'].map(cad => {
                    const items = byGroup[cad];
                    if (!items.length) return null;
                    return (
                      <View key={cad} style={{ marginBottom: s.lg }}>
                        <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>{cad}</Text>
                        {items.map(comp => {
                          const done = scheduled.has(comp.id);
                          const isBusy = busy[comp.id];
                          return (
                            <TouchableOpacity key={comp.id} onPress={() => schedule(comp)} disabled={done || isBusy}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: done ? areaColor : c.border, borderLeftWidth: 3, borderLeftColor: areaColor, opacity: done ? 0.6 : 1 }}>
                              {isBusy
                                ? <ActivityIndicator size="small" color={areaColor} style={{ width: 20 }} />
                                : <Ionicons name={done ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={done ? areaColor : c.text4} />
                              }
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: t.xs, fontWeight: t.medium, color: done ? c.text3 : c.text1, textDecorationLine: done ? 'line-through' : 'none' }}>{comp.title}</Text>
                                {comp.duration_minutes && <Text style={{ fontSize: 10, color: areaColor, marginTop: 2 }}>⏱ {comp.duration_minutes}m</Text>}
                              </View>
                              {done && <Text style={{ fontSize: 10, color: areaColor, fontWeight: t.bold }}>Added</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Main PlannerScreen ───────────────────────────────────────────────────────
export default function PlannerScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const navigation = useNavigation();

  const [userId,      setUserId]  = useState(null);
  const [view,        setView]    = useState('Daily');
  const [anchor,      setAnchor]  = useState(new Date());
  const [activeAreas, setAreas]   = useState(new Set());
  const [panelOpen,   setPanel]   = useState(false);
  const [loading,     setLoading] = useState(true);
  const [refreshKey,  setRefresh] = useState(0);
  const [timeMode,    setTimeMode]= useState(false);
  // Edit modal
  const [editInst,   setEditInst] = useState(null);
  const [showModal,  setShowModal]= useState(false);
  const [modalDate,  setModalDate]= useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
      setLoading(false);
    });
  }, []);

  const toggleArea = (key) => {
    if (key === 'all') { setAreas(new Set()); return; }
    setAreas(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const today      = new Date();
  const isToday    = toISO(anchor) === toISO(today);
  const weekDays   = getWeekDays(anchor);

  const prevPeriod = () => {
    const d = new Date(anchor);
    if (view === 'Daily')   d.setDate(d.getDate() - 1);
    if (view === 'Weekly')  d.setDate(d.getDate() - 7);
    if (view === 'Monthly') d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  };
  const nextPeriod = () => {
    const d = new Date(anchor);
    if (view === 'Daily')   d.setDate(d.getDate() + 1);
    if (view === 'Weekly')  d.setDate(d.getDate() + 7);
    if (view === 'Monthly') d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  };
  const onDayPress = (day) => { setAnchor(day); setView('Daily'); };

  const periodLabel = () => {
    if (view === 'Daily')   return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (view === 'Weekly')  return `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (view === 'Monthly') return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const openAdd = () => { setEditInst(null); setModalDate(toISO(anchor)); setShowModal(true); };
  const openEdit = (inst) => { setEditInst(inst); setModalDate(inst.date); setShowModal(true); };

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0 }}>
      <ActivityIndicator color={c.teal} />
    </View>
  );

  if (!userId) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0 }}>
      <Text style={{ fontSize: t.lg, color: c.text3 }}>Sign in to use the Planner</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>

      {/* ── Header ── */}
      <View style={{ backgroundColor: c.headerBg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        {/* Title + actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
          <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, flex: 1 }}>{showEmojis ? '📓 ' : ''}Planner</Text>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('WeeklyReviewScreen')}
              style={{ padding: 6, borderRadius: r.md, backgroundColor: c.bg2, borderWidth: 0.5, borderColor: c.border }}>
              <Ionicons name="stats-chart-outline" size={18} color={c.text3} />
            </TouchableOpacity>
            {view === 'Daily' && (
              <TouchableOpacity
                onPress={() => setTimeMode(m => !m)}
                style={{ padding: 6, borderRadius: r.md, backgroundColor: timeMode ? c.teal : c.bg2, borderWidth: 0.5, borderColor: timeMode ? c.teal : c.border }}>
                <Ionicons name={timeMode ? 'list' : 'time-outline'} size={18} color={timeMode ? '#fff' : c.text3} />
              </TouchableOpacity>
            )}
            <TourSpot id="planner-add">
            <TouchableOpacity
              onPress={openAdd}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.teal, borderRadius: r.lg, paddingHorizontal: s.md, paddingVertical: 6 }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ fontSize: t.xs, color: '#fff', fontWeight: t.bold }}>Add</Text>
            </TouchableOpacity>
            </TourSpot>
            <TouchableOpacity onPress={() => setPanel(true)}
              style={{ padding: 6, borderRadius: r.md, backgroundColor: c.bg2, borderWidth: 0.5, borderColor: c.border }}>
              <Ionicons name="grid-outline" size={18} color={c.text3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* View switcher */}
        <TourSpot id="planner-views">
        <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm, paddingBottom: s.sm }}>
          {VIEWS.map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)}
              style={{ paddingHorizontal: s.md, paddingVertical: 5, borderRadius: 20, backgroundColor: view === v ? c.teal : 'transparent', borderWidth: 1, borderColor: view === v ? c.teal : c.border }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: view === v ? '#fff' : c.text3 }}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        </TourSpot>

        {/* Period nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingBottom: s.sm }}>
          <TouchableOpacity onPress={prevPeriod} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={18} color={c.text3} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setAnchor(new Date())}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: isToday ? c.teal : c.text1 }}>{periodLabel()}</Text>
            {!isToday && view === 'Daily' && <Text style={{ fontSize: 10, color: c.text4 }}>tap to return to today</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={nextPeriod} style={{ padding: 6 }}>
            <Ionicons name="chevron-forward" size={18} color={c.text3} />
          </TouchableOpacity>
        </View>

        {/* Area filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm }}>
          <TouchableOpacity onPress={() => toggleArea('all')}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: activeAreas.size === 0 ? c.gold : c.border, backgroundColor: activeAreas.size === 0 ? c.gold + '22' : 'transparent' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: activeAreas.size === 0 ? c.gold : c.text3 }}>All</Text>
          </TouchableOpacity>
          {Object.entries(AREAS).map(([key, area]) => {
            const active = activeAreas.has(key);
            return (
              <TouchableOpacity key={key} onPress={() => toggleArea(key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: active ? area.color : c.border, backgroundColor: active ? area.color + '22' : 'transparent' }}>
                <Text style={{ fontSize: 12 }}>{area.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: active ? area.color : c.text3 }}>{area.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {view === 'Daily' ? (
        <DailyPage
          key={`daily-${toISO(anchor)}`}
          userId={userId} date={anchor}
          activeAreas={activeAreas} timeMode={timeMode}
          onUpdate={() => setRefresh(k => k + 1)}
          onEdit={openEdit}
          navigation={navigation}
          refreshKey={refreshKey} c={c} t={t} s={s} r={r}
        />
      ) : view === 'Weekly' ? (
        <WeeklyView userId={userId} anchor={anchor} activeAreas={activeAreas}
          onDayPress={onDayPress} refreshKey={refreshKey} c={c} t={t} s={s} />
      ) : (
        <MonthlyView userId={userId} anchor={anchor} activeAreas={activeAreas}
          onDayPress={onDayPress} refreshKey={refreshKey} c={c} t={t} s={s} />
      )}

      {/* ── Side panel ── */}
      <SidePanel
        visible={panelOpen} onClose={() => setPanel(false)}
        userId={userId} onAdded={() => setRefresh(k => k + 1)}
        c={c} t={t} s={s} r={r}
      />

      {/* ── Add/Edit modal ── */}
      <InstanceModal
        visible={showModal}
        instance={editInst}
        userId={userId}
        date={modalDate}
        onSave={(saved) => { setShowModal(false); setRefresh(k => k + 1); }}
        onDelete={() => { setShowModal(false); setRefresh(k => k + 1); }}
        onClose={() => setShowModal(false)}
        c={c} t={t} s={s} r={r}
      />
    </View>
  );
}
