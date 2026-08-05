// context/ThemeContext.js
// Provides theme colors + toggle to all screens.
// Usage: const { colors, theme, toggleTheme, isDark } = useTheme();

import React, {
  createContext, useContext, useState, useEffect, useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { THEMES, makeShadows, typography, spacing, radius } from '../src/theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = '@cth_theme';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark'
  const [themeName, setThemeName] = useState(null); // null = follow system

  // Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark') setThemeName(saved);
    });
  }, []);

  // Resolve active theme
  const activeName = themeName ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = activeName === 'dark';
  const colors = THEMES[activeName];
  const shadows = makeShadows(isDark);

  const setTheme = async (name) => {
    setThemeName(name);
    await AsyncStorage.setItem(STORAGE_KEY, name);
  };

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const followSystem = async () => {
    setThemeName(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({
    colors,
    shadows,
    typography,
    spacing,
    radius,
    theme: activeName,
    isDark,
    setTheme,
    toggleTheme,
    followSystem,
  }), [activeName, colors]);

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
