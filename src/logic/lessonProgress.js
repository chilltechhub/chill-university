// src/logic/lessonProgress.js
// Which Academy lessons someone has finished, and the last one they opened.
//
// A lesson's practice used to be throwaway: answering every question right
// recorded nothing, the lesson looked the same next time, and Classes had no
// way back to where you were (ship test, 2026-10-07). This keeps the small
// amount needed for "✓ Done 2/2" on a lesson and "Pick up where you left
// off" on Classes. Device-local, per account: subject XP itself goes to the
// server through handleGameEvent, so nothing that counts lives only here.

import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (userId) => `@cth_lessons_${userId || 'guest'}`;
const EMPTY = { done: {}, last: null };

export async function getLessonState(userId) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return { ...EMPTY, ...(parsed || {}), done: { ...(parsed?.done || {}) } };
  } catch {
    return { ...EMPTY, done: {} };
  }
}

async function update(userId, fn) {
  const next = fn(await getLessonState(userId));
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch { /* best effort */ }
  return next;
}

/** entry: { topicKey, classKey, title, score, total } */
export function markLessonDone(userId, entry) {
  return update(userId, st => ({
    ...st,
    done: { ...st.done, [entry.topicKey]: { ...entry, at: new Date().toISOString() } },
  }));
}

/** entry: { topicKey, classKey, title } */
export function setLastLesson(userId, entry) {
  return update(userId, st => ({ ...st, last: { ...entry, at: new Date().toISOString() } }));
}
