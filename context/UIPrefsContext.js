// context/UIPrefsContext.js
// Two personal display toggles, independent of light/dark theme:
//   showEmojis  — decorative emoji next to titles/labels ("📝 Notes")
//   showSubtext — the descriptive line under a screen title
//     ("Quick notes and thoughts captured anywhere")
// Both default on (matches how the app already looks) and persist locally.
// Usage: const { showEmojis, showSubtext } = useUIPrefs();
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UIPrefsContext = createContext(null);
const STORAGE_KEY = '@cth_ui_prefs';

const DEFAULTS = { showEmojis: true, showSubtext: true };

export function UIPrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved) {
        try { setPrefs(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const update = (patch) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const setShowEmojis  = (v) => update({ showEmojis: v });
  const setShowSubtext = (v) => update({ showSubtext: v });

  const value = useMemo(() => ({
    ...prefs,
    loaded,
    setShowEmojis,
    setShowSubtext,
  }), [prefs, loaded]);

  return (
    <UIPrefsContext.Provider value={value}>
      {children}
    </UIPrefsContext.Provider>
  );
}

export function useUIPrefs() {
  const ctx = useContext(UIPrefsContext);
  if (!ctx) throw new Error('useUIPrefs must be inside UIPrefsProvider');
  return ctx;
}

// Small helper for the common "emoji + space + title" pattern — e.g.
// emojiPrefix('📝', showEmojis) + 'Notes'  ->  '📝 Notes' or 'Notes'
export function emojiPrefix(emoji, showEmojis) {
  return showEmojis ? `${emoji} ` : '';
}
