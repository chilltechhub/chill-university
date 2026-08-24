// src/screens/MultiStepOnboarding.js
// 7-step sliding card onboarding — space traveler theme

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Animated, Dimensions, StyleSheet,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { generateRecommendations } from '../api/recommendationEngine';

const { width: SW } = Dimensions.get('window');

// ─── Config ───────────────────────────────────────────────────────────────────

const LIFE_AREAS = [
  { key: 'physical',     emoji: '💪', label: 'Physical',     desc: 'Health, fitness, nutrition, sleep' },
  { key: 'mental',       emoji: '🧠', label: 'Mental',       desc: 'Mindfulness, learning, emotional wellness' },
  { key: 'social',       emoji: '🤝', label: 'Social',       desc: 'Relationships, community, communication' },
  { key: 'financial',    emoji: '💰', label: 'Financial',    desc: 'Budgeting, saving, investing' },
  { key: 'professional', emoji: '🚀', label: 'Professional', desc: 'Career, skills, work, ambition' },
  { key: 'spiritual',    emoji: '✨', label: 'Spiritual',    desc: 'Values, purpose, reflection' },
  { key: 'creative',     emoji: '🎨', label: 'Creative',     desc: 'Art, design, writing, music, making' },
  { key: 'digital',      emoji: '💻', label: 'Digital',      desc: 'Tech skills, online presence, tools' },
];

const SUIT_COLORS = [
  { key: 'teal',    color: '#2bb5a0', label: 'Nebula Teal' },
  { key: 'gold',    color: '#c9a84c', label: 'Solar Gold' },
  { key: 'purple',  color: '#8b4fc4', label: 'Void Purple' },
  { key: 'red',     color: '#e05858', label: 'Mars Red' },
  { key: 'blue',    color: '#3a7bd5', label: 'Deep Blue' },
  { key: 'green',   color: '#3ac860', label: 'Terra Green' },
  { key: 'orange',  color: '#e07a30', label: 'Solar Flare' },
  { key: 'silver',  color: '#9a9aa8', label: 'Starlight' },
];

const HELMET_STYLES = [
  { key: 'classic',    emoji: '🪖', label: 'Classic' },
  { key: 'visor',      emoji: '⛑️',  label: 'Visor' },
  { key: 'bubble',     emoji: '🌐', label: 'Bubble' },
  { key: 'stealth',    emoji: '🕶️',  label: 'Stealth' },
];

const BADGES = [
  { key: 'explorer',   emoji: '🧭', label: 'Explorer' },
  { key: 'builder',    emoji: '🏗️', label: 'Builder' },
  { key: 'scholar',    emoji: '📚', label: 'Scholar' },
  { key: 'guardian',   emoji: '🛡️', label: 'Guardian' },
  { key: 'pioneer',    emoji: '🌟', label: 'Pioneer' },
  { key: 'creator',    emoji: '🎨', label: 'Creator' },
];

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
  { key: 'teen',          label: 'Teen (13-17)' },
  { key: 'young_adult',   label: 'Young Adult (18-25)' },
  { key: 'adult',         label: 'Adult (26-40)' },
  { key: 'professional',  label: 'Professional (40+)' },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Chip({ label, selected, color, onPress, emoji }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: selected ? color : 'rgba(255,255,255,0.2)', backgroundColor: selected ? color + '33' : 'rgba(255,255,255,0.06)', marginRight: 8, marginBottom: 8 }}>
      {emoji && <Text style={{ fontSize: 14 }}>{emoji}</Text>}
      <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '400', color: selected ? color : 'rgba(255,255,255,0.7)' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ label }) {
  return <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 }}>{label}</Text>;
}

// ─── Step screens ─────────────────────────────────────────────────────────────

function Step1({ data, set }) {
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Welcome, Traveler 🚀</Text>
      <Text style={s.stepSubtitle}>Let's set up your mission base. What should we call you?</Text>

      <SectionLabel label="Your name" />
      <TextInput
        style={s.input}
        value={data.display_name}
        onChangeText={v => set('display_name', v)}
        placeholder="Display name..." placeholderTextColor="rgba(255,255,255,0.3)"
        autoFocus
      />

      <SectionLabel label="Where are you at in life?" />
      {AGE_CATS.map(ag => (
        <TouchableOpacity key={ag.key} onPress={() => set('age_category', ag.key)}
          style={[s.radioRow, data.age_category === ag.key && s.radioRowSelected]}>
          <View style={[s.radioCircle, data.age_category === ag.key && s.radioCircleSelected]}>
            {data.age_category === ag.key && <View style={s.radioInner} />}
          </View>
          <Text style={[s.radioLabel, data.age_category === ag.key && { color: '#fff', fontWeight: '700' }]}>{ag.label}</Text>
        </TouchableOpacity>
      ))}

      <SectionLabel label="What brings you here?" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {WHY_OPTIONS.map(opt => (
          <Chip key={opt.key} label={opt.label} emoji={opt.emoji}
            selected={data.motivation === opt.key}
            color="#2bb5a0"
            onPress={() => set('motivation', opt.key)} />
        ))}
      </View>
    </View>
  );
}

