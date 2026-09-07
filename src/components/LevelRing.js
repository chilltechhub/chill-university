// src/components/LevelRing.js
// Shared "Base Command" progress ring — used on Home (rank), Games (stats),
// and Settings (account) so level/progress reads the same way everywhere.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function LevelRing({
  pct = 0,
  size = 46,
  strokeWidth = 4,
  color,
  trackColor,
  children,
  style,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const dashoffset = circumference * (1 - clamped / 100);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* The -90deg lives on the Svg rather than as `rotation`/`origin` props on
          the arc. Those are react-native-svg conveniences that its web renderer
          forwards straight to the DOM as `transform-origin`, which React rejects
          — an "Invalid DOM property" error on every single render of this ring
          (Home, Games and Settings all use it). Rotating the whole element is
          equivalent here, since both circles are concentric and centered. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={trackColor} strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}
