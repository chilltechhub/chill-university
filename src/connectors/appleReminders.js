// src/connectors/appleReminders.js
// Apple Reminders → the Capture Inbox (docs/connections-plan-2026-10-18.md,
// Phase A). Pull only: open reminders from the lists the person picks land
// in the Inbox once each, to be sorted like anything else. Reminders stays
// the place they live; ticking one off there is not mirrored back.
//
// iPhone only (Android has no shared reminders store), and only in a phone
// build: app.config.js has to ask for Reminders access, and web has no
// Reminders at all, so every call is a quiet no-op there.
//
// Settings are device-only on purpose: list ids belong to this phone.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCapture } from '../api/captureService';

const SETTINGS_KEY = '@cth_apple_reminders_v1';   // { connected, listIds, lastPull }
const SEEN_KEY = '@cth_apple_reminders_seen_v1';  // { [reminderId]: captureId }
const DEFAULTS = { connected: false, listIds: null, lastPull: null };

let Cal = null;
function cal() {
  if (Platform.OS !== 'ios') return null;
  if (!Cal) {
    try { Cal = require('expo-calendar/legacy'); } catch { Cal = null; }
  }
  return Cal;
}

export const remindersSupported = () => Platform.OS === 'ios' && !!cal();

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

export const getRemindersSettings = () => readJson(SETTINGS_KEY, DEFAULTS);
async function saveSettings(patch) {
  const next = { ...(await getRemindersSettings()), ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

// 'ok' | 'denied' | 'unsupported'
export async function connectReminders() {
  const C = cal();
  if (!C) return 'unsupported';
  try {
    const { status } = await C.requestRemindersPermissionsAsync();
    if (status !== 'granted') return 'denied';
    await saveSettings({ connected: true });
    return 'ok';
  } catch {
    return 'denied';
  }
}

export async function disconnectReminders() {
  await AsyncStorage.multiRemove([SETTINGS_KEY, SEEN_KEY]);
}

// The person's Reminders lists: [{ id, title, color }].
export async function listReminderLists() {
  const C = cal();
  if (!C) return [];
  try {
    const lists = await C.getCalendarsAsync(C.EntityTypes.REMINDER);
    return (lists || []).map(l => ({ id: l.id, title: l.title, color: l.color }));
  } catch {
    return [];
  }
}

// null = every list.
export const setReminderLists = (listIds) => saveSettings({ listIds: Array.isArray(listIds) && listIds.length ? listIds : null });

// Bring open reminders in. Each one only once, ever, on this phone: a
// reminder sorted or deleted in the Inbox doesn't come back.
// Returns { added, skipped } or { added: 0, reason }.
export async function pullReminders(userId) {
  const C = cal();
  if (!C || !userId) return { added: 0, reason: 'unsupported' };
  const settings = await getRemindersSettings();
  if (!settings.connected) return { added: 0, reason: 'off' };
  try {
    const listIds = settings.listIds || (await listReminderLists()).map(l => l.id);
    if (!listIds.length) return { added: 0, reason: 'no-lists' };
    // No status/date filter: EventKit's "incomplete" query needs a due-date
    // window, which would leave out reminders that have no due date.
    const all = await C.getRemindersAsync(listIds, null, null, null);
    const seen = await readJson(SEEN_KEY, {});
    let added = 0;
    for (const r of all || []) {
      if (!r?.id || r.completed || seen[r.id]) continue;
      const row = await addCapture(userId, {
        type: 'note',
        title: (r.title || 'Reminder').trim(),
        body: r.notes || null,
        status: 'inbox',
        source: 'reminders',
        url_meta: { from: 'apple-reminders', reminder_id: r.id, due: r.dueDate || null },
      });
      if (row) { seen[r.id] = row.id; added += 1; }
    }
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    await saveSettings({ lastPull: new Date().toISOString() });
    return { added, skipped: (all || []).length - added };
  } catch (e) {
    console.warn('[appleReminders] pull', e?.message || e);
    return { added: 0, reason: 'error' };
  }
}
