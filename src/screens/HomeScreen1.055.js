// src/screens/HomeScreen.js
// Dashboard — wizard character, quote + affirmation, focus, todos,
// calendar strip, life area chips, project + idea snapshots

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { supabase } from '../api/supabaseClient';
import { LIFE_AREAS } from './library/LifeAreaScreen';

// ─── Curated quotes ───────────────────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
  { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
];

// Get today's quote — rotates daily
function getTodaysQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

// ─── Wizard character ─────────────────────────────────────────────────────────
const WIZARD_MOODS = {
  happy:      { emoji: '🧙', robe: '#8b4fc4', hat: '#2d1f4e', msg: 'Ready for today\'s quest!' },
  focused:    { emoji: '🧙‍♂️', robe: '#2bb5a0', hat: '#0a2825', msg: 'Your focus is strong.' },
  celebrating:{ emoji: '🧙', robe: '#c9a84c', hat: '#2a1f06', msg: 'You\'re on a roll!' },
  resting:    { emoji: '🧙', robe: '#4a3a6a', hat: '#150e28', msg: 'Rest and recover.' },
};

function WizardCharacter({ mood = 'happy', name, rank, colors: c, typography: t, spacing: s, radius: r }) {
  const w = WIZARD_MOODS[mood] || WIZARD_MOODS.happy;
  return (
    <View style={wiz.wrap}>
      {/* Aura glow */}
      <View style={[wiz.aura, { backgroundColor: w.robe + '22', borderColor: w.robe + '44' }]} />
      {/* Wizard emoji */}
      <Text style={wiz.emoji}>{w.emoji}</Text>
      {/* Name tag */}
      <View style={[wiz.nameTag, { borderColor: c.gold }]}>
        <Text style={[wiz.name, { color: c.gold }]}>{name || 'Scholar'}</Text>
      </View>
      {/* Mood message */}
      <Text style={[wiz.msg, { color: c.text3 }]}>{w.msg}</Text>
    </View>
  );
}
const wiz = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingVertical: 8 },
  aura:    { position: 'absolute', width: 100, height: 100, borderRadius: 50, top: 0, borderWidth: 1 },
  emoji:   { fontSize: 72, marginBottom: 4 },
  nameTag: { borderWidth: 0.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 4 },
  name:    { fontSize: 13, fontWeight: '700' },
  msg:     { fontSize: 11, fontStyle: 'italic' },
});

