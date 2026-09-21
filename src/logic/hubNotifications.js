// src/logic/hubNotifications.js
// The phone side of the Notification Center. Everything is a local,
// scheduled notification (expo-notifications) — no server push — so it works
// in Expo Go and dev builds alike, and does nothing on web.
//
//   Plan reminders  With "remind me before my plans" on, every timed planner
//                   item in the next 7 days gets a reminder `autoRemind`
//                   minutes before it (planReminderActions.js does the
//                   scheduling, with its Done / Snooze / Tomorrow buttons).
//                   Ones the person switched off stay off (SUPPRESS_KEY), and
//                   ones they set by hand are left alone.
//   Daily nudge     At most ONE notification a day, at their chosen time,
//                   outside quiet hours: the top notice (notices.pickNudge).
//   Snooze          "Remind me later" on a notice schedules it to come back.
//   Taps            Any notification carrying a `target` opens that thing
//                   (openTarget.js), including a cold start from a tap.
//
// syncHub() is idempotent: it cancels what it owns and reschedules from the
// current feed, so calling it on every app focus is safe and keeps pending
// notifications honest (a plan marked done stops its reminder).

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { schedulePlanReminder, cancelPlanReminder, hasScheduledReminder } from './planReminderActions';
import { ensureNotificationPermission, ensureAndroidChannel } from './notificationScheduler';
import { pickNudge, inQuietHours } from './notices';
import { openTarget } from './openTarget';

let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}

const PHONE = Platform.OS !== 'web' && !!Notifications;
const AUTO_KEY = '@cth_hub_auto_v1';
const SUPPRESS_KEY = '@cth_hub_suppressed_v1';
const NUDGE_ID = 'hub-nudge';
// iOS keeps at most 64 pending local notifications per app. The streak and
// daily-drill reminders use 14, hand-set plan reminders some more; this
// leaves room for them.
const MAX_AUTO = 30;

async function readSet(key) {
  try { return new Set(JSON.parse((await AsyncStorage.getItem(key)) || '[]')); } catch { return new Set(); }
}
const writeSet = (key, set) => AsyncStorage.setItem(key, JSON.stringify([...set])).catch(() => {});

async function granted() {
  if (!PHONE) return false;
  try { return (await Notifications.getPermissionsAsync()).status === 'granted'; } catch { return false; }
}

// Asks the OS (the one place in the center that may prompt). Resolves true
// when notifications can be sent.
export async function requestPhonePermission() {
  if (!PHONE) return false;
  const ok = await ensureNotificationPermission();
  if (ok) await ensureAndroidChannel();
  return ok;
}

function fireTime(inst, lead) {
  const [h, m] = String(inst.start_time).split(':').map(Number);
  const at = new Date(`${inst.date}T00:00:00`);
  at.setHours(h, m - lead, 0, 0);
  return at;
}

function nextAt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const at = new Date();
  at.setHours(h, m, 0, 0);
  if (at <= new Date()) at.setDate(at.getDate() + 1);
  return at;
}

const dateTrigger = (date) => (Notifications.SchedulableTriggerInputTypes
  ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date }
  : date);

