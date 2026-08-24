// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import CalendarModal from '../components/CalendarModal';

// ─── Quotes ──────────────────────────────────────────────────────────────────
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
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
];
function getTodaysQuote() {
  return QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];
}

// ─── Wizard ──────────────────────────────────────────────────────────────────
const WIZARD_MOODS = {
  happy:       { emoji: '🧙',   robe: '#8b4fc4', msg: "Ready for today's quest!" },
  focused:     { emoji: '🧙‍♂️', robe: '#2bb5a0', msg: 'Your focus is strong.' },
  celebrating: { emoji: '🧙',   robe: '#c9a84c', msg: "You're on a roll!" },
  resting:     { emoji: '🧙',   robe: '#4a3a6a', msg: 'Rest and recover.' },
};
function WizardCharacter({ mood = 'happy', name, c }) {
  const w = WIZARD_MOODS[mood] || WIZARD_MOODS.happy;
  return (
    <View style={wiz.wrap}>
      <View style={[wiz.aura, { backgroundColor: w.robe + '22', borderColor: w.robe + '55' }]} />
      <Text style={wiz.emoji}>{w.emoji}</Text>
      <View style={[wiz.nameTag, { borderColor: c.gold }]}>
        <Text style={[wiz.name, { color: c.gold }]}>{name || 'Scholar'}</Text>
      </View>
      <Text style={[wiz.msg, { color: c.text3 }]}>{w.msg}</Text>
    </View>
  );
}
const wiz = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingVertical: 8 },
  aura:    { position: 'absolute', width: 110, height: 110, borderRadius: 55, top: 0, borderWidth: 1 },
  emoji:   { fontSize: 72, marginBottom: 6 },
  nameTag: { borderWidth: 0.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 4 },
  name:    { fontSize: 13, fontWeight: '700' },
  msg:     { fontSize: 11, fontStyle: 'italic' },
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
  const { profile, streakDays } = useUserProgress();

  const [refreshing,     setRefreshing]    = useState(false);
  const [todayFocus,     setTodayFocus]    = useState('');
  const [focusDraft,     setFocusDraft]    = useState('');
  const [editFocus,      setEditFocus]     = useState(false);
  const [todos,          setTodos]         = useState([]);
  const [todoInput,      setTodoInput]     = useState('');
  const [showTodoInput,  setShowTodoInput] = useState(false);
  const [affirmation,    setAffirmation]   = useState('');
  const [editAffirm,     setEditAffirm]    = useState(false);
  const [affirmDraft,    setAffirmDraft]   = useState('');
  const [lifeAreas,      setLifeAreas]     = useState([]);
  const [projects,       setProjects]      = useState([]);
  const [ideas,          setIdeas]         = useState([]);
  const [userId,         setUserId]        = useState(null);
  const [showCalendar,   setShowCalendar]  = useState(false);
  const [areaIndex,      setAreaIndex]     = useState(0);
  const areaTimer = useRef(null);

  const styles = makeStyles(c, t, s, r, sh);
  const quote  = getTodaysQuote();
  const today  = new Date();
  const wizardMood  = (streakDays || 0) >= 3 ? 'celebrating' : todayFocus ? 'focused' : 'happy';
  const displayName = profile?.display_name || profile?.username || 'Scholar';
  const dateStr     = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Auto-rotate life areas every 3s
  useEffect(() => {
    areaTimer.current = setInterval(() => {
      setAreaIndex(i => (i + 1) % LIFE_AREAS.length);
    }, 3000);
    return () => clearInterval(areaTimer.current);
  }, []);

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
      const todayStr = new Date().toISOString().split('T')[0];
      const [focusRes, tasksRes, projRes2, capturesRes, areasRes, projRes, ideasRes, settingsRes] = await Promise.all([
        supabase.from('daily_focus').select('focus_text').eq('user_id', uid).eq('date', todayStr).maybeSingle(),
        supabase.from('tasks').select('id, title').eq('user_id', uid).eq('completed', false).order('priority').limit(3),
        supabase.from('projects').select('id, title, emoji, color').eq('user_id', uid).eq('status', 'active').limit(3),
        supabase.from('captures').select('id, title, type').eq('user_id', uid).eq('status', 'inbox').limit(2),
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order').limit(8),
        supabase.from('projects').select('id, title, emoji, color, status').eq('user_id', uid).eq('status', 'active').order('sort_order').limit(4),
        supabase.from('garden_cores').select('id, title, plant_type, color').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_settings').select('affirmation').eq('user_id', uid).maybeSingle(),
      ]);

      if (focusRes.data) {
        setTodayFocus(focusRes.data.focus_text);
        setFocusDraft(focusRes.data.focus_text);
      }

      const merged = [
        ...(tasksRes.data    || []).map(tk => ({ id: 'task_' + tk.id, title: tk.title,                     source: 'task',    color: c.teal })),
        ...(projRes2.data    || []).map(p  => ({ id: 'proj_' + p.id,  title: `${p.emoji || '🚀'} ${p.title}`, source: 'project', color: p.color || c.gold })),
        ...(capturesRes.data || []).map(n  => ({ id: 'cap_'  + n.id,  title: n.title || 'Untitled note',    source: n.type,    color: c.gold })),
      ].slice(0, 6);
      setTodos(merged);

      if (areasRes.data)  setLifeAreas(areasRes.data);
      if (projRes.data)   setProjects(projRes.data);
      if (ideasRes.data)  setIdeas(ideasRes.data);
      if (settingsRes.data?.affirmation) {
        setAffirmation(settingsRes.data.affirmation);
        setAffirmDraft(settingsRes.data.affirmation);
      }
    } catch (e) { console.warn('HomeScreen loadAll', e); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) await loadAll(userId);
    setRefreshing(false);
  };

  const saveFocus = async () => {
    setTodayFocus(focusDraft); setEditFocus(false);
    if (!userId) return;
    await supabase.from('daily_focus').upsert({
      user_id: userId, focus_text: focusDraft,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const saveAffirmation = async () => {
    setAffirmation(affirmDraft); setEditAffirm(false);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, affirmation: affirmDraft });
  };

  const addTodo = async () => {
    if (!todoInput.trim()) return;
    const item = {
      title: todoInput.trim(), category: 'personal', priority: 2,
      completed: false, due_date: new Date().toISOString().split('T')[0],
      sort_order: todos.length, ...(userId ? { user_id: userId } : {}),
    };
    const { data } = userId
      ? await supabase.from('tasks').insert(item).select().single()
      : { data: { ...item, id: Date.now().toString() } };
    if (data) setTodos(prev => [...prev, { id: 'task_' + data.id, title: data.title, source: 'task', color: c.teal }]);
    setTodoInput(''); setShowTodoInput(false);
  };

  const completeTodo = async (id) => {
    setTodos(prev => prev.filter(tk => tk.id !== id));
    const rawId = id.replace(/^(task_|proj_|cap_)/, '');
    if (userId && id.startsWith('task_'))
      await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', rawId);
  };

  const areaDef   = LIFE_AREAS[areaIndex];
  const savedArea = lifeAreas.find(a => a.label?.toLowerCase() === areaDef?.label?.toLowerCase());
  const areaRating = savedArea?.progress || 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Date + streak ── */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{dateStr}</Text>
          {(streakDays || 0) > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streakDays} day streak</Text>
            </View>
          )}
        </View>

        {/* ── Wizard + buttons ── */}
        <View style={styles.card}>
          <WizardCharacter mood={wizardMood} name={displayName} c={c} />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.bg2, borderColor: c.border }]}
              onPress={() => navigation.navigate('Library')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionGlyph}>📚</Text>
              <Text style={[styles.actionText, { color: c.teal }]}>STUDY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.gold }]}
              onPress={() => navigation.navigate('Games')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionGlyph}>✦</Text>
              <Text style={[styles.actionText, { color: '#fff' }]}>PLAY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quote + affirmation ── */}
        <View style={[styles.quoteCard, { borderLeftColor: c.teal }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.sm }}>
            <Text style={styles.quoteLabel}>✦ Today's Wisdom</Text>
            <TouchableOpacity onPress={() => setEditAffirm(true)}>
              <Ionicons name="add-circle-outline" size={20} color={c.gold} />
            </TouchableOpacity>
          </View>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          {affirmation ? (
            <TouchableOpacity
              onPress={() => setEditAffirm(true)}
              style={{ marginTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.sm }}
            >
              <Text style={[styles.quoteLabel, { color: c.gold }]}>💛 My Affirmation</Text>
              <Text style={[styles.quoteText, { fontStyle: 'normal' }]}>{affirmation}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Focus + calendar side by side ── */}
        <View style={[styles.section, { flexDirection: 'row', gap: s.sm }]}>
          <TouchableOpacity style={[styles.focusCard, { flex: 1 }]} onPress={() => setEditFocus(true)}>
            <Ionicons name="bookmark" size={14} color={c.teal} />
            <Text style={styles.focusText} numberOfLines={2}>
              {todayFocus || "Set today's focus..."}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calBox} onPress={() => setShowCalendar(true)}>
            <Text style={styles.calDay}>{today.getDate()}</Text>
            <Text style={styles.calMonth}>
              {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── On the desk ── */}
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
              <Text style={styles.emptyText}>Add priorities from your projects, notes and ideas</Text>
            </TouchableOpacity>
          ) : (
            todos.map(todo => (
              <View key={todo.id} style={styles.todoRow}>
                <TouchableOpacity onPress={() => completeTodo(todo.id)} style={styles.todoCheck}>
                  <Ionicons name="ellipse-outline" size={20} color={c.teal} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
                  <Text style={[styles.todoSource, { color: todo.color }]}>{todo.source}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Life area rotating carousel ── */}
        {areaDef && (
          <View style={styles.section}>
            <SectionHead title="Life Areas" action="See all" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <TouchableOpacity
              style={[styles.areaSnapshot, { borderColor: areaDef.color }]}
              onPress={() => navigation.navigate('Library', {
                screen: 'LifeAreaScreen',
                params: { areaId: areaDef.id, rating: areaRating, lastCheck: savedArea?.last_check_date || null, linkedItems: [] },
              })}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 32 }}>{areaDef.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.text1 }}>{areaDef.label}</Text>
                  <Text style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>{areaDef.subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: areaDef.color, lineHeight: 30 }}>
                    {areaRating || '—'}
                  </Text>
                  <Text style={{ fontSize: 9, color: c.text4 }}>/5</Text>
                </View>
              </View>
              <View style={{ height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: areaDef.color, width: `${(areaRating / 5) * 100}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {LIFE_AREAS.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { clearInterval(areaTimer.current); setAreaIndex(i); }}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <View style={{
                      width: i === areaIndex ? 18 : 6, height: 6, borderRadius: 3,
                      backgroundColor: i === areaIndex ? areaDef.color : c.bg2,
                    }} />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Active projects ── */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <SectionHead title="Active Projects" action="See all" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {projects.map(proj => (
                  <View key={proj.id} style={[styles.projectCard, { borderLeftColor: proj.color || c.teal }]}>
                    <Text style={{ fontSize: 24 }}>{proj.emoji || '🚀'}</Text>
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

        {/* ── Latest ideas ── */}
        {ideas.length > 0 && (
          <View style={styles.section}>
            <SectionHead title="Latest Ideas" action="Garden" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {ideas.map(idea => (
                  <View key={idea.id} style={[styles.ideaCard, { borderColor: idea.color || c.teal }]}>
                    <Text style={{ fontSize: 28 }}>
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
              style={styles.modalInput} value={focusDraft} onChangeText={setFocusDraft}
              placeholder="What matters most today?" placeholderTextColor={c.text4} multiline autoFocus
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
      <Modal visible={editAffirm} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💛 My Affirmation</Text>
            <Text style={styles.modalHint}>Write something you want to remind yourself of every day.</Text>
            <TextInput
              style={styles.modalInput} value={affirmDraft} onChangeText={setAffirmDraft}
              placeholder="I am capable of..." placeholderTextColor={c.text4} multiline autoFocus
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

      {/* ── Calendar modal ── */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        userId={userId}
        initialDate={today}
      />
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: c.bg0 },
  dateRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm },
  dateText:        { fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.8 },
  streakBadge:     { backgroundColor: c.goldLight || c.bg1, borderRadius: 12, paddingHorizontal: s.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: c.gold },
  streakText:      { fontSize: t.xs, color: c.gold, fontWeight: t.semibold },
  card:            { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border, ...sh.sm },
  actionRow:       { flexDirection: 'row', gap: 10, marginTop: s.md },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 0.5, borderRadius: r.xl, paddingVertical: s.md },
  actionGlyph:     { fontSize: 14 },
  actionText:      { fontSize: t.lg, fontWeight: t.bold, letterSpacing: 1 },
  quoteCard:       { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.border },
  quoteLabel:      { fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm, fontWeight: t.semibold },
  quoteText:       { fontSize: t.sm, color: c.text1, lineHeight: 20, fontStyle: 'italic', marginBottom: s.sm },
  quoteAuthor:     { fontSize: t.xs, color: c.text3 },
  section:         { paddingHorizontal: s.lg, marginBottom: s.lg },
  focusCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border },
  focusText:       { flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 20 },
  calBox:          { backgroundColor: c.bg1, borderRadius: r.md, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  calDay:          { fontSize: t.xxl, fontWeight: t.bold, color: c.text1, lineHeight: 28 },
  calMonth:        { fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5 },
  todoInputRow:    { flexDirection: 'row', gap: s.sm, marginBottom: s.sm },
  todoInput:       { flex: 1, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border },
  todoAddBtn:      { backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', justifyContent: 'center' },
  emptyCard:       { flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, borderStyle: 'dashed' },
  emptyText:       { flex: 1, fontSize: t.sm, color: c.text4 },
  todoRow:         { flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border },
  todoCheck:       { padding: 2 },
  todoTitle:       { fontSize: t.sm, color: c.text1, fontWeight: t.medium },
  todoSource:      { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  areaSnapshot:    { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 1.5 },
  projectCard:     { width: 130, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, gap: s.xs },
  projectTitle:    { fontSize: t.xs, fontWeight: t.semibold, color: c.text1, lineHeight: 16 },
  projectBadge:    { alignSelf: 'flex-start', borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  projectBadgeText:{ fontSize: 9, fontWeight: t.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  ideaCard:        { width: 110, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 1, alignItems: 'center', gap: 6 },
  ideaTitle:       { fontSize: 11, fontWeight: t.medium, color: c.text1, textAlign: 'center', lineHeight: 15 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: c.modalBg || c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xxl, borderTopWidth: 0.5, borderColor: c.border },
  modalTitle:      { fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  modalHint:       { fontSize: t.xs, color: c.text3, marginBottom: s.md },
  modalInput:      { borderWidth: 1, borderColor: c.inputBorder || c.border, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.inputBg || c.bg0, minHeight: 80, textAlignVertical: 'top', marginBottom: s.md },
  modalBtns:       { flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm },
  cancelBtn:       { paddingVertical: s.md, paddingHorizontal: s.lg },
  cancelText:      { fontSize: t.sm, color: c.text3 },
  saveBtn:         { backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl, alignItems: 'center' },
  saveBtnText:     { color: '#fff', fontWeight: t.bold, fontSize: t.sm },
});
