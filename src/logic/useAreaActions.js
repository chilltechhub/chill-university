// src/logic/useAreaActions.js
//
// One sub-section's action panel state: the pool for this screen, filtered
// to the person's age band, with their edits laid over it, and split into
// Today's action plus the deck. Also the edit operations behind the
// "Make it yours" sheet.
//
// Guests get the whole thing too — edits and completions just live in
// memory for the session, the same way the rest of the app treats a guest.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { useAccess } from '../../context/AccessContext';
import {
  loadActionPool, loadResources, bundledActions, bundledResources,
  loadUserEdits, savePoolEdit, addCustomAction, updateEdit, deleteEdit,
  loadDoneToday, logCompletion, runAction,
} from '../api/areaActionsService';
import { applyUserEdits, forBand, selectToday, selectDeck, EDITABLE_PAYLOAD } from './areaActionSelect';
import { ageBandFor, bandAllows } from './profileResolver';
import { todayStr } from './dateUtils';

const EDIT_FIELDS = ['title', 'why', 'payload', 'hidden', 'pinned', 'tier', 'sort_order'];
const pick = (o, keys) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
let localSeq = 0;
const localId = () => `local-${Date.now()}-${localSeq++}`;

export default function useAreaActions({ screenTag, areaId, areaLabel: labelProp, navigation, onLogged }) {
  // life_areas rows are labelled with the capitalised id ('Physical').
  const areaLabel = labelProp || (areaId ? areaId[0].toUpperCase() + areaId.slice(1) : '');
  const { user, profile } = useUserProgress();
  const { activeType } = useProfiles();
  const userId = user?.id || null;
  const band = ageBandFor(profile);
  const dateKey = todayStr();

  const [pool, setPool] = useState(() => bundledActions(screenTag));
  const [resourcePool, setResourcePool] = useState(() => bundledResources(screenTag));
  const [edits, setEdits] = useState([]);
  const [doneKeys, setDoneKeys] = useState(() => new Set());
  const [skip, setSkip] = useState(0);
  const onLoggedRef = useRef(onLogged);
  onLoggedRef.current = onLogged;

  useEffect(() => {
    let alive = true;
    loadActionPool().then(all => { if (alive) setPool(all.filter(a => a.screen_tag === screenTag)); });
    loadResources().then(all => { if (alive) setResourcePool(all.filter(r => r.screen_tag === screenTag)); });
    return () => { alive = false; };
  }, [screenTag]);

  useEffect(() => {
    let alive = true;
    loadDoneToday(userId).then(keys => { if (alive) setDoneKeys(keys); });
    if (userId) loadUserEdits(userId, screenTag).then(rows => { if (alive) setEdits(rows); });
    return () => { alive = false; };
  }, [userId, screenTag]);

  // Everything this person can see here, hidden ones included (the edit
  // sheet lists those so they can be brought back).
  const all = useMemo(
    () => forBand(applyUserEdits(pool, edits), band)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [pool, edits, band],
  );
  const today = useMemo(
    () => selectToday(all, { persona: activeType, dateKey, skip }),
    [all, activeType, dateKey, skip],
  );
  const deck = useMemo(
    () => selectDeck(all, { persona: activeType, dateKey, todayKey: today?.key, doneKeys }),
    [all, activeType, dateKey, today, doneKeys],
  );
  const resources = useMemo(
    () => resourcePool.filter(r => bandAllows(r.age_bands, band)),
    [resourcePool, band],
  );

  const markDone = useCallback((key) => setDoneKeys(prev => new Set(prev).add(key)), []);

  // For the handlers that open a sheet first ('read', 'timer').
  // Doing an area's action ("I did this", "Do it") is doing something for
  // that area, same as a quick log: it ticks the "log one thing you did for
  // it" step of the life-areas first goal (objectives.js first-areas).
  const { signalAction } = useAccess();
  const complete = useCallback(async (action, { metrics = null, note = '' } = {}) => {
    const { row } = await logCompletion({ userId, areaId, screenTag, action, metrics, note });
    markDone(action.key);
    signalAction('area-logged', { area: areaId });
    if (row) onLoggedRef.current?.(row);
    return row;
  }, [userId, areaId, screenTag, markDone, signalAction]);

  const run = useCallback(async (action) => {
    const result = await runAction(action, { userId, areaId, areaLabel, screenTag, navigation });
    if (result.ok) {
      markDone(action.key);
      signalAction('area-logged', { area: areaId });
      if (result.row) onLoggedRef.current?.(result.row);
    }
    return result;
  }, [userId, areaId, areaLabel, screenTag, navigation, markDone, signalAction]);

  // ── Edits ────────────────────────────────────────────────────────────────
  // Optimistic: the sheet reflects a change at once, and rolls back if the
  // write fails.
  const commit = useCallback(async (optimistic, write) => {
    const before = edits;
    setEdits(optimistic(before));
    if (!userId) return;
    try {
      const row = await write();
      if (row) setEdits(prev => [...prev.filter(e => e.id !== row.id && !(row.action_key && e.action_key === row.action_key)), row]);
    } catch (e) {
      setEdits(before);
      throw e;
    }
  }, [edits, userId]);

  const editAction = useCallback((action, patch) => {
    if (action.custom) {
      const id = action.editId;
      return commit(
        prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)),
        () => updateEdit(id, pick(patch, EDIT_FIELDS)),
      );
    }
    const existing = edits.find(e => e.action_key === action.key);
    const next = { ...(existing || {}), id: existing?.id || localId(), screen_tag: screenTag, action_key: action.key, ...patch };
    return commit(
      prev => [...prev.filter(e => e.action_key !== action.key), next],
      () => savePoolEdit(userId, { screenTag, actionKey: action.key, fields: pick(next, EDIT_FIELDS) }),
    );
  }, [edits, screenTag, userId, commit]);

  const togglePin = useCallback(a => editAction(a, { pinned: !a.pinned }), [editAction]);
  const toggleHidden = useCallback(a => editAction(a, { hidden: !a.hidden }), [editAction]);
  const reword = useCallback((a, { title, why }) => editAction(a, { title: title?.trim() || null, ...(why !== undefined ? { why } : {}) }), [editAction]);
  const retime = useCallback((a, payloadPatch) => editAction(a, {
    payload: { ...pick(a.payload || {}, EDITABLE_PAYLOAD), ...pick(payloadPatch, EDITABLE_PAYLOAD) },
  }), [editAction]);
  const reset = useCallback(a => editAction(a, { title: null, why: null, payload: null }), [editAction]);

  const addCustom = useCallback(({ title, tier = 'habit' }) => {
    const clean = title.trim();
    if (!clean) return Promise.resolve();
    const temp = { id: localId(), screen_tag: screenTag, action_key: null, title: clean, tier, hidden: false, pinned: false, sort_order: edits.length };
    return commit(prev => [...prev, temp], async () => {
      const row = await addCustomAction(userId, { screenTag, title: clean, tier });
      setEdits(prev => prev.filter(e => e.id !== temp.id));
      return row;
    });
  }, [screenTag, userId, edits.length, commit]);

  const removeCustom = useCallback((a) => commit(
    prev => prev.filter(e => e.id !== a.editId),
    async () => { await deleteEdit(a.editId); return undefined; },
  ), [commit]);

  return {
    band, userId, all, today, deck, resources, doneKeys,
    isDone: key => doneKeys.has(key),
    another: () => setSkip(n => n + 1),
    run, complete,
    togglePin, toggleHidden, reword, retime, reset, addCustom, removeCustom,
  };
}
