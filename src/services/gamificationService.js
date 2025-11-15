// src/services/gamificationService.js
import { supabase } from '../api/supabaseClient';

// ============================================
// USER PROFILE & PROGRESS
// ============================================

/**
 * Get user profile with all gamification data
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        subject_progress (*),
        user_missions (
          *,
          missions (*)
        ),
        pending_rewards (*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] getUserProfile error:', error);
    return { data: null, error };
  }
}

/**
 * Update user profile points/xp/level
 */
export async function updateUserProgress(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        points: updates.points,
        xp: updates.xp,
        level: updates.level,
        streak_days: updates.streak_days,
        last_active_date: updates.last_active_date,
        longest_streak: updates.longest_streak,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] updateUserProgress error:', error);
    return { data: null, error };
  }
}

// ============================================
// SUBJECT PROGRESS
// ============================================

/**
 * Get subject progress for user
 */
export async function getSubjectProgress(userId, subject = null) {
  try {
    let query = supabase
      .from('subject_progress')
      .select('*')
      .eq('user_id', userId);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] getSubjectProgress error:', error);
    return { data: null, error };
  }
}

/**
 * Update subject progress (upsert)
 */
export async function updateSubjectProgress(userId, subject, progressData) {
  try {
    const { data, error } = await supabase
      .from('subject_progress')
      .upsert({
        user_id: userId,
        subject: subject,
        ...progressData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,subject'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] updateSubjectProgress error:', error);
    return { data: null, error };
  }
}

// ============================================
// MISSIONS & TASKS
// ============================================

/**
 * Get active missions for user
 */
export async function getUserMissions(userId, type = null, status = 'active') {
  try {
    let query = supabase
      .from('user_missions')
      .select(`
        *,
        missions (*)
      `)
      .eq('user_id', userId)
      .eq('status', status);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] getUserMissions error:', error);
    return { data: null, error };
  }
}

/**
 * Generate daily missions for user
 */
export async function generateDailyMissions(userId, subjects = ['math', 'language_arts', 'science', 'general']) {
  try {
    // Get available daily mission templates
    const { data: templates, error: templatesError } = await supabase
      .from('missions')
      .select('*')
      .eq('type', 'daily')
      .eq('active', true);

    if (templatesError) throw templatesError;

    // Filter templates by subject
    const subjectTemplates = templates.filter(t => subjects.includes(t.subject));
    
    // Select 3-4 random missions
    const selectedMissions = subjectTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Set expiration to end of today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Create user mission instances
    const userMissions = selectedMissions.map(mission => ({
      user_id: userId,
      mission_id: mission.id,
      type: 'daily',
      subject: mission.subject,
      current_value: 0,
      target_value: mission.target_value,
      status: 'active',
      expires_at: tomorrow.toISOString(),
    }));

    const { data, error } = await supabase
      .from('user_missions')
      .insert(userMissions)
      .select(`
        *,
        missions (*)
      `);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] generateDailyMissions error:', error);
    return { data: null, error };
  }
}

/**
 * Generate weekly missions for user
 */
export async function generateWeeklyMissions(userId, subjects = ['math', 'language_arts', 'science', 'general']) {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('missions')
      .select('*')
      .eq('type', 'weekly')
      .eq('active', true);

    if (templatesError) throw templatesError;

    const subjectTemplates = templates.filter(t => subjects.includes(t.subject));
    const selectedMissions = subjectTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Set expiration to end of week (Sunday)
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(23, 59, 59, 999);

    const userMissions = selectedMissions.map(mission => ({
      user_id: userId,
      mission_id: mission.id,
      type: 'weekly',
      subject: mission.subject,
      current_value: 0,
      target_value: mission.target_value,
      status: 'active',
      expires_at: nextSunday.toISOString(),
    }));

    const { data, error } = await supabase
      .from('user_missions')
      .insert(userMissions)
      .select(`
        *,
        missions (*)
      `);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] generateWeeklyMissions error:', error);
    return { data: null, error };
  }
}

/**
 * Update mission progress
 */
export async function updateMissionProgress(userMissionId, increment = 1) {
  try {
    // Get current mission
    const { data: mission, error: fetchError } = await supabase
      .from('user_missions')
      .select('*')
      .eq('id', userMissionId)
      .single();

    if (fetchError) throw fetchError;

    const newValue = Math.min(mission.current_value + increment, mission.target_value);
    const isCompleted = newValue >= mission.target_value;

    const updates = {
      current_value: newValue,
      status: isCompleted ? 'completed' : 'active',
      completed_at: isCompleted ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('user_missions')
      .update(updates)
      .eq('id', userMissionId)
      .select(`
        *,
        missions (*)
      `)
      .single();

    if (error) throw error;

    // If completed, create pending reward
    if (isCompleted) {
      await createPendingReward(
        mission.user_id,
        'mission',
        userMissionId,
        data.missions.point_reward || 0,
        data.missions.xp_reward || 0
      );
    }

    return { data, error: null, completed: isCompleted };
  } catch (error) {
    console.error('[gamificationService] updateMissionProgress error:', error);
    return { data: null, error, completed: false };
  }
}

/**
 * Expire old missions
 */
export async function expireOldMissions(userId) {
  try {
    const { data, error } = await supabase
      .from('user_missions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] expireOldMissions error:', error);
    return { data: null, error };
  }
}

// ============================================
// REWARDS
// ============================================

/**
 * Create pending reward
 */
export async function createPendingReward(userId, sourceType, sourceId, points, xp, badgeId = null) {
  try {
    const { data, error } = await supabase
      .from('pending_rewards')
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        points: points,
        xp: xp,
        badge_id: badgeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] createPendingReward error:', error);
    return { data: null, error };
  }
}

