// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// Aliased: this file already has its own `dateStr` (the long, human-readable
// header date) and its own `todayStr` const further down.
import { dateStr as toLocalDateStr } from '../logic/dateUtils';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Modal, KeyboardAvoidingView,
  Platform, FlatList, Alert, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { supabase } from '../api/supabaseClient';
import { fetchContentPool } from '../api/remoteConfigService';
import { getMyOpenAssignments, updateAssignmentStatus } from '../api/organizationService';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../api/offlineCache';
import { syncReminders, computeReminderState } from '../logic/notificationScheduler';
import TourSpot from '../components/TourSpot';
import CalendarModal from '../components/CalendarModal';
import LevelRing from '../components/LevelRing';
import PlayerMatchBackground from '../components/PlayerMatchBackground';
import useCharacterLoadout from '../logic/useCharacterLoadout';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { RANK_LABELS, FONTS } from '../theme';
import { GAMES_MASTER } from './GamesScreen';
import { useConfigValue } from '../../context/RemoteConfigContext';

// The four "study" destinations the STUDY button picks randomly among (tap),
// or lets you choose explicitly (hold). Screen names match the Stack.Screen
// names registered in LibraryNav.js.
const STUDY_DESTINATIONS = [
  { key: 'ProjectsScreen',   label: 'Workshop',    icon: 'hammer-outline' },
  { key: 'IdeaGardenScreen', label: 'Idea Garden',  icon: 'leaf-outline' },
  { key: 'ResearchScreen',   label: 'Research',     icon: 'flask-outline' },
  { key: 'ClassesStack',     label: 'Classes',      icon: 'ribbon-outline' },
];

// ─── Quotes pool ──────────────────────────────────────────────────────────────
// Offline/fallback pool only — the live pool now comes from Supabase
// (app_content, type='quote'; see remoteConfigService.fetchContentPool).
// Add/edit/remove quotes there and every user gets them with no app update.
// This array is what renders before that fetch resolves, and what's used
// if it ever fails or the table is emptied out.
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

// ─── Commander card — base HQ identity, crest color stays user-customizable ──
const CREST_COLORS = {
  teal:   '#2bb5a0', gold:   '#c9a84c', purple: '#8b4fc4',
  red:    '#e05858', blue:   '#3a7bd5', green:  '#3ac860',
  orange: '#e07a30', silver: '#9a9aa8',
};
const BADGE_EMOJIS = { explorer: '🧭', builder: '🏗️', scholar: '📚', guardian: '🛡️', pioneer: '🌟', creator: '🎨' };

function CommanderCard({ profile, rank, progress, c, t, onPress }) {
  const crestColor = CREST_COLORS[profile?.suit_color] || c.gold;
  const badgeEmoji = BADGE_EMOJIS[profile?.badge] || null;
  const name       = profile?.traveler_name || profile?.display_name || 'Commander';
  const rankInfo   = RANK_LABELS[rank] || RANK_LABELS[20];
  const level      = profile?.level || 1;

  return (
    <TouchableOpacity style={cmd.wrap} onPress={onPress} activeOpacity={0.85}>
      <LevelRing pct={progress || 0} size={60} strokeWidth={4} color={crestColor} trackColor={c.bg2}>
        <View style={[cmd.crest, { backgroundColor: crestColor + '22', borderColor: crestColor }]}>
          <Text style={cmd.crestEmoji}>{rankInfo.emoji}</Text>
          {badgeEmoji && (
            <View style={[cmd.badgeDot, { backgroundColor: c.bg1, borderColor: crestColor }]}>
              <Text style={{ fontSize: 9 }}>{badgeEmoji}</Text>
            </View>
          )}
        </View>
      </LevelRing>
      <View style={cmd.info}>
        <Text style={[cmd.name, { color: c.text1 }]} numberOfLines={1}>{name}</Text>
        <Text style={[cmd.rank, { color: crestColor }]}>LV {level} · {rankInfo.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.text4} />
    </TouchableOpacity>
  );
}
const cmd = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  crest:     { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  crestEmoji:{ fontSize: 20 },
  badgeDot:  { position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  info:      { flex: 1, marginLeft: 14, marginRight: 8 },
  name:      { fontSize: 17, fontFamily: FONTS.display, fontWeight: '800' },
  rank:      { fontSize: 12, fontFamily: FONTS.mono, fontWeight: '700', letterSpacing: 0.3, marginTop: 2 },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, action, onAction, c, t }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: t.sm, fontFamily: FONTS.displaySemibold, fontWeight: t.bold, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, color: c.teal }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


// ─── Focus modal with presets ─────────────────────────────────────────────────
function FocusModal({ visible, draft, setDraft, onSave, onClose, presets, onAddPreset, onDeletePreset, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  const [newPreset, setNewPreset] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '85%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>{showEmojis ? '✦ ' : ''}Today's Focus</Text>
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
  const { showEmojis, showSubtext } = useUIPrefs();
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
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.xs }}>{showEmojis ? '💛 ' : ''}My Affirmations</Text>
          {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.lg }}>Add multiple — they rotate each day on your dashboard.</Text>}

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

