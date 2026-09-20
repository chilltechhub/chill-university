// src/logic/questProgress.js
// Where someone is in each quest (src/data/quests.js), and what finishing
// one does.
//
// In-progress work (which step, the explanation being written, the source,
// check answers) lives on the device, per profile, so leaving mid-quest and
// coming back picks up where it stopped, signed in or not. Nothing is sent
// anywhere until the quest is finished.
//
// Finishing, when signed in:
//   - the explanation and source go to the Knowledge Vault as one note
//     (captures, tagged 'quest' + the quest id), so the work outlives the
//     quest and turns up in search next to everything else
//   - the first time only, a QUEST_COMPLETED event: XP, points, and any
//     "finish a topic" mission (gamificationService)
// That activity_log row is also how a finished quest is remembered across
// devices, so there is no quest table to migrate.
//
// One store for the whole app: the Quest screen and the Home widget read the
// same state, so finishing a quest updates the widget without a reload.

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabaseClient';
import { addCapture, upsertTask } from '../api/captureService';
import { AREAS } from '../api/plannerService';
import { getActiveProfileId, onActiveProfileChange } from './activeProfile';
import { handleGameEvent, advanceTopicMission } from './gamificationService';
import { todayStr, addDays } from './dateUtils';
import { SOURCE_CHECKS } from '../data/quests';

export const QUEST_STEPS = [
  { key: 'spark',    label: 'The idea' },
  { key: 'research', label: 'Research' },
  { key: 'check',    label: 'Check' },
  { key: 'doIt',     label: 'Do it' },
  { key: 'done',     label: 'Done' },
];

const storageKey = (profileId) => `quest_progress_v1:${profileId || 'guest'}`;

// ─── The store ──────────────────────────────────────────────────────────────

let state = { profileId: undefined, byId: {}, finished: new Set(), ready: false };
const listeners = new Set();
const emit = () => listeners.forEach(fn => { try { fn(state); } catch { /* listener's problem */ } });
let loading = null;
// Bumped every time a load is started. A load compares the token it was
// started with against this before touching `state`, so a read overtaken by
// a profile switch lands nowhere. A counter rather than the profile id: ids
// are undefined for a guest, and undefined has to be tellable from "no load
// in flight".
let loadToken = 0;
// The profile the in-flight load is for, so a repeat call for the SAME
// profile reuses it instead of starting a second read.
let loadingProfileId;

async function load(profileId, token) {
  let byId = {};
  try {
    const raw = await AsyncStorage.getItem(storageKey(profileId));
    if (raw) byId = JSON.parse(raw) || {};
  } catch { /* unreadable: start clean */ }

  const finished = new Set(Object.keys(byId).filter(id => byId[id]?.completedAt));
  try {
    // getSession reads the stored session (refreshing it if it has expired)
    // rather than asking the auth server, which getUser does on every call.
    const { data: auth } = await supabase.auth.getSession();
    const uid = auth?.session?.user?.id;
    if (uid) {
      const { data } = await supabase
        .from('activity_log')
        .select('metadata')
        .eq('user_id', uid)
        .eq('activity_type', 'QUEST_COMPLETED');
      (data || []).forEach(row => { if (row.metadata?.questId) finished.add(row.metadata.questId); });
    }
  } catch { /* offline: the device copy stands */ }

  // Overtaken by a switch to another profile while this was in flight —
  // whoever replaced it owns `state` now.
  if (token !== loadToken) return;
  state = { profileId, byId, finished, ready: true };
  emit();
}

function ensureLoaded() {
  const profileId = getActiveProfileId();
  if (state.ready && state.profileId === profileId) return Promise.resolve();
  // A load already running for a DIFFERENT profile is no use here, and
  // worse than useless: it finishes by writing that profile's quests into
  // `state`, which is then persisted under its key. Switching profiles
  // while the first load is still waiting on activity_log is enough to hit
  // it. Start the one we actually want; the stale one lands nowhere.
  if (loading && loadingProfileId !== profileId) loading = null;
  if (!loading) {
    const token = ++loadToken;
    loadingProfileId = profileId;
    loading = load(profileId, token).finally(() => {
      if (token === loadToken) loading = null;
    });
  }
  return loading;
}

onActiveProfileChange(() => { state = { ...state, ready: false }; ensureLoaded(); });

async function persist() {
  try {
    await AsyncStorage.setItem(storageKey(state.profileId), JSON.stringify(state.byId));
  } catch (e) {
    console.warn('[quests] save progress', e?.message);
  }
}

/** Merge `patch` into one quest's saved progress. */
export function updateQuest(questId, patch) {
  state = {
    ...state,
    byId: { ...state.byId, [questId]: { ...(state.byId[questId] || {}), ...patch } },
  };
  emit();
  persist();
}

