// src/components/Skeleton.js
// Grey placeholder shapes while a screen's data loads, in place of a
// spinner. The shape of what's coming makes the wait feel shorter and keeps
// the layout from jumping when it lands. A slow pulse, still under Reduce
// motion.
//
//   <Skeleton width="60%" height={14} />      one bar
//   <SkeletonRows count={4} />                list rows (title + subtitle)
//   <SkeletonTiles count={4} />               a 2-up grid of stat tiles

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from '../logic/a11yPrefs';

export default function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  const { colors: c } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (reduced) { pulse.setValue(0.7); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: c.bg2, opacity: pulse }, style]} />;
}

export function SkeletonRows({ count = 3, style }) {
  const { colors: c, spacing: s, radius: r } = useTheme();
  return (
    <View style={[{ gap: s.sm }, style]} accessibilityLabel="Loading" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, borderRadius: r.md,
          backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}>
          <Skeleton width={22} height={22} radius={11} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width={`${70 - (i % 3) * 12}%`} height={13} />
            <Skeleton width="40%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonTiles({ count = 4, style }) {
  const { colors: c, spacing: s, radius: r } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }, style]} accessibilityLabel="Loading" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flexBasis: '47%', flexGrow: 1, padding: s.md, borderRadius: r.md,
          backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, gap: 8 }}>
          <Skeleton width="55%" height={10} />
          <Skeleton width="35%" height={22} />
        </View>
      ))}
    </View>
  );
}
