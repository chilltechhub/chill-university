// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// Aliased: this file already has its own `dateStr` (the long, human-readable
// header date) and its own `todayStr` const further down.
import { dateStr as toLocalDateStr, daysBetween, todayStr as localTodayStr } from '../logic/dateUtils';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Modal, KeyboardAvoidingView,
  Platform, FlatList, Alert, ActivityIndicator, Animated, Easing,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useTour } from '../../context/TourContext';
import { WIDGET_INTROS } from '../data/widgetIntros';
import { useTheme } from '../../context/ThemeContext';
import { Button, Eyebrow, Readout } from '../components/ui';
import { areaColor } from '../data/areaColors';
import { CREST_COLORS as CREST_OPTIONS } from '../data/crestOptions';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useUserProgress } from '../../context/UserProgressContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/profileScopedClient';
import { fetchContentPool } from '../api/remoteConfigService';
import { getMyOpenAssignments, updateAssignmentStatus } from '../api/organizationService';
import { completeInstance, skipInstance } from '../api/plannerService';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../api/offlineCache';
import { syncReminders, computeReminderState } from '../logic/notificationScheduler';
import TourSpot from '../components/TourSpot';
import CalendarModal from '../components/CalendarModal';
import WidgetBoard from '../components/WidgetBoard';
import LevelRing from '../components/LevelRing';
import PlayerMatchBackground from '../components/PlayerMatchBackground';
import GettingStartedCard from '../components/GettingStartedCard';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { getPersona, DEFAULT_PERSONA } from '../data/personas';
import { HabitRingsWidget, LifeAreasWidget, DailyDrillsWidget } from '../components/widgets/PersonalWidgets';
import { StudyBlocksWidget, ClassProgressWidget } from '../components/widgets/StudentWidgets';
import { OrgSnapshotWidget, SystemsCheckWidget, RecurringOpsWidget } from '../components/widgets/BusinessWidgets';
import { VaultStatusWidget, FounderQuestWidget, TargetsReadinessWidget } from '../components/widgets/EntrepreneurWidgets';
import { WayfinderWidget } from '../components/widgets/WayfinderWidget';
import QuestWidget from '../components/widgets/QuestWidget';
import CompassCard from '../components/CompassCard';
import GoalStepsWidget from '../components/GoalStepsWidget';
import StageStepsWidget from '../components/StageStepsWidget';
import { getWayfinderIntent } from '../api/wayfinderService';
import { useAccess } from '../../context/AccessContext';
import { starterWidgetLayout } from '../logic/experienceStage';
import useCharacterLoadout from '../logic/useCharacterLoadout';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { RANK_LABELS } from '../theme';
import { GAMES_MASTER } from './GamesScreen';
import { LIFE_AREAS } from './library/LifeAreaScreen';

function daysSince(iso) {
  if (!iso) return null;
  // A bare 'YYYY-MM-DD' (life_areas.last_check_date) is a local calendar
  // date. new Date() reads it as UTC midnight, so a rating saved this
  // evening in the US showed as "1d ago" within minutes. Count dates for
  // those; elapsed time only for real timestamps.
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return Math.max(0, daysBetween(iso, localTodayStr()) ?? 0);
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}
// A domain counts as "due" once it's been this long since its last rating —
// or if it's never been checked in at all. Same threshold LibraryScreen's
// Domains tab uses for its own due chips.
const CHECKIN_DUE_DAYS = 7;

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

// ─── Today's Activities — type styling ────────────────────────────────────────
// Same palette as CalendarModal's EVENT_TYPES/PLANNER_AREAS so an item looks
// like the same thing whether you meet it here or in the full calendar.
const ACTIVITY_TYPES = {
  event:    { label: 'Event',    icon: 'calendar-outline',         color: '#2bb5a0' }, // style-ok: category palette, matches CalendarModal
  reminder: { label: 'Reminder', icon: 'notifications-outline',    color: '#c9a84c' }, // style-ok: category palette, matches CalendarModal
  note:     { label: 'Note',     icon: 'document-text-outline',    color: '#8b4fc4' }, // style-ok: category palette, matches CalendarModal
  task:     { label: 'Task',     icon: 'checkmark-circle-outline', color: '#3ac860' }, // style-ok: category palette, matches CalendarModal
  assignment: { label: 'Assignment', icon: 'school-outline',       color: '#c9a84c' }, // style-ok: category palette, matches CalendarModal
  planner:  { label: 'Routine',  icon: 'repeat-outline',           color: '#2bb5a0' }, // style-ok: category palette, matches CalendarModal
};
// Colours come from the one shared area palette (src/data/areaColors.js) —
// this map had drifted from it (mental purple here, blue everywhere else).
const PLANNER_AREA_META = Object.fromEntries(Object.entries({
  physical: '💪', mental: '🧠', social: '🤝', financial: '💰',
  professional: '🚀', spiritual: '✨', creative: '🎨', digital: '💻',
}).map(([id, emoji]) => [id, { emoji, color: areaColor(id) }]));
function fmtActivityTime(t24) {
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ─── Dashboard widgets ─────────────────────────────────────────────────────
// The rearrangeable pieces of Home, iOS-widget-screen style — see
// WidgetBoard.js for the drag/jiggle mechanics and how `layout` (order +
// hidden flags) round-trips through user_settings.home_widget_layout.
// Every widget Home can render, across all account types. Titles here are
// what shows in the "hidden widgets" tray while editing.
//
// The first nine are the originals, available to everyone. The eleven below
// them are the persona widgets — they're in the same flat list on purpose,
// so a Student who wants the Vault on their dashboard can just un-hide it.
// The account type decides the DEFAULT layout, not what's permitted.
const WIDGET_DEFS = [
  { key: 'hq',         title: 'Commander' },
  { key: 'wisdom',      title: "Today's Wisdom" },
  { key: 'focus',       title: 'Focus & Calendar' },
  { key: 'activities',  title: "Today's Activities" },
  { key: 'desk',        title: 'On the Desk' },
  { key: 'ideas',       title: 'Latest Ideas' },
  { key: 'streak',      title: 'Streak & Level' },
  { key: 'builds',      title: 'Active Builds' },
  { key: 'checkins',    title: 'Check-ins Due' },
  // Not tied to one persona — see personas.defaultWidgets and the
  // `exploring` option on layoutForPersona.
  { key: 'wayfinder',   title: 'Wayfinder' },
  // The purpose/objective layer. A widget rather than a pinned card so the
  // board stays the one system that owns the dashboard — it defaults to
  // directly under the HQ card, and stays reorderable from there.
  { key: 'compass',     title: 'Compass' },
  // The steps of the goal in flight, ticked or not — the Compass card
  // shows only the next one.
  { key: 'goalSteps',   title: 'Your steps' },
  // Which stage the app is at, what the next one brings, and the two things
  // that open it. See src/components/StageStepsWidget.js.
  { key: 'stageSteps',  title: 'Your stage' },
  // Persona widgets — src/components/widgets/
  { key: 'habitRings',       title: 'Habits' },
  { key: 'lifeAreas',        title: 'Life Areas' },
  { key: 'dailyDrills',      title: "Today's Drills" },
  { key: 'studyBlocks',      title: 'Study Blocks' },
  { key: 'classProgress',    title: 'Subjects' },
  { key: 'orgSnapshot',      title: 'Organization' },
  { key: 'systemsCheck',     title: 'Systems Check' },
  { key: 'recurringOps',     title: 'Recurring Ops' },
  { key: 'vaultStatus',      title: 'The Vault' },
  { key: 'founderQuest',     title: 'Founder Quest' },
  { key: 'targetsReadiness', title: 'Targets & Readiness' },
  // Every type: the next quest (src/data/quests.js). Joins Home at each
  // type's third stage, alongside the next three games.
  { key: 'quests',           title: 'Quests' },
];
const WIDGET_KEYS = WIDGET_DEFS.map(w => w.key);

// One line on what each widget shows, for the "new widget" offer. A title on
// its own ("Systems Check") doesn't tell anyone whether they'd want it.
const WIDGET_BLURBS = {
  hq:               'Your name, level and the Play button.',
  wisdom:           'A daily quote, plus your own affirmation if you set one.',
  focus:            "Today's one focus and a jump into your calendar.",
  activities:       'Everything scheduled for today, in time order.',
  desk:             'The next thing to pick up from your projects, notes and ideas.',
  ideas:            'The newest ideas in your Idea Garden.',
  streak:           'Your streak and level at a glance.',
  builds:           'Projects in progress and how far along each is.',
  checkins:         'Life areas you have not rated in a while.',
  wayfinder:        'Work out what you want, one small experiment at a time.',
  compass:          'Your goal in flight and its next step.',
  goalSteps:        'Every step of your current goal, ticked or not.',
  stageSteps:       'What opens next in the app, and how to get there.',
  habitRings:       'How often you kept each habit over the last week.',
  lifeAreas:        'Your rating for each life area, most out of date first.',
  dailyDrills:      "Today's three drills and the game for the next one.",
  studyBlocks:      "Today's study blocks, done or not.",
  classProgress:    'How far along you are in each class subject.',
  orgSnapshot:      "Your school or team's latest, if you're in one.",
  systemsCheck:     'Your ratings for the work and digital sides of life.',
  recurringOps:     'Routines that repeat weekly or monthly, and what is due.',
  vaultStatus:      'What is in your Vault and what needs filing.',
  founderQuest:     'The next step on the founder track.',
  targetsReadiness: 'Your targets and how ready the paperwork is.',
  quests:           'The next ten-minute quest to try.',
};

// The layout a profile of this type starts with: its persona's ordered
// widgets visible, everything else present but hidden (one tap away in the
// edit tray). This is the thing that makes picking "Student" versus
// "Entrepreneur" actually change the app — before this, `active_widgets` was
// written to every profile row and read by nobody, so all four types got an
// identical dashboard.
//
// `exploring` is onboarding's "I'm not sure yet" answer. Someone who said
// they don't know what they want gets Wayfinder straight under the
// Compass, whatever type they ended up as — it's the one thing on the
// dashboard built for exactly that answer.
function layoutForPersona(personaKey, { exploring = false } = {}) {
  let wanted = getPersona(personaKey)?.defaultWidgets || [];
  if (exploring) {
    const rest = wanted.filter(k => k !== 'wayfinder' && k !== 'compass');
    wanted = [...(wanted.includes('compass') ? ['compass'] : []), 'wayfinder', ...rest];
  }
  const known = new Set(WIDGET_DEFS.map(w => w.key));
  const visible = wanted.filter(k => known.has(k));
  const shown = new Set(visible);
  return [
    ...visible.map(key => ({ key, hidden: false })),
    ...WIDGET_DEFS.filter(w => !shown.has(w.key)).map(w => ({ key: w.key, hidden: true })),
  ];
}

// Reconciles a saved layout against WIDGET_DEFS — drops widgets that no
// longer exist (an older save referencing a removed key) and appends any
// new ones the user's never seen, so an app update that adds a widget
// doesn't silently hide it from someone with a saved layout already.
//
// New widgets are appended HIDDEN rather than visible. That was fine when
// one widget joined a list of eight; appending eleven persona widgets
// visible would rearrange the dashboard of every existing user without
// being asked. Someone with a saved layout keeps exactly what they had.
// A widget added by an app update is appended HIDDEN, so an update never
// rearranges a dashboard someone has already set up. These are the
// exceptions: ones that answer "what do I do next", which are no use
// sitting switched off in the tray.
const NEW_WIDGETS_SHOWN = new Set(['goalSteps', 'stageSteps']);

function reconcileWidgetLayout(stored, personaKey, opts) {
  if (!Array.isArray(stored) || stored.length === 0) return layoutForPersona(personaKey, opts);
  const known = new Set(WIDGET_DEFS.map(w => w.key));
  const kept = stored.filter(l => l && known.has(l.key));
  const seen = new Set(kept.map(l => l.key));
  const added = WIDGET_DEFS.filter(w => !seen.has(w.key))
    .map(w => ({ key: w.key, hidden: !NEW_WIDGETS_SHOWN.has(w.key) }));
  // 'goalSteps' and 'stageSteps' go straight under the Compass card they
  // belong to, rather than to the bottom of the board, where the checklist
  // for the goal in flight — and the card saying what opens next — would sit
  // below everything they're meant to lead.
  const NEAR_COMPASS = ['goalSteps', 'stageSteps'];
  const movers = [];
  NEAR_COMPASS.forEach(key => {
    const at = added.findIndex(l => l.key === key);
    if (at >= 0) movers.push(...added.splice(at, 1));
  });
  if (movers.length) {
    const compassAt = kept.findIndex(l => l.key === 'compass');
    const out = [...kept];
    out.splice(compassAt >= 0 ? compassAt + 1 : 0, 0, ...movers);
    return [...out, ...added];
  }
  return [...kept, ...added];
}

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
// The user's crest colour, from the same list Settings picks it from.
const CREST_COLORS = Object.fromEntries(CREST_OPTIONS.map(cc => [cc.key, cc.color]));
const BADGE_EMOJIS = { explorer: '🧭', builder: '🏗️', scholar: '📚', guardian: '🛡️', pioneer: '🌟', creator: '🎨' };

function CommanderCard({ profile, rank, progress, c, t, onPress }) {
  const { style: ui, accent } = useTheme();
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
        <Text style={[cmd.name, { color: c.text1, fontFamily: ui.titleFont }]} numberOfLines={1}>{name}</Text>
        <Text style={[cmd.rank, { color: crestColor, fontFamily: ui.numberFont }]}>LV {level} · {rankInfo.label}</Text>
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
  name:      { fontSize: 17, fontWeight: '800' },
  rank:      { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, marginTop: 2 },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, action, onAction, c, t }) {
  const { style: ui, accent } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: t.sm, color: ui.name === 'plain' ? c.text2 : c.gold, ...ui.sectionLabel }}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: t.xs, fontWeight: t.semibold, fontFamily: ui.numberFont, color: accent.primary }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


