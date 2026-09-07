// context/UserProgressContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../src/api/supabaseClient';
import * as gamificationService from '../src/logic/gamificationService';

/* ============================================
   RANK SYSTEM
============================================ */

const rankThresholds = [
  { rank: 1, threshold: 32650 },
  { rank: 2, threshold: 27925 },
  { rank: 3, threshold: 23675 },
  { rank: 4, threshold: 19875 },
  { rank: 5, threshold: 16500 },
  { rank: 6, threshold: 13550 },
  { rank: 7, threshold: 11000 },
  { rank: 8, threshold: 8800 },
  { rank: 9, threshold: 6900 },
  { rank: 10, threshold: 5300 },
  { rank: 11, threshold: 3975 },
  { rank: 12, threshold: 2900 },
  { rank: 13, threshold: 2050 },
  { rank: 14, threshold: 1400 },
  { rank: 15, threshold: 925 },
  { rank: 16, threshold: 575 },
  { rank: 17, threshold: 325 },
  { rank: 18, threshold: 150 },
  { rank: 19, threshold: 50 },
  { rank: 20, threshold: 0 },
];

const getRank = (points = 0) =>
  rankThresholds.find(r => points >= r.threshold)?.rank || 20;

/* ============================================
   SUBJECT CONFIG
============================================ */

export const SUBJECT_CONFIG = {
  math: { name: 'Math', icon: '🔢', color: '#3B82F6' },
  language_arts: { name: 'Language Arts', icon: '📚', color: '#8B5CF6' },
  science: { name: 'Science', icon: '🔬', color: '#10B981' },
  general: { name: 'General', icon: '⭐', color: '#6366F1' },
};

/* ============================================
   HELPERS
============================================ */

const normalizeMission = row => ({
  id: row.id,
  type: row.type,
  status: row.status,
  subject: row.subject,
  title: row.missions?.title,
  description: row.missions?.description,
  progress: row.current_value || 0,
  target: row.target_value || 0,
  criteriaType: row.missions?.criteria?.type,
  reward: {
    xp: row.missions?.xp_reward || 0,
    points: row.missions?.point_reward || 0,
  },
});

/* ============================================
   CONTEXT
============================================ */

const UserProgressContext = createContext(null);

export function UserProgressProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [subjectProgress, setSubjectProgress] = useState({});
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMissions, setWeeklyMissions] = useState([]);
  const [longtermMissions, setLongtermMissions] = useState([]);

  /* ============================================
     AUTH
  ============================================ */

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const u = session?.user || null;
        setUser(u);
        if (u) await loadUserData(u.id);
        else resetState();
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
  }

  /* ============================================
     LOAD USER DATA (FIXED) ✅
  ============================================ */

  async function loadUserData(userId) {
    setLoading(true);

    try {
      // 1. Expire old missions first
      await gamificationService.expireOldMissions(userId);

      // 2. Load profile
      const { data } = await gamificationService.getUserProfile(userId);
      if (!data) return;

      setProfile(data);

      // 3. Set subject progress
      if (data.subject_progress) {
        const map = {};
        data.subject_progress.forEach(sp => (map[sp.subject] = sp));
        setSubjectProgress(map);
      }

      // 4. Ensure missions exist AND fetch them (FIXED ORDER)
      await ensureMissionsExist(userId, data);

    } catch (err) {
      console.error('[UserProgressContext]', err);
    }

    setLoading(false);
  }

  /* ============================================
     ENSURE MISSIONS EXIST (FIXED) ✅
  ============================================ */

  async function ensureMissionsExist(userId, profileData) {
    const subjects =
      profileData?.topics?.split(',') || ['math', 'language_arts', 'science'];

    // Check if daily missions exist
    const { data: existingDaily } = await gamificationService.getUserMissions(
      userId,
      'daily',
      'active'
    );

    // Generate if missing
    if (!existingDaily?.length) {
      console.log('⚠️ No daily missions found, generating...');
      await gamificationService.generateDailyMissions(userId, subjects);
    }

    // Check if weekly missions exist
    const { data: existingWeekly } = await gamificationService.getUserMissions(
      userId,
      'weekly',
      'active'
    );

    // Generate if missing
    if (!existingWeekly?.length) {
      console.log('⚠️ No weekly missions found, generating...');
      await gamificationService.generateWeeklyMissions(userId, subjects);
    }

    // ✅ FETCH ALL ACTIVE MISSIONS AFTER GENERATION
    const { data: freshMissions } = await gamificationService.getUserMissions(
      userId,
      null,
      'active'
    );

    console.log('📦 Fetched missions:', freshMissions?.length || 0);

    // ✅ NORMALIZE AND SET STATE
    const normalized = (freshMissions || []).map(normalizeMission);

    const dailyFiltered = normalized.filter(m => m.type === 'daily');
    const weeklyFiltered = normalized.filter(m => m.type === 'weekly');
    const longtermFiltered = normalized.filter(m => m.type === 'longterm');

    console.log('✅ Setting missions - Daily:', dailyFiltered.length, 'Weekly:', weeklyFiltered.length);

    setDailyMissions(dailyFiltered);
    setWeeklyMissions(weeklyFiltered);
    setLongtermMissions(longtermFiltered);
  }

  /* ============================================
     REFRESH (SAFE)
  ============================================ */

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

  /* ============================================
     CONTEXT VALUE
  ============================================ */

  return (
    <UserProgressContext.Provider
      value={{
        user,
        profile,
        loading,
        subjectProgress,
        dailyMissions,
        weeklyMissions,
        longtermMissions,
        refreshDailyMissions,
        refreshWeeklyMissions,
        points: profile?.points || 0,
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        rank: getRank(profile?.points || 0),
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const ctx = useContext(UserProgressContext);
  if (!ctx) {
    throw new Error('useUserProgress must be used inside UserProgressProvider');
  }
  return ctx;
}