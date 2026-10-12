// src/components/AppText.js
// React Native's Text and TextInput, with the accessibility choices from
// src/logic/a11yPrefs.js applied: text size, bold text and the easy-read
// font.
//
// Nobody imports this by hand. babel.config.js (scripts/babel-plugin-app-
// text.js) points every app file's `Text` / `TextInput` import from
// 'react-native' here, so the ~1,500 places that set their own
// fontSize all follow the setting without being touched. This file is the
// one place that still imports the originals.
//
// At the defaults it renders the original component with the same props,
// so the cost is one store read per text.

import React, { createContext, useContext } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, Platform } from 'react-native';
import { useA11yPrefs, READABLE_FONTS } from '../logic/a11yPrefs';

// Nested text inherits its parent's (already adjusted) size and weight, so
// only the outermost text fills in a size when the style gives none.
const InsideText = createContext(false);

const RN_DEFAULT_SIZE = 14;
const BOLDER = { normal: '600', 100: '400', 200: '400', 300: '500', 400: '600', 500: '700', 600: '700', 700: '800', 800: '900', bold: '800' };

const isDefault = (p) => p.textScale === 1 && !p.boldText && p.font === 'system';

function adjust(style, p, { nested, input }) {
  const flat = StyleSheet.flatten(style) || {};
  const out = {};
  if (p.textScale !== 1) {
    const size = flat.fontSize ?? (nested ? null : RN_DEFAULT_SIZE);
    if (size) out.fontSize = Math.round(size * p.textScale * 2) / 2;
    if (flat.lineHeight) out.lineHeight = Math.round(flat.lineHeight * p.textScale);
  }
  let weight = flat.fontWeight != null ? String(flat.fontWeight) : null;
  if (p.boldText && !input && (weight != null || !nested)) {
    weight = BOLDER[weight ?? 'normal'] || weight;
    out.fontWeight = weight;
  }
  if (p.font === 'readable') {
    // Two weights in the file. Picking the face by weight (rather than
    // asking for bold of the regular face) keeps Android from faking it.
    const heavy = weight != null && (weight === 'bold' || Number(weight) >= 600);
    if (weight != null || !nested) {
      out.fontFamily = heavy ? READABLE_FONTS.bold : READABLE_FONTS.regular;
      if (Platform.OS === 'android') out.fontWeight = 'normal';
    }
  }
  return [style, out];
}

export function Text(props) {
  const p = useA11yPrefs();
  const nested = useContext(InsideText);
  if (isDefault(p)) return <RNText {...props} />;
  const text = <RNText {...props} style={adjust(props.style, p, { nested })} />;
  return nested ? text : <InsideText.Provider value>{text}</InsideText.Provider>;
}

export function TextInput(props) {
  const p = useA11yPrefs();
  if (isDefault(p)) return <RNTextInput {...props} />;
  return <RNTextInput {...props} style={adjust(props.style, p, { nested: false, input: true })} />;
}

export default Text;
