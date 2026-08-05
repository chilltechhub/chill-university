// src/screens/LibraryScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
  useWindowDimensions, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import {
  getSettings, getLifeAreas, getTodayFocus, upsertTodayFocus,
  getTodaySessions, saveTimerSession, getTodayTasks,
  upsertTask, toggleTaskComplete, deleteTask,
  updateLifeAreaProgress, updateStreak, upsertSettings,
} from '../api/commandCenterService';
import OnboardingScreen from './library/OnboardingScreen';
import { LIFE_AREAS } from './library/LifeAreaScreen';

const DOMAIN_SECTIONS = [
  {
    id: 'academic', title: '🎓 Academic & Career',
    cards: [
      { title: 'Projects & Collaborations', subtitle: 'Your work + the community', items: [
        { label: 'Your Projects', screen: 'ProjectsScreen' },
        { label: 'Labs',          screen: 'LabsScreen' },
        { label: 'Portfolio',     screen: 'PortfolioScreen' },
        { label: 'Discover',      screen: 'DiscoverScreen', highlight: true },
      ]},
      { title: 'Growth & Exploration', subtitle: 'Plan your path', items: [
        { label: 'Research', screen: 'ResearchScreen' },
        { label: 'Career',   screen: 'CareerExplorationScreen' },
      ]},
    ],
  },
  {
    id: 'knowledge', title: '💡 Knowledge Hub',
    cards: [
      { title: 'Create & Organize', subtitle: 'Your intellectual workspace', items: [
        { label: 'Idea Garden',       screen: 'IdeaGardenScreen' },
        { label: 'Notes',             screen: 'NotesScreen' },
        { label: 'Resources & Tools', screen: 'ResourcesToolsScreen' },
      ]},
    ],
  },
];

