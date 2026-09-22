// src/components/widgets/WidgetCard.js
//
// Shared chrome for the persona dashboard widgets. Home's original nine
// widgets each hand-rolled this same card (bg1, r.lg, s.lg padding, hairline
// border, a coloured top edge) inline in HomeScreen's render; the eleven
// persona widgets share it from here instead, so they can't drift apart.
//
// The `empty` prop matters more than it looks. Most of these widgets are
// showing a brand-new account something it has none of yet, and the honest
// answer is "nothing here yet, here's how to start" — never a zero dressed
// up as a measurement. If a widget can't say something true, it says nothing
// and offers the action that would make it true.

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export default function WidgetCard({
  title,
  accent,            // colour of the top edge; defaults to the theme's teal
  icon,              // optional Ionicons name shown next to the title
  action,            // optional right-hand label, e.g. "Planner →"
  onAction,
  loading = false,
  empty = null,      // { text, cta, onPress } — shown instead of children
  children,
}) {
  const { colors: c, typography: t, spacing: s, radius: r, style: ui, accent: themeAccent } = useTheme();
  const edge = accent || themeAccent.primary;

  return (
    <View style={{
      backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.lg,
      marginHorizontal: s.lg, borderWidth: ui.borderWidth, borderColor: c.border,
      borderTopWidth: 2, borderTopColor: edge,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon && <Ionicons name={icon} size={14} color={edge} />}
          <Text style={{ fontSize: ui.name === 'plain' ? t.sm : t.xs, color: ui.name === 'plain' ? c.text2 : c.text4, ...ui.sectionLabel }}>
            {title}
          </Text>
        </View>
        {action && (
          <TouchableOpacity onPress={onAction} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: t.xs, color: edge, fontWeight: t.semibold }}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={edge} style={{ marginVertical: s.md }} />
      ) : empty ? (
        <View style={{ paddingVertical: s.sm }}>
          <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 19 }}>{empty.text}</Text>
          {empty.cta && (
            <TouchableOpacity
              onPress={empty.onPress}
              accessibilityRole="button"
              style={{ marginTop: s.md, alignSelf: 'flex-start', paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, borderWidth: 1, borderColor: edge }}>
              <Text style={{ fontSize: t.xs, color: edge, fontWeight: t.bold }}>{empty.cta}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : children}
    </View>
  );
}

// ─── Small shared pieces ────────────────────────────────────────────────────

export function StatRow({ label, value, color }) {
  const { colors: c, typography: t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 }}>
      <Text style={{ fontSize: t.sm, color: c.text3 }} numberOfLines={1}>{label}</Text>
      <Text style={{ fontSize: t.sm, color: color || c.text1, fontWeight: t.bold }}>{value}</Text>
    </View>
  );
}

export function Bar({ pct, color }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: color, width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </View>
  );
}