function Step2({ data, set }) {
  const toggle = (key) => {
    const cur = data.active_life_areas || [];
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    set('active_life_areas', next);
  };

  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Choose Your Sectors 🌌</Text>
      <Text style={s.stepSubtitle}>Pick 2-5 life areas to focus on. These shape your dashboard, planner, and recommendations.</Text>

      {LIFE_AREAS.map(area => {
        const sel = (data.active_life_areas || []).includes(area.key);
        return (
          <TouchableOpacity key={area.key} onPress={() => toggle(area.key)}
            style={[s.areaCard, sel && { borderColor: '#2bb5a0', backgroundColor: '#2bb5a022' }]}>
            <Text style={{ fontSize: 24 }}>{area.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.areaLabel, sel && { color: '#2bb5a0' }]}>{area.label}</Text>
              <Text style={s.areaDesc}>{area.desc}</Text>
            </View>
            <View style={[s.areaCheck, sel && { backgroundColor: '#2bb5a0', borderColor: '#2bb5a0' }]}>
              {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8 }}>
        {(data.active_life_areas || []).length} selected — aim for 2-5
      </Text>
    </View>
  );
}

function Step3({ data, set }) {
  const suitColor = SUIT_COLORS.find(s => s.key === data.suit_color)?.color || '#2bb5a0';
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Build Your Traveler 👨‍🚀</Text>
      <Text style={s.stepSubtitle}>Customize your space traveler. This character represents you across the app.</Text>

      {/* Preview */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: suitColor + '33', borderWidth: 2, borderColor: suitColor, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 44 }}>
            {HELMET_STYLES.find(h => h.key === data.helmet_style)?.emoji || '🪖'}
          </Text>
        </View>
        <Text style={{ color: suitColor, fontWeight: '700', marginTop: 8, fontSize: 15 }}>
          {data.traveler_name || data.display_name || 'Traveler'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          {BADGES.find(b => b.key === data.badge)?.emoji} {BADGES.find(b => b.key === data.badge)?.label}
        </Text>
      </View>

      {/* Traveler name */}
      <SectionLabel label="Traveler name (optional)" />
      <TextInput
        style={[s.input, { marginBottom: 16 }]}
        value={data.traveler_name}
        onChangeText={v => set('traveler_name', v)}
        placeholder={data.display_name || 'Name your traveler...'}
        placeholderTextColor="rgba(255,255,255,0.3)"
      />

      {/* Suit color */}
      <SectionLabel label="Suit color" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {SUIT_COLORS.map(sc => (
            <TouchableOpacity key={sc.key} onPress={() => set('suit_color', sc.key)}
              style={{ alignItems: 'center', gap: 5 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: sc.color, borderWidth: 3, borderColor: data.suit_color === sc.key ? '#fff' : 'transparent' }} />
              <Text style={{ fontSize: 9, color: data.suit_color === sc.key ? '#fff' : 'rgba(255,255,255,0.4)' }}>{sc.label.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Helmet */}
      <SectionLabel label="Helmet style" />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {HELMET_STYLES.map(h => (
          <TouchableOpacity key={h.key} onPress={() => set('helmet_style', h.key)}
            style={{ flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: data.helmet_style === h.key ? suitColor : 'rgba(255,255,255,0.15)', backgroundColor: data.helmet_style === h.key ? suitColor + '22' : 'transparent' }}>
            <Text style={{ fontSize: 22 }}>{h.emoji}</Text>
            <Text style={{ fontSize: 11, color: data.helmet_style === h.key ? suitColor : 'rgba(255,255,255,0.5)', marginTop: 4 }}>{h.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Badge */}
      <SectionLabel label="Your badge" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {BADGES.map(b => (
          <TouchableOpacity key={b.key} onPress={() => set('badge', b.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: data.badge === b.key ? suitColor : 'rgba(255,255,255,0.15)', backgroundColor: data.badge === b.key ? suitColor + '22' : 'transparent' }}>
            <Text style={{ fontSize: 16 }}>{b.emoji}</Text>
            <Text style={{ fontSize: 12, color: data.badge === b.key ? suitColor : 'rgba(255,255,255,0.6)', fontWeight: data.badge === b.key ? '700' : '400' }}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Step4({ data, set }) {
  const areas = data.active_life_areas || [];
  // Show planner components relevant to their life areas
  const PLANNER_OPTIONS = [
    { key: 'daily_checkin',  label: 'Daily check-in',     emoji: '✅', areas: ['physical','mental','spiritual'] },
    { key: 'workout',        label: 'Workout tracker',    emoji: '💪', areas: ['physical'] },
    { key: 'water',          label: 'Water intake',       emoji: '💧', areas: ['physical'] },
    { key: 'journal',        label: 'Daily journal',      emoji: '📓', areas: ['mental','spiritual','creative'] },
    { key: 'mindfulness',    label: 'Mindfulness moment', emoji: '🧘', areas: ['mental','spiritual'] },
    { key: 'priorities',     label: 'Top 3 priorities',   emoji: '🎯', areas: ['professional','mental'] },
    { key: 'spending',       label: 'Spending check',     emoji: '💰', areas: ['financial'] },
    { key: 'connection',     label: 'Connect with someone',emoji: '🤝', areas: ['social'] },
    { key: 'creative_time',  label: 'Creative session',   emoji: '🎨', areas: ['creative'] },
    { key: 'skill_practice', label: 'Skill practice',     emoji: '📚', areas: ['professional','digital'] },
    { key: 'reflection',     label: 'Evening reflection', emoji: '🌙', areas: ['mental','spiritual'] },
    { key: 'gratitude',      label: 'Gratitude note',     emoji: '💛', areas: ['mental','social','spiritual'] },
  ];

  const relevant = PLANNER_OPTIONS.filter(opt =>
    areas.length === 0 || opt.areas.some(a => areas.includes(a))
  );

  const toggle = (key) => {
    const cur = data.planner_picks || [];
    set('planner_picks', cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
  };

  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Set Up Your Planner 📋</Text>
      <Text style={s.stepSubtitle}>Pick what you want to track daily. Based on your selected life areas.</Text>

      {relevant.map(opt => {
        const sel = (data.planner_picks || []).includes(opt.key);
        return (
          <TouchableOpacity key={opt.key} onPress={() => toggle(opt.key)}
            style={[s.plannerRow, sel && { borderColor: '#c9a84c', backgroundColor: '#c9a84c18' }]}>
            <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
            <Text style={[s.plannerLabel, sel && { color: '#fff', fontWeight: '700' }]}>{opt.label}</Text>
            <View style={[s.areaCheck, sel && { backgroundColor: '#c9a84c', borderColor: '#c9a84c' }]}>
              {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Step5({ data, set }) {
  const toggleTopic = (t) => {
    const cur = data.topics || [];
    set('topics', cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]);
  };
  const toggleFormat = (f) => {
    const cur = data.formats || [];
    set('formats', cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f]);
  };

  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Your Interests 🌍</Text>
      <Text style={s.stepSubtitle}>This powers your class and game recommendations.</Text>

      <SectionLabel label="Topics you're into" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {TOPICS.map(tp => (
          <Chip key={tp} label={tp}
            selected={(data.topics || []).includes(tp)}
            color="#8b4fc4"
            onPress={() => toggleTopic(tp)} />
        ))}
      </View>

      <SectionLabel label="How you like to learn" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FORMATS.map(f => {
          const sel = (data.formats || []).includes(f.key);
          return (
            <TouchableOpacity key={f.key} onPress={() => toggleFormat(f.key)}
              style={{ alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: sel ? '#8b4fc4' : 'rgba(255,255,255,0.15)', backgroundColor: sel ? '#8b4fc422' : 'transparent', minWidth: 80 }}>
              <Text style={{ fontSize: 22, marginBottom: 4 }}>{f.emoji}</Text>
              <Text style={{ fontSize: 11, color: sel ? '#8b4fc4' : 'rgba(255,255,255,0.6)', fontWeight: sel ? '700' : '400' }}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionLabel label="Tech / skill level" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['beginner','intermediate','advanced'].map(lvl => (
          <TouchableOpacity key={lvl} onPress={() => set('tech_level', lvl)}
            style={{ flex: 1, padding: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', borderColor: data.tech_level === lvl ? '#3a7bd5' : 'rgba(255,255,255,0.15)', backgroundColor: data.tech_level === lvl ? '#3a7bd522' : 'transparent' }}>
            <Text style={{ fontSize: 12, color: data.tech_level === lvl ? '#3a7bd5' : 'rgba(255,255,255,0.6)', fontWeight: data.tech_level === lvl ? '700' : '400', textTransform: 'capitalize' }}>{lvl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Step6({ data, set }) {
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Your Goals & Style ⚡</Text>
      <Text style={s.stepSubtitle}>Help us personalize your experience.</Text>

      <SectionLabel label="Primary goal" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {PRIMARY_GOALS.map(g => (
          <Chip key={g} label={g}
            selected={data.primary_goal === g}
            color="#e05858"
            onPress={() => set('primary_goal', g)} />
        ))}
      </View>

      <SectionLabel label="Daily time commitment" />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {DAILY_MIN.map(opt => (
          <TouchableOpacity key={opt.val} onPress={() => set('daily_minutes', opt.val)}
            style={{ flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: data.daily_minutes === opt.val ? '#e05858' : 'rgba(255,255,255,0.15)', backgroundColor: data.daily_minutes === opt.val ? '#e0585822' : 'transparent' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: data.daily_minutes === opt.val ? '#e05858' : '#fff' }}>{opt.label}</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel label="Life stage" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['In school','Starting out','Mid-career','Career change','Side hustle','Just exploring'].map(ls => (
          <Chip key={ls} label={ls}
            selected={data.life_stage === ls}
            color="#3ac860"
            onPress={() => set('life_stage', ls)} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginTop: 8 }}>
        <View>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Track reflections</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Guided prompts to log what you learned</Text>
        </View>
        <Switch
          value={data.wants_reflection || false}
          onValueChange={v => set('wants_reflection', v)}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#3ac86088' }}
          thumbColor={data.wants_reflection ? '#3ac860' : '#888'}
        />
      </View>
    </View>
  );
}

function Step7({ data, set }) {
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Choose Your Theme 🎨</Text>
      <Text style={s.stepSubtitle}>Pick the look that feels right. You can change this anytime in settings.</Text>

      <View style={{ gap: 14, marginTop: 8 }}>
        {/* Dark theme */}
        <TouchableOpacity onPress={() => set('theme', 'dark')}
          style={[s.themeCard, { backgroundColor: '#0e0818', borderColor: data.theme === 'dark' ? '#c9a84c' : 'rgba(255,255,255,0.1)' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e8dfc8', fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Dark · Royal Library</Text>
            <Text style={{ color: '#7a6a9a', fontSize: 13 }}>Deep space. Gold accents. Easy on the eyes at night.</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              {['#0e0818','#1c1530','#c9a84c','#2bb5a0','#e8dfc8'].map(col => (
                <View key={col} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: col, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />
              ))}
            </View>
          </View>
          {data.theme === 'dark' && <Ionicons name="checkmark-circle" size={24} color="#c9a84c" />}
        </TouchableOpacity>

        {/* Light theme */}
        <TouchableOpacity onPress={() => set('theme', 'light')}
          style={[s.themeCard, { backgroundColor: '#faf8f4', borderColor: data.theme === 'light' ? '#2bb5a0' : 'rgba(0,0,0,0.1)' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1a1208', fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Light · Parchment</Text>
            <Text style={{ color: '#7a6a5a', fontSize: 13 }}>Warm and bright. Great for daytime focus.</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              {['#faf8f4','#f0ebe2','#2bb5a0','#c9a84c','#1a1208'].map(col => (
                <View key={col} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: col, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)' }} />
              ))}
            </View>
          </View>
          {data.theme === 'light' && <Ionicons name="checkmark-circle" size={24} color="#2bb5a0" />}
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={{ marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Mission Summary</Text>
        {[
          { label: 'Traveler', value: data.traveler_name || data.display_name || '—' },
          { label: 'Sectors', value: (data.active_life_areas || []).length + ' selected' },
          { label: 'Planner items', value: (data.planner_picks || []).length + ' added' },
          { label: 'Daily commitment', value: data.daily_minutes ? data.daily_minutes + ' min' : '—' },
          { label: 'Goal', value: data.primary_goal || '—' },
        ].map(row => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{row.label}</Text>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{row.value}</Text>
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
  { component: Step3, title: 'Traveler',   subtitle: 'Your character' },
  { component: Step4, title: 'Planner',    subtitle: 'Daily habits' },
  { component: Step5, title: 'Interests',  subtitle: 'Topics & formats' },
  { component: Step6, title: 'Goals',      subtitle: 'Style & commitment' },
  { component: Step7, title: 'Theme',      subtitle: 'Your look' },
];

export default function MultiStepOnboarding() {
  const navigation = useNavigation();
  const { colors: c } = useTheme();

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [userId,  setUserId]  = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [direction, setDir]   = useState(1); // 1=forward, -1=back

  const [data, setData] = useState({
    display_name:      '',
    age_category:      '',
    motivation:        '',
    active_life_areas: [],
    suit_color:        'teal',
    helmet_style:      'classic',
    badge:             'explorer',
    traveler_name:     '',
    planner_picks:     [],
    topics:            [],
    formats:           [],
    tech_level:        'beginner',
    primary_goal:      '',
    daily_minutes:     15,
    life_stage:        '',
    wants_reflection:  false,
    theme:             'dark',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const animateSlide = (dir, callback) => {
    slideAnim.setValue(dir * SW);
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
    }).start(callback);
  };

  const goNext = () => {
    if (step >= STEPS.length - 1) { finish(); return; }
    setDir(1);
    animateSlide(1, () => setStep(s => s + 1));
  };

  const goBack = () => {
    if (step === 0) return;
    setDir(-1);
    animateSlide(-1, () => setStep(s => s - 1));
  };

  const skip = () => goNext();

  const finish = async () => {
    setSaving(true);
    try {
      if (!userId) throw new Error('No user');

      // Build hidden areas (all areas NOT in active)
      const hidden = LIFE_AREAS
        .map(a => a.key)
        .filter(k => !(data.active_life_areas || []).includes(k));

      const payload = {
        id:                   userId,
        display_name:         data.display_name || null,
        traveler_name:        data.traveler_name || data.display_name || null,
        age_category:         data.age_category || null,
        motivation:           data.motivation || null,
        active_life_areas:    data.active_life_areas,
        hidden_life_areas:    hidden,
        suit_color:           data.suit_color,
        helmet_style:         data.helmet_style,
        badge:                data.badge,
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

      // Generate recommendations based on answers
      await generateRecommendations(userId, payload);

      // Navigate to home
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Error', 'Could not save your setup. Try again.');
      console.warn('onboarding finish', e);
    }
    setSaving(false);
  };

  const StepComponent = STEPS[step].component;
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast   = step === STEPS.length - 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Starfield background */}
      <View style={s.bg}>
        {/* Top nav */}
        <View style={s.topNav}>
          {step > 0 ? (
            <TouchableOpacity onPress={goBack} style={s.navBtn}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          ) : <View style={{ width: 36 }} />}

          {/* Step labels */}
          <View style={{ alignItems: 'center' }}>
            <Text style={s.stepNum}>{step + 1} of {STEPS.length}</Text>
            <Text style={s.stepName}>{STEPS[step].subtitle}</Text>
          </View>

          <TouchableOpacity onPress={skip} style={s.navBtn}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={s.progressBar}>
          <Animated.View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Step dots */}
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]} />
          ))}
        </View>

        {/* Sliding card */}
        <Animated.View style={[s.card, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <StepComponent data={data} set={set} />
          </ScrollView>
        </Animated.View>

        {/* Bottom button */}
        <View style={s.bottomBar}>
          <TouchableOpacity onPress={goNext} disabled={saving}
            style={[s.nextBtn, saving && { opacity: 0.6 }]}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={s.nextBtnText}>{isLast ? '🚀 Launch My Base' : 'Continue'}</Text>
                  {!isLast && <Ionicons name="chevron-forward" size={18} color="#fff" />}
                </>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: '#080612' },
  topNav:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  navBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepNum:      { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  stepName:     { fontSize: 14, color: '#fff', fontWeight: '600', marginTop: 2 },
  skipText:     { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  progressBar:  { height: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 1, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 2, backgroundColor: '#2bb5a0', borderRadius: 1 },
  dots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive:    { backgroundColor: '#2bb5a0', width: 20 },
  dotDone:      { backgroundColor: 'rgba(43,181,160,0.4)' },
  card:         { flex: 1, marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  bottomBar:    { padding: 20, paddingBottom: 40 },
  nextBtn:      { backgroundColor: '#2bb5a0', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Step content
  stepContent:  { padding: 20 },
  stepTitle:    { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  stepSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 24 },
  input:        { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },

  // Area cards
  areaCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  areaLabel:    { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  areaDesc:     { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  areaCheck:    { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Planner rows
  plannerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  plannerLabel: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  // Radio
  radioRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  radioRowSelected: { borderColor: '#2bb5a0', backgroundColor: '#2bb5a018' },
  radioCircle:      { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#2bb5a0' },
  radioInner:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2bb5a0' },
  radioLabel:       { fontSize: 14, color: 'rgba(255,255,255,0.6)' },

  // Theme cards
  themeCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 2 },
});
