// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Modal, KeyboardAvoidingView,
  Platform, Animated, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { supabase } from '../api/supabaseClient';
import CalendarModal from '../components/CalendarModal';

// ─── Life areas config (matches planner + onboarding) ────────────────────────
const LIFE_AREAS_CONFIG = [
  { key: 'physical',     emoji: '💪', label: 'Physical',     color: '#e05858' },
  { key: 'mental',       emoji: '🧠', label: 'Mental',       color: '#8b4fc4' },
  { key: 'social',       emoji: '🤝', label: 'Social',       color: '#2bb5a0' },
  { key: 'financial',    emoji: '💰', label: 'Financial',    color: '#3ac860' },
  { key: 'professional', emoji: '🚀', label: 'Professional', color: '#c9a84c' },
  { key: 'spiritual',    emoji: '✨', label: 'Spiritual',    color: '#6b9fe8' },
  { key: 'creative',     emoji: '🎨', label: 'Creative',     color: '#e0a830' },
  { key: 'digital',      emoji: '💻', label: 'Digital',      color: '#5a9ae0' },
];

// ─── Quotes pool ──────────────────────────────────────────────────────────────
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

// ─── Default focus presets ────────────────────────────────────────────────────
const DEFAULT_PRESETS = [
  'Deep work session',
  'Clear my inbox',
  'Learn something new',
  'Exercise and move',
  'Connect with someone',
  'Work on my project',
  'Rest and recharge',
  'Plan the week ahead',
];

function getTodaysQuote(pool) {
  if (!pool || pool.length === 0) return QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];
  return pool[Math.floor(Date.now() / 86400000) % pool.length];
}

// ─── Space traveler character ─────────────────────────────────────────────────
const SUIT_COLORS = {
  teal:   '#2bb5a0', gold:   '#c9a84c', purple: '#8b4fc4',
  red:    '#e05858', blue:   '#3a7bd5', green:  '#3ac860',
  orange: '#e07a30', silver: '#9a9aa8',
};
const HELMET_EMOJIS = { classic: '🪖', visor: '⛑️', bubble: '🌐', stealth: '🕶️' };
const BADGE_EMOJIS  = { explorer: '🧭', builder: '🏗️', scholar: '📚', guardian: '🛡️', pioneer: '🌟', creator: '🎨' };

const TRAVELER_MOODS = {
  happy:       { msg: "Ready for today's mission!" },
  focused:     { msg: 'Your focus is locked in.' },
  celebrating: { msg: "You're on a streak! 🔥" },
  resting:     { msg: 'Rest is part of the mission.' },
};

