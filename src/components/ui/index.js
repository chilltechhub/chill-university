// src/components/ui/index.js
// Shared building blocks that follow the appearance settings (Plain /
// Command style, accent, light/dark) by themselves — no c/t/s props to pass.
//
//   import { Card, SectionLabel, Button, ListRow, EmptyState, ScreenTitle, Eyebrow } from '../components/ui';
//
// Screens moved onto these are listed in scripts/check-style.mjs, which
// fails `npm run check` if a hard-coded HUD font, uppercase label or raw hex
// colour creeps back in. See docs/finishing-touches-plan.md (Phase 2).
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';

// "Appearance", "App experience" — the label above a group of cards.
// `action` puts a small link on the right ("Library →").
export function SectionLabel({ label, children, action, style }) {
  const { colors: c, typography: t, spacing: s, style: st } = useTheme();
  const plain = st.name === 'plain';
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s.lg, marginBottom: s.sm, paddingHorizontal: 2 }, style]}>
      <Text style={{ fontSize: plain ? t.sm : t.xs, color: plain ? c.text3 : c.text4, ...st.sectionLabel }}>
        {label ?? children}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button">
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: action.color || c.text2 }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// The small line above a card's title ("Your first goal").
export function Eyebrow({ children, color, style }) {
  const { colors: c, typography: t, style: st } = useTheme();
  return (
    <Text style={[{ fontSize: st.name === 'plain' ? t.sm : t.xs, color: color || c.text3, marginBottom: 4, ...st.eyebrow }, style]}>
      {children}
    </Text>
  );
}

// Surface for a block of content. tone: 'default' (bg1) | 'inset' (bg0) |
// 'accent' (tinted with the accent). `accentEdge` draws a coloured left edge
// for the one card that is the screen's next step.
export function Card({ children, style, tone = 'default', onPress, padded = true, accentEdge, accessibilityLabel }) {
  const { colors: c, spacing: s, shadows, style: st, accent } = useTheme();
  const bg = tone === 'inset' ? c.bg0 : tone === 'accent' ? accent.primaryLight : c.bg1;
  const edge = accentEdge === true ? accent.primary : accentEdge;
  const box = [
    {
      backgroundColor: bg,
      borderRadius: st.cardRadius,
      borderWidth: st.borderWidth,
      borderColor: tone === 'accent' ? accent.primary + '55' : c.border,
      padding: padded ? s.lg : 0,
      marginBottom: s.md,
    },
    edge && { borderLeftWidth: 3, borderLeftColor: edge },
    st.cardShadow && tone === 'default' && shadows[st.cardShadow],
    style,
  ];
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={box} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={box}>{children}</View>;
}

// variant: 'primary' (filled accent — one per screen) | 'secondary'
// (outlined) | 'ghost' (text only). size: 'md' (48pt) | 'sm' (36pt).
// `color` overrides the accent for the rare button that means something
// else (a destructive action, a subject colour).
export function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled, busy, color, style, fullWidth = true, accessibilityLabel }) {
  const { colors: c, typography: t, style: st, accent } = useTheme();
  const tint = color || accent.primary;
  const filled = variant === 'primary';
  const fg = disabled ? c.text4 : filled ? (color ? '#ffffff' : accent.onPrimary) : variant === 'ghost' ? c.text2 : tint; // style-ok: white label on a custom colour
  const height = size === 'sm' ? 36 : 48;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      style={[
        {
          height,
          borderRadius: st.buttonRadius,
          paddingHorizontal: size === 'sm' ? 14 : 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: filled ? (disabled ? c.bg2 : tint) : 'transparent',
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor: disabled ? c.border : tint,
        },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={fg} />}
          <Text style={{ fontSize: size === 'sm' ? t.sm : t.md, color: fg, ...st.buttonLabel }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Icon + title + optional subtitle + right slot (a Switch, a value) or a
// chevron when it navigates. Stands alone as its own card-row.
export function ListRow({ icon, iconColor, title, subtitle, alwaysShowSubtitle = false, right, onPress, chevron, style }) {
  const { colors: c, typography: t, spacing: s, style: st, accent } = useTheme();
  const { showSubtext } = useUIPrefs();
  const tint = iconColor || accent.primary;
  const body = (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: st.cardRadius, padding: s.lg, marginBottom: s.sm, borderWidth: st.borderWidth, borderColor: c.border }, style]}>
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{title}</Text>
        {!!subtitle && (alwaysShowSubtitle || showSubtext) && (
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      {right}
      {(chevron ?? (!!onPress && !right)) && <Ionicons name="chevron-forward" size={16} color={c.text4} />}
    </View>
  );
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button">{body}</TouchableOpacity>
    : body;
}

// An empty list is a chance to say what the thing is for and offer the one
// next step — never just "Nothing here".
export function EmptyState({ icon, title, body, action, secondary, compact, style }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  return (
    <View style={[{ alignItems: compact ? 'flex-start' : 'center', paddingVertical: compact ? s.sm : s.xxl, paddingHorizontal: compact ? 0 : s.lg, gap: s.sm }, style]}>
      {icon && !compact && (
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: accent.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: s.xs }}>
          <Ionicons name={icon} size={24} color={accent.primary} />
        </View>
      )}
      {!!title && <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, textAlign: compact ? 'left' : 'center' }}>{title}</Text>}
      {!!body && <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, textAlign: compact ? 'left' : 'center', maxWidth: 320 }}>{body}</Text>}
      {action && <Button {...action} size={compact ? 'sm' : 'md'} fullWidth={false} style={{ marginTop: s.sm }} />}
      {secondary && <Button {...secondary} variant="ghost" size="sm" fullWidth={false} />}
    </View>
  );
}

// Screen heading: optional emoji (respects Show Emojis) and subtitle
// (respects Show Subtitles). `right` for a header action.
export function ScreenTitle({ title, subtitle, emoji, right, style }) {
  const { colors: c, typography: t, spacing: s, style: st } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: s.lg }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, fontFamily: st.titleFont, letterSpacing: st.titleTracking }}>
          {emoji && showEmojis ? `${emoji} ` : ''}{title}
        </Text>
        {!!subtitle && showSubtext && <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4 }}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

// A stat / readout number ("LV 3", "4 / 7") in the style's number font.
export function Readout({ children, size, color, weight, style }) {
  const { colors: c, typography: t, style: st } = useTheme();
  return (
    <Text style={[{ fontSize: size || t.md, fontWeight: weight || t.bold, color: color || c.text1, fontFamily: st.numberFont, fontVariant: ['tabular-nums'] }, style]}>
      {children}
    </Text>
  );
}
