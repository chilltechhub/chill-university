// src/components/lifeareas/GoDeeperList.js
// Research links for a sub-section, from area_resources (already filtered to
// the viewer's age band by useAreaActions). `extra` takes a screen's older
// hardcoded { label, link } resources; any that duplicate a pool link are
// dropped so nothing shows twice.

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { FONTS } from '../../theme';

const norm = u => String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '').toLowerCase();

function Chip({ text, c, tone }) {
  return (
    <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: tone || c.text2, backgroundColor: c.bg2, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' }}>
      {text}
    </Text>
  );
}

export default function GoDeeperList({ resources = [], extra = [], color }) {
  const { colors: c, typography: t, radius: r } = useTheme();
  const seen = new Set(resources.map(x => norm(x.url)));
  const items = [
    ...resources.map(x => ({ key: x.key, title: x.title, url: x.url, description: x.description, source: x.source, kind: x.kind, cost: x.cost })),
    ...extra.filter(x => !seen.has(norm(x.link))).map(x => ({ key: x.link, title: x.label, url: x.link })),
  ];
  if (!items.length) {
    return <Text style={{ fontSize: t.sm, color: c.text3 }}>No links here yet.</Text>;
  }
  return (
    <View style={{ gap: 10 }}>
      {items.map(item => (
        <TouchableOpacity key={item.key} onPress={() => Linking.openURL(item.url)} accessibilityRole="link"
          accessibilityLabel={`${item.title}${item.source ? `, from ${item.source}` : ''}. Opens in your browser.`}
          style={{ backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border, borderRadius: r.lg, padding: 12, minHeight: 56 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{item.title}</Text>
            <Ionicons name="open-outline" size={15} color={color} />
          </View>
          {!!item.description && <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 3, lineHeight: 19 }}>{item.description}</Text>}
          {(item.source || item.kind) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
              {!!item.kind && <Chip text={item.kind} c={c} />}
              {item.cost && item.cost !== 'free' && <Chip text={item.cost} c={c} tone={c.gold} />}
              {!!item.source && <Text style={{ fontSize: t.xs, color: c.text3 }}>{item.source}</Text>}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
