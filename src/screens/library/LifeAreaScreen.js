// src/screens/library/LifeAreaScreen.js
// Dynamic life area screen — uses ThemeContext for light/dark

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';
import RelatedLinks, { EXCLUDE_LINK_FILTER } from './RelatedLinks';
import TourSpot from '../../components/TourSpot';
import { todayStr } from '../../logic/dateUtils';

// ─── Life area config ─────────────────────────────────────────────────────────
export const LIFE_AREAS = [
  {
    id: 'physical', label: 'Physical', emoji: '💪', icon: 'fitness',
    color: '#e05c5c',
    subtitle: 'Fitness, nutrition, sleep & energy',
    description: 'Your body is your foundation. Track how you eat, move, rest and recover.',
    sections: [
      { title: 'Fitness & Movement', icon: 'barbell-outline',   screen: 'ExerciseScreen',  items: ['Workouts', 'Steps & activity', 'Stretching', 'Sports'] },
      { title: 'Nutrition',          icon: 'nutrition-outline', screen: 'NutritionScreen', items: ['Meal tracking', 'Hydration', 'Supplements', 'Food goals'] },
      { title: 'Sleep & Recovery',   icon: 'moon-outline',      screen: 'SleepRecoveryScreen', items: ['Sleep schedule', 'Rest days', 'Recovery habits'] },
      { title: 'Energy & Vitality',  icon: 'flash-outline',     screen: 'EnergyVitalityScreen', items: ['Energy levels', 'Stress on body', 'Health checkups'] },
    ],
    weeklyPrompt: 'How did you treat your body this week? Workouts, food, sleep?',
    quickLog: ['Completed workout', 'Drank enough water', 'Got 8h sleep', 'Ate healthy meals', 'Took a rest day'],
  },
  {
    id: 'mental', label: 'Mental', emoji: '🧠', icon: 'bulb',
    color: '#7eb8e0',
    subtitle: 'Emotions, stress, mindfulness & therapy',
    description: 'Mental health is the lens through which you experience everything else.',
    sections: [
      { title: 'Emotional Well-being', icon: 'heart-outline',   screen: 'WellbeingScreen', items: ['Mood tracking', 'Journaling', 'Processing emotions'] },
      { title: 'Stress & Anxiety',     icon: 'pulse-outline',   screen: 'StressAnxietyScreen', items: ['Stress triggers', 'Coping strategies', 'Breathing & grounding'] },
      { title: 'Mindfulness',          icon: 'leaf-outline',    screen: 'SelfCareScreen',  items: ['Meditation', 'Presence practice', 'Gratitude'] },
      { title: 'Therapy & Support',    icon: 'people-outline',  screen: 'TherapySupportScreen', items: ['Therapy notes', 'Support resources', 'Crisis contacts'] },
    ],
    weeklyPrompt: 'How was your mental state this week? What helped, what hurt?',
    quickLog: ['Meditated today', 'Journaled', 'Managed stress well', 'Reached out for support', 'Practiced gratitude'],
  },
  {
    id: 'social', label: 'Social', emoji: '🤝', icon: 'people',
    color: '#b07be0',
    subtitle: 'Relationships, family, friends & community',
    description: 'The people around you shape your life more than almost anything else.',
    sections: [
      { title: 'Relationships',       icon: 'heart-outline',       screen: 'RelationshipsScreen', items: ['Romantic', 'Family', 'Close friends'] },
      { title: 'Network & Community', icon: 'globe-outline',       screen: 'NetworkScreen',       items: ['Colleagues', 'Mentors', 'Community involvement'] },
      { title: 'Communication',       icon: 'chatbubbles-outline', screen: 'CommunicationScreen', items: ['Conflict resolution', 'Active listening', 'Setting boundaries'] },
      { title: 'Social Health',       icon: 'people-outline',      screen: 'SocialHealthScreen', items: ['Quality time', 'Loneliness check', 'New connections'] },
    ],
    weeklyPrompt: 'How were your relationships this week?',
    quickLog: ['Connected with someone', 'Quality family time', 'Made a new connection', 'Resolved a conflict', 'Set a boundary'],
  },
  {
    id: 'financial', label: 'Financial', emoji: '💰', icon: 'cash',
    color: '#4caf7d',
    subtitle: 'Money, budget, savings & income',
    description: 'Financial clarity creates freedom. Know where you stand and where you\'re going.',
    sections: [
      { title: 'Income & Earnings',   icon: 'trending-up-outline', screen: 'IncomeEarningsScreen', items: ['Salary', 'Side income', 'Passive income', 'Income goals'] },
      { title: 'Budget & Spending',   icon: 'wallet-outline',      screen: 'BudgetSpendingScreen', items: ['Monthly budget', 'Expense tracking', 'Subscriptions review'] },
      { title: 'Savings & Investing', icon: 'save-outline',        screen: 'SavingsInvestingScreen', items: ['Emergency fund', 'Investment accounts', 'Retirement'] },
      { title: 'Debt & Credit',       icon: 'card-outline',        screen: 'DebtCreditScreen', items: ['Debt tracking', 'Credit score', 'Payoff strategy'] },
    ],
    weeklyPrompt: 'How was your money this week? Spending, saving, earning?',
    quickLog: ['Stayed on budget', 'Saved money today', 'Tracked expenses', 'Paid off debt', 'Invested this week'],
  },
  {
    id: 'creative', label: 'Creative', emoji: '🎨', icon: 'color-palette',
    color: '#f5a623',
    subtitle: 'Hobbies, art, music & expression',
    description: 'Creativity is how you process the world and contribute something uniquely yours.',
    sections: [
      { title: 'Hobbies & Interests', icon: 'star-outline',        screen: 'HobbiesScreen', items: ['Active hobbies', 'Learning interests', 'Passion projects'] },
      { title: 'Art & Music',         icon: 'musical-notes-outline',screen: 'ArtMusicScreen', items: ['Music practice', 'Visual art', 'Writing', 'Performance'] },
      { title: 'Content & Media',     icon: 'videocam-outline',    screen: 'ContentMediaScreen', items: ['Content creation', 'Photography', 'Video', 'Podcasting'] },
      { title: 'Learning & Curiosity',icon: 'book-outline',        screen: 'LearningCuriosityScreen', items: ['Books', 'Courses', 'Documentaries', 'Deep dives'] },
    ],
    weeklyPrompt: 'Did you make or learn something creative this week?',
    quickLog: ['Made something creative', 'Practiced a skill', 'Finished a book/course', 'Worked on a project', 'Tried something new'],
  },
  {
    id: 'professional', label: 'Professional', emoji: '🚀', icon: 'rocket',
    color: '#c9a84c',
    subtitle: 'Career, skills, projects & growth',
    description: 'Your professional life is where ambition meets action. Build deliberately.',
    sections: [
      { title: 'Career & Jobs',      icon: 'briefcase-outline',  screen: 'CareerExplorationScreen', items: ['Current role', 'Job search', 'Career path', 'Promotions'] },
      { title: 'Skills & Learning',  icon: 'school-outline',     screen: 'ResearchScreen',          items: ['Technical skills', 'Soft skills', 'Certifications'] },
      { title: 'Projects & Work',    icon: 'construct-outline',  screen: 'ProjectsScreen',          items: ['Active projects', 'Deadlines', 'Collaborations'] },
      { title: 'Business & Ventures',icon: 'storefront-outline', screen: 'BusinessVenturesScreen', items: ['Side ventures', 'Ideas pipeline', 'CTH projects'] },
    ],
    weeklyPrompt: 'How did you invest in your professional growth this week?',
    quickLog: ['Completed a work task', 'Learned something new', 'Networked with someone', 'Worked on a side project', 'Achieved a milestone'],
  },
  {
    id: 'spiritual', label: 'Spiritual', emoji: '✨', icon: 'sparkles',
    color: '#c084e0',
    subtitle: 'Purpose, values, reflection & faith',
    description: 'Knowing what you stand for and why gives everything else meaning.',
    sections: [
      { title: 'Purpose & Values',      icon: 'compass-outline', screen: 'PurposeValuesScreen', items: ['Core values', 'Life mission', 'What drives you'] },
      { title: 'Reflection & Prayer',   icon: 'sunny-outline',   screen: 'ReflectionPrayerScreen', items: ['Daily reflection', 'Prayer/meditation', 'Gratitude practice'] },
      { title: 'Philosophy & Wisdom',   icon: 'library-outline', screen: 'PhilosophyWisdomScreen', items: ['Books & teachings', 'Personal philosophy', 'Growth mindset'] },
      { title: 'Community & Faith',     icon: 'people-outline',  screen: 'CommunityFaithScreen', items: ['Faith community', 'Service & giving', 'Shared beliefs'] },
    ],
    weeklyPrompt: 'Did you feel aligned with your values and purpose this week?',
    quickLog: ['Reflected on my values', 'Practiced gratitude', 'Meditated or prayed', 'Did an act of service', 'Felt a sense of purpose'],
  },
  {
    id: 'digital', label: 'Digital', emoji: '💻', icon: 'laptop',
    color: '#64b5f6',
    subtitle: 'Screen time, privacy, security & tools',
    description: 'Your digital life shapes your attention, safety and productivity.',
    sections: [
      { title: 'Privacy & Security',   icon: 'shield-checkmark-outline', screen: 'PrivacyScreen',  items: ['Account security', '2FA', 'Privacy settings', 'Data hygiene'] },
      { title: 'Digital Security',     icon: 'lock-closed-outline',      screen: 'SecurityScreen', items: ['Password manager', 'Secure devices', 'Network safety'] },
      { title: 'Screen Time & Focus',  icon: 'phone-portrait-outline',   screen: 'ScreenTimeFocusScreen', items: ['App usage', 'Social media limits', 'Deep work blocks'] },
      { title: 'Tools & Systems',      icon: 'settings-outline',         screen: 'ToolsSystemsScreen', items: ['Productivity stack', 'Automation', 'Note-taking'] },
    ],
    weeklyPrompt: 'Was your digital life working for you or against you this week?',
    quickLog: ['Stayed within screen limits', 'Ran a security check', 'Cleared digital clutter', 'Focused without phone', 'Updated passwords'],
  },
];

