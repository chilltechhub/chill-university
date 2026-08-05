// context/UserProgressContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../src/api/supabaseClient';
import gamificationService from '../src/services/gamificationService';

// ============================================
// INLINE RANK FUNCTIONS (No separate file needed)
// ============================================

const rankThresholds = [
  { rank: 1,  threshold: 32650 },
  { rank: 2,  threshold: 27925 },
  { rank: 3,  threshold: 23675 },
  { rank: 4,  threshold: 19875 },
  { rank: 5,  threshold: 16500 },
  { rank: 6,  threshold: 13550 },
  { rank: 7,  threshold: 11000 },
  { rank: 8,  threshold: 8800  },
  { rank: 9,  threshold: 6900  },
  { rank: 10, threshold: 5300  },
  { rank: 11, threshold: 3975  },
  { rank: 12, threshold: 2900  },
  { rank: 13, threshold: 2050  },
  { rank: 14, threshold: 1400  },
  { rank: 15, threshold: 925   },
  { rank: 16, threshold: 575   },
  { rank: 17, threshold: 325   },
  { rank: 18, threshold: 150   },
  { rank: 19, threshold: 50    },
  { rank: 20, threshold: 0     },
];

function getRank(points) {
  for (const { rank, threshold } of rankThresholds) {
    if (points >= threshold) {
      return rank;
    }
  }
  return 20;
}

function getRankProgress(points) {
  const currentRank = getRank(points);
  const idx = rankThresholds.findIndex(r => r.rank === currentRank);
  const currentThreshold = rankThresholds[idx].threshold;
  const nextThreshold = idx > 0 ? rankThresholds[idx - 1].threshold : currentThreshold + 1;
  const rawProgress = (points - currentThreshold) / (nextThreshold - currentThreshold);
  const progress = Math.min(Math.max(rawProgress * 100, 0), 100);
  return { currentRank, progress };
}

// ============================================
// SUBJECT CONFIG
// ============================================

export const SUBJECT_CONFIG = {
  math: { name: 'Math', color: '#3B82F6', icon: '🔢' },
  language_arts: { name: 'Language Arts', color: '#8B5CF6', icon: '📚' },
  science: { name: 'Science', color: '#10B981', icon: '🔬' },
  social_studies: { name: 'Social Studies', color: '#F59E0B', icon: '🌍' },
  art_music: { name: 'Art & Music', color: '#EC4899', icon: '🎨' },
  home_economics: { name: 'Home Economics', color: '#F97316', icon: '🏠' },
  technology_engineering: { name: 'Technology & Engineering', color: '#06B6D4', icon: '⚙️' },
  foreign_language: { name: 'Foreign Language', color: '#EF4444', icon: '🗣️' },
  health_fitness: { name: 'Health & Fitness', color: '#84CC16', icon: '💪' },
  business_finance: { name: 'Business & Finance', color: '#14B8A6', icon: '💼' },
  general: { name: 'General', color: '#6366F1', icon: '⭐' },
};

const UserProgressContext = createContext();

