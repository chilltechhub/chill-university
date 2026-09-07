// src/screens/MultiStepOnboarding.js
// 7-step sliding card onboarding — same visual language as the rest of the
// app (ThemeContext colors + FONTS), not a standalone look of its own.
//
// Every step here actually does something, not just fills a `profiles`
// column nobody reads back:
//   - Sectors (Step2) narrows what shows up in the Library tab's life-area
//     grid (LibraryScreen.js reads `active_life_areas` back) — add more
//     any time from the "+ Add" tile there or Settings.
//   - Character (Step3) shows the *real* playable character (the same
//     CharacterWalker/useCharacterLoadout rendering Home/Training use),
//     not a fictional astronaut unrelated to what you actually see in the
//     app. Crest color + role badge are real, small, already-wired
//     flourishes (Home's CommanderCard / library/portfolio.js read them)
//     — just honestly framed as that instead of "helmet"/"suit" (there's
//     no such wearable in the real system).
//   - Planner (Step4) offers real starter templates fetched from
//     plannerService.js's planner_components table for your chosen
//     sectors, and actually subscribes + schedules them on finish — the
//     same functions PlannerScreen's own "Add" panel calls.
//   - Look & Layout (Step7) picks a theme live (you can watch this whole
//     screen re-skin as you tap), and lets you hide any Library section
//     you don't want — same AsyncStorage setting Settings' own editor
//     uses, so either place stays in sync.
//   - Finishing personalizes the guided tour (context/TourContext.js) with
//     what you just picked, before it's ever shown.

import React, { useState, useRef, useEffect } from 'react';
import { PRIVACY_POLICY_URL } from '../config/legal';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Animated, Dimensions, StyleSheet, Linking,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { THEMES, FONTS } from '../theme';
import { supabase } from '../api/supabaseClient';
import { generateRecommendations } from '../api/recommendationEngine';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { ensureNotificationPermission } from '../logic/notificationScheduler';
import { LIFE_AREAS } from './library/LifeAreaScreen';
import { LIBRARY_HUBS } from './library/LibraryScreen';
import { AREAS as PLANNER_AREAS, getPresetComponents, subscribeToComponent, generateInstances } from '../api/plannerService';
import { CREST_COLORS, ROLE_BADGES } from '../data/crestOptions';
import useCharacterLoadout from '../logic/useCharacterLoadout';
import LandscapeBackground from '../components/LandscapeBackground';
import CharacterWalker from '../components/CharacterWalker';
import PlayerCharacter from '../components/PlayerCharacter';
import { OUTFITS } from '../data/characterOptions';
import { isMinorRequiringConsent } from '../logic/ageOfConsent';
import { startParentVerification, getVerificationStatus } from '../api/kwsVerification';

const { width: SW } = Dimensions.get('window');

// ─── Config (content unchanged from the original 7 questions — only how
// they're answered/rendered, and what happens with the answers, changed) ──

const WHY_OPTIONS = [
  { key: 'growth',    emoji: '🌱', label: 'Personal growth' },
  { key: 'career',    emoji: '🚀', label: 'Career & skills' },
  { key: 'wellness',  emoji: '❤️', label: 'Health & wellness' },
  { key: 'learning',  emoji: '🎓', label: 'Learning & education' },
  { key: 'finance',   emoji: '💰', label: 'Financial freedom' },
  { key: 'creativity',emoji: '🎨', label: 'Creative projects' },
  { key: 'all',       emoji: '🌌', label: 'All of the above' },
];

const AGE_CATS = [
  { key: 'kid',           label: 'Kid (5-12)' },
  { key: 'teen',          label: 'Teen (13-17)' },
  { key: 'young_adult',   label: 'Young Adult (18-25)' },
  { key: 'adult',         label: 'Adult (26-40)' },
  { key: 'professional',  label: 'Professional (40+)' },
];

// Countries with local privacy law shown as quick picks in the age gate
// below; "Other" falls back to DEFAULT_AODC (13) in src/logic/ageOfConsent.js.
const COUNTRY_CHOICES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'IE', label: 'Ireland' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'OTHER', label: 'Somewhere else' },
];



const TOPICS = [
  'AI & Technology', 'Cybersecurity', 'Personal Finance', 'Entrepreneurship',
  'Mental Health', 'Creativity & Design', 'Leadership', 'Coding',
  'Philosophy', 'Health & Nutrition', 'Writing', 'Science',
];

const FORMATS = [
  { key: 'reading', emoji: '📖', label: 'Reading' },
  { key: 'video',   emoji: '🎬', label: 'Videos' },
  { key: 'audio',   emoji: '🎧', label: 'Audio' },
  { key: 'game',    emoji: '🎮', label: 'Games' },
  { key: 'quiz',    emoji: '❓', label: 'Quizzes' },
  { key: 'hands',   emoji: '🛠️', label: 'Hands-on' },
];

const DAILY_MIN = [
  { val: 5,   label: '5 min',  desc: 'Just a taste' },
  { val: 15,  label: '15 min', desc: 'Steady pace' },
  { val: 30,  label: '30 min', desc: 'Solid session' },
  { val: 60,  label: '1 hour', desc: 'Deep work' },
];

const PRIMARY_GOALS = [
  'Build better habits', 'Learn new skills', 'Advance my career',
  'Improve my health', 'Grow financially', 'Find my purpose',
  'Start a project', 'Feel more confident',
];

// A direct question, rather than inferring usage from word overlap in
// unrelated answers (motivation/topics) alone — this is the actual signal
// buildRecommendations() below weighs most heavily, since it's the user
// telling us straight out how they intend to actually use the app
// day-to-day, not just what they're broadly here for.
const USAGE_PATTERNS = [
  { key: 'habits',    emoji: '📅', label: 'Daily habits & check-ins' },
  { key: 'building',  emoji: '🏗️', label: 'Building projects' },
  { key: 'learning',  emoji: '📚', label: 'Structured courses' },
  { key: 'reflecting',emoji: '🧠', label: 'Journaling & reflection' },
  { key: 'planning',  emoji: '🗂️', label: 'Planning & organizing' },
  { key: 'breaks',    emoji: '🎮', label: 'Quick games & breaks' },
];

