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
const KINDS = {
  dailyTasks: { prefix: 'daily-tasks-reminder', hour: 19, minute: 0 },
  streak:     { prefix: 'streak-reminder',      hour: 21, minute: 30 },
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
  const { hour, minute } = KINDS[kind];
  const trigger = new Date();
  trigger.setDate(trigger.getDate() + dayOffset);
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= new Date()) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: idFor(kind, dayOffset),
      content: { title, body, sound: true },
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
  const DRILLS = ['📋 Daily Drills open', "Today's Daily Drills are still waiting — a few minutes keeps things moving."];
  const STREAK = ['🔥 Streak at risk', "No check-in at Base yet today — open the app before midnight to keep your streak."];

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