/**
 * Get pending rewards for user
 */
export async function getPendingRewards(userId) {
  try {
    const { data, error } = await supabase
      .from('pending_rewards')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] getPendingRewards error:', error);
    return { data: null, error };
  }
}

/**
 * Claim reward and update user stats
 */
export async function claimReward(rewardId, userId) {
  try {
    // Get reward
    const { data: reward, error: rewardError } = await supabase
      .from('pending_rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('user_id', userId)
      .single();

    if (rewardError) throw rewardError;

    // Get current user stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, xp, level')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Calculate new stats
    const newPoints = (profile.points || 0) + (reward.points || 0);
    const newXP = (profile.xp || 0) + (reward.xp || 0);
    
    // Calculate new level from XP
    const newLevel = calculateLevelFromXP(newXP);

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        points: newPoints,
        xp: newXP,
        level: newLevel,
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Mark reward as claimed
    const { error: claimError } = await supabase
      .from('pending_rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    if (claimError) throw claimError;

    // Award badge if included
    if (reward.badge_id) {
      await awardBadge(userId, reward.badge_id);
    }

    return { 
      data: { newPoints, newXP, newLevel, reward }, 
      error: null 
    };
  } catch (error) {
    console.error('[gamificationService] claimReward error:', error);
    return { data: null, error };
  }
}

// ============================================
// BADGES
// ============================================

/**
 * Award badge to user
 */
export async function awardBadge(userId, badgeId) {
  try {
    // Check if user already has this badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existing) {
      return { data: existing, error: null, alreadyHas: true };
    }

    const { data, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
      })
      .select(`
        *,
        badges (*)
      `)
      .single();

    if (error) throw error;
    return { data, error: null, alreadyHas: false };
  } catch (error) {
    console.error('[gamificationService] awardBadge error:', error);
    return { data: null, error, alreadyHas: false };
  }
}

/**
 * Get user badges
 */
export async function getUserBadges(userId) {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] getUserBadges error:', error);
    return { data: null, error };
  }
}

// ============================================
// GAME SESSIONS
// ============================================

/**
 * Record game session
 */
export async function recordGameSession(sessionData) {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: sessionData.userId,
        game_id: sessionData.gameId,
        subject: sessionData.subject || 'general',
        questions_attempted: sessionData.questionsAttempted || 0,
        questions_correct: sessionData.questionsCorrect || 0,
        duration_s: sessionData.durationSeconds || 0,
        score: sessionData.score || 0,
        xp_earned: sessionData.xpEarned || 0,
        points_earned: sessionData.pointsEarned || 0,
        ended_at: new Date().toISOString(),
        meta: sessionData.meta || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(
      sessionData.userId,
      'game_completed',
      sessionData.subject,
      {
        game_id: sessionData.gameId,
        score: sessionData.score,
        duration: sessionData.durationSeconds,
      },
      sessionData.pointsEarned || 0,
      sessionData.xpEarned || 0
    );

    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] recordGameSession error:', error);
    return { data: null, error };
  }
}

// ============================================
// ACTIVITY LOG
// ============================================

/**
 * Log user activity
 */
export async function logActivity(userId, activityType, subject, metadata, pointsEarned = 0, xpEarned = 0) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        activity_type: activityType,
        subject: subject,
        metadata: metadata,
        points_earned: pointsEarned,
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[gamificationService] logActivity error:', error);
    return { data: null, error };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Calculate level from XP
 */
function calculateLevelFromXP(xp) {
  let level = 1;
  let totalXP = 0;
  
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  
  return level;
}

/**
 * Calculate XP required for a level
 */
function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate streak
 */
export function calculateStreak(lastActiveDate) {
  if (!lastActiveDate) return { streak: 1, isNewDay: true };
  
  const now = new Date();
  const last = new Date(lastActiveDate);
  
  // Reset time to midnight for both dates
  now.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day
    return { streak: null, isNewDay: false };
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return { streak: 'increment', isNewDay: true };
  } else {
    // Streak broken - reset to 1
    return { streak: 1, isNewDay: true };
  }
}

export default {
  getUserProfile,
  updateUserProgress,
  getSubjectProgress,
  updateSubjectProgress,
  getUserMissions,
  generateDailyMissions,
  generateWeeklyMissions,
  updateMissionProgress,
  expireOldMissions,
  createPendingReward,
  getPendingRewards,
  claimReward,
  awardBadge,
  getUserBadges,
  recordGameSession,
  logActivity,
  calculateStreak,
};