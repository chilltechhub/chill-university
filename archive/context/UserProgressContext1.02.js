// context/UserProgressContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../src/api/supabaseClient';
import * as gamificationService from '../src/logic/gamificationService';
import { getRank, getRankProgress } from '../src/logic/rankUtils';

/* ─── Subject config ───────────────────────────────────────────────────────── */
export const SUBJECT_CONFIG = {
  math:         { name: 'Math',         icon: '🔢', color: '#3B82F6' },
  language_arts:{ name: 'Language Arts', icon: '📚', color: '#8B5CF6' },
  science:      { name: 'Science',       icon: '🔬', color: '#10B981' },
  general:      { name: 'General',       icon: '⭐', color: '#6366F1' },
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
  }

  // ── Load user data ───────────────────────────────────────────────────────
  async function loadUserData(userId) {
    setLoading(true);
    try {
      await gamificationService.expireOldMissions(userId);

      const { data } = await gamificationService.getUserProfile(userId);
      if (!data) return;

      setProfile(data);

      if (data.subject_progress) {
        const map = {};
        data.subject_progress.forEach(sp => (map[sp.subject] = sp));
        setSubjectProgress(map);
      }

      // Build gameplay stats from subject_progress
      if (data.subject_progress) {
        const totals = data.subject_progress.reduce(
          (acc, sp) => ({
            totalProblemsAttempted: acc.totalProblemsAttempted + (sp.questions_answered || 0),
            totalProblemsCorrect:   acc.totalProblemsCorrect   + (sp.correct_answers    || 0),
            levelsCompleted:        acc.levelsCompleted,
          }),
          { totalProblemsAttempted: 0, totalProblemsCorrect: 0, levelsCompleted: 0 }
        );
        setGameplayStats(totals);
      }

      await ensureMissionsExist(userId, data);
    } catch (err) {
      console.error('[UserProgressContext]', err);
    }
    setLoading(false);
  }

  // ── Ensure + fetch missions ──────────────────────────────────────────────
  async function ensureMissionsExist(userId, profileData) {
    const subjects = profileData?.topics?.split(',') || ['math', 'language_arts', 'science'];

    const { data: existingDaily  } = await gamificationService.getUserMissions(userId, 'daily',  'active');
    if (!existingDaily?.length)  await gamificationService.generateDailyMissions(userId, subjects);

    const { data: existingWeekly } = await gamificationService.getUserMissions(userId, 'weekly', 'active');
    if (!existingWeekly?.length) await gamificationService.generateWeeklyMissions(userId, subjects);

    const { data: fresh } = await gamificationService.getUserMissions(userId, null, 'active');
    const normalized = (fresh || []).map(normalizeMission);

    setDailyMissions(   normalized.filter(m => m.type === 'daily'));
    setWeeklyMissions(  normalized.filter(m => m.type === 'weekly'));
    setLongtermMissions(normalized.filter(m => m.type === 'longterm'));
  }

  // ── Guest game event (local only) ────────────────────────────────────────
  function recordGuestEvent({ correct = false, difficulty = 1 } = {}) {
    setGuestPoints(p => p + (correct ? 5 : 1));
    setGuestXp(x    => x + (correct ? 10 : 2));
  }

  // ── Refresh helpers ──────────────────────────────────────────────────────
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

  // Streak: days since last_active_date
  const streakDays = (() => {
    if (!profile?.last_active_date) return 0;
    const last = new Date(profile.last_active_date);
    const today = new Date();
    const diff = Math.floor((today - last) / 86400000);
    return diff === 0 ? (profile?.streak_count || 1) : 0;
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
        // refresh
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
