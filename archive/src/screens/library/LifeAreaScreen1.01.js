// library/LifeAreaScreen.js
// Dynamic screen for all 8 life areas
// Receives area config via route params, shows sub-sections + linked content + journal

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../api/commandCenterService';

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
  red:       '#e05c5c',
};

// ─── Area definitions with sub-sections and nav links ─────────────────────────
export const LIFE_AREAS = [
  {
    id: 'physical',
    label: 'Physical',
    emoji: '💪',
    icon: 'fitness',
    color: '#e05c5c',
    color_light: '#3a1e1e',
    subtitle: 'Fitness, nutrition, sleep & energy',
    description: 'Your body is your foundation. Track how you eat, move, rest and recover.',
    sections: [
      { title: 'Fitness & Movement', icon: 'barbell-outline', screen: 'ExerciseScreen', items: ['Workouts', 'Steps & activity', 'Stretching', 'Sports'] },
      { title: 'Nutrition', icon: 'nutrition-outline', screen: 'NutritionScreen', items: ['Meal tracking', 'Hydration', 'Supplements', 'Food goals'] },
      { title: 'Sleep & Recovery', icon: 'moon-outline', screen: null, items: ['Sleep schedule', 'Rest days', 'Recovery habits'] },
      { title: 'Energy & Vitality', icon: 'flash-outline', screen: null, items: ['Energy levels', 'Stress on body', 'Health checkups'] },
    ],
    weeklyPrompt: 'How did you treat your body this week? Workouts, food, sleep?',
  },
  {
    id: 'mental',
    label: 'Mental',
    emoji: '🧠',
    icon: 'bulb',
    color: '#7eb8e0',
    color_light: '#1a2d3d',
    subtitle: 'Emotions, stress, mindfulness & therapy',
    description: 'Mental health is the lens through which you experience everything else.',
    sections: [
      { title: 'Emotional Well-being', icon: 'heart-outline', screen: 'WellbeingScreen', items: ['Mood tracking', 'Journaling', 'Processing emotions'] },
      { title: 'Stress & Anxiety', icon: 'pulse-outline', screen: null, items: ['Stress triggers', 'Coping strategies', 'Breathing & grounding'] },
      { title: 'Mindfulness', icon: 'leaf-outline', screen: 'SelfCareScreen', items: ['Meditation', 'Presence practice', 'Gratitude'] },
      { title: 'Therapy & Support', icon: 'people-outline', screen: null, items: ['Therapy notes', 'Support resources', 'Crisis contacts'] },
    ],
    weeklyPrompt: 'How was your mental state this week? What helped, what hurt?',
  },
  {
    id: 'social',
    label: 'Social',
    emoji: '🤝',
    icon: 'people',
    color: '#b07be0',
    color_light: '#2a1a3d',
    subtitle: 'Relationships, family, friends & community',
    description: 'The people around you shape your life more than almost anything else.',
    sections: [
      { title: 'Relationships', icon: 'heart-outline', screen: 'RelationshipsScreen', items: ['Romantic', 'Family', 'Close friends'] },
      { title: 'Network & Community', icon: 'globe-outline', screen: 'NetworkScreen', items: ['Colleagues', 'Mentors', 'Community involvement'] },
      { title: 'Communication', icon: 'chatbubbles-outline', screen: null, items: ['Conflict resolution', 'Active listening', 'Setting boundaries'] },
      { title: 'Social Health', icon: 'people-outline', screen: null, items: ['Quality time', 'Loneliness check', 'New connections'] },
    ],
    weeklyPrompt: 'How were your relationships this week? Anyone you want to connect with more?',
  },
  {
    id: 'financial',
    label: 'Financial',
    emoji: '💰',
    icon: 'cash',
    color: '#4caf7d',
    color_light: '#1a3028',
    subtitle: 'Money, budget, savings & income',
    description: 'Financial clarity creates freedom. Know where you stand and where you\'re going.',
    sections: [
      { title: 'Income & Earnings', icon: 'trending-up-outline', screen: null, items: ['Salary', 'Side income', 'Passive income', 'Income goals'] },
      { title: 'Budget & Spending', icon: 'wallet-outline', screen: null, items: ['Monthly budget', 'Expense tracking', 'Subscriptions review'] },
      { title: 'Savings & Investing', icon: 'save-outline', screen: null, items: ['Emergency fund', 'Investment accounts', 'Retirement'] },
      { title: 'Debt & Credit', icon: 'card-outline', screen: null, items: ['Debt tracking', 'Credit score', 'Payoff strategy'] },
    ],
    weeklyPrompt: 'How was your money this week? Spending, saving, earning?',
  },
  {
    id: 'creative',
    label: 'Creative',
    emoji: '🎨',
    icon: 'color-palette',
    color: '#f5a623',
    color_light: '#3a2800',
    subtitle: 'Hobbies, art, music & expression',
    description: 'Creativity is how you process the world and contribute something uniquely yours.',
    sections: [
      { title: 'Hobbies & Interests', icon: 'star-outline', screen: 'HobbiesScreen', items: ['Active hobbies', 'Learning interests', 'Passion projects'] },
      { title: 'Art & Music', icon: 'musical-notes-outline', screen: null, items: ['Music practice', 'Visual art', 'Writing', 'Performance'] },
      { title: 'Content & Media', icon: 'videocam-outline', screen: null, items: ['Content creation', 'Photography', 'Video', 'Podcasting'] },
      { title: 'Learning & Curiosity', icon: 'book-outline', screen: null, items: ['Books', 'Courses', 'Documentaries', 'Deep dives'] },
    ],
    weeklyPrompt: 'Did you make or learn something creative this week?',
  },
  {
    id: 'professional',
    label: 'Professional',
    emoji: '🚀',
    icon: 'rocket',
    color: '#c9a84c',
    color_light: '#2d2400',
    subtitle: 'Career, skills, projects & growth',
    description: 'Your professional life is where ambition meets action. Build deliberately.',
    sections: [
      { title: 'Career & Jobs', icon: 'briefcase-outline', screen: 'CareerExplorationScreen', items: ['Current role', 'Job search', 'Career path', 'Promotions'] },
      { title: 'Skills & Learning', icon: 'school-outline', screen: 'ResearchScreen', items: ['Technical skills', 'Soft skills', 'Certifications', 'Languages'] },
      { title: 'Projects & Work', icon: 'construct-outline', screen: 'ProjectsScreen', items: ['Active projects', 'Deadlines', 'Collaborations'] },
      { title: 'Business & Ventures', icon: 'storefront-outline', screen: 'DiscoverScreen', items: ['ChillTech Hub', 'CTH Recovery', 'Side ventures', 'Ideas pipeline'] },
    ],
    weeklyPrompt: 'How did you invest in your professional growth this week?',
  },
  {
    id: 'spiritual',
    label: 'Spiritual',
    emoji: '✨',
    icon: 'sparkles',
    color: '#e8c4ff',
    color_light: '#2a1a3d',
    subtitle: 'Purpose, values, reflection & faith',
    description: 'Knowing what you stand for and why gives everything else meaning.',
    sections: [
      { title: 'Purpose & Values', icon: 'compass-outline', screen: null, items: ['Core values', 'Life mission', 'What drives you'] },
      { title: 'Reflection & Prayer', icon: 'sunny-outline', screen: null, items: ['Daily reflection', 'Prayer/meditation', 'Gratitude practice'] },
      { title: 'Philosophy & Wisdom', icon: 'library-outline', screen: null, items: ['Books & teachings', 'Personal philosophy', 'Growth mindset'] },
      { title: 'Community & Faith', icon: 'people-outline', screen: null, items: ['Faith community', 'Service & giving', 'Shared beliefs'] },
    ],
    weeklyPrompt: 'Did you feel aligned with your values and purpose this week?',
  },
  {
    id: 'digital',
    label: 'Digital',
    emoji: '💻',
    icon: 'laptop',
    color: '#64b5f6',
    color_light: '#1a2535',
    subtitle: 'Screen time, privacy, security & tools',
    description: 'Your digital life shapes your attention, safety and productivity.',
    sections: [
      { title: 'Privacy & Security', icon: 'shield-checkmark-outline', screen: 'PrivacyScreen', items: ['Account security', '2FA', 'Privacy settings', 'Data hygiene'] },
      { title: 'Digital Security', icon: 'lock-closed-outline', screen: 'SecurityScreen', items: ['Password manager', 'Secure devices', 'Network safety'] },
      { title: 'Screen Time & Focus', icon: 'phone-portrait-outline', screen: null, items: ['App usage', 'Social media limits', 'Deep work blocks'] },
      { title: 'Tools & Systems', icon: 'settings-outline', screen: null, items: ['Productivity stack', 'Automation', 'Note-taking', 'Task systems'] },
    ],
    weeklyPrompt: 'Was your digital life working for you or against you this week?',
  },
];

