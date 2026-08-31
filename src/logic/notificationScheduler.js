// src/logic/notificationScheduler.js
// Local, on-device scheduled notifications for daily-task and streak
// reminders — same expo-notifications API CalendarModal.js already uses
// for planner reminders (local/scheduled notifications work fine in Expo
// Go; only *remote* push requires a dev client as of SDK 53+, and this
// module never sends remote push).
//
// Each reminder "kind" has one stable identifier. Every sync cancels that
// kind's previously-scheduled occurrence and, if still needed, schedules
// a fresh one for today — so there's never more than one pending
// notification per kind, and it always reflects today's actual state
// (tasks done, checked in, etc.) rather than stale data from a prior day.

import { Platform } from 'react-native';

let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}

const CHANNEL_ID = 'reminders';
const IDS = {
  dailyTasks: 'daily-tasks-reminder',
  streak: 'streak-reminder',
};

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

// Schedules `id` for today at hour:minute local time, replacing any
// previous occurrence. No-ops if that time has already passed today.
async function scheduleForToday(id, hour, minute, title, body) {
  if (!Notifications) return;
  await cancel(id);
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= new Date()) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
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
  const checkedInToday = !!profile?.last_active_date
    && new Date(profile.last_active_date).toDateString() === new Date().toDateString();
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
    await cancel(IDS.dailyTasks);
    await cancel(IDS.streak);
    return true;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await ensureAndroidChannel();

  if (tasksAllComplete) await cancel(IDS.dailyTasks);
  else await scheduleForToday(IDS.dailyTasks, 19, 0, '📋 Still got tasks today', "You've got daily tasks waiting — a few minutes now keeps the streak alive.");

  if (checkedInToday) await cancel(IDS.streak);
  else await scheduleForToday(IDS.streak, 21, 30, '🔥 Don’t lose your streak', "You haven't checked in today — open the app before midnight to keep your streak.");
  return true;
}

// Settings toggle turning reminders off entirely — cancels both kinds
// immediately rather than waiting for the next sync.
export async function cancelAllReminders() {
  await cancel(IDS.dailyTasks);
  await cancel(IDS.streak);
}
