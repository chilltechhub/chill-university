// src/screens/Onboarding.js
//
// Replaces MultiStepOnboarding.js and ProfileQuickSetup.js.
// One streamlined flow, one profile schema, themed to match Login/Profile/Settings.
//
// Final columns written to `profiles`:
//   display_name, avatar_id, motivation[], topics[], formats[],
//   experience_level, daily_goal_minutes, wants_reflection, onboarding_completed

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import { useTheme } from '../../context/ThemeContext';

const AVATARS = ['📚', '🦉', '🦊', '🐱', '🤖', '🌱'];

const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     hint: "I'm just getting started" },
  { value: 'intermediate', label: 'Intermediate', hint: 'I know the basics' },
  { value: 'advanced',     label: 'Advanced',     hint: 'I want to go deep' },
];

const DAILY_GOAL_OPTIONS = [10, 20, 30, 45, 60];

// Steps 1–5 share the same "pick from choices" shape.
const QUESTIONS = [
  {
    key: 'motivation',
    type: 'multi',
    title: 'What brings you here?',
    subtitle: 'Pick as many as apply.',
    choices: ['Learn new skills', 'Understand tech', 'Grow personally', 'Curious', 'Connect with others'],
  },
  {
    key: 'topics',
    type: 'multi',
    title: 'What are you interested in?',
    subtitle: 'This shapes what shows up in your Library.',
    choices: [
      'AI & Machine Learning', 'Web & App Dev', 'Robotics', 'Cybersecurity',
      'Personal Finance', 'Entrepreneurship', 'Science', 'Design & Creativity',
      'Leadership & Communication',
    ],
  },
  {
    key: 'formats',
    type: 'multi',
    title: 'How do you like to learn?',
    subtitle: 'We\'ll surface more of what fits.',
    choices: ['Articles', 'Short videos', 'Audio / podcasts', 'Quizzes & challenges', 'Discussion'],
  },
  {
    key: 'experience_level',
    type: 'single',
    title: 'How familiar are you with these topics?',
    subtitle: null,
    choices: EXPERIENCE_LEVELS,
  },
];