// Simple keyword → Library section match for personalizing the tour.
// First match wins; order matters. usage_patterns (an explicit multi-select
// in Step6) is weighed above motivation/topics, since it's a direct signal
// rather than an inferred one.
const HUB_INTEREST_MAP = [
  { screen: 'ProjectsScreen', keywords: ['building', 'project', 'creativity', 'creative', 'build', 'confident'],
    reason: (l) => `You mentioned wanting to build or create — ${l} is where your projects live, from first idea to shipped.` },
  { screen: 'PlannerScreen', keywords: ['planning', 'habits'],
    reason: (l) => `You're here to plan and stay on top of things — ${l} is your full agenda, daily to monthly.` },
  { screen: 'CareerExplorationScreen', keywords: ['career', 'work', 'job'],
    reason: (l) => `Since career growth is on your mind, ${l} is worth a look — explore paths and next steps.` },
  { screen: 'ClassesStack', keywords: ['learning', 'learn', 'education', 'skill'],
    reason: (l) => `${l} has structured lessons across every subject — a solid place to start.` },
  { screen: 'KnowledgeScreen', keywords: ['learn', 'skill', 'education', 'growth', 'purpose'],
    reason: (l) => `You're here to learn and grow — ${l} is where your notes, saved research, and reference tools live.` },
  { screen: 'IdeaGardenScreen', keywords: ['reflecting', 'creativity', 'creative'],
    reason: (l) => `${l} is where loose ideas get planted and grow — a good fit for reflecting and creative thinking.` },
];

function pickFocusHub(data) {
  const haystack = [data.primary_goal, data.motivation, ...(data.usage_patterns || []), ...(data.topics || [])]
    .filter(Boolean).join(' ').toLowerCase();
  for (const entry of HUB_INTEREST_MAP) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      const hubItem = LIBRARY_HUBS.flatMap(h => h.items).find(i => i.screen === entry.screen);
      if (hubItem) return { screen: hubItem.screen, label: hubItem.label, reason: entry.reason(hubItem.label) };
    }
  }
  return null;
}

// ─── Feature recommendations ──────────────────────────────────────────────────
// Distinct from pickFocusHub (one Library hub, spliced into the guided
// tour) — this surfaces up to 3 concrete features across the WHOLE app,
// shown directly in Step7's Mission Summary so the "suggest things based
// on usage" payoff is visible before onboarding even finishes, not just
// buried in a later tour step.
const FEATURE_RECS = [
  { pattern: 'habits',     icon: 'checkmark-circle-outline', title: 'Daily Check-in',       body: 'A one-tap log for your life areas — Library → any area → Quick Log.' },
  { pattern: 'habits',     icon: 'notifications-outline',     title: 'Daily Reminders',       body: 'Turn on below — a nudge if today\'s drills are open or your streak is at risk.' },
  { pattern: 'building',   icon: 'hammer-outline',            title: 'The Workshop',          body: 'Start your first build — Library → The Workshop → New Build.' },
  { pattern: 'building',   icon: 'briefcase-outline',         title: 'Portfolio Archives',    body: 'Finished builds land here automatically as a running showcase.' },
  { pattern: 'learning',   icon: 'ribbon-outline',            title: 'Academy Classes',       body: 'Structured coursework across every subject — Library → Academy Classes.' },
  { pattern: 'reflecting', icon: 'journal-outline',           title: 'Weekly Reflection',     body: 'A guided prompt on any life area, once a week — good for spotting patterns.' },
  { pattern: 'reflecting', icon: 'leaf-outline',               title: 'Idea Garden',           body: 'Plant loose thoughts and let them grow over time.' },
  { pattern: 'planning',   icon: 'calendar-outline',          title: 'Planner',               body: 'Daily, weekly, and monthly views — Library → Planner.' },
  { pattern: 'planning',   icon: 'file-tray-full-outline',    title: 'Capture Inbox',         body: 'Jot anything fast, decide where it belongs later.' },
  { pattern: 'breaks',     icon: 'game-controller-outline',    title: 'Training',              body: 'Quick games across any subject — the PLAY button on Home.' },
];

function buildRecommendations(data) {
  const patterns = data.usage_patterns || [];
  if (!patterns.length) return [];
  const byPattern = patterns.map(p => FEATURE_RECS.filter(r => r.pattern === p));
  const seen = new Set();
  const picks = [];
  // Round-robin across picked patterns (one from each before repeating) so
  // someone who picked 3 patterns sees a spread, not 3 recs all from
  // whichever pattern happens to be first.
  for (let round = 0; round < 3 && picks.length < 3; round++) {
    for (const group of byPattern) {
      const candidate = group[round];
      if (candidate && !seen.has(candidate.title)) {
        seen.add(candidate.title);
        picks.push(candidate);
        if (picks.length >= 3) break;
      }
    }
  }
  return picks;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stepStyles(theme) {
  const { c, s } = theme;
  return {
    stepContent:  { padding: s.xl },
    stepTitle:    { fontSize: 22, fontFamily: FONTS.display, fontWeight: '800', color: c.text1, marginBottom: 6 },
    stepSubtitle: { fontSize: 14, color: c.text3, lineHeight: 20, marginBottom: s.xl },
    input:        { backgroundColor: c.bg0, borderRadius: 12, padding: 14, fontSize: 15, color: c.text1, borderWidth: 1, borderColor: c.border },
  };
}

function Chip({ label, selected, color, onPress, emoji, theme }) {
  const { c } = theme;
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: selected ? color : c.border, backgroundColor: selected ? color + '22' : c.bg0, marginRight: 8, marginBottom: 8 }}>
      {emoji && <Text style={{ fontSize: 14 }}>{emoji}</Text>}
      <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '400', color: selected ? color : c.text3 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ label, theme }) {
  return <Text style={{ fontSize: 11, color: theme.c.text4, fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 }}>{label}</Text>;
}

// ─── Step screens ─────────────────────────────────────────────────────────────

