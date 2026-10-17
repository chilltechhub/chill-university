// src/logic/useDream.js
// Someone's dream (src/logic/dream.js), live: every screen using this sees a
// save from any other at once (dreamService keeps one copy + listeners).
import { useCallback, useEffect, useState } from 'react';
import { loadDream, saveDream, cachedDream, onDreamChange } from '../api/dreamService';
import { applyDreamEdit, normalizeDream, isDreamEmpty } from './dream';

export default function useDream(userId) {
  const [dream, setDream] = useState(() => cachedDream(userId));

  useEffect(() => {
    let alive = true;
    setDream(cachedDream(userId));
    loadDream(userId).then((d) => { if (alive) setDream(d); }).catch(() => {});
    const off = onDreamChange((uid, d) => { if (alive && (uid || null) === (userId || null)) setDream(d); });
    return () => { alive = false; off(); };
  }, [userId]);

  // patch: fields to change; from: 'typed' | 'wayfinder' | 'onboarding'
  const save = useCallback(async (patch, from = 'typed') => {
    const next = applyDreamEdit(cachedDream(userId) || dream, patch, from);
    return saveDream(userId, next);
  }, [userId, dream]);

  const current = dream ? normalizeDream(dream) : null;
  return { dream: current, loading: dream === null, empty: current ? isDreamEmpty(current) : true, save };
}
