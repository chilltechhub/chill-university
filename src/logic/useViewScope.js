// src/logic/useViewScope.js
// Whether a surface is showing just the active Profile's items, or every
// profile's at once.
//
// Ownership and visibility are separate concerns here. Every item belongs to
// exactly one profile (that never changes and isn't negotiable — see
// profileScopedClient.js). What IS negotiable is how much you look at:
//
//   Calendar  defaults to 'all'     — you only have one actual day, and the
//                                     thing you most need to see is a clash
//                                     between your night job and your startup
//   Planner   defaults to 'profile' — task lists are context-specific work,
//                                     and merging them is just noise
//
// Not built on useSetting.js: that re-reads on screen focus, and the calendar
// is a modal rather than a screen, so it wouldn't reliably get those events.
// This keeps its own state and persists on change, which is all a per-surface
// toggle needs.

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@cth_view_scope_';

export const SCOPE_PROFILE = 'profile';
export const SCOPE_ALL = 'all';

// surface: 'calendar' | 'planner' | any other stable id
export default function useViewScope(surface, defaultScope = SCOPE_PROFILE) {
  const [scope, setScope] = useState(defaultScope);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(PREFIX + surface)
      .then(saved => {
        if (!alive) return;
        if (saved === SCOPE_PROFILE || saved === SCOPE_ALL) setScope(saved);
        setReady(true);
      })
      .catch(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [surface]);

  const update = useCallback((next) => {
    setScope(next);
    AsyncStorage.setItem(PREFIX + surface, next).catch(() => {});
  }, [surface]);

  const toggle = useCallback(() => {
    update(scope === SCOPE_ALL ? SCOPE_PROFILE : SCOPE_ALL);
  }, [scope, update]);

  return { scope, setScope: update, toggle, showingAll: scope === SCOPE_ALL, ready };
}
