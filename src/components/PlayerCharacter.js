// src/components/PlayerCharacter.js
// The player's on-screen character. Three render paths depending on the
// equipped outfit (see src/data/characterOptions.js):
//   - `outfit.rig` set: a real animated sprite (src/components/AnimatedSprite.js)
//     — its walk cycle while `walking` is true, idle loop otherwise.
//   - `outfit.sheet` set instead: a static "32rogues" portrait crop
//     (src/components/SpriteIcon.js) — CharacterWalker.js adds the hop.
//   - `outfit.image` set instead: one standalone pre-cropped portrait, no
//     sheet to crop from (the curated "500 Free Pixel Art Fantasy
//     Character Pack" picks) — same hop treatment as the sheet portraits,
//     just no row/col needed.
// Either way, an optional held-item accessory (a static "32rogues" icon
// crop) overlays the corner.

import React from 'react';
import { View, Image } from 'react-native';
import AnimatedSprite from './AnimatedSprite';
import SpriteIcon from './SpriteIcon';

export default function PlayerCharacter({ outfit, accessory, walking = false, size = 120, style }) {
  const badgeSize = Math.round(size * 0.36);

  return (
    <View style={[{ height: size, alignItems: 'center', justifyContent: 'flex-end' }, style]}>
      {outfit.rig ? (
        <AnimatedSprite sheet={walking ? outfit.rig.walk : outfit.rig.idle} size={size} />
      ) : outfit.image ? (
        <Image
          source={outfit.image}
          style={{ width: size * (outfit.imageAspect || 0.43), height: size }}
          resizeMode="contain"
        />
      ) : (
        <SpriteIcon sheet={outfit.sheet} row={outfit.row} col={outfit.col} size={size} />
      )}
      {accessory && accessory.sheet ? (
        <View
          style={{
            position: 'absolute',
            right: -badgeSize * 0.08,
            bottom: -badgeSize * 0.08,
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: badgeSize / 2,
          }}
        >
          <SpriteIcon sheet={accessory.sheet} row={accessory.row} col={accessory.col} size={badgeSize} />
        </View>
      ) : null}
    </View>
  );
}
