// src/logic/gamificationService.js
import { supabase } from '../api/supabaseClient';
import { getRank } from './rankUtils';
import { todayStr, daysBetween, addDays } from './dateUtils';
import { QUEST_XP } from '../data/quests';
import { drillCriteria, drillIsCounted, drillIsPlayable, drillCounts, pickDrills } from './drills';

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
  // Local, not UTC — daily missions have to survive until the user's own
  // midnight. Compared against expires_at, which generateDailyMissions()
  // writes on the same local calendar.
  const today = todayStr();
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
  { title: 'Number Cruncher', description: 'Complete 5 math activities.',        criteria: { type: 'questions_answered', subject: 'math' }, target_value: 5, xp_reward: 25, point_reward: 12 },
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

// `games` is what this account can play right now ([{ id, title, subject }],
// from AccessContext). Without it (the very first load, before the stage is
// known) only drills that any game counts toward are set: never one for a
// subject or a game the account may not have. See src/logic/drills.js.
export async function generateDailyMissions(userId, subjects = ['math', 'language_arts', 'science'], games = null) {
  // Expires at the end of today, i.e. the moment tomorrow's local date
  // starts. Building this by hand out of a Date and then serialising through
  // toISOString() re-introduced the UTC shift the local date string avoids.
  const expiresAt = addDays(todayStr(), 1);

  // Try DB templates first
  const { data: templates } = await supabase
    .from('missions').select('*').eq('type', 'daily').eq('active', true);

  const pool = templates?.length ? templates : BUILTIN_DAILY;
  const anyGame = [{ id: '*', title: 'any game', subject: '__any__' }];
  const picked = games?.length
    ? pickDrills(pool, games, 3)
    : pickDrills(pool.filter(t => drillIsCounted(drillCriteria(t)) && !drillCriteria(t).subject), anyGame, 3);

  const rows = picked.map(t => ({
    user_id:       userId,
    mission_id:    t.id || null,
    type:          'daily',
    status:        'active',
    current_value: 0,
    target_value:  t.target_value || 10,
    subject:       t.criteria?.subject || 'general',
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

// Same rule as daily drills (src/logic/drills.js): only challenges the app
// can count and this account can play. "Answer 25 coin questions" could
// never move: no event carries a game id.
export async function generateWeeklyMissions(userId, subjects = ['math', 'language_arts', 'science'], games = null) {
  const now = new Date();
  const expiresAt = addDays(todayStr(), 7 - now.getDay());

  const { data: templates } = await supabase
    .from('missions').select('*').eq('type', 'weekly').eq('active', true);

  const pool = templates?.length ? templates : BUILTIN_WEEKLY;
  const anyGame = [{ id: '*', title: 'any game', subject: '__any__' }];
  const picked = games?.length
    ? pickDrills(pool, games, 2)
    : pickDrills(pool.filter(t => drillIsCounted(drillCriteria(t)) && !drillCriteria(t).subject), anyGame, 2);

  const rows = picked.map(t => ({
    user_id:       userId,
    mission_id:    t.id || null,
    type:          'weekly',
    status:        'active',
    current_value: 0,
    target_value:  t.target_value || 50,
    subject:       t.criteria?.subject || 'general',
    expires_at:    expiresAt,
  }));

  const { error } = await supabase.from('user_missions').insert(rows);
  if (error) console.error('generateWeeklyMissions', error);
}

/**
 * Swaps any of today's untouched drills this account can't do for ones it
 * can. For accounts handed a drill before its games were known (or before
 * this check existed), and for the first load of a new account, which sets
 * drills before AccessContext knows the stage. Only rows still at 0: a drill
 * someone has started stays theirs. Resolves true if anything changed.
 */
export async function tailorDailyDrills(userId, games, type = 'daily') {
  if (!userId || !games?.length) return false;
  const today = todayStr();
  const { data: rows } = await supabase
    .from('user_missions').select('*, missions(*)')
    .eq('user_id', userId).eq('type', type).eq('status', 'active')
    .gt('expires_at', today);
  const stuck = (rows || []).filter(r => (r.current_value || 0) === 0 && !drillIsPlayable(drillCriteria(r), games));
  if (!stuck.length) return false;

  const { data: templates } = await supabase
    .from('missions').select('*').eq('type', type).eq('active', true);
  const inUse = new Set((rows || []).map(r => r.mission_id));
  const inUseTitles = new Set((rows || []).filter(r => !stuck.includes(r)).map(r => r.missions?.title));
  const spare = pickDrills((templates || []).filter(t => !inUse.has(t.id) && !inUseTitles.has(t.title)), games, stuck.length);

  let changed = false;
  for (let i = 0; i < stuck.length && i < spare.length; i++) {
    const t = spare[i];
    const { error } = await supabase.from('user_missions').update({
      mission_id:   t.id,
      target_value: t.target_value || 5,
      subject:      drillCriteria(t)?.subject || 'general',
    }).eq('id', stuck[i].id);
    if (error) console.warn('[tailorDailyDrills]', error.message);
    else changed = true;
  }
  return changed;
}

/* ─── Core game event handler ────────────────────────────────────────────── */

// One event at a time. Each one reads a mission's count and writes it back
// plus one; answers a second or two apart used to overlap and overwrite each
// other's increments.
let eventQueue = Promise.resolve();
export function handleGameEvent(event) {
  const run = eventQueue.then(() => handleGameEventNow(event));
  eventQueue = run.catch(() => {});
  return run;
}

async function handleGameEventNow(event) {
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

  // updateSubjectProgress returns nothing. This used to destructure
  // `{ error }` off its result, which throws on undefined, on every single
  // answer, before advanceMissions below ever ran. The caller swallows the
  // rejection, so no daily drill ever moved from playing a game.
  if (type === 'QUESTION_ANSWERED') {
    try { await updateSubjectProgress(userId, subject, correct); }
    catch (e) { console.error('[handleGameEvent] subject_progress', e?.message || e); }
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
    case 'COIN_COLLECTED':    return { xp: 1,                points: 1 };
    // A finished quest (src/data/quests.js). Sent once per quest, the first
    // time it's finished; see src/logic/questProgress.js.
    case 'QUEST_COMPLETED':   return { xp: QUEST_XP,         points: QUEST_XP / 2 };
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
      drillCounts(criteria, event) ||
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
    // The card has always shown "⭐ 15 pts ✨ 30 XP" and nothing ever paid
    // it. Paid once, on the answer that finishes it (status leaves 'active',
    // so this row is never picked up here again).
    if (completed && (m.missions?.xp_reward || m.missions?.point_reward)) {
      updates.push(supabase.rpc('increment_user_progress', {
        p_user_id: userId,
        p_xp:      m.missions.xp_reward || 0,
        p_points:  m.missions.point_reward || 0,
      }));
    }
  }

  if (updates.length) await Promise.all(updates);
}

/* ─── Lesson completion — advances any 'topic_completed' mission ────────── */
export async function advanceTopicMission(userId, subjectKey) {
  await advanceMissions(userId, { type: 'TOPIC_COMPLETED', subject: subjectKey });
}

/* ─── Streak ─────────────────────────────────────────────────────────────── */
//
// The streak lives on `profiles` — that's the row getUserProfile() returns and
// the only one UserProgressContext's `streakDays` ever reads. The previous
// version of this function wrote to `user_settings` instead (as did a second,
// near-identical copy in api/commandCenterService.js), and nothing in the app
// ever called either one. Net effect: `profiles.last_active_date` was never
// written after signup, so `streakDays` evaluated to 0 for every user forever —
// the streak badge never appeared on Home, Family showed "0d streak" for every
// child, and computeReminderState() always believed the user hadn't checked in,
// so the nightly "Streak at risk" notification fired even on days they'd used
// the app. This is now the single writer, and UserProgressContext calls it on
// every load.

/**
 * Records today's visit and advances/resets the streak. Idempotent per day —
 * returns null without writing if today is already recorded, so it's safe to
 * call on every profile load.
 *
 * @param {string} userId
 * @param {object} profile - the freshly-loaded profiles row
 * @returns {Promise<{streak_count:number,last_active_date:string}|null>} the
 *   changed fields, so the caller can merge them into the profile it already
 *   holds instead of re-fetching.
 */
export async function touchStreak(userId, profile) {
  const today = todayStr();
  const last  = profile?.last_active_date ? String(profile.last_active_date).slice(0, 10) : null;
  if (last === today) return null; // already counted today

  // A gap of exactly one calendar day continues the run; anything longer (or a
  // first-ever visit) starts a new one at 1. Note this counts *days*, not
  // hours — someone active at 11pm and again at 8am has an unbroken streak.
  const gap = last ? daysBetween(last, today) : null;
  const streak = gap === 1 ? (profile?.streak_count || 0) + 1 : 1;

  const patch = { streak_count: streak, last_active_date: today };
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) { console.warn('[touchStreak]', error.message); return null; }
  return patch;
}
