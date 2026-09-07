// src/logic/useCoinRewards.js
// Real points for the pennies the pet eats while wandering the stage
// (CharacterWalker.js) — same pipeline every other reward in the app goes
// through (activity_log + increment_user_progress RPC via
// gamificationService's COIN_COLLECTED case), just a much smaller amount
// per coin, and capped per 6-hour cycle like useBonusRewards.js.
//
// The pet is fully autonomous — it wanders and eats on its own, no player
// input at all — so an uncapped reward here would be a pure idle-farm
// loophole: leave the app open and passively rack up points forever.
// Capping it the same way the jump-collectibles already are keeps it a
// nice little bonus without turning into that. A coin the pet eats past
// the cap still plays its eat/pop animation (see CharacterWalker.js) —
// it just doesn't award anything further until the next cycle.

import { useState, useEffect, useCallback } from 'react';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { handleGameEvent } from './gamificationService';

export const COIN_REWARD_POINTS = 1;
const CYCLE_MS = 6 * 60 * 60 * 1000; // 6 hours, matches useBonusRewards.js
const MAX_PER_CYCLE = 12;

function currentCycleId() {
  return Math.floor(Date.now() / CYCLE_MS);
}

export default function useCoinRewards(userId) {
  const key = `coinRewards:${userId || 'anon'}`;
  const [cycleId, setCycleId] = useState(currentCycleId());
  const [creditedCount, setCreditedCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setReady(false);
    cacheRead(key).then(saved => {
      if (!alive) return;
      const nowCycle = currentCycleId();
      setCreditedCount(saved && saved.cycleId === nowCycle ? (saved.count || 0) : 0);
      setCycleId(nowCycle);
      setReady(true);
    });
    return () => { alive = false; };
  }, [key]);

  // A session left open across the 6-hour mark should still get a fresh
  // allowance without needing a screen focus/reload to notice.
  useEffect(() => {
    const id = setInterval(() => {
      const nowCycle = currentCycleId();
      setCycleId(prev => {
        if (prev === nowCycle) return prev;
        setCreditedCount(0);
        return nowCycle;
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, MAX_PER_CYCLE - creditedCount);

  // Call once per coin the pet actually eats. Resolves to the points
  // actually awarded (0 once this cycle's cap is hit, or if there's no
  // signed-in user to credit) — the caller decides whether to show a "+N"
  // popup based on that, not just on having called this.
  const collect = useCallback(async () => {
    const nowCycle = currentCycleId();
    const base = nowCycle === cycleId ? creditedCount : 0;
    if (base >= MAX_PER_CYCLE) {
      if (nowCycle !== cycleId) { setCycleId(nowCycle); setCreditedCount(0); cacheWrite(key, { cycleId: nowCycle, count: 0 }); }
      return 0;
    }
    const next = base + 1;
    setCycleId(nowCycle);
    setCreditedCount(next);
    cacheWrite(key, { cycleId: nowCycle, count: next });
    if (!userId) return 0;
    try {
      await handleGameEvent({ type: 'COIN_COLLECTED', userId, subject: 'general' });
    } catch (e) {
      console.warn('[useCoinRewards] collect failed', e);
      return 0;
    }
    return COIN_REWARD_POINTS;
  }, [userId, cycleId, creditedCount, key]);

  return { ready, remaining, collect, points: COIN_REWARD_POINTS };
}
