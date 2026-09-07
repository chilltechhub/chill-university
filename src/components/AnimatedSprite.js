// src/components/AnimatedSprite.js
// Plays one animation (idle/walk/etc) from a horizontal frame-strip sheet
// — see src/data/characterRigs.js. Cycles frames on a fixed-rate timer and
// resets to frame 0 whenever the sheet itself changes (e.g. idle -> walk),
// so swapping animations never starts mid-stride. `size` sets the frame's
// rendered HEIGHT; width follows the frame's own aspect ratio (most rigs
// are square, but not all — Mushroom's frames are wider than tall).

import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';

const FPS = 8;

export default function AnimatedSprite({ sheet, size = 64, style }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => { setFrame(0); }, [sheet.source]);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % sheet.frames);
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [sheet.source, sheet.frames]);

  const scale = size / sheet.frameHeight;
  const frameW = sheet.frameWidth * scale;

  return (
    <View style={[{ width: frameW, height: size, overflow: 'hidden' }, style]} pointerEvents="none">
      <Image
        source={sheet.source}
        style={{
          width: sheet.frames * sheet.frameWidth * scale,
          height: size,
          position: 'absolute',
          left: -frame * sheet.frameWidth * scale,
          top: 0,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
