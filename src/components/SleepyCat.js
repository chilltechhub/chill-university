// src/components/SleepyCat.js
// A small curled-up cat, breathing, for the quiet screens: nothing due,
// nothing planned. Decoration only (hidden from screen readers). `variant`
// picks one of the five coats (sceneArt.js SLEEPING_CATS). `size` is the
// frame's height; the cat itself fills about the middle half of it.

import React from 'react';
import { View } from 'react-native';
import AnimatedSprite from './AnimatedSprite';
import { SLEEPING_CATS } from '../data/sceneArt';

export default function SleepyCat({ variant = 0, size = 72, style }) {
  const sheet = SLEEPING_CATS[variant % SLEEPING_CATS.length];
  return (
    <View style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <AnimatedSprite sheet={sheet} size={size} />
    </View>
  );
}
