// src/components/MoreMenu.js
// The "⋯" a screen header hangs its occasional actions on, so the row
// keeps one primary button instead of four or five icons competing with it
// (the Vault header had AI, export-Markdown, export-CSV and New all in a
// row, which pushed the row past the width of a phone).
//
//   <MoreMenu items={[
//     { label: 'Fill with AI', icon: 'sparkles', onPress: ... },
//     { label: 'Export as Markdown', icon: 'document-text-outline', onPress: ... },
//   ]} />
//
// Items are shown in order; falsy entries are skipped, so a caller can
// write `entries.length > 0 && {...}` inline.
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function MoreMenu({ items = [], color, label = 'More actions', style }) {
  const { colors: c, typography: t, spacing: s, style: ui } = useTheme();
  const [open, setOpen] = useState(false);
  const list = items.filter(Boolean);
  if (!list.length) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={[{ padding: 6 }, style]}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={color || c.text2} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: s.sm, paddingBottom: s.xxl }}
            onPress={() => {}}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.sm }} />
            {list.map(item => (
              <TouchableOpacity
                key={item.label}
                onPress={() => { setOpen(false); item.onPress?.(); }}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.xl, paddingVertical: 14 }}
              >
                <Ionicons name={item.icon || 'ellipse-outline'} size={19} color={item.color || c.text2} />
                <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.semibold, color: item.color || c.text1 }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={{ marginHorizontal: s.xl, marginTop: s.sm, paddingVertical: 12, alignItems: 'center', borderRadius: ui.buttonRadius, backgroundColor: c.bg2 }}
            >
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text2 }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
