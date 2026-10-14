// src/logic/gameXpCap.js
// Games pay XP up to GAME_XP_PER_DAY a day. Before, one game round could
// out-earn a whole day of real work (record_action's 5 XP per action), so
// the app rewarded screen time over doing things. Past the cap, games still
// give points (the prize cards), still count for the streak and still move
// drills; only the XP stops until tomorrow.
//
// Per account, per device, kept in AsyncStorage so a restart doesn't reset
// it. A nudge on the incentives, not a security boundary: the server caps
// each single award (increment_user_progress) either way.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from './dateUtils';

export const GAME_XP_PER_DAY = 100;

const KEY = '@cth_game_xp_day';
let state = null; // { day, user, xp }
let loading = null;

function load() {
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then(raw => { try { state = raw ? JSON.parse(raw) : null; } catch { state = null; } })
      .catch(() => {});
  }
  return loading;
}
load();

function today(userId) {
  const day = todayStr();
  if (!state || state.day !== day || state.user !== userId) state = { day, user: userId, xp: 0 };
  return state;
}

// XP games can still pay today. Synchronous, so a game can read it as it starts.
export function gameXpLeft(userId) {
  return Math.max(0, GAME_XP_PER_DAY - today(userId).xp);
}

// Takes up to `xp` from today's allowance; returns what was granted.
export async function claimGameXp(userId, xp) {
  await load();
  const s = today(userId);
  const granted = Math.max(0, Math.min(xp || 0, GAME_XP_PER_DAY - s.xp));
  if (granted > 0) {
    s.xp += granted;
    AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  }
  return granted;
}
