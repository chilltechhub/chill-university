// context/AccessContext.js
// The Compass's state — one purpose, one active objective, and what the
// account has unlocked — held once at the top of the tree so every screen
// reads the same answer.
//
// Why a context rather than a hook per screen: a lock has to look identical
// in the Library grid, the unlock sheet, Settings and the Compass itself,
// and any one of those can change it (opt into experimental features on
// Settings and the Library grid should grow four entries immediately). Three
// screens each fetching their own copy is how those drift apart.
//
// Shape of what it exposes is deliberately small:
//   accessFor(featureId)  -> the full evaluateAccess() answer
//   isOpen(featureId)     -> the boolean, for the common case
//   activeObjective       -> the one thing in flight, already progress-rolled
//   plus the mutations, each of which updates local state first and then
//   asks the server, because a tick on a checklist should not wait on a
//   round-trip.
//
// It also holds the experience stage (src/data/experienceStages.js): how
// much of the app is on show, from a first-day account's handful of tools
// to everything. Same reason it lives here — the Library, Training, Home,
// search and the + button all have to agree on it.
//
// Every write goes through src/api/accessService.js, which never grants
// anything itself — the RPCs re-check each gate server-side. If this file
// and the database ever disagree, the database is right.

import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback, useRef,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProgress } from './UserProgressContext';
import { useProfiles } from './ProfileAccountsContext';
import {
  fetchAccessState, startObjective as startObjectiveApi, saveObjectiveSteps,
  completeObjective as completeObjectiveApi, abandonObjective as abandonObjectiveApi,
  unlockFeature as unlockFeatureApi, recordTestAttempt, setPurpose as setPurposeApi,
  setExperimentalOptIn, EMPTY_ACCESS,
} from '../src/api/accessService';
import { cacheWrite } from '../src/api/offlineCache';
import { FEATURES, getFeature, featureForScreen } from '../src/data/featureCatalog';
import { getObjective, getPurpose, suggestPurpose } from '../src/data/objectives';
import { gradeTest } from '../src/data/competencyTests';
import { evaluateAccess, objectiveProgress, planActive as planIsActive, rankForPurpose } from '../src/logic/featureAccess';
import {
  stageFromProgress, resolveStage, starterPlanFor, screenShownAtStage, visibleGameIdsFor,
  fabActionsFor, nextStageNeeds, stageOpens,
} from '../src/logic/experienceStage';
import { forgetSeenScreens } from '../src/logic/useFirstVisitTutorial';

const AccessContext = createContext(null);

// Device-local, per account. The stage itself is derived from progress that
// lives on the server, so the only thing a reinstall loses is an explicit
// "show me everything" — which is one switch in Settings to get back.
const modeKey = (userId) => `@cth_experience_mode_${userId || 'guest'}`;
const seenStageKey = (userId) => `@cth_experience_stage_seen_${userId}`;

