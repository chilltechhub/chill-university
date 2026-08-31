// src/logic/useBonusRewards.js
// A recharging batch of jump-for-points collectibles: every 6-hour cycle,
// a random 2-4 of them spawn across the stage, each worth real points via
// the same gamificationService pipeline every other reward in the app
// goes through (activity_log + increment_user_progress RPC). Local-first
// (AsyncStorage, same pattern as useFolders.js) — which ones you've
// already grabbed this cycle is tracked per-account, no backend migration
// needed.

import { useState, useEffect, useCallback } from 'react';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { handleGameEvent } from './gamificationService';

export const BONUS_REWARD_POINTS = 15;
const CYCLE_MS = 6 * 60 * 60 * 1000; // 6 hours
// Possible x-positions along the stage (as a fraction of its width) —
// a cycle's count picks the first N of these, so they're always spread
// out left-to-right rather than clustered.
const SLOT_FRACTIONS = [0.22, 0.42, 0.62, 0.82];

function currentCycleId() {
  return Math.floor(Date.now() / CYCLE_MS);
}

// A deterministic "random" count (2-4) for a given cycle — same for
// everyone during that 6-hour window, and stable across reloads without
// needing to persist which count we picked.
function countForCycle(cycleId) {
  let h = cycleId ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = h ^ (h >>> 16);
  return 2 + (Math.abs(h) % 3); // 2, 3, or 4
}

export default function useBonusRewards(userId, onClaimed) {
  const key = `bonusRewards:${userId || 'anon'}`;
  const [cycleId, setCycleId] = useState(currentCycleId());
  const [claimedIndices, setClaimedIndices] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setReady(false);
    cacheRead(key).then(saved => {
      if (!alive) return;
      const nowCycle = currentCycleId();
      setClaimedIndices(saved && saved.cycleId === nowCycle ? (saved.claimedIndices || []) : []);
      setCycleId(nowCycle);
      setReady(true);
    });
    return () => { alive = false; };
  }, [key]);

  // A session left open across the 6-hour mark should still get a fresh
  // batch without needing a screen focus/reload to notice.
  useEffect(() => {
    const id = setInterval(() => {
      const nowCycle = currentCycleId();
      setCycleId(prev => {
        if (prev === nowCycle) return prev;
        setClaimedIndices([]);
        return nowCycle;
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const count = countForCycle(cycleId);
  const slots = SLOT_FRACTIONS.slice(0, count).map((xFraction, index) => ({
    index,
    xFraction,
    claimed: claimedIndices.includes(index),
  }));

  const claim = useCallback(async (index) => {
    if (!userId || claimedIndices.includes(index)) return false;
    const next = [...claimedIndices, index];
    setClaimedIndices(next);
    cacheWrite(key, { cycleId, claimedIndices: next });
    try {
      await handleGameEvent({ type: 'BONUS_REWARD_CLAIMED', userId, subject: 'general' });
      if (onClaimed) onClaimed();
    } catch (e) {
      console.warn('[useBonusRewards] claim failed', e);
    }
    return true;
  }, [userId, claimedIndices, key, cycleId, onClaimed]);

  return { ready, slots, claim, points: BONUS_REWARD_POINTS, nextResetAt: (cycleId + 1) * CYCLE_MS };
}
