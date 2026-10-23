// src/screens/welcome/WelcomeScreen.js
// The welcome before login: the founder's Descartes onboarding, exactly as
// they laid it out (their Gemini thread + descartes_onboarding_portfolio_builder.html),
// in the app's own theme, light or dark.
//
//   1  "It is not enough to have a good mind; the main thing is to use it
//      well." Soft fade-in, one line at a time. Tap anywhere.
//   2  "Conquer yourself rather than the world." fades in, then "What
//      brings you here today?" (pick any; a pick unlocks Next)
//   3  "What stage of life are you at right now?" (one)
//   4  "Pick your skills & interests" (any; they fill the portfolio's badges)
//   5  "Recommended Project", or one of the others (one per site the
//      founder built), then the live builder (WelcomeBuild.js)
//   then keep it: an account, or keep going as a guest. After that, a
//   quick look around the app ending on the first mission
//   (src/logic/useWelcomeTour.js).
//
// Skips throughout: Skip on every card, "Fast track to my project" on the
// first four, "Start over" any time, all choices kept going back and forth.
//
// No age question: age is asked only at signup, where the birth-date gate
// and parent consent already are. Nothing leaves the phone: answers go to
// src/api/welcomeStore.js and the project to the guest's Builds. Which card
// needs what before Next works: src/logic/welcomeCards.js.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, Platform, Animated, Easing, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import { Button } from '../../components/ui';
import RichText from '../../components/RichText';
import { loadWelcome, saveWelcome } from '../../api/welcomeStore';
import { WELCOME_CARDS, WELCOME_STEPS, canLeave, resumeAt, togglePick } from '../../logic/welcomeCards';
import { welcomePlan } from '../../logic/tailoring';
import { START_POINTS, PATH_KITS, WELCOME_GOALS, WELCOME_STAGES, WELCOME_INTERESTS, WELCOME_PROJECTS } from '../../data/pathKits';
import { BUILD_KIND_MAP } from '../../data/builds';
import { writeSetting, SETTING_KEYS } from '../../logic/useSetting';
import { markScreensSeen } from '../../logic/useFirstVisitTutorial';
import { queueWelcomeTour } from '../../logic/useWelcomeTour';
import { glow } from '../../theme';
import WelcomeBuild from './WelcomeBuild';

// Public domain (Discourse on the Method, 1637).
const QUOTE_LINES = ['“It is not enough to have a good mind;', 'the main thing is to use it well.”'];
const QUOTE_CONQUER = '“Conquer yourself rather than the world.”';
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });
const NATIVE_DRIVER = Platform.OS !== 'web';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const FAST_TRACK = new Set(['quote', 'why', 'stage', 'interests']);
const SKIP_TO = { project: 'keep', build: 'keep' };
const PROJECT_OF = Object.fromEntries(WELCOME_PROJECTS.map(p => [p.kind, p]));
const STAGES = WELCOME_STAGES.map(k => START_POINTS.find(p => p.key === k)).filter(Boolean);
const EMPTY_ANSWERS = { goals: [], startPoint: null, interests: [], projectKind: null, pathKey: null };

// Fades in (and drifts up) after `delay`, once. The founder's line-fade.
function FadeIn({ delay = 0, duration = 1200, rise = 12, style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [v, delay, duration]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// "Tap anywhere": a slow breath, after the quote has landed.
function Breathe({ children, delay = 2600 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1000, delay, useNativeDriver: NATIVE_DRIVER }),
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 0.45, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(v, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
      ])),
    ]);
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