function IdeaPreviewCard({ idea, visible, onClose, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  if (!idea) return null;

  const plantEmoji = idea.plant_type === 'tree'   ? '🌳'
                   : idea.plant_type === 'flower'  ? '🌸'
                   : idea.plant_type === 'plant'   ? '🌿' : '🌱';

  const plantLabel = idea.plant_type === 'tree'   ? 'Big Project'
                   : idea.plant_type === 'flower'  ? 'Creative Idea'
                   : idea.plant_type === 'plant'   ? 'Developing Idea' : 'Early Seed';

  const petals    = idea.garden_petals || [];
  const tasks     = petals.filter(p => p.petal_type === 'task');
  const notes     = petals.filter(p => p.petal_type === 'note');
  const ideaPets  = petals.filter(p => p.petal_type === 'idea');
  const done      = tasks.filter(p => p.completed).length;
  const ideaColor = idea.color || '#2bb5a0';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 48, maxHeight: '78%' }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 12, marginBottom: s.lg }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.md, paddingHorizontal: s.xl, marginBottom: s.md }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: ideaColor + '33', borderWidth: 2, borderColor: ideaColor, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28 }}>{plantEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>{idea.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
                <View style={{ backgroundColor: ideaColor + '22', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, color: ideaColor, fontWeight: t.bold }}>{plantLabel}</Text>
                </View>
                {idea.is_project && (
                  <View style={{ backgroundColor: c.gold + '22', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, color: c.gold, fontWeight: t.bold }}>{showEmojis ? '🚀 ' : ''}Project</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: s.xl, gap: s.md, paddingBottom: s.lg }}>
            {/* Progress if project */}
            {idea.is_project && tasks.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>Progress</Text>
                  <Text style={{ fontSize: t.xs, color: ideaColor, fontWeight: t.bold }}>{done}/{tasks.length} tasks</Text>
                </View>
                <View style={{ height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: 5, borderRadius: 3, backgroundColor: ideaColor, width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
                </View>
              </View>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md }}>
                <Text style={{ fontSize: t.xs, color: ideaColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.bold, marginBottom: s.sm }}>
                  {showEmojis ? '✅ ' : ''}Tasks ({done}/{tasks.length} done)
                </Text>
                {tasks.slice(0, 4).map((task, i) => (
                  <View key={task.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 4 }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: task.completed ? ideaColor : c.border, backgroundColor: task.completed ? ideaColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {task.completed && <Ionicons name="checkmark" size={9} color="#fff" />}
                    </View>
                    <Text style={{ fontSize: t.xs, color: task.completed ? c.text4 : c.text1, textDecorationLine: task.completed ? 'line-through' : 'none', flex: 1 }} numberOfLines={1}>
                      {task.title}
                    </Text>
                  </View>
                ))}
                {tasks.length > 4 && <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>+{tasks.length - 4} more tasks</Text>}
              </View>
            )}

            {/* Ideas / sub-ideas */}
            {ideaPets.length > 0 && (
              <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md }}>
                <Text style={{ fontSize: t.xs, color: c.gold, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.bold, marginBottom: s.sm }}>
                  {showEmojis ? '💡 ' : ''}Ideas ({ideaPets.length})
                </Text>
                {ideaPets.slice(0, 3).map((ip, i) => (
                  <Text key={ip.id || i} style={{ fontSize: t.xs, color: c.text2, paddingVertical: 3, borderBottomWidth: i < Math.min(ideaPets.length, 3) - 1 ? 0.5 : 0, borderBottomColor: c.border }}>
                    · {ip.title}
                  </Text>
                ))}
              </View>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md }}>
                <Text style={{ fontSize: t.xs, color: c.teal, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.bold, marginBottom: s.sm }}>
                  {showEmojis ? '📝 ' : ''}Notes ({notes.length})
                </Text>
                {notes.slice(0, 2).map((note, i) => (
                  <Text key={note.id || i} style={{ fontSize: t.xs, color: c.text2, paddingVertical: 3 }} numberOfLines={2}>
                    {note.title}
                  </Text>
                ))}
              </View>
            )}

            {petals.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: s.xl }}>
                <Text style={{ fontSize: 32, marginBottom: s.sm }}>{plantEmoji}</Text>
                <Text style={{ fontSize: t.sm, color: c.text3 }}>This seed is just getting started</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── 2. NEXT UP CARD ───────────────────────────────────────────────────────────
// Next-action surfacing detail sheet — opened from a desk ticker chip (see
// DeskTicker below). `actions` is a small array HomeScreen builds per item
// kind (task/project/capture/assignment each get a different set — see
// actionsForDeskItem) rather than this component guessing what's possible;
// one filled "primary" button plus however many outlined ones fit.
function ActionPill({ label, icon, tone, color, c, t, onPress }) {
  const pillColor = tone === 'danger' ? (c.error || '#e05858') : (color || c.teal);
  const filled = tone === 'primary';
  return (
    <TouchableOpacity onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: filled ? pillColor : 'transparent',
        borderWidth: filled ? 0 : 1, borderColor: pillColor + (filled ? '' : '99'),
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
      }}>
      <Ionicons name={icon} size={14} color={filled ? '#fff' : pillColor} />
      <Text style={{ color: filled ? '#fff' : pillColor, fontWeight: t.bold, fontSize: t.xs }}>{label}</Text>
    </TouchableOpacity>
  );
}

