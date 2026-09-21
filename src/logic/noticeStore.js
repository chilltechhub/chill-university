// src/logic/noticeStore.js
// The Notification Center's memory, and the one place its notices are
// computed so the top-bar bell and the center itself never disagree.
//
//   prefs  which categories show, phone-reminder settings, quiet hours
//   state  what the person did to each notice: dismissed / snoozed / seen
//   feed   the last computed notices (notices.js over noticeData.js)
//
// All of it lives on the device (AsyncStorage). Notices are recomputed from
// real data every refresh, so there is nothing to sync; a notice's reason
// being gone is what removes it.
//
// Defaults are consent-first: phone reminders and the daily nudge start OFF.
// Turning either on is what asks for notification permission.

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildNotices, visibleNotices } from './notices';
import { loadNoticeData } from '../api/noticeData';
import { onSharedChange } from './shareIntake';
import { syncHub } from './hubNotifications';

let Notifications = null;
try { Notifications = require('expo-notifications'); } catch {}

const PREFS_KEY = '@cth_notice_prefs_v1';
const STATE_KEY = '@cth_notice_state_v1';

export const PHONE_CAPABLE = Platform.OS !== 'web' && !!Notifications;

export const DEFAULT_PREFS = {
  cats: {},                                   // category key -> false to hide
  autoRemind: 'off',                          // 'off' | minutes before (0 = at the time)
  dailyNudge: false,
  nudgeTime: '17:00',
  quiet: { on: true, start: '21:30', end: '08:00' },
};

let prefs = null;
let state = null;
let feed = { all: [], visible: [], data: null, loadedAt: 0, permission: 'unavailable' };
let inflight = null;
const listeners = new Set();
const emit = () => listeners.forEach(fn => { try { fn(); } catch { /* listener's problem */ } });

async function loadJSON(key, fallback) {
  try { const raw = await AsyncStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback }; } catch { return { ...fallback }; }
}
async function ensure() {
  if (!prefs) prefs = await loadJSON(PREFS_KEY, DEFAULT_PREFS);
  if (!state) state = await loadJSON(STATE_KEY, { dismissed: {}, snoozed: {}, seen: {} });
}
const saveState = () => AsyncStorage.setItem(STATE_KEY, JSON.stringify(state)).catch(() => {});

export async function getPrefs() { await ensure(); return prefs; }

export async function setPrefs(patch) {
  await ensure();
  prefs = { ...prefs, ...patch };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  recompute();
  emit();
  return prefs;
}

export async function notificationPermission() {
  if (!PHONE_CAPABLE) return 'unavailable';
  try { return (await Notifications.getPermissionsAsync()).status; } catch { return 'unavailable'; }
}

function recompute() {
  if (!feed.data || !prefs || !state) return;
  const now = new Date();
  // Old dismiss/snooze/seen marks stop mattering once their notice can't come
  // back; trimming keeps the stored state from growing forever.
  for (const bucket of ['dismissed', 'snoozed', 'seen']) {
    const keys = Object.keys(state[bucket]);
    if (keys.length > 400) keys.slice(0, keys.length - 300).forEach(k => delete state[bucket][k]);
  }
  feed.all = buildNotices(feed.data, {
    now,
    autoRemind: prefs.autoRemind,
    notifyPermission: feed.permission,
    wantsPhone: prefs.autoRemind !== 'off' || prefs.dailyNudge,
    phoneCapable: PHONE_CAPABLE,
  });
  feed.visible = visibleNotices(feed.all, { dismissed: state.dismissed, snoozed: state.snoozed, cats: prefs.cats }, now);
}

// Loads fresh data and recomputes. Calls within `minGapMs` of the last load
// reuse it — the bell refreshes on every focus, and that shouldn't mean a
// dozen queries each time.
export async function refreshNotices(userId, { force = false, minGapMs = 60000 } = {}) {
  await ensure();
  if (!force && feed.data && feed.userId === userId && Date.now() - feed.loadedAt < minGapMs) return feed;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [data, permission] = await Promise.all([loadNoticeData(userId), notificationPermission()]);
      feed = { ...feed, data, userId, loadedAt: Date.now(), permission };
      recompute();
      emit();
    } finally {
      inflight = null;
    }
    return feed;
  })();
  return inflight;
}

export function getFeed() { return feed; }

// Refresh, then bring the phone's scheduled notifications in line with it.
// The phone side is re-synced at most every five minutes unless asked.
let lastSync = 0;
export async function refreshAndSync(userId, { force = false, sync = false } = {}) {
  const f = await refreshNotices(userId, { force });
  if (PHONE_CAPABLE && (force || sync || Date.now() - lastSync > 5 * 60000)) {
    lastSync = Date.now();
    try { await syncHub({ prefs, feed: f }); } catch (e) { console.warn('[hub] sync', e?.message); }
  }
  return f;
}

export async function dismissNotice(id) {
  await ensure();
  state.dismissed[id] = new Date().toISOString();
  recompute(); emit(); saveState();
}

export async function snoozeNotice(id, until) {
  await ensure();
  state.snoozed[id] = until.toISOString();
  recompute(); emit(); saveState();
}

export async function markAllSeen() {
  await ensure();
  let changed = false;
  for (const n of feed.visible) if (!state.seen[n.id]) { state.seen[n.id] = true; changed = true; }
  if (changed) { emit(); saveState(); }
}

export function unreadCount() {
  if (!state) return 0;
  return feed.visible.filter(n => !state.seen[n.id] && n.cat !== 'setup').length;
}

// A thing shared into the app should show up straight away, not on the next
// refresh window.
onSharedChange(() => {
  if (feed.userId !== undefined) refreshNotices(feed.userId, { force: true }).catch(() => {});
});

export function useNoticeFeed() {
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump(x => x + 1);
    listeners.add(fn);
    ensure().then(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const refresh = useCallback((userId, opts) => refreshNotices(userId, opts), []);
  return { ...feed, prefs: prefs || DEFAULT_PREFS, unread: unreadCount(), refresh };
}
