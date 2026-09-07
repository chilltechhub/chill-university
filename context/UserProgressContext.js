// context/UserProgressContext.js
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../src/api/supabaseClient';
import * as gamificationService from '../src/logic/gamificationService';
import { getRank, getRankProgress, getRankLabel } from '../src/logic/rankUtils';
import { getLevelUnlocks, getRankUnlocks, getPointUnlocks } from '../src/logic/unlockUtils';
import { cacheRead, cacheWrite, isOnline } from '../src/api/offlineCache';
import { todayStr, daysBetween } from '../src/logic/dateUtils';

/* ─── Subject config ───────────────────────────────────────────────────────── */
export const SUBJECT_CONFIG = {
  math:           { name: 'Math',              icon: '🔢', color: '#3B82F6' },
  language_arts:  { name: 'Language Arts',     icon: '📚', color: '#8B5CF6' },
  science:        { name: 'Science',           icon: '🔬', color: '#10B981' },
  health:         { name: 'Health',            icon: '💪', color: '#e05858' },
  finance:        { name: 'Finance',           icon: '💰', color: '#c9a84c' },
  home_ec:        { name: 'Home Ec',           icon: '🧰', color: '#e0a830' },
  social_studies: { name: 'Social Studies',    icon: '🌍', color: '#F59E0B' },
  arts:           { name: 'Art & Music',       icon: '🎨', color: '#EC4899' },
  technology:     { name: 'Technology',        icon: '💻', color: '#5A80E8' },
  foreign_language:{ name: 'Foreign Language', icon: '🗣️', color: '#14B8A6' },
  mental:         { name: 'Mental Wellness',   icon: '🧠', color: '#8B5CF6' },
  social_skills:  { name: 'Social & Relationships', icon: '🤝', color: '#22C55E' },
  career:         { name: 'Career & Life Skills', icon: '🧭', color: '#84CC16' },
  general:        { name: 'General',           icon: '⭐', color: '#6366F1' },
};

/* ─── Mission normaliser ───────────────────────────────────────────────────── */
const normalizeMission = row => ({
  id:           row.id,
  type:         row.type,
  status:       row.status,
  subject:      row.subject,
  title:        row.missions?.title,
  description:  row.missions?.description,
  progress:     row.current_value  || 0,
  target:       row.target_value   || 0,
  criteriaType: row.missions?.criteria?.type,
  reward: {
    xp:     row.missions?.xp_reward     || 0,
    points: row.missions?.point_reward  || 0,
  },
});

/* ─── Context ──────────────────────────────────────────────────────────────── */
const UserProgressContext = createContext(null);

