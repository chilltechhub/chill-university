// src/context/UserProgressContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/api/supabaseClient';
export const SUBJECT_CONFIG = {
  math: { name: 'Math', color: '#3B82F6', icon: '🔢' },
  language_arts: { name: 'Language Arts', color: '#8B5CF6', icon: '📚' },
  science: { name: 'Science', color: '#10B981', icon: '🔬' },
  social_studies: { name: 'Social Studies', color: '#F59E0B', icon: '🌍' },
  art_music: { name: 'Art & Music', color: '#EC4899', icon: '🎨' },
  home_economics: { name: 'Home Economics & Workshop', color: '#F97316', icon: '🏠' },
  technology_engineering: { name: 'Technology & Engineering', color: '#06B6D4', icon: '⚙️' },
  foreign_language: { name: 'Foreign Language', color: '#EF4444', icon: '🗣️' },
  health_fitness: { name: 'Health & Fitness', color: '#84CC16', icon: '💪' },
  business_finance: { name: 'Business & Finance', color: '#14B8A6', icon: '💼' },
  general: { name: 'General', color: '#6366F1', icon: '⭐' },
};

// Daily goals, weekly missions, and longterm goal configs are copied here from your old file
// (for brevity, I'm assuming you will copy DAILY_GOAL_TEMPLATES, WEEKLY_MISSION_TEMPLATES, LONGTERM_GOAL_CONFIGS, and helper functions like calculateXPForLevel, calculateLevelFromXP, updateGoalProgress, updateLongtermGoal, expireOldGoals, etc.)

export const DAILY_GOAL_TEMPLATES = {
  math: [
    { title: 'Quick Calculator', description: 'Solve 10 math problems', target: 10, reward: 150 },
    { title: 'Perfect Practice', description: 'Answer 5 questions correctly in a row', target: 5, reward: 120 },
    { title: 'Speed Demon', description: 'Complete 15 problems in under 10 minutes', target: 15, reward: 180 },
  ],
  language_arts: [
    { title: 'Word Wizard', description: 'Complete 1 reading passage', target: 1, reward: 150 },
    { title: 'Grammar Master', description: 'Answer 10 grammar questions correctly', target: 10, reward: 140 },
    { title: 'Vocabulary Builder', description: 'Learn 5 new words', target: 5, reward: 130 },
  ],
  science: [
    { title: 'Lab Rat', description: 'Answer 10 science questions', target: 10, reward: 150 },
    { title: 'Experiment Time', description: 'Complete 2 science experiments/simulations', target: 2, reward: 160 },
    { title: 'Theory Thinker', description: 'Study 3 scientific concepts', target: 3, reward: 140 },
  ],
  social_studies: [
    { title: 'History Hunter', description: 'Answer 8 history questions', target: 8, reward: 140 },
    { title: 'Geography Genius', description: 'Identify 10 locations correctly', target: 10, reward: 150 },
    { title: 'Culture Explorer', description: 'Learn about 2 different cultures', target: 2, reward: 130 },
  ],
  art_music: [
    { title: 'Creative Creator', description: 'Complete 1 art project or music lesson', target: 1, reward: 150 },
    { title: 'Theory Time', description: 'Study 3 art/music concepts', target: 3, reward: 130 },
    { title: 'Practice Session', description: 'Practice for 15 minutes', target: 15, reward: 160 },
  ],
  home_economics: [
    { title: 'Home Helper', description: 'Complete 5 home economics questions', target: 5, reward: 130 },
    { title: 'Recipe Reader', description: 'Study 2 recipes or techniques', target: 2, reward: 140 },
    { title: 'Safety First', description: 'Answer 8 safety questions correctly', target: 8, reward: 150 },
  ],
  technology_engineering: [
    { title: 'Tech Titan', description: 'Complete 10 tech questions', target: 10, reward: 150 },
    { title: 'Code Cracker', description: 'Solve 3 coding challenges', target: 3, reward: 170 },
    { title: 'Design Thinking', description: 'Complete 1 engineering design challenge', target: 1, reward: 160 },
  ],
  foreign_language: [
    { title: 'Polyglot Practice', description: 'Practice 20 vocabulary words', target: 20, reward: 160 },
    { title: 'Conversation Starter', description: 'Complete 3 dialogue exercises', target: 3, reward: 150 },
    { title: 'Grammar Guru', description: 'Answer 10 grammar questions', target: 10, reward: 140 },
  ],
  health_fitness: [
    { title: 'Health Hero', description: 'Answer 8 health questions', target: 8, reward: 140 },
    { title: 'Fitness Focus', description: 'Complete 2 fitness lessons', target: 2, reward: 150 },
    { title: 'Nutrition Knowledge', description: 'Study 5 nutrition facts', target: 5, reward: 130 },
  ],
  business_finance: [
    { title: 'Money Master', description: 'Answer 10 finance questions', target: 10, reward: 150 },
    { title: 'Business Brain', description: 'Complete 2 business case studies', target: 2, reward: 160 },
    { title: 'Economics Expert', description: 'Study 3 economic concepts', target: 3, reward: 140 },
  ],
  general: [
    { title: 'Triple Threat', description: 'Practice 3 different subjects', target: 3, reward: 200 },
    { title: 'Daily Dedication', description: 'Practice for 15 minutes', target: 15, reward: 150 },
    { title: 'Question Quest', description: 'Answer 20 questions in any subject', target: 20, reward: 180 },
  ],
};

