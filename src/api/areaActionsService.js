// src/api/areaActionsService.js
//
// Everything the Life Area action panel reads and writes.
//
//   area_actions / area_resources   the pool — public read, edited in the
//                                   Supabase dashboard. Fetched once per
//                                   session, cached, and backed by the copy
//                                   bundled in src/data/lifeAreaActions.js so
//                                   a first launch offline still has actions.
//   user_area_actions               a person's own edits: pin, hide, reword,
//                                   retime, or their own actions. Per account
//                                   (not in SCOPED_TABLES), like life_areas.
//   area_notes                      completions, as [ScreenTag][Action] rows
//                                   with action_key set — so they also show
//                                   up in each screen's existing history.
//
// runAction() carries out what a tap means for every handler except 'read'
// and 'timer', which open a sheet first and log through logCompletion().

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { supabase } from './profileScopedClient';
import { offlineWrite } from './offlineCache';
import { subscribeToPreset, subscribeToComponent } from './plannerService';
import { AREA_ACTIONS, AREA_RESOURCES } from '../data/lifeAreaActions';
import { scheduleActionReminder } from '../logic/notificationScheduler';
import { todayStr } from '../logic/dateUtils';

const POOL_KEY = '@cth_area_actions_v1';
const RESOURCES_KEY = '@cth_area_resources_v1';

// ─── The pool ────────────────────────────────────────────────────────────────

