// src/screens/MultiStepOnboarding.js
//
// The REQUIRED part of onboarding, and nothing else.
//
// It used to be eight steps and roughly twenty questions, all held in one
// useState object and written in a single upsert at the very end — so
// quitting at step six lost the lot, and the first thing anyone saw after
// finishing was a twelve-step tour. What's left here is the two answers
// that have to exist before the app can render honestly:
//
//   1. Persona  — decides the default widgets on Home, the quest line, the
//                 curriculum track, and which life areas step 2 pre-selects.
//   2. Sectors  — exactly what the Library tab's life-area grid shows.
//
// The persona step also asks how much of the app to start with. Starting
// simple (the default) means Home opens on one first goal picked for the
// type, with a handful of tools and six games; more opens as goals get
// finished — see src/data/experienceStages.js. finish() starts that goal,
// so nobody lands on Home without one thing to do.
//
// Everything else (character, planner starters, interests, goals, theme
// and layout) moved to the Getting Started card on Home, where the user
// can see what each answer changes as they make it. Same components, same
// columns — see src/logic/onboardingTasks.js and
// src/screens/onboarding/steps.js.
//
// In front of both steps is the age gate, unchanged: this app's users are
// K-12, so a real share are minors under COPPA (US, default 13) or a
// country's GDPR Article 8 age. Consent has to be collected before we ask
// for anything personal, not after — see src/logic/ageOfConsent.js and
// src/api/kwsVerification.js.

import React, { useState, useRef, useEffect } from 'react';
import { PRIVACY_POLICY_URL } from '../config/legal';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Animated, Dimensions, StyleSheet, Linking,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { FONTS } from '../theme';
import { supabase } from '../api/supabaseClient';
import { generateRecommendations } from '../api/recommendationEngine';
import { setWayfinderIntent } from '../api/wayfinderService';
import {
  saveOnboardingFields, loadOnboardingDraft, saveOnboardingDraft, clearOnboardingDraft,
} from '../api/onboardingService';
import { LIFE_AREAS } from './library/LifeAreaScreen';
import { isMinorRequiringConsent } from '../logic/ageOfConsent';
import { startParentVerification, getVerificationStatus } from '../api/kwsVerification';
import { DEFAULT_PERSONA, personasFor, defaultPersonaFor, getPersona } from '../data/personas';
import { ageCategoryFromDob, isMinorBand } from '../logic/profileResolver';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { useAccess } from '../../context/AccessContext';
import { useFeatureFlag, useRemoteConfig } from '../../context/RemoteConfigContext';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import {
  PersonaStep, SectorsStep, LookStep, PERSONA_AREA_DEFAULTS, pickFocusHub, buildRecommendations,
} from './onboarding/steps';

const { width: SW } = Dimensions.get('window');

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

// ─── Main Onboarding ──────────────────────────────────────────────────────────
// Three, and the bar for a fourth is high: either the app can't render
// honestly without the answer, or it's part of setting the place up to look
// how you want. Anything else belongs in SETUP_TASKS, answered later from
// Home where its effect is visible.
//
// Navigation is deliberately NOT a step here. It's taught by the Home
// screen's own tutorial firing the moment you land, spotlighting the real
// tab bar — see src/logic/useFirstVisitTutorial.js. A card describing UI the
// user can't see yet teaches nobody.
const STEPS = [
  { component: PersonaStep, title: 'Profile', subtitle: 'Your account type' },
  { component: SectorsStep, title: 'Sectors', subtitle: 'Your focus areas' },
  { component: LookStep,    title: 'Look',    subtitle: 'How it looks' },
];