// ─── Focus modal with presets ─────────────────────────────────────────────────
function FocusModal({ visible, draft, setDraft, onSave, onClose, presets, onAddPreset, onDeletePreset, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
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
          <Eyebrow style={{ marginBottom: s.sm }}>Presets</Eyebrow>
          <ScrollView automaticallyAdjustKeyboardInsets style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
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
                  style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.sm, fontSize: t.sm, color: c.text1, borderWidth: ui.borderWidth, borderColor: c.border }}
                  value={newPreset} onChangeText={setNewPreset}
                  placeholder="New preset..." placeholderTextColor={c.text4}
                  autoFocus
                />
                <TouchableOpacity onPress={() => { if (newPreset.trim()) { onAddPreset(newPreset.trim()); setNewPreset(''); setShowPresetInput(false); } }}
                  accessibilityLabel="Add preset"
                  style={{ backgroundColor: accent.primary, borderRadius: ui.buttonRadius, padding: s.sm, justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color={accent.onPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: s.sm, marginTop: s.md }}>
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: s.md, paddingHorizontal: s.lg }}>
              <Text style={{ fontSize: t.sm, color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <Button label="Save" onPress={onSave} fullWidth={false} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Affirmation modal with rotation pool ────────────────────────────────────
function AffirmationModal({ visible, affirmations, onSave, onClose, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
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
              style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: ui.borderWidth, borderColor: c.border }}
              value={input} onChangeText={setInput}
              placeholder="I am capable of..." placeholderTextColor={c.text4}
              onSubmitEditing={add}
            />
            <TouchableOpacity onPress={add}
              accessibilityLabel="Add affirmation"
              style={{ backgroundColor: accent.primary, borderRadius: ui.buttonRadius, padding: s.md, justifyContent: 'center' }}>
              <Ionicons name="add" size={18} color={accent.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView automaticallyAdjustKeyboardInsets style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
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
            <Button label="Save all" onPress={() => onSave(list)} fullWidth={false} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function IdeaPreviewCard({ idea, visible, onClose, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
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
  const ideaColor = idea.color || c.tealMid;

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

          <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: s.xl, gap: s.md, paddingBottom: s.lg }}>
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
                <Text style={{ fontSize: t.xs, color: ideaColor, ...ui.eyebrow, marginBottom: s.sm }}>
                  {showEmojis ? '✅ ' : ''}Tasks ({done}/{tasks.length} done)
                </Text>
                {tasks.slice(0, 4).map((task, i) => (
                  <View key={task.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 4 }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: task.completed ? ideaColor : c.border, backgroundColor: task.completed ? ideaColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {task.completed && <Ionicons name="checkmark" size={9} color={c.bg1} />}
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
                <Text style={{ fontSize: t.xs, color: c.gold, ...ui.eyebrow, marginBottom: s.sm }}>
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
                <Text style={{ fontSize: t.xs, color: c.teal, ...ui.eyebrow, marginBottom: s.sm }}>
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
  const { style: ui, accent } = useTheme();
  const pillColor = tone === 'danger' ? c.error : (color || accent.primary);
  const onFill = color || tone === 'danger' ? c.bg1 : accent.onPrimary;
  const filled = tone === 'primary';
  return (
    <TouchableOpacity onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: filled ? pillColor : 'transparent',
        borderWidth: filled ? 0 : 1, borderColor: pillColor + (filled ? '' : '99'),
        borderRadius: ui.buttonRadius, paddingHorizontal: 12, paddingVertical: 9,
      }}>
      <Ionicons name={icon} size={14} color={filled ? onFill : pillColor} />
      <Text style={{ color: filled ? onFill : pillColor, fontSize: t.xs, ...ui.buttonLabel }}>{label}</Text>
    </TouchableOpacity>
  );
}

function NextUpCard({ item, actions, onAdd, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
  if (!item) {
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderStyle: 'dashed' }}
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
    <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 8 }}>
        <View style={{ backgroundColor: color + '22', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: ui.name === 'plain' ? 11 : 9, color, ...ui.eyebrow }}>{badgeLabel}</Text>
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

// ─── 2b. TODAY'S ACTIVITIES ─────────────────────────────────────────────────
// One row per item actually dated today (calendar events, tasks due today,
// planner routines, assignments due today) — tap opens ActivityDetailCard in
// the same bottom-sheet pattern as the desk ticker's NextUpCard, below.
function ActivityRow({ item, onPress, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
  const meta = ACTIVITY_TYPES[item.type] || ACTIVITY_TYPES.event;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: ui.borderWidth, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: item.color || meta.color }}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: (item.color || meta.color) + '22', alignItems: 'center', justifyContent: 'center' }}>
        {item.emoji ? <Text style={{ fontSize: 14 }}>{item.emoji}</Text> : <Ionicons name={meta.icon} size={15} color={item.color || meta.color} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }} numberOfLines={1}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 1 }}>
          {item.time && <Text style={{ fontSize: 10, color: item.color || meta.color, fontWeight: t.bold }}>{fmtActivityTime(item.time)}</Text>}
          <Text style={{ fontSize: 10, color: c.text3, ...ui.eyebrow, marginBottom: 0 }}>{meta.label}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.text4} />
    </TouchableOpacity>
  );
}

