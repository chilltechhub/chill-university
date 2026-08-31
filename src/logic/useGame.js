// src/logic/useGame.js
import { useState, useCallback, useRef } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { handleGameEvent } from './gamificationService';

export const DIFFICULTY = { easy: 1, medium: 2, hard: 3 };

export default function useGame({ subject = 'general', difficulty = 1, skillLevel = null, onGameEnd }) {
  const { user, recordGuestEvent } = useUserProgress();

  const [score,      setScore]    = useState(0);
  const [lives,      setLives]    = useState(3);
  const [streak,     setStreak]   = useState(0);
  const [bestStreak, setBest]     = useState(0);
  const [correct,    setCorrect]  = useState(0);
  const [attempted,  setAttempt]  = useState(0);
  const [done,       setDone]     = useState(false);
  const startTime                 = useRef(Date.now());
  const questionStart             = useRef(Date.now());
  const questionTimes             = useRef([]);

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const answer = useCallback((isCorrect, { speedBonus = 0 } = {}) => {
    // Track per-question timing
    const elapsed = Date.now() - questionStart.current;
    questionTimes.current.push(elapsed);
    questionStart.current = Date.now();

    setAttempt(a => a + 1);

    if (isCorrect) {
      const streakBonus = streak * 3;
      const pts = Math.round((10 + streakBonus + speedBonus) * difficulty);
      setScore(s => s + pts);
      setStreak(s => {
        const next = s + 1;
        if (next > bestStreak) setBest(next);
        return next;
      });
      setCorrect(c => c + 1);

      // Save to Supabase if logged in, otherwise local guest tracking
      if (user?.id) {
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

      return pts;
    } else {
      setLives(l => l - 1);
      setStreak(0);

      if (user?.id) {
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

      return 0;
    }
  }, [streak, bestStreak, difficulty, user, subject, recordGuestEvent, skillLevel]);

  const endGame = useCallback(() => {
    setDone(true);

    const times       = questionTimes.current;
    const totalSec    = Math.round((Date.now() - startTime.current) / 1000);
    const avgMs       = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const fastestMs   = times.length ? Math.min(...times) : 0;
    const xpEarned    = Math.round(score * 0.5);
    const pointsEarned = Math.round(score * 0.25);

    // Fire GAME_COMPLETED event with full metadata
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
      }).catch(e => console.warn('[useGame] endGame event error', e));
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
  }, [score, correct, attempted, accuracy, bestStreak, user, subject, difficulty, skillLevel, onGameEnd]);

  const reset = useCallback(() => {
    setScore(0); setLives(3); setStreak(0);
    setBest(0); setCorrect(0); setAttempt(0); setDone(false);
    startTime.current     = Date.now();
    questionStart.current = Date.now();
    questionTimes.current = [];
  }, []);

  return {
    score, lives, streak, bestStreak, correct, attempted,
    accuracy, done, answer, endGame, reset,
    isGameOver: lives <= 0,
  };
}
