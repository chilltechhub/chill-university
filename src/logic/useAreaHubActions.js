// src/logic/useAreaHubActions.js
//
// The Life Area hub's view of its four sub-sections: for each, the next thing
// to do (its Today's action if that isn't done yet, otherwise the first deck
// action that isn't), plus one "Today's focus" across the whole area.
//
// It's also how the hub reaches the three sub-sections that are bespoke tools
// (Career, Skills & Learning, the Workshop) — their actions show and run from
// here even though those screens keep their own layouts.
//
// Refreshes on focus, so coming back from a sub-section shows what was done
// there.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import {
  loadActionPool, loadUserEdits, loadDoneToday, logCompletion, runAction,
} from '../api/areaActionsService';
import { AREA_ACTIONS } from '../data/lifeAreaActions';
import { applyUserEdits, forBand, selectToday, selectDeck, rankActions } from './areaActionSelect';
import { ageBandFor } from './profileResolver';
import { todayStr } from './dateUtils';

export default function useAreaHubActions({ areaId, screenTags = [], navigation }) {
  const { user, profile } = useUserProgress();
  const { activeType } = useProfiles();
  const userId = user?.id || null;
  const band = ageBandFor(profile);
  const dateKey = todayStr();
  const tagsKey = screenTags.join('|');
  const areaLabel = areaId ? areaId[0].toUpperCase() + areaId.slice(1) : '';

  const [pool, setPool] = useState(() => AREA_ACTIONS.filter(a => screenTags.includes(a.screen_tag)));
  const [edits, setEdits] = useState([]);
  const [doneKeys, setDoneKeys] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    loadActionPool().then(all => { if (alive) setPool(all.filter(a => screenTags.includes(a.screen_tag))); });
    return () => { alive = false; };
  }, [tagsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => {
    let alive = true;
    loadDoneToday(userId).then(keys => { if (alive) setDoneKeys(keys); });
    if (userId) loadUserEdits(userId, screenTags).then(rows => { if (alive) setEdits(rows); });
    return () => { alive = false; };
  }, [userId, tagsKey])); // eslint-disable-line react-hooks/exhaustive-deps

  const bySection = useMemo(() => Object.fromEntries(screenTags.map((tag) => {
    const all = forBand(applyUserEdits(pool.filter(a => a.screen_tag === tag), edits.filter(e => e.screen_tag === tag)), band);
    const today = selectToday(all, { persona: activeType, dateKey });
    let next = today && !doneKeys.has(today.key) ? today : null;
    if (!next) {
      const deck = selectDeck(all, { persona: activeType, dateKey, todayKey: today?.key, doneKeys });
      next = deck.map(d => d.action).find(a => !doneKeys.has(a.key)) || null;
    }
    const doneHere = all.filter(a => doneKeys.has(a.key)).length;
    return [tag, { next, doneHere }];
  })), [tagsKey, pool, edits, band, activeType, dateKey, doneKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  // One focus for the whole area: the best-ranked of the sub-sections'
  // featured or pinned next actions, stable for the day.
  const focus = useMemo(() => {
    const nexts = screenTags.map(t => bySection[t]?.next).filter(Boolean);
    const strong = nexts.filter(a => a.featured || a.pinned);
    const ranked = rankActions(strong.length ? strong : nexts, { persona: activeType, dateKey, salt: `hub:${areaId}` });
    return ranked[0] || null;
  }, [bySection, activeType, dateKey, areaId, tagsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const markDone = useCallback(key => setDoneKeys(prev => new Set(prev).add(key)), []);

  const complete = useCallback(async (action, opts = {}) => {
    await logCompletion({ userId, areaId, screenTag: action.screen_tag, action, ...opts });
    markDone(action.key);
  }, [userId, areaId, markDone]);

  const run = useCallback(async (action) => {
    const res = await runAction(action, { userId, areaId, areaLabel, screenTag: action.screen_tag, navigation });
    if (res.ok) markDone(action.key);
    return res;
  }, [userId, areaId, areaLabel, navigation, markDone]);

  return { band, bySection, focus, isDone: key => doneKeys.has(key), run, complete };
}
