// context/ThemeContext.js
// Provides theme colors + appearance settings to all screens.
// Usage: const { colors, theme, toggleTheme, isDark, style, accent } = useTheme();
//
// Appearance is three independent choices (docs/finishing-touches-plan.md):
//   mode   — 'system' | 'light' | 'dark'   → colors, isDark
//   style  — 'plain'  | 'command'          → style (label/title/card rules)
//   accent — 'teal'   | 'gold' | 'slate'   → accent (primary action colour)
// All three are device-local, in AsyncStorage.

import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import {
  THEMES, STYLES, ACCENTS, DEFAULT_STYLE, DEFAULT_ACCENT, PERSONA_ACCENT,
  makeShadows, typography, spacing, radius,
} from '../src/theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = '@cth_theme';
const STYLE_KEY = '@cth_theme_style';
const ACCENT_KEY = '@cth_theme_accent';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' — needs userInterfaceStyle "automatic" in app.json
  const [themeName, setThemeName] = useState(null); // null = follow system
  const [styleName, setStyleName] = useState(DEFAULT_STYLE);
  const [accentName, setAccentName] = useState(DEFAULT_ACCENT);
  // True once an accent is on disk — picked in Settings, or suggested by
  // the persona at the end of onboarding. Either way a later persona
  // suggestion leaves it alone.
  const [accentSet, setAccentSet] = useState(false);

  // Load saved preferences
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, STYLE_KEY, ACCENT_KEY]).then(pairs => {
      const saved = Object.fromEntries(pairs);
      const mode = saved[STORAGE_KEY];
      if (mode === 'light' || mode === 'dark') setThemeName(mode);
      if (STYLES[saved[STYLE_KEY]]) setStyleName(saved[STYLE_KEY]);
      if (ACCENTS[saved[ACCENT_KEY]]) {
        setAccentName(saved[ACCENT_KEY]);
        setAccentSet(true);
      }
    }).catch(() => {});
  }, []);

  // Resolve active theme
  const activeName = themeName ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = activeName === 'dark';
  const style = STYLES[styleName];
  const accent = ACCENTS[accentName][activeName];
  // The tab bar's active colour follows the accent — the one piece of
  // global chrome every screen shares.
  const colors = useMemo(
    () => ({ ...THEMES[activeName], tabActive: accent.primary }),
    [activeName, accent],
  );
  const shadows = useMemo(() => makeShadows(isDark), [isDark]);

  const setTheme = useCallback(async (name) => {
    setThemeName(name);
    await AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  const toggleTheme = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark, setTheme]);

  const followSystem = useCallback(async () => {
    setThemeName(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // 'system' | 'light' | 'dark' — what the Settings segmented control shows.
  const setMode = useCallback(
    (m) => (m === 'system' ? followSystem() : setTheme(m)),
    [followSystem, setTheme],
  );

  const setStyle = useCallback(async (name) => {
    if (!STYLES[name]) return;
    setStyleName(name);
    await AsyncStorage.setItem(STYLE_KEY, name).catch(() => {});
  }, []);

  const setAccent = useCallback(async (name) => {
    if (!ACCENTS[name]) return;
    setAccentName(name);
    setAccentSet(true);
    await AsyncStorage.setItem(ACCENT_KEY, name).catch(() => {});
  }, []);

  // Onboarding calls this with the chosen persona. Reads storage rather
  // than `accentSet` so it can't race the initial load.
  const suggestAccentForPersona = useCallback(async (personaKey) => {
    const name = PERSONA_ACCENT[personaKey];
    if (!name) return;
    const existing = await AsyncStorage.getItem(ACCENT_KEY).catch(() => null);
    if (ACCENTS[existing]) return;
    await setAccent(name);
  }, [setAccent]);

  const value = useMemo(() => ({
    colors,
    shadows,
    typography,
    spacing,
    radius,
    theme: activeName,
    isDark,
    mode: themeName ?? 'system',
    setMode,
    setTheme,
    toggleTheme,
    followSystem,
    style,
    styleName,
    setStyle,
    accent,
    accentName,
    accentSet,
    setAccent,
    suggestAccentForPersona,
  }), [activeName, colors, shadows, isDark, themeName, style, styleName, accent, accentName, accentSet,
    setMode, setTheme, toggleTheme, followSystem, setStyle, setAccent, suggestAccentForPersona]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
