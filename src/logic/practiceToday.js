// src/logic/practiceToday.js
// Rounds finished in Practice today, on this device. It's the counter behind
// the goal step "Finish a round in Practice" (objectives.js, step id
// 'mission'), which used to count the daily XP drills; those retired with
// Challenges in shake-up P5. A round counts when it ends (useGame endGame).

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from './dateUtils';

const KEY = '@cth_practice_today';
let state = { day: null, count: 0 };
let loaded = null;
const listeners = new Set();
const countFor = (s) => (s.day === todayStr() ? s.count : 0);

function load() {
  if (!loaded) {
    loaded = AsyncStorage.getItem(KEY)
      .then(raw => { const v = raw ? JSON.parse(raw) : null; if (v && typeof v.count === 'number') state = v; })
      .catch(() => {})
      .then(() => { listeners.forEach(fn => fn(countFor(state))); });
  }
  return loaded;
}

/** A Practice round ended. */
export function notePracticeRound() {
  const day = todayStr();
  state = { day, count: state.day === day ? state.count + 1 : 1 };
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  listeners.forEach(fn => fn(state.count));
}

/** Rounds finished today (0 on a new day). */
export default function usePracticeToday() {
  const [count, setCount] = useState(() => countFor(state));
  useEffect(() => {
    listeners.add(setCount);
    load().then(() => setCount(countFor(state)));
    return () => { listeners.delete(setCount); };
  }, []);
  return count;
}
