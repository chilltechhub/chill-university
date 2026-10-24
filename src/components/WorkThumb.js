// src/components/WorkThumb.js
// A small picture of a piece of work (docs/shake-up-plan-2026-10-21.md §9:
// "deliverable cards show a real thumbnail of the work"), so the Make board
// reads like a wall of things made, not a list of tasks. It shows the work
// itself: the first lines written, the ticks on a checklist, or the Build's
// kind, on the path's own colour.

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { pathLook } from '../ui';
import { BUILD_KIND_MAP } from '../data/builds';

export default function WorkThumb({ deliverable: d, unit, size = 56 }) {
  const { colors: c } = useTheme();
  const look = pathLook(c, unit?.path);
  const def = unit?.deliverable || {};
  const box = { width: size, height: size, borderRadius: 12, backgroundColor: look.soft, borderWidth: 1, borderColor: look.color + '55', padding: 6, overflow: 'hidden' };

  if (d?.kind === 'build') {
    const kind = BUILD_KIND_MAP[d.buildKind || def.buildKind];
    return (
      <View style={[box, { alignItems: 'center', justifyContent: 'center' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={kind?.icon || 'color-wand-outline'} size={Math.round(size * 0.42)} color={look.color} />
      </View>
    );
  }
  if (d?.kind === 'checklist') {
    const items = def.items || [];
    return (
      <View style={[box, { gap: 3 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.slice(0, 4).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name={d.content?.[i] === true ? 'checkbox' : 'square-outline'} size={9} color={look.color} />
            <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: look.color + '55' }} />
          </View>
        ))}
      </View>
    );
  }
  // Written work: its first words.
  const first = Object.values(d?.content || {}).find(v => typeof v === 'string' && v.trim());
  return (
    <View style={box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {first ? (
        <Text style={{ fontSize: 8 /* a11y-ok: a picture of the work, hidden from screen readers; the card says it in full */, lineHeight: 10, color: c.text2 }} numberOfLines={5}>{first}</Text>
      ) : (
        <View style={{ gap: 4, marginTop: 2 }}>
          {[1, 0.8, 0.9, 0.5].map((w, i) => <View key={i} style={{ height: 3, width: `${w * 100}%`, borderRadius: 2, backgroundColor: look.color + '44' }} />)}
        </View>
      )}
    </View>
  );
}
