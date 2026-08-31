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
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
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
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}