// ─── Quick log chips ──────────────────────────────────────────────────────────
function QuickLogChips({ options, onLog, color, c, t, s }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: s.md }}>
      {options.map((opt, i) => (
        <TouchableOpacity key={i} onPress={() => onLog(opt)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: color + '18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: color + '44' }}>
          <Ionicons name="add-circle" size={13} color={color} />
          <Text style={{ fontSize: t.xs, color, fontWeight: '600' }}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ section, color, onPress, c, t, s, r }) {
  const isNavigable = !!section.screen;
  return (
    <TouchableOpacity
      onPress={isNavigable ? onPress : undefined}
      activeOpacity={isNavigable ? 0.8 : 1}
      style={{
        backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg,
        marginBottom: s.md, borderWidth: 0.5,
        borderColor: isNavigable ? color + '44' : c.border,
        borderLeftWidth: isNavigable ? 3 : 0.5,
        borderLeftColor: isNavigable ? color : c.border,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={section.icon} size={16} color={color} />
          </View>
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{section.title}</Text>
        </View>
        {isNavigable && <Ionicons name="chevron-forward" size={16} color={color} />}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {section.items.map((item, i) => (
          <View key={i} style={{ backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, color: c.text3 }}>{item}</Text>
          </View>
        ))}
      </View>
      {isNavigable && (
        <Text style={{ fontSize: 10, color, marginTop: s.sm, fontWeight: '600' }}>Tap to open →</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────
function NoteCard({ note, color, onDelete, c, t, s, r }) {
  const date = new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 10, color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{date}</Text>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="close" size={14} color={c.text4} />
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{note.content}</Text>
    </View>
  );
}

// ─── Main LifeAreaScreen ──────────────────────────────────────────────────────
export default function LifeAreaScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();

  const { areaId } = route.params || {};
  const area = LIFE_AREAS.find(a => a.id === areaId);

  const [notes,       setNotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);
  const [noteModal,   setNoteModal]   = useState(false);
  const [newNote,     setNewNote]     = useState('');
  const [weeklyNote,  setWeeklyNote]  = useState('');
  const [weekModal,   setWeekModal]   = useState(false);
  const [rating,      setRating]      = useState(0);
  const [saving,      setSaving]      = useState(false);

  if (!area) return null;
  const color = area.color;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadData(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (userId) loadData(userId);
  }, [userId]));

  const loadData = async (uid) => {
    setLoading(true);
    const cacheKey = `life_area_${uid}_${area.id}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) { setNotes(cached.notes || []); if (cached.rating) setRating(cached.rating); }

      if (!(await isOnline())) { setLoading(false); return; }

      const [notesRes, areaRes] = await Promise.all([
        EXCLUDE_LINK_FILTER(supabase.from('area_notes').select('*').eq('user_id', uid).eq('area_id', area.id)).order('created_at', { ascending: false }).limit(20),
        supabase.from('life_areas').select('progress').eq('user_id', uid).eq('label', area.label).maybeSingle(),
      ]);
      if (notesRes.data) setNotes(notesRes.data);
      if (areaRes.data?.progress) setRating(areaRes.data.progress);
      await cacheWrite(cacheKey, { notes: notesRes.data || [], rating: areaRes.data?.progress || null });
    } catch (e) { console.warn('LifeAreaScreen', e); }
    setLoading(false);
  };

  const addNote = async (content) => {
    if (!content.trim()) return;
    const entry = { user_id: userId, area_id: area.id, content: content.trim(), created_at: new Date().toISOString() };
    if (userId) {
      const { row: data } = await offlineWrite(supabase, 'area_notes', entry);
      if (data) setNotes(prev => [data, ...prev]);
    } else {
      setNotes(prev => [{ ...entry, id: Date.now().toString() }, ...prev]);
    }
    setNewNote('');
    setNoteModal(false);
  };

  const deleteNote = async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (userId) await supabase.from('area_notes').delete().eq('id', id);
  };

  const saveRating = async (val) => {
    const prev = rating;
    setRating(val);
    if (!userId || val === prev) return;
    try {
      // Not offlineWrite here — this upserts on the (user_id, label) unique
      // pair, not on id, so offlineWrite's id-based conflict target would
      // create a duplicate row instead of updating this one. The rating
      // note below (which IS a plain insert, no such constraint) is what
      // actually shows in the feed either way, so a failed/offline upsert
      // here just means the summary card is a beat behind, not lost data.
      await supabase.from('life_areas').upsert({ user_id: userId, label: area.label, progress: val, last_check_date: todayStr() }, { onConflict: 'user_id,label' });
    } catch (e) { console.warn('LifeAreaScreen saveRating', e); }
    // Log the change itself so rating history is visible in the feed below,
    // not just the current value.
    const stars = '★'.repeat(val) + '☆'.repeat(5 - val);
    const entry = {
      user_id: userId, area_id: area.id,
      content: `[Rating] ${stars} — rated ${val}/5${prev ? ` (was ${prev}/5)` : ''}`,
      created_at: new Date().toISOString(),
    };
    const { row: data } = await offlineWrite(supabase, 'area_notes', entry);
    if (data) setNotes(p => [data, ...p]);
  };

  const saveWeeklyReflection = async () => {
    if (!weeklyNote.trim()) return;
    setSaving(true);
    await addNote(`[Weekly Reflection] ${weeklyNote.trim()}`);
    setWeeklyNote('');
    setWeekModal(false);
    setSaving(false);
  };

  const navigateTo = (screen) => {
    if (!screen) return;
    navigation.navigate(screen);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Hero banner ── */}
        <View style={{ backgroundColor: color + '18', borderBottomWidth: 1, borderBottomColor: color + '33', padding: s.xl, paddingTop: s.xxl }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.md }}>
            <Ionicons name="chevron-back" size={22} color={color} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.lg }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color + '33', borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
              {showEmojis ? <Text style={{ fontSize: 32 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={30} color={color} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{area.label}</Text>
              {showSubtext && <Text style={{ fontSize: t.xs, color, marginTop: 2, fontWeight: '600' }}>{area.subtitle}</Text>}
              {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 6, lineHeight: 18 }}>{area.description}</Text>}
            </View>
          </View>

          {/* Rating */}
          <TourSpot id="lifearea-rating">
          <View style={{ marginTop: s.lg }}>
            <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>How's this area right now?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1,2,3,4,5].map(val => (
                <TouchableOpacity key={val} onPress={() => saveRating(val)}
                  style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: rating >= val ? color : color + '22', borderWidth: 1, borderColor: color + '55', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: rating >= val ? '#fff' : color }}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          </TourSpot>
        </View>

        <View style={{ padding: s.lg }}>
          {/* ── Quick log ── */}
          <Text style={{ fontSize: t.xs, color: color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm }}>
            {showEmojis ? '⚡ ' : ''}Quick Log
          </Text>
          <TourSpot id="lifearea-quicklog">
          <QuickLogChips options={area.quickLog} onLog={(opt) => addNote(opt)} color={color} c={c} t={t} s={s} />
          </TourSpot>

          {/* ── Sections ── */}
          <Text style={{ fontSize: t.xs, color: color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm, marginTop: s.md }}>
            {showEmojis ? '📋 ' : ''}Sub-Sections
          </Text>
          <TourSpot id="lifearea-sections">
          {area.sections.map((sec, i) => (
            <SectionCard key={i} section={sec} color={color}
              onPress={() => navigateTo(sec.screen)}
              c={c} t={t} s={s} r={r} />
          ))}
          </TourSpot>

          {/* ── Related ── */}
          <Text style={{ fontSize: t.xs, color: color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm, marginTop: s.md }}>
            {showEmojis ? '🔗 ' : ''}Related
          </Text>
          <View style={{ marginBottom: s.lg }}>
            <RelatedLinks areaId={area.id} color={color} c={c} t={t} s={s} r={r} />
          </View>

          {/* ── Weekly reflection ── */}
          <TourSpot id="lifearea-reflection">
          <TouchableOpacity onPress={() => setWeekModal(true)}
            style={{ backgroundColor: color + '18', borderRadius: r.lg, padding: s.lg, borderWidth: 1, borderColor: color + '44', marginBottom: s.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <Ionicons name="journal-outline" size={18} color={color} />
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Weekly Reflection</Text>
            </View>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 6, lineHeight: 18 }}>{area.weeklyPrompt}</Text>
            <Text style={{ fontSize: t.xs, color, marginTop: 8, fontWeight: '600' }}>Tap to reflect →</Text>
          </TouchableOpacity>
          </TourSpot>

          {/* ── Add note button ── */}
          <TouchableOpacity onPress={() => setNoteModal(true)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, backgroundColor: color, borderRadius: r.md, padding: s.md, marginBottom: s.lg }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Add Note</Text>
          </TouchableOpacity>

          {/* ── Notes feed ── */}
          {loading ? <ActivityIndicator color={color} /> : (
            <>
              {notes.length > 0 && (
                <Text style={{ fontSize: t.xs, color: color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm }}>
                  {showEmojis ? '📝 ' : ''}Notes & Logs ({notes.length})
                </Text>
              )}
              {notes.map(note => (
                <NoteCard key={note.id} note={note} color={color}
                  onDelete={() => deleteNote(note.id)}
                  c={c} t={t} s={s} r={r} />
              ))}
              {notes.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: s.xl }}>
                  {showEmojis ? <Text style={{ fontSize: 36, marginBottom: s.sm }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={32} color={color} style={{ marginBottom: s.sm }} />}
                  <Text style={{ fontSize: t.sm, color: c.text3 }}>No notes yet — quick log or add one above</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Add note modal ── */}
      <Modal visible={noteModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, borderTopWidth: 1, borderTopColor: color + '44' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>{showEmojis ? `${area.emoji} ` : ''}Add Note</Text>
            <TextInput
              style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: color + '44', minHeight: 80, textAlignVertical: 'top', marginBottom: s.md }}
              value={newNote} onChangeText={setNewNote}
              placeholder="What do you want to log?" placeholderTextColor={c.text4}
              multiline autoFocus />
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <TouchableOpacity onPress={() => { setNoteModal(false); setNewNote(''); }}
                style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ color: c.text3 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => addNote(newNote)} disabled={!newNote.trim()}
                style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: color, borderRadius: r.md, opacity: !newNote.trim() ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: t.bold }}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Weekly reflection modal ── */}
      <Modal visible={weekModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, borderTopWidth: 1, borderTopColor: color + '44' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.xs }}>{showEmojis ? '📓 ' : ''}Weekly Reflection</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, marginBottom: s.lg }}>{area.weeklyPrompt}</Text>
            <TextInput
              style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: color + '44', minHeight: 100, textAlignVertical: 'top', marginBottom: s.md }}
              value={weeklyNote} onChangeText={setWeeklyNote}
              placeholder="Write your reflection..." placeholderTextColor={c.text4}
              multiline autoFocus />
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <TouchableOpacity onPress={() => { setWeekModal(false); setWeeklyNote(''); }}
                style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ color: c.text3 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveWeeklyReflection} disabled={!weeklyNote.trim() || saving}
                style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: color, borderRadius: r.md, opacity: (!weeklyNote.trim() || saving) ? 0.5 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: t.bold }}>Save Reflection</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
