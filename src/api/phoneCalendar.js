// src/api/phoneCalendar.js
// The phone's own calendars, in and out of the Planner.
//
//   In:  events from the calendars the person picks (Apple Calendar on an
//        iPhone; on Android, every account on the phone, Google included)
//        show on the Planner's day, read-only. Tapping one opens it in the
//        phone's calendar app.
//   Out: optional. "Add my plans to my calendar" keeps a "Deskartes"
//        calendar on the phone in step with the next two weeks of plans:
//        new ones added, changed ones updated, removed ones deleted.
//
// Everything is off until the person connects it (Planner → ⋯ → Phone
// calendar), and asking for permission happens then, not at launch. No
// server and no Google sign-in: the phone already syncs its own accounts.
// Web has no phone calendar, so every call is a quiet no-op there.
//
// Uses expo-calendar's legacy API, which also runs in Expo Go.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './profileScopedClient';
import { todayStr, addDays, dateStr } from '../logic/dateUtils';
import { coalesce } from '../logic/coalesce';

const SETTINGS_KEY = '@cth_phone_calendar_v1';
const COPIES_KEY = '@cth_phone_calendar_copies_v1'; // { [instanceId]: { eventId, sig } }
const DESK_TITLE = 'Deskartes';
const COPY_DAYS = 14;

let Cal = null;
function cal() {
  if (Platform.OS === 'web') return null;
  if (!Cal) {
    try { Cal = require('expo-calendar/legacy'); } catch { Cal = null; }
  }
  return Cal;
}

export const phoneCalendarSupported = () => Platform.OS !== 'web' && !!cal();

const DEFAULT_SETTINGS = { connected: false, calendarIds: null, copyPlans: false, deskCalendarId: null };

