// src/screens/SettingsScreen.js
//
// New screen — didn't exist before. Holds the preference data onboarding
// collects (topics, formats, daily goal, experience level, reflection)
// plus account actions. ProfileScreen stays identity-only.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import { useTheme } from '../../context/ThemeContext';

const TOPIC_OPTIONS = [
  'AI & Machine Learning', 'Web & App Dev', 'Robotics', 'Cybersecurity',
  'Personal Finance', 'Entrepreneurship', 'Science', 'Design & Creativity',
  'Leadership & Communication',
];
const FORMAT_OPTIONS = ['Articles', 'Short videos', 'Audio / podcasts', 'Quizzes & challenges', 'Discussion'];
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DAILY_GOAL_OPTIONS = [10, 20, 30, 45, 60];

export default function SettingsScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [formats, setFormats] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [wantsReflection, setWantsReflection] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user || !mounted) { setLoading(false); return; }
        setUserId(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('topics, formats, experience_level, daily_goal_minutes, wants_reflection')
          .eq('id', user.id)
          .maybeSingle();
        if (data && mounted) {
          setTopics(data.topics || []);
          setFormats(data.formats || []);
          setExperienceLevel(data.experience_level || 'beginner');
          setDailyGoal(data.daily_goal_minutes || 20);
          setWantsReflection(data.wants_reflection ?? true);
        }
      } catch (e) {
        console.error('settings load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = (arr, setArr, val) => {
    setDirty(true);
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          topics,
          formats,
          experience_level: experienceLevel,
          daily_goal_minutes: dailyGoal,
          wants_reflection: wantsReflection,
        })
        .eq('id', userId);
      if (error) {
        Alert.alert('Save error', error.message || 'Could not save preferences.');
        return;
      }
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('MainTabs');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text3} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>Topics</Text>
        <View style={styles.chipGrid}>
          {TOPIC_OPTIONS.map(topic => (
            <TouchableOpacity
              key={topic}
              style={[styles.chip, topics.includes(topic) && styles.chipActive]}
              onPress={() => toggle(topics, setTopics, topic)}
            >
              <Text style={[styles.chipText, topics.includes(topic) && styles.chipTextActive]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>How you like to learn</Text>
        <View style={styles.chipGrid}>
          {FORMAT_OPTIONS.map(fmt => (
            <TouchableOpacity
              key={fmt}
              style={[styles.chip, formats.includes(fmt) && styles.chipActive]}
              onPress={() => toggle(formats, setFormats, fmt)}
            >
              <Text style={[styles.chipText, formats.includes(fmt) && styles.chipTextActive]}>{fmt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Experience level</Text>
        <View style={styles.row}>
          {EXPERIENCE_LEVELS.map(lvl => (
            <TouchableOpacity
              key={lvl}
              style={[styles.pill, experienceLevel === lvl && styles.pillActive]}
              onPress={() => { setExperienceLevel(lvl); setDirty(true); }}
            >
              <Text style={[styles.pillText, experienceLevel === lvl && styles.pillTextActive]}>
                {lvl[0].toUpperCase() + lvl.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Daily goal</Text>
        <View style={styles.row}>
          {DAILY_GOAL_OPTIONS.map(min => (
            <TouchableOpacity
              key={min}
              style={[styles.pill, dailyGoal === min && styles.pillActive]}
              onPress={() => { setDailyGoal(min); setDirty(true); }}
            >
              <Text style={[styles.pillText, dailyGoal === min && styles.pillTextActive]}>{min}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.reflectionRow}
          onPress={() => { setWantsReflection(v => !v); setDirty(true); }}
        >
          <View style={[styles.checkbox, wantsReflection && styles.checkboxActive]}>
            {wantsReflection && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.reflectionText}>Prompt me to reflect on what I learn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save preferences</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={c.danger || '#c94b4b'} />
          <Text style={[styles.dangerText, { color: c.danger || '#c94b4b' }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg0 },
  center: { flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s.md, paddingTop: s.xxl, paddingBottom: s.md,
  },
  backBtn: { padding: s.sm },
  title: { fontSize: t.lg, fontWeight: t.bold, color: c.text1 },

  body: { paddingHorizontal: s.xl, paddingBottom: s.xxl },
  sectionLabel: { fontSize: t.xs, fontWeight: t.semibold, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: s.lg, marginBottom: s.sm },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  chip: {
    paddingVertical: s.sm, paddingHorizontal: s.md, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1,
  },
  chipActive: { backgroundColor: c.goldMid, borderColor: c.goldMid },
  chipText: { fontSize: t.sm, color: c.text2 || c.text3, fontWeight: t.semibold },
  chipTextActive: { color: '#fff' },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  pill: {
    paddingVertical: s.sm, paddingHorizontal: s.lg, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1,
  },
  pillActive: { backgroundColor: c.goldMid, borderColor: c.goldMid },
  pillText: { fontSize: t.sm, color: c.text2 || c.text3, fontWeight: t.semibold },
  pillTextActive: { color: '#fff' },

  reflectionRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.xl },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg1,
  },
  checkboxActive: { backgroundColor: c.goldMid, borderColor: c.goldMid },
  reflectionText: { fontSize: t.sm, color: c.text2 || c.text3, flex: 1 },

  saveBtn: {
    backgroundColor: c.goldMid, borderRadius: r.md,
    paddingVertical: s.md + 2, alignItems: 'center', marginTop: s.xl,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },

  divider: { height: 0.5, backgroundColor: c.border, marginTop: s.xxl, marginBottom: s.lg },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: s.sm },
  dangerText: { fontSize: t.md, fontWeight: t.semibold },
});
