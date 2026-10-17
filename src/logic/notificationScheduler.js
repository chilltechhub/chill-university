// src/logic/notificationScheduler.js
// Local, on-device scheduled notifications for daily-task and streak
// reminders — same expo-notifications API CalendarModal.js already uses
// for planner reminders (local/scheduled notifications work fine in Expo
// Go; only *remote* push requires a dev client as of SDK 53+, and this
// module never sends remote push).
//
// Every sync cancels a kind's previously-scheduled occurrences and reschedules
// from scratch, so there's never a duplicate pending notification and the next
// one always reflects the most recent state we had (tasks done, checked in).

import { Platform } from 'react-native';
import { isToday } from './dateUtils';
import { reminderAt } from './petHunger';
import { readSetting, SETTING_KEYS } from './useSetting';

let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}

const CHANNEL_ID = 'reminders';

// Each reminder kind is scheduled as one-shot notifications across a rolling
// window of days rather than a single occurrence for today.
//
// Why: a reminder only ever gets scheduled while the app is open, and the old
// version scheduled today and today only. So the "Streak at risk" nudge —
// whose entire job is to reach someone who has *not* opened the app — could
// only exist if they had already opened the app that day, and a user who
// skipped a day got no reminder at all on the day it mattered. It also
// silently no-op'd for anyone whose first launch of the day was after 9:30pm.
//
// A rolling window fixes that without lying about state: day 0 reflects what
// we actually know about today, and days 1..N-1 are scheduled optimistically.
// Any day the user does open the app, this re-syncs and cancels whatever no
// longer applies, so an optimistic reminder is only ever delivered on a day
// the app went unopened — which is exactly when it should be.
const WINDOW_DAYS = 7;
// `target` is where a tap lands (src/logic/openTarget.js, opened by
// hubNotifications' tap handler). Without one a tap just opened the app on
// whatever screen it was last on, so "Daily Drills open" didn't lead to
// the drills.
const KINDS = {
  dailyTasks: { prefix: 'daily-tasks-reminder', hour: 19, minute: 0,  target: { kind: 'drills' } },
  streak:     { prefix: 'streak-reminder',      hour: 21, minute: 30, target: { kind: 'home' } },
};
const idFor = (kind, dayOffset) => `${KINDS[kind].prefix}-d${dayOffset}`;

export async function ensureNotificationPermission() {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Android requires a channel before a scheduled notification will actually
// show with sound/importance. Guarded to Android specifically (not just
// left to the library) — calling this on iOS/web is harmless but logs a
// "channels are Android-only" debug line on every launch, which is just
// noise there. Safe to call repeatedly.
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || !Notifications?.setNotificationChannelAsync) return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance?.DEFAULT,
    });
  } catch {}
}

async function cancel(id) {
  if (!Notifications) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}

// Clears every day in a kind's window. Called before rescheduling so a shrunk
// or shifted window can't leave orphaned notifications pending on the device.
async function cancelKind(kind) {
  for (let d = 0; d < WINDOW_DAYS; d++) await cancel(idFor(kind, d));
}

// Schedules `kind` for `dayOffset` days from now at its configured local time.
// Silently skips a time that has already passed (only possible for day 0),
// which is how "opened the app at 11pm" stops producing a same-evening ping.
async function scheduleOn(kind, dayOffset, title, body) {
  if (!Notifications) return;
  const { hour, minute, target } = KINDS[kind];
  const trigger = new Date();
  trigger.setDate(trigger.getDate() + dayOffset);
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= new Date()) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: idFor(kind, dayOffset),
      content: { title, body, sound: true, data: { target } },
      trigger,
    });
  } catch {}
}

// Shared so HomeScreen (on load) and SettingsScreen (on toggling reminders
// on) compute the exact same "is there anything to remind about" state
// from the same UserProgressContext data, instead of two versions drifting.
export function computeReminderState({ dailyMissions, profile }) {
  const tasksAllComplete = !dailyMissions?.length
    || dailyMissions.every((m) => m.status === 'completed' || m.progress >= m.target);
  // Local calendar compare. `new Date('2026-09-05')` parses as UTC midnight, so
  // toDateString() on it returned the previous day west of Greenwich and this
  // read false all day for those users — meaning the "streak at risk" reminder
  // fired every night no matter how much they'd used the app.
  const checkedInToday = isToday(profile?.last_active_date);
  return { tasksAllComplete, checkedInToday };
}

/**
 * Call once per app session after loading today's mission/profile data
 * (see HomeScreen.js). Requests permission itself if reminders are
 * enabled and permission hasn't been decided yet.
 *
 * @param {boolean} enabled          - the user's Settings > Daily Reminders toggle
 * @param {boolean} tasksAllComplete - true if there's nothing left to nudge about today
 * @param {boolean} checkedInToday   - true if today's streak activity is already logged
 * @returns {Promise<boolean>} true if notification permission is granted (so the
 *   caller can revert its toggle UI if the user denies the OS prompt)
 */
