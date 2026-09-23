// src/screens/library/wayfinder/WayfinderScreen.js
//
// Wayfinder — for people who don't know yet what they want, what they can
// do, or who they want to be. See src/data/wayfinder.js for the thinking
// behind the content, and src/logic/wayfinderScoring.js for how answers
// become a map.
//
// Shape of the screen:
//   intro → 1 what you've done → 2 what pulls you → 3 what matters → map
//
// Plus four optional "go deeper" sections, each reachable from the intro or
// the map and each finished on its own (see WayfinderModules.js):
//   situation → plan   what's going on right now, and a plan for it
//   personality        Big Five, with a four-letter translation
//   learning           preferences + techniques that actually work
//   life               life beyond work: what to change, who to be
//
// The map is where people live afterwards, and it's built as a loop rather
// than a result: pick a path → commit to a small experiment (optionally a
// real task with a due date) → come back and say how it felt → the map
// re-ranks. Every answer saves as it's given, so closing the app halfway
// resumes on the same question.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { FONTS } from '../../../theme';
import { supabase, unscoped } from '../../../api/profileScopedClient';
import { upsertTask, completeTask } from '../../../api/captureService';
import { saveOnboardingFields } from '../../../api/onboardingService';
import { useProfiles } from '../../../../context/ProfileAccountsContext';
import {
  loadWayfinder, stampWayfinder, persistWayfinder, resetWayfinder, setWayfinderIntent,
} from '../../../api/wayfinderService';
import { addDays, todayStr, parseLocal } from '../../../logic/dateUtils';
import {
  ACTIVITIES, PATH_MAP, RUNG_MAP, THEME_MAP, VALUE_MAP, TIMELINES, ROUTE_MAP, LINKS, MAX_VALUES,
  experimentText, experimentTaskTitle,
} from '../../../data/wayfinder';
import {
  PERSONALITY_ITEMS, LIFE_PATH_MAP, LIFE_RUNGS, QUALITY_MAP, findItem, findRung,
} from '../../../data/wayfinderDeeper';
import { SITUATION_MAP, MAX_SITUATIONS, situationsFor } from '../../../data/wayfinderSituations';
import {
  personalityAnswered, personalityScores, fourLetter, suggestLifePaths, urgentSituations, formatsFromLearning,
} from '../../../logic/wayfinderDeeper';
import {
  answeredCount, interestScores, experienceScores, leadingThemes, suggestPaths,
  skillsFromExperiences, newExperiment, pathSignal, signalVerdict, composeStatement,
  statementSuggestions, emptyState,
} from '../../../logic/wayfinderScoring';
import ThemeHexagon from './ThemeHexagon';
import { ExperiencesStep, InterestsStep, ValuesStep } from './WayfinderSteps';
import { PathSheet, LifePathSheet, ReflectSheet, StatementSheet } from './WayfinderSheets';
import { SituationStep, PersonalityStep, LearningStep, LifeStep } from './WayfinderModules';
import {
  UrgentHelp, SituationPlan, SituationsSummary, PersonalitySection, LearningSection, LifeSection, GoDeeper,
} from './WayfinderDeeperSections';
import { Pill, SectionTitle, StepHeader, StepNav } from './WayfinderUI';

const STEP_ORDER = ['experiences', 'interests', 'values'];
const MODULE_STAGES = ['situation', 'plan', 'personality', 'learning', 'life'];
// Below this many answers the interest shape is mostly noise; past it,
// skipping the rest still produces something honest (unanswered themes
// read as "not answered", not as zero).
const MIN_INTERESTS_TO_SKIP = 12;

function firstUnanswered(interests) {
  const i = ACTIVITIES.findIndex(a => interests[a.id] === undefined || interests[a.id] === null);
  return i === -1 ? ACTIVITIES.length : i;
}