export const WEEKLY_MISSION_TEMPLATES = {
  math: [
    { title: 'Math Marathon', description: 'Solve 100 problems this week', theme: 'Endurance', target: 100, reward: 800 },
    { title: 'Perfect Week', description: 'Maintain 80%+ accuracy for 7 days', theme: 'Precision', target: 7, reward: 900 },
    { title: 'Topic Master', description: 'Complete 3 different math topics', theme: 'Diversity', target: 3, reward: 750 },
  ],
  language_arts: [
    { title: 'Reading Rainbow', description: 'Complete 10 reading passages', theme: 'Comprehension', target: 10, reward: 850 },
    { title: 'Writing Warrior', description: 'Complete 5 writing exercises', theme: 'Composition', target: 5, reward: 800 },
    { title: 'Word Power', description: 'Learn 50 new vocabulary words', theme: 'Vocabulary', target: 50, reward: 900 },
  ],
  science: [
    { title: 'Scientific Method', description: 'Complete 50 science questions', theme: 'Investigation', target: 50, reward: 800 },
    { title: 'Lab Week', description: 'Complete 5 experiments/simulations', theme: 'Experimentation', target: 5, reward: 850 },
    { title: 'Theory & Practice', description: 'Study all science subtopics', theme: 'Comprehensive', target: 5, reward: 900 },
  ],
  social_studies: [
    { title: 'Time Traveler', description: 'Answer 75 history questions', theme: 'Historical', target: 75, reward: 800 },
    { title: 'World Explorer', description: 'Study 10 different countries/regions', theme: 'Geography', target: 10, reward: 850 },
    { title: 'Civic Champion', description: 'Complete civics and government units', theme: 'Citizenship', target: 1, reward: 750 },
  ],
  art_music: [
    { title: 'Creative Week', description: 'Complete 5 art/music projects', theme: 'Creativity', target: 5, reward: 850 },
    { title: 'Artist Study', description: 'Learn about 7 artists/composers', theme: 'Appreciation', target: 7, reward: 800 },
    { title: 'Daily Practice', description: 'Practice 7 days in a row', theme: 'Consistency', target: 7, reward: 900 },
  ],
  home_economics: [
    { title: 'Home Mastery', description: 'Complete 40 questions this week', theme: 'Skills', target: 40, reward: 750 },
    { title: 'Recipe Collection', description: 'Study 10 recipes or techniques', theme: 'Culinary', target: 10, reward: 800 },
    { title: 'Safety Expert', description: 'Perfect all safety lessons', theme: 'Safety', target: 5, reward: 850 },
  ],
  technology_engineering: [
    { title: 'Tech Week', description: 'Complete 60 tech questions', theme: 'Innovation', target: 60, reward: 850 },
    { title: 'Code Challenge', description: 'Solve 10 coding problems', theme: 'Programming', target: 10, reward: 900 },
    { title: 'Design Sprint', description: 'Complete 3 engineering projects', theme: 'Design', target: 3, reward: 800 },
  ],
  foreign_language: [
    { title: 'Immersion Week', description: 'Practice 150 vocabulary words', theme: 'Vocabulary', target: 150, reward: 900 },
    { title: 'Conversation Pro', description: 'Complete 15 dialogue exercises', theme: 'Speaking', target: 15, reward: 850 },
    { title: 'Grammar Grind', description: 'Master 50 grammar questions', theme: 'Grammar', target: 50, reward: 800 },
  ],
  health_fitness: [
    { title: 'Wellness Week', description: 'Complete 50 health questions', theme: 'Knowledge', target: 50, reward: 800 },
    { title: 'Fitness Journey', description: 'Complete 7 fitness lessons', theme: 'Activity', target: 7, reward: 850 },
    { title: 'Nutrition Master', description: 'Study all nutrition topics', theme: 'Nutrition', target: 5, reward: 750 },
  ],
  business_finance: [
    { title: 'Financial Literacy', description: 'Answer 70 finance questions', theme: 'Finance', target: 70, reward: 850 },
    { title: 'Business Bootcamp', description: 'Complete 5 business case studies', theme: 'Business', target: 5, reward: 800 },
    { title: 'Investment Week', description: 'Study all investment topics', theme: 'Investing', target: 4, reward: 900 },
  ],
  general: [
    { title: 'Renaissance Scholar', description: 'Practice 5 different subjects', theme: 'Versatility', target: 5, reward: 1000 },
    { title: 'Marathon Week', description: 'Answer 200 questions total', theme: 'Endurance', target: 200, reward: 1200 },
    { title: 'Perfect Attendance', description: 'Practice every day this week', theme: 'Consistency', target: 7, reward: 900 },
  ],
};

