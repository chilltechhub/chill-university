// src/logic/gamificationService.js
import { supabase } from '../api/supabaseClient';
import { getRank } from './rankUtils';

/* ─── Profile + missions loaders ─────────────────────────────────────────── */

export async function getUserProfile(userId) {
  return supabase
    .from('profiles')
    .select(`*, user_missions(*, missions(*)), subject_progress(*)`)
    .eq('id', userId)
    .single();
}

export async function getUserMissions(userId, type = null, status = null) {
  let q = supabase
    .from('user_missions')
    .select('*, missions(*)')
    .eq('user_id', userId);
  if (type)   q = q.eq('type', type);
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

/* ─── Mission generation ─────────────────────────────────────────────────── */

// Built-in templates — used when missions table is empty.
// Wording is deliberately mechanic-agnostic ("activities", not "questions")
// since a "questions_answered" event now fires from quizzes, matches,
// slot placements, budget rounds, guesses, and arcade taps alike — see
// src/services/gameRegistry.js's `mechanic` field for the full roster.
const BUILTIN_DAILY = [
  { title: 'Daily Grind',    description: 'Complete 5 activities today.',        criteria: { type: 'questions_answered' }, target_value: 5,  xp_reward: 30,  point_reward: 15 },
  { title: 'Sharp Shooter',  description: 'Get 3 correct in a row.',             criteria: { type: 'correct_answers' },    target_value: 3,  xp_reward: 20,  point_reward: 10 },
  { title: 'Game Explorer',  description: 'Complete a full game session.',       criteria: { type: 'questions_answered' }, target_value: 10, xp_reward: 40,  point_reward: 20 },
  { title: 'Math Wizard',    description: 'Complete 5 math activities.',         criteria: { type: 'questions_answered', subject: 'math' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Word Master',    description: 'Complete 5 language arts activities.', criteria: { type: 'questions_answered', subject: 'language_arts' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Lab Time',       description: 'Complete 5 science activities.',      criteria: { type: 'questions_answered', subject: 'science' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Healthy Habits', description: 'Complete 5 health activities.',       criteria: { type: 'questions_answered', subject: 'health' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Money Smarts',   description: 'Complete 5 finance activities.',      criteria: { type: 'questions_answered', subject: 'finance' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Globe Trotter',  description: 'Complete 5 social studies activities.', criteria: { type: 'questions_answered', subject: 'social_studies' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Creative Spark', description: 'Complete 5 art & music activities.',  criteria: { type: 'questions_answered', subject: 'arts' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Byte Sized',     description: 'Complete 5 technology activities.',   criteria: { type: 'questions_answered', subject: 'technology' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Polyglot',       description: 'Complete 5 foreign language activities.', criteria: { type: 'questions_answered', subject: 'foreign_language' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Clear Mind',     description: 'Complete 5 mental wellness activities.', criteria: { type: 'questions_answered', subject: 'mental' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'People Person',  description: 'Complete 5 social skills activities.', criteria: { type: 'questions_answered', subject: 'social_skills' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Future Ready',   description: 'Complete 5 career activities.',       criteria: { type: 'questions_answered', subject: 'career' }, target_value: 5, xp_reward: 25, point_reward: 12 },
  { title: 'Lesson Time',    description: 'Complete one Academy Classes topic.', criteria: { type: 'topic_completed' }, target_value: 1, xp_reward: 20, point_reward: 10 },
  { title: 'Session Complete', description: 'Finish one training session.',    criteria: { type: 'game_completed' },     target_value: 1,  xp_reward: 20,  point_reward: 10 },
  { title: 'Flawless Run',  description: 'Finish a game with 100% accuracy.', criteria: { type: 'perfect_game' },       target_value: 1,  xp_reward: 40,  point_reward: 20 },
];

const BUILTIN_WEEKLY = [
  { title: 'Scholar',        description: 'Complete 50 activities this week.', criteria: { type: 'questions_answered' }, target_value: 50, xp_reward: 150, point_reward: 75 },
  { title: 'Accuracy Ace',   description: 'Get 30 correct.',                  criteria: { type: 'correct_answers' },    target_value: 30, xp_reward: 100, point_reward: 50 },
  { title: 'Marathon Trainer', description: 'Complete 5 training sessions this week.', criteria: { type: 'game_completed' }, target_value: 5, xp_reward: 120, point_reward: 60 },
];

export async function generateDailyMissions(userId, subjects = ['math', 'language_arts', 'science']) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const expiresAt = tomorrow.toISOString().slice(0, 10);

  // Try DB templates first
  const { data: templates } = await supabase
    .from('missions').select('*').eq('type', 'daily').eq('active', true);

  const pool = templates?.length ? templates : BUILTIN_DAILY;
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

  const rows = picked.map(t => ({
    user_id:       userId,
    mission_id:    t.id || null,
    type:          'daily',
    status:        'active',
    current_value: 0,
    target_value:  t.target_value || 10,
    subject:       t.criteria?.subject || subjects[Math.floor(Math.random() * subjects.length)],
    expires_at:    expiresAt,
    // Store title/desc inline so MissionCard works even without mission_id join
    _title:        t.title,
    _description:  t.description,
    _xp_reward:    t.xp_reward,
    _point_reward: t.point_reward,
    _criteria:     t.criteria,
  }));

  const { error } = await supabase.from('user_missions').insert(
    rows.map(({ _title, _description, _xp_reward, _point_reward, _criteria, ...rest }) => rest)
  );
  if (error) console.error('generateDailyMissions', error);
}

export async function generateWeeklyMissions(userId, subjects = ['math', 'language_arts', 'science']) {
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(0, 0, 0, 0);
  const expiresAt = nextSunday.toISOString().slice(0, 10);

  const { data: templates } = await supabase
    .from('missions').select('*').eq('type', 'weekly').eq('active', true);

  const pool = templates?.length ? templates : BUILTIN_WEEKLY;
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 2);

  const rows = picked.map(t => ({
    user_id:       userId,
    mission_id:    t.id || null,
    type:          'weekly',
    status:        'active',
    current_value: 0,
    target_value:  t.target_value || 50,
    subject:       t.criteria?.subject || subjects[Math.floor(Math.random() * subjects.length)],
    expires_at:    expiresAt,
  }));

  const { error } = await supabase.from('user_missions').insert(rows);
  if (error) console.error('generateWeeklyMissions', error);
}

/* ─── Core game event handler ────────────────────────────────────────────── */

export async function handleGameEvent(event) {
  const {
    type, userId, gameId,
    subject = 'general',
    correct = false,
    difficulty = 1,
    metadata = {},
  } = event;

  if (!userId) return;

  const rewards = calculateRewards({ type, correct, difficulty });

  const { error: logError } = await supabase.from('activity_log').insert({
    user_id:       userId,
    activity_type: type,
    subject,
    xp_earned:     rewards.xp,
    points_earned: rewards.points,
    metadata: { gameId, correct, ...metadata },
  });
  if (logError) console.error('[handleGameEvent] activity_log', logError.message);

  const { error: rpcError } = await supabase.rpc('increment_user_progress', {
    p_user_id: userId,
    p_xp:      rewards.xp,
    p_points:  rewards.points,
  });
  if (rpcError) console.error('[handleGameEvent] increment_user_progress', rpcError.message);

  if (type === 'QUESTION_ANSWERED') {
    const { error: spError } = await updateSubjectProgress(userId, subject, correct);
    if (spError) console.error('[handleGameEvent] subject_progress', spError.message || spError);
  }

  await advanceMissions(userId, { type, subject, correct, gameId, accuracy: metadata.accuracy });

  return rewards;
}

/* ─── Rewards ────────────────────────────────────────────────────────────── */

function calculateRewards({ type, correct, difficulty }) {
  switch (type) {
    case 'QUESTION_ANSWERED': return { xp: correct ? 10 * difficulty : 2, points: correct ? 5 * difficulty : 1 };
    case 'LEVEL_COMPLETED':   return { xp: 50 * difficulty,  points: 25 * difficulty };
    case 'GAME_COMPLETED':    return { xp: 30 * difficulty,  points: 15 * difficulty };
    case 'STREAK_BONUS':      return { xp: 20,               points: 10 };
    case 'BONUS_REWARD_CLAIMED': return { xp: 10,            points: 15 };
    default:                  return { xp: 0,                points: 0 };
  }
}

/* ─── Activity log ───────────────────────────────────────────────────────── */

async function logActivity({ userId, type, subject, rewards, metadata }) {
  await supabase.from('activity_log').insert({
    user_id:       userId,
    activity_type: type,
    subject,
    xp_earned:     rewards.xp,
    points_earned: rewards.points,
    metadata,
  });
}

/* ─── Profile update — streak + level ───────────────────────────────────── */

// XP thresholds per level (cumulative)
function getLevel(totalXp) {
  const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalXp >= thresholds[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 20);
}

async function updateUserProgress(userId, rewards) {
  if (!rewards.xp && !rewards.points) return;
  const { error } = await supabase.rpc('increment_user_progress', {
    p_user_id: userId,
    p_xp:      rewards.xp,
    p_points:  rewards.points,
  });
  if (error) console.error('[updateUserProgress]', error);
}

/* ─── Subject progress ───────────────────────────────────────────────────── */

async function updateSubjectProgress(userId, subject, correct) {
  const { data: row } = await supabase
    .from('subject_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('subject', subject)
    .maybeSingle();

  const xpGain = correct ? 10 : 2;

  if (!row) {
    await supabase.from('subject_progress').insert({
      user_id:           userId,
      subject,
      questions_answered: 1,
      correct_answers:    correct ? 1 : 0,
      xp:                xpGain,
      level:             1,
    });
    return;
  }

  const newXp    = (row.xp || 0) + xpGain;
  const newLevel = getLevel(newXp);

  await supabase
    .from('subject_progress')
    .update({
      questions_answered: (row.questions_answered || 0) + 1,
      correct_answers:    (row.correct_answers    || 0) + (correct ? 1 : 0),
      xp:                newXp,
      level:             newLevel,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', row.id);
}

/* ─── Mission advancement ────────────────────────────────────────────────── */

async function advanceMissions(userId, event) {
  const { data: missions } = await supabase
    .from('user_missions')
    .select('*, missions(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!missions?.length) return;

  const updates = [];
  for (const m of missions) {
    const criteria = m.missions?.criteria;
    if (!criteria) continue;

    const matchesSubject = !criteria.subject || criteria.subject === event.subject;
    const shouldCount =
      (criteria.type === 'questions_answered' && event.type === 'QUESTION_ANSWERED' && matchesSubject) ||
      (criteria.type === 'correct_answers'    && event.type === 'QUESTION_ANSWERED' && event.correct && matchesSubject) ||
      (criteria.type === 'topic_completed'    && event.type === 'TOPIC_COMPLETED') ||
      (criteria.type === 'game_completed'     && event.type === 'GAME_COMPLETED' && matchesSubject) ||
      (criteria.type === 'perfect_game'       && event.type === 'GAME_COMPLETED' && event.accuracy === 100 && matchesSubject);

    if (!shouldCount) continue;

    const newValue  = (m.current_value || 0) + 1;
    const completed = newValue >= (m.target_value || 1);
    updates.push(
      supabase.from('user_missions').update({
        current_value: newValue,
        status:        completed ? 'completed' : 'active',
        completed_at:  completed ? new Date().toISOString() : null,
      }).eq('id', m.id)
    );
  }

  if (updates.length) await Promise.all(updates);
}

/* ─── Lesson completion — advances any 'topic_completed' mission ────────── */
export async function advanceTopicMission(userId, subjectKey) {
  await advanceMissions(userId, { type: 'TOPIC_COMPLETED', subject: subjectKey });
}

/* ─── Streak update (standalone — for timer sessions) ───────────────────── */
export async function updateStreak(userId) {
  const { data: s } = await supabase
    .from('user_settings')
    .select('streak_count, last_active_date')
    .eq('user_id', userId)
    .maybeSingle();

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = s?.streak_count || 0;
  if (s?.last_active_date === yesterday) streak++;
  else if (s?.last_active_date !== today) streak = 1;

  await supabase.from('user_settings')
    .upsert({ user_id: userId, streak_count: streak, last_active_date: today });
  return streak;
}