async function fetchTable(table, cacheKey) {
  try {
    const { data, error } = await supabase.from(table).select('*').order('sort_order');
    if (error) throw error;
    if (data?.length) {
      AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
      return data;
    }
  } catch (e) {
    console.warn(`[areaActions] ${table} fetch failed, using cache`, e?.message);
  }
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// One fetch per session, shared by every screen. A failed fetch isn't
// remembered, so the next screen tries again.
let poolPromise = null;
let resourcesPromise = null;

export function loadActionPool() {
  if (!poolPromise) {
    poolPromise = fetchTable('area_actions', POOL_KEY).then((rows) => {
      if (!rows) { poolPromise = null; return AREA_ACTIONS; }
      return rows;
    });
  }
  return poolPromise;
}

export function loadResources() {
  if (!resourcesPromise) {
    resourcesPromise = fetchTable('area_resources', RESOURCES_KEY).then((rows) => {
      if (!rows) { resourcesPromise = null; return AREA_RESOURCES; }
      return rows;
    });
  }
  return resourcesPromise;
}

// Synchronous first paint, before the fetch resolves.
export const bundledActions = (screenTag) => AREA_ACTIONS.filter(a => a.screen_tag === screenTag);
export const bundledResources = (screenTag) => AREA_RESOURCES.filter(r => r.screen_tag === screenTag);

// ─── A person's edits ────────────────────────────────────────────────────────

export async function loadUserEdits(userId, screenTags) {
  if (!userId) return [];
  let q = supabase.from('user_area_actions').select('*').eq('user_id', userId);
  q = Array.isArray(screenTags) ? q.in('screen_tag', screenTags) : q.eq('screen_tag', screenTags);
  const { data, error } = await q.order('sort_order');
  if (error) { console.warn('[areaActions] edits', error.message); return []; }
  return data || [];
}

// An edit to a pool action. One row per person per action — the table's
// unique (user_id, action_key) is what on_conflict targets.
export async function savePoolEdit(userId, { screenTag, actionKey, fields }) {
  const { data, error } = await supabase.from('user_area_actions')
    .upsert({ user_id: userId, screen_tag: screenTag, action_key: actionKey, ...fields }, { onConflict: 'user_id,action_key' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function addCustomAction(userId, { screenTag, title, tier }) {
  const { data, error } = await supabase.from('user_area_actions')
    .insert({ user_id: userId, screen_tag: screenTag, action_key: null, title, tier })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateEdit(id, fields) {
  const { data, error } = await supabase.from('user_area_actions').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEdit(id) {
  const { error } = await supabase.from('user_area_actions').delete().eq('id', id);
  if (error) throw error;
}

// ─── Completions ─────────────────────────────────────────────────────────────

// What's been done today in this session, kept in memory so a completion on
// a sub-section shows on the area hub straight away — and so a guest, who
// has no rows to read back, still sees it. Resets when the date changes.
let session = { date: todayStr(), keys: new Set() };
function sessionKeys() {
  if (session.date !== todayStr()) session = { date: todayStr(), keys: new Set() };
  return session.keys;
}

// Keys of the actions already done today, across every sub-section.
export async function loadDoneToday(userId) {
  if (!userId) return new Set(sessionKeys());
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from('area_notes').select('action_key')
    .eq('user_id', userId).not('action_key', 'is', null)
    .gte('created_at', start.toISOString()).limit(300);
  if (error) { console.warn('[areaActions] done today', error.message); return new Set(sessionKeys()); }
  return new Set([...sessionKeys(), ...(data || []).map(r => r.action_key)]);
}

// Written in the same [ScreenTag] convention every sub-section's history
// already reads, so a done action shows up in its Log without new code there.
export async function logCompletion({ userId, areaId, screenTag, action, metrics = null, note = '' }) {
  const entry = {
    user_id: userId,
    area_id: areaId,
    content: `[${screenTag}][Action] ✅ ${action.title}${note ? ` — ${note}` : ''}`,
    action_key: action.key,
    metrics,
    created_at: new Date().toISOString(),
  };
  sessionKeys().add(action.key);
  if (!userId) return { row: { ...entry, id: `local-${Date.now()}` } };
  return offlineWrite(supabase, 'area_notes', entry);
}

// ─── What a tap does ─────────────────────────────────────────────────────────

export function formatTime(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (!(h >= 0 && h < 24 && m >= 0 && m < 60)) return hhmm || '';
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// A task tagged to the area, due today — so it also shows in the Library's
// domain filter, which matches tasks on the user's own life_areas row.
async function addAreaTask(userId, { title, areaLabel }) {
  let lifeAreaId = null;
  try {
    const { data } = await supabase.from('life_areas').select('id, label').eq('user_id', userId);
    lifeAreaId = (data || []).find(a => a.label?.toLowerCase() === String(areaLabel || '').toLowerCase())?.id || null;
  } catch {}
  const { error } = await supabase.from('tasks').insert({
    user_id: userId, title, category: 'personal', priority: 2, completed: false,
    due_date: todayStr(), life_area_id: lifeAreaId,
  });
  if (error) throw error;
}

async function subscribeByTitle(userId, title) {
  const { data, error } = await supabase.from('planner_components').select('id, title')
    .eq('is_system', true).eq('active', true).eq('title', title).limit(1);
  if (error) throw error;
  if (!data?.length) throw new Error(`"${title}" isn't in the planner any more.`);
  await subscribeToComponent(userId, data[0].id);
  return data;
}

const SIGN_IN = 'Sign in to save this — guest progress isn’t kept.';

// ctx: { userId, areaId, areaLabel, screenTag, navigation }
// Resolves { ok, message, row } — row is the logged area_notes entry.
export async function runAction(action, ctx) {
  const { userId, areaId, areaLabel, screenTag, navigation } = ctx;
  const p = action.payload || {};
  let message = null;
  try {
    switch (action.handler) {
      case 'link':
        await Linking.openURL(p.url);
        break;
      case 'screen':
        navigation?.navigate(p.screen, p.params);
        break;
      case 'task':
        if (!userId) return { ok: false, message: SIGN_IN };
        await addAreaTask(userId, { title: action.title, areaLabel });
        message = 'Added to today’s tasks.';
        break;
      case 'routine': {
        if (!userId) return { ok: false, message: SIGN_IN };
        const added = p.component
          ? await subscribeByTitle(userId, p.component)
          : await subscribeToPreset(userId, p.preset);
        message = added?.length === 1 ? `Added “${added[0].title}” to your planner.` : `Added ${added?.length || 0} items to your planner.`;
        break;
      }
      case 'reminder': {
        const at = await scheduleActionReminder({ key: action.key, title: action.title, body: action.why, time: p.time });
        if (at) {
          message = `Reminder set for ${formatTime(p.time)}.`;
        } else if (userId) {
          // Web, or notifications turned off: a task for the same time still
          // puts it in front of them.
          await addAreaTask(userId, { title: `${action.title} — ${formatTime(p.time)}`, areaLabel });
          message = 'Reminders need notifications on your phone, so it’s on today’s tasks instead.';
        } else {
          return { ok: false, message: 'Reminders work in the phone app.' };
        }
        break;
      }
      default:
        break; // 'done' — logging it is the whole action
    }
    const { row } = await logCompletion({ userId, areaId, screenTag, action });
    return { ok: true, message, row };
  } catch (e) {
    return { ok: false, message: e?.message || 'That didn’t work. Try again.' };
  }
}