// ─── Calendar strip ───────────────────────────────────────────────────────────
function CalendarStrip({ colors: c, typography: t, spacing: s }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });
  const DAY_SHORT = ['S','M','T','W','T','F','S'];

  return (
    <View style={cal.row}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        return (
          <View key={i} style={[cal.day, isToday && { backgroundColor: c.gold }]}>
            <Text style={[cal.dayName, { color: isToday ? c.bg0 : c.text4 }]}>
              {DAY_SHORT[d.getDay()]}
            </Text>
            <Text style={[cal.dayNum, { color: isToday ? c.bg0 : c.text1 }]}>
              {d.getDate()}
            </Text>
            {isToday && <View style={cal.dot} />}
          </View>
        );
      })}
    </View>
  );
}
const cal = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between' },
  day:     { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, marginHorizontal: 2 },
  dayName: { fontSize: 9, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  dayNum:  { fontSize: 15, fontWeight: '700' },
  dot:     { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 3 },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, action, onAction, c, t }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: t.xs, color: c.teal }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { profile, points, rank, streak, streakDays } = useUserProgress();

  const [refreshing,      setRefreshing]    = useState(false);
  const [todayFocus,      setTodayFocus]    = useState('');
  const [focusDraft,      setFocusDraft]    = useState('');
  const [editFocus,       setEditFocus]     = useState(false);
  const [todos,           setTodos]         = useState([]);
  const [todoInput,       setTodoInput]     = useState('');
  const [showTodoInput,   setShowTodoInput] = useState(false);
  const [affirmation,     setAffirmation]   = useState('');
  const [editAffirmation, setEditAffirm]    = useState(false);
  const [affirmDraft,     setAffirmDraft]   = useState('');
  const [lifeAreas,       setLifeAreas]     = useState([]);
  const [projects,        setProjects]      = useState([]);
  const [ideas,           setIdeas]         = useState([]);
  const [userId,          setUserId]        = useState(null);

  const styles = makeStyles(c, t, s, r, sh);
  const quote = getTodaysQuote();

  // Determine wizard mood
  const wizardMood = (streakDays || 0) >= 3
    ? 'celebrating'
    : todayFocus ? 'focused' : 'happy';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadAll(user.id); }
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (userId) loadAll(userId);
  }, [userId]));

  const loadAll = async (uid) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [focusRes, tasksRes, areasRes, projRes, ideasRes, settingsRes] = await Promise.all([
        supabase.from('daily_focus').select('focus_text').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('tasks').select('*').eq('user_id', uid).eq('completed', false).order('priority').limit(5),
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order').limit(8),
        supabase.from('projects').select('id, title, emoji, color, status').eq('user_id', uid).eq('status', 'active').order('sort_order').limit(4),
        supabase.from('garden_cores').select('id, title, plant_type, color, pos_x, pos_y').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_settings').select('affirmation').eq('user_id', uid).maybeSingle(),
      ]);

      if (focusRes.data) { setTodayFocus(focusRes.data.focus_text); setFocusDraft(focusRes.data.focus_text); }
      if (tasksRes.data) setTodos(tasksRes.data);
      if (areasRes.data) setLifeAreas(areasRes.data);
      if (projRes.data)  setProjects(projRes.data);
      if (ideasRes.data) setIdeas(ideasRes.data);
      if (settingsRes.data?.affirmation) { setAffirmation(settingsRes.data.affirmation); setAffirmDraft(settingsRes.data.affirmation); }
    } catch (e) { console.warn('HomeScreen loadAll', e); }
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  const saveFocus = async () => {
    setTodayFocus(focusDraft);
    setEditFocus(false);
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: focusDraft, date: today });
  };

  const saveAffirmation = async () => {
    setAffirmation(affirmDraft);
    setEditAffirm(false);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, affirmation: affirmDraft });
  };

  const addTodo = async () => {
    if (!todoInput.trim()) return;
    const item = {
      title: todoInput.trim(),
      category: 'personal',
      priority: 2,
      completed: false,
      due_date: new Date().toISOString().split('T')[0],
      sort_order: todos.length,
      ...(userId ? { user_id: userId } : {}),
    };
    const { data } = userId
      ? await supabase.from('tasks').insert(item).select().single()
      : { data: { ...item, id: Date.now().toString() } };
    if (data) setTodos(prev => [...prev, data]);
    setTodoInput('');
    setShowTodoInput(false);
  };

  const completeTodo = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (userId) await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id);
  };

  const displayName = profile?.display_name || profile?.username || 'Scholar';
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Date ── */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{dateStr}</Text>
          {(streakDays || 0) > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streakDays} day streak</Text>
            </View>
          )}
        </View>

        {/* ── Wizard ── */}
        <View style={styles.card}>
          <WizardCharacter
            mood={wizardMood}
            name={displayName}
            rank={rank}
            colors={c}
            typography={t}
            spacing={s}
            radius={r}
          />
        </View>

        {/* ── Daily quote ── */}
        <View style={[styles.quoteCard, { borderLeftColor: c.teal }]}>
          <Text style={styles.quoteLabel}>✦ Today's Wisdom</Text>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </View>

        {/* ── Personal affirmation ── */}
        <TouchableOpacity
          style={[styles.affirmCard, { borderLeftColor: c.gold }]}
          onPress={() => setEditAffirm(true)}
        >
          <Text style={styles.affirmLabel}>💛 My Affirmation</Text>
          <Text style={styles.affirmText}>
            {affirmation || 'Tap to write your personal affirmation...'}
          </Text>
          <Ionicons name="pencil-outline" size={12} color={c.text4} style={{ marginTop: 4 }} />
        </TouchableOpacity>

        {/* ── Today's Focus ── */}
        <View style={styles.section}>
          <SectionHead title="Today's Focus" action={todayFocus ? 'Edit' : 'Set'} onAction={() => setEditFocus(true)} c={c} t={t} />
          <TouchableOpacity style={styles.focusCard} onPress={() => setEditFocus(true)}>
            <Ionicons name="bookmark" size={14} color={c.teal} />
            <Text style={styles.focusText} numberOfLines={2}>
              {todayFocus || 'What is your main focus today?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Calendar strip ── */}
        <View style={styles.section}>
          <SectionHead title="This Week" c={c} t={t} />
          <View style={styles.card}>
            <CalendarStrip colors={c} typography={t} spacing={s} />
          </View>
        </View>

        {/* ── Mini to-do ── */}
        <View style={styles.section}>
          <SectionHead title="On the Desk" action="+ Add" onAction={() => setShowTodoInput(true)} c={c} t={t} />
          {showTodoInput && (
            <View style={styles.todoInputRow}>
              <TextInput
                style={styles.todoInput}
                value={todoInput}
                onChangeText={setTodoInput}
                placeholder="What needs to get done?"
                placeholderTextColor={c.text4}
                autoFocus
                onSubmitEditing={addTodo}
              />
              <TouchableOpacity style={styles.todoAddBtn} onPress={addTodo}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {todos.length === 0 && !showTodoInput ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => setShowTodoInput(true)}>
              <Ionicons name="add-circle-outline" size={20} color={c.text4} />
              <Text style={styles.emptyText}>Add your priorities for today</Text>
            </TouchableOpacity>
          ) : (
            todos.map(todo => (
              <View key={todo.id} style={styles.todoRow}>
                <TouchableOpacity onPress={() => completeTodo(todo.id)} style={styles.todoCheck}>
                  <Ionicons name="ellipse-outline" size={20} color={c.teal} />
                </TouchableOpacity>
                <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Life area snapshots ── */}
        <View style={styles.section}>
          <SectionHead title="Life Areas" action="See all" onAction={() => navigation.navigate('Library')} c={c} t={t} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
              {LIFE_AREAS.map(areaDef => {
                const saved = lifeAreas.find(a => a.label?.toLowerCase() === areaDef.label.toLowerCase());
                const rating = saved?.progress || 0;
                return (
                  <TouchableOpacity
                    key={areaDef.id}
                    style={[styles.areaChip, { borderTopColor: areaDef.color }]}
                    onPress={() => navigation.navigate('Library')}
                  >
                    <Text style={styles.areaEmoji}>{areaDef.emoji}</Text>
                    <Text style={styles.areaLabel}>{areaDef.label}</Text>
                    <View style={styles.areaBar}>
                      <View style={[styles.areaFill, { width: `${(rating / 5) * 100}%`, backgroundColor: areaDef.color }]} />
                    </View>
                    <Text style={[styles.areaRating, { color: areaDef.color }]}>{rating || '—'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Project snapshots ── */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <SectionHead title="Active Projects" action="See all" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {projects.map(proj => (
                  <View key={proj.id} style={[styles.projectCard, { borderLeftColor: proj.color || c.teal }]}>
                    <Text style={styles.projectEmoji}>{proj.emoji || '🚀'}</Text>
                    <Text style={styles.projectTitle} numberOfLines={2}>{proj.title}</Text>
                    <View style={[styles.projectBadge, { backgroundColor: (proj.color || c.teal) + '22' }]}>
                      <Text style={[styles.projectBadgeText, { color: proj.color || c.teal }]}>active</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Idea snapshots ── */}
        {ideas.length > 0 && (
          <View style={styles.section}>
            <SectionHead title="Latest Ideas" action="Garden" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {ideas.map(idea => (
                  <View key={idea.id} style={[styles.ideaCard, { borderColor: idea.color || c.teal }]}>
                    <Text style={styles.ideaEmoji}>
                      {idea.plant_type === 'tree' ? '🌳' : idea.plant_type === 'flower' ? '🌸' : idea.plant_type === 'plant' ? '🌿' : '🌱'}
                    </Text>
                    <Text style={styles.ideaTitle} numberOfLines={2}>{idea.title}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Focus modal ── */}
      <Modal visible={editFocus} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✦ Today's Focus</Text>
            <TextInput
              style={styles.modalInput}
              value={focusDraft}
              onChangeText={setFocusDraft}
              placeholder="What matters most today?"
              placeholderTextColor={c.text4}
              multiline
              autoFocus
            />
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

      {/* ── Affirmation modal ── */}
      <Modal visible={editAffirmation} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💛 My Affirmation</Text>
            <Text style={styles.modalHint}>Write something you want to remind yourself of every day.</Text>
            <TextInput
              style={styles.modalInput}
              value={affirmDraft}
              onChangeText={setAffirmDraft}
              placeholder="I am capable of..."
              placeholderTextColor={c.text4}
              multiline
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setEditAffirm(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveAffirmation} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: c.bg0 },
  dateRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm },
  dateText:       { fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.8 },
  streakBadge:    { backgroundColor: c.goldLight, borderRadius: 12, paddingHorizontal: s.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: c.gold },
  streakText:     { fontSize: t.xs, color: c.gold, fontWeight: t.semibold },

  card:           { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border, ...sh.sm },

  quoteCard:      { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.border },
  quoteLabel:     { fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm, fontWeight: t.semibold },
  quoteText:      { fontSize: t.sm, color: c.text1, lineHeight: 20, fontStyle: 'italic', marginBottom: s.sm },
  quoteAuthor:    { fontSize: t.xs, color: c.text3 },

  affirmCard:     { backgroundColor: c.goldLight, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.gold + '44' },
  affirmLabel:    { fontSize: 10, color: c.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm, fontWeight: t.semibold },
  affirmText:     { fontSize: t.sm, color: c.text2, lineHeight: 20 },

  section:        { paddingHorizontal: s.lg, marginBottom: s.lg },

  focusCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border },
  focusText:      { flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 20 },

  todoInputRow:   { flexDirection: 'row', gap: s.sm, marginBottom: s.sm },
  todoInput:      { flex: 1, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border },
  todoAddBtn:     { backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', justifyContent: 'center' },
  emptyCard:      { flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, borderStyle: 'dashed' },
  emptyText:      { fontSize: t.sm, color: c.text4 },
  todoRow:        { flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border },
  todoCheck:      { padding: 2 },
  todoTitle:      { flex: 1, fontSize: t.sm, color: c.text1 },

  areaChip:       { width: 78, backgroundColor: c.bg1, borderRadius: r.md, padding: s.sm, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3, alignItems: 'center', gap: 4 },
  areaEmoji:      { fontSize: 18 },
  areaLabel:      { fontSize: 9, fontWeight: t.bold, color: c.text1, textAlign: 'center' },
  areaBar:        { width: '100%', height: 2, backgroundColor: c.bg2, borderRadius: 1, overflow: 'hidden' },
  areaFill:       { height: 2, borderRadius: 1 },
  areaRating:     { fontSize: 11, fontWeight: t.bold },

  projectCard:    { width: 130, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, gap: s.xs },
  projectEmoji:   { fontSize: 24 },
  projectTitle:   { fontSize: t.xs, fontWeight: t.semibold, color: c.text1, lineHeight: 16 },
  projectBadge:   { alignSelf: 'flex-start', borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  projectBadgeText:{ fontSize: 9, fontWeight: t.bold, textTransform: 'uppercase', letterSpacing: 0.5 },

  ideaCard:       { width: 110, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 1, alignItems: 'center', gap: 6 },
  ideaEmoji:      { fontSize: 28 },
  ideaTitle:      { fontSize: 11, fontWeight: t.medium, color: c.text1, textAlign: 'center', lineHeight: 15 },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: c.modalBg, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xxl, borderTopWidth: 0.5, borderColor: c.border },
  modalTitle:     { fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  modalHint:      { fontSize: t.xs, color: c.text3, marginBottom: s.md },
  modalInput:     { borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.inputBg, minHeight: 80, textAlignVertical: 'top', marginBottom: s.md },
  modalBtns:      { flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm },
  cancelBtn:      { paddingVertical: s.md, paddingHorizontal: s.lg },
  cancelText:     { fontSize: t.sm, color: c.text3 },
  saveBtn:        { backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl },
  saveBtnText:    { color: '#fff', fontWeight: t.bold, fontSize: t.sm },
});