export function UserProgressProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Guest local state (not persisted)
  const [guestPoints, setGuestPoints] = useState(0);
  const [guestXp,     setGuestXp]     = useState(0);

  const [subjectProgress,   setSubjectProgress]   = useState({});
  const [dailyMissions,     setDailyMissions]     = useState([]);
  const [weeklyMissions,    setWeeklyMissions]    = useState([]);
  const [longtermMissions,  setLongtermMissions]  = useState([]);
  const [gameplayStats,     setGameplayStats]     = useState(null);

  // ── Level-up / rank-up notification queue ────────────────────────────────
  // A queue (not a single value) since one profile refresh — e.g. right
  // after finishing a game session — can cross a level threshold AND a
  // rank threshold at once; the notification shows them one at a time.
  // `null` refs mean "haven't seen a real profile yet" — the very first
  // load after login must NOT fire a notification just for going from
  // nothing to whatever level/rank the account already sits at.
  const [progressEvents, setProgressEvents] = useState([]);
  const prevLevelRef  = useRef(null);
  const prevRankRef   = useRef(null);
  const prevPointsRef = useRef(null);

  function checkProgressEvents(data) {
    const newLevel  = data.level  || 1;
    const newPoints = data.points || 0;
    const newRank   = getRank(newPoints);

    const prevLevel  = prevLevelRef.current;
    const prevRank   = prevRankRef.current;
    const prevPoints = prevPointsRef.current;

    if (prevLevel != null) {
      const events = [];
      if (newLevel > prevLevel) {
        const unlocks = [
          ...getLevelUnlocks(prevLevel, newLevel),
          ...getPointUnlocks(prevPoints ?? newPoints, newPoints),
        ];
        events.push({ type: 'level', from: prevLevel, to: newLevel, unlocks });
      }
      if (newRank < prevRank) {
        events.push({
          type: 'rank', from: prevRank, to: newRank,
          rankLabel: getRankLabel(newRank),
          unlocks: getRankUnlocks(prevRank, newRank),
        });
      }
      if (events.length) setProgressEvents(q => [...q, ...events]);
    }

    prevLevelRef.current  = newLevel;
    prevRankRef.current   = newRank;
    prevPointsRef.current = newPoints;
  }

  const dismissProgressEvent = useCallback(() => {
    setProgressEvents(q => q.slice(1));
  }, []);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const u = session?.user || null;
        setUser(u);
        if (u) await loadUserData(u.id);
        else     resetState();
      }
    );

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadUserData(data.session.user.id);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function resetState() {
    setProfile(null);
    setSubjectProgress({});
    setDailyMissions([]);
    setWeeklyMissions([]);
    setLongtermMissions([]);
    setGameplayStats(null);
    setProgressEvents([]);
    prevLevelRef.current = null;
    prevRankRef.current = null;
    prevPointsRef.current = null;
  }

  // ── Load user data ───────────────────────────────────────────────────────
  // Cache-first: a cached profile/missions pair (from the last time this
  // device was online) renders immediately regardless of connectivity, so
  // TopBar/Home/etc. never go blank on a cold offline launch. Anything that
  // *writes* (expiring missions, generating new ones) only runs when online
  // — those need a live connection, and skipping them offline is silent and
  // safe (they just run next time loadUserData() succeeds online).
  function applyProfile(data) {
    checkProgressEvents(data);
    setProfile(data);
    if (data.subject_progress) {
      const map = {};
      data.subject_progress.forEach(sp => (map[sp.subject] = sp));
      setSubjectProgress(map);
    }
  }

  function applyMissions(normalized) {
    setDailyMissions(   normalized.filter(m => m.type === 'daily'));
    setWeeklyMissions(  normalized.filter(m => m.type === 'weekly'));
    setLongtermMissions(normalized.filter(m => m.type === 'longterm'));
  }

  async function loadUserData(userId) {
    setLoading(true);
    const profileCacheKey  = `profile_${userId}`;
    const missionsCacheKey = `missions_${userId}`;
    try {
      const cachedProfile = await cacheRead(profileCacheKey);
      if (cachedProfile) applyProfile(cachedProfile);
      const cachedMissions = await cacheRead(missionsCacheKey);
      if (cachedMissions) applyMissions(cachedMissions);

      if (!(await isOnline())) {
        // A stale-but-real cached profile beats a blank screen — that's as
        // far as we can safely go without a connection.
        setLoading(false);
        return;
      }

      await gamificationService.expireOldMissions(userId);

      const { data } = await gamificationService.getUserProfile(userId);
      if (!data) { setLoading(false); return; }

      // Log today's visit *before* the profile reaches state, so the streak
      // that renders is already today's rather than one launch behind.
      // Idempotent per day — a no-op (and no write) if today is already
      // recorded, so this costs nothing on a refresh or a second launch.
      // Nothing called this before, which is why every user's streak sat at 0
      // permanently; see gamificationService.touchStreak.
      let profileData = data;
      try {
        const streakPatch = await gamificationService.touchStreak(userId, data);
        if (streakPatch) profileData = { ...data, ...streakPatch };
      } catch (e) { console.warn('[touchStreak]', e?.message); }

      await cacheWrite(profileCacheKey, profileData);
      applyProfile(profileData);

      // Build gameplay stats — totals from subject_progress + timing from activity_log
      if (data.subject_progress) {
        const totals = data.subject_progress.reduce(
          (acc, sp) => ({
            totalProblemsAttempted: acc.totalProblemsAttempted + (sp.questions_answered || 0),
            totalProblemsCorrect:   acc.totalProblemsCorrect   + (sp.correct_answers    || 0),
            levelsCompleted:        acc.levelsCompleted,
          }),
          { totalProblemsAttempted: 0, totalProblemsCorrect: 0, levelsCompleted: 0 }
        );

        // Pull timing stats from activity_log
        try {
          const { data: logs } = await supabase
            .from('activity_log')
            .select('activity_type, metadata')
            .eq('user_id', userId)
            .in('activity_type', ['GAME_COMPLETED']);

          if (logs?.length) {
            const avgTimes = logs.map(l => l.metadata?.avgResponseMs).filter(Boolean);
            const fastest  = logs.map(l => l.metadata?.fastestMs).filter(Boolean);
            totals.avgTime     = avgTimes.length ? (avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length / 1000).toFixed(1) : null;
            totals.fastestTime = fastest.length  ? (Math.min(...fastest) / 1000).toFixed(1) : null;
            totals.levelsCompleted = logs.length;
          }
        } catch {}

        setGameplayStats(totals);
      }

      const missions = await ensureMissionsExist(userId, data);
      if (missions) await cacheWrite(missionsCacheKey, missions);
    } catch (err) {
      console.error('[UserProgressContext]', err);
    }
    setLoading(false);
  }

  // ── Ensure + fetch missions ──────────────────────────────────────────────
  async function ensureMissionsExist(userId, profileData) {
    // profiles.topics is written as an ARRAY by both onboarding flows, but this
    // read assumed a comma string — and `.split` on an array throws, which the
    // caller's try/catch swallowed. Net effect: for anyone who actually picked
    // topics during onboarding, mission generation silently never ran. Handle
    // both shapes, since older rows may still hold a string.
    const rawTopics = profileData?.topics;
    const subjects = (Array.isArray(rawTopics)
      ? rawTopics
      : typeof rawTopics === 'string' ? rawTopics.split(',') : []
    ).map(s => String(s).trim()).filter(Boolean);
    const finalSubjects = subjects.length ? subjects : ['math', 'language_arts', 'science'];

    const { data: existingDaily  } = await gamificationService.getUserMissions(userId, 'daily',  'active');
    if (!existingDaily?.length)  await gamificationService.generateDailyMissions(userId, finalSubjects);

    const { data: existingWeekly } = await gamificationService.getUserMissions(userId, 'weekly', 'active');
    if (!existingWeekly?.length) await gamificationService.generateWeeklyMissions(userId, finalSubjects);

    const { data: fresh } = await gamificationService.getUserMissions(userId, null, 'active');
    const normalized = (fresh || []).map(normalizeMission);

    applyMissions(normalized);
    return normalized;
  }

  // ── Guest game event (local only) ────────────────────────────────────────
  function recordGuestEvent({ correct = false, difficulty = 1 } = {}) {
    setGuestPoints(p => p + (correct ? 5 : 1));
    setGuestXp(x    => x + (correct ? 10 : 2));
  }

  // ── Refresh helpers ──────────────────────────────────────────────────────
  // Re-pulls profiles from Supabase into this context's `profile`. Anything
  // that writes to `profiles` from outside this context (onboarding's
  // finish(), Settings' name/crest edits reaching here some other way,
  // etc.) needs this — otherwise the row in the DB is correct but every
  // screen reading `profile` from here keeps showing what was loaded at
  // login until something forces a remount.
  async function refreshProfile() {
    if (!user) return;
    await loadUserData(user.id);
  }

  async function refreshDailyMissions() {
    if (!user) return;
    await gamificationService.expireOldMissions(user.id);
    await loadUserData(user.id);
  }

  async function refreshWeeklyMissions() {
    if (!user) return;
    await gamificationService.expireOldMissions(user.id);
    await loadUserData(user.id);
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const points  = user ? (profile?.points  || 0) : guestPoints;
  const xp      = user ? (profile?.xp      || 0) : guestXp;
  const level   = profile?.level  || 1;
  const rank    = getRank(points);
  const { progress: rankProgress } = getRankProgress(points);

  // Streak: how many consecutive days the user has shown up, or 0 once the
  // run is actually broken.
  //
  // Two things were wrong here before. `new Date('2026-09-05')` parses as UTC
  // midnight, so comparing it against a local `new Date()` was off by a day in
  // every negative-offset timezone. And a gap of one day returned 0 — meaning
  // a 40-day streak rendered as "no streak" from local midnight until whatever
  // moment that day's activity was written, so users watched their streak
  // vanish every single morning. A run isn't broken until a full day has been
  // missed, and the badge should keep showing through that grace day; that's
  // also the day the "streak at risk" reminder is for.
  const streakDays = (() => {
    if (!profile?.last_active_date) return 0;
    const gap = daysBetween(String(profile.last_active_date).slice(0, 10), todayStr());
    if (gap === null || gap < 0) return profile?.streak_count || 0;
    if (gap === 0) return profile?.streak_count || 1;  // active today
    if (gap === 1) return profile?.streak_count || 0;  // yesterday — alive, at risk
    return 0;                                          // missed a full day
  })();

  // progress % toward next rank (for TopBar progress bar)
  const progress = rankProgress;

  return (
    <UserProgressContext.Provider
      value={{
        user,
        profile,
        loading,
        // points / xp
        points,
        xp,
        level,
        // rank
        rank,
        rankProgress,
        progress,         // alias for TopBar
        // streak
        streakDays,
        // missions
        subjectProgress,
        dailyMissions,
        weeklyMissions,
        longtermMissions,
        // gameplay
        gameplayStats,
        // level-up / rank-up notification queue
        progressEvents,
        dismissProgressEvent,
        // refresh
        refreshProfile,
        refreshDailyMissions,
        refreshWeeklyMissions,
        // guest
        recordGuestEvent,
        pendingRewards: [],   // placeholder — wire to real data when ready
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const ctx = useContext(UserProgressContext);
  if (!ctx) throw new Error('useUserProgress must be inside UserProgressProvider');
  return ctx;
}
