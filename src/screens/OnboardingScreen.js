// src/screens/OnboardingScreen.js
//
// Replaces MultiStepOnboarding.js and ProfileQuickSetup.js.
// One streamlined flow, one profile schema, themed to match Login/Profile/Settings.
//
// Runs an age gate + parental consent in front of everything else — this
// app's users are K-12, so a real share of them are minors under COPPA
// (US, default 13) or a country's GDPR Article 8 age (see
// src/logic/ageOfConsent.js). That has to happen BEFORE we ask for a
// display name or anything else, not after, since COPPA requires consent
// before collecting personal info from a known child. See
// src/api/kwsVerification.js and supabase/functions/kws-verify +
// kws-webhook for the Kids Web Services integration this drives.
//
// Final columns written to `profiles`:
//   date_of_birth, country_code, is_minor, parent_email, kws_pv_status,
//   kws_verified_at, parent_consent_given, parent_consent_at,
//   display_name, avatar_id, motivation[], topics[], formats[],
//   experience_level, daily_goal_minutes, wants_reflection, onboarding_completed

import React, { useState, useEffect, useRef } from 'react';
import { PRIVACY_POLICY_URL } from '../config/legal';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Linking,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { isMinorRequiringConsent } from '../logic/ageOfConsent';
import { startParentVerification, getVerificationStatus } from '../api/kwsVerification';

const AVATARS = ['📚', '🦉', '🦊', '🐱', '🤖', '🌱'];

const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     hint: "I'm just getting started" },
  { value: 'intermediate', label: 'Intermediate', hint: 'I know the basics' },
  { value: 'advanced',     label: 'Advanced',     hint: 'I want to go deep' },
];

const DAILY_GOAL_OPTIONS = [10, 20, 30, 45, 60];

// Countries with local privacy law shown as quick picks; "Other" falls
// back to the DEFAULT_AODC (13) in src/logic/ageOfConsent.js. Add more
// here if your user base skews toward a country not listed.
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

// Re-checks status every 20s while the "waiting on your parent" screen is
// up, so most people never have to tap "Check again" themselves.
const POLL_INTERVAL_MS = 20000;

