// src/logic/useSetting.js
// A tiny generic AsyncStorage-backed setting for simple one-off app
// preferences (e.g. a toggle in Settings) that don't need the fuller
// local-first record pattern in useFolders.js / useCharacterLoadout.js.
// Re-reads on screen focus, same as those, so flipping a toggle on the
// Settings screen is picked up immediately by whatever else reads it —
// no reload needed.

import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onPrefsRestored } from './prefsSync';

const PREFIX = '@cth_setting_';

// Shared keys, so screens reading/writing the same preference can't drift
// out of sync by typo-ing two different string literals.
export const SETTING_KEYS = {
  HERO_TAP_TO_PROFILE: 'heroTapToProfile',
  LIBRARY_BACKGROUND: 'libraryBackground', // 'plain' | 'player'
  HOME_BACKGROUND: 'homeBackground',       // 'plain' | 'player'
  // 'full' (every card) | 'calm' (one next step, today's focus and two
  // cards for your account type: src/components/CalmHome.js).
  HOME_VIEW: 'homeView',
  // Same choice for the Library, kept apart from Home's on purpose
  // (src/components/CalmLibrary.js).
  LIBRARY_VIEW: 'libraryView',
  // The Study and Play buttons on Home's profile card. On by default; off
  // leaves the card as just your name and level.
  HOME_QUICK_BUTTONS: 'homeQuickButtons',
  // Home cards with a finish line (Today's Activities, Check-ins Due, Daily
  // Drills) step aside once done, until tomorrow. Off by default.
  HIDE_DONE_WIDGETS: 'hideDoneWidgets',
  DAILY_REMINDERS_ENABLED: 'dailyRemindersEnabled',
  // The Dream card on Home (src/components/DreamCard.js). "Later" on its
  // empty prompt: an ISO time; until then the prompt is a one-line link.
  DREAM_LATER_UNTIL: 'dreamLaterUntil',
  // "Not me" on the editor's Wayfinder draft, so it isn't offered again.
  DREAM_DRAFT_DISMISSED: 'dreamDraftDismissed',
  // "Your pet is getting hungry" (notificationScheduler.syncPetReminder).
  // On by default; the pet's feed sheet and Settings both switch it.
  PET_REMINDERS: 'petReminders',
  TOUR_SEEN: 'tourSeen',
  // Retired 2026-10-16: the Library's own hide list. Its eight tools are all
  // My features picks, so the Library no longer reads it.
  HIDDEN_LIBRARY_SECTIONS: 'hiddenLibrarySections',
  // Display/default order of the Library's three sub-views — see TABS in
  // LibraryScreen.js. An array of tab keys, e.g. ['domains','build','knowledge'];
  // the first one is also which sub-view opens by default. Reorder from the
  // title dropdown itself.
  LIBRARY_TAB_ORDER: 'libraryTabOrder',
  // Whether the user has closed the Getting Started card on Home
  // (src/components/GettingStartedCard.js). The card also retires itself
  // once every deferred setup task is done, so this only covers "I don't
  // want to be asked" — not "I finished".
  GETTING_STARTED_DISMISSED: 'gettingStartedDismissed',
  // Whether a screen teaches itself the first time you open it
  // (src/logic/useFirstVisitTutorial.js). Default ON — it's the app's main
  // teaching now that the old fourteen-step tour no longer auto-fires. Note
  // that hook reads this key from AsyncStorage directly rather than through
  // useSetting, because its caller sits above NavigationContainer.
  SCREEN_TUTORIALS_ENABLED: 'screenTutorialsEnabled',
  // Teacher / Educator Mode. Academy Classes is a learner's screen — grade
  // bands, topic readings, practice quizzes — while the Classroom Day Lesson
  // Plan Builder (src/screens/LessonBuilder.js + MyLessonPlans.js) is an
  // authoring tool for whoever is teaching. Off by default so a learner
  // never sees the authoring entry points; ticking Lesson Builder in My
  // features turns it on (AccessContext.setPicks). Read it with a `null` default, not `false`: null means "never
  // decided", which is what lets Classes.js switch it on once for anyone who
  // already has saved plans rather than stranding their work behind a toggle
  // they'd have no reason to look for.
  EDUCATOR_MODE: 'educatorMode',
  // FAB position moved to context/FabPositionContext.js — the floating
  // action button isn't a Screen, so it never gets the focus events this
  // hook relies on to pick up a change live. Same storage key still used
  // there ('@cth_setting_fabPosition'), just not read through this hook.
};

// The last value any screen read or wrote, per key. Lets code outside a
// screen (the tour, which can't use focus effects) ask without a round trip.
const lastKnown = {};

// Synchronous best guess: the cached value, or `fallback` if no screen has
// read this key yet this session.
export function peekSetting(key, fallback) {
  return key in lastKnown ? lastKnown[key] : fallback;
}

// Read a setting once, outside a screen (no hook, no focus events).
export async function readSetting(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    const value = raw === null ? fallback : JSON.parse(raw);
    lastKnown[key] = value;
    return value;
  } catch {
    return fallback;
  }
}

export default function useSetting(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      AsyncStorage.getItem(PREFIX + key).then(raw => {
        if (!alive) return;
        const next = raw === null ? defaultValue : JSON.parse(raw);
        lastKnown[key] = next;
        setValue(next);
        setReady(true);
      });
      return () => { alive = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
  );

  // Signing in can bring settings back from the account after this screen
  // already read the phone's (prefsSync.js): read again then.
  useEffect(() => onPrefsRestored(() => {
    AsyncStorage.getItem(PREFIX + key).then(raw => {
      const next = raw === null ? defaultValue : JSON.parse(raw);
      lastKnown[key] = next;
      setValue(next);
    }).catch(() => {});
  }), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((next) => {
    lastKnown[key] = next;
    setValue(next);
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(next));
  }, [key]);

  return [value, update, ready];
}
