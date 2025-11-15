// src/context/UserProgressContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateStats } from '../logic/statsUtils';
import { getRankProgress } from '../logic/rankUtils';
import { supabase } from '../src/api/supabaseClient';

const INITIAL_STATS = {
  timePerGame: {},           // { [gameId]: totalSeconds }
  totalProblemsAttempted: 0,
  totalProblemsCorrect: 0,
  fastestTime: null,
  avgTime: 0,
  levelsCompleted: 0,
  points: 0,
  completedMissions: [],
  completedDailyTasks: [],
};

const ProgressContext = createContext();

export function UserProgressProvider({ children }) {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [rankInfo, setRankInfo] = useState({ currentRank: 0, progress: 0 });
  const [loadingSync, setLoadingSync] = useState(true);
  const saveTimer = useRef(null);
  const currentUserRef = useRef(null);

  // Persist to AsyncStorage
  const persistLocal = async (nextStats) => {
    try {
      await AsyncStorage.setItem('userProgress', JSON.stringify(nextStats));
    } catch (e) {
      console.warn('[Progress] AsyncStorage set failed', e);
    }
  };

  // Persist to Supabase per-user
  const persistRemote = async (nextStats) => {
    try {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user ?? null;
      if (!user) return;

      const payload = {
        user_id: user.id,
        points: nextStats.points ?? 0,
        exp: nextStats.exp ?? 0,
        last_active_at: new Date().toISOString(),
        meta: nextStats,
      };

      const { error } = await supabase.from('progress').upsert(payload, { onConflict: 'user_id' });
      if (error) console.warn('[Progress] persistRemote upsert error', error);
    } catch (err) {
      console.warn('[Progress] persistRemote error', err);
    }
  };

  const scheduleRemoteSave = (nextStats) => {
    persistLocal(nextStats);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistRemote(nextStats);
      saveTimer.current = null;
    }, 2000);
  };

  // Load stats on mount
  useEffect(() => {
  let mounted = true;

  const loadLocal = async () => {
    try {
      const json = await AsyncStorage.getItem('userProgress');

      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user ?? null;

      if (!user) {
        // Guest user: reset progress
        setStats(INITIAL_STATS);
        await AsyncStorage.removeItem('userProgress');
      } else if (json && mounted) {
        setStats(JSON.parse(json));
      }
    } catch (e) {
      console.warn('[Progress] load local error', e);
    }
  };

  const loadRemote = async () => {
    try {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user ?? null;
      currentUserRef.current = user?.id ?? null;
      if (!user) return setLoadingSync(false);

      const { data, error } = await supabase
        .from('progress')
        .select('meta, points, exp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) console.warn('[Progress] load remote error', error);
      else if (data?.meta) {
        setStats(data.meta);
        await AsyncStorage.setItem('userProgress', JSON.stringify(data.meta));
      }
    } catch (err) {
      console.warn('[Progress] loadRemote unexpected', err);
    } finally {
      if (mounted) setLoadingSync(false);
    }
  };

  loadLocal().then(loadRemote);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!mounted) return;
      if (user) {
        currentUserRef.current = user.id;
        (async () => {
          const { data, error } = await supabase
            .from('progress')
            .select('meta, points, exp')
            .eq('user_id', user.id)
            .maybeSingle();
          if (data?.meta) {
            setStats(data.meta);
            await AsyncStorage.setItem('userProgress', JSON.stringify(data.meta));
          }
        })();
      } else {
        currentUserRef.current = null;
        setStats(INITIAL_STATS);
      }
    });

    return () => { mounted = false; try { authListener.subscription.unsubscribe(); } catch {} };
  }, []);

  // Update rank + persist whenever stats change
  useEffect(() => {
    const { currentRank, progress } = getRankProgress(stats.points);
    setRankInfo({ currentRank, progress });
    scheduleRemoteSave(stats);
  }, [stats]);

  // Record a game session for the logged-in user
  async function recordGame(gameId, timeTaken, correctCount, attemptedCount, levelComplete, pointsEarned = 0) {
    setStats(prev => {
      const next = { ...prev };
      updateStats(next, gameId, timeTaken, correctCount, attemptedCount, levelComplete);
      next.points += pointsEarned;
      return next;
    });

    try {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user ?? null;
      if (!user) return;

      const payload = {
        user_id: user.id,
        game_id: gameId,
        started_at: new Date(Date.now() - Math.max(timeTaken * 1000, 0)).toISOString(),
        ended_at: new Date().toISOString(),
        score: correctCount,
        duration_s: Math.round(timeTaken),
        meta: { attemptedCount, levelComplete },
      };

      const { error } = await supabase.from('game_sessions').insert(payload);
      if (error) console.warn('[Progress] failed to insert game_session', error);
    } catch (err) {
      console.warn('[Progress] recordGame error', err);
    }
  }

  function completeMission(title, reward = 0) {
    setStats(prev => {
      if (prev.completedMissions.includes(title)) return prev;
      return { ...prev, completedMissions: [...prev.completedMissions, title], points: prev.points + reward };
    });
  }

  function completeDailyTask(title, reward = 0) {
    setStats(prev => {
      if (prev.completedDailyTasks.includes(title)) return prev;
      return { ...prev, completedDailyTasks: [...prev.completedDailyTasks, title], points: prev.points + reward };
    });
  }

  return (
    <ProgressContext.Provider value={{ ...stats, ...rankInfo, loadingSync, recordGame, completeMission, completeDailyTask }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useUserProgress() {
  return useContext(ProgressContext);
}
