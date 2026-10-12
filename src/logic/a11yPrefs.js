// src/logic/a11yPrefs.js
// Accessibility choices: text size, bold text, an easy-read font, high
// contrast and reduce motion. Set in Settings → Accessibility and Make it
// yours, kept on the device (like light/dark).
//
// A plain store rather than a context on purpose: every piece of text in
// the app reads it (src/components/AppText.js, swapped in for React
// Native's Text by babel.config.js), including text rendered above the
// providers, and a store with useSyncExternalStore costs nothing until a
// choice changes.

import { useSyncExternalStore, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cth_a11y';

// Text size steps. 1 is the app as designed; the phone's own text size
// setting still applies on top on iOS and Android.
export const TEXT_SIZES = [
  { key: 0.9, label: 'Small' },
  { key: 1, label: 'Default' },
  { key: 1.15, label: 'Large' },
  { key: 1.3, label: 'Larger' },
  { key: 1.5, label: 'Largest' },
];

export const FONT_CHOICES = [
  { key: 'system', label: 'Standard' },
  // Atkinson Hyperlegible: made by the Braille Institute for low-vision
  // readers. Letters that look alike (I l 1, O 0, b d) are drawn apart.
  { key: 'readable', label: 'Easy read' },
];

export const READABLE_FONTS = {
  regular: 'AtkinsonHyperlegible_400Regular',
  bold: 'AtkinsonHyperlegible_700Bold',
};

export const DEFAULT_A11Y = {
  textScale: 1,
  boldText: false,
  font: 'system',
  highContrast: false,
  reduceMotion: false,
};

let prefs = DEFAULT_A11Y;
const listeners = new Set();
const emit = () => listeners.forEach(fn => fn());

export const getA11yPrefs = () => prefs;
export const subscribeA11y = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function setA11yPrefs(patch) {
  prefs = { ...prefs, ...patch };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
}

export function resetA11yPrefs() {
  prefs = DEFAULT_A11Y;
  emit();
  AsyncStorage.removeItem(KEY).catch(() => {});
}

// Read once at startup (App.js). Text renders at the defaults for the
// moment before this lands, then re-renders once.
export async function loadA11yPrefs() {
  try {
    const saved = JSON.parse(await AsyncStorage.getItem(KEY));
    if (saved && typeof saved === 'object') {
      prefs = { ...DEFAULT_A11Y, ...saved };
      if (!TEXT_SIZES.some(s => s.key === prefs.textScale)) prefs.textScale = 1;
      emit();
    }
  } catch { /* defaults */ }
}

export function useA11yPrefs() {
  return useSyncExternalStore(subscribeA11y, getA11yPrefs, getA11yPrefs);
}

// True when either the phone or the app says to keep motion down.
export function useReducedMotion() {
  const { reduceMotion } = useA11yPrefs();
  const [os, setOs] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (live) setOs(!!v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => setOs(!!v));
    return () => { live = false; sub?.remove?.(); };
  }, []);
  return reduceMotion || os;
}