// The founder's ambient glow, in the accent: two soft pools of light behind
// everything, so the page has depth instead of a flat fill.
function AmbientGlow({ color, warm, isDark }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="38%" rx="70%" ry="45%" fx="50%" fy="38%">
            <Stop offset="0" stopColor={color} stopOpacity={isDark ? 0.16 : 0.13} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g2" cx="100%" cy="100%" rx="60%" ry="40%" fx="100%" fy="100%">
            <Stop offset="0" stopColor={warm} stopOpacity={isDark ? 0.1 : 0.14} />
            <Stop offset="1" stopColor={warm} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#g1)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#g2)" />
      </Svg>
    </View>
  );
}

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent, shadows, isDark } = useTheme();
  const { startFirstGoal } = useAccess();
  const [answers, setAnswers] = useState(null);
  const latest = useRef(null);
  const [card, setCard] = useState(0);
  const [showPaths, setShowPaths] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    loadWelcome().then(w => { latest.current = w; setAnswers(w); setCard(resumeAt(w)); });
  }, []);

  // A patch, or a function of the latest answers that returns one, so two
  // quick taps never lose one another.
  const answer = (patch) => {
    const p = typeof patch === 'function' ? patch(latest.current) : patch;
    latest.current = { ...latest.current, ...p };
    setAnswers(latest.current);
    saveWelcome(p).catch(e => console.warn('welcome save', e?.message));
  };
  const key = WELCOME_CARDS[card];
  useEffect(() => {
    if (answers && answers.at !== key) answer({ at: key });
  }, [key, !!answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cards cross-fade, like the founder's 300ms step transition.
  const goTo = (k) => {
    setShowPaths(false);
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: NATIVE_DRIVER }).start(() => {
      setCard(Math.max(0, WELCOME_CARDS.indexOf(k)));
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
      Animated.timing(fade, { toValue: 1, duration: 320, easing: EASE, useNativeDriver: NATIVE_DRIVER }).start();
    });
  };
  const next = () => goTo(WELCOME_CARDS[Math.min(card + 1, WELCOME_CARDS.length - 1)]);
  const back = () => goTo(WELCOME_CARDS[Math.max(card - 1, 0)]);
  const skip = () => goTo(SKIP_TO[key] || WELCOME_CARDS[Math.min(card + 1, WELCOME_CARDS.length - 1)]);
  const startOver = () => { answer({ ...EMPTY_ANSWERS }); goTo('quote'); };
  const plan = useMemo(() => (answers ? welcomePlan(answers) : null), [answers]);
  const launch = (kind) => { answer({ projectKind: kind, pathKey: plan.pathKey }); goTo('build'); };

  const haveAccount = () => navigation.navigate('Login', { mode: 'login' });
  const createAccount = async () => {
    await saveWelcome({ done: true, guest: false });
    navigation.navigate('Login', { mode: 'signup' });
  };
  // Today opens in Calm for someone new (§3.5), written before it mounts.
  // Then the tour around the app, ending on their first mission.
  const keepAsGuest = async () => {
    await saveWelcome({ done: true, guest: true, at: null });
    await writeSetting(SETTING_KEYS.HOME_VIEW, 'calm');
    // The welcome was their intro; Home's own tutorial would only repeat it.
    await markScreensSeen(['Home']);
    await queueWelcomeTour(null, { afterWelcome: true });
    try { await startFirstGoal(); } catch (e) { console.warn('welcome first goal', e?.message); }
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  if (!answers) return <View style={{ flex: 1, backgroundColor: c.bg0 }} />;

  // ── Pieces ───────────────────────────────────────────────────────────────
  const glass = (on) => [{
    backgroundColor: on ? accent.primary + (isDark ? '1f' : '12') : (isDark ? c.bg1 + 'cc' : c.bg1 + 'eb'),
    borderWidth: 1, borderColor: on ? accent.primary : (isDark ? c.border : c.border + 'aa'), borderRadius: r.xl,
  }, on ? (glow(accent.primary, 0.8) || shadows.md) : shadows.sm];
  const heading = (text, sub) => (
    <View style={{ marginBottom: s.lg }}>
      <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: t.bold, color: c.text1, letterSpacing: -0.3 }}>{text}</Text>
      {!!sub && <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 6 }}>{sub}</Text>}
    </View>
  );
  const check = (on, size = 22) => (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: on ? accent.primary : c.border,
      backgroundColor: on ? accent.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on && <Ionicons name="checkmark" size={size - 8} color={accent.onPrimary} />}
    </View>
  );
  const iconTile = (name, on) => (
    <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
      backgroundColor: on ? accent.primary : (isDark ? c.bg2 : accent.primary + '12'), borderWidth: 1, borderColor: on ? accent.primary : c.border }}>
      <Ionicons name={name} size={19} color={on ? accent.onPrimary : accent.primary} />
    </View>
  );
  const link = (text, onPress, a11y, style) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} hitSlop={8} style={style}>
      <RichText style={{ fontSize: t.sm, color: c.text3 }} boldStyle={{ color: accent.primary }}>{text}</RichText>
    </TouchableOpacity>
  );

  // ── Cards ────────────────────────────────────────────────────────────────
  let body = null;
  let footer = null; // { back, next: { label, onPress, disabled } }
  switch (key) {
    case 'quote':
      body = (
        <Pressable onPress={next} accessibilityRole="button" accessibilityLabel="Continue" style={{ flex: 1, justifyContent: 'center', paddingVertical: s.xxl }}>
          <View>
            <FadeIn delay={200}>
              <Text style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 44, color: c.text1 }}>{QUOTE_LINES[0]}</Text>
            </FadeIn>
            <FadeIn delay={1100}>
              <Text style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 44, color: c.text2, fontStyle: 'italic', marginTop: 6 }}>{QUOTE_LINES[1]}</Text>
            </FadeIn>
            <FadeIn delay={2000} duration={1500} rise={8}>
              <Text style={{ fontSize: t.sm, color: c.text3, letterSpacing: 1.2, marginTop: s.xl }}>— René Descartes</Text>
            </FadeIn>
          </View>
          <View style={{ marginTop: 64, alignItems: 'center' }}>
            <Breathe>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: t.xs, color: c.text3, letterSpacing: 1.6, fontWeight: t.semibold }}>TAP ANYWHERE TO CONTINUE</Text>
                <Ionicons name="arrow-forward" size={14} color={c.text3} />
              </View>
            </Breathe>
          </View>
        </Pressable>
      );
      break;

    case 'why':
      body = (
        <>
          <FadeIn duration={900} rise={6} style={{ marginBottom: s.xl, paddingBottom: s.md, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Text style={{ fontFamily: SERIF, fontSize: 17, fontStyle: 'italic', color: c.text2 }}>{QUOTE_CONQUER}</Text>
            <Text style={{ fontSize: 11, color: c.text3, letterSpacing: 1.4, marginTop: 4 }}>— DESCARTES</Text>
          </FadeIn>
          <FadeIn delay={350} duration={900}>
            {heading('What brings you here today?', 'Select your core motivations (multi-select).')}
            {WELCOME_GOALS.map(g => {
              const on = answers.goals.includes(g.key);
              return (
                <TouchableOpacity key={g.key} onPress={() => answer(a => ({ goals: togglePick(a.goals, g.key), pathKey: null, projectKind: null }))}
                  accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={g.label}
                  style={[glass(on), { flexDirection: 'row', alignItems: 'center', padding: s.md, paddingVertical: 15, marginBottom: s.sm }]}>
                  <Text style={{ flex: 1, fontSize: t.md, color: c.text1, fontWeight: on ? t.semibold : t.regular }}>{g.label}</Text>
                  {check(on)}
                </TouchableOpacity>
              );
            })}
          </FadeIn>
        </>
      );
      footer = { back: true, next: { label: 'Next', onPress: next, disabled: !canLeave('why', answers) } };
      break;

    case 'stage':
      body = (
        <>
          {heading('What stage of life are you at right now?', 'Select one option to customize your portfolio timeline layout.')}
          {STAGES.map(p => {
            const on = answers.startPoint === p.key;
            return (
              <TouchableOpacity key={p.key} onPress={() => answer({ startPoint: p.key, pathKey: null })}
                accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${p.label}. ${p.hint}`}
                style={[glass(on), { flexDirection: 'row', alignItems: 'flex-start', gap: s.md, padding: s.md, marginBottom: s.sm }]}>
                {iconTile(p.icon, on)}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{p.label}</Text>
                  <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>{p.hint}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      );
      footer = { back: true, next: { label: 'Next', onPress: next, disabled: !canLeave('stage', answers) } };
      break;

    case 'interests':
      body = (
        <>
          {heading('Pick your skills & interests', "These will pre-populate your portfolio's skills badge matrix.")}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
            {WELCOME_INTERESTS.map(i => {
              const on = answers.interests.includes(i.key);
              return (
                <TouchableOpacity key={i.key} onPress={() => answer(a => ({ interests: togglePick(a.interests, i.key), projectKind: null }))}
                  accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={i.label}
                  style={[glass(on), { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, minHeight: 64 }]}>
                  <Ionicons name={i.icon} size={20} color={on ? accent.primary : c.text2} />
                  <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{i.label}</Text>
                  {check(on, 18)}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      );
      footer = { back: true, next: { label: 'Next', onPress: next, disabled: !canLeave('interests', answers) } };
      break;

    case 'project': {
      const top = PROJECT_OF[plan.kind];
      const kind = BUILD_KIND_MAP[top.kind];
      const pathKit = PATH_KITS[plan.pathKey];
      body = (
        <>
          <Text style={{ fontSize: 11, fontWeight: t.bold, color: accent.primary, letterSpacing: 1.4 }}>CURATED PROJECT</Text>
          <Text style={{ fontSize: 24, fontWeight: t.bold, color: c.text1, marginTop: 4, marginBottom: s.lg }}>Recommended Project</Text>

          <View style={[{ borderRadius: r.xxl, padding: s.xl, overflow: 'hidden', borderWidth: 1, borderColor: accent.primary + '66',
            backgroundColor: isDark ? accent.primary + '14' : c.bg1 }, glow(accent.primary, 0.9) || shadows.lg]}>
            {/* the corner glow */}
            <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: accent.primary, opacity: isDark ? 0.14 : 0.08 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: r.full, backgroundColor: accent.primary + '22', borderWidth: 1, borderColor: accent.primary + '55' }}>
                <Text style={{ fontSize: 11, fontWeight: t.bold, color: accent.primary, letterSpacing: 1 }}>PRIMARY RECOMMENDATION</Text>
              </View>
              <Text style={{ fontSize: t.xs, color: c.text3 }}>Real-time builder</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
              {iconTile(kind.icon, true)}
              <Text style={{ flex: 1, fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>{top.title}</Text>
            </View>
            <Text style={{ fontSize: t.sm, color: c.text2, marginTop: s.sm, lineHeight: 20 }}>{top.desc}</Text>
            {plan.reasons.length > 0 && (
              <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }} boldStyle={{ color: c.text1 }}>
                {`Because you picked **${plan.reasons.slice(0, 2).join('** and **')}**.`}
              </RichText>
            )}
            <View style={{ flexDirection: 'row', marginTop: s.lg, padding: s.md, borderRadius: r.lg, backgroundColor: isDark ? c.bg0 + 'cc' : c.bg0, borderWidth: 1, borderColor: c.border }}>
              {top.stats.map(([label, value]) => (
                <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: c.text3, letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
                  <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text1, marginTop: 2, textAlign: 'center' }}>{value}</Text>
                </View>
              ))}
            </View>
            <Button label={`${top.launch}  →`} onPress={() => launch(top.kind)} style={{ marginTop: s.lg }} />
          </View>

          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginTop: s.xl, marginBottom: s.sm }}>Or start with one of these</Text>
          {plan.others.map(k => {
            const p = PROJECT_OF[k];
            return (
              <TouchableOpacity key={k} onPress={() => launch(k)} accessibilityRole="button" accessibilityLabel={`${p.launch}. ${p.desc}`}
                style={[glass(false), { flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, marginBottom: s.sm }]}>
                {iconTile(BUILD_KIND_MAP[k].icon, false)}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{p.title}</Text>
                  <Text numberOfLines={2} style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{p.desc}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={c.text3} />
              </TouchableOpacity>
            );
          })}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.lg }}>
            <Ionicons name={pathKit.icon} size={16} color={c.text3} />
            <RichText style={{ flex: 1, fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{`Your path: **${pathKit.label}**`}</RichText>
            {link(showPaths ? '**Done**' : '**Change**', () => setShowPaths(o => !o), 'Change your path')}
          </View>
          {showPaths && Object.keys(PATH_KITS).map(k => {
            const on = plan.pathKey === k;
            return (
              <TouchableOpacity key={k} onPress={() => { answer({ pathKey: k }); setShowPaths(false); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                accessibilityLabel={`${PATH_KITS[k].label}. ${PATH_KITS[k].blurb}`}
                style={[glass(on), { flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, marginTop: s.sm }]}>
                <Ionicons name={PATH_KITS[k].icon} size={18} color={on ? accent.primary : c.text3} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{PATH_KITS[k].label}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>{PATH_KITS[k].blurb}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: s.xl }}>
            {link('← Back to interests', () => goTo('interests'), 'Back to interests')}
            <Text style={{ fontSize: t.xs, color: c.text3 }}>All choices preserved</Text>
          </View>
        </>
      );
      break;
    }

    case 'build': {
      const kindId = answers.projectKind && BUILD_KIND_MAP[answers.projectKind] ? answers.projectKind : plan.kind;
      body = <WelcomeBuild key={kindId} kindId={kindId} answers={answers} onAnswer={answer} />;
      footer = { back: true, next: { label: "I'm done", onPress: next, disabled: !answers.unit1Done } };
      break;
    }

    case 'keep':
      body = (
        <View style={{ paddingTop: s.xl }}>
          <Text style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: c.text3, marginBottom: s.lg }}>You used it well.</Text>
          <RichText style={{ fontSize: 26, lineHeight: 32, fontWeight: t.bold, color: c.text1 }} boldStyle={{ color: accent.primary }}>Want to **keep this**?</RichText>
          <RichText style={{ fontSize: t.md, color: c.text2, marginTop: s.sm, lineHeight: 22 }} boldStyle={{ color: c.text1 }}>
            An account keeps your project, your plans and your answers **safe**, on any device. **Free.**
          </RichText>
          <View style={[glass(false), { marginTop: s.xl, padding: s.lg, flexDirection: 'row', alignItems: 'center', gap: s.md }]}>
            {iconTile('compass-outline', false)}
            <RichText style={{ flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 20 }} boldStyle={{ color: c.text1 }}>
              Next: a **quick look around**, then **your first mission**.
            </RichText>
          </View>
        </View>
      );
      break;
    default:
  }

  const stepNo = Math.min(card + 1, WELCOME_STEPS);
  const numbered = card < WELCOME_STEPS;
  const hasAnswers = answers.goals.length || answers.startPoint || answers.interests.length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <AmbientGlow color={accent.primary} warm={c.gold || accent.primary} isDark={isDark} />

      {/* Where you are */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.lg, paddingTop: s.md, minHeight: 48, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
        {card > 0 ? (
          <TouchableOpacity onPress={back} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={c.text2} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLabel={numbered ? `Step ${stepNo} of ${WELCOME_STEPS}` : 'Your project'}>
          {Array.from({ length: WELCOME_STEPS }, (_, i) => (
            <View key={i} style={{ height: 6, borderRadius: 3, width: i === card ? 24 : i < card ? 8 : 6,
              backgroundColor: i === card ? accent.primary : i < card ? accent.primary + '88' : c.border }} />
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 11, fontWeight: t.semibold, color: c.text3, letterSpacing: 1.4 }}>
          {numbered ? `STEP ${stepNo} OF ${WELCOME_STEPS}` : key === 'build' ? 'YOUR PROJECT' : 'ALMOST THERE'}
        </Text>
        {key !== 'keep' && (
          <TouchableOpacity onPress={skip} accessibilityRole="button" accessibilityLabel={SKIP_TO[key] ? 'Skip the project' : 'Skip this step'} hitSlop={10}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text3 }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: s.lg, paddingBottom: s.xl, maxWidth: key === 'build' ? 760 : 620, width: '100%', alignSelf: 'center' }}>
          {body}
        </ScrollView>
      </Animated.View>

      <View style={{ paddingHorizontal: s.lg, paddingBottom: s.md, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
        {key === 'keep' ? (
          <>
            <Button label="Create account" icon="person-add-outline" onPress={createAccount} />
            <Button label="Keep going as a guest" variant="secondary" onPress={keepAsGuest} style={{ marginTop: s.sm }} />
          </>
        ) : key === 'quote' ? (
          <Button label="Continue" onPress={next} />
        ) : footer ? (
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            {footer.back && <Button label="Back" variant="secondary" onPress={back} style={{ flex: 1 }} />}
            <Button label={footer.next.label} onPress={footer.next.onPress} disabled={footer.next.disabled} style={{ flex: 2 }} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s.md, minHeight: 20 }}>
          {hasAnswers || card > 0
            ? link('↻ Start over', startOver, 'Start over from the first step')
            : <View />}
          {card === 0
            ? link('Already have an account? **Log in**', haveAccount, 'I already have an account. Log in')
            : FAST_TRACK.has(key) ? link('**Fast track:** my project →', () => goTo('project'), 'Fast track straight to my project') : null}
        </View>
      </View>
    </View>
  );
}
