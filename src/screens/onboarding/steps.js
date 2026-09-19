// src/screens/onboarding/steps.js
//
// The individual onboarding question screens, lifted out of
// MultiStepOnboarding.js so two very different surfaces can render the
// exact same UI:
//
//   1. MultiStepOnboarding.js — the required core (persona + sectors),
//      shown once before anyone reaches the app.
//   2. components/GettingStartedCard.js — everything else, as bottom
//      sheets opened from Home whenever the user feels like it.
//
// Splitting the flow that way is the whole point of this module: the old
// wizard asked ~20 questions across 8 steps before showing a single screen
// of the app, and none of it saved until the last tap. Now only the two
// answers that actually configure the app up front are required, and the
// rest are answered in place, where you can see what they change.
//
// Every component here takes the same props — ({ data, set, theme,
// isMinor, onThemeChange }) — which is what lets the same function back a
// wizard page and a modal sheet with no rewrite.
//
// NOTE on `theme`: these expect the SHORTHAND bundle ({c, t, s, r, sh,
// isDark}), not the raw useTheme() context value (which uses the long
// property names: colors, typography, spacing...). Callers build it once
// at the top — see MultiStepOnboarding.js.

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Dimensions, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEMES, FONTS } from '../../theme';
import useSetting, { SETTING_KEYS } from '../../logic/useSetting';
import { ensureNotificationPermission } from '../../logic/notificationScheduler';
import { LIFE_AREAS } from '../library/LifeAreaScreen';
import { LIBRARY_HUBS } from '../library/LibraryScreen';
import { AREAS as PLANNER_AREAS, getPresetComponents } from '../../api/plannerService';
import { CREST_COLORS, ROLE_BADGES } from '../../data/crestOptions';
import useCharacterLoadout from '../../logic/useCharacterLoadout';
import LandscapeBackground from '../../components/LandscapeBackground';
import CharacterWalker from '../../components/CharacterWalker';
import PlayerCharacter from '../../components/PlayerCharacter';
import { OUTFITS } from '../../data/characterOptions';
import { personasFor, defaultPersonaFor, getPersona } from '../../data/personas';
import { firstGoalFor } from '../../logic/experienceStage';
import { getObjective } from '../../data/objectives';

const { width: SW } = Dimensions.get('window');

// ─── Persona (Primary Mission) ────────────────────────────────────────────────
// The first and only unavoidable question. Everything downstream reads off
// it: which life areas SectorsStep pre-selects, which dashboard widgets land
// on Home, which Academy track surfaces first, and which first action the
// Getting Started card suggests.
//
// The list shown is age-aware — personasFor({ isMinor, ageBand }) offers a
// kid Student only, a teen Student or Personal (Student first), and hides the
// two adult financial modes from anyone under 18. The persona's real home is the
// persona_profiles row created at the end of onboarding; note that
// profiles.active_persona, which an older migration adds and some comments
// still reference, is NOT on the live table.

// One baseline number per type, asked inline right after the pick rather than
// as its own step — "Baseline Settings" in the blueprint. Stored on the
// profile row's `baseline`, not on `profiles`, because it belongs to that one
// profile: the same person can have a GPA goal on one and a revenue target on
// another, and two BUSINESS profiles can carry different targets.
const PERSONA_BASELINE = {
  PERSONAL:     { key: 'habit_target',   label: 'A habit you want to hold', placeholder: 'e.g. read 20 min a day', keyboard: 'default' },
  STUDENT:      { key: 'gpa_goal',       label: 'Your target GPA',          placeholder: 'e.g. 3.5',               keyboard: 'decimal-pad' },
  BUSINESS:     { key: 'revenue_target', label: 'Monthly revenue target',   placeholder: 'e.g. 10000',             keyboard: 'number-pad' },
  ENTREPRENEUR: { key: 'venture_stage',  label: 'Where your venture is now', placeholder: 'e.g. just an idea',     keyboard: 'default' },
};

// Auto-config: which life areas SectorsStep pre-selects for each mode, so the
// "Sectors" step opens already sensible instead of empty. Still fully
// editable there — these are defaults, not restrictions.
export const PERSONA_AREA_DEFAULTS = {
  PERSONAL:     ['physical', 'mental', 'social'],
  STUDENT:      ['mental', 'professional', 'social'],
  BUSINESS:     ['professional', 'financial', 'digital'],
  ENTREPRENEUR: ['financial', 'professional', 'creative'],
};



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
// unrelated answers (goal/topics) alone — this is the actual signal
// buildRecommendations() below weighs most heavily, since it's the user
// telling us straight out how they intend to actually use the app
// day-to-day, not just what they're broadly here for.
export const USAGE_PATTERNS = [
  { key: 'habits',    emoji: '📅', label: 'Daily habits & check-ins' },
  { key: 'building',  emoji: '🏗️', label: 'Building projects' },
  { key: 'learning',  emoji: '📚', label: 'Structured courses' },
  { key: 'reflecting',emoji: '🧠', label: 'Journaling & reflection' },
  { key: 'planning',  emoji: '🗂️', label: 'Planning & organizing' },
  { key: 'breaks',    emoji: '🎮', label: 'Quick games & breaks' },
];