function NextUpCard({ item, actions, onAdd, c, t, s, r }) {
  if (!item) {
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderStyle: 'dashed' }}
        onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={18} color={c.text4} />
        <Text style={{ flex: 1, fontSize: t.sm, color: c.text4 }}>Add priorities from your projects, notes and ideas</Text>
      </TouchableOpacity>
    );
  }

  const isProject = item.kind === 'project';
  const color = item.color || c.teal;
  const icon  = isProject ? (item.hasNextAction ? 'flag' : 'flag-outline')
    : item.kind === 'assignment' ? 'school-outline'
    : item.kind === 'task' ? 'checkmark-circle-outline'
    : 'document-text-outline';
  const badgeLabel = isProject && !item.hasNextAction ? 'Needs next step' : item.source;
  const headline = isProject && !item.hasNextAction ? `What's next for ${item.projectTitle}?` : item.title;

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 8 }}>
        <View style={{ backgroundColor: color + '22', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, color, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{badgeLabel}</Text>
        </View>
        {item.notes ? <Text style={{ flex: 1, fontSize: 10, color: c.text4 }} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.bold, color: c.text1 }} numberOfLines={2}>{headline}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.md }}>
        {(actions || []).map(a => (
          <ActionPill key={a.key} label={a.label} icon={a.icon} tone={a.tone} color={color} c={c} t={t} onPress={a.onPress} />
        ))}
      </View>
    </View>
  );
}

