// src/components/SpriteIcon.js
// Crops a single 32x32 cell out of a "32rogues" pixel-art sheet
// (assets/32rogues/, Seth Boyles 2024 — see LICENSE.txt: commercial and
// non-commercial use is fine, no NFT/blockchain/AI-training use, no
// redistribution/resale, credit appreciated but not required).
//
// Each sheet is a fixed grid of 32px cells; row/col address a sprite the
// same way the pack's own *.txt legends do (row = numbered group, col =
// a/b/c... position). Data files (characterOptions.js, petOptions.js,
// backgroundOptions.js) store {sheet, row, col} rather than a cropped
// image file, so adding/re-mapping sprites never needs a build step.

import React from 'react';
import { View, Image } from 'react-native';

const CELL = 32;

const SHEETS = {
  rogues:   { source: require('../../assets/32rogues/rogues.png'),   cols: 7,  rows: 7  },
  animals:  { source: require('../../assets/32rogues/animals.png'),  cols: 9,  rows: 16 },
  items:    { source: require('../../assets/32rogues/items.png'),    cols: 11, rows: 26 },
  tiles:    { source: require('../../assets/32rogues/tiles.png'),    cols: 17, rows: 26 },
  monsters: { source: require('../../assets/32rogues/monsters.png'), cols: 12, rows: 13 },
};

/**
 * Renders one sprite cell scaled up to `size`. RN's image scaler isn't
 * true nearest-neighbor, so pixel edges can look slightly soft — prefer
 * sizes that are multiples of 32 (64/96/128) for the crispest result.
 */
export default function SpriteIcon({ sheet, row, col, size = 64, style }) {
  const meta = SHEETS[sheet];
  if (!meta || row == null || col == null) return null;
  const scale = size / CELL;
  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]} pointerEvents="none">
      <Image
        source={meta.source}
        style={{
          width: meta.cols * CELL * scale,
          height: meta.rows * CELL * scale,
          position: 'absolute',
          left: -col * CELL * scale,
          top: -row * CELL * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
