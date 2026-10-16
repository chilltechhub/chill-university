// src/components/PixelArt.js
// Draws one named object from src/data/sceneArt.js (a box on a bigger sheet)
// at any size: the sheet is drawn scaled and offset inside a box that clips
// to just that object. Give `height` (the object's drawn height) or `scale`
// (drawn pixels per source pixel). `flip` mirrors it.

import React from 'react';
import { View, Image } from 'react-native';
import { ART, SHEETS } from '../data/sceneArt';

export default function PixelArt({ art, height, scale = 1, flip = false, style }) {
  const a = typeof art === 'string' ? ART[art] : art;
  if (!a) return null;
  const sheet = SHEETS[a.sheet];
  const k = height ? height / a.h : scale;
  return (
    <View
      style={[{ width: a.w * k, height: a.h * k, overflow: 'hidden' }, flip && { transform: [{ scaleX: -1 }] }, style]}
      pointerEvents="none"
    >
      <Image
        source={sheet.source}
        style={{ position: 'absolute', left: -a.x * k, top: -a.y * k, width: sheet.width * k, height: sheet.height * k }}
        resizeMode="stretch"
      />
    </View>
  );
}
