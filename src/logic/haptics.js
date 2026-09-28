// src/logic/haptics.js
// Small physical confirmations for the moments that matter: checking off a
// step, a correct answer, a level-up. There were none anywhere in the app.
//
// Never throws and never blocks. A no-op on web, and when the native module
// isn't in the build (expo-haptics ships in Expo Go; a dev-client or store
// build picks it up on its next rebuild).
import { Platform } from 'react-native';

let Haptics = null;
if (Platform.OS !== 'web') {
  try { Haptics = require('expo-haptics'); } catch { Haptics = null; }
}

const safe = (fn) => { try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch { /* not available */ } };

/** A light tap — a step ticked, an item checked off. */
export function tapHaptic() {
  if (!Haptics) return;
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A correct answer. */
export function correctHaptic() {
  if (!Haptics) return;
  safe(() => Haptics.selectionAsync());
}

/** A level-up or a finished goal. */
export function successHaptic() {
  if (!Haptics) return;
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
