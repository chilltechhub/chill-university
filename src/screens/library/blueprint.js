// src/screens/library/blueprint.js
// The Workshop's paper — a drafting-table blueprint look, used only by
// projects.js and ProjectDetail.js. Every other screen keeps the regular
// app theme; this is a deliberately separate, bespoke palette that still
// respects the user's light/dark preference via useTheme().isDark.

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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

// Fixed graph-paper backdrop — a minor grid every 17px, a heavier line
// every 5th one (85px). Painted once behind the screen; content sits over it.
//
// Drawn with plain Views, NOT react-native-svg, and that is deliberate. As an
// <Svg>, this backdrop painted OVER the screen's content on iOS no matter
// what — it came first in JSX, it had a lower zIndex, and it was wrapped in
// an absolutely-positioned View, and the header/search/build list still
// ended up underneath it, leaving nothing but blank graph paper on device
// (it rendered correctly on web the whole time, which is what made it such
// a difficult one to pin down). Plain Views layer predictably everywhere, so
// the grid stays behind where it belongs. Keep it that way.
//
// Two more rules, both learned the hard way on device:
//  - Every box carries EXPLICIT pixel width/height. Never size a rule with
//    `left:0 + right:0` (or `top:0 + bottom:0`) edge-stretching: inside an
//    absolutely positioned parent with no resolved size, native layout
//    collapses those children to zero and the entire grid renders invisible,
//    while still looking perfect on web.
//  - Avoid StyleSheet.hairlineWidth — ~0.33pt on a 3x screen, too faint for
//    this pale palette. The weights below match the original Svg stroke
//    widths exactly, so the paper looks the way it always did.
//
// NOTE: projects.js carries its own copy of this as WorkshopGrid. Any fix
// here needs to be made there too (or the two consolidated).
const MINOR = 17;   // px between minor rules
const MAJOR_EVERY = 5; // every 5th rule is a heavy one (85px)

export function BlueprintGrid({ bp }) {
  const { width, height } = useWindowDimensions();
  const rows = Math.ceil(height / MINOR) + 1;
  const cols = Math.ceil(width / MINOR) + 1;
  const MINOR_W = 0.6; // matches the old Svg strokeWidth
  const MAJOR_W = 1;

  return (
    <View
      style={{
        position: 'absolute', top: 0, left: 0, width, height,
        backgroundColor: bp.paper, overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      {Array.from({ length: rows }, (_, i) => {
        const major = i % MAJOR_EVERY === 0;
        return (
          <View
            key={`h${i}`}
            style={{
              position: 'absolute', left: 0, top: i * MINOR,
              width, height: major ? MAJOR_W : MINOR_W,
              backgroundColor: major ? bp.gridMajor : bp.grid,
            }}
          />
        );
      })}
      {Array.from({ length: cols }, (_, i) => {
        const major = i % MAJOR_EVERY === 0;
        return (
          <View
            key={`v${i}`}
            style={{
              position: 'absolute', top: 0, left: i * MINOR,
              height, width: major ? MAJOR_W : MINOR_W,
              backgroundColor: major ? bp.gridMajor : bp.grid,
            }}
          />
        );
      })}
    </View>
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
