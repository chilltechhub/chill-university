// src/components/CalmKit.js
// What Home's and the Library's Calm views share (CalmHome.js,
// CalmLibrary.js): the dark accent-tinted panel, its headline, its pill
// buttons, its two cards, and the link back to the full view under it.

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { ACCENTS } from '../theme';

const INK = '#0b0f14';
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// w of b mixed into a.
const mix = (a, b, w) => {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((x, i) => Math.round(x * (1 - w) + B[i] * w).toString(16).padStart(2, '0')).join('');
};

export const plural = (n, one, many) => (n === 1 ? one : many);
export const ago = (iso) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 14 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
};
export const calmEyebrow = { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' };

// The panel is always dark, tinted by your accent, in light mode too.
export function useCalmPalette() {
  const { accentName } = useTheme();
  const tint = (ACCENTS[accentName] || ACCENTS.teal).dark.primary;
  return useMemo(() => ({
    top: mix(tint, INK, 0.88),
    bottom: mix(tint, INK, 0.7),
    text: '#f1f5f4',
    text2: 'rgba(241,245,244,0.72)',
    eyebrow: mix(tint, '#ffffff', 0.35),
    glass: 'rgba(255,255,255,0.07)',
    glassEdge: 'rgba(255,255,255,0.14)',
    fill: tint,
    track: 'rgba(255,255,255,0.14)',
    tile: mix(tint, '#ffffff', 0.93),
    tileInk: mix(tint, INK, 0.82),
    tileMuted: mix(tint, INK, 0.62),
    warn: '#b3261e',
  }), [tint]);
}

// `id` names the SVG gradient: on web those ids are page-wide, and Home and
// the Library are both mounted at once.
export function CalmPanel({ id, pal, children }) {
  const { spacing: s } = useTheme();
  // On iOS a "100%" Svg keeps the size it first drew at, so the gradient
  // stopped short once the cards loaded and the panel grew. Size it from
  // the panel's layout, with the bottom color behind it meanwhile.
  const [size, setSize] = useState(null);
  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(p => (p && p.width === width && p.height === height ? p : { width, height }));
  };
  return (
    <View onLayout={onLayout} style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: pal.bottom, padding: s.lg, paddingTop: s.lg + 2 }}>
      {size && (
        <Svg style={{ position: 'absolute', top: 0, left: 0 }} width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
              <Stop offset="0" stopColor={pal.top} />
              <Stop offset="1" stopColor={pal.bottom} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      )}
      {children}
    </View>
  );
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
      <Text style={{ fontSize: 13, fontWeight: '800', color: solid ? '#0d1119' : pal.text }}>{label}</Text>
      <Ionicons name={icon} size={14} color={solid ? '#0d1119' : pal.text} />
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
