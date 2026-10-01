// src/logic/gamificationService.js
import { supabase } from '../api/supabaseClient';
import { getRank } from './rankUtils';
import { todayStr, addDays } from './dateUtils';
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

/* ─── Confirmed awards, for the top bar ──────────────────────────────────── */

// Points the server just confirmed — a prize card, a pet coin, a mission or
// drill reward — so the header can show them at once (UserProgressContext
// listens). Before, a drill's "+15 pts" toast showed while the header kept
// the old number until the next full profile reload.
// Listeners get (points, xp, source, meta); `source` says where it came from
// ('pet-coin' for the pet's coins, 'real-action' for record_action XP; RewardToast shows both, coins off
// Training), undefined for everything else.
const awardListeners = new Set();
export function onServerAward(fn) {
  awardListeners.add(fn);
  return () => awardListeners.delete(fn);
}
function announceAward(points, xp = 0, source, meta) {
  if (!points && !xp) return;
  awardListeners.forEach(fn => { try { fn(points || 0, xp || 0, source, meta); } catch {} });
}

// Streak changes made away from UserProgressContext (an action anywhere in
// the app keeps the streak going) reach it here, so the badge updates at once.
const streakListeners = new Set();
export function onStreakChange(fn) {
  streakListeners.add(fn);
  return () => streakListeners.delete(fn);
}
function announceStreak(patch) {
  streakListeners.forEach(fn => { try { fn(patch); } catch {} });
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

// Playing counts as the day's action (the streak) once per day per device:
// the first answer of the day sends it, not every answer.
let gameActionDay = null;
function noteGamePlayed() {
  const today = todayStr();
  if (gameActionDay === today) return;
  gameActionDay = today;
  recordAction('game').then(r => { if (!r) gameActionDay = null; });
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
  if (type === 'QUESTION_ANSWERED' || type === 'GAME_COMPLETED' || type === 'LEVEL_COMPLETED') noteGamePlayed();

  const rewards = calculateRewards({ type, correct, difficulty, metadata });

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

// Answers and finished games pay XP only. Points come from the prize card
// picked at the end of each round (claimRoundPrize below), whose range is
// built from what those answers used to pay — so the number the game shows
// as "points earned" is the number the account gets. Before, the card was
// never saved and answers paid points of their own on the side.
// A wrong answer still earns a little XP for the effort; a finished game's
// XP scales with how much of it was right, and nothing for none right.
function calculateRewards({ type, correct, difficulty, metadata = {} }) {
  switch (type) {
    case 'QUESTION_ANSWERED': return { xp: correct ? 10 * difficulty : 2, points: 0 };
    case 'LEVEL_COMPLETED':   return { xp: 50 * difficulty,  points: 25 * difficulty };
    case 'GAME_COMPLETED': {
      const right = Number(metadata.correct) || 0;
      const asked = Number(metadata.attempted) || 0;
      if (right <= 0) return { xp: 0, points: 0 };
      const share = asked > 0 ? Math.min(1, right / asked) : 1;
      return { xp: Math.max(1, Math.round(30 * difficulty * share)), points: 0 };
    }
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
  const completedIds = [];
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
      completedIds.push({ id: m.id, xp: m.missions.xp_reward || 0, points: m.missions.point_reward || 0 });
    }
  }

  if (updates.length) await Promise.all(updates);

  // Paid after the status write lands: claim_mission_reward() pays the
  // mission's own reward from the missions table, once per mission per
  // day/week, and only for a row that is actually completed. Missions pay up
  // to 3,000 points, far past what increment_user_progress now accepts in one
  // call. A database without the function falls back to the old path.
  for (const done of completedIds) {
    const { data, error } = await supabase.rpc('claim_mission_reward', { p_user_mission_id: done.id });
    if (!error) {
      announceAward(data?.points ?? done.points, data?.xp ?? done.xp);
    } else if (error.code === 'PGRST202') {
      const { error: oldError } = await supabase.rpc('increment_user_progress', { p_user_id: userId, p_xp: done.xp, p_points: done.points });
      if (!oldError) announceAward(done.points, done.xp);
    } else {
      console.warn('[advanceMissions] claim', error.message);
    }
  }
}

/* ─── Round prizes and pet coins ─────────────────────────────────────────── */

// The server checks both (20260928120000): a prize can't beat what that many
// right answers can roll and a round with none right pays nothing; pet coins
// stop at 12 per six hours whatever device or sign-in they come from. A
// database without the functions falls back to the old award, so points
// still land before the SQL is run.

/** Credits the picked prize card. Resolves to the points actually added. */
export async function claimRoundPrize({ userId, points, correct = 0, total = 0 }) {
  const pts = Math.max(0, Math.round(points || 0));
  if (!userId || pts <= 0 || correct <= 0) return 0;
  const { data, error } = await supabase.rpc('claim_round_prize', { p_points: pts, p_correct: correct, p_total: total });
  if (!error) { const got = data?.points ?? pts; announceAward(got); return got; }
  if (error.code !== 'PGRST202') { console.warn('[claimRoundPrize]', error.message); return 0; }
  const capped = Math.min(pts, 150); // increment_user_progress's per-call cap
  const { error: oldError } = await supabase.rpc('increment_user_progress', { p_user_id: userId, p_xp: 0, p_points: capped });
  if (oldError) { console.warn('[claimRoundPrize] fallback', oldError.message); return 0; }
  await logActivity({ userId, type: 'ROUND_PRIZE', subject: 'general', rewards: { xp: 0, points: capped }, metadata: { correct, total } })
    .catch(() => {});
  announceAward(capped);
  return capped;
}

/**
 * One coin the pet ate. Resolves to { points, remaining, nextIn } — points is
 * 0 when it's too soon (one every 3 minutes) or the day's 50 are used;
 * remaining is what's left in the last 24 hours; nextIn is seconds until the
 * next coin can pay. remaining and nextIn are null on older databases.
 */
export async function collectPetCoin(userId) {
  if (!userId) return { points: 0, remaining: null, nextIn: null };
  const { data, error } = await supabase.rpc('collect_pet_coin');
  if (!error) {
    const points = data?.points ?? 0;
    announceAward(points, points, 'pet-coin');
    // next_in: seconds until the next coin can pay (20260930130000). Older
    // databases don't send it.
    return { points, remaining: data?.remaining ?? null, nextIn: data?.next_in ?? null };
  }
  if (error.code !== 'PGRST202') { console.warn('[collectPetCoin]', error.message); return { points: 0, remaining: null, nextIn: null }; }
  await handleGameEvent({ type: 'COIN_COLLECTED', userId, subject: 'general' });
  announceAward(1, 1, 'pet-coin');
  return { points: 1, remaining: null, nextIn: null };
}

/* ─── Lesson completion — advances any 'topic_completed' mission ────────── */
export async function advanceTopicMission(userId, subjectKey) {
  recordAction('lesson', subjectKey);
  await advanceMissions(userId, { type: 'TOPIC_COMPLETED', subject: subjectKey });
}

/* ─── Streak ─────────────────────────────────────────────────────────────── */
//
// The streak lives on `profiles` (streak_count, last_active_date,
// streak_rest_on) and only the server writes it: touch_streak() and
// record_action() (20260927120000, 20260930140000). A day counts when
// something is done in it, through recordAction() below; opening the app
// alone doesn't. One missed day in seven is forgiven (the rest day).

/* ─── Real actions ──────────────────────────────────────────────────────────
 * The one call for "the person did something" (record_action(),
 * 20260930140000): it keeps the streak going, and real-life kinds earn a
 * little XP (5 each, 50 a day, the same item once a day).
 *   planner_done, project_step, area_action, goal_done, checkin  → XP + streak
 *   game, lesson, quest                                         → streak only
 * Opening the app no longer counts as a day: something has to be done.
 * Fire and forget: callers never wait on it, and it never throws.
 */
export const REAL_ACTION_LABELS = {
  planner_done: 'Planner item done',
  project_step: 'Project step done',
  area_action:  'Life area action',
  goal_done:    'Goal finished',
  checkin:      'Checked in',
};

export async function recordAction(kind, ref = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;
    const { data, error } = await supabase.rpc('record_action', {
      p_kind: kind, p_ref: ref == null ? null : String(ref), p_today: todayStr(),
    });
    if (!error) {
      if (data?.xp) announceAward(0, data.xp, 'real-action', { kind, label: REAL_ACTION_LABELS[kind] });
      if (data?.changed) {
        announceStreak({
          streak_count: data.streak_count,
          last_active_date: data.last_active_date,
          streak_rest_on: data.streak_rest_on ?? null,
        });
      }
      return data;
    }
    // Database without record_action() yet: the streak still counts through
    // the older touch_streak(), with no XP.
    if (error.code !== 'PGRST202') { console.warn('[recordAction]', error.message); return null; }
    const { data: t, error: tErr } = await supabase.rpc('touch_streak', { p_today: todayStr() });
    if (!tErr && t?.changed) {
      announceStreak({ streak_count: t.streak_count, last_active_date: t.last_active_date, streak_rest_on: t.streak_rest_on ?? null });
    }
    return t || null;
  } catch (e) {
    console.warn('[recordAction]', e?.message || e);
    return null;
  }
}