export default function LibraryScreen() {
  const navigation = useNavigation();
  const { width: SW } = useWindowDimensions();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();

  const [userId, setUserId]           = useState(null);
  const [needsOnboarding, setNeeds]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [settings, setSettings]       = useState(null);
  const [lifeAreas, setLifeAreas]     = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [todayFocus, setTodayFocus]   = useState('');
  const [focusDraft, setFocusDraft]   = useState('');
  const [editingFocus, setEditFocus]  = useState(false);
  const [tasks, setTasks]             = useState([]);
  const [todaySeconds, setTodaySec]   = useState(0);
  const [timerSecs, setTimerSecs]     = useState(0);
  const [timerRunning, setTimerRun]   = useState(false);
  const [streak, setStreak]           = useState(0);
  const timerRef = useRef(null);
  const sessionRef = useRef(null);
  const [expanded, setExpanded]       = useState({ academic: true, knowledge: false });
  const [checkIn, setCheckIn]         = useState(false);
  const [addLinkArea, setAddLinkArea] = useState(null);
  const [linkDraft, setLinkDraft]     = useState({ title: '', url: '', type: 'article' });
  const [taskModal, setTaskModal]     = useState(false);
  const [taskDraft, setTaskDraft]     = useState({ title: '', life_area_id: null, estimated_minutes: '' });

  const styles = makeStyles(c, t, s, r, sh);

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
      const [settings, areas, focus, sessions, taskList] = await Promise.all([
        getSettings(uid), getLifeAreas(uid), getTodayFocus(uid),
        getTodaySessions(uid), getTodayTasks(uid),
      ]);
      if (!settings?.onboarding_complete) { setNeeds(true); return; }
      setSettings(settings);
      setLifeAreas(areas);
      setTodayFocus(focus?.focus_text || '');
      setFocusDraft(focus?.focus_text || '');
      setTodaySec(sessions.reduce((sum, x) => sum + x.duration_seconds, 0));
      setTasks(taskList);
      setStreak(settings.streak_count || 0);
      const { data: notes } = await supabase
        .from('garden_updates')
        .select('*, garden_cores(title, color)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentNotes(notes || []);
      if (new Date().getDay() === 0) setCheckIn(true);
    } catch (e) { console.warn('loadAll', e); }
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  const toggleTimer = async () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRun(false);
      const elapsed = Math.floor((Date.now() - sessionRef.current) / 1000);
      if (elapsed > 5 && userId) {
        await saveTimerSession(userId, elapsed);
        setTodaySec(p => p + elapsed);
        const ns = await updateStreak(userId); setStreak(ns);
      }
      setTimerSecs(0);
    } else {
      setTimerRun(true);
      sessionRef.current = Date.now();
      timerRef.current = setInterval(() => setTimerSecs(Math.floor((Date.now() - sessionRef.current) / 1000)), 1000);
    }
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const saveFocus = async () => {
    const text = focusDraft.trim();
    setTodayFocus(text); setEditFocus(false);
    if (userId && text) await upsertTodayFocus(userId, text);
  };

  const saveLink = () => {
    if (!linkDraft.title.trim()) return;
    setLifeAreas(prev => prev.map(a => a.id === addLinkArea.id
      ? { ...a, linked_items: [...(a.linked_items || []), { ...linkDraft }] } : a));
    setAddLinkArea(null); setLinkDraft({ title: '', url: '', type: 'article' });
  };

  const saveTask = async () => {
    const title = taskDraft.title.trim(); if (!title) return;
    const saved = await upsertTask(userId, {
      title, life_area_id: taskDraft.life_area_id || lifeAreas[0]?.id,
      estimated_minutes: taskDraft.estimated_minutes ? parseInt(taskDraft.estimated_minutes) : null,
      sort_order: tasks.length,
    });
    setTasks(p => [...p, saved]); setTaskModal(false);
    setTaskDraft({ title: '', life_area_id: null, estimated_minutes: '' });
  };

  const totalSecs = todaySeconds + timerSecs;
  const goal = (settings?.daily_goal_hours || 3) * 3600;
  const timerPct = Math.min(100, Math.round((totalSecs / goal) * 100));
  const h = Math.floor(totalSecs / 3600), m = Math.floor((totalSecs % 3600) / 60), sec = totalSecs % 60;
  const timerDisplay = `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  const done = tasks.filter(x => x.completed).length;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={c.gold} /></View>;
  if (needsOnboarding && userId) return <OnboardingScreen userId={userId} onComplete={() => { setNeeds(false); loadAll(userId); }} />;

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerDay}>
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}
            </Text>
            <Text style={styles.headerTitle}>Your Library</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Compact timer */}
            <TouchableOpacity style={styles.timerPill} onPress={toggleTimer}>
              <View style={styles.timerTrack}>
                <View style={[styles.timerFill, { width: `${timerPct}%` }]} />
              </View>
              <Text style={styles.timerText}>{timerDisplay}</Text>
              <Ionicons name={timerRunning ? 'pause-circle' : 'play-circle'} size={20} color={timerRunning ? c.teal : c.text3} />
            </TouchableOpacity>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
            <TouchableOpacity
              style={styles.inboxBtn}
              onPress={() => navigation.navigate('CaptureInbox')}
            >
              <Ionicons name="add-circle" size={26} color={c.teal} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.goldDivider} />

        {/* Focus row */}
        <TouchableOpacity style={styles.focusRow} onPress={() => setEditFocus(true)}>
          <Text style={styles.focusGlyph}>✦</Text>
          <Text style={styles.focusText} numberOfLines={1}>
            {todayFocus || "Set today's focus..."}
          </Text>
          <Ionicons name="pencil-outline" size={13} color={c.text4} />
        </TouchableOpacity>

        {/* Recent notes */}
        {recentNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>Recent Notes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('IdeaGardenScreen')}>
                <Text style={styles.sectionAction}>Garden →</Text>
              </TouchableOpacity>
            </View>
            {recentNotes.map(note => (
              <View key={note.id} style={styles.noteCard}>
                <View style={[styles.noteDot, { backgroundColor: note.garden_cores?.color || c.teal }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteSource}>{note.garden_cores?.title || 'Note'}</Text>
                  <Text style={styles.noteBody} numberOfLines={2}>{note.entry}</Text>
                  <Text style={styles.noteDate}>
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>On the Desk</Text>
            <TouchableOpacity onPress={() => setTaskModal(true)}>
              <Ionicons name="add-circle" size={20} color={c.teal} />
            </TouchableOpacity>
          </View>
          {tasks.length === 0
            ? <TouchableOpacity style={styles.emptyTask} onPress={() => setTaskModal(true)}>
                <Ionicons name="add" size={16} color={c.text4} />
                <Text style={styles.emptyTaskText}>Add priorities for today</Text>
              </TouchableOpacity>
            : tasks.map(task => (
                <View key={task.id} style={styles.taskRow}>
                  <TouchableOpacity onPress={async () => {
                    await toggleTaskComplete(task.id, !task.completed);
                    setTasks(p => p.map(t2 => t2.id === task.id ? { ...t2, completed: !t2.completed } : t2));
                  }}>
                    <Ionicons name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20}
                      color={task.completed ? c.teal : c.border} />
                  </TouchableOpacity>
                  <Text style={[styles.taskTitle, task.completed && styles.taskDone]}>{task.title}</Text>
                  <TouchableOpacity onPress={async () => {
                    await deleteTask(task.id);
                    setTasks(p => p.filter(t2 => t2.id !== task.id));
                  }}>
                    <Ionicons name="trash-outline" size={14} color={c.border} />
                  </TouchableOpacity>
                </View>
              ))
          }
          {tasks.length > 0 && <Text style={styles.taskProg}>{done}/{tasks.length} complete</Text>}
        </View>

        {/* Life Areas */}
        <View style={{ paddingTop: 20 }}>
          <View style={[styles.sectionHead, { paddingHorizontal: s.lg }]}>
            <Text style={styles.sectionLabel}>Life Areas</Text>
            <TouchableOpacity style={styles.checkBtn} onPress={() => setCheckIn(true)}>
              <Text style={styles.checkBtnText}>✦ Weekly check-in</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: s.lg, gap: s.sm, paddingBottom: 4 }}>
            {LIFE_AREAS.map(areaDef => {
              const saved = lifeAreas.find(a => a.label?.toLowerCase() === areaDef.label.toLowerCase()) || {};
              const rating = saved.progress || 0;
              return (
                <TouchableOpacity
                  key={areaDef.id}
                  style={[styles.areaCard, { borderTopColor: areaDef.color }]}
                  onPress={() => navigation.navigate('LifeAreaScreen', {
                    areaId: areaDef.id, rating,
                    lastCheck: saved.last_check_date || null,
                    linkedItems: saved.linked_items || [],
                  })}
                >
                  <Text style={styles.areaEmoji}>{areaDef.emoji}</Text>
                  <Text style={styles.areaLabel}>{areaDef.label}</Text>
                  <View style={styles.areaBar}>
                    <View style={[styles.areaFill, { width: `${(rating / 5) * 100}%`, backgroundColor: areaDef.color }]} />
                  </View>
                  <Text style={[styles.areaRating, { color: areaDef.color }]}>
                    {rating || '—'}<Text style={styles.areaOf}>/5</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Browse Shelves */}
        <View style={[styles.section, { paddingBottom: 4 }]}>
          <Text style={styles.sectionLabel}>Browse Shelves</Text>
        </View>
        {DOMAIN_SECTIONS.map(section => (
          <View key={section.id} style={styles.shelf}>
            <TouchableOpacity
              style={styles.shelfHead}
              onPress={() => setExpanded(p => ({ ...p, [section.id]: !p[section.id] }))}
            >
              <Text style={styles.shelfTitle}>{section.title}</Text>
              <Ionicons name={expanded[section.id] ? 'chevron-up' : 'chevron-down'} size={15} color={c.text3} />
            </TouchableOpacity>
            {expanded[section.id] && (
              <View style={styles.shelfBody}>
                {section.cards.map((card, ci) => (
                  <View key={ci} style={styles.shelfCard}>
                    <Text style={styles.shelfCardTitle}>{card.title}</Text>
                    <Text style={styles.shelfCardSub}>{card.subtitle}</Text>
                    {card.items.map((item, ii) => (
                      <TouchableOpacity
                        key={ii}
                        style={[styles.shelfItem, item.highlight && styles.shelfItemHL]}
                        onPress={() => navigation.navigate(item.screen)}
                      >
                        <Text style={[styles.shelfItemText, item.highlight && styles.shelfItemHLText]}>
                          {item.label}
                        </Text>
                        {item.highlight && <Ionicons name="compass-outline" size={13} color={c.teal} />}
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

      {/* Modals */}
      <Modal visible={editingFocus} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✦ Today's Focus</Text>
            <TextInput style={styles.modalInput} value={focusDraft} onChangeText={setFocusDraft}
              placeholder="What is your quest today?" placeholderTextColor={c.text4} multiline autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setEditFocus(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveFocus} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={taskModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to Desk</Text>
            <TextInput style={styles.modalInput} value={taskDraft.title}
              onChangeText={v => setTaskDraft(p => ({ ...p, title: v }))}
              placeholder="What needs to get done?" placeholderTextColor={c.text4} autoFocus />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.md }}>
              {lifeAreas.map(area => (
                <TouchableOpacity key={area.id}
                  style={[styles.areaChip, taskDraft.life_area_id === area.id && { backgroundColor: c.tealLight, borderColor: c.teal }]}
                  onPress={() => setTaskDraft(p => ({ ...p, life_area_id: area.id }))}>
                  <Text style={[styles.areaChipText, taskDraft.life_area_id === area.id && { color: c.teal }]}>{area.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setTaskModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveTask} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: s.lg, paddingTop: s.xl, backgroundColor: c.headerBg,
  },
  headerDay: { fontSize: t.xs, color: c.text4, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  headerTitle: { fontSize: t.xxl, fontWeight: t.bold, color: c.text1, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingTop: 6 },
  timerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.bg1, borderRadius: 18,
    paddingHorizontal: s.sm + 2, paddingVertical: 5,
    borderWidth: 0.5, borderColor: c.border,
  },
  timerTrack: { width: 40, height: 3, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: 3, backgroundColor: c.teal, borderRadius: 2 },
  timerText: { fontSize: t.xs, color: c.text1, fontVariant: ['tabular-nums'] },
  streakPill: {
    backgroundColor: c.goldLight, borderRadius: 14,
    paddingHorizontal: s.sm + 2, paddingVertical: 5,
    borderWidth: 0.5, borderColor: c.gold,
  },
  streakText: { fontSize: t.sm, color: c.gold, fontWeight: t.semibold },
  goldDivider: { height: 1, backgroundColor: c.gold + '33', marginHorizontal: s.lg },
  focusRow: {
    flexDirection: 'row', alignItems: 'center', gap: s.sm,
    paddingHorizontal: s.lg, paddingVertical: s.md,
    borderBottomWidth: 0.5, borderBottomColor: c.border,
  },
  inboxBtn: { padding: 2 },
  focusGlyph: { fontSize: t.xs, color: c.gold },
  focusText: { flex: 1, fontSize: t.sm, color: c.text3, fontStyle: 'italic' },
  section: { paddingHorizontal: s.lg, paddingTop: s.xl },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.md },
  sectionLabel: { fontSize: t.xs, fontWeight: t.semibold, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionAction: { fontSize: t.xs, color: c.teal },
  checkBtn: {
    backgroundColor: c.goldLight, borderRadius: 12,
    paddingHorizontal: s.sm, paddingVertical: 4,
    borderWidth: 0.5, borderColor: c.gold,
  },
  checkBtnText: { fontSize: t.xs, color: c.gold, fontWeight: t.medium },
  noteCard: {
    flexDirection: 'row', gap: s.sm, backgroundColor: c.bg1,
    borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, marginBottom: s.sm,
  },
  noteDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  noteSource: { fontSize: t.xs, fontWeight: t.semibold, color: c.gold, marginBottom: 3 },
  noteBody: { fontSize: t.sm, color: c.text2, lineHeight: 18 },
  noteDate: { fontSize: 10, color: c.text4, marginTop: 4 },
  emptyTask: {
    flexDirection: 'row', alignItems: 'center', gap: s.sm,
    backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg,
    borderWidth: 0.5, borderColor: c.border, borderStyle: 'dashed',
  },
  emptyTaskText: { fontSize: t.sm, color: c.text4 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: s.sm,
    backgroundColor: c.bg1, borderRadius: r.md, padding: s.md,
    borderWidth: 0.5, borderColor: c.border, marginBottom: s.sm,
  },
  taskTitle: { flex: 1, fontSize: t.sm, fontWeight: t.medium, color: c.text1 },
  taskDone: { textDecorationLine: 'line-through', color: c.text4 },
  taskProg: { fontSize: t.xs, color: c.text4, textAlign: 'right', marginTop: 4 },
  areaCard: {
    width: 86, height: 86, backgroundColor: c.bg1,
    borderRadius: r.md, padding: s.sm + 2,
    borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3,
    alignItems: 'center', justifyContent: 'space-between',
  },
  areaEmoji: { fontSize: 20 },
  areaLabel: { fontSize: 10, fontWeight: t.bold, color: c.text1, textAlign: 'center' },
  areaBar: { width: '100%', height: 2, backgroundColor: c.bg2, borderRadius: 1, overflow: 'hidden' },
  areaFill: { height: 2, borderRadius: 1 },
  areaRating: { fontSize: 11, fontWeight: t.bold },
  areaOf: { fontSize: 9, color: c.text4, fontWeight: t.regular },
  shelf: { marginTop: s.sm },
  shelfHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.bg1, paddingVertical: s.md, paddingHorizontal: s.lg,
    borderLeftWidth: 3, borderLeftColor: c.teal,
  },
  shelfTitle: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1 },
  shelfBody: { backgroundColor: c.bg0, paddingHorizontal: s.md, paddingTop: s.sm },
  shelfCard: {
    backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg,
    marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border,
  },
  shelfCardTitle: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: 2 },
  shelfCardSub: { fontSize: t.xs, color: c.text3, marginBottom: s.sm },
  shelfItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: s.sm + 2, paddingHorizontal: s.sm,
    backgroundColor: c.bg0, borderRadius: r.sm, marginBottom: 3,
  },
  shelfItemHL: { backgroundColor: c.tealLight, borderWidth: 0.5, borderColor: c.teal },
  shelfItemText: { fontSize: t.sm, color: c.text2 },
  shelfItemHLText: { color: c.teal, fontWeight: t.medium },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: c.modalBg, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl,
    padding: s.xxl, borderTopWidth: 0.5, borderColor: c.border,
  },
  modalTitle: { fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.lg },
  modalInput: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.inputBg, marginBottom: s.md,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm, marginTop: s.xs },
  cancelBtn: { paddingVertical: s.md, paddingHorizontal: s.lg },
  cancelText: { fontSize: t.sm, color: c.text3 },
  saveBtn: { backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl },
  saveBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.sm },
  areaChip: {
    paddingHorizontal: s.md, paddingVertical: 7, borderRadius: 18,
    borderWidth: 1, borderColor: c.border, marginRight: s.sm, backgroundColor: c.bg1,
  },
  areaChipText: { fontSize: t.xs, color: c.text3 },
});
