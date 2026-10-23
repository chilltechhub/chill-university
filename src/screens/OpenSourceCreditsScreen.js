// src/screens/OpenSourceCreditsScreen.js
// Sources and credits (docs/shake-up-plan-2026-10-21.md §4.2, P6): every
// source a unit or map card uses, with its licence and the date it was last
// checked, then the art packs. Built from the data itself, so a new source
// shows up here without an edit.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { UNITS } from '../data/units';
import { MAPS } from '../data/maps';

// The art, as the notes in characterRigs.js, sceneArt.js and SpriteIcon.js
// (and assets/32rogues/LICENSE.txt) record it. A link only where the source
// file names one.
const ART = [
  { name: 'CraftPix', url: 'https://craftpix.net/file-licenses/', license: 'Free licence, commercial use OK' },
  { name: 'ToffeeCraft', url: 'https://toffeecraft.itch.io/mega-bundle-forest-cat-user-interface-animals', license: 'Personal and commercial use' },
  { name: '32rogues, Seth Boyles (2024)', license: 'Commercial use OK, credit appreciated' },
  { name: 'monopixelart (itch.io)', license: 'Free, commercial use OK' },
  { name: 'zerie (itch.io)', license: 'Commercial use OK, no resale' },
  { name: 'pidroudays (itch.io)', license: 'Commercial use OK, no resale' },
];

export function contentSources() {
  const all = [
    ...UNITS.flatMap(u => u.sources || []),
    ...Object.values(MAPS).flatMap(m => m.cards.flatMap(card => card.sources || [])),
  ];
  const byName = new Map();
  all.forEach(x => { if (x?.name && !byName.has(x.name)) byName.set(x.name, x); });
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function OpenSourceCreditsScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const sources = useMemo(contentSources, []);

  const list = (rows, checked) => (
    <View style={{ borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden', marginBottom: s.lg }}>
      {rows.map((x, i) => (
        <TouchableOpacity key={x.name} disabled={!x.url} onPress={() => Linking.openURL(x.url).catch(() => {})}
          accessibilityRole={x.url ? 'link' : 'text'} accessibilityLabel={x.url ? `${x.name}, opens a website` : `${x.name}, ${x.license}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.md, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{x.name}</Text>
            <Text style={{ fontSize: t.xs, color: c.text3 }}>{x.license}{checked && x.reviewed ? ` · checked ${x.reviewed}` : ''}</Text>
          </View>
          {!!x.url && <Ionicons name="open-outline" size={15} color={c.text3} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg0 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={18} color={accent.primary} />
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">Sources and credits</Text>
        <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 4, marginBottom: s.lg }}>
          Units and map cards are in <Text style={{ fontWeight: t.bold }}>our own words</Text>. Facts link to where they come from.
        </Text>
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Facts and links</Text>
        {list(sources, true)}
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Art</Text>
        {list(ART, false)}
      </ScrollView>
    </SafeAreaView>
  );
}
