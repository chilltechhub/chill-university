// src/logic/useSkillLevel.js
// Shared skill-level system for all games — replaces the old unused "grade"
// concept. Players pick Beginner / Intermediate / Advanced per game; the
// choice is remembered locally (AsyncStorage via offlineCache) and reused
// as the starting point next time they open that game.

import { useState, useEffect, useCallback } from 'react';
import { cacheRead, cacheWrite } from '../api/offlineCache';

export const SKILL_LEVELS = [
  { key: 'beginner',     label: 'Beginner',     emoji: '🌱', tier: 1 },
  { key: 'intermediate', label: 'Intermediate', emoji: '⚡', tier: 2 },
  { key: 'advanced',     label: 'Advanced',     emoji: '🔥', tier: 3 },
];

export function tierForLevel(levelKey) {
  return (SKILL_LEVELS.find(l => l.key === levelKey) || SKILL_LEVELS[1]).tier;
}

export function levelForTier(tier) {
  const clamped = Math.max(1, Math.min(3, Math.round(tier)));
  return SKILL_LEVELS[clamped - 1].key;
}

const KEY = gameId => `skillLevel:${gameId}`;

/**
 * Persisted skill-level picker for one game.
 * `level` is the saved/selected tier key; `tier` is its 1-3 numeric form.
 */
export default function useSkillLevel(gameId) {
  const [level, setLevelState] = useState('intermediate');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    cacheRead(KEY(gameId)).then(saved => {
      if (!alive) return;
      if (saved && SKILL_LEVELS.some(l => l.key === saved)) setLevelState(saved);
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
 * Reads the saved skill level for every game id given, without subscribing
 * to a component's lifecycle. Returns { [gameId]: levelKey | null } — null
 * means the player has never picked a level for that game (never trained).
 * Used by the Training Center's Progress tab and game grid.
 */
export async function getAllSkillLevels(gameIds) {
  const entries = await Promise.all(
    gameIds.map(async (id) => {
      const saved = await cacheRead(KEY(id));
      return [id, SKILL_LEVELS.some(l => l.key === saved) ? saved : null];
    })
  );
  return Object.fromEntries(entries);
}
