// src/logic/useGradeLevel.js
// Replaces the old Beginner/Intermediate/Advanced skill-level system
// (useSkillLevel.js — now unused) with the same grade bands Classes.js
// already uses: K-2, 3-5, 6-8, 9-12. One difficulty model across the whole
// app, so a grade band picked here means the same thing it means there.

import { useState, useEffect, useCallback } from 'react';
import { cacheRead, cacheWrite } from '../api/offlineCache';

export const GRADE_BANDS = [
  { key: 'K-2',  label: 'Grades K–2',  emoji: '🎒', tier: 1 },
  { key: '3-5',  label: 'Grades 3–5',  emoji: '✏️', tier: 2 },
  { key: '6-8',  label: 'Grades 6–8',  emoji: '📐', tier: 3 },
  { key: '9-12', label: 'Grades 9–12', emoji: '🎓', tier: 4 },
];

export function tierForLevel(bandKey) {
  return (GRADE_BANDS.find(b => b.key === bandKey) || GRADE_BANDS[1]).tier;
}

export function levelForTier(tier) {
  const clamped = Math.max(1, Math.min(4, Math.round(tier)));
  return GRADE_BANDS[clamped - 1].key;
}

const KEY = gameId => `gradeLevel:${gameId}`;

/**
 * Persisted grade-band picker for one game.
 * `level` is the saved/selected band key (e.g. '6-8'); `tier` is its 1-4
 * numeric form.
 */
export default function useGradeLevel(gameId) {
  const [level, setLevelState] = useState('3-5');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    cacheRead(KEY(gameId)).then(saved => {
      if (!alive) return;
      if (saved && GRADE_BANDS.some(b => b.key === saved)) setLevelState(saved);
      setReady(true);
    });
    return () => { alive = false; };
  }, [gameId]);

  const setLevel = useCallback((next) => {
    setLevelState(next);
    cacheWrite(KEY(gameId), next);
  }, [gameId]);

  return { level, setLevel, ready, tier: tierForLevel(level) };
}

/**
 * Reads the saved grade band for every game id given, without subscribing
 * to a component's lifecycle. Returns { [gameId]: bandKey | null } — null
 * means the player has never picked a band for that game.
 */
export async function getAllGradeLevels(gameIds) {
  const entries = await Promise.all(
    gameIds.map(async (id) => {
      const saved = await cacheRead(KEY(id));
      return [id, GRADE_BANDS.some(b => b.key === saved) ? saved : null];
    })
  );
  return Object.fromEntries(entries);
}
