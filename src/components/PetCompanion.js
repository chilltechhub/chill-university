// src/components/PetCompanion.js
// The player's pet companion. Renders one of three ways depending on the
// equipped tier's `kind` (see src/data/petOptions.js):
//   - 'animated': a real multi-frame animation loop (AnimatedSprite.js)
//   - 'image': one standalone image, no cropping needed
//   - anything else (including accessories reusing this component for
//     their wardrobe preview — see ProfileScreen.js): a static crop from a
//     grid sheet (SpriteIcon.js)

import React from 'react';
import { View, Image } from 'react-native';
import SpriteIcon from './SpriteIcon';
import AnimatedSprite from './AnimatedSprite';

export default function PetCompanion({ pet, size = 56, style }) {
  if (!pet) return null;
  return (
    <View style={[{ width: size, height: size }, style]}>
      {pet.kind === 'animated' ? (
        <AnimatedSprite sheet={pet.sheet} size={size} />
      ) : pet.kind === 'image' ? (
        <Image source={pet.source} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <SpriteIcon sheet={pet.sheet} row={pet.row} col={pet.col} size={size} />
      )}
    </View>
  );
}
