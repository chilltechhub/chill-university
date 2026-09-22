// context/UIPrefsContext.js
// Two personal display toggles, independent of light/dark theme:
//   showEmojis  — decorative emoji next to titles/labels ("📝 Notes")
//   showSubtext — the descriptive line under a screen title
//     ("Quick notes and thoughts captured anywhere")
// Only what the user actually set is stored. Until they touch it,
// showEmojis follows the appearance style (Plain: off, Command: on — see
// STYLES.emojiDefault) and showSubtext is on. Persist locally.
// Usage: const { showEmojis, showSubtext } = useUIPrefs();
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';

const UIPrefsContext = createContext(null);
const STORAGE_KEY = '@cth_ui_prefs';

export function UIPrefsProvider({ children }) {
  const { style } = useTheme();
  // Explicit choices only — a key that's missing means "use the default".
  const [prefs, setPrefs] = useState({});
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
    showEmojis:  prefs.showEmojis ?? style.emojiDefault,
    showSubtext: prefs.showSubtext ?? true,
    loaded,
    setShowEmojis,
    setShowSubtext,
  }), [prefs, loaded, style]);

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
