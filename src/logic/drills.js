// src/logic/drills.js
// Daily drills: which ones can be set, which games count toward each, and
// how each one is described. Pure, so the server-side counter
// (gamificationService.advanceMissions) and the on-screen one
// (UserProgressContext.noteDrillProgress) can't disagree about what counts.
//
// Why this exists (2026-09-24, fresh-account walkthrough): a new Personal
// account was handed "Coin Counter" and "Quick Calculator" on day one. The
// coin game and every math game were still locked, so two of its three
// drills could not be done, and the Compass step "Finish a daily drill"
// couldn't be either. The missions table also holds criteria types nothing
// in the app ever reports (passages_completed, unique_subjects,
// correct_after_retry, level_completed...), and game-specific ones keyed by
// a game id no event carries. Drills are now only picked when (a) the app
// can count them and (b) this account can play something that counts.

// What useGame / gamificationService actually report. Anything else in the
// missions table is never incremented.
const COUNTED = new Set(['questions_answered', 'correct_answers']);

/** The criteria a drill is judged by, from a user_missions row or a template. */
export function drillCriteria(rowOrTemplate) {
  return rowOrTemplate?.missions?.criteria || rowOrTemplate?.criteria || null;
}

/** True if the app reports the event this drill counts, at all. */
export function drillIsCounted(criteria) {
  if (!criteria || !COUNTED.has(criteria.type)) return false;
  // Tied to one game by id: no game event carries its id, so it never moves.
  if (criteria.game || criteria.gameId) return false;
  return true;
}

/**
 * The games that count toward a drill, out of `games` (what this account can
 * play right now: [{ id, title, subject }]). Empty means none can.
 */
export function gamesForDrill(criteria, games = []) {
  if (!drillIsCounted(criteria)) return [];
  if (!criteria.subject) return games;
  return games.filter(g => g.subject === criteria.subject);
}

/** Can this account finish this drill today, with the games it has? */
export function drillIsPlayable(criteria, games = []) {
  return gamesForDrill(criteria, games).length > 0;
}

/**
 * Does one answered question move this drill? Shared by the server-side
 * counter and the instant on-screen one.
 *   event: { type: 'QUESTION_ANSWERED', subject, correct }
 */
export function drillCounts(criteria, event) {
  if (!drillIsCounted(criteria) || event?.type !== 'QUESTION_ANSWERED') return false;
  if (criteria.subject && criteria.subject !== event.subject) return false;
  if (criteria.type === 'correct_answers') return !!event.correct;
  return true;
}

/**
 * Today's drills from `pool` (missions-table templates), for someone who can
 * play `games`. Easy first, and a spread: one "play N", one "get N right",
 * and one tied to a subject they can actually play when there is one, so
 * the three read as a plan rather than three versions of the same thing.
 */
export function pickDrills(pool = [], games = [], count = 3) {
  const ok = pool.filter(t => drillIsPlayable(drillCriteria(t), games));
  const byTarget = (a, b) => (a.target_value || 0) - (b.target_value || 0);
  const general = ok.filter(t => !drillCriteria(t).subject).sort(byTarget);
  const subject = ok.filter(t => drillCriteria(t).subject)
    .sort(() => Math.random() - 0.5);

  const picked = [];
  const take = (t) => { if (t && !picked.includes(t) && picked.length < count) picked.push(t); };
  take(general.find(t => drillCriteria(t).type === 'questions_answered'));
  take(general.find(t => drillCriteria(t).type === 'correct_answers'));
  take(subject[0]);
  // Fill from the rest, easiest first, skipping repeats of a title.
  [...general, ...subject].forEach(t => {
    if (picked.some(p => p.title === t.title)) return;
    take(t);
  });
  return picked;
}

const SUBJECT_WORDS = {
  math: 'math', language_arts: 'reading and writing', science: 'science', health: 'health',
  finance: 'money', mental: 'mental wellness', social_skills: 'people skills', career: 'career',
  technology: 'tech', social_studies: 'social studies', arts: 'art and music',
  foreign_language: 'language', home_ec: 'home skills', general: 'mixed',
};

/**
 * One plain line on how to do a drill, naming the game when there's one
 * obvious one: "Answer 5 questions in any game." / "Get 3 right in
 * Mind Gym." Used on the drill card and the Home widget.
 */
export function drillHow(criteria, target, games = []) {
  const matching = gamesForDrill(criteria, games);
  const n = target || 1;
  const verb = criteria?.type === 'correct_answers'
    ? `Get ${n} right`
    : `Answer ${n} question${n === 1 ? '' : 's'}`;
  if (!matching.length) return `${verb}. None of your games count toward this one yet.`;
  if (!criteria.subject) return `${verb} in any game.`;
  if (matching.length === 1) return `${verb} in ${matching[0].title}.`;
  return `${verb} in any ${SUBJECT_WORDS[criteria.subject] || criteria.subject} game (${matching.map(g => g.title).join(', ')}).`;
}
