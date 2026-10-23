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
// It also answers the other questions in docs/access-system.md, in order:
//   1. Allowed?     age and remote switches (src/logic/allowed.js)
//   2. Which door?  open, earn, Plus or Labs (src/logic/featureAccess.js)
//   3. Shown now?   the stage on this account type's path
//                   (src/data/experienceStages.js)
// Same reason it lives here — the Library, Training, Home, search and the +
// button all have to agree. Question 4, "Kept?", is the person's own hide
// switches, and each surface keeps those itself.
//
// Every write goes through src/api/accessService.js, which never grants
// anything itself — the RPCs re-check each gate server-side. If this file
// and the database ever disagree, the database is right.

import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback, useRef,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProgress } from './UserProgressContext';
import usePracticeToday from '../src/logic/practiceToday';
import { useProfiles } from './ProfileAccountsContext';
import {
  fetchAccessState, startObjective as startObjectiveApi, saveObjectiveSteps,
  completeObjective as completeObjectiveApi, abandonObjective as abandonObjectiveApi,
  unlockFeature as unlockFeatureApi, recordTestAttempt, setPurpose as setPurposeApi,
  setExperimentalOptIn, setOpenedByChoice, saveStartChoices, EMPTY_ACCESS,
} from '../src/api/accessService';
import { useConfigValue, useFeatureFlag } from './RemoteConfigContext';
import { getWayfinderIntent } from '../src/api/wayfinderService';
import { alreadyHas } from '../src/api/existingWorkService';
import { onPlanDone } from '../src/api/plannerService';
import { ageStatus, contentAllowed, gameAllowed } from '../src/logic/allowed';
import { cacheWrite } from '../src/api/offlineCache';
import { FEATURES, getFeature, featureForScreen, featuresUnlockedBy, SOCIAL_SCREENS } from '../src/data/featureCatalog';
import { getObjective, getPurpose, suggestPurpose } from '../src/data/objectives';
import { gradeTest } from '../src/data/competencyTests';
import { evaluateAccess, objectiveProgress, planActive as planIsActive, rankForPurpose, signalTarget, pickableAvailable } from '../src/logic/featureAccess';
import {
  stageFromProgress, resolveStage, openedAt, openedForTrack, screenShownAtStage, visibleGameIdsFor,
  fabActionsFor, nextStageNeeds, stagesBetween, reteachBetween, firstGoalFor, pathFor,
} from '../src/logic/experienceStage';
import {
  getPickable, normalizeTrack, picksFromOpened, nextSuggestion, PICKABLE_IDS,
} from '../src/data/pickables';
import { getPersona } from '../src/data/personas';
import { forgetSeenScreens } from '../src/logic/useFirstVisitTutorial';
import { getEnabledGames } from '../src/services/gameRegistry';
import { tapHaptic } from '../src/logic/haptics';
import { setNoticeScreenGate } from '../src/logic/noticeStore';
import { recordAction } from '../src/logic/gamificationService';

const AccessContext = createContext(null);

const union = (a = [], b = []) => [...new Set([...a, ...b])];
function mergeStageEvents(a, b) {
  return {
    from: Math.min(a.from, b.from),
    to: Math.max(a.to, b.to),
    stages: [...(a.stages || []), ...(b.stages || []).filter(st => !(a.stages || []).includes(st))],
    fresh: a.fresh && b.fresh ? {
      features: union(a.fresh.features, b.fresh.features),
      games: union(a.fresh.games, b.fresh.games),
      widgets: union(a.fresh.widgets, b.fresh.widgets),
      caps: union(a.fresh.caps, b.fresh.caps),
    } : (a.fresh || b.fresh),
  };
}

// See startFirstGoal: the first goal for someone with no account.
const GUEST_FIRST_GOAL = { objective: 'first-look', purpose: 'habits' };

// Device-local, per account. The stage itself is derived from progress that
// lives on the server, so the only thing a reinstall loses is an explicit
// "show me everything" — which is one switch in Settings to get back.
const modeKey = (userId) => `@cth_experience_mode_${userId || 'guest'}`;
// The ticked list from "Pick your features", device copy. The account copy
// (profiles.metadata.picks) wins once it's loaded; guests only have this.
const picksKey = (userId) => `@cth_feature_picks_${userId || 'guest'}`;
// v2: stages went from three big ones to ten small ones, so a number saved
// under the old scheme means something else. A fresh key makes the first
// load record a baseline instead of celebrating stages nobody just reached.
const seenStageKey = (userId) => `@cth_experience_stage_seen_v2_${userId}`;
// Settings switches that are also keys to a door (featureCatalog's
// `settingKey`). Same storage key useSetting() writes, read here directly
// because this provider sits above the navigator useSetting needs.
const DOOR_SETTING_KEYS = ['educatorMode'];
const doorSettingKey = (key) => `@cth_setting_${key}`;

