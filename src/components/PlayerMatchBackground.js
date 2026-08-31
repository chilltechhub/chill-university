// src/components/PlayerMatchBackground.js
// Full-screen backdrop that mirrors the landscape the player has equipped
// on their character (Training tab / Profile) — reuses the same
// BACKGROUNDS data as LandscapeBackground.js (src/data/backgroundOptions.js),
// but stretched edge-to-edge behind a whole screen instead of sized to a
// single card. Non-scrolling — it's wallpaper behind the screen, fixed to
// the viewport, not the scroll content.

import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import SpriteIcon from './SpriteIcon';

const TILE = 32;

export default function PlayerMatchBackground({ background, style }) {
  if (!background) return null;

  if (background.kind === 'image') {
    // Explicit width/height (not StyleSheet.absoluteFill) — on web, an
    // absolutely-positioned Image without a numeric width/height falls back
    // to rendering at the source's native pixel size instead of stretching
    // to fill. Same fix as LandscapeBackground.js's 'image' path.
    return (
      <Image
        source={background.source}
        style={[{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }, style]}
        resizeMode="cover"
      />
    );
  }

  // 'tile' kind — same sky gradient + tiled ground strip as the player's
  // own card, just wide enough to cover the actual device width.
  const { width: winW } = Dimensions.get('window');
  const cols = Math.ceil(winW / TILE) + 1;

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={background.sky[0]} />
            <Stop offset="1" stopColor={background.sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
      </Svg>
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
    </View>
  );
}

const styles = StyleSheet.create({
  groundRow: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap',
  },
});
