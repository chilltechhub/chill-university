// src/components/FeaturePicker.js
// "Pick your features": every part of the app (src/data/pickables.js),
// grouped, one tick each. Used by onboarding's pick step and by Make it
// yours → My features, so the two can't drift apart.
//
// What a tick means depends on the track:
//   picks  ticked = in your app
//   auto   the start's own tools are already in (shown as "Included");
//          ticking anything else opens it now instead of later
//   full   everything starts ticked; untick to hide

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { PICK_GROUPS, PICKABLES } from '../data/pickables';
import { getFeature } from '../data/featureCatalog';
import RichText from './RichText';

const HINT = {
  picks: '**Ticked** = in your app. Nothing else shows up unless you add it.',
  auto: 'You start with the **Included** ones, and more opens as you finish goals. **Tick** anything you want now.',
  full: 'Everything is on. **Untick** what you don’t want.',
};

// Plus items only while Plus can be bought; otherwise they're a lock
// without a key (featureAccess hides them everywhere else too).
export function pickableAvailable(item, { plusOnSale = false } = {}) {
  return !(item.features || []).some(f => getFeature(f)?.gate === 'paid') || plusOnSale;
}

export default function FeaturePicker({ track = 'picks', picks = [], recommended = [], onChange, plusOnSale = false }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const tint = accent?.primary || c.teal;
  const ticked = new Set(picks);
  const rec = new Set(recommended);
  const items = PICKABLES.filter(p => pickableAvailable(p, { plusOnSale }));
  const included = (id) => track === 'auto' && rec.has(id);

  const toggle = (id) => {
    if (included(id)) return;
    onChange?.(ticked.has(id) ? picks.filter(x => x !== id) : [...picks, id]);
  };
  const setAll = (ids) => onChange?.(ids);

  const Quick = ({ label, ids }) => (
    <TouchableOpacity onPress={() => setAll(ids)} accessibilityRole="button"
      style={{ paddingHorizontal: s.md, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1 }}>
      <Text style={{ fontSize: t.xs, fontWeight: '700', color: c.text2 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <RichText style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginBottom: s.md }} boldStyle={{ color: c.text1, fontWeight: '800' }}>
        {HINT[track] || HINT.picks}
      </RichText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.md }}>
        {track !== 'auto' && <Quick label="Recommended only" ids={items.filter(p => rec.has(p.id)).map(p => p.id)} />}
        {track === 'auto' && <Quick label="Clear extras" ids={items.filter(p => rec.has(p.id)).map(p => p.id)} />}
        <Quick label="Tick all" ids={items.map(p => p.id)} />
      </View>

      {PICK_GROUPS.map(group => {
        const rows = items.filter(p => p.group === group.key);
        if (!rows.length) return null;
        return (
          <View key={group.key} style={{ marginBottom: s.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name={group.icon} size={14} color={c.text3} />
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', color: c.text3 }}>{group.label}</Text>
            </View>
            <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden' }}>
              {rows.map((item, i) => {
                const inc = included(item.id);
                const on = inc || ticked.has(item.id);
                const paid = (item.features || []).some(f => getFeature(f)?.gate === 'paid');
                const tag = inc ? 'Included' : paid ? 'Plus' : item.labs ? 'Experimental' : rec.has(item.id) ? 'Recommended' : null;
                return (
                  <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} disabled={inc} activeOpacity={0.7}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: inc }}
                    accessibilityLabel={`${item.label}. ${item.blurb}${tag ? ` ${tag}.` : ''}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.md, paddingVertical: 11, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
                    <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: on ? tint + '1f' : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={item.icon} size={16} color={on ? tint : c.text3} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{item.label}</Text>
                        {!!tag && (
                          <Text style={{ fontSize: 11, fontWeight: '800', color: tag === 'Recommended' || tag === 'Included' ? tint : c.text3, letterSpacing: 0.4 }}>
                            {tag.toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>{item.blurb}</Text>
                    </View>
                    <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? tint : c.text3} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