export const LONGTERM_GOAL_CONFIGS = {
  level: (subject) => ({
    id: `level_${subject}`,
    type: 'longterm',
    subject,
    title: `${SUBJECT_CONFIG[subject].name} Master`,
    description: 'Reach higher levels in this subject',
    category: 'level',
    tiers: [
      { name: 'Bronze', target: 5, reward: 500, badgeIcon: '🥉', completed: false },
      { name: 'Silver', target: 10, reward: 1000, badgeIcon: '🥈', completed: false },
      { name: 'Gold', target: 25, reward: 2500, badgeIcon: '🥇', completed: false },
      { name: 'Platinum', target: 50, reward: 5000, badgeIcon: '💎', completed: false },
      { name: 'Master', target: 100, reward: 10000, badgeIcon: '👑', completed: false },
    ],
    current: 0,
  }),
  streak: (subject) => ({
    id: `streak_${subject}`,
    type: 'longterm',
    subject,
    title: `${SUBJECT_CONFIG[subject].name} Dedication`,
    description: 'Build your practice streak',
    category: 'streak',
    tiers: [
      { name: '7-Day Warrior', target: 7, reward: 300, badgeIcon: '🔥', completed: false },
      { name: '30-Day Champion', target: 30, reward: 1500, badgeIcon: '⚡', completed: false },
      { name: '60-Day Legend', target: 60, reward: 3500, badgeIcon: '💫', completed: false },
      { name: '90-Day Master', target: 90, reward: 6000, badgeIcon: '✨', completed: false },
      { name: '365-Day Immortal', target: 365, reward: 25000, badgeIcon: '🌟', completed: false },
    ],
    current: 0,
  }),
  mastery: (subject) => ({
    id: `mastery_${subject}`,
    type: 'longterm',
    subject,
    title: `${SUBJECT_CONFIG[subject].name} Expertise`,
    description: 'Master all topics in this subject',
    category: 'mastery',
    tiers: [
      { name: 'Novice', target: 25, reward: 400, badgeIcon: '📖', completed: false },
      { name: 'Apprentice', target: 50, reward: 1000, badgeIcon: '📚', completed: false },
      { name: 'Expert', target: 75, reward: 2000, badgeIcon: '🎓', completed: false },
      { name: 'Master', target: 100, reward: 5000, badgeIcon: '🏆', completed: false },
    ],
    current: 0,
  }),
};

// ==========================================
// HELPERS
// ==========================================

export const calculateXPForLevel = (level) => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

export const calculateLevelFromXP = (xp) => {
  let level = 1;
  let totalXP = 0;
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  return level;
};

