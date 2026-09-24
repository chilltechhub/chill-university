// src/logic/useGame.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { handleGameEvent } from './gamificationService';

export const DIFFICULTY = { easy: 1, medium: 2, hard: 3 };

export default function useGame({
  subject = 'general', difficulty = 1, skillLevel = null, onGameEnd,
  // Opt-in: when true, `answer()` still tracks correct/attempted/streak/
  // lives (and the analytics event) exactly as before, but stops adding to
  // `score` itself — points only arrive via the returned `addPoints`, for
  // games built around a round-end "pick a prize" reward instead of points
  // trickling in per question. Every other game leaves this off and keeps
  // scoring exactly as it always has.
  manualScoring = false,
}) {
  const { user, recordGuestEvent, refreshProfile, noteDrillProgress } = useUserProgress();

  const [score,      setScore]    = useState(0);
  const [lives,      setLives]    = useState(3);
  // The same count, kept in step synchronously. `lives` is still the
  // pre-answer value inside the caller's handler (and inside two taps that
  // land before a re-render), so answer() reads and returns this instead.
  const livesRef                  = useRef(3);
  const [streak,     setStreak]   = useState(0);
  const [bestStreak, setBest]     = useState(0);
  const [correct,    setCorrect]  = useState(0);
  const [attempted,  setAttempt]  = useState(0);
  const [done,       setDone]     = useState(false);
  const startTime                 = useRef(Date.now());
  const questionStart             = useRef(Date.now());
  const questionTimes             = useRef([]);

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  // Every answer is already saved as it happens (QUESTION_ANSWERED below),
  // but the header's level and points only re-read the profile in endGame().
  // Leaving after a round or two, which is exactly what the first goal's
  // "play one game" step asks for, kept showing LV 1 · 0 PTS over an account
  // the server had already levelled up, and the level-up notice never came.
  // So a game left early re-reads the profile on its way out.
  const answeredRef = useRef(false);
  const endedRef = useRef(false);
  const refreshRef = useRef(refreshProfile);
  refreshRef.current = refreshProfile;
  useEffect(() => () => {
    if (answeredRef.current && !endedRef.current) {
      // A beat late: the last answer's save is still in flight on the way out.
      setTimeout(() => { Promise.resolve(refreshRef.current?.()).catch(() => {}); }, 1500);
    }
  }, []);

  // Returns what the answer did, as of right now:
  //   { points, livesLeft, isOut }
  // `livesLeft`/`isOut` are the post-answer values, so a game can decide
  // "that was the last life" from the return instead of working it out
  // from the stale `game.lives`. Older games still do
  // `game.lives - (isCorrect ? 0 : 1) <= 0`, which gives the same answer.
  const answer = useCallback((isCorrect, { speedBonus = 0 } = {}) => {
    // Track per-question timing
    const elapsed = Date.now() - questionStart.current;
    questionTimes.current.push(elapsed);
    questionStart.current = Date.now();
    answeredRef.current = true;

    setAttempt(a => a + 1);

    if (isCorrect) {
      const streakBonus = streak * 3;
      const pts = Math.round((10 + streakBonus + speedBonus) * difficulty);
      if (!manualScoring) setScore(s => s + pts);
      setStreak(s => {
        const next = s + 1;
        if (next > bestStreak) setBest(next);
        return next;
      });
      setCorrect(c => c + 1);

      // Save to Supabase if logged in, otherwise local guest tracking.
      // noteDrillProgress moves today's drills on screen straight away; the
      // server applies the same rule to the saved rows (src/logic/drills.js).
      if (user?.id) {
        noteDrillProgress?.({ subject, correct: true });
        handleGameEvent({
          type: 'QUESTION_ANSWERED',
          userId: user.id,
          subject,
          correct: true,
          difficulty,
          metadata: skillLevel ? { skillLevel } : undefined,
        }).catch(() => {});
      } else {
        recordGuestEvent({ correct: true, difficulty });
      }

      return { points: pts, livesLeft: livesRef.current, isOut: livesRef.current <= 0 };
    } else {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      setStreak(0);

      if (user?.id) {
        noteDrillProgress?.({ subject, correct: false });
        handleGameEvent({
          type: 'QUESTION_ANSWERED',
          userId: user.id,
          subject,
          correct: false,
          difficulty,
          metadata: skillLevel ? { skillLevel } : undefined,
        }).catch(() => {});
      } else {
        recordGuestEvent({ correct: false, difficulty });
      }

      return { points: 0, livesLeft: livesRef.current, isOut: livesRef.current <= 0 };
    }
  }, [streak, bestStreak, difficulty, user, subject, recordGuestEvent, skillLevel, manualScoring, noteDrillProgress]);

  // For manualScoring games: called when a round-end prize is claimed.
  const addPoints = useCallback((n) => {
    setScore(s => s + Math.max(0, Math.round(n)));
  }, []);

  const endGame = useCallback(() => {
    setDone(true);
    endedRef.current = true;

    const times       = questionTimes.current;
    const totalSec    = Math.round((Date.now() - startTime.current) / 1000);
    const avgMs       = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const fastestMs   = times.length ? Math.min(...times) : 0;
    const xpEarned    = Math.round(score * 0.5);
    const pointsEarned = Math.round(score * 0.25);

    // Fire GAME_COMPLETED event with full metadata, then pull the fresh
    // profile — this is what lets a level-up/rank-up notification fire
    // right after a session ends, instead of only on next app launch.
    if (user?.id) {
      handleGameEvent({
        type: 'GAME_COMPLETED',
        userId: user.id,
        subject,
        difficulty,
        metadata: {
          score,
          correct,
          attempted,
          accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
          bestStreak,
          avgResponseMs: Math.round(avgMs),
          fastestMs:     Math.round(fastestMs),
          totalSeconds:  totalSec,
          skillLevel:    skillLevel || undefined,
        },
      })
        .then(() => refreshProfile())
        .catch(e => console.warn('[useGame] endGame event error', e));
    }

    const result = {
      score, correct, total: attempted, accuracy,
      streak: bestStreak, timeSeconds: totalSec,
      avgTimeSeconds: Math.round(avgMs / 1000),
      fastestSeconds: Math.round(fastestMs / 1000),
      xpEarned, pointsEarned, subject,
    };

    if (onGameEnd) onGameEnd(result);
    return result;
  }, [score, correct, attempted, accuracy, bestStreak, user, subject, difficulty, skillLevel, onGameEnd, refreshProfile]);

  const reset = useCallback(() => {
    setScore(0); setLives(3); livesRef.current = 3; setStreak(0);
    setBest(0); setCorrect(0); setAttempt(0); setDone(false);
    endedRef.current = false;
    startTime.current     = Date.now();
    questionStart.current = Date.now();
    questionTimes.current = [];
  }, []);

  return {
    score, lives, streak, bestStreak, correct, attempted,
    accuracy, done, answer, addPoints, endGame, reset,
    isGameOver: lives <= 0,
  };
}