function Step1({ data, set, theme }) {
  const { c } = theme;
  const st = stepStyles(theme);
  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Welcome 👋</Text>
      <Text style={st.stepSubtitle}>Let's set up your base. What should we call you?</Text>

      <SectionLabel label="Your name" theme={theme} />
      <TextInput
        style={st.input}
        value={data.display_name}
        onChangeText={v => set('display_name', v)}
        placeholder="Display name..." placeholderTextColor={c.text4}
        autoFocus
      />

      <View style={{ marginTop: 16 }}>
        <SectionLabel label="Where are you at in life?" theme={theme} />
        {AGE_CATS.map(ag => {
          const sel = data.age_category === ag.key;
          return (
            <TouchableOpacity key={ag.key} onPress={() => set('age_category', ag.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: sel ? c.teal : c.border, backgroundColor: sel ? c.teal + '18' : c.bg0 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? c.teal : c.text4, alignItems: 'center', justifyContent: 'center' }}>
                {sel && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.teal }} />}
              </View>
              <Text style={{ fontSize: 14, color: sel ? c.text1 : c.text3, fontWeight: sel ? '700' : '400' }}>{ag.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginTop: 8 }}>
        <SectionLabel label="What brings you here?" theme={theme} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {WHY_OPTIONS.map(opt => (
            <Chip key={opt.key} label={opt.label} emoji={opt.emoji}
              selected={data.motivation === opt.key} color={c.teal}
              onPress={() => set('motivation', opt.key)} theme={theme} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Step2({ data, set, theme }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const toggle = (id) => {
    const cur = data.active_life_areas || [];
    set('active_life_areas', cur.includes(id) ? cur.filter(k => k !== id) : [...cur, id]);
  };

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Choose Your Sectors</Text>
      <Text style={st.stepSubtitle}>Pick 2-5 life areas to focus on first. These are exactly what shows up in your Library's life-area grid — add the rest any time with the "+ Add" tile there, or from Settings.</Text>

      {LIFE_AREAS.map(area => {
        const sel = (data.active_life_areas || []).includes(area.id);
        return (
          <TouchableOpacity key={area.id} onPress={() => toggle(area.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: sel ? area.color + '18' : c.bg0, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: sel ? area.color : c.border }}>
            <Text style={{ fontSize: 24 }}>{area.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: sel ? area.color : c.text1, marginBottom: 2 }}>{area.label}</Text>
              <Text style={{ fontSize: 12, color: c.text3 }}>{area.subtitle}</Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: sel ? area.color : c.border, backgroundColor: sel ? area.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={{ fontSize: 11, color: c.text4, textAlign: 'center', marginTop: 8 }}>
        {(data.active_life_areas || []).length} selected — aim for 2-5
      </Text>
    </View>
  );
}

// Starter-tier outfits (requirement: null) — every one of these is
// available from level 1, so this is the actual full menu of "which
// character do you want to start as," not a fixed look with a preview
// slapped in front of it. See the note above OUTFITS in
// characterOptions.js.
const STARTER_OUTFITS = OUTFITS.filter(o => !o.requirement);

function Step3({ data, set, theme }) {
  const { c, s } = theme;
  const st = stepStyles(theme);
  // Fresh account, nothing unlocked yet — same stats a real level-1
  // profile would have, so this preview shows exactly what you'll see on
  // Home/Training the moment you land there.
  const stats = { level: 1, points: 0, rank: 20, streakDays: 0 };
  const { ready, outfit, pet, accessory, background, equip } = useCharacterLoadout(stats);
  const crestColor = CREST_COLORS.find(cc => cc.key === data.crest_color)?.color || c.teal;

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Meet Your Character</Text>
      <Text style={st.stepSubtitle}>This is who walks around your Home and Training screens — pick who you start as below. New outfits, pets, and gear unlock as you level up either way. Customize any time from your Profile.</Text>

      {ready && (
        <LandscapeBackground background={background} height={130} style={{ marginBottom: s.md }}>
          <CharacterWalker outfit={outfit} accessory={accessory} pet={pet} characterSize={80} petSize={34} rewards={[]} />
        </LandscapeBackground>
      )}

      <SectionLabel label="Choose your character" theme={theme} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {STARTER_OUTFITS.map(o => {
            const sel = outfit?.id === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => equip('outfitId', o.id)}
                style={{
                  width: 72, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 12,
                  borderWidth: 1.5, borderColor: sel ? crestColor : c.border,
                  backgroundColor: sel ? crestColor + '18' : c.bg0,
                }}
              >
                <PlayerCharacter outfit={o} accessory={null} size={48} />
                <Text numberOfLines={1} style={{ fontSize: 10, color: sel ? crestColor : c.text3, fontWeight: sel ? '700' : '400' }}>{o.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <SectionLabel label="Traveler name (optional)" theme={theme} />
      <TextInput
        style={[st.input, { marginBottom: 18 }]}
        value={data.traveler_name}
        onChangeText={v => set('traveler_name', v)}
        placeholder={data.display_name || 'Name your traveler...'}
        placeholderTextColor={c.text4}
      />

      <SectionLabel label="Crest color" theme={theme} />
      <Text style={{ fontSize: 11, color: c.text4, marginTop: -6, marginBottom: 10 }}>Colors your name card on Home & Portfolio</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {CREST_COLORS.map(cc => {
            const sel = data.crest_color === cc.key;
            return (
              <TouchableOpacity key={cc.key} onPress={() => set('crest_color', cc.key)} style={{ alignItems: 'center', gap: 5 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: cc.color, borderWidth: 3, borderColor: sel ? c.text1 : 'transparent' }} />
                <Text style={{ fontSize: 9, color: sel ? c.text1 : c.text4, fontWeight: sel ? '700' : '400' }}>{cc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <SectionLabel label="Role badge" theme={theme} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ROLE_BADGES.map(b => {
          const sel = data.role_badge === b.key;
          return (
            <TouchableOpacity key={b.key} onPress={() => set('role_badge', b.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: sel ? crestColor : c.border, backgroundColor: sel ? crestColor + '22' : c.bg0 }}>
              <Text style={{ fontSize: 16 }}>{b.emoji}</Text>
              <Text style={{ fontSize: 12, color: sel ? crestColor : c.text3, fontWeight: sel ? '700' : '400' }}>{b.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step4({ data, set, theme }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const areas = data.active_life_areas || [];
  const [byArea, setByArea] = useState({});

  useEffect(() => {
    let alive = true;
    areas.forEach((key) => {
      if (byArea[key] !== undefined) return;
      const preset = PLANNER_AREAS[key]?.preset;
      if (!preset) { setByArea(prev => ({ ...prev, [key]: 'none' })); return; }
      setByArea(prev => ({ ...prev, [key]: 'loading' }));
      getPresetComponents(preset)
        .then(comps => { if (alive) setByArea(prev => ({ ...prev, [key]: comps })); })
        .catch(() => { if (alive) setByArea(prev => ({ ...prev, [key]: 'none' })); });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas.join(',')]);

  const toggle = (comp) => {
    const cur = data.planner_picks || [];
    const exists = cur.some(p => p.id === comp.id);
    set('planner_picks', exists ? cur.filter(p => p.id !== comp.id) : [...cur, comp]);
  };

  if (areas.length === 0) {
    return (
      <View style={st.stepContent}>
        <Text style={st.stepTitle}>Set Up Your Planner</Text>
        <Text style={st.stepSubtitle}>Pick a few sectors on the previous step first — starter planner templates are pulled from those.</Text>
      </View>
    );
  }

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Set Up Your Planner</Text>
      <Text style={st.stepSubtitle}>Real starter templates for your sectors — turn on the ones you want scheduled today. Add or drop items any time from the Planner itself.</Text>

      {areas.map(key => {
        const area = PLANNER_AREAS[key];
        if (!area) return null;
        const comps = byArea[key];
        return (
          <View key={key} style={{ marginBottom: 18 }}>
            <SectionLabel label={`${area.emoji} ${area.label}`} theme={theme} />
            {comps === 'loading' && <ActivityIndicator color={area.color} style={{ marginVertical: 8 }} />}
            {comps === 'none' && (
              <Text style={{ fontSize: 12, color: c.text4, fontStyle: 'italic', marginBottom: 4 }}>
                No starter templates yet for this sector — add your own from the Planner any time.
              </Text>
            )}
            {Array.isArray(comps) && comps.length === 0 && (
              <Text style={{ fontSize: 12, color: c.text4, fontStyle: 'italic', marginBottom: 4 }}>
                No starter templates yet for this sector — add your own from the Planner any time.
              </Text>
            )}
            {Array.isArray(comps) && comps.map(comp => {
              const sel = (data.planner_picks || []).some(p => p.id === comp.id);
              return (
                <TouchableOpacity key={comp.id} onPress={() => toggle(comp)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: sel ? area.color + '18' : c.bg0, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: sel ? area.color : c.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: sel ? c.text1 : c.text3, fontWeight: sel ? '700' : '400' }}>{comp.title}</Text>
                    <Text style={{ fontSize: 11, color: c.text4, marginTop: 2, textTransform: 'capitalize' }}>
                      {comp.cadence}{comp.duration_minutes ? ` · ${comp.duration_minutes}m` : ''}
                    </Text>
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: sel ? area.color : c.border, backgroundColor: sel ? area.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function Step5({ data, set, theme }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const toggleTopic = (tp) => {
    const cur = data.topics || [];
    set('topics', cur.includes(tp) ? cur.filter(x => x !== tp) : [...cur, tp]);
  };
  const toggleFormat = (f) => {
    const cur = data.formats || [];
    set('formats', cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f]);
  };

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Your Interests</Text>
      <Text style={st.stepSubtitle}>Powers your class and game recommendations.</Text>

      <SectionLabel label="Topics you're into" theme={theme} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {TOPICS.map(tp => (
          <Chip key={tp} label={tp} selected={(data.topics || []).includes(tp)} color={c.purple} onPress={() => toggleTopic(tp)} theme={theme} />
        ))}
      </View>

      <View style={{ marginTop: 8 }}>
        <SectionLabel label="How you like to learn" theme={theme} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FORMATS.map(f => {
            const sel = (data.formats || []).includes(f.key);
            return (
              <TouchableOpacity key={f.key} onPress={() => toggleFormat(f.key)}
                style={{ alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: sel ? c.purple : c.border, backgroundColor: sel ? c.purple + '22' : c.bg0, minWidth: 80 }}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{f.emoji}</Text>
                <Text style={{ fontSize: 11, color: sel ? c.purple : c.text3, fontWeight: sel ? '700' : '400' }}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: 8 }}>
        <SectionLabel label="Tech / skill level" theme={theme} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['beginner','intermediate','advanced'].map(lvl => {
            const sel = data.tech_level === lvl;
            return (
              <TouchableOpacity key={lvl} onPress={() => set('tech_level', lvl)}
                style={{ flex: 1, padding: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', borderColor: sel ? c.tech : c.border, backgroundColor: sel ? c.tech + '22' : c.bg0 }}>
                <Text style={{ fontSize: 12, color: sel ? c.tech : c.text3, fontWeight: sel ? '700' : '400', textTransform: 'capitalize' }}>{lvl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Step6({ data, set, theme }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const [remindersEnabled, setRemindersEnabled] = useSetting(SETTING_KEYS.DAILY_REMINDERS_ENABLED, false);
  const toggleUsage = (key) => {
    const cur = data.usage_patterns || [];
    set('usage_patterns', cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
  };

  // Not part of the `data`/`set` payload sent to `profiles` — reminders are
  // a device-local preference (same AsyncStorage key SettingsScreen's
  // toggle uses), not a server column. Requests OS permission right away
  // if turned on here; HomeScreen picks up the setting and actually
  // schedules today's reminders once real mission/streak data is loaded.
  const toggleReminders = async (v) => {
    setRemindersEnabled(v);
    if (v) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        // Was silently flipping back off here with no explanation — looked
        // exactly like "I turned this on" followed by Settings later
        // showing it off with nothing in between to explain why. Match
        // SettingsScreen's own toggleReminders: say why.
        setRemindersEnabled(false);
        Alert.alert('Notifications blocked', 'Enable notifications for this app in your device Settings to use reminders. You can turn this back on any time from Settings.');
      }
    }
  };

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Your Goals & Style</Text>
      <Text style={st.stepSubtitle}>Help us personalize your experience.</Text>

      <SectionLabel label="Primary goal" theme={theme} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {PRIMARY_GOALS.map(g => (
          <Chip key={g} label={g} selected={data.primary_goal === g} color={c.error} onPress={() => set('primary_goal', g)} theme={theme} />
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionLabel label="How will you actually use this?" theme={theme} />
        <Text style={{ fontSize: 12, color: c.text4, marginTop: -6, marginBottom: 10 }}>
          Pick what fits — shapes what we point out in your tour and recommend below. Pick as many as apply.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {USAGE_PATTERNS.map(u => (
            <Chip key={u.key} emoji={u.emoji} label={u.label}
              selected={(data.usage_patterns || []).includes(u.key)}
              color={c.teal} onPress={() => toggleUsage(u.key)} theme={theme} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 8 }}>
        <SectionLabel label="Daily time commitment" theme={theme} />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          {DAILY_MIN.map(opt => {
            const sel = data.daily_minutes === opt.val;
            return (
              <TouchableOpacity key={opt.val} onPress={() => set('daily_minutes', opt.val)}
                style={{ flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: sel ? c.error : c.border, backgroundColor: sel ? c.error + '22' : c.bg0 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: sel ? c.error : c.text1 }}>{opt.label}</Text>
                <Text style={{ fontSize: 10, color: c.text4, marginTop: 2 }}>{opt.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionLabel label="Life stage" theme={theme} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['In school','Starting out','Mid-career','Career change','Side hustle','Just exploring'].map(ls => (
            <Chip key={ls} label={ls} selected={data.life_stage === ls} color={c.success} onPress={() => set('life_stage', ls)} theme={theme} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.bg1, borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 0.5, borderColor: c.border }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: c.text1, fontWeight: '600', fontSize: 14 }}>Track reflections</Text>
          <Text style={{ color: c.text3, fontSize: 12, marginTop: 2 }}>Guided prompts to log what you learned</Text>
        </View>
        <Switch
          value={data.wants_reflection || false}
          onValueChange={v => set('wants_reflection', v)}
          trackColor={{ false: c.bg2, true: c.success + '88' }}
          thumbColor={data.wants_reflection ? c.success : c.text4}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.bg1, borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 0.5, borderColor: c.border }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: c.text1, fontWeight: '600', fontSize: 14 }}>Daily reminders</Text>
          <Text style={{ color: c.text3, fontSize: 12, marginTop: 2 }}>A nudge if today's Daily Drills are open, or your streak's at risk</Text>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={toggleReminders}
          trackColor={{ false: c.bg2, true: c.gold + '88' }}
          thumbColor={remindersEnabled ? c.gold : c.text4}
        />
      </View>
    </View>
  );
}

function Step7({ data, set, theme, onThemeChange }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const allSections = LIBRARY_HUBS.flatMap(hub => hub.items);
  const toggleSection = (screen) => {
    const cur = data.hidden_sections || [];
    set('hidden_sections', cur.includes(screen) ? cur.filter(x => x !== screen) : [...cur, screen]);
  };
  const pickTheme = (name) => { set('theme', name); onThemeChange(name); };

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Look & Layout</Text>
      <Text style={st.stepSubtitle}>Pick your theme, and choose which Library sections show up. Everything here is changeable any time from Settings.</Text>

      <SectionLabel label="Theme — tap to preview live" theme={theme} />
      <View style={{ gap: 12, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => pickTheme('dark')}
          style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 2, backgroundColor: THEMES.dark.bg0, borderColor: data.theme === 'dark' ? THEMES.dark.gold : THEMES.dark.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: THEMES.dark.text1, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Dark · Command</Text>
            <Text style={{ color: THEMES.dark.text3, fontSize: 13 }}>Command-deck slate. Gold accents.</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              {[THEMES.dark.bg0, THEMES.dark.bg1, THEMES.dark.gold, THEMES.dark.teal, THEMES.dark.text1].map((col, i) => (
                <View key={i} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: col, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />
              ))}
            </View>
          </View>
          {data.theme === 'dark' && <Ionicons name="checkmark-circle" size={24} color={THEMES.dark.gold} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => pickTheme('light')}
          style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 2, backgroundColor: THEMES.light.bg0, borderColor: data.theme === 'light' ? THEMES.light.teal : THEMES.light.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: THEMES.light.text1, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Light · Daylight</Text>
            <Text style={{ color: THEMES.light.text3, fontSize: 13 }}>Cool steel and paper.</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              {[THEMES.light.bg0, THEMES.light.bg1, THEMES.light.gold, THEMES.light.teal, THEMES.light.text1].map((col, i) => (
                <View key={i} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: col, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)' }} />
              ))}
            </View>
          </View>
          {data.theme === 'light' && <Ionicons name="checkmark-circle" size={24} color={THEMES.light.teal} />}
        </TouchableOpacity>
      </View>

      <SectionLabel label="Background" theme={theme} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.bg1, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: c.border }}>
        <Ionicons name="image-outline" size={20} color={c.text3} />
        <Text style={{ flex: 1, fontSize: 12, color: c.text3, lineHeight: 17 }}>
          Starting plain and simple. Switch Home or Library to match your traveler's landscape any time from Settings — we'll point out where in the tour.
        </Text>
      </View>

      <SectionLabel label="Library sections" theme={theme} />
      <Text style={{ fontSize: 12, color: c.text4, marginTop: -6, marginBottom: 10 }}>All on by default — tap to hide any you don't need. Bring them back any time from Settings.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {allSections.map(item => {
          const hidden = (data.hidden_sections || []).includes(item.screen);
          return (
            <TouchableOpacity key={item.screen} onPress={() => toggleSection(item.screen)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: hidden ? c.border : c.teal, backgroundColor: hidden ? c.bg0 : c.teal + '18', opacity: hidden ? 0.5 : 1 }}>
              <Ionicons name={item.icon} size={13} color={hidden ? c.text4 : c.teal} />
              <Text style={{ fontSize: 12, color: hidden ? c.text4 : c.teal, fontWeight: hidden ? '400' : '700' }}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recommended for you — built from the "How will you actually use
          this?" answer in the previous step (buildRecommendations, above),
          so what shows here directly reflects what was just picked instead
          of a generic feature list. */}
      {(() => {
        const recs = buildRecommendations(data);
        if (!recs.length) return null;
        return (
          <>
            <SectionLabel label="Recommended for you" theme={theme} />
            <View style={{ marginBottom: 20, gap: 8 }}>
              {recs.map(rec => (
                <View key={rec.title} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: c.tealLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.teal + '44' }}>
                  <Ionicons name={rec.icon} size={18} color={c.teal} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: c.text1 }}>{rec.title}</Text>
                    <Text style={{ fontSize: 12, color: c.text3, marginTop: 2, lineHeight: 16 }}>{rec.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        );
      })()}

      {/* Summary */}
      <View style={{ backgroundColor: c.bg1, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: c.border }}>
        <Text style={{ color: c.text4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Mission Summary</Text>
        {[
          { label: 'Traveler', value: data.traveler_name || data.display_name || '—' },
          { label: 'Sectors', value: (data.active_life_areas || []).length + ' selected' },
          { label: 'Planner items', value: (data.planner_picks || []).length + ' scheduled' },
          { label: 'Daily commitment', value: data.daily_minutes ? data.daily_minutes + ' min' : '—' },
          { label: 'Goal', value: data.primary_goal || '—' },
        ].map(row => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
            <Text style={{ color: c.text4, fontSize: 13 }}>{row.label}</Text>
            <Text style={{ color: c.text1, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Onboarding ──────────────────────────────────────────────────────────
const STEPS = [
  { component: Step1, title: 'You',        subtitle: 'Who you are' },
  { component: Step2, title: 'Sectors',    subtitle: 'Your focus areas' },
  { component: Step3, title: 'Character',  subtitle: 'Meet your traveler' },
  { component: Step4, title: 'Planner',    subtitle: 'Daily habits' },
  { component: Step5, title: 'Interests',  subtitle: 'Topics & formats' },
  { component: Step6, title: 'Goals',      subtitle: 'Style & commitment' },
  { component: Step7, title: 'Look',       subtitle: 'Theme & layout' },
];

export default function MultiStepOnboarding() {
  const navigation = useNavigation();
  const themeCtx = useTheme(); // raw ThemeContext value — {colors, spacing, radius, ...}
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh, isDark, setTheme } = themeCtx;
  // Shorthand bundle every Step component / helper below expects
  // ({c, t, s, r, sh, isDark}) — not the same shape as the raw context
  // value above, which uses the full property names.
  const theme = { c, t, s, r, sh, isDark };
  const { setPersonalization, startTour } = useTour();
  const { refreshProfile } = useUserProgress();
  const [, setHiddenSections] = useSetting(SETTING_KEYS.HIDDEN_LIBRARY_SECTIONS, []);

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [userId,  setUserId]  = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [direction, setDir]   = useState(1); // 1=forward, -1=back

  // ── Age gate + parental consent — runs before Step1 (see below). This
  // app's users are K-12, so a real share are minors under COPPA (US,
  // default 13) or a country's GDPR Article 8 age — see
  // src/logic/ageOfConsent.js. 'age_gate' -> 'parent_email' ->
  // 'waiting_parent' -> 'consent' -> 'main'. A non-minor (or a minor who
  // already has parent_consent_given) skips straight to 'main'.
  const [phase, setPhase] = useState('age_gate');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [parentEmail, setParentEmail] = useState('');
  const [gateBusy, setGateBusy] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const pollRef = useRef(null);

  const [data, setData] = useState({
    display_name:      '',
    age_category:      '',
    motivation:        '',
    active_life_areas: [],
    crest_color:       'teal',
    role_badge:        'explorer',
    traveler_name:     '',
    planner_picks:     [],
    hidden_sections:   [],
    topics:            [],
    formats:            [],
    tech_level:        'beginner',
    primary_goal:      '',
    daily_minutes:     15,
    life_stage:        '',
    wants_reflection:  false,
    theme:             'dark',
    usage_patterns:    [],
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('date_of_birth, country_code, is_minor, parent_email, kws_pv_status, parent_consent_given')
          .eq('id', user.id)
          .maybeSingle();
        if (!profile) return; // brand new — starts at the default 'age_gate' phase

        if (profile.parent_email) setParentEmail(profile.parent_email);
        if (profile.country_code) setCountryCode(profile.country_code);
        if (profile.date_of_birth) {
          const [y, m, d] = profile.date_of_birth.split('-');
          setBirthYear(y); setBirthMonth(m); setBirthDay(d);
        }

        if (!profile.date_of_birth) setPhase('age_gate');
        else if (!profile.is_minor || profile.parent_consent_given) setPhase('main');
        else if (profile.kws_pv_status === 'verified') setPhase('consent');
        else if (profile.kws_pv_status === 'pending') setPhase('waiting_parent');
        else setPhase('parent_email');
      } catch (e) { console.warn('age gate prefill failed', e); }
    });
  }, []);

  // Re-checks parent-verification status every 20s while the "waiting on
  // your parent" screen is up, so most people never have to tap "Check
  // again" themselves.
  useEffect(() => {
    if (phase !== 'waiting_parent') {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => { checkParentStatus(); }, 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const submitBirthDate = async () => {
    const mm = parseInt(birthMonth, 10);
    const dd = parseInt(birthDay, 10);
    const yyyy = parseInt(birthYear, 10);
    const dob = new Date(yyyy, (mm || 1) - 1, dd || 1);
    const valid = yyyy > 1900 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31
      && dob <= new Date() && (new Date().getFullYear() - yyyy) < 120;
    if (!valid) {
      Alert.alert('Check your birth date', 'Enter a valid month, day, and year.');
      return;
    }
    const dateOfBirth = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const isMinor = isMinorRequiringConsent(dateOfBirth, countryCode);

    setGateBusy(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId, date_of_birth: dateOfBirth, country_code: countryCode, is_minor: isMinor,
      });
      if (error) throw error;
      setPhase(isMinor ? 'parent_email' : 'main');
    } catch (e) {
      Alert.alert('Save error', e.message || 'Could not save your birth date.');
    } finally {
      setGateBusy(false);
    }
  };

  const submitParentEmail = async () => {
    const email = parentEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Almost there', "Enter a parent or guardian's email address.");
      return;
    }
    setGateBusy(true);
    try {
      await startParentVerification({ parentEmail: email, countryCode });
      setPhase('waiting_parent');
    } catch (e) {
      Alert.alert('Could not send verification', e.message || 'Please try again.');
    } finally {
      setGateBusy(false);
    }
  };

  const checkParentStatus = async () => {
    if (!userId) return;
    try {
      const status = await getVerificationStatus(userId);
      if (status?.kws_pv_status === 'verified') setPhase('consent');
      else if (status?.kws_pv_status === 'failed') {
        Alert.alert(
          'Verification didn’t go through',
          'Your parent’s verification failed or was declined. You can try sending the request again.',
        );
        setPhase('parent_email');
      }
    } catch (e) { console.warn('checkParentStatus failed', e); }
  };

  const submitConsent = async () => {
    if (!consentChecked) {
      Alert.alert('One more thing', 'Please check the box to confirm you and your parent or guardian have reviewed this together.');
      return;
    }
    setGateBusy(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId, parent_consent_given: true, parent_consent_at: new Date().toISOString(),
      });
      if (error) throw error;
      setPhase('main');
    } catch (e) {
      Alert.alert('Save error', e.message || 'Could not save consent.');
    } finally {
      setGateBusy(false);
    }
  };

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  // Guards against a race where rapid taps (e.g. mashing "Skip") fire goNext()
  // several times before `step` has re-rendered — each call reads the same
  // stale `step` from its closure, passes the bounds check, and queues its
  // own setStep(s => s + 1). Once those all resolve, step can land past
  // STEPS.length - 1, and STEPS[step] is undefined on the next render.
  const advancing = useRef(false);

  const animateSlide = (dir, callback) => {
    slideAnim.setValue(dir * SW);
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
    }).start(() => {
      advancing.current = false;
      callback();
    });
  };

  const goNext = () => {
    if (advancing.current) return;
    if (step >= STEPS.length - 1) { finish(); return; }
    advancing.current = true;
    setDir(1);
    animateSlide(1, () => setStep(s2 => Math.min(s2 + 1, STEPS.length - 1)));
  };

  const goBack = () => {
    if (advancing.current) return;
    if (step === 0) return;
    advancing.current = true;
    setDir(-1);
    animateSlide(-1, () => setStep(s2 => Math.max(s2 - 1, 0)));
  };

  const skip = () => goNext();

  const finish = async () => {
    setSaving(true);
    try {
      if (!userId) throw new Error('No user');

      // Build hidden areas (all areas NOT in active)
      const hidden = LIFE_AREAS
        .map(a => a.id)
        .filter(id => !(data.active_life_areas || []).includes(id));

      const payload = {
        id:                   userId,
        display_name:         data.display_name || null,
        traveler_name:        data.traveler_name || data.display_name || null,
        age_category:         data.age_category || null,
        motivation:           data.motivation || null,
        active_life_areas:    data.active_life_areas,
        hidden_life_areas:    hidden,
        suit_color:           data.crest_color,
        badge:                data.role_badge,
        topics:               data.topics,
        formats:              data.formats,
        tech_level:           data.tech_level,
        primary_goal:         data.primary_goal || null,
        daily_minutes:        data.daily_minutes,
        life_stage:           data.life_stage || null,
        wants_reflection:     data.wants_reflection,
        theme:                data.theme,
        onboarding_completed: true,
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      // UserProgressContext loaded `profile` once at login and has no
      // reason to know this upsert just happened — without this, Home's
      // character card keeps showing whatever was true before onboarding
      // (the signup-time placeholder name, defaults, etc.) until something
      // else forces a full reload.
      await refreshProfile();

      // Actually schedule the planner items picked in Step4 — real
      // components from plannerService.js, not a discarded local list. The
      // same subscribeToComponent/generateInstances pair PlannerScreen's
      // own "Add" panel calls.
      for (const comp of (data.planner_picks || [])) {
        try {
          await subscribeToComponent(userId, comp.id);
          await generateInstances(userId, comp);
        } catch (e) { console.warn('onboarding planner subscribe', comp.id, e); }
      }

      // Library section visibility — device-local, same setting Settings'
      // own "Library Sections" editor reads/writes.
      await setHiddenSections(data.hidden_sections || []);

      // Personalize the guided tour with what was just picked.
      const areaLabels = LIFE_AREAS
        .filter(a => (data.active_life_areas || []).includes(a.id))
        .map(a => a.label);
      setPersonalization({ areaLabels, focusHub: pickFocusHub(data), recommendations: buildRecommendations(data) });

      // Generate recommendations based on answers
      await generateRecommendations(userId, payload);

      // Navigate to home, then force-start the tour — not
      // startIfFirstTime()'s auto-detection (App.js), which gates on a
      // device-level "have you EVER seen it" AsyncStorage flag, not a
      // per-account one. Testing onboarding more than once on the same
      // device — or a second account on a device that already saw the
      // tour once — would otherwise never see it again. Finishing
      // onboarding should always show it, period. Same
      // navigate-then-delayed-start pattern SettingsScreen.js's own
      // "Replay Tutorial" uses, needed because TourOverlay's spotlight
      // targets (TourSpot) haven't measured themselves until MainTabs has
      // actually mounted.
      navigation.replace('MainTabs');
      setTimeout(startTour, 300);
    } catch (e) {
      Alert.alert('Error', 'Could not save your setup. Try again.');
      console.warn('onboarding finish', e);
    }
    setSaving(false);
  };

  // Defensive clamp — belt-and-suspenders on top of the advancing-ref guard above.
  const StepComponent = STEPS[Math.min(Math.max(step, 0), STEPS.length - 1)].component;
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast   = step === STEPS.length - 1;
  const cs = chromeStyles(theme);
  const gs = gateStyles(theme);

  // ── Age gate / parent verification / consent screens — see the phase
  // state + handlers above. Rendered before Step1 whenever phase !== 'main'.
  if (phase === 'age_gate') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cs.bg}>
          <ScrollView contentContainerStyle={gs.body} showsVerticalScrollIndicator={false}>
            <Text style={gs.title}>First, when's{'\n'}your birthday?</Text>
            <Text style={gs.subtitle}>We ask everyone this — it's how we know whether to bring a parent or guardian into the loop.</Text>
            <View style={gs.dobRow}>
              <TextInput style={[gs.input, gs.dobInput]} placeholder="MM" placeholderTextColor={c.text4}
                value={birthMonth} onChangeText={setBirthMonth} keyboardType="number-pad" maxLength={2} />
              <TextInput style={[gs.input, gs.dobInput]} placeholder="DD" placeholderTextColor={c.text4}
                value={birthDay} onChangeText={setBirthDay} keyboardType="number-pad" maxLength={2} />
              <TextInput style={[gs.input, gs.dobInputYear]} placeholder="YYYY" placeholderTextColor={c.text4}
                value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" maxLength={4} />
            </View>
            <Text style={gs.sectionLabel}>Where do you live?</Text>
            {COUNTRY_CHOICES.map(item => {
              const selected = countryCode === item.value;
              return (
                <TouchableOpacity key={item.value} style={[gs.choice, selected && gs.choiceSelected]} onPress={() => setCountryCode(item.value)}>
                  <Text style={[gs.choiceText, selected && gs.choiceTextSelected]}>{item.label}</Text>
                  {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={gs.bottomBar}>
            <TouchableOpacity onPress={submitBirthDate} disabled={gateBusy} style={cs.nextBtn}>
              {gateBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cs.nextBtnText}>Continue</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (phase === 'parent_email') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cs.bg}>
          <ScrollView contentContainerStyle={gs.body} showsVerticalScrollIndicator={false}>
            <Text style={gs.title}>Let's bring in a{'\n'}parent or guardian</Text>
            <Text style={gs.subtitle}>
              Because of your age, we need a parent or guardian to confirm before you can finish setting up your account.
              We'll email them a quick verification link.
            </Text>
            <TextInput style={gs.input} placeholder="Parent or guardian's email" placeholderTextColor={c.text4}
              value={parentEmail} onChangeText={setParentEmail} autoCapitalize="none" keyboardType="email-address" />
          </ScrollView>
          <View style={gs.bottomBar}>
            <TouchableOpacity onPress={() => setPhase('age_gate')} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={gs.linkText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submitParentEmail} disabled={gateBusy} style={cs.nextBtn}>
              {gateBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cs.nextBtnText}>Send verification</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (phase === 'waiting_parent') {
    return (
      <View style={cs.bg}>
        <View style={[gs.body, { flex: 1, justifyContent: 'center' }]}>
          <Text style={gs.title}>Waiting on your{'\n'}parent or guardian</Text>
          <Text style={gs.subtitle}>
            We sent a verification email to {parentEmail || 'your parent or guardian'}. Once they confirm, you can keep going —
            this screen updates on its own, or tap below to check now.
          </Text>
          <TouchableOpacity onPress={checkParentStatus} style={cs.nextBtn}>
            <Text style={cs.nextBtnText}>Check again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPhase('parent_email')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={gs.linkText}>Sent to the wrong email? Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'consent') {
    return (
      <View style={cs.bg}>
        <ScrollView contentContainerStyle={gs.body} showsVerticalScrollIndicator={false}>
          <Text style={gs.title}>Almost there</Text>
          <Text style={gs.subtitle}>Your parent or guardian has been verified. Please review this together before continuing.</Text>
          <Text style={gs.consentBody}>
            To set up your account we'll store: a display name and avatar you choose (not your real name unless you use it),
            your grade-level and topic preferences, and your progress and streaks in the app. We don't require your real name,
            address, or photo. You can see or delete this info anytime from Settings.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={[gs.linkText, { marginBottom: 20 }]}>Read the full privacy policy ↗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={gs.consentRow} onPress={() => setConsentChecked(v => !v)}>
            <View style={[gs.checkbox, consentChecked && gs.checkboxActive]}>
              {consentChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={gs.consentRowText}>A parent or guardian and I have reviewed this together and agree to continue.</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={gs.bottomBar}>
          <TouchableOpacity onPress={submitConsent} disabled={gateBusy} style={cs.nextBtn}>
            {gateBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cs.nextBtnText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={cs.bg}>
        {/* Top nav */}
        <View style={cs.topNav}>
          {step > 0 ? (
            <TouchableOpacity onPress={goBack} style={cs.navBtn}>
              <Ionicons name="chevron-back" size={20} color={c.text3} />
            </TouchableOpacity>
          ) : <View style={{ width: 36 }} />}

          <View style={{ alignItems: 'center' }}>
            <Text style={cs.stepNum}>{step + 1} of {STEPS.length}</Text>
            <Text style={cs.stepName}>{STEPS[step].subtitle}</Text>
          </View>

          <TouchableOpacity onPress={skip} style={cs.navBtn}>
            <Text style={cs.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={cs.progressBar}>
          <Animated.View style={[cs.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Step dots */}
        <View style={cs.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[cs.dot, i === step && cs.dotActive, i < step && cs.dotDone]} />
          ))}
        </View>

        {/* Sliding card */}
        <Animated.View style={[cs.card, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <StepComponent data={data} set={set} theme={theme} onThemeChange={setTheme} />
          </ScrollView>
        </Animated.View>

        {/* Bottom button */}
        <View style={cs.bottomBar}>
          <TouchableOpacity onPress={goNext} disabled={saving}
            style={[cs.nextBtn, saving && { opacity: 0.6 }]}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={cs.nextBtnText}>{isLast ? '🚀 Launch My Base' : 'Continue'}</Text>
                  {!isLast && <Ionicons name="chevron-forward" size={18} color="#fff" />}
                </>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Outer chrome styles ────────────────────────────────────────────────────
const chromeStyles = ({ c, r }) => StyleSheet.create({
  bg:           { flex: 1, backgroundColor: c.bg0 },
  topNav:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  navBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepNum:      { fontSize: 11, color: c.text4, fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 1 },
  stepName:     { fontSize: 14, color: c.text1, fontFamily: FONTS.displaySemibold, fontWeight: '600', marginTop: 2 },
  skipText:     { fontSize: 13, color: c.text4 },
  progressBar:  { height: 2, backgroundColor: c.bg2, marginHorizontal: 20, borderRadius: 1, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 2, backgroundColor: c.teal, borderRadius: 1 },
  dots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: c.bg2 },
  dotActive:    { backgroundColor: c.teal, width: 20 },
  dotDone:      { backgroundColor: c.tealDim },
  card:         { flex: 1, marginHorizontal: 16, backgroundColor: c.bg1, borderRadius: r.xxl, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden' },
  bottomBar:    { padding: 20, paddingBottom: 40 },
  nextBtn:      { backgroundColor: c.teal, borderRadius: r.xl, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
});

// ─── Age gate / parent verification / consent styles ───────────────────────
const gateStyles = ({ c, r }) => StyleSheet.create({
  body:  { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 24 },
  title: { fontSize: 24, fontFamily: FONTS.displaySemibold, fontWeight: '700', color: c.text1, marginBottom: 10, lineHeight: 30 },
  subtitle: { fontSize: 13, color: c.text3, marginBottom: 20, lineHeight: 19 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: c.text3, marginBottom: 12, marginTop: 4 },

  input: {
    borderWidth: 1, borderColor: c.border, borderRadius: r.md,
    padding: 14, marginBottom: 20, fontSize: 15, color: c.text1, backgroundColor: c.bg1,
  },
  dobRow: { flexDirection: 'row', gap: 12 },
  dobInput: { flex: 1, textAlign: 'center' },
  dobInputYear: { flex: 1.4, textAlign: 'center' },

  choice: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: r.md, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.bg1, marginBottom: 10,
  },
  choiceSelected: { backgroundColor: c.teal, borderColor: c.teal },
  choiceText: { fontSize: 14, color: c.text1, fontWeight: '600' },
  choiceTextSelected: { color: '#fff' },

  consentBody: { fontSize: 13, color: c.text3, lineHeight: 19, marginBottom: 14 },
  linkText: { fontSize: 13, color: c.teal, fontWeight: '600' },

  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg1,
  },
  checkboxActive: { backgroundColor: c.teal, borderColor: c.teal },
  consentRowText: { fontSize: 13, color: c.text3, flex: 1, lineHeight: 18 },

  bottomBar: { padding: 20, paddingBottom: 40 },
});
