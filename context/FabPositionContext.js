// context/FabPositionContext.js
// Live, app-wide store for the floating action button's screen corner.
//
// A plain useSetting() (AsyncStorage + re-read on screen focus) doesn't
// work for this: FloatingActionButton is rendered as a permanent sibling
// of the navigator, not as a Screen — it never receives focus events, so a
// change made in Settings would only be picked up after a full app reload,
// not live. A shared context re-renders every consumer immediately on
// change, wherever the change came from (Settings, or the FAB's own "Move"
// control).
//
// Same AsyncStorage key useSetting(SETTING_KEYS.FAB_POSITION, ...) used
// before, so any previously saved choice still applies.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cth_setting_fabPosition';
export const DEFAULT_FAB_POSITION = 'bottom-right';

const FabPositionContext = createContext(null);

export function FabPositionProvider({ children }) {
  const [fabPosition, setFabPositionState] = useState(DEFAULT_FAB_POSITION);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (!raw) return;
      try { setFabPositionState(JSON.parse(raw)); } catch {}
    });
  }, []);

  const setFabPosition = useCallback((next) => {
    setFabPositionState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const value = { fabPosition, setFabPosition };

  return (
    <FabPositionContext.Provider value={value}>
      {children}
    </FabPositionContext.Provider>
  );
}

export function useFabPosition() {
  const ctx = useContext(FabPositionContext);
  if (!ctx) throw new Error('useFabPosition must be inside FabPositionProvider');
  return ctx;
}
