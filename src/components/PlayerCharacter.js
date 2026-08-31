// src/components/PlayerCharacter.js
// The player's on-screen character. Two render paths depending on the
// equipped outfit (see src/data/characterOptions.js):
//   - `outfit.rig` set: a real animated sprite (src/components/AnimatedSprite.js)
//     — its walk cycle while `walking` is true, idle loop otherwise.
//   - `outfit.sheet` set instead: a static "32rogues" portrait crop
//     (src/components/SpriteIcon.js) — CharacterWalker.js adds the hop.
// Either way, an optional held-item accessory (a static "32rogues" icon
// crop) overlays the corner.

import React from 'react';
import { View } from 'react-native';
import AnimatedSprite from './AnimatedSprite';
import SpriteIcon from './SpriteIcon';

export default function PlayerCharacter({ outfit, accessory, walking = false, size = 120, style }) {
  const badgeSize = Math.round(size * 0.36);

  return (
    <View style={[{ height: size, alignItems: 'center', justifyContent: 'flex-end' }, style]}>
      {outfit.rig ? (
        <AnimatedSprite sheet={walking ? outfit.rig.walk : outfit.rig.idle} size={size} />
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