export default function Onboarding() {
  const nav = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);

  // ── Age gate + parental consent (runs before the rest of onboarding) ──
  // 'age_gate' -> 'parent_email' -> 'waiting_parent' -> 'consent' -> 'main'
  // A non-minor (or a minor who already has parent_consent_given) skips
  // straight to 'main'. Re-entering onboarding mid-flow (app closed while
  // waiting on a parent, say) resumes wherever the profile says it left off.
  const [phase, setPhase] = useState('age_gate');
  const [userId, setUserId] = useState(null);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [parentEmail, setParentEmail] = useState('');
  const [gateBusy, setGateBusy] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const pollRef = useRef(null);

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
        setUserId(user.id);
        const { data } = await supabase
          .from('profiles')
          .select(`display_name, avatar_id, motivation, topics, formats, experience_level,
            daily_goal_minutes, wants_reflection, date_of_birth, country_code, is_minor,
            parent_email, kws_pv_status, parent_consent_given`)
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

          if (data.parent_email) setParentEmail(data.parent_email);
          if (data.country_code) setCountryCode(data.country_code);
          if (data.date_of_birth) {
            const [y, m, d] = data.date_of_birth.split('-');
            setBirthYear(y); setBirthMonth(m); setBirthDay(d);
          }

          if (!data.date_of_birth) {
            setPhase('age_gate');
          } else if (!data.is_minor || data.parent_consent_given) {
            setPhase('main');
          } else if (data.kws_pv_status === 'verified') {
            setPhase('consent');
          } else if (data.kws_pv_status === 'pending') {
            setPhase('waiting_parent');
          } else {
            setPhase('parent_email');
          }
        }
      } catch (e) {
        console.warn('onboarding prefill failed', e);
      } finally {
        if (mounted) setPrefilling(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'waiting_parent') {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(() => { checkParentStatus(); }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const toggleMulti = (key, val) => {
    const cur = answers[key] || [];
    setAnswers({
      ...answers,
      [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val],
    });
  };

  const selectSingle = (key, val) => setAnswers({ ...answers, [key]: val });

  // ── Age gate handlers ──────────────────────────────────────────────
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
        id: userId,
        date_of_birth: dateOfBirth,
        country_code: countryCode,
        is_minor: isMinor,
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
      const data = await getVerificationStatus(userId);
      if (data?.kws_pv_status === 'verified') setPhase('consent');
      else if (data?.kws_pv_status === 'failed') {
        Alert.alert(
          'Verification didn’t go through',
          'Your parent’s verification failed or was declined. You can try sending the request again.',
        );
        setPhase('parent_email');
      }
    } catch (e) {
      console.warn('checkParentStatus failed', e);
    }
  };

  const submitConsent = async () => {
    if (!consentChecked) {
      Alert.alert('One more thing', 'Please check the box to confirm you and your parent or guardian have reviewed this together.');
      return;
    }
    setGateBusy(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        parent_consent_given: true,
        parent_consent_at: new Date().toISOString(),
      });
      if (error) throw error;
      setPhase('main');
    } catch (e) {
      Alert.alert('Save error', e.message || 'Could not save consent.');
    } finally {
      setGateBusy(false);
    }
  };

  // ── Main flow (unchanged from here down, aside from the phase guard) ──
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

  // ── Age gate / parent verification / consent screens ──────────────
  if (phase === 'age_gate') {
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <Text style={styles.ornament}>✦ ·  · ✦</Text>
          <Text style={styles.title}>First, when's{'\n'}your birthday?</Text>
          <Text style={styles.subtitle}>We ask everyone this — it's how we know whether to bring a parent or guardian into the loop.</Text>

          <View style={styles.dobRow}>
            <TextInput
              style={[styles.input, styles.dobInput]}
              placeholder="MM" placeholderTextColor={c.text4}
              value={birthMonth} onChangeText={setBirthMonth}
              keyboardType="number-pad" maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.dobInput]}
              placeholder="DD" placeholderTextColor={c.text4}
              value={birthDay} onChangeText={setBirthDay}
              keyboardType="number-pad" maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.dobInputYear]}
              placeholder="YYYY" placeholderTextColor={c.text4}
              value={birthYear} onChangeText={setBirthYear}
              keyboardType="number-pad" maxLength={4}
            />
          </View>

          <Text style={styles.sectionLabel}>Where do you live?</Text>
          <FlatList
            data={COUNTRY_CHOICES}
            keyExtractor={(item) => item.value}
            ItemSeparatorComponent={() => <View style={{ height: s.sm }} />}
            renderItem={({ item }) => {
              const selected = countryCode === item.value;
              return (
                <TouchableOpacity
                  style={[styles.choice, selected && styles.choiceSelected]}
                  onPress={() => setCountryCode(item.value)}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{item.label}</Text>
                  {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
        <View style={styles.navRow}>
          <View />
          <TouchableOpacity style={styles.nextBtn} onPress={submitBirthDate} disabled={gateBusy} activeOpacity={0.85}>
            {gateBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (phase === 'parent_email') {
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <Text style={styles.ornament}>✦ ·  · ✦</Text>
          <Text style={styles.title}>Let's bring in a{'\n'}parent or guardian</Text>
          <Text style={styles.subtitle}>
            Because of your age, we need a parent or guardian to confirm before you can finish setting up your account.
            We'll email them a quick verification link.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Parent or guardian's email"
            placeholderTextColor={c.text4}
            value={parentEmail}
            onChangeText={setParentEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('age_gate')}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={submitParentEmail} disabled={gateBusy} activeOpacity={0.85}>
            {gateBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Send verification</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (phase === 'waiting_parent') {
    return (
      <View style={styles.screen}>
        <View style={[styles.body, styles.centerBody]}>
          <Text style={styles.ornament}>✦ ·  · ✦</Text>
          <Text style={styles.title}>Waiting on your{'\n'}parent or guardian</Text>
          <Text style={styles.subtitle}>
            We sent a verification email to {parentEmail || 'your parent or guardian'}. Once they confirm, you can keep going —
            this screen updates on its own, or tap below to check now.
          </Text>
          <TouchableOpacity style={styles.nextBtn} onPress={checkParentStatus} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Check again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: s.lg }} onPress={() => setPhase('parent_email')}>
            <Text style={styles.backBtnText}>Sent to the wrong email? Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'consent') {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Text style={styles.ornament}>✦ ·  · ✦</Text>
          <Text style={styles.title}>Almost there</Text>
          <Text style={styles.subtitle}>
            Your parent or guardian has been verified. Please review this together before continuing.
          </Text>
          <Text style={styles.consentBody}>
            To set up your account we'll store: a display name and avatar you choose (not your real name unless you use it),
            your grade-level and topic preferences, and your progress and streaks in the app. We don't require your real name,
            address, or photo. You can see or delete this info anytime from Settings.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.linkText}>Read the full privacy policy ↗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reflectionRow} onPress={() => setConsentChecked(v => !v)}>
            <View style={[styles.checkbox, consentChecked && styles.checkboxActive]}>
              {consentChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.reflectionText}>
              A parent or guardian and I have reviewed this together and agree to continue.
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.navRow}>
          <View />
          <TouchableOpacity style={styles.nextBtn} onPress={submitConsent} disabled={gateBusy} activeOpacity={0.85}>
            {gateBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Continue</Text>}
          </TouchableOpacity>
        </View>
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

  body: { flex: 1, paddingHorizontal: s.xl, paddingTop: s.xxl + s.lg },
  centerBody: { justifyContent: 'center' },
  ornament: { textAlign: 'center', color: c.gold, fontSize: t.sm, letterSpacing: 6, marginBottom: s.md },
  title: { fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, lineHeight: 30 },
  subtitle: { fontSize: t.sm, color: c.text3, marginBottom: s.xl, lineHeight: 20 },

  input: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, marginBottom: s.xl, fontSize: t.md,
    color: c.text1, backgroundColor: c.inputBg,
  },
  dobRow: { flexDirection: 'row', gap: s.md },
  dobInput: { flex: 1, textAlign: 'center' },
  dobInputYear: { flex: 1.4, textAlign: 'center' },

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

  consentBody: { fontSize: t.sm, color: c.text2 || c.text3, lineHeight: 20, marginBottom: s.md },
  linkText: { fontSize: t.sm, color: c.gold, marginBottom: s.xl, textDecorationLine: 'underline' },

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
