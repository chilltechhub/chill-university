// LibraryScreen.js
// Academic Library — dark navy + brass + warm white
// Recent notes on top, compact timer, weekly life area check-ins, linked content

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
  useWindowDimensions, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import {
  getSettings, getLifeAreas, getTodayFocus, upsertTodayFocus,
  getTodaySessions, getWeekSeconds, saveTimerSession,
  getTodayTasks, upsertTask, toggleTaskComplete, deleteTask,
  updateLifeAreaProgress, updateStreak, upsertSettings,
} from '../api/commandCenterService';
import OnboardingScreen from '../screens/OnboardingScreen';
import { LIFE_AREAS } from './library/LifeAreaScreen';

const T = {
  navy:      '#0e1a2e',
  navyMid:   '#152236',
  navyLight: '#1c2f47',
  navyBorder:'#243850',
  brass:     '#c9a84c',
  brassLight:'#e4c97a',
  brassDim:  '#8a6f2e',
  cream:     '#f5edd6',
  creamDim:  '#c4b99a',
  muted:     '#6b7f99',
  green:     '#4caf7d',
};

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const DOMAIN_SECTIONS = [
  {
    id: 'academic', title: '🎓 Academic & Career', color: '#c9a84c',
    cards: [
      { title: 'Projects & Collaborations', subtitle: 'Your work + the community', items: [
        { label: 'Your Projects',    screen: 'ProjectsScreen'          },
        { label: 'Labs',             screen: 'LabsScreen'              },
        { label: 'Portfolio',        screen: 'PortfolioScreen'         },
        { label: 'Discover',         screen: 'DiscoverScreen', highlight: true },
      ]},
      { title: 'Growth & Exploration', subtitle: 'Plan your path', items: [
        { label: 'Research',         screen: 'ResearchScreen'          },
        { label: 'Career',           screen: 'CareerExplorationScreen' },
      ]},
    ],
  },
  {
    id: 'knowledge', title: '💡 Knowledge Hub', color: '#7eb8e0',
    cards: [
      { title: 'Create & Organize', subtitle: 'Your intellectual workspace', items: [
        { label: 'Idea Garden',      screen: 'IdeaGardenScreen'        },
        { label: 'Notes',            screen: 'NotesScreen'             },
        { label: 'Resources & Tools',screen: 'ResourcesToolsScreen'   },
      ]},
    ],
  },

];

