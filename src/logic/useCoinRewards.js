// src/logic/useCoinRewards.js
// Real points for the pennies the pet eats while wandering the stage
// (CharacterWalker.js): 1 XP + 1 point a coin, at most 12 per six-hour
// window.
//
// The pet is fully autonomous — it wanders and eats on its own, no player
// input at all — so an uncapped reward here would be a pure idle-farm
// loophole. The server counts the 12 (collect_pet_coin, 20260928120000):
// the count used to live only in this device's storage, so signing out and
// in, or a second device, started it over. The device still keeps a copy,
// just to skip calls it knows will pay nothing and to hide the "+1" popup.
//
// Two more rules:
// - Each coin that pays shows in the top bar straight away (collectPetCoin
//   announces it) — before, the server added it but the header kept the old
//   number until something else reloaded the profile.
// - Coins only pay while the screen is in front. The Training tab stays
//   mounted behind others, and its pet kept eating (and earning) where
//   nobody could see it.
//
// A coin eaten past the cap still plays its eat/pop animation (see
// CharacterWalker.js) — it just doesn't award anything until the next window.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { collectPetCoin } from './gamificationService';

export const COIN_REWARD_POINTS = 1;
const CYCLE_MS = 6 * 60 * 60 * 1000; // six hours, the server's window too
const MAX_PER_CYCLE = 12;

function currentCycleId() {
  return Math.floor(Date.now() / CYCLE_MS);
}

export default function useCoinRewards(userId) {
  const key = `coinRewards:${userId || 'anon'}`;
  const focused = useIsFocused();
  const [cycleId, setCycleId] = useState(currentCycleId());
  const [creditedCount, setCreditedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const busy = useRef(false); // one coin in flight at a time

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

  // A session left open across the six-hour mark should still get a fresh
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

  const remaining = focused ? Math.max(0, MAX_PER_CYCLE - creditedCount) : 0;

  // Call once per coin the pet actually eats. Resolves to the points
  // actually awarded (0 off-screen, once this window's 12 are used, or with
  // no signed-in user) — the caller shows a "+N" popup only for those.
  const collect = useCallback(async () => {
    if (!userId || !focused || busy.current) return 0;
    const nowCycle = currentCycleId();
    const base = nowCycle === cycleId ? creditedCount : 0;
    if (base >= MAX_PER_CYCLE) return 0;
    busy.current = true;
    try {
      const { points, remaining: left } = await collectPetCoin(userId);
      // The server's count wins; the old path (no function yet) returns null
      // and the device counts for itself as before.
      const count = left == null ? base + 1 : MAX_PER_CYCLE - left;
      setCycleId(nowCycle);
      setCreditedCount(count);
      cacheWrite(key, { cycleId: nowCycle, count });
      return points;
    } catch (e) {
      console.warn('[useCoinRewards] collect failed', e);
      return 0;
    } finally {
      busy.current = false;
    }
  }, [userId, focused, cycleId, creditedCount, key]);

  return { ready, remaining, collect, points: COIN_REWARD_POINTS };
}
