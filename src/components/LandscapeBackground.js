// src/components/LandscapeBackground.js
// Player-screen backdrop, sourced from src/data/backgroundOptions.js. Two
// render paths depending on the background's `kind`:
//   - 'image': one full illustrated scene, filling the frame
//   - 'tile' (or anything else, for backward compat): the original SVG sky
//     gradient behind a tiled strip of pixel-art ground + an optional prop
// Sized by its container — pass `height` and let width come from the
// parent (a card or the full screen).

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import SpriteIcon from './SpriteIcon';

const TILE = 32;

export default function LandscapeBackground({ background, height = 180, style, children }) {
  const cols = 12; // enough 32px tiles to cover any realistic card width

  if (background.kind === 'image') {
    // Size the box itself to the scene's real 16:9 aspect ratio instead of
    // a fixed height, so the whole illustration is always visible with no
    // cropping at all — a fixed height forces either a crop or a shrink-
    // and-letterbox on every screen width, this doesn't.
    return (
      <View style={[{ aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 16, backgroundColor: '#0a0a12' }, style]}>
        {/* Explicit width/height (not StyleSheet.absoluteFill) — on web,
            an absolutely-positioned Image without a numeric width/height
            falls back to rendering at the source's native pixel size
            instead of stretching to fill, showing only its top-left
            corner. Percentage sizing forces it to actually fill the box. */}
        <Image
          source={background.source}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[{ height, overflow: 'hidden', borderRadius: 16 }, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={background.sky[0]} />
            <Stop offset="1" stopColor={background.sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
      </Svg>

      {background.propRow != null && (
        <View style={styles.prop}>
          <SpriteIcon sheet={background.groundSheet} row={background.propRow} col={background.propCol} size={48} />
        </View>
      )}

      <View style={styles.groundRow}>
        {Array.from({ length: cols }).map((_, i) => (
          <SpriteIcon
            key={i}
            sheet={background.groundSheet}
            row={background.groundRow}
            col={background.groundCol}
            size={TILE}
          />
        ))}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  groundRow: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap',
  },
  prop: { position: 'absolute', right: 14, bottom: TILE + 6 },
});