export default function Onboarding() {
  const nav = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);

  // step 0 = identity, 1..N = questions, last = daily goal
  const TOTAL_STEPS = 2 + QUESTIONS.length; // identity + questions + goal
  const [step, setStep] = useState(0);

  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATARS[0]);
  const [answers, setAnswers] = useState({});
  const [dailyGoal, setDailyGoal] = useState(20);
  const [wantsReflection, setWantsReflection] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user || !mounted) { setPrefilling(false); return; }
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_id, motivation, topics, formats, experience_level, daily_goal_minutes, wants_reflection')
          .eq('id', user.id)
          .maybeSingle();
        if (data && mounted) {
          setDisplayName(data.display_name || '');
          setAvatarId(data.avatar_id || AVATARS[0]);
          setAnswers({
            motivation: data.motivation || [],
            topics: data.topics || [],
            formats: data.formats || [],
            experience_level: data.experience_level || null,
          });
          setDailyGoal(data.daily_goal_minutes || 20);
          setWantsReflection(data.wants_reflection ?? true);
        }
      } catch (e) {
        console.warn('onboarding prefill failed', e);
      } finally {
        if (mounted) setPrefilling(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleMulti = (key, val) => {
    const cur = answers[key] || [];
    setAnswers({
      ...answers,
      [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val],
    });
  };

  const selectSingle = (key, val) => setAnswers({ ...answers, [key]: val });

  const isIdentityStep = step === 0;
  const questionIndex = step - 1;
  const isQuestionStep = questionIndex >= 0 && questionIndex < QUESTIONS.length;
  const isGoalStep = step === TOTAL_STEPS - 1;
  const currentQ = isQuestionStep ? QUESTIONS[questionIndex] : null;

  const canAdvance = () => {
    if (isIdentityStep) return displayName.trim().length >= 2;
    if (isQuestionStep) {
      if (currentQ.type === 'multi') return true; // optional
      return !!answers[currentQ.key];
    }
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) {
      if (isIdentityStep) Alert.alert('Almost there', 'Enter a display name (2+ characters) to continue.');
      else Alert.alert('Pick one to continue');
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };

  const goBack = () => { if (step > 0) setStep(step - 1); };

  const finish = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in to finish setup.');
        setSaving(false);
        return;
      }
      const payload = {
        id: user.id,
        display_name: displayName.trim(),
        avatar_id: avatarId,
        motivation: answers.motivation || [],
        topics: answers.topics || [],
        formats: answers.formats || [],
        experience_level: answers.experience_level || null,
        daily_goal_minutes: dailyGoal,
        wants_reflection: wantsReflection,
        onboarding_completed: true,
      };
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) {
        Alert.alert('Save error', error.message || 'Unable to save your setup.');
        setSaving(false);
        return;
      }
      try {
        await supabase.auth.updateUser({
          data: { display_name: payload.display_name, avatar_id: payload.avatar_id },
        });
      } catch (e) { console.warn('auth.updateUser warning', e); }

      try {
        await supabase.from('analytics_events').insert([{
          user_id: user.id, event: 'onboarding_completed', meta: {},
        }]);
      } catch (e) { console.warn('analytics insert failed', e); }

      nav.replace('MainTabs');
    } catch (err) {
      console.error('finish onboarding error', err);
      Alert.alert('Error', 'Unexpected error finishing setup.');
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    Alert.alert('Skip setup?', 'You can finish this anytime from Settings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', style: 'destructive', onPress: () => nav.replace('MainTabs') },
    ]);
  };

  if (prefilling) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={c.gold} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        {isIdentityStep && (
          <View>
            <Text style={styles.ornament}>✦ ·  · ✦</Text>
            <Text style={styles.title}>What should we{'\n'}call you, Scholar?</Text>
            <Text style={styles.subtitle}>Pick a name and a companion for your journey.</Text>

            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor={c.text4}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              maxLength={24}
            />

            <Text style={styles.sectionLabel}>Choose a companion</Text>
            <View style={styles.avatarRow}>
              {AVATARS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.avatarCircle, avatarId === a && styles.avatarCircleActive]}
                  onPress={() => setAvatarId(a)}
                >
                  <Text style={styles.avatarEmoji}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isQuestionStep && (
          <>
            <Text style={styles.title}>{currentQ.title}</Text>
            {currentQ.subtitle && <Text style={styles.subtitle}>{currentQ.subtitle}</Text>}
            <FlatList
              data={currentQ.choices}
              keyExtractor={(item) => (typeof item === 'string' ? item : item.value)}
              ItemSeparatorComponent={() => <View style={{ height: s.sm }} />}
              renderItem={({ item }) => {
                const isObj = typeof item !== 'string';
                const value = isObj ? item.value : item;
                const label = isObj ? item.label : item;
                const selected = currentQ.type === 'multi'
                  ? (answers[currentQ.key] || []).includes(value)
                  : answers[currentQ.key] === value;
                return (
                  <TouchableOpacity
                    style={[styles.choice, selected && styles.choiceSelected]}
                    onPress={() => currentQ.type === 'multi'
                      ? toggleMulti(currentQ.key, value)
                      : selectSingle(currentQ.key, value)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
                      {isObj && item.hint && (
                        <Text style={[styles.choiceHint, selected && styles.choiceHintSelected]}>{item.hint}</Text>
                      )}
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}

        {isGoalStep && (
          <View>
            <Text style={styles.title}>How many minutes a day{'\n'}do you want to spend learning?</Text>
            <Text style={styles.subtitle}>You can change this later in Settings.</Text>
            <View style={styles.goalGrid}>
              {DAILY_GOAL_OPTIONS.map(min => (
                <TouchableOpacity
                  key={min}
                  style={[styles.goalCard, dailyGoal === min && styles.goalCardActive]}
                  onPress={() => setDailyGoal(min)}
                >
                  <Text style={[styles.goalNumber, dailyGoal === min && styles.goalNumberActive]}>{min}</Text>
                  <Text style={[styles.goalUnit, dailyGoal === min && styles.goalNumberActive]}>min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.reflectionRow}
              onPress={() => setWantsReflection(v => !v)}
            >
              <View style={[styles.checkbox, wantsReflection && styles.checkboxActive]}>
                {wantsReflection && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.reflectionText}>Prompt me to reflect on what I learn</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.navRow}>
        {step > 0
          ? <TouchableOpacity style={styles.backBtn} onPress={goBack}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
          : <View />}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} disabled={saving} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextBtnText}>{step === TOTAL_STEPS - 1 ? "Let's go" : 'Continue'}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg0 },
  loadingScreen: { flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: s.xs, paddingTop: s.xxl, paddingBottom: s.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
  dotActive: { backgroundColor: c.gold, width: 20 },

  skipBtn: { position: 'absolute', top: s.xxl + 2, right: s.xl, padding: s.sm },
  skipText: { color: c.text4, fontSize: t.sm },

  body: { flex: 1, paddingHorizontal: s.xl, paddingTop: s.lg },
  ornament: { textAlign: 'center', color: c.gold, fontSize: t.sm, letterSpacing: 6, marginBottom: s.md },
  title: { fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, lineHeight: 30 },
  subtitle: { fontSize: t.sm, color: c.text3, marginBottom: s.xl, lineHeight: 20 },

  input: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, marginBottom: s.xl, fontSize: t.md,
    color: c.text1, backgroundColor: c.inputBg,
  },
  sectionLabel: { fontSize: t.sm, fontWeight: t.semibold, color: c.text3, marginBottom: s.md },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s.md },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.bg1, borderWidth: 1.5, borderColor: c.border,
  },
  avatarCircleActive: { borderColor: c.gold, backgroundColor: c.inputBg },
  avatarEmoji: { fontSize: 26 },

  choice: {
    flexDirection: 'row', alignItems: 'center',
    padding: s.md, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1,
  },
  choiceSelected: { backgroundColor: c.goldMid, borderColor: c.goldMid },
  choiceText: { fontSize: t.md, color: c.text1, fontWeight: t.semibold },
  choiceTextSelected: { color: '#fff' },
  choiceHint: { fontSize: t.xs, color: c.text4, marginTop: 2 },
  choiceHintSelected: { color: '#fff', opacity: 0.85 },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: s.md, marginBottom: s.xl },
  goalCard: {
    width: 76, height: 76, borderRadius: r.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: c.border, backgroundColor: c.bg1,
  },
  goalCardActive: { borderColor: c.gold, backgroundColor: c.inputBg },
  goalNumber: { fontSize: t.xl, fontWeight: t.bold, color: c.text1 },
  goalNumberActive: { color: c.gold },
  goalUnit: { fontSize: t.xs, color: c.text4, marginTop: 2 },

  reflectionRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg1,
  },
  checkboxActive: { backgroundColor: c.goldMid, borderColor: c.goldMid },
  reflectionText: { fontSize: t.sm, color: c.text2 || c.text3, flex: 1 },

  navRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: s.xl, borderTopWidth: 0.5, borderTopColor: c.border,
  },
  backBtn: { paddingVertical: s.md, paddingHorizontal: s.lg },
  backBtnText: { fontSize: t.md, color: c.text3, fontWeight: t.semibold },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.goldMid, borderRadius: r.md,
    paddingVertical: s.md, paddingHorizontal: s.xl, minWidth: 130,
  },
  nextBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
});
