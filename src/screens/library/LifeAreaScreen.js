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
import { supabase } from '../../api/profileScopedClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';
import RelatedLinks, { EXCLUDE_LINK_FILTER } from './RelatedLinks';
import TourSpot from '../../components/TourSpot';
import LockBadge from '../../components/LockBadge';
import { useFeatureGate } from '../../components/FeatureGate';
import { featureForScreen } from '../../data/featureCatalog';
import { unlockHint } from '../../logic/featureAccess';
import { todayStr } from '../../logic/dateUtils';
import { AREA_COLORS } from '../../data/areaColors';
import { FONTS } from '../../theme';
import useAreaHubActions from '../../logic/useAreaHubActions';
import { ReadSheet, TimerSheet } from '../../components/lifeareas/ActionSheets';
import { INK, tierLabel, tierColor, buttonLabel, buttonIcon } from '../../components/lifeareas/actionUi';

// ─── Life area config ─────────────────────────────────────────────────────────
export const LIFE_AREAS = [
  {
    id: 'physical', label: 'Physical', emoji: '💪', icon: 'fitness',
    color: AREA_COLORS.physical,
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
    color: AREA_COLORS.mental,
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
    color: AREA_COLORS.social,
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
    color: AREA_COLORS.financial,
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
    color: AREA_COLORS.creative,
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
    color: AREA_COLORS.professional,
    subtitle: 'Career, skills, projects & growth',
    description: 'Your professional life is where ambition meets action. Build deliberately.',
    sections: [
      { title: 'Career & Jobs',      icon: 'briefcase-outline',  screen: 'CareerExplorationScreen', items: ['Current role', 'Job search', 'Career path', 'Promotions'] },
      { title: 'Skills & Learning',  icon: 'school-outline',     screen: 'ResearchScreen',          items: ['Technical skills', 'Soft skills', 'Certifications'] },
      { title: 'Projects & Work',    icon: 'construct-outline',  screen: 'ProjectsScreen',          items: ['Active projects', 'Deadlines', 'Collaborations'] },
      { title: 'Business & Ventures',icon: 'storefront-outline', screen: 'BusinessVenturesScreen', items: ['Side ventures', 'Ideas pipeline', 'Your projects'] },
    ],
    weeklyPrompt: 'How did you invest in your professional growth this week?',
    quickLog: ['Completed a work task', 'Learned something new', 'Networked with someone', 'Worked on a side project', 'Achieved a milestone'],
  },
  {
    id: 'spiritual', label: 'Spiritual', emoji: '✨', icon: 'sparkles',
    color: AREA_COLORS.spiritual,
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
    color: AREA_COLORS.digital,
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
// `access` is the evaluateAccess() result when this sub-section is one the
// Compass gates (Savings & Investing, Debt & Credit — both sit on top of
// knowing your own numbers first), and null for the great majority that
// aren't gated at all. A gated card still navigates; it just lands on the
// unlock sheet rather than the screen.
function SectionCard({ section, color, access, onPress, next, doneHere, band, busy, onDo, c, t, s, r }) {
  const isNavigable = !!section.screen;
  const open = access ? access.available : true;
  const accent = open ? color : c.text4;
  const nextAccent = next ? tierColor(next.tier, c, color) : color;
  return (
    <View style={{
      backgroundColor: c.bg1, borderRadius: r.lg, marginBottom: s.md, borderWidth: 0.5,
      borderColor: isNavigable ? accent + '44' : c.border,
      borderLeftWidth: isNavigable ? 3 : 0.5,
      borderLeftColor: isNavigable ? accent : c.border,
    }}>
      <TouchableOpacity
        onPress={isNavigable ? onPress : undefined}
        activeOpacity={isNavigable ? 0.8 : 1}
        accessibilityRole={isNavigable ? 'button' : undefined}
        accessibilityLabel={isNavigable ? `Open ${section.title}` : undefined}
        style={{ padding: s.lg, paddingBottom: open && (next || doneHere > 0) ? s.sm : s.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, flex: 1 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={section.icon} size={16} color={accent} />
            </View>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: open ? c.text1 : c.text3 }}>{section.title}</Text>
            {access && !open && <LockBadge access={access} size="xs" showLabel={false} />}
          </View>
          {isNavigable && <Ionicons name={open ? 'chevron-forward' : 'information-circle-outline'} size={16} color={accent} />}
        </View>
        {access && !open && (
          <Text style={{ fontSize: t.xs, color: c.text4, fontStyle: 'italic', marginTop: s.sm }}>
            {unlockHint(access)}
          </Text>
        )}
      </TouchableOpacity>

      {/* The next thing to do here, doable without opening the screen. */}
      {open && next && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.lg, paddingBottom: s.lg }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: nextAccent }}>
              {tierLabel(next.tier, band)}
            </Text>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginTop: 2, lineHeight: 19 }}>{next.title}</Text>
          </View>
          <TouchableOpacity onPress={onDo} disabled={busy} accessibilityRole="button" accessibilityLabel={`Do it: ${next.title}`}
            style={{ minHeight: 40, minWidth: 64, paddingHorizontal: 14, borderRadius: r.md, backgroundColor: color + '22', borderWidth: 1, borderColor: color + '66', alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color={color} size="small" /> : <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text1 }}>Do it</Text>}
          </TouchableOpacity>
        </View>
      )}
      {open && !next && doneHere > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.lg, paddingBottom: s.lg }}>
          <Ionicons name="checkmark-circle" size={16} color={c.teal} />
          <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.semibold }}>All done here today</Text>
        </View>
      )}
    </View>
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

  // Two of the forty-odd sub-sections are Compass-gated (the Financial
  // area's Savings & Investing and Debt & Credit, both of which only make
  // sense once you've looked at your own numbers). Everything else comes
  // back as null from featureForScreen and behaves exactly as before.
  const { accessFor, gatedNavigate, sheet: unlockSheet } = useFeatureGate();

  const [notes,       setNotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);
  const [noteModal,   setNoteModal]   = useState(false);
  const [newNote,     setNewNote]     = useState('');
  const [weeklyNote,  setWeeklyNote]  = useState('');
  const [weekModal,   setWeekModal]   = useState(false);
  const [rating,      setRating]      = useState(0);
  const [saving,      setSaving]      = useState(false);

  // Each sub-section's next action, and one focus for the area. Reads and
  // timers open their sheet here; everything else runs in place.
  const hub = useAreaHubActions({
    areaId: area?.id,
    screenTags: (area?.sections || []).map(x => x.screen).filter(Boolean),
    navigation,
  });
  const [reading, setReading] = useState(null);
  const [timing, setTiming] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [hubNote, setHubNote] = useState(null);
  const actOnHub = async (action) => {
    if (action.handler === 'read') return setReading(action);
    if (action.handler === 'timer') return setTiming(action);
    setBusyKey(action.key);
    const res = await hub.run(action);
    setBusyKey(null);
    setHubNote(res.ok ? (res.message || 'Done — logged for you.') : res.message);
    setTimeout(() => setHubNote(null), 4000);
  };

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
          {/* ── Today's focus: one action across the whole area ── */}
          {hub.focus && (() => {
            const f = hub.focus;
            const from = area.sections.find(x => x.screen === f.screen_tag)?.title;
            return (
              <View style={{ marginBottom: s.xl }}>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: c.text3, marginBottom: 10 }}>
                  {hub.band === 'kid' ? 'Do this today' : 'Today’s focus'}
                </Text>
                <View style={{ backgroundColor: color + '1a', borderWidth: 1, borderColor: color + '66', borderRadius: r.xl, padding: 18 }}>
                  {!!from && <Text style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c.text3 }}>{from}</Text>}
                  <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, lineHeight: 26, marginTop: 4 }}>{f.title}</Text>
                  {!!f.why && <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: 8 }}>{f.why}</Text>}
                  <TouchableOpacity onPress={() => actOnHub(f)} disabled={busyKey === f.key} accessibilityRole="button"
                    accessibilityLabel={`${buttonLabel(f, hub.band)}: ${f.title}`}
                    style={{ marginTop: 16, minHeight: 52, borderRadius: r.lg, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 }}>
                    {busyKey === f.key ? <ActivityIndicator color={INK} /> : (
                      <>
                        <Ionicons name={buttonIcon(f)} size={18} color={INK} />
                        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: INK }}>{buttonLabel(f, hub.band)}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                {!!hubNote && (
                  <View accessibilityLiveRegion="polite" style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: r.md, backgroundColor: c.teal + '1a' }}>
                    <Ionicons name="checkmark-circle" size={18} color={c.teal} />
                    <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{hubNote}</Text>
                  </View>
                )}
              </View>
            );
          })()}

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
          {area.sections.map((sec, i) => {
            const feature = sec.screen ? featureForScreen(sec.screen) : null;
            return (
              <SectionCard key={i} section={sec} color={color}
                access={feature ? accessFor(feature.id) : null}
                next={hub.bySection[sec.screen]?.next}
                doneHere={hub.bySection[sec.screen]?.doneHere || 0}
                band={hub.band}
                busy={!!busyKey && busyKey === hub.bySection[sec.screen]?.next?.key}
                onDo={() => hub.bySection[sec.screen]?.next && actOnHub(hub.bySection[sec.screen].next)}
                onPress={() => (feature
                  ? gatedNavigate(feature.id, () => navigateTo(sec.screen))
                  : navigateTo(sec.screen))}
                c={c} t={t} s={s} r={r} />
            );
          })}
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

      <ReadSheet action={reading} color={color} band={hub.band} onClose={() => setReading(null)}
        onDone={async (a) => { await hub.complete(a); }} />
      <TimerSheet action={timing} color={color} onClose={() => setTiming(null)}
        onDone={async (a, opts) => { await hub.complete(a, opts); }} />

      {unlockSheet}
    </View>
  );
}