export async function syncReminders({ enabled, tasksAllComplete, checkedInToday }) {
  if (!enabled) {
    await cancelKind('dailyTasks');
    await cancelKind('streak');
    return true;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await ensureAndroidChannel();

  await cancelKind('dailyTasks');
  await cancelKind('streak');

  // Copy matches the vocabulary already on screen (GamesScreen's "Daily
  // Drills" button, HomeScreen's "Base" framing) rather than generic
  // "tasks"/"check in" language, so a notification reads like it belongs
  // to the same app instead of a stock reminder plugin.
  const DRILLS = ["📋 Today's drills are up", 'Three quick ones, about 5 minutes.'];
  // Fires only on a day nothing's been done yet (recordAction). It points at
  // the next step instead of the streak: no "at risk", no guilt for a gap
  // (docs/north-star.md). Whether it stays at all is a founder call
  // (docs/north-star-plan-2026-10-17.md, 3.2).
  const STREAK = ['👣 Your next step is ready', "Got a few minutes? It's on Home."];

  for (let d = 0; d < WINDOW_DAYS; d++) {
    // Today is the only day whose state we actually know, so it's the only day
    // a "you're already done" cancellation applies to. Future days are always
    // scheduled — if the user opens the app on one of them, this runs again and
    // clears that day's reminder before it can fire.
    if (d === 0 && tasksAllComplete) { /* nothing left to nudge about today */ }
    else await scheduleOn('dailyTasks', d, ...DRILLS);

    if (d === 0 && checkedInToday) { /* already checked in today */ }
    else await scheduleOn('streak', d, ...STREAK);
  }
  return true;
}

// Settings toggle turning reminders off entirely — cancels both kinds
// immediately rather than waiting for the next sync.
export async function cancelAllReminders() {
  await cancelKind('dailyTasks');
  await cancelKind('streak');
}

// One-off reminder behind a Life Area action ("Set a wind-down reminder for
// tonight"). Fires at the next HH:MM — tonight, or tomorrow if that has
// passed — and re-setting the same action replaces it rather than stacking.
// Resolves to the Date it will fire, or null where a notification can't be
// scheduled (web, or permission refused), so the caller can fall back to
// something that does work there.
// `target` (optional) is where a tap opens, e.g. the life area it came from.
export async function scheduleActionReminder({ key, title, body, time, target }) {
  if (!Notifications || Platform.OS === 'web') return null;
  const [h, m] = String(time || '').split(':').map(Number);
  if (!(h >= 0 && h < 24 && m >= 0 && m < 60)) return null;
  if (!(await ensureNotificationPermission())) return null;
  await ensureAndroidChannel();
  const at = new Date();
  at.setHours(h, m, 0, 0);
  if (at <= new Date()) at.setDate(at.getDate() + 1);
  const identifier = `area-action-${key}`;
  await cancel(identifier);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body: body || undefined, sound: true, data: target ? { target } : {} },
      trigger: Notifications.SchedulableTriggerInputTypes
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at }
        : at,
    });
    return at;
  } catch {
    return null;
  }
}

// ─── The pet's "getting hungry" reminder ─────────────────────────────────────
// One pending notification at most, for when the pet is down to its last
// heart (petHunger.reminderAt: still time to feed it for double bond, never
// at night). Re-synced whenever the bowl changes — loading, feeding, or the
// switch — so a feed always pushes it back. The switch is the pet sheet's
// "Remind me" and Settings → Pet reminders (SETTING_KEYS.PET_REMINDERS,
// on by default).
//
// `ask`: may this show the phone's permission prompt? Only right after the
// person did something with the pet (fed it, switched this on), never on
// launch. Resolves true when it's set (or there's nothing to set), false when
// notifications aren't allowed, null where there are none (web, Expo without
// the module).
const PET_ID = 'pet-hungry';

export async function syncPetReminder({ fullUntil, name, enabled, ask = false }) {
  if (!Notifications || Platform.OS === 'web') return null;
  await cancel(PET_ID);
  const on = enabled ?? await readSetting(SETTING_KEYS.PET_REMINDERS, true);
  if (!on || !name) return true;
  const at = reminderAt(fullUntil);
  if (!at) return true;
  let granted = false;
  if (ask) granted = await ensureNotificationPermission();
  else {
    try { granted = (await Notifications.getPermissionsAsync()).status === 'granted'; } catch {}
  }
  if (!granted) return false;
  await ensureAndroidChannel();
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: PET_ID,
      content: {
        title: `🍎 ${name} is eyeing the food bowl`,
        body: 'Down to one heart.',
        sound: true,
        data: { target: { kind: 'pet' } },
      },
      trigger: Notifications.SchedulableTriggerInputTypes
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) }
        : new Date(at),
    });
  } catch {}
  return true;
}

export async function cancelPetReminder() {
  await cancel(PET_ID);
}
