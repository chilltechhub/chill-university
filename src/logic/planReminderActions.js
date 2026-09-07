// src/logic/planReminderActions.js
// Plan-aware reminders — turns a planner instance's reminder from a static
// "here's what's coming up" alert into one with Done / Snooze / Reschedule
// buttons right on the notification itself, wired straight back to
// plannerService's own instance functions (src/api/plannerService.js) so
// acting on a reminder doesn't require opening the app.
//
// Where the scheduled notification's id used to live: PlannerScreen
// previously stashed it in agenda_instances.notes as "notif:<id>" — which
// clobbered any real notes on that instance the moment its reminder was
// turned on (the whole notes column got overwritten, not appended to).
// It's kept here instead, in a small local id map (AsyncStorage via
// offlineCache's cache helpers) keyed by instance id, so a user's actual
// notes are never touched by scheduling a reminder.

import { Platform } from 'react-native';
import { completeInstance, rescheduleInstance } from '../api/plannerService';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { dateStr } from './dateUtils';

let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}

const CATEGORY = 'plan-instance';
const MAP_KEY  = 'plan_reminder_notif_ids';
const ACTIONS  = { done: 'done', snooze: 'snooze', reschedule: 'reschedule' };

async function getIdMap()  { return (await cacheRead(MAP_KEY)) || {}; }
async function setIdMap(m) { await cacheWrite(MAP_KEY, m); }

async function rememberNotifId(instanceId, notifId) {
  const map = await getIdMap();
  if (notifId) map[instanceId] = notifId; else delete map[instanceId];
  await setIdMap(map);
}

// Registers the Done/Snooze/Reschedule action set shown on the notification
// itself. Actionable categories are iOS/Android-only — expo-notifications
// has no equivalent on web — so this (and everything else in this module)
// silently no-ops there, same as notificationScheduler.js's guards.
export async function registerPlanReminderCategory() {
  if (!Notifications?.setNotificationCategoryAsync || Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: ACTIONS.done,       buttonTitle: 'Done ✓',     options: { opensAppToForeground: false } },
      { identifier: ACTIONS.snooze,     buttonTitle: 'Snooze 15m', options: { opensAppToForeground: false } },
      { identifier: ACTIONS.reschedule, buttonTitle: 'Tomorrow',   options: { opensAppToForeground: false } },
    ]);
  } catch (e) { console.warn('registerPlanReminderCategory', e); }
}

// Cancels any previously-scheduled reminder for this instance (editing an
// instance's time/reminder settings shouldn't leave the old one pending),
// then schedules a fresh one `minutesBefore` its start_time.
export async function schedulePlanReminder(instance, minutesBefore = 15) {
  if (!Notifications || !instance?.start_time || Platform.OS === 'web') return null;
  await cancelPlanReminder(instance.id);
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const [h, m] = instance.start_time.split(':').map(Number);
    const trigger = new Date(instance.date + 'T00:00:00');
    trigger.setHours(h, m, 0, 0);
    trigger.setMinutes(trigger.getMinutes() - minutesBefore);
    if (trigger <= new Date()) return null;
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🗓️ ' + instance.title,
        body: `Starts at ${instance.start_time}`,
        sound: true,
        categoryIdentifier: CATEGORY,
        data: { instanceId: instance.id, kind: CATEGORY },
      },
      trigger,
    });
    await rememberNotifId(instance.id, notifId);
    return notifId;
  } catch (e) { console.warn('schedulePlanReminder', e); return null; }
}

// Lets InstanceModal (PlannerScreen.js) know whether an instance it's
// re-opening for edit already has a pending reminder — nothing on the row
// itself says so any more now that the id lives here instead of notes.
export async function hasScheduledReminder(instanceId) {
  if (!instanceId) return false;
  const map = await getIdMap();
  return !!map[instanceId];
}

// Call when an instance's reminder is turned off, or the instance itself
// is deleted — otherwise a stale notification fires for something that no
// longer needs it.
export async function cancelPlanReminder(instanceId) {
  if (!Notifications || !instanceId) return;
  const map = await getIdMap();
  const notifId = map[instanceId];
  if (!notifId) return;
  try { await Notifications.cancelScheduledNotificationAsync(notifId); } catch {}
  await rememberNotifId(instanceId, null);
}

// The notification's own "Snooze" action — a one-off "ask me again
// shortly" that doesn't touch the instance row, just re-fires a plain
// reminder a bit later.
async function snoozeReminder(instanceId, title, minutes = 15) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🗓️ ' + (title || 'Reminder'),
        body: `Snoozed — back in ${minutes} min`,
        sound: true,
        categoryIdentifier: CATEGORY,
        data: { instanceId, kind: CATEGORY },
      },
      trigger: { seconds: minutes * 60 },
    });
  } catch (e) { console.warn('snoozeReminder', e); }
}

// Response handler — Done/Snooze/Reschedule act on the instance directly
// from the notification, no need to open the app first. A plain tap (no
// actionIdentifier, or the OS's own default-tap identifier) is left alone
// here and just opens the app as normal.
async function handleResponse(response) {
  const content = response?.notification?.request?.content;
  const data = content?.data;
  if (!data || data.kind !== CATEGORY || !data.instanceId) return;
  const action = response.actionIdentifier;
  try {
    if (action === ACTIONS.done) {
      await completeInstance(data.instanceId, true);
    } else if (action === ACTIONS.snooze) {
      await snoozeReminder(data.instanceId, content.title?.replace(/^🗓️ /, ''));
    } else if (action === ACTIONS.reschedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await rescheduleInstance(data.instanceId, dateStr(tomorrow));
    }
  } catch (e) { console.warn('planReminderActions: handleResponse', e); }
}

// Call once at app startup (see App.js) — registers the action category
// and starts listening for taps on any of its buttons. Safe to call more
// than once; each call just re-registers the same category and adds
// another listener.
export function initPlanReminders() {
  registerPlanReminderCategory();
  if (!Notifications?.addNotificationResponseReceivedListener) return null;
  return Notifications.addNotificationResponseReceivedListener(handleResponse);
}
