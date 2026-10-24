// src/components/MapCard.js
// One road on a map (src/data/maps.js, shake-up P6): what it is, what it
// takes, what it costs, where it leads, a first step, and where the facts
// come from. The same template for every map, so roads read side by side.
// Tapping the star marks it as one to look at closer.

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import RichText from './RichText';

export default function MapCard({ card, starred = false, onStar, style }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const row = (label, text) => (
    <View style={{ marginTop: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: c.text3 }}>{label.toUpperCase()}</Text>
      <RichText style={{ fontSize: t.sm, color: c.text1 }} boldStyle={{ color: c.text1 }}>{text}</RichText>
    </View>
  );
  return (
    <View style={[{ padding: s.md, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: starred ? 1.5 : 0.5, borderColor: starred ? accent.primary : c.border }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
        <Ionicons name={card.icon || 'map-outline'} size={20} color={accent.primary} />
        <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{card.title}</Text>
        {onStar && (
          <TouchableOpacity onPress={() => onStar(card.id)} hitSlop={8} accessibilityRole="button"
            accessibilityLabel={starred ? `${card.title}: starred. Unstar` : `Star ${card.title}`} accessibilityState={{ selected: starred }}>
            <Ionicons name={starred ? 'star' : 'star-outline'} size={20} color={starred ? accent.primary : c.text3} />
          </TouchableOpacity>
        )}
      </View>
      <RichText style={{ fontSize: t.sm, color: c.text2, marginTop: 4 }} boldStyle={{ color: c.text1 }}>{card.what}</RichText>
      {row('Takes', card.takes)}
      {row('Costs', card.costs)}
      {row('Leads to', card.leadsTo)}
      {row('First step', card.firstStep)}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm }}>
        {!!card.link && (
          <TouchableOpacity onPress={() => Linking.openURL(card.link.url).catch(() => {})} accessibilityRole="link" accessibilityLabel={`${card.link.label}, opens a website`}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>{card.link.label} ↗</Text>
          </TouchableOpacity>
        )}
        {!!card.sources?.length && (
          <Text style={{ fontSize: 11, color: c.text3 }}>Source: {card.sources.map(x => x.name).join(', ')} · checked {card.sources[0].reviewed}</Text>
        )}
      </View>
    </View>
  );
}