// feed: noticeStore's feed ({ data.planner, visible }). prefs: noticeStore prefs.
export async function syncHub({ prefs, feed }) {
  if (!(await granted())) return;
  await ensureAndroidChannel();

  // ── Plan reminders ───────────────────────────────────────────────────────
  const auto = await readSet(AUTO_KEY);
  const suppressed = await readSet(SUPPRESS_KEY);
  const lead = prefs.autoRemind === 'off' ? null : Number(prefs.autoRemind) || 0;
  const desired = new Map();
  if (lead !== null) {
    const now = new Date();
    const horizon = Date.now() + 7 * 86400000;
    for (const i of feed.data?.planner || []) {
      if (i.completed || i.skipped || !i.start_time || suppressed.has(i.id)) continue;
      const at = fireTime(i, lead);
      if (at <= now || at.getTime() > horizon) continue;
      desired.set(i.id, i);
      if (desired.size >= MAX_AUTO) break;
    }
  }
  for (const id of auto) if (!desired.has(id)) await cancelPlanReminder(id);
  const nextAuto = new Set();
  for (const [id, inst] of desired) {
    // A reminder the person set by hand wins; don't touch it.
    if (!auto.has(id) && await hasScheduledReminder(id)) continue;
    // Rescheduled every sync so an edited time or title is picked up.
    if (await schedulePlanReminder(inst, lead)) nextAuto.add(id);
  }
  await writeSet(AUTO_KEY, nextAuto);

  // ── Daily nudge ──────────────────────────────────────────────────────────
  try { await Notifications.cancelScheduledNotificationAsync(NUDGE_ID); } catch {}
  if (prefs.dailyNudge && !inQuietHours(prefs.nudgeTime, prefs.quiet)) {
    const n = pickNudge(feed.visible || []);
    if (n) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: NUDGE_ID,
          content: {
            title: n.title,
            body: n.body || undefined,
            data: { hub: true, target: n.primary?.target || n.secondary?.target || { kind: 'root', key: 'Notifications' } },
          },
          trigger: dateTrigger(nextAt(prefs.nudgeTime)),
        });
      } catch (e) { console.warn('[hub] nudge', e?.message); }
    }
  }
}

// The person switched one plan's reminder on or off from the center. Off
// sticks even with auto reminders on; on means it's theirs, not auto's.
export async function setPlanReminder(inst, on, lead = 15) {
  const suppressed = await readSet(SUPPRESS_KEY);
  const auto = await readSet(AUTO_KEY);
  auto.delete(inst.id);
  await writeSet(AUTO_KEY, auto);
  if (on) {
    suppressed.delete(inst.id);
    await writeSet(SUPPRESS_KEY, suppressed);
    return !!(await schedulePlanReminder(inst, lead));
  }
  suppressed.add(inst.id);
  await writeSet(SUPPRESS_KEY, suppressed);
  await cancelPlanReminder(inst.id);
  return false;
}

// A reminder set by hand in the Planner's own sheet — take it off auto's list
// so auto never cancels it.
export async function markManualReminder(instanceId) {
  const auto = await readSet(AUTO_KEY);
  if (auto.delete(instanceId)) await writeSet(AUTO_KEY, auto);
}

// "Remind me later" on a notice.
export async function scheduleNoticeReminder(notice, at) {
  if (!(await granted())) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `hub-snooze-${notice.id}`.slice(0, 120),
      content: {
        title: notice.title,
        body: notice.body || undefined,
        data: { hub: true, target: notice.primary?.target || notice.secondary?.target || { kind: 'root', key: 'Notifications' } },
      },
      trigger: dateTrigger(at),
    });
    return true;
  } catch { return false; }
}

// ── Taps ───────────────────────────────────────────────────────────────────

let getNav = null;
let pending = null;
const handled = new Set();

function go(target) {
  const nav = getNav?.();
  if (nav?.isReady?.()) openTarget(nav, target).catch(() => {});
  else pending = target;
}

function onResponse(response) {
  // The Done / Snooze / Tomorrow buttons are planReminderActions.js's.
  if (response?.actionIdentifier && response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const req = response?.notification?.request;
  const key = `${req?.identifier}|${response?.notification?.date}`;
  if (handled.has(key)) return;
  handled.add(key);
  const data = req?.content?.data || {};
  const target = data.target || (data.kind === 'plan-instance' ? { kind: 'planner' } : null);
  if (target) go(target);
}

// Call once from App.js with a getter for the navigation ref.
export function initHubNotifications(navGetter) {
  getNav = navGetter;
  if (!PHONE) return;
  try {
    // Show reminders even while the app is open — a reminder that only
    // appears when you're somewhere else in the phone is half a reminder.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true, shouldShowAlert: true,
        shouldPlaySound: true, shouldSetBadge: false,
      }),
    });
    Notifications.addNotificationResponseReceivedListener(onResponse);
    Notifications.getLastNotificationResponseAsync?.().then(r => { if (r) onResponse(r); }).catch(() => {});
  } catch (e) { console.warn('[hub] init', e?.message); }
}

// App.js calls this once navigation is ready, for a tap that cold-started
// the app before there was anywhere to go.
export function flushPendingTarget() {
  if (!pending) return;
  const t = pending;
  pending = null;
  go(t);
}