export function AccessProvider({ children }) {
  const { user, profile, level, points, streakDays, dailyMissions, gameplayStats, refreshProfile, setPlayableGames } = useUserProgress();
  // Which profile type is active decides WHICH path the stages walk.
  // Account-level progress decides HOW FAR along it — level and objectives
  // are shared across an account's profiles, so the stage is too.
  const { activeType } = useProfiles();
  const userId = user?.id || null;

  /* ── 1. Allowed? ───────────────────────────────────────────────────────
     Age and remote switches. Nothing further down can override these. */
  const age = useMemo(() => ageStatus(user ? profile : null), [user, profile]);
  const disabledGames = useConfigValue('disabled_games', []);
  const isContentAllowed = useCallback((item) => contentAllowed(item, age), [age]);
  const isGameAllowed = useCallback((gameId) => gameAllowed(gameId, disabledGames), [disabledGames]);

  /* ── 2. Which door? — the inputs that aren't server state ──────────────
     Plus can't be bought yet (no payment SDK), so its doors stay out of
     sight until the 'plus_on_sale' app_config row says otherwise. */
  const plusOnSale = useFeatureFlag('plus_on_sale', false);
  // Social tools (Community, Labs, the Leaderboard) stay hidden until there
  // are people to see: app_config 'social_on' turns them on.
  const socialOn = useFeatureFlag('social_on', false);
  const [doorSettings, setDoorSettings] = useState({});
  useEffect(() => {
    let alive = true;
    Promise.all(DOOR_SETTING_KEYS.map(k => AsyncStorage.getItem(doorSettingKey(k)).catch(() => null)))
      .then(raws => {
        if (!alive) return;
        const next = {};
        raws.forEach((raw, i) => {
          try { next[DOOR_SETTING_KEYS[i]] = raw === null ? null : JSON.parse(raw); } catch { next[DOOR_SETTING_KEYS[i]] = null; }
        });
        setDoorSettings(next);
      });
    return () => { alive = false; };
  }, [userId]);
  // Tools opened by choice ("Open it now"), from profiles.metadata. The local
  // copy answers at once; the account copy is what the next sign-in reads.
  const [chosenLocal, setChosenLocal] = useState(null);
  useEffect(() => { setChosenLocal(null); }, [userId]);
  const chosenIds = chosenLocal ?? (Array.isArray(profile?.metadata?.opened_by_choice) ? profile.metadata.opened_by_choice : []);
  const chosen = useMemo(() => new Set(chosenIds), [chosenIds.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const openByChoice = useCallback(async (featureId) => {
    if (!featureId || chosen.has(featureId)) return;
    const next = [...chosen, featureId];
    setChosenLocal(next);
    tapHaptic?.();
    if (userId) await setOpenedByChoice(userId, next, profile?.metadata);
  }, [chosen, userId, profile?.metadata]);

  const setDoorSetting = useCallback((key, on) => {
    setDoorSettings(prev => ({ ...prev, [key]: !!on }));
    AsyncStorage.setItem(doorSettingKey(key), JSON.stringify(!!on)).catch(() => {});
  }, []);

  const [state, setState] = useState(EMPTY_ACCESS);
  // Each objective's steps as of the last write, including writes this
  // render hasn't seen yet. Two signals sent back to back (the Workshop
  // sends 'project-started' then 'project-next-set' for one save) used to
  // both read the same pre-tick steps from `state`, so the second write put
  // back the step the first had just ticked. Found 2026-09-25 on a fresh
  // account: Start Your Build stuck at 2 of 3. Cleared whenever `state`
  // catches up, so it only ever bridges writes within one render.
  const stepsRef = useRef({});
  // The detail of the last signal of each name, e.g. which area was just
  // rated, so the guide can take someone back to the area THEY picked.
  const lastDetailRef = useRef({});
  const lastSignalDetail = useCallback((name) => lastDetailRef.current[name] || null, []);
  useEffect(() => { stepsRef.current = {}; }, [state.objectives]);
  const latestSteps = (id) => stepsRef.current[id] || state.objectives[id]?.steps || {};
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
  // On "Just my picks" a goal doesn't open things, it offers them: what it
  // earned becomes the first suggestion (see the stage effect below) rather
  // than an "Unlocked" card for something they never asked for.
  const trackRef = useRef('auto');
  const earnedRef = useRef([]);
  // Tools the goal just finished sent someone into without them having
  // picked it (completeActiveObjective), so the card can say "keep it".
  const usedToolsRef = useRef(new Set());
  const noteUnlocks = useCallback((featureIds, via) => {
    const known = knownUnlocksRef.current;
    const fresh = featureIds.filter(id => !known || !known.has(id));
    if (!fresh.length) return;
    fresh.forEach(id => known?.add(id));
    if (trackRef.current === 'picks') { earnedRef.current = [...earnedRef.current, ...fresh]; return; }
    setUnlockEvents(q => [
      ...q,
      ...fresh.map(id => ({ feature: getFeature(id), via })).filter(e => e.feature),
    ]);
  }, []);

  const dismissUnlockEvent = useCallback(() => setUnlockEvents(q => q.slice(1)), []);
  // UnlockNotification shows everything queued in one card, so it clears
  // them all at once rather than one popup per feature.
  const dismissAllUnlockEvents = useCallback(() => setUnlockEvents([]), []);

  /* ── Derived ───────────────────────────────────────────────────────────── */

  const purposeKey = purposeOverride ?? profile?.purpose_key ?? null;
  const purpose = getPurpose(purposeKey);
  const suggestedPurposeKey = useMemo(() => suggestPurpose(profile), [profile]);

  const experimentalOn = experimentalOverride ?? (profile?.experimental_opt_in === true);
  const isPlus = planIsActive(profile);

  // Practice rounds finished today: the only auto-step counter that isn't a
  // lifetime figure straight off the profile. It replaced the daily XP
  // drills' count when Challenges retired (shake-up P5).
  const practiceToday = usePracticeToday();

  // Lifetime activities answered in any game — the counter behind "play one
  // training game", which has to tick after one round of anything.
  const played = gameplayStats?.totalProblemsAttempted || 0;

  const stats = useMemo(
    () => ({ streakDays, level, points, practiceToday, played }),
    [streakDays, level, points, practiceToday, played]
  );

  /* ── 3. Shown now? ─────────────────────────────────────────────────────
     See src/data/experienceStages.js. Each account type walks a path of
     small stages; each finished goal and each level gained opens the next.
     Worked out from progress, so there's nothing to keep in sync. */

  const [deviceMode, setDeviceMode] = useState(null);
  const [devicePicks, setDevicePicks] = useState(null);
  const [stageEvents, setStageEvents] = useState([]);
  // The highest stage this account has been seen at, read back at launch.
  // Progress (objectives, level) arrives a beat after first render, and
  // without this a far-along account would flash the first-day app every
  // time it opened. Stages only ever go up, so the last one seen is a safe
  // stand-in until the real numbers land.
  const [cachedStage, setCachedStage] = useState(null);
  const [prefsReady, setPrefsReady] = useState(false);
  // Onboarding's "I'm not sure yet": the Wayfinder joins stage 1.
  const [exploring, setExploring] = useState(false);

  useEffect(() => {
    let alive = true;
    setDeviceMode(null);
    setDevicePicks(null);
    setCachedStage(null);
    setPrefsReady(false);
    Promise.all([
      AsyncStorage.getItem(modeKey(userId)),
      userId ? AsyncStorage.getItem(seenStageKey(userId)) : Promise.resolve(null),
      getWayfinderIntent(),
      AsyncStorage.getItem(picksKey(userId)),
    ])
      .then(([rawMode, rawSeen, intent, rawPicks]) => {
        if (!alive) return;
        if (rawMode) setDeviceMode(normalizeTrack(rawMode));
        try {
          const list = JSON.parse(rawPicks);
          if (Array.isArray(list)) setDevicePicks(list);
        } catch { /* none saved */ }
        const n = parseInt(rawSeen, 10);
        if (Number.isFinite(n)) setCachedStage(n);
        setExploring(!!intent);
      })
      .catch(() => {})
      .finally(() => { if (alive) setPrefsReady(true); });
    return () => { alive = false; };
  }, [userId]);

  // How someone starts (src/data/pickables.js): 'picks' Just my picks,
  // 'auto' Level up, 'full' All in. Kept on the account in
  // profiles.metadata.track so it follows them to a new phone; the device
  // copy covers guests and the moment before the profile loads. Accounts
  // from before tracks existed read from show_everything.
  const [modeOverride, setModeOverride] = useState(null);
  // undefined = no local opinion yet; null = cleared on purpose (All in).
  const [picksOverride, setPicksOverride] = useState(undefined);
  const [declinedOverride, setDeclinedOverride] = useState(null);
  useEffect(() => { setModeOverride(null); setPicksOverride(undefined); setDeclinedOverride(null); }, [userId]);
  const meta = profile?.metadata && typeof profile.metadata === 'object' ? profile.metadata : {};
  const experienceMode = modeOverride
    ?? (meta.track ? normalizeTrack(meta.track) : null)
    ?? (profile?.show_everything === true ? 'full' : null)
    ?? deviceMode
    ?? 'auto';
  trackRef.current = experienceMode;
  const savedPicks = picksOverride !== undefined
    ? picksOverride
    : (Array.isArray(meta.picks) ? meta.picks : null) ?? devicePicks;
  const declinedPicks = declinedOverride ?? (Array.isArray(meta.picks_declined) ? meta.picks_declined : []);

  const persistStart = useCallback(async (patch) => {
    if (patch.track) {
      try { await AsyncStorage.setItem(modeKey(userId), patch.track); } catch { /* local pref */ }
    }
    if (patch.picks !== undefined) {
      try {
        if (patch.picks) await AsyncStorage.setItem(picksKey(userId), JSON.stringify(patch.picks));
        else await AsyncStorage.removeItem(picksKey(userId));
      } catch { /* local pref */ }
    }
    if (userId) {
      await saveStartChoices(userId, patch);
      refreshProfile?.();
    }
  }, [userId, refreshProfile]);

  const completedCount = useMemo(
    () => Object.values(state.objectives || {}).filter(row => row.status === 'completed').length,
    [state.objectives]
  );
  const progressReady = !!state.ready && (!userId || !!profile);
  const liveStage = stageFromProgress({ completedObjectives: completedCount, level });
  const derivedStage = progressReady ? liveStage : Math.max(liveStage, cachedStage || 1);
  const stage = resolveStage({ derived: derivedStage, mode: experienceMode });
  const persona = activeType || null;
  const typeDefaults = getPersona(persona)?.defaultWidgets || [];
  // Picks for an account on "Just my picks" that never ticked any (it
  // switched over later): whatever it can see now, so nothing vanishes.
  const picks = useMemo(() => {
    if (savedPicks) return savedPicks;
    if (experienceMode !== 'picks') return null;
    const now = openedAt(persona, derivedStage, { exploring, aim: purposeKey });
    return picksFromOpened(now, { allGames: now.caps.has('all-games') });
  }, [savedPicks, experienceMode, persona, derivedStage, exploring, purposeKey]);
  // The purpose is also the answer to onboarding's "What did you come here
  // for?", and what it opens joins stage 1 (AIM_OPENS). Changing it on the
  // Compass later re-tailors the start the same way.
  const opened = useMemo(
    () => openedForTrack({
      track: experienceMode, persona, stage: derivedStage, exploring, aim: purposeKey, picks, typeDefaults,
    }),
    [experienceMode, persona, derivedStage, exploring, purposeKey, picks, typeDefaults.join('|')] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const can = useCallback((cap) => opened.caps.has(cap), [opened]);

  // `picks` comes with it from onboarding, so both land in one write.
  const setExperienceMode = useCallback(async (mode, { picks: chosenPicks } = {}) => {
    const next = normalizeTrack(mode);
    setModeOverride(next);
    setDeviceMode(next);
    const patch = { track: next };
    if (Array.isArray(chosenPicks)) {
      patch.picks = PICKABLE_IDS.filter(id => chosenPicks.includes(id));
      setPicksOverride(patch.picks);
      if (patch.picks.includes('labs')) {
        setExperimentalOverride(true);
        if (userId) setExperimentalOptIn(userId, true).catch(() => {});
      }
      if (patch.picks.includes('lesson-builder')) setDoorSetting('educatorMode', true);
    } else if (next === 'full') {
      // All in means everything: switching to it starts from a full list
      // again, and My features is where to untick.
      patch.picks = null;
      setPicksOverride(null);
    } else if (next === 'picks' && !savedPicks) {
      // Switching to "Just my picks" keeps what's showing now as the picks,
      // so the switch itself changes nothing until they untick something.
      const now = openedAt(persona, derivedStage, { exploring, aim: purposeKey });
      patch.picks = picksFromOpened(now, { allGames: now.caps.has('all-games') });
      setPicksOverride(patch.picks);
    }
    await persistStart(patch);
  }, [persistStart, savedPicks, persona, derivedStage, exploring, purposeKey, userId, setDoorSetting]);

  // "More of the app is open" — only for stages reached by progress. A
  // stage you switched on yourself isn't news. The first real load records
  // a baseline instead of celebrating, for the same reason knownUnlocksRef
  // does: an account that's been far along for months shouldn't be
  // congratulated on a new phone.
  useEffect(() => {
    if (!userId || !progressReady || !prefsReady) return;
    let alive = true;
    (async () => {
      let seen = null;
      try { seen = parseInt(await AsyncStorage.getItem(seenStageKey(userId)), 10); } catch {}
      if (!alive) return;
      if (Number.isFinite(seen) && derivedStage > seen && experienceMode === 'picks') {
        // Just my picks: a finished goal offers ONE more thing, and adds it
        // only on a yes (UnlockNotification's suggestion card).
        const pathFeatures = pathFor(persona).slice(seen).flatMap(st => [...(st.features || []), ...(st.screens || [])]);
        const suggest = nextSuggestion({
          picks: picks || [], declined: declinedPicks, earnedFeatures: earnedRef.current, pathFeatures,
          allowed: (item) => !item.labs && pickableAvailable(item, { plusOnSale, socialOn }),
        });
        earnedRef.current = [];
        const used = !!suggest && (getPickable(suggest)?.features || []).some(f => usedToolsRef.current.has(f));
        usedToolsRef.current = new Set();
        if (suggest) setStageEvents(q => (q.some(e => e.suggest) ? q : [...q, { suggest, used, from: seen, to: derivedStage }]));
      } else if (Number.isFinite(seen) && derivedStage > seen && experienceMode === 'auto') {
        // What is actually new, not just what the stage lists: what someone
        // came for opens tools early (AIM_OPENS), so a stage can "add" the
        // Planner to an account that has used it since day one. The card
        // says only what's new, and offers to go there.
        const before = openedAt(persona, seen, { exploring, aim: purposeKey });
        const after = openedAt(persona, derivedStage, { exploring, aim: purposeKey });
        const fresh = {
          features: [...after.features].filter(id => !before.features.has(id)),
          games: [...after.games].filter(id => !before.games.has(id)),
          widgets: after.homeWidgets.filter(k => !before.homeWidgets.includes(k)),
          caps: [...after.caps].filter(id => !before.caps.has(id)),
        };
        const event = { from: seen, to: derivedStage, stages: stagesBetween(persona, seen, derivedStage), fresh };
        // Still unseen? Then it's the same moment: one card for both. Claiming
        // a goal opens a stage, and the level it gives can open the next one
        // a second later, which used to be two cards.
        setStageEvents(q => (q.length ? [...q.slice(0, -1), mergeStageEvents(q[q.length - 1], event)] : [event]));
        // Screens with noticeably more on them teach themselves again.
        const again = reteachBetween(persona, seen, derivedStage);
        if (again.length) forgetSeenScreens(again);
      }
      if (!Number.isFinite(seen) || derivedStage > seen) {
        try { await AsyncStorage.setItem(seenStageKey(userId), String(derivedStage)); } catch {}
      }
    })();
    return () => { alive = false; };
  }, [userId, progressReady, prefsReady, derivedStage, experienceMode, persona, exploring, purposeKey, picks, declinedPicks, plusOnSale, socialOn]);

  const dismissStageEvent = useCallback(() => setStageEvents(q => q.slice(1)), []);

  // What the goal in flight opens is always on the map: the Compass says
  // "this opens the Weekly Review", so the Weekly Review has to be somewhere
  // you can see it, lock and all.
  const activeGoalId = useMemo(() => {
    const row = Object.entries(state.objectives || {}).find(([, r]) => r.status === 'active');
    return row ? row[0] : null;
  }, [state.objectives]);
  // On the map whatever the stage: what the goal in flight will open, and
  // every tool a goal's steps send someone to — the active goal's (its
  // "Open" button has to land somewhere) and every finished one's (nothing
  // somebody worked for disappears). "Show Your Work" had a builder save to
  // the Knowledge Vault, then the Vault vanished from the Library the moment
  // the goal was done, taking the note with it (found 2026-10-08).
  const goalUnlocks = useMemo(() => {
    const ids = new Set(activeGoalId ? featuresUnlockedBy(activeGoalId).map(f => f.id) : []);
    const finished = Object.values(state.objectives || {}).filter(o => o.status === 'completed').map(o => o.objective_id);
    [activeGoalId, ...finished].filter(Boolean).forEach(id => (getObjective(id)?.steps || []).forEach(st => {
      const tool = st.screen && featureForScreen(st.screen);
      if (tool) ids.add(tool.id);
    }));
    return ids;
  }, [activeGoalId, state.objectives]);

  // Just the goal in flight's tools: these show even if unticked, until the
  // goal is done (featureShownAtStage).
  const activeTools = useMemo(() => {
    const ids = new Set();
    (getObjective(activeGoalId)?.steps || []).forEach(st => {
      const tool = st.screen && featureForScreen(st.screen);
      if (tool) ids.add(tool.id);
    });
    return ids;
  }, [activeGoalId]);
  const experience = useMemo(() => ({ opened, goalUnlocks, activeTools }), [opened, goalUnlocks, activeTools]);
  // Picking a tool is choosing it: a picked tool that normally waits for a
  // goal opens the same way "Open it now" does. The goal is still there.
  const openChoices = useMemo(() => {
    if (!picks?.length) return chosen;
    const ids = new Set(chosen);
    picks.forEach(id => (getPickable(id)?.features || []).forEach(f => { if (getFeature(f)?.gate === 'locked') ids.add(f); }));
    return ids;
  }, [chosen, picks]);

  // Ticking and unticking on "Pick your features" (onboarding and Make it
  // yours). Labs is one switch: ticking it is the experimental opt-in. The
  // Lesson Builder is too: ticking it is Educator Mode, which used to be a
  // second switch in Settings that had to be on as well.
  const setPicks = useCallback(async (list) => {
    const next = PICKABLE_IDS.filter(id => list.includes(id));
    setPicksOverride(next);
    const labsOn = next.includes('labs');
    const labsWas = (picks || []).includes('labs');
    if (labsOn !== labsWas) {
      setExperimentalOverride(labsOn);
      if (userId) setExperimentalOptIn(userId, labsOn).catch(() => {});
    }
    const teachOn = next.includes('lesson-builder');
    if (teachOn !== (picks || []).includes('lesson-builder')) setDoorSetting('educatorMode', teachOn);
    await persistStart({ picks: next });
  }, [persistStart, picks, userId, setDoorSetting]);
  const addPick = useCallback((id) => setPicks([...(picks || []), id]), [setPicks, picks]);
  const declinePick = useCallback(async (id) => {
    const next = [...new Set([...declinedPicks, id])];
    setDeclinedOverride(next);
    if (userId) await saveStartChoices(userId, { picks_declined: next });
  }, [declinedPicks, userId]);

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
    settings: doorSettings,
    chosen: openChoices,
    plusOnSale,
    socialOn,
    experience,
  }), [profile, experimentalOn, purposeKey, state, stats, doorSettings, openChoices, plusOnSale, socialOn, experience]);

  const accessFor = useCallback(
    (featureId) => evaluateAccess(getFeature(featureId), gateCtx),
    [gateCtx]
  );

  // Notices (src/logic/noticeStore.js) skip anything whose button leads to a
  // screen this account hasn't opened yet.
  useEffect(() => {
    setNoticeScreenGate((screen) => {
      const feature = featureForScreen(screen);
      return !feature || evaluateAccess(feature, gateCtx).available;
    });
  }, [gateCtx]);

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
    if (!socialOn && SOCIAL_SCREENS.includes(screen)) return false;
    const feature = featureForScreen(screen);
    if (feature) return !evaluateAccess(feature, gateCtx).hidden;
    return screenShownAtStage(screen, { opened, featureShown: isFeatureShown });
  }, [gateCtx, opened, isFeatureShown, socialOn]);

  // Null = every game the remote switches allow. Before 'all-games' it's
  // the ones this path has opened.
  const visibleGameIds = useMemo(() => visibleGameIdsFor(opened), [opened]);
  const isGameVisible = useCallback(
    (gameId) => isGameAllowed(gameId) && (!visibleGameIds || visibleGameIds.has(gameId)),
    [visibleGameIds, isGameAllowed]
  );
  const visibleFabActions = useMemo(() => fabActionsFor(opened), [opened]);

  // The games this account can play right now, for daily drills: a drill is
  // only ever set (or kept) if one of these counts toward it. See
  // src/logic/drills.js and UserProgressContext.setPlayableGames.
  const playableGames = useMemo(
    () => getEnabledGames()
      .filter(g => isGameVisible(g.id))
      .map(g => ({ id: g.id, title: g.name, subject: g.subject })),
    [isGameVisible]
  );
  // Only once the stage is settled (progress, device prefs and the profile
  // type all in): for a moment on launch every game reads as visible, and
  // drills set against that would include locked ones.
  const stageSettled = progressReady && prefsReady && !!persona;
  useEffect(() => {
    if (!loading && stageSettled && playableGames.length) setPlayableGames?.(playableGames);
  }, [loading, stageSettled, playableGames, setPlayableGames]);

  // Class subjects: an adult track is an age question (1); another type's
  // track is a map question (3) that 'all-tools' answers.
  const isSubjectVisible = useCallback((subject) => {
    if (!isContentAllowed(subject)) return false;
    if (!subject?.personas || (persona && subject.personas.includes(persona))) return true;
    return can('all-tools');
  }, [isContentAllowed, persona, can]);

  const nextStage = useMemo(
    () => (experienceMode !== 'auto' ? null : nextStageNeeds({ stage: derivedStage, persona, aim: purposeKey, exploring })),
    [derivedStage, persona, experienceMode, purposeKey, exploring]
  );

  const activeObjectiveId = activeGoalId;

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
    const res = await startObjectiveApi(userId, objectiveId);

    // Steps marked `have` (objectives.js) tick themselves when the person
    // already has the thing: a later goal asking to "plant an idea" and
    // "start a project" shouldn't make someone with a planned project redo
    // both. Checked once, here; after that the step's signal does the work.
    const wants = objective.steps.filter(st => st.have);
    if (wants.length && !res?.error) {
      try {
        const has = await alreadyHas(wants.map(st => st.have));
        const credit = wants.filter(st => has.has(st.have));
        if (credit.length) {
          const steps = { ...latestSteps(objectiveId) };
          credit.forEach(st => { steps[st.id] = true; });
          stepsRef.current = { ...stepsRef.current, [objectiveId]: steps };
          applyLocal(prev => ({
            ...prev,
            objectives: { ...prev.objectives, [objectiveId]: { ...prev.objectives[objectiveId], steps } },
          }));
          await saveObjectiveSteps(userId, objectiveId, steps);
        }
      } catch (e) { console.warn('[access] credit existing work', e?.message); }
    }
    return res;
  }, [userId, applyLocal, state.objectives]);

  // The first goal for what the person came for (their purpose), or for
  // their profile type when they never said — with that type's purpose set
  // alongside it if there isn't one yet. Called by onboarding and by Home's
  // Compass card.
  //
  // Onboarding passes the type and aim it just picked: it calls this before
  // the master profile exists and before the purpose it just wrote has come
  // back on the profile, and the plan has to be the chosen one.
  //
  // A guest gets the one first goal that needs no account (GUEST_FIRST_GOAL):
  // the others all send someone to the Planner, which a guest can't open.
  const firstGoal = useMemo(
    () => (userId ? firstGoalFor(persona, purposeKey) : GUEST_FIRST_GOAL),
    [userId, persona, purposeKey],
  );
  const startFirstGoal = useCallback(async (forPersona, forPurpose) => {
    const aim = forPurpose || purposeKey;
    const goal = userId && (forPersona || forPurpose) ? firstGoalFor(forPersona || persona, aim) : firstGoal;
    if (!aim && goal.purpose) await choosePurpose(goal.purpose);
    return startObjective(goal.objective);
  }, [userId, persona, purposeKey, firstGoal, choosePurpose, startObjective]);

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

    const current = latestSteps(activeObjectiveId);
    // A counted step (objectives.js `signalCount`) stores a running number,
    // so "tick it by hand" means jump to done rather than flip a flag.
    const steps = { ...current, [stepId]: target.done ? false : true };
    if (!steps[stepId]) delete steps[stepId];
    else tapHaptic();
    stepsRef.current = { ...stepsRef.current, [activeObjectiveId]: steps };

    applyLocal(prev => ({
      ...prev,
      objectives: {
        ...prev.objectives,
        [activeObjectiveId]: { ...prev.objectives[activeObjectiveId], steps },
      },
    }));

    if (userId) await saveObjectiveSteps(userId, activeObjectiveId, steps);
  }, [activeObjectiveId, state, stats, userId, applyLocal]);

  // "The person just did X." Ticks any step of the goal in flight that says
  // doing X is what finishes it (objectives.js `signal`), so a step gets done
  // by doing the thing rather than by remembering to tick a box afterwards.
  // `detail` narrows it: 'area-rated' with { area: 'financial' } also
  // matches a step whose signal is 'area-rated:financial'. A step needing
  // several occurrences (objectives.js `signalCount`) keeps a count instead
  // of a flag until it gets there.
  // `times` is for a batch — processing six inbox items at once is six
  // occurrences, and six separate calls in one tick would each read the same
  // pre-batch count and land as one.
  const signalAction = useCallback(async (name, detail = {}, { times = 1 } = {}) => {
    if (name) lastDetailRef.current[name] = detail;
    if (!activeObjectiveId || !name) return;
    const objective = getObjective(activeObjectiveId);
    const names = new Set([name, ...Object.values(detail).map(v => `${name}:${v}`)]);
    const current = latestSteps(activeObjectiveId);
    const hits = (objective?.steps || []).filter(step => (
      step.signal && names.has(step.signal) && current[step.id] !== true
        && !(typeof current[step.id] === 'number' && current[step.id] >= signalTarget(step))
    ));
    if (!hits.length) return;
    const steps = { ...current };
    hits.forEach(step => {
      // Steps that need the thing done more than once (objectives.js
      // `signalCount`, e.g. "capture five things") keep a count; everything
      // else is a flag, the way it has always been.
      const target = signalTarget(step);
      if (target <= 1) { steps[step.id] = true; return; }
      const next = (typeof current[step.id] === 'number' ? current[step.id] : 0) + Math.max(1, times);
      steps[step.id] = next >= target ? true : next;
    });
    stepsRef.current = { ...stepsRef.current, [activeObjectiveId]: steps };
    applyLocal(prev => ({
      ...prev,
      objectives: {
        ...prev.objectives,
        [activeObjectiveId]: { ...prev.objectives[activeObjectiveId], steps },
      },
    }));
    if (userId) await saveObjectiveSteps(userId, activeObjectiveId, steps);
  }, [activeObjectiveId, state.objectives, userId, applyLocal]);

  // Ticking a Planner item off, from wherever it was ticked (plannerService
  // completeInstance), is the 'planner-item-done' signal: "Tick off something
  // you planned". The detail is its area, so 'planner-item-done:physical'
  // works the same way 'planner-item-added:physical' does.
  const signalRef = useRef(signalAction);
  signalRef.current = signalAction;
  useEffect(() => onPlanDone(row => {
    signalRef.current('planner-item-done', row?.area ? { area: row.area } : {});
  }), []);

  const completeActiveObjective = useCallback(async () => {
    if (!activeObjectiveId) return { error: new Error('Nothing active') };
    const objective = getObjective(activeObjectiveId);
    const unlockIds = objective?.unlocks || [];

    // "Just my picks": a goal's steps can send someone into a tool they
    // didn't pick (a study block in the Planner). It shows while the goal
    // runs, then hides again the moment the goal is done, work and all. So
    // those tools are the first thing the end-of-goal card offers to keep,
    // ahead of anything new. Still only on a yes.
    if (trackRef.current === 'picks') {
      const used = (objective?.steps || []).map(st => st.screen && featureForScreen(st.screen)?.id).filter(Boolean);
      usedToolsRef.current = new Set(used);
      earnedRef.current = [...new Set([...used, ...earnedRef.current])];
    }

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
    // A path's unit pays as a unit (100), not as a goal (shake-up P6, §6.1).
    recordAction(getObjective(activeObjectiveId)?.unit ? 'unit_done' : 'goal_done', activeObjectiveId);
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
    dismissAllUnlockEvents,

    // 1. allowed
    age,
    isContentAllowed,
    isGameAllowed,

    // 2. doors that aren't server state
    doorSettings,
    setDoorSetting,
    openByChoice,
    plusOnSale,
    socialOn,

    // 3. shown now
    stage,
    persona, // the account type, for the stage path (experienceStage.pathFor)
    derivedStage,
    nextStage,
    experienceMode,
    setExperienceMode,
    picks,
    setPicks,
    addPick,
    declinePick,
    opened,
    can,
    firstGoalId: firstGoal.objective,
    lastSignalDetail,
    startFirstGoal,
    isFeatureShown,
    isScreenVisible,
    isGameVisible,
    isSubjectVisible,
    visibleGameIds,
    playableGames,
    visibleFabActions,
    stageEvents,
    dismissStageEvent,
    signalAction,

    refresh,
    stats,
  }), [
    loading, state.ready, purposeKey, purpose, suggestedPurposeKey, choosePurpose,
    isPlus, experimentalOn, setExperimental, accessFor, isOpen, rankedFeatures,
    activeObjective, activeObjectiveId, completedObjectiveIds, startObjective,
    toggleStep, completeActiveObjective, abandonActiveObjective, submitTest,
    claimPlanFeature, unlockEvents, dismissUnlockEvent, dismissAllUnlockEvents,
    age, isContentAllowed, isGameAllowed, doorSettings, setDoorSetting, openByChoice, plusOnSale, socialOn,
    stage, derivedStage, nextStage, persona, experienceMode, setExperienceMode, picks, setPicks, addPick, declinePick, opened, can,
    firstGoal, startFirstGoal, isFeatureShown, isScreenVisible, isGameVisible,
    isSubjectVisible, visibleGameIds, playableGames, visibleFabActions, stageEvents, dismissStageEvent,
    signalAction,
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
