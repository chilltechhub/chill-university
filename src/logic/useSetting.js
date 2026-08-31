// src/logic/useSetting.js
// A tiny generic AsyncStorage-backed setting for simple one-off app
// preferences (e.g. a toggle in Settings) that don't need the fuller
// local-first record pattern in useFolders.js / useCharacterLoadout.js.
// Re-reads on screen focus, same as those, so flipping a toggle on the
// Settings screen is picked up immediately by whatever else reads it —
// no reload needed.

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@cth_setting_';

// Shared keys, so screens reading/writing the same preference can't drift
// out of sync by typo-ing two different string literals.
export const SETTING_KEYS = {
  HERO_TAP_TO_PROFILE: 'heroTapToProfile',
  LIBRARY_BACKGROUND: 'libraryBackground', // 'plain' | 'player'
  HOME_BACKGROUND: 'homeBackground',       // 'plain' | 'player'
  DAILY_REMINDERS_ENABLED: 'dailyRemindersEnabled',
  TOUR_SEEN: 'tourSeen',
  // FAB position moved to context/FabPositionContext.js — the floating
  // action button isn't a Screen, so it never gets the focus events this
  // hook relies on to pick up a change live. Same storage key still used
  // there ('@cth_setting_fabPosition'), just not read through this hook.
};

export default function useSetting(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      AsyncStorage.getItem(PREFIX + key).then(raw => {
        if (!alive) return;
        setValue(raw === null ? defaultValue : JSON.parse(raw));
        setReady(true);
      });
      return () => { alive = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
  );

  const update = useCallback((next) => {
    setValue(next);
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(next));
  }, [key]);

  return [value, update, ready];
}
