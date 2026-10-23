// src/api/welcomeStore.js
// The welcome's answers, kept on the phone only (@cth_welcome_v1): what
// brought them, where they are in life, what pulls them in, the path and
// first project they picked, their first name, the card they were on, and
// whether they finished and kept going as a guest.
// No age, ever. Nothing here leaves the phone until signup, when
// MultiStepOnboarding's finish() copies it into the account
// (src/api/claimLocal.js) and forgets the answers.
//
// Shapes and rules: src/logic/welcomeCards.js.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WELCOME_KEY, normalizeWelcome, welcomeEnabled, startHerePatch } from '../logic/welcomeCards';
import { readSetting, SETTING_KEYS } from '../logic/useSetting';

// Set by LoginScreen the first time anyone signs in on this device.
export const SIGNED_IN_BEFORE_KEY = '@cth_signed_in_before';
// Set by "New here? Start here" on Login; cleared when someone signs in.
// Device-only (not a synced pref).
export const WELCOME_CHOSEN_KEY = '@cth_welcome_chosen';

export async function loadWelcome() {
  try {
    const raw = await AsyncStorage.getItem(WELCOME_KEY);
    return normalizeWelcome(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeWelcome(null);
  }
}

// Told whenever the answers change (useDashboardV2 listens for "kept going
// as a guest").
const listeners = new Set();
export function onWelcomeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Writes are queued so two quick answers can't overwrite each other.
let queue = Promise.resolve();
export function saveWelcome(patch) {
  const run = queue.then(async () => {
    const next = normalizeWelcome({ ...(await loadWelcome()), ...patch });
    await AsyncStorage.setItem(WELCOME_KEY, JSON.stringify(next));
    listeners.forEach(fn => { try { fn(next); } catch { /* a listener's problem */ } });
    return next;
  });
  queue = run.catch(() => {});
  return run;
}

/** WELCOME_V1: is the welcome what a signed-out person sees? */
export async function isWelcomeOn() {
  const [setting, before, chosen] = await Promise.all([
    readSetting(SETTING_KEYS.WELCOME_V1, null).catch(() => null),
    AsyncStorage.getItem(SIGNED_IN_BEFORE_KEY).catch(() => null),
    AsyncStorage.getItem(WELCOME_CHOSEN_KEY).catch(() => null),
  ]);
  return welcomeEnabled(setting, !!before, !!chosen);
}

/** "New here? Start here": the welcome is on for this device, from the top or where it was. */
export async function chooseWelcome() {
  await AsyncStorage.setItem(WELCOME_CHOSEN_KEY, '1');
  const patch = startHerePatch(await loadWelcome());
  if (patch) await saveWelcome(patch);
}

/** Someone signed in: a later sign-out opens on Login again. */
export function forgetWelcomeChoice() {
  return AsyncStorage.removeItem(WELCOME_CHOSEN_KEY).catch(() => {});
}

/**
 * After signup has copied the answers into the account: keep only "the
 * welcome is done", so a later sign-out lands on Login and nobody else who
 * signs up on this phone inherits these answers.
 */
export function forgetWelcomeAnswers() {
  return saveWelcome({
    startPoint: null, shakiest: null, pathKey: null, firstName: null, goals: [], interests: [], projectKind: null, at: null,
    unit1Done: false, done: true, guest: false,
  });
}
