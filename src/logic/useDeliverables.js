// src/logic/useDeliverables.js
// Someone's deliverables (src/api/deliverableService.js), live: the Make
// board, a unit, Today's card and You all read this, and any save shows in
// all of them at once.

import { useCallback, useEffect, useState } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { loadDeliverables, onDeliverablesChange, cachedDeliverables, saveDeliverable } from '../api/deliverableService';

export default function useDeliverables() {
  const { user } = useUserProgress();
  const userId = user?.id || null;
  const [list, setList] = useState(() => cachedDeliverables(userId) || []);
  const [ready, setReady] = useState(!!cachedDeliverables(userId));
  useEffect(() => {
    let alive = true;
    loadDeliverables(userId).then(l => { if (alive) { setList(l); setReady(true); } }).catch(() => setReady(true));
    const off = onDeliverablesChange((uid, l) => { if ((uid || null) === userId) setList(l); });
    return () => { alive = false; off(); };
  }, [userId]);
  const save = useCallback((d) => saveDeliverable(userId, d), [userId]);
  return { list, ready, save, userId };
}