export const generateDailyGoals = (subjects) => {
  const goals = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const selectedSubjects = subjects.slice(0, 2);
  selectedSubjects.forEach((subject) => {
    const templates = DAILY_GOAL_TEMPLATES[subject] || DAILY_GOAL_TEMPLATES.general;
    const template = templates[Math.floor(Math.random() * templates.length)];
    goals.push({
      id: `daily_${subject}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'daily',
      subject,
      title: template.title,
      description: template.description,
      progress: { current: 0, total: template.target }, // <-- normalized
      reward: template.reward,
      status: 'not_started',
      expiresAt: tomorrow.toISOString(),
    });
  });

  // Add a general goal
  const generalTemplates = DAILY_GOAL_TEMPLATES.general;
  const generalTemplate = generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
  goals.push({
    id: `daily_general_${Date.now()}`,
    type: 'daily',
    subject: 'general',
    title: generalTemplate.title,
    description: generalTemplate.description,
    progress: { current: 0, total: generalTemplate.target }, // <-- normalized
    reward: generalTemplate.reward,
    status: 'not_started',
    expiresAt: tomorrow.toISOString(),
  });

  return goals;
};


export const generateWeeklyMissions = (subjects) => {
  const missions = [];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const selectedSubjects = subjects.slice(0, 2);
  selectedSubjects.forEach((subject) => {
    const templates = WEEKLY_MISSION_TEMPLATES[subject] || WEEKLY_MISSION_TEMPLATES.general;
    const template = templates[Math.floor(Math.random() * templates.length)];
    missions.push({
      id: `weekly_${subject}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'weekly',
      subject,
      title: template.title,
      description: template.description,
      theme: template.theme,
      progress: { current: 0, total: template.target }, // <-- normalized
      reward: template.reward,
      status: 'not_started',
      expiresAt: nextWeek.toISOString(),
    });
  });

  const generalTemplates = WEEKLY_MISSION_TEMPLATES.general;
  const generalTemplate = generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
  missions.push({
    id: `weekly_general_${Date.now()}`,
    type: 'weekly',
    subject: 'general',
    title: generalTemplate.title,
    description: generalTemplate.description,
    theme: generalTemplate.theme,
    progress: { current: 0, total: generalTemplate.target }, // <-- normalized
    reward: generalTemplate.reward,
    status: 'not_started',
    expiresAt: nextWeek.toISOString(),
  });

  return missions;
};


export const initializeLongtermGoals = (subjects) => {
  const goals = [];
  subjects.forEach((subject) => {
    goals.push(LONGTERM_GOAL_CONFIGS.level(subject));
    goals.push(LONGTERM_GOAL_CONFIGS.streak(subject));
    goals.push(LONGTERM_GOAL_CONFIGS.mastery(subject));
  });
  goals.push(LONGTERM_GOAL_CONFIGS.level('general'));
  goals.push(LONGTERM_GOAL_CONFIGS.streak('general'));
  return goals;
};

export const updateGoalProgress = (goal, increment = 1) => {
  const updated = { ...goal };
  // support both old shape and new shape if needed
  if (updated.progress) {
    updated.progress = {
      current: Math.min((updated.progress.current || 0) + increment, updated.progress.total),
      total: updated.progress.total || (goal.target || 0),
    };
    if (updated.progress.current >= updated.progress.total && updated.status !== 'completed') {
      updated.status = 'completed';
      updated.completedAt = new Date().toISOString();
    } else if (updated.progress.current > 0 && updated.status === 'not_started') {
      updated.status = 'in_progress';
    }
  } else {
    // fallback for old shape (current/target)
    updated.current = Math.min((updated.current || 0) + increment, updated.target || 0);
    if (updated.current >= (updated.target || 0) && updated.status !== 'completed') {
      updated.status = 'completed';
      updated.completedAt = new Date().toISOString();
    } else if (updated.current > 0 && updated.status === 'not_started') {
      updated.status = 'in_progress';
    }
  }
  return updated;
};

export const updateLongtermGoal = (goal, newValue) => {
  const updated = JSON.parse(JSON.stringify(goal)); // deep copy
  const previousValue = updated.current || 0;
  updated.current = newValue;
  let tierCompleted;
  for (let i = 0; i < updated.tiers.length; i++) {
    const tier = updated.tiers[i];
    if (!tier.completed && newValue >= tier.target && previousValue < tier.target) {
      tier.completed = true;
      tier.completedAt = new Date().toISOString();
      tierCompleted = { tier, reward: tier.reward };
      break;
    }
  }
  return { goal: updated, tierCompleted };
};