// ─── Compact Timer ────────────────────────────────────────────────────────────
function CompactTimer({ running, seconds, onToggle, goal }) {
  const pct = Math.min(100, Math.round((seconds / (goal * 3600)) * 100));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  const display = h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${m}:${String(sec).padStart(2,'0')}`;
  return (
    <TouchableOpacity style={ts.wrap} onPress={onToggle}>
      <View style={ts.track}>
        <View style={[ts.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={ts.time}>{display}</Text>
      <Ionicons name={running ? 'pause-circle' : 'play-circle'} size={20} color={running ? T.brass : T.muted} />
    </TouchableOpacity>
  );
}
const ts = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.navyMid, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: T.navyBorder },
  track: { width: 48, height: 3, backgroundColor: T.navyBorder, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 3, backgroundColor: T.brass, borderRadius: 3 },
  time:  { fontSize: 12, color: T.cream, fontVariant: ['tabular-nums'], fontWeight: '500', minWidth: 36 },
});

// ─── Life Area Card ───────────────────────────────────────────────────────────
function LifeAreaCard({ area, onAddLink }) {
  const lastCheck = area.last_check_date
    ? new Date(area.last_check_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const links = area.linked_items || [];
  return (
    <View style={as.card}>
      <View style={as.top}>
        <View style={[as.icon, { backgroundColor: area.color_light || '#243850' }]}>
          <Ionicons name={area.icon || 'star'} size={15} color={area.color || T.brass} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={as.label}>{area.label}</Text>
          {area.subtitle ? <Text style={as.sub} numberOfLines={1}>{area.subtitle}</Text> : null}
        </View>
        <View style={as.ratingBox}>
          <Text style={[as.rating, { color: area.color || T.brass }]}>
            {area.progress || '—'}
          </Text>
          <Text style={as.ratingOf}>/5</Text>
        </View>
      </View>
      <View style={as.bar}>
        <View style={[as.barFill, { width: `${((area.progress || 0) / 5) * 100}%`, backgroundColor: area.color || T.brass }]} />
      </View>
      <View style={as.footer}>
        <Text style={as.footerText}>{lastCheck ? `checked ${lastCheck}` : 'not yet rated'}</Text>
        <TouchableOpacity onPress={onAddLink} style={as.linkBtn}>
          <Ionicons name="link-outline" size={13} color={T.brassDim} />
          <Text style={as.linkBtnText}>link content</Text>
        </TouchableOpacity>
      </View>
      {links.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={as.linksRow}>
          {links.map((lk, i) => (
            <View key={i} style={as.chip}>
              <Ionicons name={lk.type === 'project' ? 'briefcase-outline' : 'document-text-outline'} size={10} color={T.brass} />
              <Text style={as.chipText} numberOfLines={1}>{lk.title}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
const as = StyleSheet.create({
  card:      { backgroundColor: T.navyMid, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 8 },
  top:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  icon:      { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:     { fontSize: 14, fontWeight: '600', color: T.cream },
  sub:       { fontSize: 11, color: T.muted, marginTop: 1 },
  ratingBox: { flexDirection: 'row', alignItems: 'baseline' },
  rating:    { fontSize: 22, fontWeight: '700' },
  ratingOf:  { fontSize: 11, color: T.muted },
  bar:       { height: 3, backgroundColor: T.navyBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  barFill:   { height: 3, borderRadius: 3 },
  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:{ fontSize: 10, color: T.muted },
  linkBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  linkBtnText:{ fontSize: 11, color: T.brassDim },
  linksRow:  { marginTop: 8 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.navy, borderWidth: 0.5, borderColor: T.brass + '44', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  chipText:  { fontSize: 10, color: T.brassLight, maxWidth: 100 },
});

// ─── Weekly Check-in ──────────────────────────────────────────────────────────
function WeeklyCheckIn({ visible, areas, onSave, onDismiss }) {
  const [ratings, setRatings] = useState({});
  useEffect(() => {
    if (visible) {
      const init = {};
      areas.forEach(a => { init[a.id] = a.progress || 0; });
      setRatings(init);
    }
  }, [visible, areas]);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={ws.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={ws.card}>
          <Text style={ws.title}>📚 Weekly Check-in</Text>
          <Text style={ws.sub}>How did each area go this week?</Text>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {areas.map(area => (
              <View key={area.id} style={ws.row}>
                <View style={{ flex: 1 }}>
                  <Text style={ws.areaName}>{area.label}</Text>
                  {area.subtitle ? <Text style={ws.areaSub}>{area.subtitle}</Text> : null}
                </View>
                <View style={ws.stars}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setRatings(r => ({ ...r, [area.id]: n }))}>
                      <Ionicons name={n <= (ratings[area.id] || 0) ? 'star' : 'star-outline'} size={24} color={n <= (ratings[area.id] || 0) ? T.brass : T.navyBorder} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={ws.btns}>
            <TouchableOpacity onPress={onDismiss} style={ws.cancelBtn}>
              <Text style={ws.cancelText}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(ratings)} style={ws.saveBtn}>
              <Text style={ws.saveText}>Save check-in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const ws = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card:     { backgroundColor: T.navyMid, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 0.5, borderColor: T.navyBorder },
  title:    { fontSize: 20, fontWeight: '700', color: T.cream, marginBottom: 4 },
  sub:      { fontSize: 13, color: T.muted, marginBottom: 20 },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: T.navyBorder },
  areaName: { fontSize: 14, fontWeight: '500', color: T.cream },
  areaSub:  { fontSize: 11, color: T.muted, marginTop: 2 },
  stars:    { flexDirection: 'row', gap: 6 },
  btns:     { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn:{ paddingVertical: 12, paddingHorizontal: 18 },
  cancelText:{ fontSize: 14, color: T.muted },
  saveBtn:  { backgroundColor: T.brass, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 22 },
  saveText: { color: T.navy, fontWeight: '700', fontSize: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const navigation = useNavigation();
  const { width: SW } = useWindowDimensions();

  const [userId, setUserId]           = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [settings, setSettings]       = useState(null);
  const [lifeAreas, setLifeAreas]     = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [todayFocus, setTodayFocus]   = useState('');
  const [focusDraft, setFocusDraft]   = useState('');
  const [editingFocus, setEditingFocus] = useState(false);
  const [tasks, setTasks]             = useState([]);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [streak, setStreak]           = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({ academic: true, knowledge: false });
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [addLinkArea, setAddLinkArea] = useState(null);
  const [linkDraft, setLinkDraft]     = useState({ title: '', url: '', type: 'article' });
  const [taskModal, setTaskModal]     = useState(false);
  const [taskDraft, setTaskDraft]     = useState({ title: '', life_area_id: null, estimated_minutes: '' });

  // ─── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); await loadAll(user.id); }
      setLoading(false);
    };
    load();
  }, []);

  useFocusEffect(useCallback(() => { if (userId) loadAll(userId); }, [userId]));

  const loadAll = async (uid) => {
    try {
      const [s, areas, focus, sessions, taskList] = await Promise.all([
        getSettings(uid), getLifeAreas(uid), getTodayFocus(uid),
        getTodaySessions(uid), getTodayTasks(uid),
      ]);
      if (!s?.onboarding_complete) { setNeedsOnboarding(true); return; }
      setSettings(s);
      setLifeAreas(areas);
      setTodayFocus(focus?.focus_text || '');
      setFocusDraft(focus?.focus_text || '');
      setSessionCount(sessions.length);
      setTodaySeconds(sessions.reduce((sum, x) => sum + x.duration_seconds, 0));
      setTasks(taskList);
      setStreak(s.streak_count || 0);
      await loadRecentNotes(uid);
      if (new Date().getDay() === 0) setCheckInVisible(true);
    } catch (e) { console.warn('loadAll', e); }
  };

  const loadRecentNotes = async (uid) => {
    try {
      const { data } = await supabase
        .from('garden_updates')
        .select('*, garden_cores(title, color)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentNotes(data || []);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  // ─── Timer ──────────────────────────────────────────────────────────────
  const toggleTimer = async () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRunning(false);
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (elapsed > 5 && userId) {
        await saveTimerSession(userId, elapsed);
        setTodaySeconds(p => p + elapsed);
        setSessionCount(p => p + 1);
        const ns = await updateStreak(userId);
        setStreak(ns);
      }
      setTimerSeconds(0);
    } else {
      setTimerRunning(true);
      sessionStartRef.current = Date.now();
      timerRef.current = setInterval(() => setTimerSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000)), 1000);
    }
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ─── Focus ───────────────────────────────────────────────────────────────
  const saveFocus = async () => {
    const text = focusDraft.trim();
    setTodayFocus(text); setEditingFocus(false);
    if (userId && text) await upsertTodayFocus(userId, text);
  };

  // ─── Check-in ────────────────────────────────────────────────────────────
  const saveCheckIn = async (ratings) => {
    // ratings keys are LIFE_AREAS string ids (e.g. 'physical')
    // lifeAreas rows from Supabase have UUID ids but label matches LIFE_AREAS label
    try {
      const updates = LIFE_AREAS
        .filter(a => ratings[a.id] !== undefined)
        .map(areaDef => {
          const row = lifeAreas.find(r => r.label?.toLowerCase() === areaDef.label.toLowerCase());
          return row ? updateLifeAreaProgress(row.id, ratings[areaDef.id]) : null;
        })
        .filter(Boolean);
      await Promise.all(updates);
      setLifeAreas(prev => prev.map(a => {
        const areaDef = LIFE_AREAS.find(d => d.label?.toLowerCase() === a.label?.toLowerCase());
        if (!areaDef) return a;
        return { ...a, progress: ratings[areaDef.id] ?? a.progress, last_check_date: new Date().toISOString() };
      }));
      if (userId) await upsertSettings(userId, { last_checkin_date: new Date().toISOString().slice(0, 10) });
    } catch (e) { console.warn('checkin', e); }
    setCheckInVisible(false);
  };

  // ─── Link ────────────────────────────────────────────────────────────────
  const saveLink = () => {
    if (!linkDraft.title.trim()) return;
    setLifeAreas(prev => prev.map(a => a.id === addLinkArea.id
      ? { ...a, linked_items: [...(a.linked_items || []), { ...linkDraft }] }
      : a
    ));
    setAddLinkArea(null);
    setLinkDraft({ title: '', url: '', type: 'article' });
  };

  // ─── Tasks ───────────────────────────────────────────────────────────────
  const saveTask = async () => {
    const title = taskDraft.title.trim();
    if (!title) return;
    const saved = await upsertTask(userId, {
      title, life_area_id: taskDraft.life_area_id || lifeAreas[0]?.id,
      estimated_minutes: taskDraft.estimated_minutes ? parseInt(taskDraft.estimated_minutes) : null,
      sort_order: tasks.length,
    });
    setTasks(prev => [...prev, saved]);
    setTaskModal(false);
    setTaskDraft({ title: '', life_area_id: null, estimated_minutes: '' });
  };

  const completeTask = async (task) => {
    await toggleTaskComplete(task.id, !task.completed);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = async (id) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // ─── Guards ──────────────────────────────────────────────────────────────
  if (loading) return <View style={[s.container, s.centered]}><ActivityIndicator size="large" color={T.brass} /></View>;
  if (needsOnboarding && userId) return <OnboardingScreen userId={userId} onComplete={() => { setNeedsOnboarding(false); loadAll(userId); }} />;

  const totalSecs = todaySeconds + timerSeconds;
  const completedTasks = tasks.filter(t => t.completed).length;
  const today = new Date();

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.brass} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Top bar */}
        <View style={s.topbar}>
          <View>
            <Text style={s.topDay}>{DAYS[today.getDay()]} · {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
            <Text style={s.topTitle}>Your Library</Text>
          </View>
          <View style={s.topRight}>
            <CompactTimer running={timerRunning} seconds={totalSecs} onToggle={toggleTimer} goal={settings?.daily_goal_hours || 3} />
            <View style={s.streakPill}><Text style={s.streakText}>🔥 {streak}</Text></View>
          </View>
        </View>

        <View style={s.brassDivider} />

        {/* Today's Focus */}
        <TouchableOpacity style={s.focusRow} onPress={() => setEditingFocus(true)}>
          <Ionicons name="bookmark" size={13} color={T.brass} />
          <Text style={s.focusText} numberOfLines={1}>{todayFocus || "Set today's focus..."}</Text>
          <Ionicons name="pencil-outline" size={12} color={T.muted} />
        </TouchableOpacity>

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionLabel}>Recent Notes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('IdeaGardenScreen')}>
                <Text style={s.sectionAction}>Garden →</Text>
              </TouchableOpacity>
            </View>
            {recentNotes.map(note => (
              <View key={note.id} style={s.noteCard}>
                <View style={[s.noteDot, { backgroundColor: note.garden_cores?.color || T.brass }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.noteSource}>{note.garden_cores?.title || 'Note'}</Text>
                  <Text style={s.noteBody} numberOfLines={2}>{note.entry}</Text>
                  <Text style={s.noteDate}>{new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* On the Desk */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionLabel}>On the Desk Today</Text>
            <TouchableOpacity onPress={() => setTaskModal(true)}>
              <Ionicons name="add-circle" size={20} color={T.brass} />
            </TouchableOpacity>
          </View>
          {tasks.length === 0
            ? <TouchableOpacity style={s.emptyTask} onPress={() => setTaskModal(true)}>
                <Ionicons name="add" size={16} color={T.muted} />
                <Text style={s.emptyText}>Add priorities for today</Text>
              </TouchableOpacity>
            : tasks.map(task => {
                const area = lifeAreas.find(a => a.id === task.life_area_id);
                return (
                  <View key={task.id} style={s.taskRow}>
                    <TouchableOpacity onPress={() => completeTask(task)}>
                      <Ionicons name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={task.completed ? T.green : T.navyBorder} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.taskTitle, task.completed && s.taskDone]}>{task.title}</Text>
                      {area && <Text style={s.taskMeta}>{area.label}{task.estimated_minutes ? ` · ${task.estimated_minutes}m` : ''}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => removeTask(task.id)}>
                      <Ionicons name="trash-outline" size={14} color={T.navyBorder} />
                    </TouchableOpacity>
                  </View>
                );
              })
          }
          {tasks.length > 0 && <Text style={s.taskProg}>{completedTasks}/{tasks.length} completed</Text>}
        </View>

        {/* Life Areas — horizontal scroll */}
        <View style={{ paddingTop: 20 }}>
          <View style={[s.sectionHead, { paddingHorizontal: 16 }]}>
            <Text style={s.sectionLabel}>Life Areas</Text>
            <TouchableOpacity style={s.checkBtn} onPress={() => setCheckInVisible(true)}>
              <Ionicons name="star-outline" size={12} color={T.brass} />
              <Text style={s.checkBtnText}>Weekly check-in</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}
            style={{ marginBottom: 4 }}
          >
            {LIFE_AREAS.map(areaDef => {
              const saved = lifeAreas.find(a =>
                a.label?.toLowerCase() === areaDef.label.toLowerCase()
              ) || {};
              const rating = saved.progress || 0;
              return (
                <TouchableOpacity
                  key={areaDef.id}
                  style={[s.areaScrollCard, { borderTopColor: areaDef.color }]}
                  onPress={() => navigation.navigate('LifeAreaScreen', {
                    areaId: areaDef.id,
                    rating: rating,
                    lastCheck: saved.last_check_date || null,
                    linkedItems: saved.linked_items || [],
                  })}
                >
                  <Text style={s.areaScrollEmoji}>{areaDef.emoji}</Text>
                  <Text style={s.areaScrollLabel}>{areaDef.label}</Text>
                  <View style={s.areaScrollBar}>
                    <View style={[s.areaScrollFill, { width: `${(rating / 5) * 100}%`, backgroundColor: areaDef.color }]} />
                  </View>
                  <Text style={[s.areaScrollRating, { color: areaDef.color }]}>{rating || '—'}<Text style={s.areaScrollOf}>/5</Text></Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Browse Shelves */}
        <View style={[s.section, { paddingBottom: 4 }]}>
          <Text style={s.sectionLabel}>Browse Shelves</Text>
        </View>
        {DOMAIN_SECTIONS.map(section => (
          <View key={section.id} style={s.shelf}>
            <TouchableOpacity
              style={[s.shelfHead, { borderLeftColor: section.color }]}
              onPress={() => setExpandedSections(p => ({ ...p, [section.id]: !p[section.id] }))}
            >
              <Text style={s.shelfTitle}>{section.title}</Text>
              <Ionicons name={expandedSections[section.id] ? 'chevron-up' : 'chevron-down'} size={15} color={T.muted} />
            </TouchableOpacity>
            {expandedSections[section.id] && (
              <View style={s.shelfBody}>
                {section.cards.map((card, ci) => (
                  <View key={ci} style={s.shelfCard}>
                    <Text style={s.shelfCardTitle}>{card.title}</Text>
                    <Text style={s.shelfCardSub}>{card.subtitle}</Text>
                    {card.items.map((item, ii) => (
                      <TouchableOpacity
                        key={ii}
                        style={[s.shelfItem, item.highlight && s.shelfItemHL]}
                        onPress={() => navigation.navigate(item.screen)}
                      >
                        <Text style={[s.shelfItemText, item.highlight && s.shelfItemTextHL]}>{item.label}</Text>
                        {item.highlight && <Ionicons name="compass-outline" size={13} color={T.brass} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Focus modal */}
      <Modal visible={editingFocus} transparent animationType="slide">
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Today's Focus</Text>
            <TextInput style={s.modalInput} value={focusDraft} onChangeText={setFocusDraft} placeholder="What matters most today?" placeholderTextColor={T.muted} multiline autoFocus />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setEditingFocus(false)} style={s.cancelBtn}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveFocus} style={s.saveBtn}><Text style={s.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Task modal */}
      <Modal visible={taskModal} transparent animationType="slide">
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add to Desk</Text>
            <TextInput style={s.modalInput} value={taskDraft.title} onChangeText={v => setTaskDraft(p => ({ ...p, title: v }))} placeholder="What needs to get done?" placeholderTextColor={T.muted} autoFocus />
            <Text style={s.modalLabel}>Life Area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {lifeAreas.map(area => (
                <TouchableOpacity key={area.id}
                  style={[s.areaChip, taskDraft.life_area_id === area.id && { backgroundColor: area.color_light, borderColor: area.color }]}
                  onPress={() => setTaskDraft(p => ({ ...p, life_area_id: area.id }))}>
                  <Text style={[s.areaChipText, taskDraft.life_area_id === area.id && { color: area.color }]}>{area.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={s.modalInput} value={taskDraft.estimated_minutes} onChangeText={v => setTaskDraft(p => ({ ...p, estimated_minutes: v }))} placeholder="Estimated minutes (optional)" placeholderTextColor={T.muted} keyboardType="numeric" />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setTaskModal(false)} style={s.cancelBtn}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveTask} style={s.saveBtn}><Text style={s.saveText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add link modal */}
      <Modal visible={!!addLinkArea} transparent animationType="slide">
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Link to {addLinkArea?.label}</Text>
            <Text style={s.modalHint}>Attach an article, project, or resource from Discover.</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {['article','project','advice','resource'].map(t => (
                <TouchableOpacity key={t}
                  style={[s.typeChip, linkDraft.type === t && s.typeChipActive]}
                  onPress={() => setLinkDraft(p => ({ ...p, type: t }))}>
                  <Text style={[s.typeChipText, linkDraft.type === t && s.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.modalInput} value={linkDraft.title} onChangeText={v => setLinkDraft(p => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor={T.muted} autoFocus />
            <TextInput style={s.modalInput} value={linkDraft.url} onChangeText={v => setLinkDraft(p => ({ ...p, url: v }))} placeholder="URL or note (optional)" placeholderTextColor={T.muted} autoCapitalize="none" />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setAddLinkArea(null)} style={s.cancelBtn}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveLink} style={s.saveBtn}><Text style={s.saveText}>Link it</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Weekly check-in */}
      <WeeklyCheckIn
        visible={checkInVisible}
        areas={LIFE_AREAS.map(a => ({
          ...a,
          progress: lifeAreas.find(la =>
            la.label?.toLowerCase() === a.label.toLowerCase()
          )?.progress || 0,
        }))}
        onSave={saveCheckIn}
        onDismiss={() => setCheckInVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: T.navy },
  centered:   { alignItems: 'center', justifyContent: 'center' },

  topbar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 24 },
  topDay:     { fontSize: 11, color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  topTitle:   { fontSize: 26, fontWeight: '700', color: T.cream, letterSpacing: -0.5 },
  topRight:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  streakPill: { backgroundColor: T.navyMid, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: T.navyBorder },
  streakText: { fontSize: 13, color: T.cream, fontWeight: '600' },
  brassDivider:{ height: 1, backgroundColor: '#c9a84c33', marginHorizontal: 20 },

  focusRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: T.navyBorder },
  focusText:  { flex: 1, fontSize: 13, color: '#c4b99a', fontStyle: 'italic' },

  section:    { paddingHorizontal: 16, paddingTop: 20 },
  sectionHead:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel:{ fontSize: 12, fontWeight: '600', color: T.brass, textTransform: 'uppercase', letterSpacing: 1 },
  sectionAction:{ fontSize: 12, color: T.brassDim },
  areaHint:   { fontSize: 11, color: T.muted, marginBottom: 10, fontStyle: 'italic' },

  checkBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.navyMid, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 0.5, borderColor: '#c9a84c44' },
  checkBtnText:{ fontSize: 11, color: T.brass },

  noteCard:   { flexDirection: 'row', gap: 10, backgroundColor: T.navyMid, borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 8 },
  noteDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  noteSource: { fontSize: 11, fontWeight: '600', color: T.brass, marginBottom: 3 },
  noteBody:   { fontSize: 13, color: T.creamDim, lineHeight: 18 },
  noteDate:   { fontSize: 10, color: T.muted, marginTop: 4 },

  emptyTask:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.navyMid, borderRadius: 10, padding: 14, borderWidth: 0.5, borderColor: T.navyBorder, borderStyle: 'dashed' },
  emptyText:  { fontSize: 14, color: T.muted },
  taskRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.navyMid, borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 6 },
  taskTitle:  { fontSize: 14, fontWeight: '500', color: T.cream },
  taskDone:   { textDecorationLine: 'line-through', color: T.muted },
  taskMeta:   { fontSize: 11, color: T.muted, marginTop: 2 },
  taskProg:   { fontSize: 11, color: T.muted, textAlign: 'right', marginTop: 4 },

  shelf:      { marginTop: 6 },
  shelfHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.navyMid, paddingVertical: 13, paddingHorizontal: 16, borderLeftWidth: 3 },
  shelfTitle: { fontSize: 14, fontWeight: '600', color: T.cream },
  shelfBody:  { backgroundColor: T.navy, paddingHorizontal: 12, paddingTop: 8 },
  shelfCard:  { backgroundColor: T.navyMid, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: T.navyBorder },
  shelfCardTitle:{ fontSize: 13, fontWeight: '600', color: T.cream, marginBottom: 2 },
  shelfCardSub:  { fontSize: 11, color: T.muted, marginBottom: 8 },
  shelfItem:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: T.navy, borderRadius: 8, marginBottom: 4 },
  shelfItemHL:{ backgroundColor: '#c9a84c18', borderWidth: 0.5, borderColor: '#c9a84c44' },
  shelfItemText:{ fontSize: 13, color: T.creamDim },
  shelfItemTextHL:{ color: T.brassLight, fontWeight: '500' },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard:  { backgroundColor: T.navyMid, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 0.5, borderColor: T.navyBorder },
  modalTitle: { fontSize: 18, fontWeight: '700', color: T.cream, marginBottom: 14 },
  modalHint:  { fontSize: 12, color: T.muted, marginBottom: 14 },
  modalLabel: { fontSize: 11, fontWeight: '600', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: T.navyBorder, borderRadius: 10, padding: 12, fontSize: 15, color: T.cream, backgroundColor: T.navy, marginBottom: 12 },
  modalBtns:  { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn:  { paddingVertical: 12, paddingHorizontal: 18 },
  cancelText: { fontSize: 14, color: T.muted },
  saveBtn:    { backgroundColor: T.brass, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 22 },
  saveText:   { color: T.navy, fontWeight: '700', fontSize: 14 },
  areaChip:   { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: T.navyBorder, marginRight: 8, backgroundColor: T.navy },
  areaChipText:{ fontSize: 13, color: T.muted },
  typeChip:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: T.navyBorder, backgroundColor: T.navy },
  typeChipActive:{ backgroundColor: '#c9a84c22', borderColor: T.brass },
  typeChipText:{ fontSize: 12, color: T.muted },
  typeChipTextActive:{ color: T.brass, fontWeight: '600' },

  // Life area horizontal scroll cards — compact square boxes
  areaScrollCard: { width: 86, height: 86, backgroundColor: T.navyMid, borderRadius: 12, padding: 9, borderWidth: 0.5, borderColor: T.navyBorder, borderTopWidth: 3, alignItems: 'center', justifyContent: 'space-between' },
  areaScrollEmoji: { fontSize: 22 },
  areaScrollLabel: { fontSize: 11, fontWeight: '700', color: T.cream, textAlign: 'center' },
  areaScrollBar: { width: '100%', height: 2, backgroundColor: T.navyBorder, borderRadius: 2, overflow: 'hidden' },
  areaScrollFill: { height: 2, borderRadius: 2 },
  areaScrollRating: { fontSize: 11, fontWeight: '700' },
  areaScrollOf: { fontSize: 9, color: T.muted, fontWeight: '400' },
});