// Simple keyword → Library section match for personalizing the tour.
// First match wins; order matters. usage_patterns (an explicit multi-select
// in GoalsStep) is weighed above the goal/topics answers, since it's a
// direct signal rather than an inferred one.
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

export function pickFocusHub(data) {
  const haystack = [data.primary_goal, ...(data.usage_patterns || []), ...(data.topics || [])]
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
// shown directly in LookStep's summary so the "suggest things based
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

export function buildRecommendations(data) {
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

// Kept true the same way personas.changes is: each line is checkable —
// HomeScreen's layoutForPersona({ exploring }), the Wayfinder screen, and
// the age-appropriate default type being the one underneath.
const exploringChanges = (baseKey, ageBand) => [
  'Home leads with Wayfinder — three short steps to see what pulls you and what you can already do',
  'Then a few real paths to test, with small experiments you can try this week',
  ageBand === 'kid'
    ? `You start as a ${getPersona(baseKey).short} profile — more types open up as you get older`
    : `You start as a ${getPersona(baseKey).short} profile — you can change type any time`,
];

export function PersonaStep({ data, set, theme, isMinor, ageBand }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const personaCtx = { isMinor, ageBand };
  const options = personasFor(personaCtx);
  // What "I'm not sure yet" lands on underneath: Personal for an adult,
  // Student for anyone under 18.
  const exploringBase = defaultPersonaFor(personaCtx);
  const exploring = !!data.exploring;
  // Nobody who just said "I don't know yet" should be asked for a baseline
  // number about the thing they don't know yet.
  const baseline = data.active_persona && !exploring ? PERSONA_BASELINE[data.active_persona] : null;
  const chosen = data.active_persona ? getPersona(data.active_persona) : null;

  const choose = (key) => {
    set('exploring', false);
    set('active_persona', key);
    // Pre-fill the Sectors step unless the user has already touched it
    // themselves — re-picking a mission shouldn't silently wipe a hand-made
    // selection.
    if (!data.areas_touched) {
      set('active_life_areas', PERSONA_AREA_DEFAULTS[key] || []);
    }
  };

  const chooseExploring = () => {
    set('exploring', true);
    set('active_persona', exploringBase);
    if (!data.areas_touched) {
      set('active_life_areas', PERSONA_AREA_DEFAULTS[exploringBase] || []);
    }
  };

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Your first profile</Text>
      <Text style={st.stepSubtitle}>
        This one becomes your master profile — the one that manages the rest. You can add more later
        (a second job, another startup, a separate personal space), and your level, points and streak
        are shared across all of them.
      </Text>

      {options.map(p => {
        const sel = !exploring && data.active_persona === p.key;
        return (
          <TouchableOpacity key={p.key} onPress={() => choose(p.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: sel ? p.color + '18' : c.bg0, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: sel ? p.color : c.border }}>
            <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: sel ? p.color : c.text1, marginBottom: 2 }}>{p.label}</Text>
              <Text style={{ fontSize: 12, color: c.text3 }}>{p.blurb}</Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: sel ? p.color : c.border, backgroundColor: sel ? p.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Every option above assumes you already know what you're here for.
          This one is for everyone who doesn't — it still has to land on a
          real profile type (the app can't render without one), so it's
          the age-appropriate default underneath — PERSONAL for an adult,
          STUDENT for anyone under 18 — plus a flag that makes Home lead
          with Wayfinder. */}
      <TouchableOpacity onPress={chooseExploring}
        accessibilityRole="radio" accessibilityState={{ checked: exploring }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: exploring ? c.teal + '18' : c.bg0, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderStyle: exploring ? 'solid' : 'dashed', borderColor: exploring ? c.teal : c.border }}>
        <Text style={{ fontSize: 24 }}>🧭</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: exploring ? c.teal : c.text1, marginBottom: 2 }}>I’m not sure yet</Text>
          <Text style={{ fontSize: 12, color: c.text3 }}>Help me figure out what I want — and what I’m already good at</Text>
        </View>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: exploring ? c.teal : c.border, backgroundColor: exploring ? c.teal : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {exploring && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
      </TouchableOpacity>

      {ageBand === 'kid' ? (
        <Text style={{ fontSize: 11, color: c.text4, lineHeight: 16, marginTop: 4 }}>
          Student is built for your age — lessons, study tools and life areas written for you.
          More profile types open up as you get older.
        </Text>
      ) : isMinor && (
        <Text style={{ fontSize: 11, color: c.text4, lineHeight: 16, marginTop: 4 }}>
          Two more modes — Business Systems and Entrepreneur — cover adult financial topics like
          business credit and taxes. They unlock on an adult account.
        </Text>
      )}

      {/* What the choice actually does. This used to be a one-line blurb per
          option and nothing else, which made the pick feel cosmetic — and
          for a long time it WAS cosmetic, because nothing read the type.
          Every line here is checkable against personas.defaultWidgets and
          the persona filter in Classes.js. */}
      {exploring && (
        <View style={{ marginTop: 16, backgroundColor: c.teal + '12', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.teal + '44' }}>
          <Text style={{ fontSize: 11, color: c.teal, fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            What this changes
          </Text>
          {exploringChanges(exploringBase, ageBand).map(line => (
            <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <Ionicons name="checkmark" size={13} color={c.teal} style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 12, color: c.text2, flex: 1, lineHeight: 17 }}>{line}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: c.text4, marginTop: 4, lineHeight: 16 }}>
            Not knowing yet is where most people start. Nothing here locks you in.
          </Text>
        </View>
      )}

      {!exploring && chosen?.changes?.length > 0 && (
        <View style={{ marginTop: 16, backgroundColor: chosen.color + '12', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: chosen.color + '44' }}>
          <Text style={{ fontSize: 11, color: chosen.color, fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            What this changes
          </Text>
          {chosen.changes.map(line => (
            <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <Ionicons name="checkmark" size={13} color={chosen.color} style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 12, color: c.text2, flex: 1, lineHeight: 17 }}>{line}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: c.text4, marginTop: 4, lineHeight: 16 }}>
            {data.experience_mode !== 'full'
              ? 'Starting simple, the dashboard fills in a widget or two at a time as you go. '
              : ''}
            You can change type later, add more profiles for other parts of your life, and rearrange
            any of it — your level, points and streak are shared across all of them.
          </Text>
        </View>
      )}

      {/* How much of the app to start with — src/data/experienceStages.js.
          Simple is the default and the recommendation: one goal, the tools
          that fit this type, three games, and a little more with every goal
          finished and level gained.
          "Everything" is for someone who already knows apps like this and
          would find a short list patronising. Either is one switch in
          Settings later, so this never has to be the right answer forever. */}
      {chosen && (
        <View style={{ marginTop: 16 }}>
          <SectionLabel label="How much do you want to see at first?" theme={theme} />
          <ExperienceChoice
            selected={data.experience_mode !== 'full'}
            emoji="🌱"
            title="Start simple"
            tag="Recommended"
            body={(() => {
              const first = getObjective(firstGoalFor(data.active_persona).objective);
              return `One goal to start${first ? ` (${first.label})` : ''}, with your guide showing you each step. A few tools and three games picked for ${exploring ? 'you' : chosen.short}, and a little more opens with every goal you finish.`;
            })()}
            onPress={() => set('experience_mode', 'auto')}
            theme={theme}
          />
          <ExperienceChoice
            selected={data.experience_mode === 'full'}
            emoji="🗺️"
            title="Show me everything"
            body="Every tool, game and widget from day one. For people who know their way around apps like this."
            onPress={() => set('experience_mode', 'full')}
            theme={theme}
          />
        </View>
      )}

      {/* Your name, not the profile's. The profile itself isn't named here
          on purpose: createProfile() already falls back to the persona's
          short label ("Personal", "Student"...), and renaming it is one tap
          in the profile switcher — so asking for it up front was a field
          that cost a keyboard and bought nothing. */}
      {chosen && (
        <View style={{ marginTop: 16 }}>
          <SectionLabel label="What should we call you?" theme={theme} />
          <TextInput
            style={st.input}
            value={data.display_name}
            onChangeText={v => set('display_name', v)}
            placeholder="Display name..."
            placeholderTextColor={c.text4}
            maxLength={40}
          />
          <Text style={{ fontSize: 11, color: c.text4, marginTop: 6 }}>
            Shows on your Home card and the leaderboard. Change it any time in Settings.
          </Text>
        </View>
      )}

      {baseline && (
        <View style={{ marginTop: 16 }}>
          <SectionLabel label={baseline.label} theme={theme} />
          <TextInput
            style={st.input}
            value={data.persona_baseline?.[baseline.key] || ''}
            onChangeText={v => set('persona_baseline', { ...(data.persona_baseline || {}), [baseline.key]: v })}
            placeholder={baseline.placeholder}
            placeholderTextColor={c.text4}
            keyboardType={baseline.keyboard}
          />
          <Text style={{ fontSize: 11, color: c.text4, marginTop: 6 }}>Optional — you can set this later.</Text>
        </View>
      )}
    </View>
  );
}

function ExperienceChoice({ selected, emoji, title, tag, body, onPress, theme }) {
  const { c } = theme;
  return (
    <TouchableOpacity onPress={onPress}
      accessibilityRole="radio" accessibilityState={{ checked: selected }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selected ? c.teal + '18' : c.bg0, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: selected ? c.teal : c.border }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: selected ? c.teal : c.text1 }}>{title}</Text>
          {tag && <Text style={{ fontSize: 10, color: c.teal, fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 0.8 }}>{tag}</Text>}
        </View>
        <Text style={{ fontSize: 12, color: c.text3, lineHeight: 17 }}>{body}</Text>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: selected ? c.teal : c.border, backgroundColor: selected ? c.teal : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

export function SectorsStep({ data, set, theme }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const toggle = (id) => {
    const cur = data.active_life_areas || [];
    // Flag the hand-edit so going back and re-picking a mission doesn't
    // overwrite it (see PersonaStep.choose).
    set('areas_touched', true);
    set('active_life_areas', cur.includes(id) ? cur.filter(k => k !== id) : [...cur, id]);
  };

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>Choose Your Sectors</Text>
      <Text style={st.stepSubtitle}>Pre-picked from your mission — change any of them. Pick 2-5 life areas to focus on first. These are exactly what shows up in your Library's life-area grid — add the rest any time with the "+ Add" tile there, or from Settings.</Text>

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

export function CharacterStep({ data, set, theme }) {
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

export function PlannerStep({ data, set, theme }) {
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
        <Text style={st.stepSubtitle}>Starter templates are pulled from your chosen sectors, and you haven't got any yet. Pick a few from the Library's life-area grid (or Settings) and come back.</Text>
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

export function InterestsStep({ data, set, theme }) {
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

export function GoalsStep({ data, set, theme }) {
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

      {/* Pays off the answer directly above, in place. This used to render
          two steps later on the wizard's final page, which is a long way
          to carry a payoff. */}
      {(() => {
        const recs = buildRecommendations(data);
        if (!recs.length) return null;
        return (
          <View style={{ marginTop: 16 }}>
            <SectionLabel label="Based on that, try these" theme={theme} />
            <View style={{ gap: 8 }}>
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
          </View>
        );
      })()}

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

export function LookStep({ data, set, theme, onThemeChange }) {
  const { c } = theme;
  const st = stepStyles(theme);
  const allSections = LIBRARY_HUBS.flatMap(hub => hub.items);
  const toggleSection = (screen) => {
    const cur = data.hidden_sections || [];
    set('hidden_sections', cur.includes(screen) ? cur.filter(x => x !== screen) : [...cur, screen]);
  };
  const pickTheme = (name) => { set('theme', name); onThemeChange(name); };
  // Starting simple, the Library opens with a handful of tools picked for
  // the profile type — asking which of twelve sections to hide, before
  // any of them are on show, would be a question about nothing.
  const simple = data.experience_mode !== 'full';

  return (
    <View style={st.stepContent}>
      <Text style={st.stepTitle}>{simple ? 'Look' : 'Look & Layout'}</Text>
      <Text style={st.stepSubtitle}>
        {simple
          ? 'Pick your theme. Everything here is changeable any time from Settings.'
          : 'Pick your theme, and choose which Library sections show up. Everything here is changeable any time from Settings.'}
      </Text>

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
          Starting plain and simple. Switch Home or Library to match your traveler's landscape any time from Settings → Personalization.
        </Text>
      </View>

      {simple ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.bg1, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: c.border }}>
          <Ionicons name="leaf-outline" size={20} color={c.teal} />
          <Text style={{ flex: 1, fontSize: 12, color: c.text3, lineHeight: 17 }}>
            Your Library starts with the few tools that fit your profile, and grows as you finish goals.
            Once it has more in it, Settings lets you hide any section you don't use.
          </Text>
        </View>
      ) : (<>
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
      </>)}

    </View>
  );
}