function dueLabel(dueDate) {
  if (!dueDate) return '';
  const days = Math.round((parseLocal(dueDate) - parseLocal(todayStr())) / 86400000);
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days}d`;
}

export default function WayfinderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, radius: r } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  // A confirmed minor doesn't see adult-only situations. Guests (age
  // unknown) see all of them — see situationsFor().
  const { restricted, ageUnknown } = useProfiles();
  const confirmedMinor = !!restricted && !ageUnknown;

  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null);
  const [state, setState] = useState(null); // null while loading
  const [qIndex, setQIndex] = useState(0);
  const [pIndex, setPIndex] = useState(0);
  const [openPathId, setOpenPathId] = useState(null);
  const [openLifePathId, setOpenLifePathId] = useState(null);
  const [usedForRecs, setUsedForRecs] = useState(false);
  const [reflectId, setReflectId] = useState(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [doneTasks, setDoneTasks] = useState(new Set());
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const scrollRef = useRef(null);

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      let uid = null;
      try {
        const { data } = await supabase.auth.getUser();
        uid = data?.user?.id || null;
      } catch { /* guest */ }
      const loaded = await loadWayfinder(uid);
      if (!alive) return;
      userIdRef.current = uid;
      setUserId(uid);
      setState(loaded);
      setQIndex(firstUnanswered(loaded.interests));
      const pi = PERSONALITY_ITEMS.findIndex(i => !loaded.personality[i.id]);
      setPIndex(pi === -1 ? PERSONALITY_ITEMS.length : pi);
    })();
    return () => { alive = false; };
  }, []);

  // Deep link from the Home widget: open straight onto an experiment's
  // "how did it go?".
  useEffect(() => {
    const id = route.params?.reflectId;
    if (!id || !state) return;
    if (state.experiments.some(x => x.id === id && x.status === 'active')) setReflectId(id);
    navigation.setParams({ reflectId: undefined });
  }, [route.params?.reflectId, state]);

  // Deep link straight into a section, e.g. { stage: 'situation' }.
  useEffect(() => {
    const stage = route.params?.stage;
    if (!stage || !state) return;
    if (MODULE_STAGES.includes(stage) || stage === 'map') update({ stage });
    navigation.setParams({ stage: undefined });
  }, [route.params?.stage, !!state]);

  // An experiment that became a task might have been ticked off in the task
  // list rather than here. Notice, so the map can ask how it went.
  useFocusEffect(useCallback(() => {
    if (!userId || !state) return;
    const ids = state.experiments.filter(x => x.status === 'active' && x.taskId).map(x => x.taskId);
    if (!ids.length) return;
    let alive = true;
    // unscoped: the task may belong to a different profile than the one
    // that's active now. RLS still limits this to the user's own rows.
    unscoped.from('tasks').select('id, completed').in('id', ids)
      .then(({ data }) => { if (alive && data) setDoneTasks(new Set(data.filter(t => t.completed).map(t => t.id))); })
      .catch(() => {});
    return () => { alive = false; };
  }, [userId, state?.experiments]));

  // ── State helpers ───────────────────────────────────────────────────────
  const update = useCallback((patchOrFn) => {
    setState(prev => {
      const patch = typeof patchOrFn === 'function' ? patchOrFn(prev) : patchOrFn;
      const next = stampWayfinder({ ...prev, ...patch });
      persistWayfinder(userIdRef.current, next);
      return next;
    });
  }, []);

  const goStage = (stage) => {
    update({ stage });
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  };

  const goBackOut = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'));

  // ── Derived map ─────────────────────────────────────────────────────────
  const map = useMemo(() => {
    if (!state) return null;
    const interest = interestScores(state.interests);
    return {
      interest,
      experience: experienceScores(state.experiences),
      leading: leadingThemes(interest),
      suggestions: suggestPaths(state),
      skills: skillsFromExperiences(state.experiences),
      active: state.experiments.filter(x => x.status === 'active'),
      done: state.experiments.filter(x => x.status === 'done').slice().reverse(),
      statementText: composeStatement(state.statement),
      life: suggestLifePaths(state, interest, { limit: state.life?.doneAt || state.life?.zones?.length ? 5 : 3 }),
      urgent: urgentSituations(state),
    };
  }, [state]);

  if (!state || !map) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.teal} />
      </View>
    );
  }

  const editing = !!state.mapReadyAt;
  const stepIdx = STEP_ORDER.indexOf(state.stage);
  const inSteps = stepIdx !== -1;
  const answered = answeredCount(state.interests);

  // ── Step actions ────────────────────────────────────────────────────────
  const toggleExperience = (id) => update(prev => ({
    experiences: prev.experiences.includes(id) ? prev.experiences.filter(x => x !== id) : [...prev.experiences, id],
  }));

  const answerInterest = (activityId, value) => {
    const idx = ACTIVITIES.findIndex(a => a.id === activityId);
    update(prev => ({ interests: { ...prev.interests, [activityId]: value } }));
    // A beat of feedback before the next card; skip the jump if they've
    // already moved on (tapped Previous) in the meantime.
    setTimeout(() => setQIndex(prev => (prev === idx ? idx + 1 : prev)), 170);
  };

  const toggleValue = (id) => update(prev => {
    if (prev.values.includes(id)) return { values: prev.values.filter(v => v !== id) };
    if (prev.values.length >= MAX_VALUES) return {};
    return { values: [...prev.values, id] };
  });

  const setReality = (patch) => update(prev => ({ reality: { ...prev.reality, ...patch } }));

  const next = () => {
    if (editing) { goStage('map'); return; }
    if (state.stage === 'values') {
      update({ stage: 'map', mapReadyAt: new Date().toISOString() });
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
      // They've got a map now — Home can stop leading with the invitation.
      setWayfinderIntent(false);
      return;
    }
    goStage(STEP_ORDER[stepIdx + 1]);
  };

  const back = () => {
    if (stepIdx <= 0) { goStage(editing ? 'map' : 'intro'); return; }
    if (editing) { goStage('map'); return; }
    goStage(STEP_ORDER[stepIdx - 1]);
  };

  const editSection = (stage) => {
    if (stage === 'interests') setQIndex(0);
    goStage(stage);
  };

  // ── Go deeper ───────────────────────────────────────────────────────────
  // Every optional section returns to the map if there is one, otherwise to
  // the intro — they can be done in any order, before or after the core steps.
  const homeStage = editing ? 'map' : 'intro';

  const toggleSituation = (id) => update(prev => {
    if (prev.situations.includes(id)) return { situations: prev.situations.filter(x => x !== id) };
    // Urgent situations can always be added, even past the limit.
    if (prev.situations.length >= MAX_SITUATIONS && !SITUATION_MAP[id]?.urgent) return {};
    return { situations: [...prev.situations, id] };
  });

  const toggleSituationStep = (situationId, key) => update(prev => {
    const cur = prev.situationDone?.[situationId] || [];
    const nextList = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    return { situationDone: { ...(prev.situationDone || {}), [situationId]: nextList } };
  });

  const answerPersonality = (itemId, value) => {
    const idx = PERSONALITY_ITEMS.findIndex(i => i.id === itemId);
    update(prev => ({ personality: { ...prev.personality, [itemId]: value } }));
    setTimeout(() => setPIndex(prev => (prev === idx ? idx + 1 : prev)), 170);
  };

  const setLearning = (patch) => update(prev => ({ learning: { ...prev.learning, ...patch } }));
  const setLife = (patch) => update(prev => ({ life: { ...prev.life, ...patch } }));

  const finishModule = (stage) => {
    const now = new Date().toISOString();
    if (stage === 'learning') update(prev => ({ learning: { ...prev.learning, doneAt: prev.learning.doneAt || now } }));
    if (stage === 'life') update(prev => ({ life: { ...prev.life, doneAt: prev.life.doneAt || now } }));
    goStage(homeStage);
  };

  // Links from situation plans and learning techniques: a Wayfinder section,
  // a Library screen, or a bottom tab.
  const openLink = (link) => {
    if (!link) return;
    if (link.stage) {
      if (link.stage === 'experiences' && editing) goStage('map');
      else editSection(link.stage);
      return;
    }
    if (link.tab) { navigation.navigate(link.tab); return; }
    if (link.screen) navigation.navigate(link.screen, link.params);
  };

  const applyFormatsToRecs = async () => {
    const formats = formatsFromLearning(state.learning);
    if (!userId || !formats.length) return;
    try {
      await saveOnboardingFields(userId, { formats });
      setUsedForRecs(true);
    } catch (e) {
      console.warn('wayfinder formats', e?.message);
      Alert.alert('Couldn’t save that', e?.message || 'Please try again.');
    }
  };

  // ── Experiments ─────────────────────────────────────────────────────────
  const commitExperiment = async (pathId, rungId, addTask) => {
    const path = PATH_MAP[pathId];
    const rung = RUNG_MAP[rungId];
    const text = experimentText(path, rungId);
    const dueDate = addDays(todayStr(), rung.days);
    const exp = newExperiment({ pathId, rung: rungId, text, dueDate });

    update(prev => ({
      experiments: [...prev.experiments, exp],
      // Trying something is a vote for it — keep it on the map.
      saved: prev.saved.includes(pathId) ? prev.saved : [...prev.saved, pathId],
    }));

    if (!addTask) return;
    addExperimentTask(exp, {
      title: experimentTaskTitle(path, rungId),
      notes: [text, ...(rung.questions || []).map(q => `• ${q}`)].join('\n'),
      minutes: rung.minutes,
    });
  };

  // Shared by job paths, life paths, and quality practices.
  const addExperimentTask = async (exp, { title, notes, minutes = null }) => {
    if (!userIdRef.current) return;
    try {
      const row = await upsertTask(userIdRef.current, {
        title,
        notes: `${notes}\n\nFrom Wayfinder — when you’re done, open Wayfinder and say how it went.`,
        due_date: exp.dueDate,
        category: 'personal',
        estimated_minutes: minutes,
      });
      if (row?.id) {
        update(prev => ({ experiments: prev.experiments.map(x => (x.id === exp.id ? { ...x, taskId: row.id } : x)) }));
      }
    } catch (e) {
      console.warn('wayfinder task', e?.message);
      Alert.alert('Saved to your map', 'We couldn’t add it to your tasks just now, but it’s on your map.');
    }
  };

  const commitLife = (pathId, rungId, addTask) => {
    const path = LIFE_PATH_MAP[pathId];
    const rung = LIFE_RUNGS.find(x => x.id === rungId);
    if (!path || !rung) return;
    const text = path.steps[rungId];
    const exp = newExperiment({ pathId, rung: rungId, text, dueDate: addDays(todayStr(), rung.days) });
    update(prev => ({ experiments: [...prev.experiments, exp] }));
    if (addTask) addExperimentTask(exp, { title: `${rung.label}: ${path.title}`, notes: text });
  };

  const commitPractice = (qualityId) => {
    const q = QUALITY_MAP[`q_${qualityId}`];
    if (!q) return;
    const exp = newExperiment({ pathId: `q_${qualityId}`, rung: 'practice', text: q.practice, dueDate: addDays(todayStr(), 7) });
    update(prev => ({ experiments: [...prev.experiments, exp] }));
    // Small and one line, so it goes on a signed-in user's task list without
    // a confirm step — due in a week, and deletable like any task.
    addExperimentTask(exp, { title: `Practice being ${q.label.toLowerCase()}`, notes: q.practice });
  };

  const openReflect = (experiment) => {
    // A second Modal can't present while the first is still animating out
    // on iOS — it silently never appears.
    setOpenPathId(null);
    setOpenLifePathId(null);
    setTimeout(() => setReflectId(experiment.id), Platform.OS === 'ios' ? 400 : 0);
  };

  const submitReflection = (experimentId, reflection) => {
    const exp = state.experiments.find(x => x.id === experimentId);
    if (!exp) return null;
    const experiments = state.experiments.map(x => (x.id === experimentId ? { ...x, status: 'done', reflection } : x));
    update({ experiments });
    if (exp.taskId && !doneTasks.has(exp.taskId)) completeTask(exp.taskId, true).catch(() => {});
    const tried = experiments.filter(x => x.pathId === exp.pathId && x.status === 'done').length;
    return signalVerdict(pathSignal(experiments, exp.pathId), tried);
  };

  const removeExperiment = (experimentId) => {
    setReflectId(null);
    update(prev => ({ experiments: prev.experiments.filter(x => x.id !== experimentId) }));
  };

  const toggleSave = (pathId) => update(prev => ({
    saved: prev.saved.includes(pathId) ? prev.saved.filter(x => x !== pathId) : [...prev.saved, pathId],
  }));

  const openCareer = (careerId) => {
    setOpenPathId(null);
    navigation.navigate('CareerExplorationScreen', { careerId });
  };

  const saveStatement = (statement) => {
    update({ statement });
    setStatementOpen(false);
  };

  const addSkillsToPortfolio = async () => {
    if (!userId) {
      Alert.alert('Sign in first', 'Your Portfolio is saved to your account, so it needs you signed in.');
      return;
    }
    setSavingPortfolio(true);
    try {
      const { data: existing, error: readErr } = await supabase
        .from('portfolio_entries').select('title').eq('user_id', userId).eq('section', 'skills');
      if (readErr) throw readErr;
      const have = new Set((existing || []).map(e => (e.title || '').toLowerCase()));
      const rows = map.skills
        .filter(s => !have.has(s.skill.toLowerCase()))
        .map(s => ({ user_id: userId, section: 'skills', title: s.skill, description: `From: ${s.from}`, tag: 'Life experience' }));
      if (!rows.length) {
        Alert.alert('Already there', 'Every one of these is already in your Portfolio.');
        return;
      }
      const { error } = await supabase.from('portfolio_entries').insert(rows);
      if (error) throw error;
      Alert.alert(
        'Added to your Portfolio',
        `${rows.length} skill${rows.length === 1 ? '' : 's'} from your life experience — the kind that belong on a résumé too.`,
        [{ text: 'OK' }, { text: 'Open Portfolio', onPress: () => navigation.navigate('PortfolioScreen') }],
      );
    } catch (e) {
      console.warn('wayfinder portfolio', e?.message);
      Alert.alert('Couldn’t add them', e?.message || 'Please try again.');
    } finally {
      setSavingPortfolio(false);
    }
  };

  const startOver = () => {
    const doIt = async () => {
      await resetWayfinder(userIdRef.current);
      setState({ ...emptyState() });
      setQIndex(0);
      setPIndex(0);
    };
    const msg = 'This clears all of your Wayfinder answers — map, situations, personality, experiments, and statement. Tasks already added stay in your task list.';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Start over?\n\n${msg}`)) doIt();
      return;
    }
    Alert.alert('Start over?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start over', style: 'destructive', onPress: doIt },
    ]);
  };

  const personalityDone = personalityAnswered(state.personality) >= PERSONALITY_ITEMS.length;
  const personalityCode = personalityDone ? fourLetter(personalityScores(state.personality))?.code : null;
  const goDeeperItems = [
    {
      stage: 'situation', icon: 'help-buoy-outline', title: 'What’s going on',
      sub: 'Get a plan for right now · 2 min',
      done: state.situations.length > 0,
      doneLabel: `${state.situations.length} picked · see your plan`,
    },
    {
      stage: 'personality', icon: 'person-outline', title: 'Your personality',
      sub: '20 statements · 3 min',
      done: personalityDone,
      doneLabel: personalityCode ? `Closest match: ${personalityCode}` : 'Done',
    },
    {
      stage: 'learning', icon: 'school-outline', title: 'How you learn',
      sub: 'What works, what gets in the way · 1 min',
      done: !!state.learning.doneAt,
      doneLabel: 'Your learning plan is ready',
    },
    {
      stage: 'life', icon: 'leaf-outline', title: 'Life beyond work',
      sub: 'What to change, who to be · 2 min',
      done: !!state.life.doneAt,
      doneLabel: 'Ways to live it are on your map',
    },
  ];
  const openGoDeeper = (stage) => (stage === 'situation' && state.situations.length ? goStage('plan') : editSection(stage));

  // ── Render pieces ───────────────────────────────────────────────────────
  const card = { backgroundColor: c.bg1, borderRadius: r.lg, padding: 16, borderWidth: 0.5, borderColor: c.border, marginBottom: 14 };
  const kicker = { fontSize: 11, color: c.text3, fontFamily: FONTS.mono, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10 };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, gap: 10 }}>
      <TouchableOpacity onPress={goBackOut} accessibilityRole="button" accessibilityLabel="Back" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="chevron-back" size={22} color={c.teal} />
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      {inSteps && (
        <View style={{ flexDirection: 'row', gap: 5 }} accessibilityLabel={`Step ${stepIdx + 1} of 3`}>
          {STEP_ORDER.map((s, i) => (
            <View key={s} style={{ width: i === stepIdx ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i <= stepIdx ? c.teal : c.border }} />
          ))}
        </View>
      )}
    </View>
  );

  // ── Intro ───────────────────────────────────────────────────────────────
  const renderIntro = () => (
    <View>
      <Text style={{ fontSize: 44, marginBottom: 10 }}>🧭</Text>
      <Text style={{ fontSize: 26, fontWeight: '700', color: c.text1, lineHeight: 33, marginBottom: 12 }}>
        Not sure what you want to do — or who you want to be?
      </Text>
      <Text style={{ fontSize: 15, color: c.text2, lineHeight: 23, marginBottom: 8 }}>
        That’s where most people start. It isn’t a problem to fix; it’s just the part before you’ve tried enough things to know.
      </Text>
      <Text style={{ fontSize: 15, color: c.text2, lineHeight: 23, marginBottom: 20 }}>
        This isn’t a test, and it won’t put you in a box. In about ten minutes you’ll see what you’re drawn to, what you can already do, and a few real paths worth testing — then small experiments to find out for real.
      </Text>

      <View style={card}>
        {[
          { n: 1, title: 'What you’ve already done', sub: 'Your real skills, résumé or not · 2 min' },
          { n: 2, title: 'What pulls you in', sub: '30 quick “would you enjoy…” questions · 5 min' },
          { n: 3, title: 'What matters to you', sub: 'Your values and your real-life situation · 2 min' },
          { n: '→', title: 'Your map', sub: 'Paths worth testing, and small experiments to try this week' },
        ].map((row, i, arr) => (
          <View key={row.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < arr.length - 1 ? 0.5 : 0, borderBottomColor: c.border }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c.teal, fontWeight: '700' }}>{row.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.text1 }}>{row.title}</Text>
              <Text style={{ fontSize: 12.5, color: c.text3, marginTop: 2 }}>{row.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => goStage('experiences')}
        accessibilityRole="button"
        style={{ backgroundColor: c.teal, borderRadius: r.md, paddingVertical: 15, alignItems: 'center', marginBottom: 18 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Let’s start</Text>
      </TouchableOpacity>

      {/* For someone whose first problem isn't "what should I do with my
          life" but "I just lost my job" or "I'm not okay". */}
      <TouchableOpacity
        onPress={() => openGoDeeper('situation')}
        activeOpacity={0.85}
        accessibilityRole="button"
        style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: c.gold + '66', backgroundColor: c.gold + '10' }}
      >
        <Ionicons name="help-buoy-outline" size={24} color={c.gold} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.text1 }}>Something going on right now?</Text>
          <Text style={{ fontSize: 12.5, color: c.text2, marginTop: 2, lineHeight: 17 }}>
            Lost a job, lonely, burned out, struggling at school… start there and get a plan.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.gold} />
      </TouchableOpacity>

      <SectionTitle title="Or go deeper, any time" sub="Each one stands on its own. Do them before or after your map." />
      <GoDeeper items={goDeeperItems.filter(item => item.stage !== 'situation')} onOpen={openGoDeeper} />

      <Text style={{ fontSize: 12.5, color: c.text3, lineHeight: 19, textAlign: 'center', marginBottom: 14 }}>
        Your answers are private to your account. You can change any of them later.
      </Text>

      <View style={{ ...card, backgroundColor: c.bg0 }}>
        <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>
          If feeling lost is weighing on you more than usual, you don’t have to sort it out alone. In the U.S. you can call or text 988 any time to talk to someone.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(LINKS.support.url)} style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 13, color: c.teal, fontWeight: '600' }}>{LINKS.support.label} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Map ─────────────────────────────────────────────────────────────────
  const renderPathCard = (result) => {
    const { path, reasons, verdict } = result;
    const starred = state.saved.includes(path.id);
    const activeHere = map.active.some(x => x.pathId === path.id);
    return (
      <TouchableOpacity
        key={path.id}
        onPress={() => setOpenPathId(path.id)}
        activeOpacity={0.85}
        accessibilityRole="button"
        style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: 14, borderWidth: 1, borderColor: activeHere ? c.teal + '88' : c.border, marginBottom: 10 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {path.themes.map(id => <View key={id} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: THEME_MAP[id].color }} />)}
          </View>
          <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '700', color: c.text1 }}>{path.title}</Text>
          {starred && <Ionicons name="star" size={14} color={c.gold} />}
          <Ionicons name="chevron-forward" size={17} color={c.text4} />
        </View>
        <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19, marginTop: 6 }} numberOfLines={2}>{path.what}</Text>
        {(verdict || activeHere || reasons.length > 0) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {activeHere && <Pill text="Experiment in progress" color={c.teal} />}
            {verdict && <Pill text={verdict.label} color={verdict.tone === 'up' ? c.success : c.text3} />}
            {!verdict && reasons.slice(0, 2).map(rs => <Pill key={rs.text} text={rs.text} color={c.text3} />)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMap = () => {
    const { interest, experience, leading, suggestions, skills, active, done, statementText } = map;
    const { picks, ruledOut, flat } = suggestions;
    const timeline = TIMELINES.find(tl => tl.id === state.reality.timeline);

    return (
      <View>
        <Text style={{ fontSize: 11, color: c.teal, fontFamily: FONTS.mono, letterSpacing: 1.2, marginBottom: 6 }}>YOUR MAP</Text>
        <Text style={{ fontSize: 24, fontWeight: '700', color: c.text1, lineHeight: 30, marginBottom: 6 }}>Here’s where you are right now</Text>
        <Text style={{ fontSize: 14, color: c.text2, lineHeight: 20, marginBottom: 16 }}>
          It changes as you try things. That’s the point.
        </Text>

        {/* Pinned for as long as an urgent situation is selected. */}
        <UrgentHelp situations={map.urgent} />

        {/* Statement */}
        {statementText ? (
          <TouchableOpacity onPress={() => setStatementOpen(true)} activeOpacity={0.85} style={{ ...card, borderColor: c.teal + '55', backgroundColor: c.teal + '10' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={kicker}>Who I’m becoming</Text>
              <Ionicons name="create-outline" size={16} color={c.teal} />
            </View>
            <Text style={{ fontSize: 15.5, color: c.text1, lineHeight: 24, fontStyle: 'italic' }}>{statementText}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setStatementOpen(true)} activeOpacity={0.85} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: c.teal + '77' }}>
            <Ionicons name="person-outline" size={22} color={c.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.text1 }}>Write who you’re becoming</Text>
              <Text style={{ fontSize: 12.5, color: c.text3, marginTop: 2 }}>A few short sentences, drafted from your map for you to change</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={c.teal} />
          </TouchableOpacity>
        )}

        <SituationsSummary state={state} onOpen={() => goStage('plan')} />

        {/* Shape */}
        <View style={card}>
          <Text style={kicker}>What pulls you</Text>
          <ThemeHexagon interest={interest} experience={experience} size={Math.min(300, windowWidth - 72)} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 6 }}>
            <Legend swatch={<View style={{ width: 14, height: 10, borderRadius: 2, backgroundColor: c.teal + '55', borderWidth: 1.5, borderColor: c.teal }} />} text="What pulls you" />
            {state.experiences.length > 0 && (
              <Legend swatch={<View style={{ width: 14, height: 0, borderTopWidth: 1.5, borderColor: c.text3, borderStyle: 'dashed' }} />} text="What you’ve done" />
            )}
          </View>

          <View style={{ marginTop: 16 }}>
            {flat ? (
              <>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text1, marginBottom: 6 }}>Nothing jumped out — and that’s really common.</Text>
                <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20 }}>
                  It usually doesn’t mean you’re not interested in anything. It means answering more questions won’t help much — trying a few different kinds of things will. The paths below come from different corners of the map on purpose.
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: c.text3, marginBottom: 10 }}>Right now you lean toward</Text>
                {leading.map(({ id, theme }) => (
                  <View key={id} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <View style={{ width: 4, borderRadius: 2, backgroundColor: theme.color }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.color }}>{theme.emoji} {theme.label}</Text>
                      <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20, marginTop: 3 }}>{theme.drawn}</Text>
                      <Text style={{ fontSize: 12.5, color: c.text3, lineHeight: 18, marginTop: 4 }}>Watch for: {theme.watch}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Experiments in progress */}
        <SectionTitle title="This week’s experiments" />
        {active.length === 0 ? (
          <View style={{ ...card, backgroundColor: c.bg0 }}>
            <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20 }}>
              Nothing on the go yet. Open a path below and pick one small thing to try — even the 15-minute one tells you something.
            </Text>
          </View>
        ) : active.map(x => {
          const found = findItem(x.pathId);
          const rung = findRung(found?.kind, x.rung);
          const ticked = x.taskId && doneTasks.has(x.taskId);
          return (
            <View key={x.id} style={{ ...card, borderColor: c.teal + '66' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: c.teal, fontFamily: FONTS.mono }}>{rung?.label?.toUpperCase()}</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.text1, flex: 1 }} numberOfLines={1}>{found?.title}</Text>
                <Text style={{ fontSize: 11.5, color: ticked ? c.success : c.text3 }}>{ticked ? 'ticked off ✓' : dueLabel(x.dueDate)}</Text>
              </View>
              <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 19 }}>{x.text}</Text>
              <TouchableOpacity onPress={() => setReflectId(x.id)} style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: c.teal }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{ticked ? 'You did it — how did it go?' : 'Did it? Say how it went'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Paths */}
        <SectionTitle title="Paths worth testing" sub="Tap one to see why it’s here, the ways in, and what to try." />
        {picks.map(renderPathCard)}

        {ruledOut.length > 0 && (
          <>
            <SectionTitle title="Tried — not for now" sub="Crossing these off is how the map gets clearer." />
            {ruledOut.map(renderPathCard)}
          </>
        )}

        <LifeSection
          state={state}
          picks={map.life.picks}
          onOpenPath={setOpenLifePathId}
          onPractice={commitPractice}
          onEdit={() => editSection('life')}
        />

        <SectionTitle title="Go deeper" />
        <GoDeeper items={goDeeperItems} onOpen={openGoDeeper} />

        {personalityDone && (
          <>
            <SectionTitle title="Your personality" />
            <PersonalitySection answers={state.personality} />
          </>
        )}

        {!!state.learning.doneAt && (
          <>
            <SectionTitle title="How you learn" />
            <LearningSection
              learning={state.learning}
              onOpenLink={openLink}
              canUseForRecs={!!userId && formatsFromLearning(state.learning).length > 0}
              usedForRecs={usedForRecs}
              onUseForRecs={applyFormatsToRecs}
            />
          </>
        )}

        {/* Skills */}
        <SectionTitle title="Things you can already do" />
        <View style={card}>
          {skills.length === 0 ? (
            <TouchableOpacity onPress={() => editSection('experiences')}>
              <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20 }}>
                You skipped this part. Most people have done more than they give themselves credit for. <Text style={{ color: c.teal, fontWeight: '600' }}>Add what you’ve done →</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(s => <Pill key={s.skill} text={`${s.emoji} ${s.skill}`} color={c.text2} bg={c.bg0} />)}
              </View>
              <TouchableOpacity
                onPress={addSkillsToPortfolio}
                disabled={savingPortfolio}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, opacity: savingPortfolio ? 0.5 : 1 }}
              >
                <Ionicons name="briefcase-outline" size={16} color={c.teal} />
                <Text style={{ fontSize: 13.5, color: c.teal, fontWeight: '700' }}>{savingPortfolio ? 'Adding…' : 'Add these to my Portfolio'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Values */}
        <SectionTitle title="What matters to you" />
        <View style={card}>
          {state.values.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: c.text3 }}>Not picked yet.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {state.values.map(id => <Pill key={id} text={`${VALUE_MAP[id].emoji} ${VALUE_MAP[id].label}`} color={c.gold} bg={c.gold + '14'} />)}
            </View>
          )}
          {(timeline || state.reality.training.length > 0) && (
            <Text style={{ fontSize: 12.5, color: c.text3, lineHeight: 18, marginTop: 10 }}>
              {[timeline?.label, state.reality.training.length ? `Open to: ${state.reality.training.map(id => ROUTE_MAP[id].label.toLowerCase()).join(', ')}` : null].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        {/* Journal */}
        {done.length > 0 && (
          <>
            <SectionTitle title="What you’ve learned" />
            <View style={card}>
              {done.slice(0, 8).map((x, i, arr) => {
                const { energy = 0, curiosity = 0, note } = x.reflection || {};
                const sum = energy + curiosity;
                return (
                  <View key={x.id} style={{ paddingVertical: 9, borderBottomWidth: i < arr.length - 1 ? 0.5 : 0, borderBottomColor: c.border }}>
                    <Text style={{ fontSize: 13.5, color: c.text1, fontWeight: '600' }}>
                      {sum > 0 ? '⚡' : sum < 0 ? '🪫' : '😐'} {findRung(findItem(x.pathId)?.kind, x.rung)?.label} · {findItem(x.pathId)?.title}
                    </Text>
                    {!!note && <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19, marginTop: 3 }}>“{note}”</Text>}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Edit + outside help */}
        <SectionTitle title="Change your answers" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {[
            { stage: 'experiences', label: 'What I’ve done' },
            { stage: 'interests', label: 'What pulls me' },
            { stage: 'values', label: 'What matters' },
          ].map(btn => (
            <TouchableOpacity key={btn.stage} onPress={() => editSection(btn.stage)} style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 4, borderRadius: r.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1, alignItems: 'center' }}>
              <Text style={{ fontSize: 12.5, color: c.text2, fontWeight: '600', textAlign: 'center' }}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ ...card, backgroundColor: c.bg0 }}>
          <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>
            Want a longer, research-tested interest survey? The U.S. Department of Labor’s free one uses the same six themes as this map.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(LINKS.interestProfiler.url)} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: c.teal, fontWeight: '600' }}>{LINKS.interestProfiler.label} →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={startOver} style={{ alignSelf: 'center', padding: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 13, color: c.text3 }}>Start over</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Steps ───────────────────────────────────────────────────────────────
  const renderStep = () => {
    if (state.stage === 'experiences') return <ExperiencesStep selected={state.experiences} onToggle={toggleExperience} />;
    if (state.stage === 'interests') {
      return <InterestsStep answers={state.interests} index={qIndex} setIndex={setQIndex} onAnswer={answerInterest} />;
    }
    return <ValuesStep values={state.values} onToggleValue={toggleValue} reality={state.reality} onReality={setReality} />;
  };

  const renderModule = () => {
    if (state.stage === 'situation') {
      return (
        <>
          <SituationStep options={situationsFor({ confirmedMinor })} selected={state.situations} onToggle={toggleSituation} />
          <StepNav
            onBack={() => goStage(homeStage)}
            onNext={() => goStage(state.situations.length ? 'plan' : homeStage)}
            nextLabel={state.situations.length ? 'See my plan' : 'Skip'}
          />
        </>
      );
    }
    if (state.stage === 'plan') {
      const list = state.situations.map(id => SITUATION_MAP[id]).filter(Boolean);
      const anyUrgent = list.some(x => x.urgent);
      return (
        <>
          <StepHeader
            kicker="Your plan"
            title={anyUrgent ? 'First, reach someone' : 'One step at a time'}
            body={anyUrgent
              ? 'Everything else can wait. The help at the top of your plan is free, confidential, and there any time.'
              : 'Tick things off as you go. You don’t have to do all of it — start with the first one.'}
          />
          {list.map(sit => (
            <SituationPlan
              key={sit.id}
              situation={sit}
              done={state.situationDone?.[sit.id]}
              onToggleStep={toggleSituationStep}
              onOpenApp={openLink}
            />
          ))}
          <TouchableOpacity onPress={() => goStage('situation')} style={{ alignSelf: 'center', padding: 8 }}>
            <Text style={{ fontSize: 13.5, color: c.teal, fontWeight: '600' }}>Change what’s going on</Text>
          </TouchableOpacity>
          <StepNav
            onBack={() => goStage('situation')}
            // Nobody in crisis should be told to go find their direction.
            onNext={() => goStage(editing || anyUrgent ? homeStage : 'experiences')}
            nextLabel={editing ? 'Back to my map' : anyUrgent ? 'Done for now' : 'Now find your direction'}
          />
        </>
      );
    }
    if (state.stage === 'personality') {
      return (
        <>
          <PersonalityStep answers={state.personality} index={pIndex} setIndex={setPIndex} onAnswer={answerPersonality} />
          <StepNav
            onBack={() => goStage(homeStage)}
            onNext={() => goStage(homeStage)}
            nextLabel={personalityDone ? (editing ? 'Back to my map' : 'Done') : 'Finish later'}
          />
        </>
      );
    }
    if (state.stage === 'learning') {
      const answeredAny = state.learning.prefs.length > 0 || state.learning.blockers.length > 0;
      return (
        <>
          <LearningStep learning={state.learning} onChange={setLearning} />
          {answeredAny && (
            <>
              <SectionTitle title="Your learning plan" sub="Updates as you pick." />
              <LearningSection
                learning={state.learning}
                onOpenLink={openLink}
                canUseForRecs={!!userId && formatsFromLearning(state.learning).length > 0}
                usedForRecs={usedForRecs}
                onUseForRecs={applyFormatsToRecs}
              />
            </>
          )}
          <StepNav onBack={() => goStage(homeStage)} onNext={() => finishModule('learning')} nextLabel={answeredAny ? 'Save' : 'Skip'} />
        </>
      );
    }
    if (state.stage === 'life') {
      const answeredAny = state.life.zones.length > 0 || state.life.qualities.length > 0;
      return (
        <>
          <LifeStep life={state.life} onChange={setLife} />
          {answeredAny && (
            <View style={{ marginTop: 18 }}>
              <LifeSection state={state} picks={map.life.picks} onOpenPath={setOpenLifePathId} onPractice={commitPractice} />
            </View>
          )}
          <StepNav onBack={() => goStage(homeStage)} onNext={() => finishModule('life')} nextLabel={answeredAny ? 'Save' : 'Skip'} />
        </>
      );
    }
    return null;
  };

  let nextLabel = 'Next';
  let nextDisabled = false;
  if (editing) nextLabel = 'Update my map';
  else if (state.stage === 'experiences' && state.experiences.length === 0) nextLabel = 'Skip for now';
  else if (state.stage === 'interests') nextDisabled = answered < ACTIVITIES.length;
  else if (state.stage === 'values') nextLabel = 'See my map';

  const canSkipRest = state.stage === 'interests' && !editing && answered >= MIN_INTERESTS_TO_SKIP && answered < ACTIVITIES.length;

  const openPathResult = openPathId ? map.suggestions.all.find(x => x.path.id === openPathId) : null;
  const openLifeResult = openLifePathId ? map.life.all.find(x => x.path.id === openLifePathId) : null;
  const reflecting = reflectId ? state.experiments.find(x => x.id === reflectId) : null;
  const reflectingItem = reflecting ? findItem(reflecting.pathId) : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0, paddingTop: 50 }}>
      {header}

      {/* Back/Next sit at the end of the content rather than in a sticky
          footer: the app-wide + button floats over exactly that corner and
          can be dragged anywhere, so a pinned footer would always be half
          under it somewhere. The bottom padding keeps the end of the
          content clear of it. */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, maxWidth: 680, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {state.stage === 'intro' && renderIntro()}
        {inSteps && renderStep()}
        {state.stage === 'map' && renderMap()}
        {MODULE_STAGES.includes(state.stage) && renderModule()}

        {inSteps && (
          <View style={{ marginTop: 24 }}>
            {canSkipRest && (
              <TouchableOpacity onPress={next} style={{ alignSelf: 'center', marginBottom: 8, padding: 4 }}>
                <Text style={{ fontSize: 13, color: c.text3 }}>Skip the rest — use what I’ve answered</Text>
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={back} accessibilityRole="button" style={{ flex: 1, paddingVertical: 14, borderRadius: r.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: c.text2, fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={next}
                disabled={nextDisabled}
                accessibilityRole="button"
                style={{ flex: 2, paddingVertical: 14, borderRadius: r.md, backgroundColor: c.teal, alignItems: 'center', opacity: nextDisabled ? 0.4 : 1 }}
              >
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '700' }}>{nextLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <PathSheet
        visible={!!openPathResult}
        result={openPathResult}
        experiments={state.experiments}
        saved={state.saved}
        reality={state.reality}
        canAddTask={!!userId}
        onClose={() => setOpenPathId(null)}
        onToggleSave={toggleSave}
        onCommit={commitExperiment}
        onReflect={openReflect}
        onOpenCareer={openCareer}
      />
      <LifePathSheet
        visible={!!openLifeResult}
        result={openLifeResult}
        experiments={state.experiments}
        canAddTask={!!userId}
        onClose={() => setOpenLifePathId(null)}
        onCommit={commitLife}
        onReflect={openReflect}
      />
      <ReflectSheet
        visible={!!reflecting}
        experiment={reflecting}
        title={reflectingItem?.title}
        rungLabel={reflecting ? findRung(reflectingItem?.kind, reflecting.rung)?.label : null}
        onClose={() => setReflectId(null)}
        onSubmit={submitReflection}
        onRemove={removeExperiment}
      />
      <StatementSheet
        visible={statementOpen}
        statement={state.statement}
        suggestions={statementOpen ? statementSuggestions(state) : null}
        onClose={() => setStatementOpen(false)}
        onSave={saveStatement}
      />
    </View>
  );
}

function Legend({ swatch, text }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {swatch}
      <Text style={{ fontSize: 12, color: c.text3 }}>{text}</Text>
    </View>
  );
}