function TravelerCharacter({ mood = 'happy', profile, c, onPress }) {
  const suitColor   = SUIT_COLORS[profile?.suit_color]   || '#2bb5a0';
  const helmetEmoji = HELMET_EMOJIS[profile?.helmet_style] || '🪖';
  const badgeEmoji  = BADGE_EMOJIS[profile?.badge]         || '🧭';
  const name        = profile?.traveler_name || profile?.display_name || 'Traveler';
  const moodData    = TRAVELER_MOODS[mood] || TRAVELER_MOODS.happy;

  return (
    <TouchableOpacity style={trav.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={[trav.suit, { backgroundColor: suitColor + '22', borderColor: suitColor + '66' }]}>
        <Text style={trav.helmet}>{helmetEmoji}</Text>
        <View style={[trav.suitBody, { backgroundColor: suitColor + '44' }]}>
          <Text style={trav.badge}>{badgeEmoji}</Text>
        </View>
      </View>
      <View style={[trav.nameTag, { borderColor: suitColor }]}>
        <Text style={[trav.name, { color: suitColor }]}>{name}</Text>
      </View>
      <Text style={[trav.msg, { color: c.text3 }]}>{moodData.msg}</Text>
      <Text style={{ fontSize: 9, color: c.text4, marginTop: 2 }}>tap to view profile</Text>
    </TouchableOpacity>
  );
}
const trav = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 8 },
  suit:     { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  helmet:   { fontSize: 38, marginBottom: -4 },
  suitBody: { width: 44, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badge:    { fontSize: 16 },
  nameTag:  { borderWidth: 0.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 4 },
  name:     { fontSize: 13, fontWeight: '700' },
  msg:      { fontSize: 11, fontStyle: 'italic' },
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

// ─── Life area mini circles ───────────────────────────────────────────────────
function LifeAreaCircles({ areas, activeAreas, agendaByArea, onPress, c, t, s }) {
  // Only show active areas from onboarding, or all if none set
  const toShow = activeAreas?.length > 0
    ? LIFE_AREAS_CONFIG.filter(a => activeAreas.includes(a.key))
    : LIFE_AREAS_CONFIG;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, justifyContent: 'center' }}>
      {toShow.map(area => {
        const remaining = agendaByArea[area.key] || 0;
        const hasItems  = remaining > 0;
        return (
          <TouchableOpacity key={area.key} onPress={() => onPress(area)}
            style={{ alignItems: 'center', gap: 4, width: 56 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: area.color + (hasItems ? '33' : '15'),
              borderWidth: hasItems ? 2 : 1,
              borderColor: area.color + (hasItems ? 'cc' : '44'),
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 20 }}>{area.emoji}</Text>
              {hasItems && (
                <View style={{ position: 'absolute', top: -3, right: -3, backgroundColor: area.color, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>{remaining}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 9, color: hasItems ? area.color : c.text4, fontWeight: hasItems ? '700' : '400', textAlign: 'center' }} numberOfLines={1}>
              {area.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Area detail modal ────────────────────────────────────────────────────────
function AreaDetailModal({ area, items, visible, onClose, c, t, s, r }) {
  if (!area) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '70%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.lg }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: area.color + '33', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{area.emoji}</Text>
            </View>
            <View>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{area.label}</Text>
              <Text style={{ fontSize: t.xs, color: area.color }}>{items.length} remaining today</Text>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: s.xl }}>
                <Text style={{ fontSize: 36, marginBottom: s.sm }}>✅</Text>
                <Text style={{ fontSize: t.md, color: c.text3 }}>All done for today!</Text>
              </View>
            ) : (
              items.map((item, i) => (
                <View key={item.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderLeftWidth: 3, borderLeftColor: area.color }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: area.color }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, color: c.text1 }}>{item.title}</Text>
                    {item.start_time && <Text style={{ fontSize: t.xs, color: area.color, marginTop: 2 }}>{item.start_time}</Text>}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity onPress={onClose}
            style={{ backgroundColor: area.color, borderRadius: r.md, padding: s.md, alignItems: 'center', marginTop: s.md }}>
            <Text style={{ color: '#fff', fontWeight: t.bold }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Focus modal with presets ─────────────────────────────────────────────────
function FocusModal({ visible, draft, setDraft, onSave, onClose, presets, onAddPreset, onDeletePreset, c, t, s, r }) {
  const [newPreset, setNewPreset] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '85%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>✦ Today's Focus</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: c.teal, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.bg0, minHeight: 60, textAlignVertical: 'top', marginBottom: s.lg }}
            value={draft} onChangeText={setDraft}
            placeholder="What matters most today?" placeholderTextColor={c.text4}
            multiline autoFocus
          />

          {/* Presets */}
          <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Presets</Text>
          <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.sm }}>
              {presets.map((preset, i) => (
                <TouchableOpacity key={i} onPress={() => setDraft(preset)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: draft === preset ? c.teal + '33' : c.bg0, borderRadius: r.full, paddingHorizontal: s.sm, paddingVertical: 6, borderWidth: 1, borderColor: draft === preset ? c.teal : c.border }}>
                  <Text style={{ fontSize: t.xs, color: draft === preset ? c.teal : c.text2 }}>{preset}</Text>
                  <TouchableOpacity onPress={() => onDeletePreset(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Ionicons name="close-circle" size={13} color={draft === preset ? c.teal : c.text4} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowPresetInput(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: r.full, paddingHorizontal: s.sm, paddingVertical: 6, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' }}>
                <Ionicons name="add" size={13} color={c.text4} />
                <Text style={{ fontSize: t.xs, color: c.text4 }}>Add preset</Text>
              </TouchableOpacity>
            </View>
            {showPresetInput && (
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.sm, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
                  value={newPreset} onChangeText={setNewPreset}
                  placeholder="New preset..." placeholderTextColor={c.text4}
                  autoFocus
                />
                <TouchableOpacity onPress={() => { if (newPreset.trim()) { onAddPreset(newPreset.trim()); setNewPreset(''); setShowPresetInput(false); } }}
                  style={{ backgroundColor: c.teal, borderRadius: r.md, padding: s.sm, justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm, marginTop: s.md }}>
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: s.md, paddingHorizontal: s.lg }}>
              <Text style={{ fontSize: t.sm, color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave}
              style={{ backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl }}>
              <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Affirmation modal with rotation pool ────────────────────────────────────
function AffirmationModal({ visible, affirmations, onSave, onClose, c, t, s, r }) {
  const [input, setInput] = useState('');
  const [list,  setList]  = useState(affirmations || []);

  useEffect(() => { setList(affirmations || []); }, [affirmations]);

  const add = () => {
    if (!input.trim()) return;
    setList(prev => [...prev, input.trim()]);
    setInput('');
  };

  const remove = (i) => setList(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '85%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.xs }}>💛 My Affirmations</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.lg }}>Add multiple — they rotate each day on your dashboard.</Text>

          {/* Add input */}
          <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.md }}>
            <TextInput
              style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
              value={input} onChangeText={setInput}
              placeholder="I am capable of..." placeholderTextColor={c.text4}
              onSubmitEditing={add}
            />
            <TouchableOpacity onPress={add}
              style={{ backgroundColor: c.gold, borderRadius: r.md, padding: s.md, justifyContent: 'center' }}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {list.length === 0 ? (
              <Text style={{ fontSize: t.sm, color: c.text4, textAlign: 'center', paddingVertical: s.lg }}>
                No affirmations yet — add one above
              </Text>
            ) : (
              list.map((aff, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderLeftWidth: 3, borderLeftColor: c.gold }}>
                  <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{aff}</Text>
                  <TouchableOpacity onPress={() => remove(i)}>
                    <Ionicons name="close-circle-outline" size={18} color={c.text4} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm, marginTop: s.lg }}>
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: s.md, paddingHorizontal: s.lg }}>
              <Text style={{ fontSize: t.sm, color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(list)}
              style={{ backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl }}>
              <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Save all</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { profile, streakDays } = useUserProgress();

  const [refreshing,      setRefreshing]     = useState(false);
  const [userId,          setUserId]         = useState(null);

  // Focus
  const [todayFocus,     setTodayFocus]     = useState('');
  const [focusDraft,     setFocusDraft]     = useState('');
  const [editFocus,      setEditFocus]      = useState(false);
  const [focusPresets,   setFocusPresets]   = useState([...DEFAULT_PRESETS]);

  // Affirmations — pool that rotates
  const [affirmations,   setAffirmations]   = useState([]);
  const [editAffirm,     setEditAffirm]     = useState(false);

  // Todos / desk
  const [todos,          setTodos]          = useState([]);
  const [todoInput,      setTodoInput]      = useState('');
  const [showTodoInput,  setShowTodoInput]  = useState(false);

  // Projects + ideas
  const [projects,       setProjects]       = useState([]);
  const [ideas,          setIdeas]          = useState([]);

  // Life area circles
  const [activeAreas,    setActiveAreas]    = useState([]);
  const [agendaByArea,   setAgendaByArea]   = useState({});
  const [areaItems,      setAreaItems]      = useState({});
  const [selectedArea,   setSelectedArea]   = useState(null);
  const [showAreaModal,  setShowAreaModal]  = useState(false);

  // Calendar
  const [showCalendar,   setShowCalendar]   = useState(false);

  const today   = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Rotating affirmation — changes each day
  const todaysAffirmation = affirmations.length > 0
    ? affirmations[Math.floor(Date.now() / 86400000) % affirmations.length]
    : null;

  const todaysQuote = getTodaysQuote(null);

  const wizardMood = (streakDays || 0) >= 3 ? 'celebrating' : todayFocus ? 'focused' : 'happy';

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
      const [
        focusRes, tasksRes, projRes, capturesRes,
        projActiveRes, ideasRes, settingsRes, profileRes,
        agendaRes,
      ] = await Promise.all([
        supabase.from('daily_focus').select('focus_text').eq('user_id', uid).eq('date', todayStr).maybeSingle(),
        supabase.from('tasks').select('id, title').eq('user_id', uid).eq('completed', false).order('priority').limit(3),
        supabase.from('projects').select('id, title, emoji, color').eq('user_id', uid).eq('status', 'active').limit(3),
        supabase.from('captures').select('id, title, type').eq('user_id', uid).eq('status', 'inbox').limit(2),
        supabase.from('projects').select('id, title, emoji, color, status').eq('user_id', uid).eq('status', 'active').order('sort_order').limit(4),
        supabase.from('garden_cores').select('id, title, plant_type, color').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_settings').select('affirmation, focus_presets').eq('user_id', uid).maybeSingle(),
        supabase.from('profiles').select('active_life_areas, suit_color, helmet_style, badge, traveler_name, display_name').eq('id', uid).maybeSingle(),
        supabase.from('agenda_instances').select('id, title, area, start_time, completed').eq('user_id', uid).eq('date', todayStr).eq('completed', false).eq('skipped', false),
      ]);

      // Focus
      if (focusRes.data) { setTodayFocus(focusRes.data.focus_text); setFocusDraft(focusRes.data.focus_text); }

      // Desk todos — merge tasks, projects, captures
      const merged = [
        ...(tasksRes.data    || []).map(tk => ({ id: 'task_' + tk.id, title: tk.title,                         source: 'task',    color: c.teal })),
        ...(projRes.data     || []).map(p  => ({ id: 'proj_' + p.id,  title: `${p.emoji || '🚀'} ${p.title}`,  source: 'project', color: p.color || c.gold })),
        ...(capturesRes.data || []).map(n  => ({ id: 'cap_'  + n.id,  title: n.title || 'Untitled note',        source: n.type,    color: c.gold })),
      ].slice(0, 6);
      setTodos(merged);

      // Projects + ideas
      if (projActiveRes.data) setProjects(projActiveRes.data);
      if (ideasRes.data)      setIdeas(ideasRes.data);

      // Affirmations — stored as JSON array in user_settings
      if (settingsRes.data) {
        if (settingsRes.data.affirmation) {
          // Legacy single affirmation — migrate to array
          try {
            const parsed = JSON.parse(settingsRes.data.affirmation);
            setAffirmations(Array.isArray(parsed) ? parsed : [settingsRes.data.affirmation]);
          } catch {
            setAffirmations([settingsRes.data.affirmation]);
          }
        }
        if (settingsRes.data.focus_presets) {
          try {
            const parsed = JSON.parse(settingsRes.data.focus_presets);
            if (Array.isArray(parsed)) setFocusPresets(parsed);
          } catch {}
        }
      }

      // Active life areas from profile (set during onboarding)
      if (profileRes.data?.active_life_areas?.length > 0) {
        setActiveAreas(profileRes.data.active_life_areas);
      }

      // Agenda items grouped by area for circles
      const agenda = agendaRes.data || [];
      const byArea = {};
      const byAreaItems = {};
      agenda.forEach(inst => {
        byArea[inst.area] = (byArea[inst.area] || 0) + 1;
        if (!byAreaItems[inst.area]) byAreaItems[inst.area] = [];
        byAreaItems[inst.area].push(inst);
      });
      setAgendaByArea(byArea);
      setAreaItems(byAreaItems);

    } catch (e) { console.warn('HomeScreen loadAll', e); }
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  // Focus handlers
  const saveFocus = async () => {
    setTodayFocus(focusDraft); setEditFocus(false);
    if (!userId) return;
    await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: focusDraft, date: todayStr });
  };

  const savePresets = async (newPresets) => {
    setFocusPresets(newPresets);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, focus_presets: JSON.stringify(newPresets) });
  };

  const addPreset = (val) => {
    const next = [...focusPresets, val];
    savePresets(next);
  };

  const deletePreset = (i) => {
    const next = focusPresets.filter((_, idx) => idx !== i);
    savePresets(next);
  };

  // Affirmation handlers
  const saveAffirmations = async (list) => {
    setAffirmations(list);
    setEditAffirm(false);
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, affirmation: JSON.stringify(list) });
  };

  // Desk handlers
  const addTodo = async () => {
    if (!todoInput.trim()) return;
    const item = { title: todoInput.trim(), category: 'personal', priority: 2, completed: false, due_date: todayStr, sort_order: todos.length, ...(userId ? { user_id: userId } : {}) };
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

  // Area circle tap
  const handleAreaPress = (area) => {
    setSelectedArea(area);
    setShowAreaModal(true);
  };

  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Date + streak ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
          <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{dateStr}</Text>
          {(streakDays || 0) > 0 && (
            <View style={{ backgroundColor: c.bg1, borderRadius: 12, paddingHorizontal: s.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: c.gold }}>
              <Text style={{ fontSize: t.xs, color: c.gold, fontWeight: t.semibold }}>🔥 {streakDays} day streak</Text>
            </View>
          )}
        </View>

        {/* ── Traveler + buttons ── */}
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border }}>
          <TravelerCharacter
            mood={wizardMood}
            profile={profile}
            c={c}
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: s.md }}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 0.5, borderColor: c.border, backgroundColor: c.bg2, borderRadius: r.xl, paddingVertical: s.md }}
              onPress={() => navigation.navigate('Library')}>
              <Text style={{ fontSize: 14 }}>📚</Text>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.teal, letterSpacing: 1 }}>STUDY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.gold, borderRadius: r.xl, paddingVertical: s.md }}
              onPress={() => navigation.navigate('Games')}>
              <Text style={{ fontSize: 14 }}>✦</Text>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: '#fff', letterSpacing: 1 }}>PLAY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quote + affirmation ── */}
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderLeftWidth: 3, borderLeftColor: c.teal, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.sm }}>
            <Text style={{ fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.semibold }}>✦ Today's Wisdom</Text>
            <TouchableOpacity onPress={() => setEditAffirm(true)}>
              <Ionicons name="add-circle-outline" size={20} color={c.gold} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20, fontStyle: 'italic', marginBottom: s.sm }}>"{todaysQuote.text}"</Text>
          <Text style={{ fontSize: t.xs, color: c.text3 }}>— {todaysQuote.author}</Text>
          {todaysAffirmation && (
            <TouchableOpacity onPress={() => setEditAffirm(true)}
              style={{ marginTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.sm }}>
              <Text style={{ fontSize: 10, color: c.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>💛 My Affirmation</Text>
              <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{todaysAffirmation}</Text>
              {affirmations.length > 1 && (
                <Text style={{ fontSize: 9, color: c.text4, marginTop: 4 }}>{affirmations.length} affirmations rotating daily</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Focus + calendar side by side ── */}
        <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg, flexDirection: 'row', gap: s.sm }}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border }}
            onPress={() => { setFocusDraft(todayFocus); setEditFocus(true); }}>
            <Ionicons name="bookmark" size={14} color={c.teal} />
            <Text style={{ flex: 1, fontSize: t.sm, color: todayFocus ? c.text1 : c.text4, lineHeight: 20 }} numberOfLines={2}>
              {todayFocus || "Set today's focus..."}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: c.bg1, borderRadius: r.md, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center', minWidth: 70 }}
            onPress={() => setShowCalendar(true)}>
            <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, lineHeight: 28 }}>{today.getDate()}</Text>
            <Text style={{ fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Life area circles ── */}
        <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg }}>
          <SectionHead title="Life Areas" action="Planner →" onAction={() => navigation.navigate('Library', { screen: 'PlannerScreen' })} c={c} t={t} />
          <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
            <LifeAreaCircles
              areas={LIFE_AREAS_CONFIG}
              activeAreas={activeAreas}
              agendaByArea={agendaByArea}
              onPress={handleAreaPress}
              c={c} t={t} s={s}
            />
            {Object.values(agendaByArea).some(v => v > 0) && (
              <Text style={{ fontSize: 10, color: c.text4, textAlign: 'center', marginTop: s.sm }}>
                Tap a circle to see what's left today
              </Text>
            )}
          </View>
        </View>

        {/* ── On the desk ── */}
        <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg }}>
          <SectionHead title="On the Desk" action="+ Add" onAction={() => setShowTodoInput(true)} c={c} t={t} />
          {showTodoInput && (
            <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
              <TextInput
                style={{ flex: 1, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
                value={todoInput} onChangeText={setTodoInput}
                placeholder="What needs to get done?" placeholderTextColor={c.text4}
                autoFocus onSubmitEditing={addTodo}
              />
              <TouchableOpacity style={{ backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', justifyContent: 'center' }} onPress={addTodo}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {todos.length === 0 && !showTodoInput ? (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, borderStyle: 'dashed' }}
              onPress={() => setShowTodoInput(true)}>
              <Ionicons name="add-circle-outline" size={20} color={c.text4} />
              <Text style={{ flex: 1, fontSize: t.sm, color: c.text4 }}>Add priorities from your projects, notes and ideas</Text>
            </TouchableOpacity>
          ) : (
            todos.map(todo => (
              <View key={todo.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                <TouchableOpacity onPress={() => completeTodo(todo.id)} style={{ padding: 2 }}>
                  <Ionicons name="ellipse-outline" size={20} color={c.teal} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: t.medium }} numberOfLines={1}>{todo.title}</Text>
                  <Text style={{ fontSize: 9, color: todo.color, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{todo.source}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Active projects ── */}
        {projects.length > 0 && (
          <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg }}>
            <SectionHead title="Active Missions" action="See all" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {projects.map(proj => (
                  <View key={proj.id} style={{ width: 130, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: proj.color || c.teal, gap: s.xs }}>
                    <Text style={{ fontSize: 24 }}>{proj.emoji || '🚀'}</Text>
                    <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text1, lineHeight: 16 }} numberOfLines={2}>{proj.title}</Text>
                    <View style={{ alignSelf: 'flex-start', backgroundColor: (proj.color || c.teal) + '22', borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: t.bold, color: proj.color || c.teal, textTransform: 'uppercase', letterSpacing: 0.5 }}>active</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Latest ideas ── */}
        {ideas.length > 0 && (
          <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg }}>
            <SectionHead title="Latest Ideas" action="Garden" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {ideas.map(idea => (
                  <View key={idea.id} style={{ width: 110, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: idea.color || c.teal, alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 28 }}>
                      {idea.plant_type === 'tree' ? '🌳' : idea.plant_type === 'flower' ? '🌸' : idea.plant_type === 'plant' ? '🌿' : '🌱'}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: t.medium, color: c.text1, textAlign: 'center', lineHeight: 15 }} numberOfLines={2}>{idea.title}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Focus modal ── */}
      <FocusModal
        visible={editFocus}
        draft={focusDraft}
        setDraft={setFocusDraft}
        onSave={saveFocus}
        onClose={() => setEditFocus(false)}
        presets={focusPresets}
        onAddPreset={addPreset}
        onDeletePreset={deletePreset}
        c={c} t={t} s={s} r={r}
      />

      {/* ── Affirmation modal ── */}
      <AffirmationModal
        visible={editAffirm}
        affirmations={affirmations}
        onSave={saveAffirmations}
        onClose={() => setEditAffirm(false)}
        c={c} t={t} s={s} r={r}
      />

      {/* ── Area detail modal ── */}
      <AreaDetailModal
        area={selectedArea}
        items={selectedArea ? (areaItems[selectedArea.key] || []) : []}
        visible={showAreaModal}
        onClose={() => setShowAreaModal(false)}
        c={c} t={t} s={s} r={r}
      />

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