export default function LifeAreaScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { areaId, rating, lastCheck, linkedItems = [] } = route.params || {};

  const area = LIFE_AREAS.find(a => a.id === areaId);
  if (!area) return null;

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteModal, setNoteModal] = useState(false);
  const [addLinkModal, setAddLinkModal] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ title: '', url: '', type: 'article' });
  const [links, setLinks] = useState(linkedItems);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load area-specific notes
        const { data } = await supabase
          .from('area_notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('area_id', areaId)
          .order('created_at', { ascending: false })
          .limit(10);
        setNotes(data || []);
      }
    };
    load();
  }, []);

  const saveNote = async () => {
    if (!newNote.trim() || !userId) return;
    // Save as a standalone note tagged to this area
    const { data } = await supabase
      .from('area_notes')
      .insert({ user_id: userId, area_id: areaId, content: newNote.trim() })
      .select().single();
    if (data) setNotes(prev => [data, ...prev]);
    setNewNote('');
    setNoteModal(false);
  };

  const saveLink = () => {
    if (!linkDraft.title.trim()) return;
    setLinks(prev => [...prev, { ...linkDraft }]);
    setLinkDraft({ title: '', url: '', type: 'article' });
    setAddLinkModal(false);
  };

  const lastCheckStr = lastCheck
    ? new Date(lastCheck).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Not yet rated';

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: area.color + '44' }]}>
          <Text style={s.headerEmoji}>{area.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{area.label}</Text>
            <Text style={s.headerSub}>{area.subtitle}</Text>
          </View>
          <View style={s.ratingDisplay}>
            <Text style={[s.ratingNum, { color: area.color }]}>{rating || '—'}</Text>
            <Text style={s.ratingOf}>/5</Text>
          </View>
        </View>

        {/* Rating bar */}
        <View style={s.ratingBar}>
          <View style={[s.ratingFill, { width: `${((rating || 0) / 5) * 100}%`, backgroundColor: area.color }]} />
        </View>
        <Text style={s.lastCheck}>Last checked: {lastCheckStr}</Text>

        {/* Description */}
        <View style={s.descCard}>
          <Text style={s.descText}>{area.description}</Text>
        </View>

        {/* Weekly prompt */}
        <View style={[s.promptCard, { borderLeftColor: area.color }]}>
          <Text style={s.promptLabel}>This week's reflection</Text>
          <Text style={s.promptText}>{area.weeklyPrompt}</Text>
          <TouchableOpacity style={[s.promptBtn, { backgroundColor: area.color + '22', borderColor: area.color + '44' }]} onPress={() => setNoteModal(true)}>
            <Ionicons name="pencil-outline" size={14} color={area.color} />
            <Text style={[s.promptBtnText, { color: area.color }]}>Write reflection</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-sections */}
        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>Sections</Text>
        </View>
        {area.sections.map((sec, i) => (
          <TouchableOpacity
            key={i}
            style={s.subCard}
            onPress={() => sec.screen && navigation.navigate(sec.screen)}
            activeOpacity={sec.screen ? 0.7 : 1}
          >
            <View style={[s.subIcon, { backgroundColor: area.color + '22' }]}>
              <Ionicons name={sec.icon} size={18} color={area.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.subCardTop}>
                <Text style={s.subTitle}>{sec.title}</Text>
                {sec.screen && <Ionicons name="chevron-forward" size={14} color={T.muted} />}
              </View>
              <View style={s.subItems}>
                {sec.items.map((item, ii) => (
                  <View key={ii} style={s.subItem}>
                    <View style={[s.subItemDot, { backgroundColor: area.color + '88' }]} />
                    <Text style={s.subItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Linked content */}
        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>Linked Content</Text>
          <TouchableOpacity onPress={() => setAddLinkModal(true)}>
            <Ionicons name="add-circle" size={20} color={T.brass} />
          </TouchableOpacity>
        </View>
        {links.length === 0
          ? <View style={s.emptyLinks}>
              <Text style={s.emptyText}>No linked content yet</Text>
              <Text style={s.emptyHint}>Add articles, projects or resources from Discover</Text>
            </View>
          : links.map((lk, i) => (
              <View key={i} style={s.linkCard}>
                <View style={[s.linkIcon, { backgroundColor: area.color + '22' }]}>
                  <Ionicons name={lk.type === 'project' ? 'briefcase-outline' : lk.type === 'advice' ? 'chatbubble-outline' : 'document-text-outline'} size={16} color={area.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.linkTitle}>{lk.title}</Text>
                  <Text style={s.linkType}>{lk.type}</Text>
                </View>
                <Ionicons name="open-outline" size={14} color={T.muted} />
              </View>
            ))
        }

        {/* Notes */}
        {notes.length > 0 && (
          <>
            <View style={s.sectionHead}>
              <Text style={s.sectionLabel}>Recent Notes</Text>
            </View>
            {notes.slice(0, 5).map((note, i) => (
              <View key={i} style={s.noteCard}>
                <Text style={s.noteText}>{note.content}</Text>
                <Text style={s.noteDate}>{new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Note modal */}
      <Modal visible={noteModal} transparent animationType="slide">
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Reflection — {area.label}</Text>
            <Text style={s.modalPrompt}>{area.weeklyPrompt}</Text>
            <TextInput
              style={s.noteInput}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Write freely..."
              placeholderTextColor={T.muted}
              multiline
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setNoteModal(false)} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveNote} style={[s.saveBtn, { backgroundColor: area.color }]}>
                <Text style={s.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add link modal */}
      <Modal visible={addLinkModal} transparent animationType="slide">
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Link Content</Text>
            <View style={s.typeRow}>
              {['article','project','advice','resource'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.typeChip, linkDraft.type === t && { backgroundColor: area.color + '22', borderColor: area.color }]}
                  onPress={() => setLinkDraft(p => ({ ...p, type: t }))}>
                  <Text style={[s.typeText, linkDraft.type === t && { color: area.color }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.input} value={linkDraft.title} onChangeText={v => setLinkDraft(p => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor={T.muted} autoFocus />
            <TextInput style={s.input} value={linkDraft.url} onChangeText={v => setLinkDraft(p => ({ ...p, url: v }))} placeholder="URL or note (optional)" placeholderTextColor={T.muted} autoCapitalize="none" />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setAddLinkModal(false)} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveLink} style={[s.saveBtn, { backgroundColor: area.color }]}>
                <Text style={s.saveText}>Link it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.navy },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 16, borderBottomWidth: 1 },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: T.cream },
  headerSub: { fontSize: 12, color: T.muted, marginTop: 2 },
  ratingDisplay: { flexDirection: 'row', alignItems: 'baseline' },
  ratingNum: { fontSize: 28, fontWeight: '700' },
  ratingOf: { fontSize: 13, color: T.muted },

  ratingBar: { height: 3, backgroundColor: T.navyBorder, marginHorizontal: 20, borderRadius: 3, overflow: 'hidden' },
  ratingFill: { height: 3, borderRadius: 3 },
  lastCheck: { fontSize: 10, color: T.muted, marginHorizontal: 20, marginTop: 6, marginBottom: 16 },

  descCard: { marginHorizontal: 16, backgroundColor: T.navyMid, borderRadius: 10, padding: 14, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 16 },
  descText: { fontSize: 14, color: T.creamDim, lineHeight: 20 },

  promptCard: { marginHorizontal: 16, backgroundColor: T.navyMid, borderRadius: 10, padding: 14, borderLeftWidth: 3, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 8 },
  promptLabel: { fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  promptText: { fontSize: 14, color: T.cream, lineHeight: 20, marginBottom: 12 },
  promptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 0.5 },
  promptBtnText: { fontSize: 13, fontWeight: '500' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: T.brass, textTransform: 'uppercase', letterSpacing: 1 },

  subCard: { flexDirection: 'row', gap: 12, marginHorizontal: 16, backgroundColor: T.navyMid, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 8 },
  subIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  subCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitle: { fontSize: 14, fontWeight: '600', color: T.cream },
  subItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subItemDot: { width: 4, height: 4, borderRadius: 2 },
  subItemText: { fontSize: 11, color: T.muted },

  emptyLinks: { marginHorizontal: 16, backgroundColor: T.navyMid, borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: T.navyBorder, borderStyle: 'dashed' },
  emptyText: { fontSize: 13, color: T.muted, fontWeight: '500' },
  emptyHint: { fontSize: 11, color: T.muted, marginTop: 4, textAlign: 'center' },

  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: T.navyMid, borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 6 },
  linkIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 13, fontWeight: '500', color: T.cream },
  linkType: { fontSize: 10, color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  noteCard: { marginHorizontal: 16, backgroundColor: T.navyMid, borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: T.navyBorder, marginBottom: 6 },
  noteText: { fontSize: 13, color: T.creamDim, lineHeight: 18 },
  noteDate: { fontSize: 10, color: T.muted, marginTop: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: T.navyMid, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 0.5, borderColor: T.navyBorder },
  modalTitle: { fontSize: 17, fontWeight: '700', color: T.cream, marginBottom: 6 },
  modalPrompt: { fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 18 },
  noteInput: { borderWidth: 1, borderColor: T.navyBorder, borderRadius: 10, padding: 12, fontSize: 15, color: T.cream, backgroundColor: T.navy, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: T.navyBorder, borderRadius: 10, padding: 12, fontSize: 15, color: T.cream, backgroundColor: T.navy, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: T.navyBorder, backgroundColor: T.navy },
  typeText: { fontSize: 12, color: T.muted },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 18 },
  cancelText: { fontSize: 14, color: T.muted },
  saveBtn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 22 },
  saveText: { color: T.navy, fontWeight: '700', fontSize: 14 },
});