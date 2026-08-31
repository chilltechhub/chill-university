// src/components/BadgeMedal.js
// A single award medal for the Player screen's Awards grid — tier-colored
// ring around the badge's icon, dimmed + locked when not yet earned.
// Theme-aware so it matches the app's light/dark setting like everything
// else (see context/ThemeContext.js).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BADGE_TIER_COLOR } from '../data/badgeDefinitions';

export default function BadgeMedal({ badge, earned, size = 64 }) {
  const { colors: c } = useTheme();
  const tierColor = BADGE_TIER_COLOR[badge.tier] || c.text4;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.medal,
          {
            width: size, height: size, borderRadius: size / 2,
            borderColor: earned ? tierColor : c.border,
            backgroundColor: c.bg1,
          },
          !earned && styles.medalLocked,
        ]}
      >
        <Text style={{ fontSize: size * 0.42 }}>{earned ? badge.icon : '🔒'}</Text>
      </View>
      <Text
        style={[styles.name, { color: earned ? c.text1 : c.text4 }]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 84 },
  medal: {
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  medalLocked: { opacity: 0.5 },
  name: { fontSize: 11, textAlign: 'center', fontWeight: '600' },
});
