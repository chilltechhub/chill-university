// src/components/LockBadge.js
// The small pill that marks a gated entry wherever features are listed —
// the Library grid, the Compass rosters, Settings.
//
// One component rather than each screen drawing its own, because the whole
// value of a lock is that it reads the same everywhere: 🔒 always means
// "there is a way in", 🧪 always means "rough on purpose", ✦ always means
// "Plus". Three subtly different lock styles and people stop reading them.
//
// Takes the evaluateAccess() result straight — see src/logic/featureAccess.js
// — so callers never have to decide what state something is in.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { gateMetaFor } from '../logic/featureAccess';

export default function LockBadge({ access, size = 'sm', showLabel = true, style }) {
  const { colors: c } = useTheme();
  const meta = gateMetaFor(access);

  // Open, ungated, and nothing earned — there is nothing honest to say here,
  // and a badge on everything is a badge on nothing.
  if (!meta) return null;

  const color = c[meta.colorKey] || c.text3;
  const compact = size === 'xs';
  const s = makeStyles(c, color, compact);

  return (
    <View style={[s.pill, style]}>
      <Ionicons name={meta.icon} size={compact ? 9 : 11} color={color} />
      {showLabel && <Text style={s.text}>{meta.label}</Text>}
    </View>
  );
}

const makeStyles = (c, color, compact) => StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: compact ? 5 : 7,
    paddingVertical: compact ? 1 : 3,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: color,
    backgroundColor: color + '14',
  },
  text: {
    fontSize: compact ? 8 : 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color,
  },
});