function ActivityDetailCard({ item, actions, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
  if (!item) return null;
  const meta = ACTIVITY_TYPES[item.type] || ACTIVITY_TYPES.event;
  const color = item.color || meta.color;
  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 8 }}>
        <View style={{ backgroundColor: color + '22', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: ui.name === 'plain' ? 11 : 9, color, ...ui.eyebrow }}>{meta.label}</Text>
        </View>
        {item.time && <Text style={{ fontSize: 11, color: c.text3 }}>{fmtActivityTime(item.time)}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
        {item.emoji ? <Text style={{ fontSize: 18 }}>{item.emoji}</Text> : <Ionicons name={meta.icon} size={18} color={color} />}
        <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.bold, color: c.text1 }} numberOfLines={3}>{item.title}</Text>
      </View>
      {item.notes ? <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 6 }} numberOfLines={3}>{item.notes}</Text> : null}
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
const DESK_FADE_W = 28;

// Edge fade for the auto-scrolling ticker below — signals "this keeps
// going past the edge" instead of chips clipping abruptly mid-word. Built
// with react-native-svg (already a dependency, same pattern as the
// sky gradient in PlayerMatchBackground.js) rather than a new library.
function EdgeFade({ side, color }) {
  const stops = side === 'left' ? [1, 0] : [0, 1];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, [side]: 0, width: DESK_FADE_W }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={`deskFade-${side}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={stops[0]} />
            <Stop offset="1" stopColor={color} stopOpacity={stops[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#deskFade-${side})`} />
      </Svg>
    </View>
  );
}

