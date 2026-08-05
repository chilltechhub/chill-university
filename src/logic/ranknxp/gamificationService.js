// src/logic/gamificationService.js

import { supabase } from '../api/supabaseClient';
import { getRank } from './rankUtils';

/* ======================================================
   PROFILE + MISSIONS LOADERS
====================================================== */

export async function getUserProfile(userId) {
  return supabase
    .from('profiles')
    .select(`
      *,
      user_missions (
        *,
        missions (*)
      ),
      subject_progress (*)
    `)
    .eq('id', userId)
    .single();
}

export async function getUserMissions(userId, type = null, status = null) {
  let q = supabase
    .from('user_missions')
    .select('*, missions(*)')
    .eq('user_id', userId);

  if (type) q = q.eq('type', type);
  if (status) q = q.eq('status', status);

  return q;
}

export async function expireOldMissions(userId) {
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from('user_missions')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .lt('expires_at', today)
    .eq('status', 'active');
}

/* ======================================================
   MISSION GENERATION ✅
====================================================== */

export async function generateDailyMissions(userId, subjects = ['math', 'language_arts', 'science']) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Fetch available daily mission templates
  const { data: templates, error: fetchError } = await supabase
    .from('missions')
    .select('*')
    .eq('type', 'daily')
    .eq('active', true); // Changed from 'enabled' to 'active'

  if (fetchError) {
    console.error('Error fetching daily mission templates:', fetchError);
    return;
  }

  if (!templates || templates.length === 0) {
    console.warn('⚠️ No daily mission templates found in database');
    return;
  }

  // Pick 3 random missions
  const selectedTemplates = templates
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // Create user_missions records
  const userMissions = selectedTemplates.map(template => ({
    user_id: userId,
    mission_id: template.id,
    type: 'daily',
    status: 'active',
    current_value: 0,
    target_value: template.target_value || 10,
    subject: template.subject || subjects[Math.floor(Math.random() * subjects.length)],
    expires_at: tomorrow.toISOString().slice(0, 10),
  }));

  const { error } = await supabase
    .from('user_missions')
    .insert(userMissions);

  if (error) {
    console.error('Error generating daily missions:', error);
  } else {
    console.log('✅ Generated', userMissions.length, 'daily missions');
  }
}

export async function generateWeeklyMissions(userId, subjects = ['math', 'language_arts', 'science']) {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()));
  nextSunday.setHours(0, 0, 0, 0);

  // Fetch available weekly mission templates
  const { data: templates, error: fetchError } = await supabase
    .from('missions')
    .select('*')
    .eq('type', 'weekly')
    .eq('active', true); // Changed from 'enabled' to 'active'

  if (fetchError) {
    console.error('Error fetching weekly mission templates:', fetchError);
    return;
  }

  if (!templates || templates.length === 0) {
    console.warn('⚠️ No weekly mission templates found in database');
    return;
  }

  // Pick 2 random missions
  const selectedTemplates = templates
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  // Create user_missions records
  const userMissions = selectedTemplates.map(template => ({
    user_id: userId,
    mission_id: template.id,
    type: 'weekly',
    status: 'active',
    current_value: 0,
    target_value: template.target_value || 50,
    subject: template.subject || subjects[Math.floor(Math.random() * subjects.length)],
    expires_at: nextSunday.toISOString().slice(0, 10),
  }));

  const { error } = await supabase
    .from('user_missions')
    .insert(userMissions);

  if (error) {
    console.error('Error generating weekly missions:', error);
  } else {
    console.log('✅ Generated', userMissions.length, 'weekly missions');
  }
}

/* ======================================================
   CORE GAME EVENT HANDLER
====================================================== */

export async function handleGameEvent(event) {
  const {
    type,
    userId,
    gameId,
    subject = 'general',
    correct = false,
    difficulty = 1,
    metadata = {},
  } = event;

  const rewards = calculateRewards({ type, correct, difficulty });

  // 1. Log activity (source of truth)
  await logActivity({
    userId,
    type,
    subject,
    rewards,
    metadata: { gameId, ...metadata },
  });

  // 2. Update XP / points / rank
  await updateUserProgress(userId, rewards);

  // 3. Update subject mastery
  if (type === 'QUESTION_ANSWERED') {
    await updateSubjectProgress(userId, subject, correct);
  }

  // 4. Advance missions
  await advanceMissions(userId, {
    type,
    subject,
    correct,
  });

  return rewards;
}

/* ======================================================
   REWARDS
====================================================== */

function calculateRewards({ type, correct, difficulty }) {
  let xp = 0;
  let points = 0;

  switch (type) {
    case 'QUESTION_ANSWERED':
      xp     = correct ? 10 * difficulty : 2;
      points = correct ? 5  * difficulty : 1;
      break;
    case 'LEVEL_COMPLETED':
      xp     = 50  * difficulty;
      points = 25  * difficulty;
      break;
    case 'GAME_COMPLETED':
      xp     = 30  * difficulty;
      points = 15  * difficulty;
      break;
    case 'STREAK_BONUS':
      xp     = 20;
      points = 10;
      break;
    default:
      xp = 0; points = 0;
  }

  return { xp, points };
}

/* ======================================================
   ACTIVITY LOG
====================================================== */

async function logActivity({ userId, type, subject, rewards, metadata }) {
  await supabase.from('activity_log').insert({
    user_id: userId,
    activity_type: type,
    subject,
    xp_earned: rewards.xp,
    points_earned: rewards.points,
    metadata,
  });
}

/* ======================================================
   PROFILE UPDATES
====================================================== */

async function updateUserProgress(userId, rewards) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, points')
    .eq('id', userId)
    .single();

  const newXp = (profile?.xp || 0) + rewards.xp;
  const newPoints = (profile?.points || 0) + rewards.points;

  await supabase
    .from('profiles')
    .update({
      xp: newXp,
      points: newPoints,
      rank: getRank(newPoints),
      last_active_date: new Date().toISOString().slice(0, 10),
    })
    .eq('id', userId);
}

/* ======================================================
   SUBJECT PROGRESS
====================================================== */

async function updateSubjectProgress(userId, subject, correct) {
  const { data: row } = await supabase
    .from('subject_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('subject', subject)
    .single();

  if (!row) {
    await supabase.from('subject_progress').insert({
      user_id: userId,
      subject,
      questions_answered: 1,
      correct_answers: correct ? 1 : 0,
      xp: correct ? 10 : 2,
    });
    return;
  }

  await supabase
    .from('subject_progress')
    .update({
      questions_answered: row.questions_answered + 1,
      correct_answers: row.correct_answers + (correct ? 1 : 0),
      xp: row.xp + (correct ? 10 : 2),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);
}

/* ======================================================
   MISSION ADVANCEMENT
====================================================== */

async function advanceMissions(userId, event) {
  const { data: missions } = await supabase
    .from('user_missions')
    .select('*, missions(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!missions?.length) return;

  for (const m of missions) {
    const criteria = m.missions?.criteria;
    if (!criteria) continue;

    // Count any question
    if (criteria.type === 'questions_answered') {
      if (!criteria.subject || criteria.subject === event.subject) {
        await incrementMission(m);
      }
    }

    // Count only correct answers
    if (criteria.type === 'correct_answers' && event.correct) {
      if (!criteria.subject || criteria.subject === event.subject) {
        await incrementMission(m);
      }
    }
  }
}

async function incrementMission(mission) {
  const newValue = (mission.current_value || 0) + 1;
  const completed = newValue >= mission.target_value;

  await supabase
    .from('user_missions')
    .update({
      current_value: newValue,
      status: completed ? 'completed' : 'active',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', mission.id);
}