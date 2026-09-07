// src/logic/skillStats.js
// Per-GAME accuracy history, kept on the device, so the app can answer
// "what is this player actually struggling with?" and point them at the
// Academy lesson that teaches it (see src/data/skillLinks.js for the
// game <-> lesson map, and GameOver.js for where the suggestion appears).
//
// Why local rather than Supabase: the existing `subject_progress` table
// only tracks accuracy per broad SUBJECT ('finance'), which can't tell
// Budget Balance apart from Budget Trail, and `activity_log` rows never
// recorded which game they came from (useGame passes no gameId). Local
// storage also means this works for signed-out guests and offline — both
// normal states for this app — with no schema change. If per-game history
// is ever wanted server-side too, this is the natural place to also fire
// a Supabase write.
//
// A rolling window (last RECENT_RUNS runs per game) rather than a lifetime
// average, so a player who has genuinely improved stops being told they're
// weak at something they've since learned.

import { cacheRead, cacheWrite } from '../api/offlineCache';

const KEY = 'skill_stats_v1';
const RECENT_RUNS = 8;      // how many recent runs per game feed the average
const MIN_RUNS = 2;         // below this, one unlucky run shouldn't label anyone
const WEAK_BELOW = 70;      // accuracy % under which a game counts as "needs work"
const STRONG_ABOVE = 85;    // accuracy % over which it counts as "solid"

// Shape on disk:
//   { [gameId]: { runs: [{ correct, total, at }], attempted, correct } }
// `runs` is the rolling window; the two totals are lifetime counters kept
// alongside it purely so a future "you've answered N questions" stat
// doesn't need the window to have been infinite.

async function readAll() {
  const raw = await cacheRead(KEY);
  return raw && typeof raw === 'object' ? raw : {};
}

/**
 * Record one finished run. Called from GameOver (the one screen that
 * already receives gameId + correct + total for every game in the app),
 * so no per-game wiring is needed.
 */
export async function recordRun(gameId, { correct = 0, total = 0 } = {}) {
  if (!gameId || total <= 0) return;
  try {
    const all = await readAll();
    const prev = all[gameId] || { runs: [], attempted: 0, correct: 0 };
    const runs = [...prev.runs, { correct, total, at: Date.now() }].slice(-RECENT_RUNS);
    all[gameId] = {
      runs,
      attempted: (prev.attempted || 0) + total,
      correct: (prev.correct || 0) + correct,
    };
    await cacheWrite(KEY, all);
  } catch {
    // Never let a stats write break the results screen.
  }
}

/** Rolling accuracy (0-100) for one game, or null with too little history. */
export async function accuracyFor(gameId) {
  const all = await readAll();
  return accuracyFromEntry(all[gameId]);
}

function accuracyFromEntry(entry) {
  if (!entry || !entry.runs?.length) return null;
  const total = entry.runs.reduce((sum, r) => sum + r.total, 0);
  if (!total) return null;
  const correct = entry.runs.reduce((sum, r) => sum + r.correct, 0);
  return Math.round((correct / total) * 100);
}

/**
 * Games the player is measurably struggling with, weakest first — the
 * input to any "suggested lessons" surface. `runs` guards against calling
 * someone weak at a game they've played once.
 */
export async function getWeakGames({ limit = 3, below = WEAK_BELOW } = {}) {
  const all = await readAll();
  return Object.entries(all)
    .map(([gameId, entry]) => ({
      gameId,
      accuracy: accuracyFromEntry(entry),
      runs: entry.runs?.length || 0,
    }))
    .filter(g => g.accuracy != null && g.runs >= MIN_RUNS && g.accuracy < below)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

/** The mirror of getWeakGames — what they're good at, best first. */
export async function getStrongGames({ limit = 3, above = STRONG_ABOVE } = {}) {
  const all = await readAll();
  return Object.entries(all)
    .map(([gameId, entry]) => ({
      gameId,
      accuracy: accuracyFromEntry(entry),
      runs: entry.runs?.length || 0,
    }))
    .filter(g => g.accuracy != null && g.runs >= MIN_RUNS && g.accuracy >= above)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
}

/** Everything, for a progress/debug view. */
export async function getAllSkillStats() {
  const all = await readAll();
  return Object.entries(all).map(([gameId, entry]) => ({
    gameId,
    accuracy: accuracyFromEntry(entry),
    runs: entry.runs?.length || 0,
    attempted: entry.attempted || 0,
    correct: entry.correct || 0,
    lastPlayed: entry.runs?.length ? entry.runs[entry.runs.length - 1].at : null,
  }));
}

export const SKILL_THRESHOLDS = { WEAK_BELOW, STRONG_ABOVE, MIN_RUNS, RECENT_RUNS };