export const expireOldGoals = (goals) => {
  const now = new Date();
  return goals.map((goal) => {
    if (goal.status !== 'completed' && new Date(goal.expiresAt) < now) {
      return { ...goal, status: 'expired' };
    }
    return goal;
  });
};

// ==========================================
// INITIAL STATS
// ==========================================
const INITIAL_STATS = {
  userProgress: {
    subjects: {},
    generalStreak: 0,
    generalLongestStreak: 0,
    dailyGoals: [],
    weeklyMissions: [],
    longtermGoals: [],
  },
  points: 0,
  exp: 0,
  timePerGame: {},
  totalProblemsAttempted: 0,
  totalProblemsCorrect: 0,
  fastestTime: null,
  avgTime: null,
  levelsCompleted: 0,
};

// ==========================================
// CONTEXT
// ==========================================
const UserProgressContext = createContext();

// ==========================================
// PROVIDER
// ==========================================
export function UserProgressProvider({ children }) {
  const [stats, setStats] = useState(INITIAL_STATS);
  const saveTimer = useRef(null);
  const currentUserRef = useRef(null);

  // Persist locally
  const persistLocal = async (nextStats) => {
    try {
      await AsyncStorage.setItem('userProgress', JSON.stringify(nextStats));
    } catch (e) {
      console.warn('[Progress] AsyncStorage set failed', e);
    }
  };

  // Persist remotely
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

  // Load stats
  // inside UserProgressProvider, replace the existing useEffect(...) that loads local/remote
useEffect(() => {
  let mounted = true;

  const loadLocal = async () => {
    try {
      const json = await AsyncStorage.getItem('userProgress');
      if (json && mounted) {
        const parsed = JSON.parse(json);
        setStats(parsed);
        // If parsed exists but userProgress subjects are missing or empty, initialize
        if (!parsed.userProgress || !parsed.userProgress.subjects || Object.keys(parsed.userProgress.subjects).length === 0) {
          initializeUserProgress();
        }
      } else {
        // nothing saved locally — initialize
        initializeUserProgress();
      }
    } catch (e) {
      console.warn('[Progress] load local error', e);
      initializeUserProgress();
    }
  };

  const loadRemote = async () => {
    try {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user ?? null;
      currentUserRef.current = user?.id ?? null;
      if (!user) return;

      const { data, error } = await supabase
        .from('progress')
        .select('meta, points, exp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('[Progress] load remote error', error);
        return;
      }

      if (data?.meta && mounted) {
        setStats(data.meta);
        await AsyncStorage.setItem('userProgress', JSON.stringify(data.meta));
        // if remote record lacks goals, ensure initialization
        if (!data.meta.userProgress || !data.meta.userProgress.subjects || Object.keys(data.meta.userProgress.subjects).length === 0) {
          initializeUserProgress();
        }
      }
    } catch (err) {
      console.warn('[Progress] loadRemote unexpected', err);
    }
  };

  loadLocal().then(loadRemote);

  return () => { mounted = false; };
}, []);


  // ============================
  // CORE FUNCTIONS
  // ============================

  const initializeUserProgress = () => {
    const subjects = Object.keys(SUBJECT_CONFIG);
    const userProgress = {
      subjects: {},
      generalStreak: 0,
      generalLongestStreak: 0,
      dailyGoals: generateDailyGoals(subjects.filter(s => s !== 'general')),
      weeklyMissions: generateWeeklyMissions(subjects.filter(s => s !== 'general')),
      longtermGoals: initializeLongtermGoals(subjects),
    };

    subjects.forEach((subject) => {
      userProgress.subjects[subject] = {
        level: 1,
        xp: 0,
        xpToNextLevel: calculateXPForLevel(1),
        masteryPercentage: 0,
        questionsAnswered: 0,
        accuracy: 0,
        streak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      };
    });

    setStats(prev => ({ ...prev, userProgress }));
  };

  const completeQuestion = (subject, correct = false, points = 10) => {
    if (!stats.userProgress) return;

    const newStats = { ...stats };
    const subjData = { ...newStats.userProgress.subjects[subject] };

    // Questions & accuracy
    const newQuestions = (subjData.questionsAnswered || 0) + 1;
    const newAccuracy = ((subjData.accuracy || 0) * (subjData.questionsAnswered || 0) + (correct ? 1 : 0)) / newQuestions;

    // XP & Level
    const newXP = (subjData.xp || 0) + points;
    const newLevel = calculateLevelFromXP(newXP);

    // Streak
    const now = new Date();
    const last = subjData.lastActivityDate ? new Date(subjData.lastActivityDate) : null;
    let newStreak = subjData.streak || 0;
    if (last) {
      const diffDays = Math.floor((now.setHours(0,0,0,0) - new Date(last).setHours(0,0,0,0)) / (1000*60*60*24));
      if (diffDays === 1) newStreak++;
      else if (diffDays > 1) newStreak = 1;
    } else newStreak = 1;

    const newLongestStreak = Math.max(subjData.longestStreak || 0, newStreak);

    subjData.xp = newXP;
    subjData.level = newLevel;
    subjData.xpToNextLevel = calculateXPForLevel(newLevel);
    subjData.questionsAnswered = newQuestions;
    subjData.accuracy = newAccuracy;
    subjData.lastActivityDate = new Date().toISOString();
    subjData.streak = newStreak;
    subjData.longestStreak = newLongestStreak;

    newStats.userProgress.subjects[subject] = subjData;

    // Update goals
    newStats.userProgress.dailyGoals = newStats.userProgress.dailyGoals.map(g =>
      g.subject === subject || g.subject === 'general' ? updateGoalProgress(g, 1) : g
    );

    newStats.userProgress.weeklyMissions = newStats.userProgress.weeklyMissions.map(m =>
      m.subject === subject || m.subject === 'general' ? updateGoalProgress(m, 1) : m
    );

    // Longterm goals
    newStats.userProgress.longtermGoals = newStats.userProgress.longtermGoals.map(lt => {
      if (lt.subject === subject) {
        if (lt.category === 'level') return updateLongtermGoal(lt, newLevel).goal;
        if (lt.category === 'mastery') return updateLongtermGoal(lt, Math.round(newStats.userProgress.subjects[subject].questionsAnswered)).goal;
        if (lt.category === 'streak') return updateLongtermGoal(lt, newStreak).goal;
      }
      return lt;
    });

    setStats(newStats);
    scheduleRemoteSave(newStats);
  };

  // === NEW: recordGame ===
// inside UserProgressProvider

const recordGame = (gameId, timeTakenSeconds, correctCount = 0, attemptedCount = 0) => {
    setStats((prev) => {
      const prevTime = prev.timePerGame || {};
      const allTimes = { ...prevTime, [gameId]: timeTakenSeconds };

      const totalAttempts = (prev.totalProblemsAttempted || 0) + attemptedCount;
      const totalCorrect = (prev.totalProblemsCorrect || 0) + correctCount;

      const avgTime =
        Object.values(allTimes).reduce((sum, t) => sum + t, 0) / Object.values(allTimes).length || 0;
      const fastestTime =
        Math.min(...Object.values(allTimes)) || timeTakenSeconds;

      const levelsCompleted = Object.keys(allTimes).length;

      const nextStats = {
        ...prev,
        timePerGame: allTimes,
        totalProblemsAttempted: totalAttempts,
        totalProblemsCorrect: totalCorrect,
        avgTime,
        fastestTime,
        levelsCompleted,
      };
      scheduleRemoteSave(nextStats);
      return nextStats;
    });
  };

  // Refresh goals
  const refreshDailyGoals = () => {
    const subjects = Object.keys(SUBJECT_CONFIG).filter(s => s !== 'general');
    const newGoals = generateDailyGoals(subjects);
    setStats(prev => ({ ...prev, userProgress: { ...prev.userProgress, dailyGoals: newGoals } }));
  };

  const refreshWeeklyMissions = () => {
    const subjects = Object.keys(SUBJECT_CONFIG).filter(s => s !== 'general');
    const newMissions = generateWeeklyMissions(subjects);
    setStats(prev => ({ ...prev, userProgress: { ...prev.userProgress, weeklyMissions: newMissions } }));
  };

  return (
    <UserProgressContext.Provider value={{
      stats,
      completeQuestion,
      recordGame,
      refreshDailyGoals,
      refreshWeeklyMissions,
      initializeUserProgress,
    }}>

      
      {children}


    
    </UserProgressContext.Provider>
  );
}

export const useUserProgress = () => {
  const context = useContext(UserProgressContext);
  if (!context) throw new Error('useUserProgress must be used within UserProgressProvider');
  return context;
};