// ─── Desk ticker ────────────────────────────────────────────────────────────
// Small, continuously drifting stock-ticker row — the pre-next-action-
// surfacing look, kept for its own sake (it's just nicer to glance at than
// a static list). The row is rendered twice back-to-back and scrolled left
// forever; once a full copy has scrolled past, the second copy is sitting
// exactly where the first started, so the loop is seamless. Tapping a chip
// opens NextUpCard's full detail — badge, headline, one-tap action, Focus
// button — in a sheet, rather than the old bare preview-and-dismiss card.
function DeskTicker({ items, onItemPress, onAdd, c, t, s, r }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    if (!setWidth) return;
    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -setWidth,
        duration: setWidth * 28, // px/ms — slow, readable drift
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [setWidth, items.length]);

  if (items.length === 0) {
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderStyle: 'dashed' }}
        onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={18} color={c.text4} />
        <Text style={{ flex: 1, fontSize: t.sm, color: c.text4 }}>Add priorities from your projects, notes and ideas</Text>
      </TouchableOpacity>
    );
  }

  const chip = (item, keyPrefix) => {
    const color = item.color || c.teal;
    return (
      <TouchableOpacity key={`${keyPrefix}-${item.id}`} onPress={() => onItemPress(item)} activeOpacity={0.8}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 7,
          backgroundColor: c.bg1, borderRadius: r.md,
          paddingVertical: 7, paddingHorizontal: 12, marginRight: s.sm,
          borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 2, borderLeftColor: color,
        }}>
        <Text style={{ fontSize: 9, fontFamily: FONTS.mono, fontWeight: '800', color, letterSpacing: 0.5 }}>
          {(item.source || '').toUpperCase()}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.text1, maxWidth: 180 }} numberOfLines={1}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ overflow: 'hidden', marginHorizontal: -s.lg, paddingHorizontal: s.lg }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
        <View
          style={{ flexDirection: 'row' }}
          onLayout={e => {
            const w = Math.round(e.nativeEvent.layout.width);
            if (w > 0 && w !== setWidth) setSetWidth(w);
          }}
        >
          {items.map(item => chip(item, 'a'))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {items.map(item => chip(item, 'b'))}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const { profile, streakDays, rank, progress, level, points, dailyMissions } = useUserProgress();
  const { background: playerBackground } = useCharacterLoadout({ level, points, rank, streakDays });
  // Set from Settings → Appearance, not on this screen itself.
  const [bgMode] = useSetting(SETTING_KEYS.HOME_BACKGROUND, 'plain');
  // Admin-side kill switch — see the matching comment in GamesScreen.js.
  const disabledGameIds = useConfigValue('disabled_games', []);
  const GAMES = useMemo(
    () => GAMES_MASTER.filter(g => !disabledGameIds.includes(g.key)),
    [disabledGameIds]
  );

  const [refreshing,      setRefreshing]     = useState(false);
  const [userId,          setUserId]         = useState(null);

  // Focus
  const [todayFocus,     setTodayFocus]     = useState('');
  const [focusDraft,     setFocusDraft]     = useState('');
  const [editFocus,      setEditFocus]      = useState(false);
  const [focusPresets,   setFocusPresets]   = useState([...DEFAULT_PRESETS]);

  // Quotes — remote pool from Supabase (app_content), null until loaded
  const [quotePool,      setQuotePool]      = useState(null);

  // Affirmations — pool that rotates
  const [affirmations,   setAffirmations]   = useState([]);
  const [editAffirm,     setEditAffirm]     = useState(false);

  // Todos / desk
  const [todos,          setTodos]          = useState([]); // ranked next-action candidates — see loadAll
  const [todoInput,      setTodoInput]      = useState('');
  const [showTodoInput,  setShowTodoInput]  = useState(false);
  const [selectedDeskItem, setSelectedDeskItem] = useState(null); // ticker chip tapped open, shown in NextUpCard's detail sheet
  const [nextActionTarget, setNextActionTarget] = useState(null); // project awaiting a next_action from the quick-set sheet
  const [nextActionDraft,  setNextActionDraft]  = useState('');
  const [savingNextAction, setSavingNextAction] = useState(false);

  // Ideas
  const [ideas,          setIdeas]          = useState([]);

  const [showCalendar,   setShowCalendar]   = useState(false);

  // STUDY / PLAY shortcuts — tap goes somewhere random, hold picks explicitly
  const [showStudyMenu, setShowStudyMenu] = useState(false);
  const [showPlayMenu,  setShowPlayMenu]  = useState(false);

  const [selectedIdea,     setSelectedIdea]     = useState(null);
  const [showIdeaCard,     setShowIdeaCard]     = useState(false);

  const today   = new Date();
  const todayStr = toLocalDateStr(today); // local calendar — see logic/dateUtils

  // Rotating affirmation — changes each day
  const todaysAffirmation = affirmations.length > 0
    ? affirmations[Math.floor(Date.now() / 86400000) % affirmations.length]
    : null;

  const todaysQuote = getTodaysQuote(quotePool);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadAll(user.id); }
    });
  }, []);

  // Remote quotes pool — falls back to the local QUOTES array (via
  // getTodaysQuote) until this resolves, or forever if it fails/is empty.
  useEffect(() => {
    fetchContentPool('quote').then((rows) => {
      if (rows.length) {
        setQuotePool(rows.map((r) => ({ text: r.body, author: r.meta?.author || '' })));
      }
    });
  }, []);

  // Daily-task / streak reminders — re-synced whenever today's mission or
  // streak state changes, so a reminder already scheduled for "tasks
  // incomplete" gets cancelled the moment the last one is finished. Opt-in
  // via Settings > Daily Reminders (SETTING_KEYS.DAILY_REMINDERS_ENABLED).
  const [remindersEnabled] = useSetting(SETTING_KEYS.DAILY_REMINDERS_ENABLED, false);
  const lastReminderSyncRef = useRef(null);
  useEffect(() => {
    if (!remindersEnabled || !profile) return;
    const { tasksAllComplete, checkedInToday } = computeReminderState({ dailyMissions, profile });
    // `profile` is a new object on every refresh, so this effect re-runs far
    // more often than the reminders actually change — and a sync is now ~14
    // scheduling calls (a rolling multi-day window, see notificationScheduler).
    // Only re-sync when something that changes the outcome has changed.
    const sig = `${tasksAllComplete}|${checkedInToday}`;
    if (lastReminderSyncRef.current === sig) return;
    lastReminderSyncRef.current = sig;
    syncReminders({ enabled: true, tasksAllComplete, checkedInToday });
  }, [remindersEnabled, dailyMissions, profile]);

  useFocusEffect(useCallback(() => {
    if (userId) loadAll(userId);
  }, [userId]));

  // Applies a previously-cached (or freshly-fetched) desk snapshot to state.
  // Same shape either way, so a cold offline launch and a live load render
  // identically — nothing on Home has to know which one it got.
  const applyDeskSnapshot = (snap) => {
    if (!snap) return;
    if (snap.todayFocus !== undefined) { setTodayFocus(snap.todayFocus || ''); setFocusDraft(snap.todayFocus || ''); }
    if (snap.todos)     setTodos(snap.todos);
    if (snap.ideas)     setIdeas(snap.ideas);
    if (snap.affirmations)  setAffirmations(snap.affirmations);
    if (snap.focusPresets)  setFocusPresets(snap.focusPresets);
  };

  const loadAll = async (uid) => {
    const cacheKey = `home_desk_${uid}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) applyDeskSnapshot(cached);

      if (!(await isOnline())) return; // cached snapshot is as current as we can get right now

      const [
        focusRes, tasksRes, projRes, capturesRes,
        ideasRes, settingsRes, assignmentsRes,
      ] = await Promise.all([
        supabase.from('daily_focus').select('focus_text').eq('user_id', uid).eq('focus_date', todayStr).maybeSingle(),
        supabase.from('tasks').select('id, title').eq('user_id', uid).eq('completed', false).order('priority').limit(3),
        supabase.from('projects').select('id, title, emoji, color, next_action').eq('user_id', uid).eq('status', 'active').is('deleted_at', null).limit(3),
        supabase.from('captures').select('id, title, type').eq('user_id', uid).eq('status', 'inbox').is('deleted_at', null).limit(2),
        supabase.from('garden_cores').select('id, title, plant_type, color, color_light, is_project, project_progress, garden_petals(id, title, petal_type, completed)').eq('user_id', uid).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_settings').select('affirmation, focus_presets').eq('user_id', uid).maybeSingle(),
        // Fails soft — the institutional-layer migration may not be applied
        // yet (ORG_NOT_CONFIGURED), and that should degrade this one rail
        // source silently rather than blank the whole desk.
        getMyOpenAssignments(5).catch(() => []),
      ]);

      // Focus
      if (focusRes.data) { setTodayFocus(focusRes.data.focus_text || ''); setFocusDraft(focusRes.data.focus_text || ''); }

      // Next-action candidates — tasks, projects, captures, cohort
      // assignments, ranked so NextUpCard always has one clear front-runner
      // instead of 8 equally-loud chips: an actual task first (it's already
      // a defined action), then what's due soonest, then a project that has
      // its next_action defined (surface that action's text directly),
      // then a project still needing one (prompts you to set it), then an
      // unprocessed capture last.
      // `kind` is the discriminator every handler/action-list switches on;
      // `source` stays the human-readable badge text. Keeping them separate
      // matters specifically for captures — a capture's own `type` can
      // itself be 'task' (e.g. a quick-captured to-do that hasn't been
      // routed into the real tasks table yet), which used to collide with
      // a real task's source and made this card try to complete a
      // captures row through the tasks table.
      const merged = [
        ...(tasksRes.data    || []).map(tk => ({ id: 'task_' + tk.id, title: tk.title, source: 'task', kind: 'task', color: c.teal, rank: 0 })),
        ...(assignmentsRes   || []).map(a  => ({ id: 'assign_' + a.assignment_id, title: a.title, source: 'assignment', kind: 'assignment', color: c.gold,
                                                  notes: a.due_date ? `Due ${a.due_date} · ${a.cohort_name}` : a.cohort_name,
                                                  meta: { assignmentId: a.assignment_id }, rank: 1 })),
        ...(projRes.data     || []).map(p  => ({
          id: 'proj_' + p.id,
          title: p.next_action || `${p.emoji || '🚀'} ${p.title}`,
          source: 'project', kind: 'project', color: p.color || c.gold,
          projectTitle: p.title, hasNextAction: !!p.next_action,
          meta: { project: p },
          rank: p.next_action ? 2 : 3,
        })),
        ...(capturesRes.data || []).map(n  => ({
          id: 'cap_' + n.id, title: n.title || 'Untitled note',
          source: n.type, kind: 'capture', captureType: n.type,
          color: c.gold, rank: 4,
        })),
      ].sort((a, b) => a.rank - b.rank).slice(0, 6);
      setTodos(merged);

      // Ideas
      if (ideasRes.data) setIdeas(ideasRes.data);

      // Affirmations — stored as JSON array in user_settings
      let nextAffirmations, nextFocusPresets;
      if (settingsRes.data) {
        if (settingsRes.data.affirmation) {
          // Legacy single affirmation — migrate to array
          try {
            const parsed = JSON.parse(settingsRes.data.affirmation);
            nextAffirmations = Array.isArray(parsed) ? parsed : [settingsRes.data.affirmation];
          } catch {
            nextAffirmations = [settingsRes.data.affirmation];
          }
          setAffirmations(nextAffirmations);
        }
        if (settingsRes.data.focus_presets) {
          try {
            const parsed = JSON.parse(settingsRes.data.focus_presets);
            if (Array.isArray(parsed)) { nextFocusPresets = parsed; setFocusPresets(parsed); }
          } catch {}
        }
      }

      // setState above hasn't committed yet within this same tick, so cache
      // the values just computed rather than reading the (still-stale)
      // `affirmations`/`focusPresets` state back out.
      await cacheWrite(cacheKey, {
        todayFocus: focusRes.data?.focus_text ?? null,
        todos: merged,
        ideas: ideasRes.data || [],
        affirmations: nextAffirmations ?? affirmations,
        focusPresets: nextFocusPresets ?? focusPresets,
      });
    } catch (e) { console.warn('HomeScreen loadAll', e); }
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  // Focus handlers
  const saveFocus = async () => {
    setTodayFocus(focusDraft); setEditFocus(false);
    if (!userId) return;
    const { error } = await supabase.from('daily_focus').upsert({ user_id: userId, focus_text: focusDraft, focus_date: todayStr });
    if (error) console.warn('HomeScreen: saveFocus', error.message);
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
    let data;
    if (userId) {
      // Same id whether this lands live now or gets queued for when
      // connectivity returns (offlineWrite) — previously this had no
      // try/catch at all, so offline it threw and silently dropped
      // whatever was typed (todoInput never even cleared).
      try {
        const { row } = await offlineWrite(supabase, 'tasks', item);
        data = row;
      } catch (e) { console.warn('HomeScreen addTodo', e); }
    } else {
      data = { ...item, id: Date.now().toString() };
    }
    // Whatever you just typed is the thing on your mind right now — put it
    // straight in front of the ticker instead of appending to the back of
    // the ranked list where it might not surface for a while.
    if (data) setTodos(prev => [{ id: 'task_' + data.id, title: data.title, source: 'task', kind: 'task', color: c.teal, rank: -1 }, ...prev]);
    setTodoInput(''); setShowTodoInput(false);
  };

  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Jumping straight into a nested screen on a tab that hasn't been
  // visited yet in this session (the app opens on Home) makes React
  // Navigation initialize that tab's stack with ONLY the target screen —
  // no LibraryScreen underneath it, so there's nothing to swipe/pop back
  // to. Navigating to the tab root first primes its history; the second
  // call (deferred a tick, since two synchronous navigate() calls aren't
  // guaranteed to apply in order) then pushes the destination on top.
  // Every Library destination reachable this way also has its own back
  // button as a hard backstop in case this priming doesn't land in time.
  const goToLibraryScreen = (screen, params) => {
    navigation.navigate('Library');
    setTimeout(() => navigation.navigate('Library', { screen, params }), 0);
  };

  // Removes a resolved candidate from the ranked list — the ticker just
  // renders one fewer chip next tick, nothing to re-index.
  const dismissDeskItem = (id) => setTodos(prev => prev.filter(it => it.id !== id));

  // Every one of these closes the detail sheet first — each either
  // resolves the item, navigates away, or opens a different sheet
  // (promptNextAction), so there's nothing left for this one to show.
  const closeDeskSheet = () => setSelectedDeskItem(null);

  const completeDeskTask = async (item) => {
    closeDeskSheet();
    const rawId = item.id.replace(/^task_/, '');
    dismissDeskItem(item.id);
    if (!userId) return;
    try { await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: complete task', e.message); }
  };

  const deleteDeskTask = async (item) => {
    closeDeskSheet();
    const rawId = item.id.replace(/^task_/, '');
    dismissDeskItem(item.id);
    try { await supabase.from('tasks').delete().eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: delete task', e.message); }
  };

  const completeDeskAssignment = async (item) => {
    closeDeskSheet();
    const assignmentId = item.meta?.assignmentId;
    if (!assignmentId) return;
    dismissDeskItem(item.id);
    try { await updateAssignmentStatus(assignmentId, 'completed'); }
    catch (e) { console.warn('HomeScreen: complete assignment', e.message); }
  };

  const openDeskProject = (item) => { closeDeskSheet(); goToLibraryScreen('ProjectDetail', { project: item.meta.project }); };

  // Opens the quick-set sheet — used both to set a project's first next
  // action and to replace an existing one, prefilled with whatever's
  // there now (item.title already *is* the current next_action text once
  // hasNextAction is true).
  const promptNextAction = (item) => {
    closeDeskSheet();
    setNextActionDraft(item.hasNextAction ? item.title : '');
    setNextActionTarget(item);
  };

  // Timer icon on a task/project candidate — jump straight into a focused
  // Work Mode session instead of just marking done / opening the project.
  const focusOnDeskItem = (item) => {
    closeDeskSheet();
    if (item.kind === 'project') { goToLibraryScreen('WorkModeScreen', { project: item.meta.project }); return; }
    goToLibraryScreen('WorkModeScreen', { presetTitle: item.title });
  };

  // Captures — send to the inbox's full destination picker (same as
  // tapping the item there), or resolve right from the desk for the
  // handful of things that don't need that picker.
  const processDeskCapture = (item) => { closeDeskSheet(); goToLibraryScreen('CaptureInbox'); };

  const saveDeskCaptureForLater = async (item) => {
    closeDeskSheet();
    const rawId = item.id.replace(/^cap_/, '');
    dismissDeskItem(item.id);
    const laterType = item.captureType === 'video' ? 'watch' : 'read';
    try { await supabase.from('captures').update({ save_for_later: laterType }).eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: save capture for later', e.message); }
  };

  const archiveDeskCapture = async (item) => {
    closeDeskSheet();
    const rawId = item.id.replace(/^cap_/, '');
    dismissDeskItem(item.id);
    try { await supabase.from('captures').update({ status: 'archived' }).eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: archive capture', e.message); }
  };

  const deleteDeskCapture = async (item) => {
    closeDeskSheet();
    const rawId = item.id.replace(/^cap_/, '');
    dismissDeskItem(item.id);
    // Soft delete — same 7-day Recently Deleted behavior as Capture Inbox's
    // own delete (src/api/trashService.js), not a permanent removal.
    try { await supabase.from('captures').update({ deleted_at: new Date().toISOString() }).eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: delete capture', e.message); }
  };

  // What NextUpCard's action row shows depends entirely on what kind of
  // candidate is open — a task can be done or deleted, a project can be
  // opened or given a next step, a capture has real routing choices. Kept
  // here (next to the handlers above) rather than inside NextUpCard so the
  // component itself doesn't need to know any of this domain logic.
  const actionsForDeskItem = (item) => {
    if (!item) return [];
    if (item.kind === 'task') return [
      { key: 'done',   label: 'Done',   icon: 'checkmark-circle-outline', tone: 'primary', onPress: () => completeDeskTask(item) },
      { key: 'focus',  label: 'Focus',  icon: 'timer-outline',            tone: 'secondary', onPress: () => focusOnDeskItem(item) },
      { key: 'delete', label: 'Delete', icon: 'trash-outline',            tone: 'danger', onPress: () => deleteDeskTask(item) },
    ];
    if (item.kind === 'assignment') return [
      { key: 'complete', label: 'Complete', icon: 'checkmark-circle-outline', tone: 'primary', onPress: () => completeDeskAssignment(item) },
    ];
    if (item.kind === 'project') {
      const stepAction = { key: 'step', label: item.hasNextAction ? 'New Step' : 'Set Next Step', icon: 'flag-outline', tone: item.hasNextAction ? 'secondary' : 'primary', onPress: () => promptNextAction(item) };
      const openAction = { key: 'open', label: 'Open Project', icon: 'rocket-outline', tone: item.hasNextAction ? 'primary' : 'secondary', onPress: () => openDeskProject(item) };
      return [
        ...(item.hasNextAction ? [openAction, stepAction] : [stepAction, openAction]),
        { key: 'focus', label: 'Focus', icon: 'timer-outline', tone: 'secondary', onPress: () => focusOnDeskItem(item) },
      ];
    }
    // capture
    const actions = [{ key: 'process', label: 'Process', icon: 'arrow-forward-circle-outline', tone: 'primary', onPress: () => processDeskCapture(item) }];
    if (['link', 'video', 'resource'].includes(item.captureType)) {
      actions.push({ key: 'later', label: item.captureType === 'video' ? 'Watch Later' : 'Read Later', icon: 'bookmark-outline', tone: 'secondary', onPress: () => saveDeskCaptureForLater(item) });
    }
    actions.push({ key: 'archive', label: 'Archive', icon: 'archive-outline', tone: 'secondary', onPress: () => archiveDeskCapture(item) });
    actions.push({ key: 'delete', label: 'Delete', icon: 'trash-outline', tone: 'danger', onPress: () => deleteDeskCapture(item) });
    return actions;
  };

  const saveNextActionFor = async () => {
    if (!nextActionTarget || !nextActionDraft.trim()) return;
    const projectId = nextActionTarget.meta.project.id;
    const text = nextActionDraft.trim();
    setSavingNextAction(true);
    try {
      await supabase.from('projects').update({ next_action: text, updated_at: new Date().toISOString() }).eq('id', projectId);
      setTodos(prev => prev.map(it => it.id === nextActionTarget.id
        ? { ...it, title: text, hasNextAction: true, meta: { project: { ...it.meta.project, next_action: text } } }
        : it));
      setNextActionTarget(null);
    } catch (e) {
      console.warn('HomeScreen: set next action', e.message);
      Alert.alert('Could not save', 'Something went wrong — try again.');
    }
    setSavingNextAction(false);
  };

  const goStudy = () => {
    const pick = STUDY_DESTINATIONS[Math.floor(Math.random() * STUDY_DESTINATIONS.length)];
    goToLibraryScreen(pick.key);
  };
  const pickStudy = (key) => {
    setShowStudyMenu(false);
    goToLibraryScreen(key);
  };

  const goPlay = () => {
    const pick = GAMES[Math.floor(Math.random() * GAMES.length)];
    navigation.navigate('Play', { gameId: pick.key });
  };
  const pickGame = (gameId) => {
    setShowPlayMenu(false);
    navigation.navigate('Play', { gameId });
  };

  return (
    // "On the Desk"'s inline add-todo input (below) sat unprotected in this
    // main ScrollView — no KeyboardAvoidingView meant the keyboard just
    // covered it on a real device instead of the view shifting to keep it
    // visible, unlike the two edit modals further down which already wrap
    // their own inputs this way.
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {bgMode === 'player' && <PlayerMatchBackground background={playerBackground} />}
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
              <Text style={{ fontSize: t.xs, color: c.gold, fontWeight: t.semibold }}>{showEmojis ? '🔥 ' : ''}{streakDays} day streak</Text>
            </View>
          )}
        </View>

        {/* ── HQ card ── */}
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 2, borderTopColor: c.gold }}>
          <CommanderCard
            profile={profile}
            rank={rank}
            progress={progress}
            c={c} t={t}
            onPress={() => navigation.navigate('Profile')}
          />
          <TourSpot id="home-study-play">
          <View style={{ flexDirection: 'row', gap: 10, marginTop: s.md }}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.teal, backgroundColor: c.tealLight, borderRadius: r.md, paddingVertical: s.md }}
              onPress={goStudy} onLongPress={() => setShowStudyMenu(true)} delayLongPress={350}>
              <Ionicons name="book-outline" size={15} color={c.teal} />
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.teal, letterSpacing: 1 }}>STUDY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.md }}
              onPress={goPlay} onLongPress={() => setShowPlayMenu(true)} delayLongPress={350}>
              <Ionicons name="game-controller-outline" size={15} color="#fff" />
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: '#fff', letterSpacing: 1 }}>PLAY</Text>
            </TouchableOpacity>
          </View>
          </TourSpot>
        </View>

        {/* ── Quote + affirmation ── */}
        <TourSpot id="home-focus">
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginHorizontal: s.lg, marginBottom: s.md, borderLeftWidth: 3, borderLeftColor: c.teal, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.sm }}>
            <Text style={{ fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.semibold }}>{showEmojis ? '✦ ' : ''}Today's Wisdom</Text>
            <TouchableOpacity onPress={() => setEditAffirm(true)}>
              <Ionicons name="add-circle-outline" size={20} color={c.gold} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20, fontStyle: 'italic', marginBottom: s.sm }}>"{todaysQuote.text}"</Text>
          <Text style={{ fontSize: t.xs, color: c.text3 }}>— {todaysQuote.author}</Text>
          {todaysAffirmation && (
            <TouchableOpacity onPress={() => setEditAffirm(true)}
              style={{ marginTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.sm }}>
              <Text style={{ fontSize: 10, color: c.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{showEmojis ? '💛 ' : ''}My Affirmation</Text>
              <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{todaysAffirmation}</Text>
              {affirmations.length > 1 && (
                <Text style={{ fontSize: 9, color: c.text4, marginTop: 4 }}>{affirmations.length} affirmations rotating daily</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        </TourSpot>

        {/* ── Focus + calendar ── */}
        <TourSpot id="home-focus-input">
        <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg, flexDirection: 'row', gap: s.sm }}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border }}
            onPress={() => { setFocusDraft(todayFocus || ''); setEditFocus(true); }}>
            <Ionicons name="bookmark" size={14} color={c.teal} />
            <Text style={{ flex: 1, fontSize: t.sm, color: todayFocus ? c.text1 : c.text4, lineHeight: 20 }} numberOfLines={2}>
              {todayFocus || "Set today's focus..."}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: c.bg1, borderRadius: r.md, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center', minWidth: 70 }}
            onPress={() => setShowCalendar(true)}>
            <Text style={{ fontSize: t.xxl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1, lineHeight: 28 }}>{today.getDate()}</Text>
            <Text style={{ fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>
        </TourSpot>

        {/* ── On the desk ── */}
        <TourSpot id="home-desk">
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
          <DeskTicker
            items={todos}
            onItemPress={setSelectedDeskItem}
            onAdd={() => setShowTodoInput(true)}
            c={c} t={t} s={s} r={r}
          />
        </View>
        </TourSpot>

        {/* ── Latest ideas ── */}
        {ideas.length > 0 && (
          <View style={{ paddingHorizontal: s.lg, marginBottom: s.lg }}>
            <SectionHead title="Latest Ideas" action="Garden →" onAction={() => navigation.navigate('Library')} c={c} t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {ideas.map(idea => (
                  <TouchableOpacity key={idea.id}
                    onPress={() => { setSelectedIdea(idea); setShowIdeaCard(true); }}
                    activeOpacity={0.85}
                    style={{ width: 110, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: idea.color || c.teal, alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 28 }}>
                      {idea.plant_type === 'tree' ? '🌳' : idea.plant_type === 'flower' ? '🌸' : idea.plant_type === 'plant' ? '🌿' : '🌱'}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: t.medium, color: c.text1, textAlign: 'center', lineHeight: 15 }} numberOfLines={2}>
                      {idea.title}
                    </Text>
                    {(idea.garden_petals?.length > 0) && (
                      <Text style={{ fontSize: 9, color: idea.color || c.teal }}>
                        {idea.garden_petals.length} petals
                      </Text>
                    )}
                  </TouchableOpacity>
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

      {/* ── Desk ticker chip, tapped open — NextUpCard's full detail ── */}
      <Modal visible={!!selectedDeskItem} transparent animationType="slide" onRequestClose={() => setSelectedDeskItem(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            {selectedDeskItem && (
              <NextUpCard
                item={selectedDeskItem}
                actions={actionsForDeskItem(selectedDeskItem)}
                c={c} t={t} s={s} r={r}
              />
            )}
            <TouchableOpacity onPress={() => setSelectedDeskItem(null)}
              style={{ marginTop: s.md, padding: s.md, alignItems: 'center' }}>
              <Text style={{ color: c.text3, fontWeight: '600' }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Set next action (from the desk's "Set next step →" CTA) ── */}
      <Modal visible={!!nextActionTarget} transparent animationType="slide" onRequestClose={() => setNextActionTarget(null)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>
              {showEmojis ? '🚩 ' : ''}What's next for {nextActionTarget?.projectTitle}?
            </Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.md }}>One concrete, physical step — not the whole project.</Text>
            <TextInput
              style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.lg }}
              value={nextActionDraft} onChangeText={setNextActionDraft}
              placeholder="e.g. Sketch the first page" placeholderTextColor={c.text4}
              autoFocus onSubmitEditing={saveNextActionFor} returnKeyType="done"
            />
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <TouchableOpacity onPress={() => setNextActionTarget(null)}
                style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ color: c.text3, fontSize: t.sm }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveNextActionFor} disabled={!nextActionDraft.trim() || savingNextAction}
                style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: c.teal, borderRadius: r.md, opacity: !nextActionDraft.trim() ? 0.5 : 1 }}>
                {savingNextAction ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Idea preview card ── */}
      <IdeaPreviewCard
        idea={selectedIdea}
        visible={showIdeaCard}
        onClose={() => setShowIdeaCard(false)}
        c={c} t={t} s={s} r={r}
      />

      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        userId={userId}
        initialDate={today}
      />

      {/* ── Hold STUDY: pick a destination ── */}
      <Modal visible={showStudyMenu} transparent animationType="slide" onRequestClose={() => setShowStudyMenu(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowStudyMenu(false)}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 44 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.lg, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Study</Text>
            {STUDY_DESTINATIONS.map(d => (
              <TouchableOpacity key={d.key} onPress={() => pickStudy(d.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: s.md, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                <Ionicons name={d.icon} size={18} color={c.teal} />
                <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: '600', flex: 1 }}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Hold PLAY: pick any game ── */}
      <Modal visible={showPlayMenu} transparent animationType="slide" onRequestClose={() => setShowPlayMenu(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowPlayMenu(false)}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 44, maxHeight: '75%' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.lg, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Play</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {GAMES.map(game => (
                <TouchableOpacity key={game.key} onPress={() => pickGame(game.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: s.md, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                  <Text style={{ fontSize: 20 }}>{game.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: '600' }}>{game.title}</Text>
                    <Text style={{ fontSize: 11, color: c.text4 }}>{game.subject}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}