export function AccessProvider({ children }) {
  const { user, profile, level, points, streakDays, dailyMissions, gameplayStats, refreshProfile } = useUserProgress();
  // Which profile type is active decides what stage 1 shows. Account-level
  // progress decides the stage — level, points and objectives are shared
  // across an account's profiles, so the stage is too.
  const { activeType } = useProfiles();

  const [state, setState] = useState(EMPTY_ACCESS);
  const [loading, setLoading] = useState(true);

  // Local echoes of the two profile columns this context writes, so a toggle
  // lands instantly instead of waiting for UserProgressContext to re-pull the
  // whole profile. Null means "no local opinion — use the profile's value".
  const [purposeOverride, setPurposeOverride] = useState(null);
  const [experimentalOverride, setExperimentalOverride] = useState(null);

  // "You just unlocked X" — a queue rather than a value, since finishing an
  // objective can open two features at once (hold-the-line opens both the
  // Weekly Review and Work Mode).
  const [unlockEvents, setUnlockEvents] = useState([]);
  const knownUnlocksRef = useRef(null); // null until the first real load

  const userId = user?.id || null;

  /* ── Load ──────────────────────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ ...EMPTY_ACCESS, ready: true });
      knownUnlocksRef.current = null;
      setLoading(false);
      return;
    }
    const next = await fetchAccessState(userId);
    setState(next);
    // First load just records the baseline. Without this, signing in on a
    // new device would fire a celebration for every feature the account
    // unlocked months ago.
    if (knownUnlocksRef.current === null) {
      knownUnlocksRef.current = new Set(Object.keys(next.unlocks || {}));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setPurposeOverride(null);
    setExperimentalOverride(null);
    refresh();
  }, [refresh]);

  // Applies a locally-computed state and persists it, so an optimistic tick
  // survives a cold start even when the migration hasn't been applied yet and
  // the server has nowhere to put it.
  const applyLocal = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) {
        cacheWrite(`compass_access_${userId}`, {
          unlocks: next.unlocks, attempts: next.attempts, objectives: next.objectives,
        });
      }
      return next;
    });
  }, [userId]);

  // Queues a celebration for anything newly earned.
  const noteUnlocks = useCallback((featureIds, via) => {
    const known = knownUnlocksRef.current;
    const fresh = featureIds.filter(id => !known || !known.has(id));
    if (!fresh.length) return;
    fresh.forEach(id => known?.add(id));
    setUnlockEvents(q => [
      ...q,
      ...fresh.map(id => ({ feature: getFeature(id), via })).filter(e => e.feature),
    ]);
  }, []);

  const dismissUnlockEvent = useCallback(() => setUnlockEvents(q => q.slice(1)), []);

  /* ── Derived ───────────────────────────────────────────────────────────── */

  const purposeKey = purposeOverride ?? profile?.purpose_key ?? null;
  const purpose = getPurpose(purposeKey);
  const suggestedPurposeKey = useMemo(() => suggestPurpose(profile), [profile]);

  const experimentalOn = experimentalOverride ?? (profile?.experimental_opt_in === true);
  const isPlus = planIsActive(profile);

  // Daily drills finished today — the only auto-step counter that isn't a
  // lifetime figure straight off the profile.
  const missionsToday = useMemo(
    () => (dailyMissions || []).filter(m => m.status === 'completed').length,
    [dailyMissions]
  );

  // Lifetime activities answered in any game — the counter behind "play one
  // training game", which has to tick after one round of anything.
  const played = gameplayStats?.totalProblemsAttempted || 0;

  const stats = useMemo(
    () => ({ streakDays, level, points, missionsToday, played }),
    [streakDays, level, points, missionsToday, played]
  );

  /* ── Experience stage ──────────────────────────────────────────────────
     See src/data/experienceStages.js. Worked out from finished objectives
     and level, so there's nothing to keep in sync with the server. */

  const [experienceMode, setExperienceModeState] = useState('auto');
  const [stageEvents, setStageEvents] = useState([]);
  // The highest stage this account has been seen at, read back at launch.
  // Progress (objectives, level) arrives a beat after first render, and
  // without this an account at stage 3 would flash the first-day app every
  // time it opened. Stages only ever go up, so the last one seen is a safe
  // stand-in until the real numbers land.
  const [cachedStage, setCachedStage] = useState(null);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setExperienceModeState('auto');
    setCachedStage(null);
    setPrefsReady(false);
    Promise.all([
      AsyncStorage.getItem(modeKey(userId)),
      userId ? AsyncStorage.getItem(seenStageKey(userId)) : Promise.resolve(null),
    ])
      .then(([rawMode, rawSeen]) => {
        if (!alive) return;
        if (rawMode === 'full') setExperienceModeState('full');
        const n = parseInt(rawSeen, 10);
        if (Number.isFinite(n)) setCachedStage(n);
      })
      .catch(() => {})
      .finally(() => { if (alive) setPrefsReady(true); });
    return () => { alive = false; };
  }, [userId]);

  const setExperienceMode = useCallback(async (mode) => {
    const next = mode === 'full' ? 'full' : 'auto';
    setExperienceModeState(next);
    try { await AsyncStorage.setItem(modeKey(userId), next); } catch { /* local pref */ }
  }, [userId]);

  const completedCount = useMemo(
    () => Object.values(state.objectives || {}).filter(row => row.status === 'completed').length,
    [state.objectives]
  );
  const progressReady = !!state.ready && (!userId || !!profile);
  const liveStage = stageFromProgress({ completedObjectives: completedCount, level });
  const derivedStage = progressReady ? liveStage : Math.max(liveStage, cachedStage || 1);
  const stage = resolveStage({ derived: derivedStage, mode: experienceMode });
  const persona = activeType || null;
  const starterPlan = useMemo(() => starterPlanFor(persona), [persona]);

  // "More of the app is open" — only for stages reached by progress. A
  // stage you switched on yourself in Settings isn't news. The first real
  // load records a baseline instead of celebrating, for the same reason
  // knownUnlocksRef does: an account that's been at stage 3 for months
  // shouldn't be congratulated on a new phone. Waits for the stored mode
  // too, so "show me everything" is known before anything is celebrated.
  useEffect(() => {
    if (!userId || !progressReady || !prefsReady) return;
    let alive = true;
    (async () => {
      let seen = null;
      try { seen = parseInt(await AsyncStorage.getItem(seenStageKey(userId)), 10); } catch {}
      if (!alive) return;
      if (Number.isFinite(seen) && derivedStage > seen) {
        const lines = [];
        for (let n = seen + 1; n <= derivedStage; n++) lines.push(...stageOpens(n));
        if (experienceMode !== 'full') {
          setStageEvents(q => [...q, { from: seen, to: derivedStage, lines }]);
          // Home and the Library have more on them now than when they last
          // taught themselves.
          forgetSeenScreens(['Home', 'LibraryScreen']);
        }
      }
      if (!Number.isFinite(seen) || derivedStage > seen) {
        try { await AsyncStorage.setItem(seenStageKey(userId), String(derivedStage)); } catch {}
      }
    })();
    return () => { alive = false; };
  }, [userId, progressReady, prefsReady, derivedStage, experienceMode]);

  const dismissStageEvent = useCallback(() => setStageEvents(q => q.slice(1)), []);

  const experience = useMemo(() => ({ stage, persona }), [stage, persona]);

  // The context handed to evaluateAccess. Built from the local profile echoes
  // rather than the raw row, so a just-flipped toggle is reflected everywhere
  // on the same frame.
  const gateCtx = useMemo(() => ({
    profile: profile
      ? { ...profile, experimental_opt_in: experimentalOn, purpose_key: purposeKey }
      : { plan: 'free', experimental_opt_in: experimentalOn },
    unlocks: state.unlocks || {},
    attempts: state.attempts || {},
    objectives: state.objectives || {},
    stats,
    experience,
  }), [profile, experimentalOn, purposeKey, state, stats, experience]);

  const accessFor = useCallback(
    (featureId) => evaluateAccess(getFeature(featureId), gateCtx),
    [gateCtx]
  );

  const isOpen = useCallback((featureId) => {
    const feature = getFeature(featureId);
    // Anything not in the catalog is not gated. A screen that nobody has
    // classified is open, not hidden — silently swallowing a surface because
    // of a typo'd id would be the worst possible failure mode here.
    if (!feature) return true;
    return evaluateAccess(feature, gateCtx).available;
  }, [gateCtx]);

  // Whether a route's entry points should show at this stage. A catalog
  // feature answers through its access (so a lock, an opt-in and the stage
  // all agree); anything else goes by STAGED_SCREENS and otherwise shows.
  // Like isOpen, an unknown screen is shown, never swallowed.
  const isFeatureShown = useCallback(
    (featureId) => {
      const feature = getFeature(featureId);
      return !feature || !evaluateAccess(feature, gateCtx).hidden;
    },
    [gateCtx]
  );

  const isScreenVisible = useCallback((screen) => {
    if (!screen) return true;
    const feature = featureForScreen(screen);
    if (feature) return !evaluateAccess(feature, gateCtx).hidden;
    return screenShownAtStage(screen, { stage, persona, featureShown: isFeatureShown });
  }, [gateCtx, stage, persona, isFeatureShown]);

  // Null = every game. Stage 1 is the type's six.
  const visibleGameIds = useMemo(() => visibleGameIdsFor({ stage, persona }), [stage, persona]);
  const isGameVisible = useCallback(
    (gameId) => !visibleGameIds || visibleGameIds.has(gameId),
    [visibleGameIds]
  );
  const visibleFabActions = useMemo(() => fabActionsFor({ stage, persona }), [stage, persona]);

  const nextStage = useMemo(
    () => nextStageNeeds({ stage: derivedStage, completedObjectives: completedCount, level }),
    [derivedStage, completedCount, level]
  );

  const activeObjectiveId = useMemo(() => {
    const rows = Object.entries(state.objectives || {});
    const active = rows.find(([, row]) => row.status === 'active');
    return active ? active[0] : null;
  }, [state.objectives]);

  const activeObjective = useMemo(() => {
    if (!activeObjectiveId) return null;
    return objectiveProgress(activeObjectiveId, state.objectives[activeObjectiveId], stats);
  }, [activeObjectiveId, state.objectives, stats]);

  const completedObjectiveIds = useMemo(
    () => Object.entries(state.objectives || {})
      .filter(([, row]) => row.status === 'completed')
      .map(([id]) => id),
    [state.objectives]
  );

  // Features ordered for this person's purpose — what the Library and the
  // Compass lead with. Hidden entries (experimental, not opted in) are
  // dropped here rather than at each call site.
  const rankedFeatures = useMemo(
    () => rankForPurpose(FEATURES, purposeKey, gateCtx).filter(entry => !entry.access.hidden),
    [purposeKey, gateCtx]
  );

  /* ── Mutations ─────────────────────────────────────────────────────────── */

  const choosePurpose = useCallback(async (key) => {
    setPurposeOverride(key);
    if (!userId) return;
    await setPurposeApi(userId, key);
    refreshProfile?.();
  }, [userId, refreshProfile]);

  const setExperimental = useCallback(async (on) => {
    setExperimentalOverride(!!on);
    if (!userId) return;
    await setExperimentalOptIn(userId, on);
    refreshProfile?.();
  }, [userId, refreshProfile]);

  const startObjective = useCallback(async (objectiveId) => {
    const objective = getObjective(objectiveId);
    if (!objective) return { error: new Error('Unknown objective') };

    applyLocal(prev => {
      const objectives = { ...(prev.objectives || {}) };
      // Single-focus, mirrored locally so the UI doesn't briefly show two.
      Object.keys(objectives).forEach(id => {
        if (id !== objectiveId && objectives[id].status === 'active') {
          objectives[id] = { ...objectives[id], status: 'abandoned' };
        }
      });
      objectives[objectiveId] = {
        ...(objectives[objectiveId] || { steps: {} }),
        objective_id: objectiveId,
        status: 'active',
      };
      return { ...prev, objectives };
    });

    if (!userId) return {};
    return startObjectiveApi(userId, objectiveId);
  }, [userId, applyLocal]);

  // The profile type's simple first goal, with a purpose to go with it if
  // there isn't one yet — a brand-new account is handed one thing to do
  // rather than asked what it's here for (it can still change the purpose on
  // the Compass). Called by onboarding and by Home's Compass card.
  //
  // Onboarding passes the type it just picked: it calls this before the
  // master profile exists, when activeType is still whatever the context
  // had (usually nothing), and the plan has to be the chosen type's.
  const startFirstGoal = useCallback(async (forPersona) => {
    const plan = forPersona ? starterPlanFor(forPersona) : starterPlan;
    if (!purposeKey && plan.purpose) await choosePurpose(plan.purpose);
    return startObjective(plan.firstObjective);
  }, [purposeKey, starterPlan, choosePurpose, startObjective]);

  const abandonActiveObjective = useCallback(async () => {
    if (!activeObjectiveId) return {};
    const id = activeObjectiveId;
    applyLocal(prev => ({
      ...prev,
      objectives: { ...prev.objectives, [id]: { ...prev.objectives[id], status: 'abandoned' } },
    }));
    if (!userId) return {};
    return abandonObjectiveApi(userId, id);
  }, [activeObjectiveId, userId, applyLocal]);

  const toggleStep = useCallback(async (stepId) => {
    if (!activeObjectiveId) return;
    const progress = objectiveProgress(activeObjectiveId, state.objectives[activeObjectiveId], stats);
    const target = progress?.steps.find(s => s.id === stepId);
    // `locked` means the step tracks a counter the app already keeps, so
    // it isn't anyone's to tick by hand.
    if (!target || target.locked) return;

    const current = state.objectives[activeObjectiveId]?.steps || {};
    const steps = { ...current, [stepId]: !current[stepId] };
    if (!steps[stepId]) delete steps[stepId];

    applyLocal(prev => ({
      ...prev,
      objectives: {
        ...prev.objectives,
        [activeObjectiveId]: { ...prev.objectives[activeObjectiveId], steps },
      },
    }));

    if (userId) await saveObjectiveSteps(userId, activeObjectiveId, steps);
  }, [activeObjectiveId, state, stats, userId, applyLocal]);

  const completeActiveObjective = useCallback(async () => {
    if (!activeObjectiveId) return { error: new Error('Nothing active') };
    const objective = getObjective(activeObjectiveId);
    const unlockIds = objective?.unlocks || [];

    applyLocal(prev => {
      const unlocks = { ...(prev.unlocks || {}) };
      unlockIds.forEach(id => {
        if (!unlocks[id]) unlocks[id] = { feature_id: id, method: 'objective', unlocked_at: new Date().toISOString() };
      });
      return {
        ...prev,
        unlocks,
        objectives: {
          ...prev.objectives,
          [activeObjectiveId]: {
            ...prev.objectives[activeObjectiveId],
            status: 'completed',
            completed_at: new Date().toISOString(),
          },
        },
      };
    });

    noteUnlocks(unlockIds, 'objective');

    if (!userId) return { unlocked: unlockIds };
    const res = await completeObjectiveApi(activeObjectiveId, unlockIds);
    return { ...res, unlocked: unlockIds };
  }, [activeObjectiveId, userId, applyLocal, noteUnlocks]);

  /**
   * The one-shot test-out. Grades locally (the bank is code), then records the
   * attempt server-side where the pass mark is applied and the "one attempt,
   * ever" rule actually lives. Returns the graded result either way — a fail
   * still shows you what you missed and why, because a closed door that taught
   * you nothing is just a wall.
   */
  const submitTest = useCallback(async (featureId, answers) => {
    const graded = gradeTest(featureId, answers);
    if (!graded) return null;

    applyLocal(prev => {
      const attempts = {
        ...(prev.attempts || {}),
        [featureId]: {
          feature_id: featureId, passed: graded.passed,
          score: graded.score, total: graded.total,
          attempted_at: new Date().toISOString(),
        },
      };
      const unlocks = { ...(prev.unlocks || {}) };
      if (graded.passed && !unlocks[featureId]) {
        unlocks[featureId] = { feature_id: featureId, method: 'test', unlocked_at: new Date().toISOString() };
      }
      return { ...prev, attempts, unlocks };
    });

    if (graded.passed) noteUnlocks([featureId], 'test');

    if (userId) {
      await recordTestAttempt({
        featureId, score: graded.score, total: graded.total, passMark: graded.passMark,
      });
    }

    return graded;
  }, [userId, applyLocal, noteUnlocks]);

  /** Claims a feature the account's plan already covers. */
  const claimPlanFeature = useCallback(async (featureId) => {
    if (!isPlus) return { error: new Error('No active plan') };
    applyLocal(prev => ({
      ...prev,
      unlocks: {
        ...prev.unlocks,
        [featureId]: { feature_id: featureId, method: 'plan', unlocked_at: new Date().toISOString() },
      },
    }));
    if (!userId) return {};
    return unlockFeatureApi(featureId, 'plan');
  }, [isPlus, userId, applyLocal]);

  const value = useMemo(() => ({
    loading,
    ready: !!state.ready,

    // purpose
    purposeKey,
    purpose,
    suggestedPurposeKey,
    choosePurpose,

    // plan + experimental
    isPlus,
    experimentalOn,
    setExperimental,

    // gates
    accessFor,
    isOpen,
    rankedFeatures,

    // objectives
    activeObjective,
    activeObjectiveId,
    completedObjectiveIds,
    startObjective,
    toggleStep,
    completeActiveObjective,
    abandonActiveObjective,

    // tests + unlocks
    submitTest,
    claimPlanFeature,
    unlockEvents,
    dismissUnlockEvent,

    // experience stage
    stage,
    derivedStage,
    nextStage,
    experienceMode,
    setExperienceMode,
    starterPlan,
    firstGoalId: starterPlan.firstObjective,
    startFirstGoal,
    isFeatureShown,
    isScreenVisible,
    isGameVisible,
    visibleGameIds,
    visibleFabActions,
    stageEvents,
    dismissStageEvent,

    refresh,
    stats,
  }), [
    loading, state.ready, purposeKey, purpose, suggestedPurposeKey, choosePurpose,
    isPlus, experimentalOn, setExperimental, accessFor, isOpen, rankedFeatures,
    activeObjective, activeObjectiveId, completedObjectiveIds, startObjective,
    toggleStep, completeActiveObjective, abandonActiveObjective, submitTest,
    claimPlanFeature, unlockEvents, dismissUnlockEvent,
    stage, derivedStage, nextStage, experienceMode, setExperienceMode, starterPlan,
    startFirstGoal, isFeatureShown, isScreenVisible, isGameVisible, visibleGameIds,
    visibleFabActions, stageEvents, dismissStageEvent,
    refresh, stats,
  ]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be inside AccessProvider');
  return ctx;
}

/** Convenience for the common "what's the state of this one feature" case. */
export function useFeatureAccess(featureId) {
  const { accessFor } = useAccess();
  return accessFor(featureId);
}