export default function MultiStepOnboarding() {
  const navigation = useNavigation();
  const themeCtx = useTheme(); // raw ThemeContext value — {colors, spacing, radius, ...}
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh, isDark, setTheme } = themeCtx;
  // Shorthand bundle every Step component / helper below expects
  // ({c, t, s, r, sh, isDark}) — not the same shape as the raw context
  // value above, which uses the full property names.
  const theme = { c, t, s, r, sh, isDark };
  // setPersonalization only — the tour is tailored here but no longer
  // started here. Landing straight in a twelve-step tour on top of a form
  // was two walkthroughs back to back; it's offered from the Getting
  // Started card on Home instead (and from Settings, as it always was).
  const { setPersonalization } = useTour();
  const { createMasterProfile } = useProfiles();
  const { setExperienceMode, startFirstGoal } = useAccess();
  const { refreshProfile } = useUserProgress();
  // Written by the Look step. Device-local, same key Settings' own "Library
  // Sections" editor reads and writes.
  const [, setHiddenSections] = useSetting(SETTING_KEYS.HIDDEN_LIBRARY_SECTIONS, []);

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [userId,  setUserId]  = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [direction, setDir]   = useState(1); // 1=forward, -1=back

  // ── Age gate + parental consent — runs before the steps (see below). This
  // app's users are K-12, so a real share are minors under COPPA (US,
  // default 13) or a country's GDPR Article 8 age — see
  // src/logic/ageOfConsent.js. 'age_gate' -> 'parent_email' ->
  // 'waiting_parent' -> 'consent' -> 'main'. A non-minor (or a minor who
  // already has parent_consent_given) skips straight to 'main'.
  const [phase, setPhase] = useState('age_gate');
  // v1 is for 13 and up (kids are v2). Anyone who'd need a parent's consent
  // gets 'kids_closed' instead of the KWS flow above — until an app_config row
  // `kids_accounts` is switched on, which turns the parent flow back on
  // without a new build. No row, or config not loaded yet, means off.
  const kidsAccountsEnabled = useFeatureFlag('kids_accounts', false);
  // useFeatureFlag can't tell "the row says off" from "the fetch hasn't
  // landed yet" — both read false. That difference matters here, because
  // the kids_closed screen's one button deletes the account, so it must
  // never be shown on a guess. Until the config is in, a minor gets the
  // parent flow; being shown that a moment too long costs nothing.
  const { ready: configReady } = useRemoteConfig();
  const kidsClosed = configReady && !kidsAccountsEnabled;
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [parentEmail, setParentEmail] = useState('');
  const [gateBusy, setGateBusy] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  // The age band, from the birth date — decides which personas PersonaStep
  // offers. Not profiles.is_minor: that's the digital-consent flag (under 13
  // in the US) and only routes the parent-consent phases below. A 15-year-old
  // is past the consent age and is still a minor. Set from the profile
  // prefill and from submitBirthDate, the same two places `phase` is decided.
  const [ageBand, setAgeBand] = useState(null);
  const personaCtx = { isMinor: isMinorBand(ageBand), ageBand };
  const pollRef = useRef(null);

  // Only what the two required steps ask. Everything the old eight-step
  // version carried around — crest, planner picks, topics, formats, goal,
  // daily minutes, theme — is seeded from the profile by each deferred
  // task instead (src/logic/onboardingTasks.js).
  const [data, setData] = useState({
    active_persona:    DEFAULT_PERSONA,
    // "I'm not sure yet" on the persona step. Not a column — it rides in the
    // local draft and lands as the Wayfinder intent flag in finish().
    exploring:         false,
    // 'auto' = start simple and grow; 'full' = show everything now. Not a
    // column — device-local via AccessContext, like the Wayfinder intent.
    experience_mode:   'auto',
    persona_baseline:  {},
    display_name:      '',
    active_life_areas: PERSONA_AREA_DEFAULTS[DEFAULT_PERSONA],
    areas_touched:     false,
    theme:             'dark',
    hidden_sections:   [],
  });
  // The exact date the age gate stored, kept so finish() can derive
  // age_category from it rather than asking a second, vaguer version of
  // the same question. Set by the prefill effect and by submitBirthDate.
  const dobRef = useRef(null);
  // Set by `set()` below. The draft restore is async, so without this a
  // user quick enough to tap a persona before AsyncStorage comes back would
  // have their pick overwritten by the stored one.
  const userTouched = useRef(false);
  // True once a persona was actually chosen — tapped, or restored from the
  // draft. Until then the persona is just the initial placeholder, and a
  // minor's gets swapped for Student when the birth date comes in.
  const personaChosen = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('date_of_birth, country_code, is_minor, parent_email, kws_pv_status, parent_consent_given, display_name, active_life_areas')
          .eq('id', user.id)
          .maybeSingle();

        // Whatever the two steps already wrote on a previous attempt —
        // paired with the AsyncStorage draft below, this is what makes
        // quitting mid-flow resume instead of restart.
        if (profile?.display_name || profile?.active_life_areas?.length) {
          setData(prev => ({
            ...prev,
            display_name:      profile.display_name || prev.display_name,
            active_life_areas: profile.active_life_areas?.length ? profile.active_life_areas : prev.active_life_areas,
            areas_touched:     !!profile.active_life_areas?.length,
          }));
        }

        if (!profile) return; // brand new — starts at the default 'age_gate' phase

        if (profile.parent_email) setParentEmail(profile.parent_email);
        if (profile.country_code) setCountryCode(profile.country_code);
        if (profile.date_of_birth) {
          dobRef.current = profile.date_of_birth;
          setAgeBand(ageCategoryFromDob(profile.date_of_birth));
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

  // The other half of resume: the step index and the persona pick, neither
  // of which has a `profiles` column to live in (profiles.active_persona is
  // in a migration but not on the live table; the persona's real home is
  // the persona_profiles row, which isn't created until finish()).
  useEffect(() => {
    loadOnboardingDraft().then(draft => {
      if (!draft || userTouched.current) return;
      if (draft.active_persona) personaChosen.current = true;
      setData(prev => ({
        ...prev,
        active_persona:   draft.active_persona || prev.active_persona,
        exploring:        typeof draft.exploring === 'boolean' ? draft.exploring : prev.exploring,
        experience_mode:  draft.experience_mode === 'full' ? 'full' : prev.experience_mode,
        persona_baseline: draft.persona_baseline || prev.persona_baseline,
        theme:            draft.theme || prev.theme,
        hidden_sections:  draft.hidden_sections || prev.hidden_sections,
      }));
      if (typeof draft.step === 'number') {
        setStep(Math.min(Math.max(draft.step, 0), STEPS.length - 1));
      }
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
    setAgeBand(ageCategoryFromDob(dateOfBirth));
    dobRef.current = dateOfBirth;

    setGateBusy(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId, date_of_birth: dateOfBirth, country_code: countryCode, is_minor: isMinor,
      });
      if (error) throw error;
      setPhase(isMinor ? (kidsClosed ? 'kids_closed' : 'parent_email') : 'main');
    } catch (e) {
      Alert.alert('Save error', e.message || 'Could not save your birth date.');
    } finally {
      setGateBusy(false);
    }
  };

  // The resume effect above picks a parent-flow phase from the profile
  // without knowing the flag (it runs once, before remote config may have
  // loaded). This keeps whatever phase we're in consistent with it.
  useEffect(() => {
    const parentFlow = ['parent_email', 'waiting_parent', 'consent'];
    if (kidsClosed && parentFlow.includes(phase)) setPhase('kids_closed');
    else if (!kidsClosed && phase === 'kids_closed') setPhase('parent_email');
  }, [kidsClosed, phase]);

  // Under the consent age with kids' accounts off: nothing of theirs should
  // stay behind, so closing deletes the account (email and birth date
  // included) rather than just signing out.
  const closeKidAccount = async () => {
    setGateBusy(true);
    let deleted = false;
    try {
      const { error } = await supabase.rpc('delete_my_account');
      deleted = !error;
      if (error) console.warn('close under-age account', error);
    } catch (e) { console.warn('close under-age account', e); }
    clearOnboardingDraft();
    await supabase.auth.signOut();
    setGateBusy(false);
    if (!deleted) {
      Alert.alert(
        "We couldn't finish closing it",
        'You are signed out. A parent or guardian can email help@chilltechhub.com and we will delete the account.',
      );
    }
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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

  // Once the birth date is known: a persona this account can't have falls
  // back to the one it should start on (Student for anyone under 18 — this
  // used to fall back to Personal), and an untouched placeholder is swapped
  // for that same default. The Sectors step follows along unless edited.
  useEffect(() => {
    if (!ageBand) return;
    const allowed = personasFor(personaCtx).map(p => p.key);
    const want = defaultPersonaFor(personaCtx);
    const keep = allowed.includes(data.active_persona)
      && (personaChosen.current || data.active_persona === want);
    if (keep) return;
    setData(prev => ({
      ...prev,
      active_persona: want,
      active_life_areas: prev.areas_touched ? prev.active_life_areas : (PERSONA_AREA_DEFAULTS[want] || prev.active_life_areas),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageBand, data.active_persona]);

  const set = (key, value) => {
    userTouched.current = true;
    if (key === 'active_persona') personaChosen.current = true;
    setData(prev => ({ ...prev, [key]: value }));
  };

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

  // Checkpoint on every advance. The columns go to `profiles`, the rest to
  // the local draft; both are best-effort and neither blocks the
  // transition, because a slow network is not a reason to make someone
  // stare at a spinner between two questions. Anything that fails here is
  // written again by finish(), which does block.
  const checkpoint = (nextStep) => {
    saveOnboardingDraft({
      step: nextStep,
      active_persona: data.active_persona,
      exploring: !!data.exploring,
      experience_mode: data.experience_mode,
      persona_baseline: data.persona_baseline,
      theme: data.theme,
      hidden_sections: data.hidden_sections,
    });
    saveOnboardingFields(userId, {
      display_name:      data.display_name || null,
      active_life_areas: data.active_life_areas,
    }).catch(e => console.warn('onboarding checkpoint', e?.message));
  };

  const goNext = () => {
    if (advancing.current) return;
    if (step >= STEPS.length - 1) { finish(); return; }
    advancing.current = true;
    setDir(1);
    checkpoint(step + 1);
    animateSlide(1, () => setStep(s2 => Math.min(s2 + 1, STEPS.length - 1)));
  };

  const goBack = () => {
    if (advancing.current) return;
    if (step === 0) return;
    advancing.current = true;
    setDir(-1);
    animateSlide(-1, () => setStep(s2 => Math.max(s2 - 1, 0)));
  };

  // Real escape hatch, not a per-step "next" in disguise. The old Skip
  // just called goNext(), so the only way out of eight steps was eight
  // taps. Both remaining steps have a working default (the persona
  // defaults to PERSONAL, sectors to that persona's three areas), so
  // leaving early gives you a configured app rather than an empty one.
  const skip = () => finish();

  const finish = async () => {
    setSaving(true);

    // ── The one write that has to succeed ────────────────────────────────
    // Everything after this point is recoverable or repeatable; this isn't.
    // Note what's NOT here any more: the master profile, the planner
    // subscriptions, the recommendation pass. Those used to sit inside the
    // same try, after `onboarding_completed: true` had already been
    // written — so any one of them throwing showed "Could not save your
    // setup. Try again." and never navigated, stranding the user on a
    // wizard whose work was in fact already saved.
    try {
      if (!userId) throw new Error('No user');

      // Every area NOT picked. The Library grid reads this back.
      const hidden = LIFE_AREAS
        .map(a => a.id)
        .filter(id => !(data.active_life_areas || []).includes(id));

      await saveOnboardingFields(userId, {
        display_name:      data.display_name || null,
        traveler_name:     data.display_name || null,
        // Derived from the date the age gate already took, rather than
        // asked again as a five-way "where are you at in life?" radio.
        // recommendationEngine.scoreItem() reads this column.
        age_category:      ageCategoryFromDob(dobRef.current),
        active_life_areas: data.active_life_areas,
        hidden_life_areas: hidden,
        theme:             data.theme,
        onboarding_completed: true,
      });
    } catch (e) {
      console.warn('onboarding finish', e);
      Alert.alert('Error', 'Could not save your setup. Try again.');
      setSaving(false);
      return;
    }

    // Local and can't throw — and Home reads it when it first lays out the
    // dashboard, so it has to be down before Home mounts.
    await setWayfinderIntent(!!data.exploring);
    // Same reason: Home, the Library and Training all read the stage on
    // their first render.
    await setExperienceMode(data.experience_mode);

    // ── Out of the wizard, immediately ───────────────────────────────────
    // Saved is saved. Nothing below is worth holding someone on this
    // screen for, and nothing below can strand them if it fails.
    navigation.replace('MainTabs');

    // ── Best-effort, each isolated ───────────────────────────────────────
    // The master profile: the one this account manages the rest from, and
    // the one every fallback resolves to. Its type drives the default
    // widgets, quest line and curriculum track. Non-fatal on failure —
    // ProfileAccountsContext treats "no profiles yet" as an empty state,
    // and the switcher just doesn't render until one exists.
    try {
      await createMasterProfile({
        type: data.active_persona || DEFAULT_PERSONA,
        // No name: createProfile() falls back to the persona's short label
        // ("Personal", "Student"...), and it's renameable in the switcher.
        baseline: data.persona_baseline || {},
      });
    } catch (e) {
      // Still non-fatal — the user is already on Home and the rest of their
      // setup is saved. But this is NOT a silent failure any more: if it
      // fails, the account type is not what they just picked, and the whole
      // app (dashboard, Academy subjects, quest line) keys off that. Being
      // quiet here is exactly how "I picked Student and got Personal" went
      // unnoticed.
      console.warn('onboarding master profile', e?.message);
      Alert.alert(
        'Account type not saved',
        `We couldn't set your account type to ${getPersona(data.active_persona || DEFAULT_PERSONA).short}. `
        + 'Everything else saved fine. You can set it from the profile switcher at the top of the screen.',
      );
    }

    // The first goal, for anyone starting simple — Home's Compass card
    // would offer it anyway, but landing with it already running means the
    // first thing on screen is a next step rather than a Start button.
    // Someone who asked for everything gets the ordinary Compass instead.
    if (data.experience_mode !== 'full') {
      try { await startFirstGoal(data.active_persona || DEFAULT_PERSONA); }
      catch (e) { console.warn('onboarding first goal', e?.message); }
    }

    // UserProgressContext loaded `profile` once at login and has no reason
    // to know the upsert above happened — without this, Home's character
    // card keeps showing the signup-time placeholder until something else
    // forces a reload.
    try { await refreshProfile(); } catch (e) { console.warn('onboarding refreshProfile', e?.message); }

    // Library section visibility from the Look step — device-local, so it
    // never rides along with the profile upsert above.
    try { await setHiddenSections(data.hidden_sections || []); }
    catch (e) { console.warn('onboarding hidden sections', e?.message); }

    // Tailor the tour to what was just picked, so it's already
    // personalized whenever the user chooses to start it from Home or
    // Settings. buildRecommendations needs usage_patterns, which is now a
    // deferred question — it returns [] here and the Getting Started card
    // re-runs this once the Goals task is done.
    try {
      const areaLabels = LIFE_AREAS
        .filter(a => (data.active_life_areas || []).includes(a.id))
        .map(a => a.label);
      setPersonalization({
        areaLabels,
        focusHub: pickFocusHub(data),
        recommendations: buildRecommendations(data),
      });
    } catch (e) { console.warn('onboarding personalization', e?.message); }

    try {
      await generateRecommendations(userId, {
        active_life_areas: data.active_life_areas,
        age_category: ageCategoryFromDob(dobRef.current),
      });
    } catch (e) { console.warn('onboarding recommendations', e?.message); }

    clearOnboardingDraft();
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
            <Text style={gs.subtitle}>We ask everyone this. It decides which parts of the app fit your age.</Text>
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

  if (phase === 'kids_closed') {
    return (
      <View style={cs.bg}>
        <View style={[gs.body, { flex: 1, justifyContent: 'center' }]}>
          <Text style={gs.title}>We can't set up{'\n'}your account yet</Text>
          <Text style={gs.subtitle}>
            Where you live, someone your age needs a parent or guardian's OK to use an app like this.
            We're still building that, so for now we can't keep an account for you.
          </Text>
          <Text style={gs.consentBody}>
            Closing it deletes everything, including your email and birthday. You're welcome back once parent sign-up is ready.
          </Text>
          <TouchableOpacity onPress={closeKidAccount} disabled={gateBusy} style={cs.nextBtn}>
            {gateBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cs.nextBtnText}>Close my account</Text>}
          </TouchableOpacity>
        </View>
      </View>
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
            <Text style={cs.skipText}>Skip for now</Text>
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
            <StepComponent data={data} set={set} theme={theme} isMinor={personaCtx.isMinor} ageBand={ageBand} onThemeChange={setTheme} />
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