function DeskTicker({ items, onItemPress, onAdd, c, t, s, r }) {
  const { style: ui, accent } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [setWidth, setSetWidth] = useState(0);
  // Reduce Motion: no endless drift. The chips become a plain row you
  // swipe yourself.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (live) setReduceMotion(!!v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => setReduceMotion(!!v));
    return () => { live = false; sub?.remove?.(); };
  }, []);

  useEffect(() => {
    if (!setWidth || reduceMotion || items.length < 3) return;
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
  }, [setWidth, items.length, reduceMotion]);

  if (items.length === 0) {
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderStyle: 'dashed' }}
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
          borderWidth: ui.borderWidth, borderColor: c.border, borderLeftWidth: 2, borderLeftColor: color,
        }}>
        <Text style={{ fontSize: ui.name === 'plain' ? 11 : 9, color, ...ui.eyebrow, marginBottom: 0 }}>
          {item.source || ''}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.text1, maxWidth: 180 }} numberOfLines={1}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // One or two chips don't need to drift, and the loop draws every chip
  // twice to wrap seamlessly, so a single item read as a duplicate: "note:
  // Claim, evidence…" shown twice side by side. Those get the plain row.
  if (reduceMotion || items.length < 3) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }} contentContainerStyle={{ paddingHorizontal: s.lg }}>
        {items.map(item => chip(item, 'a'))}
      </ScrollView>
    );
  }

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
      <EdgeFade side="left" color={c.bg0} />
      <EdgeFade side="right" color={c.bg0} />
    </View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh, style: ui, accent } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const { profile, streakDays, rank, progress, level, points, dailyMissions, subjectProgress, progressEvents } = useUserProgress();
  // The active profile's type is what decides this dashboard's default
  // layout, and `active` is what the entrepreneur widgets scope their vault
  // documents and baseline to.
  const { activeType, active: activeProfile, refresh: refreshProfiles } = useProfiles();
  // How much of the app is on show (src/data/experienceStages.js). Until the
  // 'dashboard' stage, Home is the widgets this type's path has opened so
  // far, a couple at a time, with no editor. 'dashboard' brings this type's
  // own layout and an editor offering this type's widgets; 'doors' offers
  // all twenty.
  const { can, opened, isScreenVisible, isGameVisible, signalAction, stageEvents } = useAccess();
  const { active: tourActive, startLesson } = useTour();
  const homeFocused = useIsFocused();
  const { background: playerBackground } = useCharacterLoadout({ level, points, rank, streakDays });
  // Set from Settings → Appearance, not on this screen itself.
  const [bgMode] = useSetting(SETTING_KEYS.HOME_BACKGROUND, 'plain');
  // The remote kill switch and the stage, both — see isGameVisible.
  const GAMES = useMemo(
    () => GAMES_MASTER.filter(g => isGameVisible(g.key)),
    [isGameVisible]
  );
  // STUDY picks among these, so it can only land somewhere this stage shows.
  // A Personal account's first day has none of them — the button steps
  // aside rather than going somewhere it shouldn't.
  const studyDestinations = useMemo(
    () => STUDY_DESTINATIONS.filter(d => isScreenVisible(d.key)),
    [isScreenVisible]
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

  // Today's Activities — everything actually scheduled/due today (calendar
  // events, tasks due today, planner routines, cohort assignments due today),
  // as opposed to "On the Desk" above which is a ranked NEXT-ACTION pick
  // regardless of date. See loadAll for the merge.
  const [todayActivities, setTodayActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Ideas
  const [ideas,          setIdeas]          = useState([]);

  // New widgets — Active Builds, Check-ins Due (Streak & Level needs no
  // fetch of its own, it just reads level/points/streakDays above).
  const [activeBuilds,   setActiveBuilds]   = useState([]);
  const [checkInDue,     setCheckInDue]     = useState([]);
  const [lifeAreaStats,  setLifeAreaStats]  = useState([]); // every area + rating; see loadAll
  // loadAll is memoised on [userId] via useFocusEffect, so it closes over
  // whatever activeProfile/activeType were at that moment. Reading them
  // through refs keeps it on the current values without re-creating the
  // callback (and re-running the whole load) every time the context ticks.
  const activeProfileIdRef = useRef(null);
  const activeTypeRef = useRef(DEFAULT_PERSONA);

  const [showCalendar,   setShowCalendar]   = useState(false);

  // Dashboard widget order/visibility — see WIDGET_DEFS above and
  // WidgetBoard.js. Edits are local-only (fast, no network) while editing;
  // the whole layout is written to Supabase once, on "Done" (exitWidgetEdit).
  const [widgetLayout,   setWidgetLayout]   = useState(() => layoutForPersona(activeType));
  const [editingWidgets, setEditingWidgets] = useState(false);
  // True once this profile has a saved arrangement (loaded, or saved from
  // Edit). Before the 'dashboard' stage it decides whether the board follows
  // the stage's starter order or the person's own.
  const [savedLayout,    setSavedLayout]    = useState(false);

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

  // Switching profiles switches dashboards. Without this, the layout state
  // holds whatever the previous profile had until something else forces a
  // reload — which is exactly the "picking a type doesn't change anything"
  // complaint, just one level up.
  //
  // Only fires on a genuine profile CHANGE, tracked by id in a ref. It used
  // to run whenever the context handed back a new object with the same id,
  // which meant a stale cached active_widgets could land on top of an edit
  // the user had just made — the layout appearing to revert on its own.
  // ── The one place the dashboard layout is decided ────────────────────────
  // Reads persona_profiles directly rather than trusting the context's
  // cached copy, because exitWidgetEdit writes to that table and the cache
  // lags behind. Keyed on the profile id so it runs once per profile:
  // switching profiles switches dashboards, but a re-render (or a context
  // refresh after a save) must never re-apply an older layout on top of an
  // edit the user just made.
  //
  // Order of preference:
  //   1. this profile's own saved layout (an array of {key, hidden})
  //   2. the account-wide layout from before layouts were per-profile
  //   3. this persona's default
  // active_widgets holds a SAVED layout (array of {key, hidden}) or nothing.
  // The typeof check is for legacy rows: createProfile used to seed this
  // column with the persona's default key list as an array of STRINGS, which
  // is not a layout. Those rows read as "no saved layout" and fall through to
  // the persona default, which is the right answer for them.
  const lastLayoutProfileRef = useRef(null);
  useEffect(() => {
    activeProfileIdRef.current = activeProfile?.id || null;
    activeTypeRef.current = activeProfile?.type || DEFAULT_PERSONA;
    if (!activeProfile?.id) return;
    if (lastLayoutProfileRef.current === activeProfile.id) return;
    lastLayoutProfileRef.current = activeProfile.id;

    const profileId = activeProfile.id;
    const personaType = activeProfile.type;
    let alive = true;
    (async () => {
      let stored = null;
      try {
        const { data } = await supabase
          .from('persona_profiles').select('active_widgets').eq('id', profileId).maybeSingle();
        if (Array.isArray(data?.active_widgets) && data.active_widgets.length
            && typeof data.active_widgets[0] === 'object') {
          stored = data.active_widgets;
        }
        if (!stored) {
          const { data: us } = await supabase
            .from('user_settings').select('home_widget_layout')
            .eq('user_id', activeProfile.user_id).maybeSingle();
          if (Array.isArray(us?.home_widget_layout) && us.home_widget_layout.length) {
            stored = us.home_widget_layout;
          }
        }
      } catch (e) {
        console.warn('HomeScreen: load widget layout', e?.message);
      }
      // Only consulted when there's no saved layout — an arranged dashboard
      // always wins.
      const exploring = stored ? false : await getWayfinderIntent();
      if (alive) {
        setWidgetLayout(reconcileWidgetLayout(stored, personaType, { exploring }));
        setSavedLayout(!!stored);
      }
    })();
    return () => { alive = false; };
  }, [activeProfile?.id, activeProfile?.type, activeProfile?.user_id]);

  // What the board actually shows, per stage. Derived, never written back:
  // widgetLayout above stays the one saved layout, and the fixed layout
  // before 'dashboard' is no more a saved layout than the persona default
  // is. So an arranged dashboard is exactly as it was the day it reopens.
  // Widgets Home has already introduced (see "New on Home" below). They stay
  // on the board whatever else changes: switching purpose on the Compass
  // re-sorts the queue homeWidgetsAt draws from, and without this a widget
  // someone had been using (Active Builds, say) vanished the moment they
  // picked a different aim. Found 2026-09-25 walking every aim in a row.
  const [keptWidgets, setKeptWidgets] = useState([]);
  const boardLayout = useMemo(() => {
    // Before the 'dashboard' stage the board is the widgets this stage has
    // opened, and only those: that's the "limited choices" version of the
    // editor (the Hidden tray lists only what's open). Once someone has
    // arranged it, their own order and hides win for those widgets.
    if (!can('dashboard')) {
      // homeWidgets, not widgets: Home takes on what the stages open a
      // couple at a time (homeWidgetsAt in src/logic/experienceStage.js).
      const home = [...new Set([...(opened?.homeWidgets || opened?.widgets || []), ...keptWidgets])];
      const allowed = new Set(home);
      const starter = starterWidgetLayout({ ...opened, homeWidgets: home }, WIDGET_KEYS).filter(l => allowed.has(l.key));
      if (!savedLayout) return starter;
      const kept = widgetLayout.filter(l => allowed.has(l.key));
      const have = new Set(kept.map(l => l.key));
      return [...kept, ...starter.filter(l => !have.has(l.key))];
    }
    // The full dashboard is the persona's default layout until someone
    // arranges it, and that default doesn't know what the early stages put
    // on Home. Anything already introduced there stays showing (at the end,
    // in the order it arrived) rather than vanishing the day the dashboard
    // opens. A layout the person saved themselves is left exactly as is.
    const withKept = savedLayout ? widgetLayout : (() => {
      const kept = new Set(keptWidgets);
      const shownNow = widgetLayout.filter(l => !l.hidden);
      const add = keptWidgets.filter(k => !shownNow.some(l => l.key === k) && widgetLayout.some(l => l.key === k));
      return [
        ...shownNow,
        ...add.map(key => ({ key, hidden: false })),
        ...widgetLayout.filter(l => l.hidden && !kept.has(l.key)),
      ];
    })();
    if (!can('doors')) {
      // The editor's tray offers this type's own widgets, not all twenty.
      const offer = new Set([...(getPersona(activeType)?.defaultWidgets || []), ...keptWidgets]);
      return withKept.filter(l => !l.hidden || offer.has(l.key));
    }
    return withKept;
  }, [can, opened, activeType, widgetLayout, savedLayout, keptWidgets]);
  // "Your steps" repeats the list the Compass card now carries itself, so
  // while the Compass is on the board it steps aside. Only outside editing:
  // the editor still shows it, so it can be moved or hidden like any other,
  // and nothing here is ever written back.
  const shownBoardLayout = useMemo(() => {
    if (editingWidgets) return boardLayout;
    const compassShown = boardLayout.some(l => l.key === 'compass' && !l.hidden);
    return compassShown ? boardLayout.filter(l => l.key !== 'goalSteps') : boardLayout;
  }, [boardLayout, editingWidgets]);
  // The board only ever sees boardLayout, so what it hands back is missing
  // whatever the tray left out. Put those back, as they were.
  const changeBoardLayout = useCallback((next) => {
    setWidgetLayout(prev => {
      const inNext = new Set(next.map(l => l.key));
      return [...next, ...prev.filter(l => !inNext.has(l.key))];
    });
  }, []);
  // Always editable. Early on the choices are just the widgets that are
  // open (see boardLayout); the 'dashboard' stage adds the rest.
  const canEditWidgets = true;

  /* ── "A new widget is available" ──────────────────────────────────────────
     Finishing the steps of a goal opens a stage, and a stage usually brings
     widgets with it. Those arrive HIDDEN (see NEW_WIDGETS_SHOWN) so an
     update never rearranges a dashboard somebody has already set up — which
     is right, and also meant they arrived invisibly: the only hint was a new
     row in the edit tray, which nobody opens looking for something they
     don't know exists.

     So: offer them, once each, and take no for an answer. Adding is the
     user's call, not the app's. The "already offered" set is per profile and
     local — this is a nudge, not a record worth a column. */
  // Keyed on widgets the stage has OPENED before, not on ones offered. It
  // used to offer any open widget that was hidden and never offered, so
  // removing a widget that had been on Home from the start made it look
  // new, and the "new widget" popup appeared right after removing it.
  const offeredKey = activeProfile?.id ? `@cth_widget_known_${activeProfile.id}` : null;
  const [widgetOffer, setWidgetOffer] = useState([]);   // WIDGET_DEFS entries
  const offeredRef = useRef(null);                      // Set, once loaded

  useEffect(() => {
    offeredRef.current = null;
    setWidgetOffer([]);
    if (!offeredKey) return;
    let alive = true;
    AsyncStorage.getItem(offeredKey)
      .then(raw => { if (alive) offeredRef.current = raw ? new Set(JSON.parse(raw)) : 'baseline'; })
      .catch(() => { if (alive) offeredRef.current = 'baseline'; });
    return () => { alive = false; };
  }, [offeredKey]);

  const persistKnown = useCallback((set) => {
    offeredRef.current = set;
    if (offeredKey) AsyncStorage.setItem(offeredKey, JSON.stringify([...set])).catch(() => {});
  }, [offeredKey]);

  useEffect(() => {
    if (!offeredRef.current || widgetOffer.length || editingWidgets) return;
    const openNow = opened?.homeWidgets || opened?.widgets || [];
    const persist = persistKnown;
    // First look at this profile: whatever is open already isn't news.
    if (offeredRef.current === 'baseline') { persist(new Set(openNow)); return; }
    const known = offeredRef.current;
    const newlyOpen = openNow.filter(key => !known.has(key));
    if (!newlyOpen.length) return;
    // Offered only if it didn't simply appear on the board by itself.
    const shown = new Set(boardLayout.filter(l => !l.hidden).map(l => l.key));
    const fresh = newlyOpen
      .filter(key => !shown.has(key))
      .map(key => WIDGET_DEFS.find(w => w.key === key))
      .filter(Boolean);
    // Only what's settled is recorded now. An offer is recorded when it's
    // answered (closeWidgetOffer): it can wait a while for Home to be on
    // screen, and recording it up front lost it for good if the app closed
    // in between (found 2026-09-25).
    const offered = new Set(fresh.map(w => w.key));
    persist(new Set([...known, ...newlyOpen.filter(k => !offered.has(k))]));
    if (fresh.length) setWidgetOffer(fresh);
  }, [opened, boardLayout, widgetOffer.length, editingWidgets, offeredKey, persistKnown]);

  /* ── "New on Home" ──────────────────────────────────────────────────────
     Widgets arrive on Home a couple per stage (homeWidgetsAt), and each one
     that arrives is pointed at and explained once (src/data/widgetIntros.js)
     rather than just appearing. Waits for a calm Home: no popup up (stage,
     level-up, widget offer), no walkthrough running, not editing. The first
     look at a profile records what's already there instead of explaining
     it, so an existing dashboard never gets a lecture about itself. */
  const introKey = activeProfile?.id ? `@cth_widget_introduced_${activeProfile.id}` : null;
  const introducedRef = useRef(null);
  const [introReady, setIntroReady] = useState(false);
  useEffect(() => {
    introducedRef.current = null;
    setIntroReady(false);
    setKeptWidgets([]);
    if (!introKey) return undefined;
    let alive = true;
    AsyncStorage.getItem(introKey)
      .then(raw => {
        if (!alive) return;
        introducedRef.current = raw ? new Set(JSON.parse(raw)) : 'baseline';
        if (raw) setKeptWidgets([...introducedRef.current]);
      })
      .catch(() => { if (alive) introducedRef.current = 'baseline'; })
      .finally(() => { if (alive) setIntroReady(true); });
    return () => { alive = false; };
  }, [introKey]);

  useEffect(() => {
    if (!introReady || !introducedRef.current || !homeFocused || tourActive || editingWidgets) return undefined;
    if (stageEvents?.length || progressEvents?.length || widgetOffer.length) return undefined;
    const shown = shownBoardLayout.filter(l => !l.hidden).map(l => l.key);
    const persist = (set) => {
      introducedRef.current = set;
      setKeptWidgets([...set]);
      if (introKey) AsyncStorage.setItem(introKey, JSON.stringify([...set])).catch(() => {});
    };
    if (introducedRef.current === 'baseline') { persist(new Set(shown)); return undefined; }
    const known = introducedRef.current;
    const fresh = shown.filter(k => !known.has(k) && WIDGET_INTROS[k]);
    if (!fresh.length) return undefined;
    // Long enough for a widget that has just been added to lay out and
    // measure, so its highlight lands on it.
    const timer = setTimeout(() => {
      startLesson(fresh.map((k, i) => ({
        id: `widget-${k}`,
        title: `New on Home${fresh.length > 1 ? ` · ${i + 1} of ${fresh.length}` : ''} · ${WIDGET_DEFS.find(w => w.key === k)?.title || k}`,
        body: WIDGET_INTROS[k],
      })), {
        onEnd: (reason) => {
          // Knocked off by something else starting: try again later.
          if (reason === 'replaced') return;
          persist(new Set([...(introducedRef.current instanceof Set ? introducedRef.current : []), ...fresh]));
        },
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [introReady, homeFocused, tourActive, editingWidgets, stageEvents, progressEvents, widgetOffer.length, shownBoardLayout, introKey, startLesson]);

  const closeWidgetOffer = (add) => {
    const keys = widgetOffer.map(w => w.key);
    setWidgetOffer([]);
    if (offeredRef.current instanceof Set) persistKnown(new Set([...offeredRef.current, ...keys]));
    if (!add) return;
    // Un-hide in place, so they land where the layout already expects them
    // rather than all at the bottom. Built from the board as it's shown, so
    // this also works before the 'dashboard' stage.
    const wanted = new Set(keys);
    const base = boardLayout.map(l => (wanted.has(l.key) ? { ...l, hidden: false } : l));
    const inBase = new Set(base.map(l => l.key));
    // A widget that wasn't on the board at all (not this type's own, say a
    // Student widget on an Entrepreneur dashboard) is added to the end of
    // what's showing. It used to be put back hidden, so "Add to my
    // dashboard" silently did nothing for it (found 2026-09-25).
    const added = keys.filter(k => !inBase.has(k)).map(key => ({ key, hidden: false }));
    const addedKeys = new Set(added.map(l => l.key));
    const next = [...base, ...added, ...widgetLayout.filter(l => !inBase.has(l.key) && !addedKeys.has(l.key))];
    setWidgetLayout(next);
    setSavedLayout(true);
    persistWidgetLayout(next);
  };

  // Applies a previously-cached (or freshly-fetched) desk snapshot to state.
  // Same shape either way, so a cold offline launch and a live load render
  // identically — nothing on Home has to know which one it got.
  const applyDeskSnapshot = (snap) => {
    if (!snap) return;
    if (snap.todayFocus !== undefined) { setTodayFocus(snap.todayFocus || ''); setFocusDraft(snap.todayFocus || ''); }
    if (snap.todos)     setTodos(snap.todos);
    if (snap.activities)  setTodayActivities(snap.activities);
    if (snap.ideas)     setIdeas(snap.ideas);
    if (snap.affirmations)  setAffirmations(snap.affirmations);
    if (snap.focusPresets)  setFocusPresets(snap.focusPresets);
    if (snap.activeBuilds) setActiveBuilds(snap.activeBuilds);
    if (snap.checkInDue)   setCheckInDue(snap.checkInDue);
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
        eventsRes, todayTasksRes, agendaRes,
        buildsRes, lifeAreaRowsRes,
      ] = await Promise.all([
        supabase.from('daily_focus').select('focus_text').eq('user_id', uid).eq('focus_date', todayStr).maybeSingle(),
        supabase.from('tasks').select('id, title').eq('user_id', uid).eq('completed', false).order('priority').limit(3),
        supabase.from('projects').select('id, title, emoji, color, next_action').eq('user_id', uid).eq('status', 'active').is('deleted_at', null).limit(3),
        supabase.from('captures').select('id, title, type').eq('user_id', uid).eq('status', 'inbox').is('deleted_at', null).limit(2),
        supabase.from('garden_cores').select('id, title, plant_type, color, color_light, is_project, project_progress, garden_petals(id, title, petal_type, completed)').eq('user_id', uid).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_settings').select('affirmation, focus_presets, home_widget_layout').eq('user_id', uid).maybeSingle(),
        // Fails soft — the institutional-layer migration may not be applied
        // yet (ORG_NOT_CONFIGURED), and that should degrade this one rail
        // source silently rather than blank the whole desk.
        getMyOpenAssignments(5).catch(() => []),
        // Today's Activities feed — same three sources CalendarModal shows
        // per-day, just scoped to today instead of a whole week. Daily focus
        // and open-ended "On the Desk" tasks are deliberately left out: the
        // focus box above already shows the former, and the desk ticker
        // above is a ranked pick rather than "what's actually due today".
        supabase.from('calendar_events').select('*').eq('user_id', uid).eq('date', todayStr),
        supabase.from('tasks').select('id, title, due_date').eq('user_id', uid).eq('completed', false).eq('due_date', todayStr),
        supabase.from('agenda_instances').select('id, title, area, date, start_time').eq('user_id', uid).eq('date', todayStr).eq('completed', false).eq('skipped', false),
        // Active Builds widget — a fuller list than the 3-item OnDesk
        // candidate above, same fields LibraryScreen's Build tab preview
        // already uses.
        supabase.from('projects').select('id, title, emoji, color, next_action').eq('user_id', uid).eq('status', 'active').is('deleted_at', null).order('sort_order').limit(6),
        // Check-ins Due widget — same per-user life_areas rows
        // LibraryScreen's Domains tab reads, matched by label the same way.
        supabase.from('life_areas').select('label, progress, last_check_date').eq('user_id', uid),
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

      // Today's Activities — everything with today's actual date on it,
      // one merged/sorted list so "what does today look like" is a single
      // glance instead of four separate rails. No-time items (all-day
      // events, tasks, assignments) sort after timed ones, earliest first.
      const activities = [
        ...(eventsRes.data     || []).map(e => ({
          id: 'evt_' + e.id, title: e.title, time: e.all_day ? null : e.time,
          type: e.type, color: ACTIVITY_TYPES[e.type]?.color || c.teal,
          notes: e.description, _src: 'calendar', raw: e,
        })),
        ...(todayTasksRes.data || []).map(tk => ({
          id: 'atask_' + tk.id, title: tk.title, time: null,
          type: 'task', color: ACTIVITY_TYPES.task.color, _src: 'task', raw: tk,
        })),
        ...(agendaRes.data     || []).map(item => {
          const area = PLANNER_AREA_META[item.area] || { emoji: '•', color: c.teal };
          return {
            id: 'agenda_' + item.id, title: item.title, time: item.start_time,
            type: 'planner', color: area.color, emoji: area.emoji, area: item.area,
            _src: 'planner', raw: item,
          };
        }),
        ...(assignmentsRes || []).filter(a => a.due_date === todayStr).map(a => ({
          id: 'aassign_' + a.assignment_id, title: a.title, time: null,
          type: 'assignment', color: ACTIVITY_TYPES.assignment.color,
          notes: a.cohort_name, _src: 'assignment', raw: a,
        })),
      ].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
      setTodayActivities(activities);

      // Active Builds
      setActiveBuilds(buildsRes.data || []);

      // Every area with its rating and staleness. "Check-ins Due" narrows
      // this to the overdue ones; the Life Areas and Systems Check widgets
      // want the standing picture, so it's computed once and kept whole.
      const areaStats = LIFE_AREAS.map(area => {
        const saved = (lifeAreaRowsRes.data || []).find(a => a.label?.toLowerCase() === area.label.toLowerCase());
        return { area, rating: saved?.progress || 0, lastCheck: saved?.last_check_date || null, days: daysSince(saved?.last_check_date) };
      });
      setLifeAreaStats(areaStats);

      // Check-ins Due — domains not rated in CHECKIN_DUE_DAYS+ days (or never).
      const dueAreas = areaStats
        .filter(x => x.days === null || x.days >= CHECKIN_DUE_DAYS)
        .slice(0, 4);
      setCheckInDue(dueAreas);

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

      // NOTE: the widget layout is deliberately NOT loaded here. It has one
      // owner — the effect keyed on the active profile, further up. loadAll
      // runs from both the auth effect and useFocusEffect and does not wait
      // for ProfileAccountsContext, so when it also set the layout it raced
      // that effect and usually won with a stale value. That is what made
      // hiding a widget look like it never saved.

      // setState above hasn't committed yet within this same tick, so cache
      // the values just computed rather than reading the (still-stale)
      // `affirmations`/`focusPresets` state back out.
      await cacheWrite(cacheKey, {
        todayFocus: focusRes.data?.focus_text ?? null,
        todos: merged,
        activities,
        ideas: ideasRes.data || [],
        affirmations: nextAffirmations ?? affirmations,
        focusPresets: nextFocusPresets ?? focusPresets,
        activeBuilds: buildsRes.data || [],
        checkInDue: dueAreas,
      });
    } catch (e) { console.warn('HomeScreen loadAll', e); }
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  // Focus handlers
  const saveFocus = async () => {
    setTodayFocus(focusDraft); setEditFocus(false);
    // Setting a focus is what ticks "set a focus for today" on a goal.
    if (focusDraft.trim()) signalAction('focus-set');
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

  // Writes the layout where it belongs and keeps the context's cached copy
  // honest. Shared by exitWidgetEdit and the new-widget offer below, because
  // "which of the two tables does this go to" is a rule, not a detail to
  // re-derive at each call site.
  const persistWidgetLayout = async (layout) => {
    if (!userId) return;
    try {
      // Per PROFILE, not per account. persona_profiles.active_widgets exists
      // for exactly this and was previously write-only; user_settings holds
      // one layout for the whole login, which would mean a Student profile
      // and an Entrepreneur profile on the same account fighting over one
      // dashboard. Falls back to user_settings when there's no profile row
      // yet (guest-ish states, or before the master exists).
      if (activeProfile?.id) {
        const { error } = await supabase.from('persona_profiles')
          .update({ active_widgets: layout })
          .eq('id', activeProfile.id);
        if (error) throw error;
        // The context caches active_widgets. Without this its copy stays on
        // the pre-edit value and can overwrite what was just saved the next
        // time anything reads it.
        await refreshProfiles();
      } else {
        const { error } = await supabase.from('user_settings').upsert({ user_id: userId, home_widget_layout: layout });
        if (error) throw error;
      }
    } catch (e) { console.warn('HomeScreen: save widget layout', e.message); }
  };

  // Dashboard widgets — WidgetBoard calls this locally on every reorder/
  // hide/show (fast, no network); the layout only actually gets written to
  // Supabase once, when edit mode closes, via exitWidgetEdit below.
  const exitWidgetEdit = async () => {
    setEditingWidgets(false);
    setSavedLayout(true);
    await persistWidgetLayout(widgetLayout);
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

  // Target shape used by GettingStartedCard's first action: {tab} switches
  // tabs, {tab: 'Library', screen} goes into the Library stack via the
  // priming helper above.
  const goToTarget = (target) => {
    if (!target?.tab) return;
    if (target.tab === 'Library' && target.screen) goToLibraryScreen(target.screen, target.params);
    else navigation.navigate(target.tab);
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
      const { error } = await supabase.from('projects').update({ next_action: text, updated_at: new Date().toISOString() }).eq('id', projectId);
      if (error) throw error;
      signalAction('project-next-set');
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

  // ── Today's Activities: detail sheet + per-source actions ──────────────────
  const dismissActivity = (id) => setTodayActivities(prev => prev.filter(it => it.id !== id));
  const closeActivitySheet = () => setSelectedActivity(null);

  const completeActivityTask = async (item) => {
    closeActivitySheet();
    const rawId = item.raw.id;
    dismissActivity(item.id);
    try { await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: complete activity task', e.message); }
  };

  const deleteActivityTask = async (item) => {
    closeActivitySheet();
    const rawId = item.raw.id;
    dismissActivity(item.id);
    try { await supabase.from('tasks').delete().eq('id', rawId); }
    catch (e) { console.warn('HomeScreen: delete activity task', e.message); }
  };

  const deleteActivityEvent = async (item) => {
    closeActivitySheet();
    dismissActivity(item.id);
    try { await supabase.from('calendar_events').delete().eq('id', item.raw.id); }
    catch (e) { console.warn('HomeScreen: delete activity event', e.message); }
  };

  const completeActivityRoutine = async (item) => {
    closeActivitySheet();
    dismissActivity(item.id);
    try { await completeInstance(item.raw.id, true); }
    catch (e) { console.warn('HomeScreen: complete routine', e.message); }
  };

  const skipActivityRoutine = async (item) => {
    closeActivitySheet();
    dismissActivity(item.id);
    try { await skipInstance(item.raw.id); }
    catch (e) { console.warn('HomeScreen: skip routine', e.message); }
  };

  const completeActivityAssignment = async (item) => {
    closeActivitySheet();
    dismissActivity(item.id);
    try { await updateAssignmentStatus(item.raw.assignment_id, 'completed'); }
    catch (e) { console.warn('HomeScreen: complete activity assignment', e.message); }
  };

  const openActivityInCalendar = (item) => { closeActivitySheet(); setShowCalendar(true); };
  const openActivityInPlanner  = (item) => { closeActivitySheet(); goToLibraryScreen('PlannerScreen'); };
  const focusOnActivity = (item) => { closeActivitySheet(); goToLibraryScreen('WorkModeScreen', { presetTitle: item.title }); };

  // Every action list closes the sheet itself (see above), so there's
  // nothing generic left for the sheet's own dismiss button to do beyond that.
  const actionsForActivity = (item) => {
    if (!item) return [];
    if (item._src === 'task') return [
      { key: 'done',   label: 'Done',   icon: 'checkmark-circle-outline', tone: 'primary',   onPress: () => completeActivityTask(item) },
      { key: 'focus',  label: 'Focus',  icon: 'timer-outline',            tone: 'secondary', onPress: () => focusOnActivity(item) },
      { key: 'delete', label: 'Delete', icon: 'trash-outline',            tone: 'danger',    onPress: () => deleteActivityTask(item) },
    ];
    if (item._src === 'planner') return [
      { key: 'complete', label: 'Done',    icon: 'checkmark-circle-outline', tone: 'primary',   onPress: () => completeActivityRoutine(item) },
      { key: 'skip',     label: 'Skip',    icon: 'play-skip-forward-outline', tone: 'secondary', onPress: () => skipActivityRoutine(item) },
      { key: 'open',     label: 'Planner', icon: 'list-outline',            tone: 'secondary', onPress: () => openActivityInPlanner(item) },
    ];
    if (item._src === 'assignment') return [
      { key: 'complete', label: 'Complete', icon: 'checkmark-circle-outline', tone: 'primary', onPress: () => completeActivityAssignment(item) },
    ];
    // calendar event / reminder / note
    return [
      { key: 'open',   label: 'Open Calendar', icon: 'calendar-outline', tone: 'primary', onPress: () => openActivityInCalendar(item) },
      { key: 'delete', label: 'Delete',        icon: 'trash-outline',    tone: 'danger',  onPress: () => deleteActivityEvent(item) },
    ];
  };

  const goStudy = () => {
    if (!studyDestinations.length) return;
    const pick = studyDestinations[Math.floor(Math.random() * studyDestinations.length)];
    goToLibraryScreen(pick.key);
  };
  const pickStudy = (key) => {
    setShowStudyMenu(false);
    goToLibraryScreen(key);
  };

  const goPlay = () => {
    // Same reason goStudy checks: GAMES is what this stage shows minus the
    // remote kill switch, so a handful of ids in 'disabled_games' can empty
    // it on a first-day account. The button steps aside rather than picking
    // out of nothing.
    if (!GAMES.length) return;
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
      <ScrollView automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Date + streak + widget edit toggle ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
          <Text style={{ fontSize: t.xs, color: c.text3, ...ui.eyebrow, marginBottom: 0 }}>{dateStr}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
            {(streakDays || 0) > 0 && !editingWidgets && (
              <View style={{ backgroundColor: c.bg1, borderRadius: 12, paddingHorizontal: s.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: c.gold }}>
                <Text style={{ fontSize: t.xs, color: c.gold, fontWeight: t.semibold }}>{showEmojis ? '🔥 ' : ''}{streakDays} day streak</Text>
              </View>
            )}
            {canEditWidgets && (
            <TouchableOpacity onPress={() => (editingWidgets ? exitWidgetEdit() : setEditingWidgets(true))}
              style={{ paddingHorizontal: s.sm, paddingVertical: 3 }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: editingWidgets ? c.teal : c.text4 }}>
                {editingWidgets ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Getting Started — the deferred half of onboarding, plus the
             tour offer. Deliberately NOT a widget: it's temporary, it
             retires itself once setup is finished, and it has no business
             in a layout the user reorders and persists. Hidden entirely
             while widgets are being edited, so it can't be mistaken for
             one. ── */}
        {/* Not early on: the goal on the Compass card is the one thing to
            do, and a setup checklist beside it would be a second. It
            arrives with the 'dashboard' stage, when there's more to set up. */}
        {!editingWidgets && can('dashboard') && <GettingStartedCard onNavigate={goToTarget} />}

        {/* ── Dashboard widgets — order/visibility from widgetLayout, drag
             handles + jiggle only live while editingWidgets. See
             WIDGET_DEFS above for what each key renders. ── */}
        <WidgetBoard
          layout={shownBoardLayout}
          editing={editingWidgets && canEditWidgets}
          onChangeLayout={changeBoardLayout}
          c={c} t={t} s={s} r={r}
          widgets={[
            {
              key: 'hq', title: 'Commander',
              render: () => (
                <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.lg, marginHorizontal: s.lg, borderWidth: ui.borderWidth, borderColor: c.border, borderTopWidth: 2, borderTopColor: c.gold }}>
                  <CommanderCard
                    profile={profile}
                    rank={rank}
                    progress={progress}
                    c={c} t={t}
                    onPress={() => navigation.navigate('Profile')}
                  />
                  <TourSpot id="home-study-play">
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: s.md }}>
                    {studyDestinations.length > 0 && (
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.teal, backgroundColor: c.tealLight, borderRadius: ui.buttonRadius, paddingVertical: s.md }}
                      onPress={goStudy} onLongPress={() => setShowStudyMenu(true)} delayLongPress={350}>
                      <Ionicons name="book-outline" size={15} color={c.teal} />
                      <Text style={{ fontSize: t.md, color: c.teal, ...ui.buttonLabel }}>Study</Text>
                    </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.gold, backgroundColor: c.goldLight, borderRadius: ui.buttonRadius, paddingVertical: s.md }}
                      onPress={goPlay} onLongPress={() => setShowPlayMenu(true)} delayLongPress={350}>
                      <Ionicons name="game-controller-outline" size={15} color={c.gold} />
                      <Text style={{ fontSize: t.md, color: c.gold, ...ui.buttonLabel }}>Play</Text>
                    </TouchableOpacity>
                  </View>
                  </TourSpot>
                </View>
              ),
            },
            {
              key: 'wisdom', title: "Today's Wisdom",
              render: () => (
                <TourSpot id="home-focus">
                <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.lg, marginHorizontal: s.lg, borderLeftWidth: 3, borderLeftColor: c.teal, borderWidth: ui.borderWidth, borderColor: c.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.sm }}>
                    <Text style={{ fontSize: ui.name === 'plain' ? 12 : 10, color: c.teal, ...ui.eyebrow }}>{showEmojis ? '✦ ' : ''}Today's Wisdom</Text>
                    <TouchableOpacity onPress={() => setEditAffirm(true)}>
                      <Ionicons name="add-circle-outline" size={20} color={c.gold} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20, fontStyle: 'italic', marginBottom: s.sm }}>"{todaysQuote.text}"</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>— {todaysQuote.author}</Text>
                  {todaysAffirmation && (
                    <TouchableOpacity onPress={() => setEditAffirm(true)}
                      style={{ marginTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.sm }}>
                      <Text style={{ fontSize: ui.name === 'plain' ? 12 : 10, color: c.gold, ...ui.eyebrow, marginBottom: 4 }}>{showEmojis ? '💛 ' : ''}My Affirmation</Text>
                      <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{todaysAffirmation}</Text>
                      {affirmations.length > 1 && (
                        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>{affirmations.length} affirmations rotating daily</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                </TourSpot>
              ),
            },
            {
              key: 'focus', title: 'Focus & Calendar',
              render: () => (
                <TourSpot id="home-focus-input">
                <View style={{ paddingHorizontal: s.lg, flexDirection: 'row', gap: s.sm }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border }}
                    onPress={() => { setFocusDraft(todayFocus || ''); setEditFocus(true); }}>
                    <Ionicons name="bookmark" size={14} color={c.teal} />
                    <Text style={{ flex: 1, fontSize: t.sm, color: todayFocus ? c.text1 : c.text4, lineHeight: 20 }} numberOfLines={2}>
                      {todayFocus || "Set today's focus..."}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: c.bg1, borderRadius: r.md, paddingHorizontal: 14, paddingVertical: 10, borderWidth: ui.borderWidth, borderColor: c.border, alignItems: 'center', justifyContent: 'center', minWidth: 70 }}
                    onPress={() => setShowCalendar(true)}>
                    <Text style={{ fontSize: t.xxl, fontFamily: ui.titleFont, fontWeight: t.bold, color: c.text1, lineHeight: 28 }}>{today.getDate()}</Text>
                    <Text style={{ fontSize: ui.name === 'plain' ? 11 : 9, color: c.text3, ...ui.eyebrow, marginBottom: 0 }}>
                      {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                </TourSpot>
              ),
            },
            {
              key: 'activities', title: "Today's Activities",
              render: () => (
                todayActivities.length === 0 ? (
                  editingWidgets ? (
                    <View style={{ paddingHorizontal: s.lg }}>
                      <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderStyle: 'dashed' }}>
                        <Text style={{ fontSize: t.xs, color: c.text4 }}>Today's Activities — nothing scheduled today</Text>
                      </View>
                    </View>
                  ) : <View />
                ) : (
                  <TourSpot id="home-today-activities">
                  <View style={{ paddingHorizontal: s.lg }}>
                    <SectionHead title="Today's Activities" action="Calendar →" onAction={() => setShowCalendar(true)} c={c} t={t} />
                    {todayActivities.slice(0, 3).map(item => (
                      <ActivityRow key={item.id} item={item} onPress={() => setSelectedActivity(item)} c={c} t={t} s={s} r={r} />
                    ))}
                    {todayActivities.length > 3 && (
                      <TouchableOpacity onPress={() => setShowCalendar(true)}>
                        <Text style={{ fontSize: t.xs, color: c.text4, textAlign: 'center', marginTop: 2 }}>
                          +{todayActivities.length - 3} more today
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  </TourSpot>
                )
              ),
            },
            {
              key: 'desk', title: 'On the Desk',
              render: () => (
                <TourSpot id="home-desk">
                <View style={{ paddingHorizontal: s.lg }}>
                  <SectionHead title="On the Desk" action="+ Add" onAction={() => setShowTodoInput(true)} c={c} t={t} />
                  {showTodoInput && (
                    <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                      <TextInput
                        style={{ flex: 1, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: ui.borderWidth, borderColor: c.border }}
                        value={todoInput} onChangeText={setTodoInput}
                        placeholder="What needs to get done?" placeholderTextColor={c.text4}
                        autoFocus onSubmitEditing={addTodo}
                      />
                      <TouchableOpacity style={{ backgroundColor: accent.primary, borderRadius: ui.buttonRadius, padding: s.md, alignItems: 'center', justifyContent: 'center' }} onPress={addTodo} accessibilityLabel="Add to desk">
                        <Ionicons name="checkmark" size={18} color={accent.onPrimary} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* The one thing to do next, with its actions right here, and
                      the rest of the ranked list drifting past underneath.
                      Everything used to be an equal chip in the ticker, so
                      "what do I do now" took a tap to answer. */}
                  {todos.length > 0 ? (
                    <>
                      <NextUpCard item={todos[0]} actions={actionsForDeskItem(todos[0])} c={c} t={t} s={s} r={r} />
                      {todos.length > 1 && (
                        <View style={{ marginTop: s.sm }}>
                          <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 6 }}>Also on the desk</Text>
                          <DeskTicker
                            items={todos.slice(1)}
                            onItemPress={setSelectedDeskItem}
                            onAdd={() => setShowTodoInput(true)}
                            c={c} t={t} s={s} r={r}
                          />
                        </View>
                      )}
                    </>
                  ) : (
                    <DeskTicker
                      items={todos}
                      onItemPress={setSelectedDeskItem}
                      onAdd={() => setShowTodoInput(true)}
                      c={c} t={t} s={s} r={r}
                    />
                  )}
                </View>
                </TourSpot>
              ),
            },
            {
              key: 'ideas', title: 'Latest Ideas',
              render: () => (
                ideas.length === 0 ? (
                  editingWidgets ? (
                    <View style={{ paddingHorizontal: s.lg }}>
                      <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderStyle: 'dashed' }}>
                        <Text style={{ fontSize: t.xs, color: c.text4 }}>Latest Ideas — nothing planted yet</Text>
                      </View>
                    </View>
                  ) : <View />
                ) : (
                  <View style={{ paddingHorizontal: s.lg }}>
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
                )
              ),
            },
            {
              key: 'streak', title: 'Streak & Level',
              render: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.lg, marginHorizontal: s.lg, borderWidth: ui.borderWidth, borderColor: c.border }}>
                  <LevelRing pct={progress || 0} size={44} strokeWidth={3} color={c.gold} trackColor={c.bg2}>
                    <Readout size={13} color={c.gold}>{level}</Readout>
                  </LevelRing>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>Level {level} · {Math.round(progress || 0)}% to next</Text>
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{(points || 0).toLocaleString()} points earned</Text>
                  </View>
                  {streakDays > 0 && (
                    <View style={{ alignItems: 'center', minWidth: 34 }}>
                      {showEmojis && <Text style={{ fontSize: 17 }}>🔥</Text>}
                      <Readout size={t.xs} color={c.gold}>{streakDays}d</Readout>
                    </View>
                  )}
                </View>
              ),
            },
            {
              key: 'builds', title: 'Active Builds',
              render: () => (
                activeBuilds.length === 0 ? (
                  editingWidgets ? (
                    <View style={{ paddingHorizontal: s.lg }}>
                      <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderStyle: 'dashed' }}>
                        <Text style={{ fontSize: t.xs, color: c.text4 }}>Active Builds — nothing in progress</Text>
                      </View>
                    </View>
                  ) : <View />
                ) : (
                  <View style={{ paddingHorizontal: s.lg }}>
                    <SectionHead title="Active Builds" action="Workshop →" onAction={() => navigation.navigate('ProjectsScreen')} c={c} t={t} />
                    <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, borderWidth: ui.borderWidth, borderColor: c.border, paddingHorizontal: s.md }}>
                      {activeBuilds.slice(0, 4).map((p, i, arr) => (
                        <TouchableOpacity key={p.id} onPress={() => navigation.navigate('Library', { screen: 'ProjectDetail', params: { project: p } })} activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 10, borderBottomWidth: i === arr.length - 1 ? 0 : 0.5, borderBottomColor: c.border }}>
                          <Text style={{ fontSize: 15 }}>{p.emoji || '🏗️'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: t.sm, fontWeight: '600', color: c.text1 }} numberOfLines={1}>{p.title}</Text>
                            <Text style={{ fontSize: 11, color: c.text3 }} numberOfLines={1}>{p.next_action ? `Next: ${p.next_action}` : 'No next step set'}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={14} color={c.text4} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )
              ),
            },
            {
              key: 'checkins', title: 'Check-ins Due',
              render: () => (
                checkInDue.length === 0 ? (
                  editingWidgets ? (
                    <View style={{ paddingHorizontal: s.lg }}>
                      <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border, borderStyle: 'dashed' }}>
                        <Text style={{ fontSize: t.xs, color: c.text4 }}>Check-ins Due — every domain is current</Text>
                      </View>
                    </View>
                  ) : <View />
                ) : (
                  <View style={{ paddingHorizontal: s.lg }}>
                    <SectionHead title="Check-ins Due" action="Library →" onAction={() => navigation.navigate('Library')} c={c} t={t} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                      {checkInDue.map(({ area, rating, lastCheck, days }) => (
                        <TouchableOpacity
                          key={area.id}
                          onPress={() => navigation.navigate('Library', { screen: 'LifeAreaScreen', params: { areaId: area.id, rating, lastCheck } })}
                          activeOpacity={0.8}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: (area.color || c.teal) + '66', backgroundColor: c.bg1 }}>
                          {showEmojis
                            ? <Text style={{ fontSize: 13 }}>{area.emoji}</Text>
                            : <Ionicons name={area.icon} size={13} color={area.color || c.teal} />}
                          <Text style={{ fontSize: 12, fontWeight: '700', color: area.color || c.teal }}>{area.label}</Text>
                          <Readout size={11} color={c.text3} weight="400">{days === null ? 'never' : `${days}d`}</Readout>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )
              ),
            },

            // ── Persona widgets ────────────────────────────────────────────
            // Hidden by default unless the active profile's type asks for
            // them (see layoutForPersona / personas.defaultWidgets). Each one
            // owns its own empty state — none of them shows a number it
            // doesn't have.
            {
              key: 'habitRings', title: 'Habits',
              render: () => <HabitRingsWidget userId={userId} onOpenPlanner={() => goToLibraryScreen('PlannerScreen')} />,
            },
            {
              key: 'lifeAreas', title: 'Life Areas',
              render: () => (
                <LifeAreasWidget
                  areas={lifeAreaStats}
                  onOpenLibrary={() => navigation.navigate('Library')}
                  onOpenArea={(area, rating) => goToLibraryScreen('LifeAreaScreen', { areaId: area.id, rating })}
                />
              ),
            },
            {
              key: 'dailyDrills', title: "Today's Drills",
              render: () => (
                <DailyDrillsWidget
                  onOpenTraining={() => navigation.navigate('Training')}
                  onOpenDrills={() => navigation.navigate('Training', { openDrills: true })}
                  onPlay={(gameId) => navigation.navigate('Play', { gameId })}
                />
              ),
            },
            {
              key: 'studyBlocks', title: 'Study Blocks',
              render: () => <StudyBlocksWidget userId={userId} onOpenPlanner={() => goToLibraryScreen('PlannerScreen')} />,
            },
            {
              key: 'classProgress', title: 'Subjects',
              render: () => <ClassProgressWidget subjectProgress={subjectProgress} onOpenClasses={() => goToLibraryScreen('ClassesStack')} />,
            },
            {
              key: 'orgSnapshot', title: 'Organization',
              render: () => <OrgSnapshotWidget userId={userId} onOpenOrg={() => navigation.navigate('Organization')} />,
            },
            {
              key: 'systemsCheck', title: 'Systems Check',
              render: () => <SystemsCheckWidget areas={lifeAreaStats} onOpenLibrary={() => navigation.navigate('Library')} />,
            },
            {
              key: 'recurringOps', title: 'Recurring Ops',
              render: () => <RecurringOpsWidget userId={userId} onOpenPlanner={() => goToLibraryScreen('PlannerScreen')} />,
            },
            {
              key: 'vaultStatus', title: 'The Vault',
              render: () => (
                <VaultStatusWidget
                  userId={userId} profileId={activeProfile?.id}
                  onOpenVault={() => goToLibraryScreen('ClassesStack')}
                />
              ),
            },
            {
              key: 'founderQuest', title: 'Founder Quest',
              render: () => (
                <FounderQuestWidget
                  userId={userId} profileId={activeProfile?.id}
                  onOpenClasses={() => goToLibraryScreen('ClassesStack')}
                />
              ),
            },
            {
              key: 'targetsReadiness', title: 'Targets & Readiness',
              render: () => (
                <TargetsReadinessWidget
                  userId={userId} profile={activeProfile}
                  onOpenProfiles={() => navigation.navigate('AllProfiles')}
                  onOpenClasses={() => goToLibraryScreen('ClassesStack')}
                />
              ),
            },
            {
              key: 'quests', title: 'Quests',
              render: () => (
                <QuestWidget
                  type={activeType}
                  onOpenQuest={(questId) => goToLibraryScreen('ClassesStack', { screen: 'Quest', params: { questId } })}
                  onOpenAll={() => goToLibraryScreen('ClassesStack')}
                />
              ),
            },
            {
              key: 'wayfinder', title: 'Wayfinder',
              render: () => (
                <WayfinderWidget
                  userId={userId}
                  onOpen={(params) => goToLibraryScreen('WayfinderScreen', params)}
                />
              ),
            },
            {
              key: 'compass', title: 'Compass',
              render: () => (
                <TourSpot id="home-compass">
                  <CompassCard />
                </TourSpot>
              ),
            },
            {
              key: 'goalSteps', title: 'Your steps',
              render: () => <GoalStepsWidget />,
            },
            {
              key: 'stageSteps', title: 'Your stage',
              render: () => (
                <TourSpot id="home-stage">
                  <StageStepsWidget />
                </TourSpot>
              ),
            },
          ]}
        />
      </ScrollView>

      {/* ── "New widget available" ──
           A door opening, not a fanfare: it names what arrived, says where
           it came from, and the default is that nothing changes unless the
           person says so. See the widgetOffer block above. */}
      {/* Only on Home itself, and not over a walkthrough: Home stays mounted
          behind other screens, and this used to pop up over the Academy
          mid-guide when a goal elsewhere opened a widget. */}
      <Modal visible={widgetOffer.length > 0 && homeFocused && !tourActive} transparent animationType="fade" onRequestClose={() => closeWidgetOffer(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: s.xl }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: c.bg1, borderRadius: 20, padding: s.xl, borderWidth: ui.borderWidth, borderColor: c.border }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: s.md }}>
              <Ionicons name="grid-outline" size={22} color={c.teal} />
            </View>
            <Text style={{ fontSize: t.xs, color: c.teal, ...ui.eyebrow, textAlign: 'center' }}>
              {showEmojis ? '✨ ' : ''}{widgetOffer.length === 1 ? 'New widget' : `${widgetOffer.length} new widgets`}
            </Text>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, textAlign: 'center', marginTop: 4 }}>
              Want {widgetOffer.length === 1 ? 'it' : 'them'} on your dashboard?
            </Text>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>
              You just unlocked {widgetOffer.length === 1 ? 'this' : 'these'}. Nothing changes on Home unless you
              say yes, and you can add or remove {widgetOffer.length === 1 ? 'it' : 'them'} any time with Edit at
              the top of Home.
            </Text>

            <View style={{ marginTop: s.lg, gap: s.sm }}>
              {widgetOffer.map(w => (
                <View key={w.key} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, borderWidth: ui.borderWidth, borderColor: c.border }}>
                  <Ionicons name="add-circle-outline" size={16} color={c.teal} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: t.semibold }}>{w.title}</Text>
                    {!!WIDGET_BLURBS[w.key] && (
                      <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 16 }}>{WIDGET_BLURBS[w.key]}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => closeWidgetOffer(true)}
              accessibilityRole="button"
              style={{ marginTop: s.lg, backgroundColor: accent.primary, borderRadius: ui.buttonRadius, paddingVertical: s.md, alignItems: 'center' }}
            >
              <Text style={{ fontSize: t.md, color: accent.onPrimary, ...ui.buttonLabel }}>
                Add to my dashboard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => closeWidgetOffer(false)} style={{ paddingVertical: s.md, alignItems: 'center' }}>
              <Text style={{ fontSize: t.sm, color: c.text4, fontWeight: t.semibold }}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* ── Today's Activities row, tapped open — same detail-sheet pattern ── */}
      <Modal visible={!!selectedActivity} transparent animationType="slide" onRequestClose={closeActivitySheet}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            {selectedActivity && (
              <ActivityDetailCard
                item={selectedActivity}
                actions={actionsForActivity(selectedActivity)}
                c={c} t={t} s={s} r={r}
              />
            )}
            <TouchableOpacity onPress={closeActivitySheet}
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
                style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: ui.borderWidth, borderColor: c.border }}>
                <Text style={{ color: c.text3, fontSize: t.sm }}>Cancel</Text>
              </TouchableOpacity>
              <Button label="Save" onPress={saveNextActionFor} disabled={!nextActionDraft.trim()} busy={savingNextAction} style={{ flex: 2 }} />
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
            <Text style={{ fontSize: t.lg, fontFamily: ui.titleFont, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Study</Text>
            {studyDestinations.map(d => (
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
            <Text style={{ fontSize: t.lg, fontFamily: ui.titleFont, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Play</Text>
            <ScrollView automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
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