/** Start a finished quest over. The first finish stays counted. */
export function restartQuest(questId) {
  const { completedAt } = state.byId[questId] || {};
  updateQuest(questId, { step: 'spark', answers: {}, taskAdded: false, xpEarned: 0, completedAt, restartedAt: new Date().toISOString() });
}

/** { byId, finished, ready } — re-renders when any quest changes. */
export function useQuestProgress() {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    listeners.add(setSnap);
    ensureLoaded();
    setSnap(state);
    return () => { listeners.delete(setSnap); };
  }, []);
  return snap;
}

// ─── Actions ────────────────────────────────────────────────────────────────

async function lifeAreaIdFor(userId, areaKey) {
  const label = AREAS[areaKey]?.label;
  if (!label) return null;
  try {
    const { data } = await supabase.from('life_areas').select('id, label').eq('user_id', userId);
    return (data || []).find(a => a.label?.toLowerCase() === label.toLowerCase())?.id || null;
  } catch {
    return null;
  }
}

/** The "Do it" step, as a real task on Home's Today list and the Planner. */
export async function addQuestTask(userId, quest) {
  if (!userId) throw new Error('Sign in to add this to your tasks.');
  const due = quest.doIt.due === 'tomorrow' ? addDays(todayStr(), 1) : todayStr();
  const row = await upsertTask(userId, {
    title: quest.doIt.title,
    notes: `${quest.doIt.detail}\n\nFrom the quest: ${quest.title}`,
    category: 'personal',
    due_date: due,
    life_area_id: await lifeAreaIdFor(userId, quest.area),
  });
  updateQuest(quest.id, { taskAdded: true, taskDue: due });
  return { row, due };
}

/** "Go further": the quest's resources, as bookmarks in the Knowledge Vault. */
export async function saveQuestResources(userId, quest) {
  if (!userId) throw new Error('Sign in to save these to your Vault.');
  // Remember each one as it lands. addCapture doesn't dedupe, so without
  // this a failure on the third resource would leave the first two saved,
  // the quest unmarked, and the retry the button still offers would file
  // them in the Vault a second time.
  const saved = new Set(state.byId[quest.id]?.savedResourceUrls || []);
  try {
    for (const r of quest.resources) {
      if (saved.has(r.url)) continue;
      await addCapture(userId, {
        type: 'link',
        title: `${r.title} (${r.who})`,
        url: r.url,
        tags: ['quest', quest.id],
        source: 'manual',
      });
      saved.add(r.url);
    }
  } finally {
    updateQuest(quest.id, {
      savedResourceUrls: [...saved],
      resourcesSaved: saved.size === quest.resources.length,
    });
  }
}

function noteBody(quest, progress) {
  const src = progress.source || {};
  const lines = [];
  if (progress.explanation?.trim()) lines.push(progress.explanation.trim());
  const cite = [src.title?.trim(), src.url?.trim()].filter(Boolean).join(' — ');
  if (cite) {
    lines.push('', `Source: ${cite}`);
    if (src.kind) lines.push(`Kind of source: ${src.kind}`);
    const ticked = SOURCE_CHECKS.filter((_, i) => src.checks?.[i]);
    if (ticked.length) lines.push(`Checked: ${ticked.join('; ')}`);
  }
  lines.push('', `From the quest: ${quest.title}`);
  return lines.join('\n');
}

/**
 * Finish a quest. Returns what happened, for the Done step:
 *   { firstTime, xp, noteSaved }
 * `xp` is 0 for a repeat or a guest.
 */
export async function finishQuest(userId, quest, { xp }) {
  const progress = state.byId[quest.id] || {};
  const firstTime = !state.finished.has(quest.id);
  let noteSaved = false;
  let awarded = 0;

  if (userId) {
    if (progress.explanation?.trim() || progress.source?.title?.trim()) {
      try {
        await addCapture(userId, {
          type: 'note',
          title: `${quest.title}: my notes`,
          body: noteBody(quest, progress),
          url: progress.source?.url?.trim() || null,
          tags: ['quest', quest.id],
          source: 'manual',
        });
        noteSaved = true;
      } catch (e) {
        console.warn('[quests] save note', e?.message);
      }
    }
    if (firstTime) {
      try {
        await handleGameEvent({
          type: 'QUEST_COMPLETED',
          userId,
          subject: quest.subject,
          metadata: { questId: quest.id },
        });
        await advanceTopicMission(userId, quest.subject);
        awarded = xp;
      } catch (e) {
        console.warn('[quests] completion event', e?.message);
      }
    }
  }

  const finished = new Set(state.finished);
  finished.add(quest.id);
  state = { ...state, finished };
  updateQuest(quest.id, {
    step: 'done',
    completedAt: progress.completedAt || new Date().toISOString(),
    lastFinishedAt: new Date().toISOString(),
    // Shown on the Done step for this run. A repeat earns nothing, so it
    // shows nothing rather than repeating the first run's number.
    xpEarned: awarded,
  });
  return { firstTime, xp: awarded, noteSaved };
}