export async function getPhoneCalendarSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export async function setPhoneCalendarSettings(patch) {
  const next = { ...(await getPhoneCalendarSettings()), ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  listeners.forEach(fn => { try { fn(next); } catch {} });
  return next;
}

const listeners = new Set();
export function onPhoneCalendarChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Asks for calendar access. Resolves 'granted' | 'denied' | 'unsupported'. */
export async function connectPhoneCalendar() {
  const C = cal();
  if (!C || !(await C.isAvailableAsync().catch(() => false))) return 'unsupported';
  const { status } = await C.requestCalendarPermissionsAsync();
  if (status !== 'granted') return 'denied';
  await setPhoneCalendarSettings({ connected: true });
  return 'granted';
}

export async function disconnectPhoneCalendar() {
  await setPhoneCalendarSettings({ connected: false, copyPlans: false });
}

async function permitted() {
  const C = cal();
  if (!C) return false;
  const { status } = await C.getCalendarPermissionsAsync().catch(() => ({ status: 'undetermined' }));
  return status === 'granted';
}

/** The phone's event calendars, minus the one this app writes to. */
export async function listPhoneCalendars() {
  const C = cal();
  if (!C || !(await permitted())) return [];
  const settings = await getPhoneCalendarSettings();
  const all = await C.getCalendarsAsync(C.EntityTypes.EVENT).catch(() => []);
  return all
    .filter(c => c.id !== settings.deskCalendarId && c.title !== DESK_TITLE)
    .map(c => ({ id: c.id, title: c.title, color: c.color, account: c.source?.name || c.ownerAccount || '' }));
}

const pad = (n) => String(n).padStart(2, '0');
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Events between two 'YYYY-MM-DD' days (inclusive), from the picked
 * calendars, as Planner-shaped rows: { id, title, date, start_time,
 * end_time, allDay, color, calendar }. [] when off or not allowed.
 */
export async function getPhoneEvents(fromIso, toIso) {
  const C = cal();
  if (!C) return [];
  const settings = await getPhoneCalendarSettings();
  if (!settings.connected || !(await permitted())) return [];
  const calendars = await listPhoneCalendars();
  const ids = settings.calendarIds ? calendars.filter(c => settings.calendarIds.includes(c.id)).map(c => c.id) : calendars.map(c => c.id);
  if (!ids.length) return [];
  const byId = Object.fromEntries(calendars.map(c => [c.id, c]));
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T23:59:59`);
  const events = await C.getEventsAsync(ids, from, to).catch((e) => { console.warn('[phoneCalendar] events', e?.message); return []; });
  return events.map(e => {
    const start = new Date(e.startDate);
    const end = e.endDate ? new Date(e.endDate) : null;
    return {
      id: `phone:${e.id}`,
      eventId: e.id,
      title: e.title || '(No title)',
      date: dateStr(start),
      start_time: e.allDay ? null : hhmm(start),
      end_time: e.allDay || !end ? null : hhmm(end),
      allDay: !!e.allDay,
      color: byId[e.calendarId]?.color || null,
      calendar: byId[e.calendarId]?.title || '',
    };
  }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
}

export async function openPhoneEvent(eventId) {
  const C = cal();
  if (!C || !eventId) return;
  try { await C.openEventInCalendarAsync({ id: eventId }); }
  catch (e) { console.warn('[phoneCalendar] open', e?.message); }
}

/* ─── Out: a "Deskartes" calendar with the next two weeks of plans ─────── */

async function deskCalendarId() {
  const C = cal();
  const settings = await getPhoneCalendarSettings();
  const existing = (await C.getCalendarsAsync(C.EntityTypes.EVENT).catch(() => []))
    .find(c => c.id === settings.deskCalendarId || c.title === DESK_TITLE);
  if (existing) {
    if (existing.id !== settings.deskCalendarId) await setPhoneCalendarSettings({ deskCalendarId: existing.id });
    return existing.id;
  }
  let source;
  if (Platform.OS === 'ios') {
    const def = await C.getDefaultCalendarAsync().catch(() => null);
    source = def?.source;
    const id = await C.createCalendarAsync({
      title: DESK_TITLE, color: '#167a6c', entityType: C.EntityTypes.EVENT,
      sourceId: source?.id, source, name: DESK_TITLE, ownerAccount: 'personal',
      accessLevel: C.CalendarAccessLevel.OWNER,
    });
    await setPhoneCalendarSettings({ deskCalendarId: id });
    return id;
  }
  const id = await C.createCalendarAsync({
    title: DESK_TITLE, color: '#167a6c', entityType: C.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: DESK_TITLE, type: C.SourceType?.LOCAL || 'LOCAL' },
    name: DESK_TITLE, ownerAccount: DESK_TITLE, accessLevel: C.CalendarAccessLevel.OWNER,
  });
  await setPhoneCalendarSettings({ deskCalendarId: id });
  return id;
}

async function readCopies() {
  try { return JSON.parse((await AsyncStorage.getItem(COPIES_KEY)) || '{}'); } catch { return {}; }
}
const writeCopies = (map) => AsyncStorage.setItem(COPIES_KEY, JSON.stringify(map)).catch(() => {});

function eventFor(row) {
  const time = row.start_time ? String(row.start_time).slice(0, 5) : null;
  const start = new Date(`${row.date}T${time || '00:00'}:00`);
  const end = new Date(start.getTime() + (time ? (row.duration_minutes || 30) : 24 * 60) * 60000);
  return {
    title: row.title,
    startDate: start,
    endDate: end,
    allDay: !time,
    notes: 'From your Deskartes Planner.',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
const sigOf = (row) => [row.title, row.date, row.start_time || '', row.duration_minutes || ''].join('|');

/**
 * Brings the "Deskartes" calendar in step with the next COPY_DAYS days of
 * plans. Resolves { added, updated, removed } (all 0 when off).
 */
export async function syncPlansToPhone(userId) {
  const none = { added: 0, updated: 0, removed: 0 };
  const C = cal();
  if (!C || !userId) return none;
  const settings = await getPhoneCalendarSettings();
  if (!settings.connected || !settings.copyPlans || !(await permitted())) return none;

  const today = todayStr();
  const { data: rows, error } = await supabase.from('agenda_instances')
    .select('id, title, date, start_time, duration_minutes, skipped')
    .eq('user_id', userId).gte('date', today).lte('date', addDays(today, COPY_DAYS)).limit(500);
  if (error) { console.warn('[phoneCalendar] plans', error.message); return none; }

  const calendarId = await deskCalendarId();
  const copies = await readCopies();
  const live = new Map((rows || []).filter(r => !r.skipped).map(r => [r.id, r]));
  const out = { ...none };

  for (const [id, row] of live) {
    const sig = sigOf(row);
    const copy = copies[id];
    try {
      if (!copy) {
        copies[id] = { eventId: await C.createEventAsync(calendarId, eventFor(row)), sig };
        out.added++;
      } else if (copy.sig !== sig) {
        await C.updateEventAsync(copy.eventId, eventFor(row));
        copies[id] = { ...copy, sig };
        out.updated++;
      }
    } catch (e) { console.warn('[phoneCalendar] copy', e?.message); }
  }
  // Copies whose plan was deleted or skipped. Past days are left alone.
  for (const [id, copy] of Object.entries(copies)) {
    if (live.has(id)) continue;
    const { data: still } = await supabase.from('agenda_instances').select('id, date, skipped').eq('id', id).maybeSingle();
    if (still && !still.skipped && still.date < today) continue;
    try { await C.deleteEventAsync(copy.eventId); } catch {}
    delete copies[id];
    out.removed++;
  }
  await writeCopies(copies);
  return out;
}

/**
 * syncPlansToPhone after a change, gathered: a burst of ticks and edits is
 * one sync 1.5 s after the last, and never two at once (src/logic/coalesce.js).
 * Today reads its plans far more often than the Planner did.
 */
export const syncPlansToPhoneSoon = coalesce((userId) => syncPlansToPhone(userId)
  .catch(e => console.warn('[phoneCalendar] sync', e?.message)), 1500);

/** Turns copying off and removes the "Deskartes" calendar it made. */
export async function stopCopyingPlans() {
  const C = cal();
  const settings = await getPhoneCalendarSettings();
  if (C && settings.deskCalendarId) {
    try { await C.deleteCalendarAsync(settings.deskCalendarId); } catch {}
  }
  await AsyncStorage.removeItem(COPIES_KEY).catch(() => {});
  await setPhoneCalendarSettings({ copyPlans: false, deskCalendarId: null });
}
