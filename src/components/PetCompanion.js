// src/components/PetCompanion.js
// The player's pet companion. Renders one of three ways depending on the
// equipped tier's `kind` (see src/data/petOptions.js):
//   - 'animated': a real multi-frame animation loop (AnimatedSprite.js)
//   - 'image': one standalone image, no cropping needed
//   - anything else (including accessories reusing this component for
//     their wardrobe preview — see ProfileScreen.js): a static crop from a
//     grid sheet (SpriteIcon.js)
//
// `lying`: a hungry pet (src/logic/petHunger.js) lies down on its tummy,
// still, until it's fed. Turned a quarter toward the way its art faces
// (petOptions.js `facingRight`), so its head points forward and its tummy
// is on the ground; its animation holds on the first frame.

import React from 'react';
import { View, Image } from 'react-native';
import SpriteIcon from './SpriteIcon';
import AnimatedSprite from './AnimatedSprite';

const LYING_RIGHT = { transform: [{ rotate: '90deg' }] };
const LYING_LEFT = { transform: [{ rotate: '-90deg' }] };

export default function PetCompanion({ pet, size = 56, style, lying = false }) {
  if (!pet) return null;
  const lie = lying ? (pet.facingRight === false ? LYING_LEFT : LYING_RIGHT) : null;
  return (
    <View style={[{ width: size, height: size }, lie, style]}>
      {pet.kind === 'animated' ? (
        <AnimatedSprite sheet={pet.sheet} size={size} paused={lying} />
      ) : pet.kind === 'image' ? (
        <Image source={pet.source} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <SpriteIcon sheet={pet.sheet} row={pet.row} col={pet.col} size={size} />
      )}
    </View>
  );
}
