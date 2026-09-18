// src/components/lifeareas/DetailsDrawer.js
// "Details & history": everything a sub-section had before the action panel
// — the log form, categories, habits list, tips, related links and history —
// kept intact and folded into one collapsed drawer under the actions.
//
// tabs: [{ key, label, render: () => node }]. Only the open tab renders.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export default function DetailsDrawer({ tabs, initialTab, summary, defaultOpen = false, color }) {
  const { colors: c, typography: t, radius: r } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState(initialTab || tabs[0]?.key);
  const active = tabs.find(x => x.key === tab) || tabs[0];

  return (
    <View style={{ backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border, borderRadius: r.xl, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setOpen(v => !v)} accessibilityRole="button"
        accessibilityState={{ expanded: open }} accessibilityLabel="Details and history"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, minHeight: 56 }}>
        <Ionicons name="list-outline" size={18} color={c.text2} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>Details & history</Text>
          {!!summary && !open && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{summary}</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.text3} />
      </TouchableOpacity>

      {open && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
          <View accessibilityRole="tablist"
            style={{ flexDirection: 'row', gap: 4, padding: 4, backgroundColor: c.bg2, borderRadius: r.md, marginBottom: 14 }}>
            {tabs.map(x => {
              const on = x.key === active.key;
              return (
                <TouchableOpacity key={x.key} onPress={() => setTab(x.key)} accessibilityRole="tab" accessibilityLabel={x.label} accessibilityState={{ selected: on }}
                  style={{ flex: 1, minHeight: 36, borderRadius: r.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.bg1 : 'transparent', borderWidth: on ? 1 : 0, borderColor: color + '55' }}>
                  <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: on ? c.text1 : c.text3 }}>{x.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ paddingHorizontal: 4 }}>{active.render()}</View>
        </View>
      )}
    </View>
  );
}
