// src/screens/library/blueprint.js
// The Workshop's paper — a drafting-table blueprint look, used only by
// projects.js and ProjectDetail.js. Every other screen keeps the regular
// app theme; this is a deliberately separate, bespoke palette that still
// respects the user's light/dark preference via useTheme().isDark.

import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../../context/ThemeContext';
import { FONTS } from '../../theme';

// Light = "whiteprint" (diazo reversal): pale blue paper, navy ink.
const LIGHT = {
  paper:     '#eef5fb',
  panel:     '#ffffff',
  grid:      '#cddef1',
  gridMajor: '#a9c6e3',
  ink:       '#15355c',
  ink2:      '#4c6790',
  ink3:      '#8299bb',
  border:    '#9fbcdc',
  accent:    '#0f7f96',
  onAccent:  '#ffffff',
  stamp:     '#c1501e',
  onStamp:   '#ffffff',
  approved:  '#2f7d4f',
  draft:     '#767c8c',
  violet:    '#6a4fa0',
  danger:    '#c0392b',
};

// Dark = classic cyanotype: deep blue paper, pale cyan ink.
const DARK = {
  paper:     '#0b2740',
  panel:     '#12385e',
  grid:      '#1b4568',
  gridMajor: '#295c86',
  ink:       '#eaf3ff',
  ink2:      '#a9c4e2',
  ink3:      '#6f8bad',
  border:    '#2e5c88',
  accent:    '#5fd3e8',
  onAccent:  '#06202f',
  stamp:     '#f0975a',
  onStamp:   '#1c2e42',
  approved:  '#5fcf8f',
  draft:     '#93a2bb',
  violet:    '#c9b3f5',
  danger:    '#ff6b5b',
};

export function useBlueprint() {
  const { isDark } = useTheme();
  return isDark ? DARK : LIGHT;
}

// Fixed graph-paper backdrop — a minor grid every ~17px, a heavier grid
// every 5th line. Painted once behind the screen; content scrolls over it.
export function BlueprintGrid({ bp }) {
  const { width, height } = Dimensions.get('window');
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Defs>
        <Pattern id="bpMinor" width={17} height={17} patternUnits="userSpaceOnUse">
          <Path d="M17 0 L0 0 0 17" fill="none" stroke={bp.grid} strokeWidth={0.6} />
        </Pattern>
        <Pattern id="bpMajor" width={85} height={85} patternUnits="userSpaceOnUse">
          <Path d="M85 0 L0 0 0 85" fill="none" stroke={bp.gridMajor} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={bp.paper} />
      <Rect width="100%" height="100%" fill="url(#bpMinor)" />
      <Rect width="100%" height="100%" fill="url(#bpMajor)" />
    </Svg>
  );
}

// Corner crop-marks — like the register marks on a technical drawing frame.
export function CornerTicks({ color, size = 9, inset = 6 }) {
  const line = { position: 'absolute', backgroundColor: color };
  return (
    <>
      <View style={[line, { top: inset, left: inset, width: size, height: 2 }]} />
      <View style={[line, { top: inset, left: inset, width: 2, height: size }]} />
      <View style={[line, { top: inset, right: inset, width: size, height: 2 }]} />
      <View style={[line, { top: inset, right: inset, width: 2, height: size }]} />
      <View style={[line, { bottom: inset, left: inset, width: size, height: 2 }]} />
      <View style={[line, { bottom: inset, left: inset, width: 2, height: size }]} />
      <View style={[line, { bottom: inset, right: inset, width: size, height: 2 }]} />
      <View style={[line, { bottom: inset, right: inset, width: 2, height: size }]} />
    </>
  );
}

// A rotated inspection-stamp badge — used for build stages.
export function Stamp({ label, color, dashed }) {
  return (
    <View style={{
      borderWidth: 1.5, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid',
      borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2,
      transform: [{ rotate: '-2.5deg' }], alignSelf: 'flex-start',
    }}>
      <Text style={{ color, fontFamily: FONTS.mono, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  );
}

// A scale-ruler progress bar with graduation ticks at 25/50/75%.
export function RulerBar({ pct, color, bp, height = 10 }) {
  return (
    <View style={{ height, borderWidth: 1, borderColor: bp.border, borderRadius: 2, backgroundColor: bp.panel, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {[25, 50, 75].map(p => (
          <View key={p} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, backgroundColor: bp.border }} />
        ))}
      </View>
    </View>
  );
}