export function UserProgressProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectProgress, setSubjectProgress] = useState({});
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMissions, setWeeklyMissions] = useState([]);
  const [longtermMissions, setLongtermMissions] = useState([]);
  const [pendingRewards, setPendingRewards] = useState([]);
  const [badges, setBadges] = useState([]);
  
  // GAMEPLAY STATS (for StatsScreen)
  const [gameplayStats, setGameplayStats] = useState({
    timePerGame: {},
    totalProblemsAttempted: 0,
    totalProblemsCorrect: 0,
    fastestTime: null,
    avgTime: null,
    levelsCompleted: 0,
  });
  
  const syncTimerRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  // ============================================
  // AUTH STATE
  // ============================================
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await loadUserData(currentUser.id);
      } else {
        setProfile(null);
        setSubjectProgress({});
        setDailyMissions([]);
        setWeeklyMissions([]);
        setLongtermMissions([]);
        setPendingRewards([]);
        setBadges([]);
        setGameplayStats({
          timePerGame: {},
          totalProblemsAttempted: 0,
          totalProblemsCorrect: 0,
          fastestTime: null,
          avgTime: null,
          levelsCompleted: 0,
        });
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await loadUserData(currentUser.id);
      }
      
      setLoading(false);
    });

    return () => {
      try { listener.subscription.unsubscribe(); } catch (e) {}
    };
  }, []);

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    if (!user) return;

    realtimeChannelRef.current = supabase
      .channel(`user_progress_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Context] Profile updated:', payload);
          if (payload.new) {
            setProfile(prev => ({ ...prev, ...payload.new }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_missions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Context] Mission updated:', payload);
          loadMissions(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_rewards',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Context] New reward:', payload);
          loadPendingRewards(user.id);
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, [user]);

  // ============================================
  // DATA LOADING
  // ============================================
  
  async function loadUserData(userId) {
    setLoading(true);
    
    try {
      const { data: profileData } = await gamificationService.getUserProfile(userId);
      if (profileData) {
        setProfile(profileData);
        
        if (profileData.subject_progress) {
          const subjectMap = {};
          profileData.subject_progress.forEach(sp => {
            subjectMap[sp.subject] = sp;
          });
          setSubjectProgress(subjectMap);
        }
        
        if (profileData.user_missions) {
          const daily = profileData.user_missions.filter(m => m.type === 'daily' && m.status === 'active');
          const weekly = profileData.user_missions.filter(m => m.type === 'weekly' && m.status === 'active');
          const longterm = profileData.user_missions.filter(m => m.type === 'longterm' && m.status === 'active');
          
          setDailyMissions(daily);
          setWeeklyMissions(weekly);
          setLongtermMissions(longterm);
        }
        
        if (profileData.pending_rewards) {
          setPendingRewards(profileData.pending_rewards.filter(r => r.status === 'pending'));
        }
      }
      
      const { data: badgesData } = await gamificationService.getUserBadges(userId);
      if (badgesData) {
        setBadges(badgesData);
      }
      
      await checkAndGenerateMissions(userId);
      await gamificationService.expireOldMissions(userId);
      
    } catch (error) {
      console.error('[Context] Error loading user data:', error);
    }
    
    setLoading(false);
  }

  async function loadMissions(userId) {
    const { data: missions } = await gamificationService.getUserMissions(userId, null, 'active');
    if (missions) {
      const daily = missions.filter(m => m.type === 'daily');
      const weekly = missions.filter(m => m.type === 'weekly');
      const longterm = missions.filter(m => m.type === 'longterm');
      
      setDailyMissions(daily);
      setWeeklyMissions(weekly);
      setLongtermMissions(longterm);
    }
  }

  async function loadPendingRewards(userId) {
    const { data } = await gamificationService.getPendingRewards(userId);
    if (data) {
      setPendingRewards(data);
    }
  }

  async function checkAndGenerateMissions(userId) {
    const { data: dailyData } = await gamificationService.getUserMissions(userId, 'daily', 'active');
    
    if (!dailyData || dailyData.length === 0) {
      const subjects = profile?.topics?.split(',') || ['math', 'language_arts', 'science'];
      await gamificationService.generateDailyMissions(userId, subjects);
    }
    
    const { data: weeklyData } = await gamificationService.getUserMissions(userId, 'weekly', 'active');
    
    if (!weeklyData || weeklyData.length === 0) {
      const subjects = profile?.topics?.split(',') || ['math', 'language_arts', 'science'];
      await gamificationService.generateWeeklyMissions(userId, subjects);
    }
  }

  // ============================================
  // PROGRESS TRACKING
  // ============================================

  async function completeQuestion(subject, correct = true, points = 10, xp = 5) {
    if (!user) return;

    try {
      const currentSubject = subjectProgress[subject] || {
        level: 1,
        xp: 0,
        questions_answered: 0,
        correct_answers: 0,
        accuracy: 0,
      };

      const newQuestionsAnswered = currentSubject.questions_answered + 1;
      const newCorrectAnswers = currentSubject.correct_answers + (correct ? 1 : 0);
      const newXP = currentSubject.xp + xp;
      const newLevel = calculateLevelFromXP(newXP);

      const streakResult = gamificationService.calculateStreak(profile?.last_active_date);
      let newStreakDays = profile?.streak_days || 0;
      
      if (streakResult.isNewDay) {
        if (streakResult.streak === 'increment') {
          newStreakDays += 1;
        } else if (typeof streakResult.streak === 'number') {
          newStreakDays = streakResult.streak;
        }
      }

      await gamificationService.updateSubjectProgress(user.id, subject, {
        level: newLevel,
        xp: newXP,
        questions_answered: newQuestionsAnswered,
        correct_answers: newCorrectAnswers,
        last_activity_date: new Date().toISOString().split('T')[0],
      });

      const newProfilePoints = (profile?.points || 0) + points;
      const newProfileXP = (profile?.xp || 0) + xp;
      const newProfileLevel = calculateLevelFromXP(newProfileXP);

      await gamificationService.updateUserProgress(user.id, {
        points: newProfilePoints,
        xp: newProfileXP,
        level: newProfileLevel,
        streak_days: newStreakDays,
        last_active_date: new Date().toISOString().split('T')[0],
        longest_streak: Math.max(profile?.longest_streak || 0, newStreakDays),
      });

      setSubjectProgress(prev => ({
        ...prev,
        [subject]: {
          ...currentSubject,
          level: newLevel,
          xp: newXP,
          questions_answered: newQuestionsAnswered,
          correct_answers: newCorrectAnswers,
        },
      }));

      setProfile(prev => ({
        ...prev,
        points: newProfilePoints,
        xp: newProfileXP,
        level: newProfileLevel,
        streak_days: newStreakDays,
        longest_streak: Math.max(prev?.longest_streak || 0, newStreakDays),
      }));

      await updateRelevantMissions(subject, newQuestionsAnswered);

      await gamificationService.logActivity(
        user.id,
        'question_answered',
        subject,
        { correct, points, xp },
        points,
        xp
      );

    } catch (error) {
      console.error('[Context] Error completing question:', error);
    }
  }

  async function updateRelevantMissions(subject, questionsAnswered) {
    for (const mission of dailyMissions) {
      if (mission.status === 'active' && (mission.subject === subject || mission.subject === 'general')) {
        if (mission.missions.criteria?.type === 'questions_answered') {
          await gamificationService.updateMissionProgress(mission.id, 1);
        }
      }
    }

    for (const mission of weeklyMissions) {
      if (mission.status === 'active' && (mission.subject === subject || mission.subject === 'general')) {
        if (mission.missions.criteria?.type === 'questions_answered') {
          await gamificationService.updateMissionProgress(mission.id, 1);
        }
      }
    }

    if (user) {
      await loadMissions(user.id);
    }
  }

  async function recordGame(gameId, durationSeconds, questionsAttempted, questionsCorrect, subject = 'general') {
    if (!user) return;

    const pointsEarned = questionsCorrect * 10;
    const xpEarned = questionsCorrect * 5;

    try {
      // Update gameplay stats
      setGameplayStats(prev => {
        const newTimePerGame = { ...prev.timePerGame };
        newTimePerGame[gameId] = (newTimePerGame[gameId] || 0) + durationSeconds;
        
        const newTotalAttempted = prev.totalProblemsAttempted + questionsAttempted;
        const newTotalCorrect = prev.totalProblemsCorrect + questionsCorrect;
        
        const totalTime = Object.values(newTimePerGame).reduce((sum, t) => sum + t, 0);
        const newAvgTime = newTotalAttempted > 0 ? totalTime / newTotalAttempted : 0;
        
        const newFastestTime = prev.fastestTime === null 
          ? durationSeconds 
          : Math.min(prev.fastestTime, durationSeconds);
        
        return {
          timePerGame: newTimePerGame,
          totalProblemsAttempted: newTotalAttempted,
          totalProblemsCorrect: newTotalCorrect,
          avgTime: newAvgTime,
          fastestTime: newFastestTime,
          levelsCompleted: prev.levelsCompleted + 1,
        };
      });

      // Record in database
      await gamificationService.recordGameSession({
        userId: user.id,
        gameId,
        subject,
        questionsAttempted,
        questionsCorrect,
        durationSeconds,
        score: questionsCorrect,
        xpEarned,
        pointsEarned,
      });

      // Update profile stats
      const newPoints = (profile?.points || 0) + pointsEarned;
      const newXP = (profile?.xp || 0) + xpEarned;
      const newLevel = calculateLevelFromXP(newXP);

      await gamificationService.updateUserProgress(user.id, {
        points: newPoints,
        xp: newXP,
        level: newLevel,
      });

      setProfile(prev => ({
        ...prev,
        points: newPoints,
        xp: newXP,
        level: newLevel,
      }));

    } catch (error) {
      console.error('[Context] Error recording game:', error);
    }
  }

  async function claimReward(rewardId) {
    if (!user) return;

    try {
      const { data } = await gamificationService.claimReward(rewardId, user.id);
      
      if (data) {
        setProfile(prev => ({
          ...prev,
          points: data.newPoints,
          xp: data.newXP,
          level: data.newLevel,
        }));

        setPendingRewards(prev => prev.filter(r => r.id !== rewardId));

        return { success: true, data };
      }
    } catch (error) {
      console.error('[Context] Error claiming reward:', error);
      return { success: false, error };
    }
  }

  async function refreshDailyMissions() {
    if (!user) return;
    
    const subjects = profile?.topics?.split(',') || ['math', 'language_arts', 'science'];
    await gamificationService.generateDailyMissions(user.id, subjects);
    await loadMissions(user.id);
  }

  async function refreshWeeklyMissions() {
    if (!user) return;
    
    const subjects = profile?.topics?.split(',') || ['math', 'language_arts', 'science'];
    await gamificationService.generateWeeklyMissions(user.id, subjects);
    await loadMissions(user.id);
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const points = profile?.points || 0;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const rank = getRank(points);
  const { progress: rankProgress } = getRankProgress(points);
  const streakDays = profile?.streak_days || 0;

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = {
    // State
    user,
    profile,
    loading,
    subjectProgress,
    dailyMissions,
    weeklyMissions,
    longtermMissions,
    pendingRewards,
    badges,
    gameplayStats,
    points,
    xp,
    level,
    rank,
    progress: rankProgress,
    streakDays,
    
    // Functions
    completeQuestion,
    recordGame,
    claimReward,
    refreshDailyMissions,
    refreshWeeklyMissions,
    loadUserData,
  };

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}

export const useUserProgress = () => {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error('useUserProgress must be used within UserProgressProvider');
  }
  return context;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateLevelFromXP(xp) {
  let level = 1;
  let totalXP = 0;
  
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  
  return level;
}

function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}