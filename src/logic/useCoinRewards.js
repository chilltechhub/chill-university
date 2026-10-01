// src/logic/useCoinRewards.js
// Real points for the coins the pet finds while wandering the stage
// (CharacterWalker.js): 1 XP + 1 point a coin, one every 3 minutes (20 an
// hour), at most 50 in any 24 hours.
//
// The pet is fully autonomous — it wanders and eats on its own, no player
// input at all — so the limits are what keep this from being a pure idle
// farm. The server enforces both (collect_pet_coin, 20260930130000) and says
// when the next coin can pay; this hook remembers that, so the walker only
// puts a coin down when it will actually pay and a relaunch doesn't start the
// clock over. Before 2026-09-30 the rule was 12 per six hours.
//
// Two more rules:
// - Each coin that pays shows in the top bar straight away (collectPetCoin
//   announces it) — before, the server added it but the header kept the old
//   number until something else reloaded the profile. Off Training, where
//   you can't see the pet eat it, src/components/CoinRewardToast.js shows
//   that it happened.
// - Coins pay while the app is open, on any screen: being in the app is the
//   reward. (Until 2026-09-30 they paid only while Training was in front.)
//   They stop while the app is in the background.
//
// Guests get the same coin every 3 minutes to watch, with nothing credited.

import { useState, useEffect, useCallback, useRef } from 'react';
import useAppActive from './useAppActive';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { collectPetCoin } from './gamificationService';

export const COIN_REWARD_POINTS = 1;
export const COIN_GAP_MS = 3 * 60 * 1000;
export const COIN_DAILY_MAX = 50;

export default function useCoinRewards(userId) {
  const key = `petCoins:v2:${userId || 'anon'}`;
  const appOpen = useAppActive();
  // Left in the current 24 hours, as the server last said (null = not asked yet).
  const [left, setLeft] = useState(null);
  // When the next coin can pay (ms). 0 = now.
  const [nextAt, setNextAt] = useState(0);
  const [ready, setReady] = useState(false);
  const busy = useRef(false); // one coin in flight at a time

  useEffect(() => {
    let alive = true;
    setReady(false);
    cacheRead(key).then(saved => {
      if (!alive) return;
      setLeft(typeof saved?.left === 'number' ? saved.left : null);
      setNextAt(typeof saved?.nextAt === 'number' ? saved.nextAt : 0);
      setReady(true);
    });
    return () => { alive = false; };
  }, [key]);

  // A 0 only holds until the server's "next" time: past it, the oldest coin
  // has left the 24-hour window and there's room again.
  const capped = left === 0 && Date.now() < nextAt;
  const remaining = !appOpen || capped ? 0 : (left ?? COIN_DAILY_MAX);

  // Call once per coin the pet actually eats. Resolves to the points
  // actually awarded (0 in the background, too soon, past the day's 50, or
  // with no signed-in user) — the caller shows a "+N" popup only for those.
  const collect = useCallback(async () => {
    if (!appOpen || busy.current) return 0;
    if (!userId) { setNextAt(Date.now() + COIN_GAP_MS); return 0; }
    busy.current = true;
    try {
      const { points, remaining: serverLeft, nextIn } = await collectPetCoin(userId);
      // The server's numbers win. An older database without next_in still
      // gets the 3-minute rhythm from here.
      const next = Date.now() + (nextIn != null ? nextIn * 1000 : COIN_GAP_MS);
      const nextLeft = serverLeft ?? null;
      setNextAt(next);
      setLeft(nextLeft);
      cacheWrite(key, { left: nextLeft, nextAt: next });
      return points;
    } catch (e) {
      console.warn('[useCoinRewards] collect failed', e);
      setNextAt(Date.now() + COIN_GAP_MS);
      return 0;
    } finally {
      busy.current = false;
    }
  }, [userId, appOpen, key]);

  return { ready, remaining, nextAt, collect, points: COIN_REWARD_POINTS };
}
