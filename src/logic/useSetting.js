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
  // Array of LIBRARY_HUBS item `screen` values the user has chosen to hide
  // from the Library tab (src/screens/library/LibraryScreen.js). Set from
  // onboarding's Look & Layout step or Settings → Library Sections.
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
  // never sees the authoring entry points; Settings → Personalization turns
  // it on. Read it with a `null` default, not `false`: null means "never
  // decided", which is what lets Classes.js switch it on once for anyone who
  // already has saved plans rather than stranding their work behind a toggle
  // they'd have no reason to look for.
  EDUCATOR_MODE: 'educatorMode',
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
