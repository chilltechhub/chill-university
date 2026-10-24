// src/components/CalmKit.js
// What Home's and the Library's Calm views share (CalmHome.js,
// CalmLibrary.js): the dark accent-tinted panel, its headline, its pill
// buttons, its two cards, and the link back to the full view under it.

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
// The palette and the panel live in the visual kit since P9 (src/ui): this
// file keeps its names so every Calm screen reads the same as before.
import { Panel, useCalmPalette, calmEyebrow } from '../ui';

export { useCalmPalette, calmEyebrow };

export const plural = (n, one, many) => (n === 1 ? one : many);
export const ago = (iso) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 14 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
};

// The panel is always dark, tinted by your accent, in light mode too.
// `id` names the SVG gradient (page-wide on web).
export function CalmPanel({ id, pal, children }) {
  return <Panel id={id} pal={pal}>{children}</Panel>;
}

// Small label over one big line: the one thing that matters here.
export function CalmHeadline({ label, title, sub, onPress, a11y, pal, style }) {
  const { style: ui } = useTheme();
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={0.8} accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={a11y || `${label}. ${title}${sub ? `. ${sub}` : ''}`} style={style}>
      <Text style={{ ...calmEyebrow, color: pal.eyebrow, marginBottom: 6 }}>{label}</Text>
      <Text numberOfLines={3} style={{ fontSize: 32, lineHeight: 37, fontWeight: '800', letterSpacing: -0.6, color: pal.text, fontFamily: ui.titleFont }}>
        {title}
      </Text>
      {!!sub && <Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 21, color: pal.text2, marginTop: 6 }}>{sub}</Text>}
    </TouchableOpacity>
  );
}

export function CalmPill({ label, icon, onPress, pal, solid, a11y }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={a11y || label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: solid ? pal.fill : 'transparent', borderWidth: 1, borderColor: solid ? pal.fill : pal.glassEdge }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color: solid ? pal.onFill : pal.text }}>{label}</Text>
      <Ionicons name={icon} size={14} color={solid ? pal.onFill : pal.text} />
    </TouchableOpacity>
  );
}

// Two cards side by side (one full width when that's all there is). A card
// is { key, label, value, unit, sub, warn } for a number, or { key, label,
// title, sub } for a project or note; `open` runs on tap, else
// onOpenScreen(screen).
export function CalmTiles({ tiles, pal, onOpenScreen }) {
  const { spacing: s, style: ui } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: s.md, marginTop: s.md }}>
      {tiles.map(tile => (
        <TouchableOpacity key={tile.key} activeOpacity={0.85}
          onPress={tile.open || (() => onOpenScreen?.(tile.screen))}
          accessibilityRole="button"
          accessibilityLabel={`${tile.label}: ${tile.title || `${tile.value} ${tile.unit}`}${tile.sub ? `. ${tile.sub}` : ''}`}
          style={{ flex: 1, backgroundColor: pal.tile, borderRadius: 22, padding: s.md + 2, minHeight: 124 }}>
          <Text style={{ ...calmEyebrow, fontSize: 11, color: pal.tileMuted }}>{tile.label}</Text>
          {tile.title ? (
            // A project or note: its name, not a number.
            <Text style={{ fontSize: 18, lineHeight: 23, fontWeight: '800', color: pal.tileInk, marginTop: 8 }} numberOfLines={2}>
              {tile.title}
            </Text>
          ) : (
            <>
              <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: '800', color: pal.tileInk, marginTop: 6, fontFamily: ui.numberFont }} numberOfLines={1} adjustsFontSizeToFit>
                {tile.value}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: pal.tileInk }} numberOfLines={1}>{tile.unit}</Text>
            </>
          )}
          {!!tile.sub && (
            <Text style={{ fontSize: 12, color: tile.warn ? pal.warn : pal.tileMuted, fontWeight: tile.warn ? '800' : '500', marginTop: 4 }} numberOfLines={tile.title ? 2 : 1}>
              {tile.sub}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Back to the full view.
export function CalmShowAll({ label, a11y, onPress }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y || label}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: s.md, marginTop: s.sm }}>
      <Ionicons name="grid-outline" size={15} color={c.text2} />
      <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text2 }}>{label}</Text>
    </TouchableOpacity>
  );
}
