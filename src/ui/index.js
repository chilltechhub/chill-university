// src/ui/index.js
// The visual kit for the front screens (docs/shake-up-plan-2026-10-21.md §9,
// P9), grown from the Calm view (CalmKit.js) and the shared building blocks
// (src/components/ui). The front screens (Today, Calm, Learn, My path, a
// unit, Make, You, the welcome, the sheets on them) use these; colours come
// from the theme or src/ui/tokens.js, never a raw value
// (scripts/check-style.mjs).
//
//   Panel        the Calm panel: dark, tinted by your accent
//   Card         one card rule: role 'yours' (tinted) · 'progress' (an edge)
//                · 'plain'. One primary button per card
//   Headline     a small label over one big line
//   Chip / PathChip / StatusChip / DueChip
//                status always in words; aim-for dates never red
//   Segmented    a few choices in one row, each with an optional count
//   StepBar      progress as steps, "2 of 5", never a percent
//   PrimaryAction  the one filled button, with a light tap
//   Sheet        a sheet from the bottom, with a scrim
//   EmptyState   says what to do, never "nothing here"
//   Skeleton / BusyDot  loading without a spinner
//   CircleFill   the four circles, one filling a little (the hand-in moment)

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Card as BaseCard, Button, EmptyState } from '../components/ui';
import { tapHaptic } from '../logic/haptics';
import { SCRIM, pathLook, statusLook, circleLook, useCalmPalette } from './tokens';

export { Button, EmptyState, useCalmPalette };
export { pathLook, circleLook, statusLook, SCRIM, ON_ART, CATEGORY_COLOR } from './tokens';

export const calmEyebrow = { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' };

// ── Panel ──────────────────────────────────────────────────────────────────
// `id` names the SVG gradient: on web those ids are page-wide, and two
// panels can be mounted at once.
export function Panel({ id, pal, children, style }) {
  const { spacing: s } = useTheme();
  // On iOS a "100%" Svg keeps the size it first drew at, so size the
  // gradient from the panel's layout, with the bottom colour behind it.
  const [size, setSize] = useState(null);
  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(p => (p && p.width === width && p.height === height ? p : { width, height }));
  };
  return (
    <View onLayout={onLayout} style={[{ borderRadius: 28, overflow: 'hidden', backgroundColor: pal.bottom, padding: s.lg, paddingTop: s.lg + 2 }, style]}>
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

// ── Card ───────────────────────────────────────────────────────────────────
// role: 'yours' (your Dream, your work: tinted) · 'progress' (the next step,
// the unit you're on, a Build halfway: an edge, `edge` to colour it) ·
// 'plain' (everything else).
export function Card({ role = 'plain', edge, children, ...rest }) {
  const { accent } = useTheme();
  return (
    <BaseCard tone={role === 'yours' ? 'accent' : 'default'} accentEdge={role === 'progress' ? (edge || accent.primary) : undefined} {...rest}>
      {children}
    </BaseCard>
  );
}

// ── Headline ───────────────────────────────────────────────────────────────
// On the Calm panel pass `pal`; on a page it reads the theme.
export function Headline({ eyebrow, title, sub, onPress, a11y, pal, size = 'lg', style }) {
  const { colors: c, typography: t, style: ui } = useTheme();
  const big = size === 'xl' || !!pal;
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={0.8} accessibilityRole={onPress ? 'button' : 'header'}
      accessibilityLabel={a11y || [eyebrow, title, sub].filter(Boolean).join('. ')} style={style}>
      {!!eyebrow && <Text style={{ ...calmEyebrow, fontSize: pal ? 12 : 11, color: pal ? pal.eyebrow : c.text3, marginBottom: pal ? 6 : 2 }}>{eyebrow}</Text>}
      <Text numberOfLines={3} style={{ fontSize: big ? 32 : t.xxl, lineHeight: big ? 37 : undefined, fontWeight: '800', letterSpacing: big ? -0.6 : 0, color: pal ? pal.text : c.text1, fontFamily: ui.titleFont }}>
        {title}
      </Text>
      {!!sub && <Text numberOfLines={3} style={{ fontSize: pal ? 15 : t.md, lineHeight: pal ? 21 : undefined, color: pal ? pal.text2 : c.text2, marginTop: pal ? 6 : 4 }}>{sub}</Text>}
    </TouchableOpacity>
  );
}

// ── Chips ──────────────────────────────────────────────────────────────────
export function Chip({ label, icon, selected = false, onPress, color, a11y, style }) {
  const { colors: c, typography: t, accent } = useTheme();
  const tint = color || accent.primary;
  const body = (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
      borderWidth: 1, borderColor: selected ? tint : c.border, backgroundColor: selected ? tint + '18' : 'transparent' }, style]}>
      {!!icon && <Ionicons name={icon} size={13} color={selected ? tint : c.text2} />}
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: selected ? tint : c.text2 }}>{label}</Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={a11y || label} hitSlop={4}>
      {body}
    </TouchableOpacity>
  );
}

/** A path's own colour and icon, with its name. */
export function PathChip({ pathKey, label, style }) {
  const { colors: c, typography: t } = useTheme();
  const look = pathLook(c, pathKey);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: look.soft }, style]}>
      <Ionicons name={look.icon} size={12} color={look.color} />
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color: look.color }}>{label}</Text>
    </View>
  );
}

export const STATUS_WORDS = { todo: 'To do', doing: 'Doing', handed: 'Handed in', shown: 'Shown', reviewed: 'Reviewed' };

/** Status, always in words. `label` overrides the word (deliverables.js statusLabel). */
export function StatusChip({ status = 'todo', label, style }) {
  const { colors: c, accent } = useTheme();
  const look = statusLook(c, accent, label === 'Reviewed' ? 'reviewed' : status);
  return (
    <View style={[{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: look.bg, alignSelf: 'flex-start' }, style]}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: look.fg }}>{label || STATUS_WORDS[status] || STATUS_WORDS.todo}</Text>
    </View>
  );
}

/** An aim-for date: neutral, never red, even when it has passed ("Still open"). */
export function DueChip({ label, style }) {
  const { colors: c, typography: t } = useTheme();
  if (!label) return null;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: c.border, alignSelf: 'flex-start' }, style]}>
      <Ionicons name="calendar-clear-outline" size={11} color={c.text3} />
      <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text2 }}>{label}</Text>
    </View>
  );
}

// ── Segmented ──────────────────────────────────────────────────────────────
// options: [{ key, label, count? }]. With counts, each segment shows its
// number over its word (the Make board).
export function Segmented({ options, value, onChange, style }) {
  const { colors: c, typography: t, radius: r, accent } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: 6 }, style]} accessibilityRole="tablist">
      {options.map(o => {
        const on = o.key === value;
        return (
          <TouchableOpacity key={o.key} onPress={() => { tapHaptic?.(); onChange(o.key); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
            accessibilityLabel={o.count != null ? `${o.label}: ${o.count}` : o.label}
            style={{ flex: 1, alignItems: 'center', paddingVertical: o.count != null ? 8 : 7, borderRadius: r.md, borderWidth: 1,
              borderColor: on ? accent.primary : c.border, backgroundColor: on ? accent.primaryLight : c.bg1 }}>
            {o.count != null && <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: on ? accent.primary : c.text1 }}>{o.count}</Text>}
            <Text style={{ fontSize: 11, fontWeight: t.bold, color: on ? accent.primary : c.text3 }} numberOfLines={1}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── StepBar ────────────────────────────────────────────────────────────────
// Progress as steps: one segment a step (a long list becomes one bar), and
// "2 of 5" beside it. Never a percent.
export function StepBar({ done = 0, total = 0, color, showCount = true, style }) {
  const { colors: c, typography: t, accent } = useTheme();
  if (!total) return null;
  const fill = color || accent.primary;
  const n = Math.max(0, Math.min(done, total));
  const segs = total <= 10;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]} accessible accessibilityLabel={`${n} of ${total} steps done`}>
      <View style={{ flex: 1, flexDirection: 'row', gap: segs ? 3 : 0, height: 6 }}>
        {segs
          ? Array.from({ length: total }, (_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < n ? fill : c.bg2 }} />)
          : (
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.bg2, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${(n / total) * 100}%`, backgroundColor: fill }} />
            </View>
          )}
      </View>
      {showCount && <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3 }}>{n} of {total}</Text>}
    </View>
  );
}

// ── PrimaryAction ──────────────────────────────────────────────────────────
// The one filled button on a card. A light tap on press.
export function PrimaryAction({ onPress, ...rest }) {
  return <Button {...rest} variant="primary" onPress={(e) => { tapHaptic?.(); onPress?.(e); }} />;
}

// ── Sheet ──────────────────────────────────────────────────────────────────
export function Sheet({ visible, onClose, eyebrow, title, children, footer, maxHeight = '85%' }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: SCRIM.soft }} activeOpacity={1} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight }}>
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: s.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: accent.primary }}>{eyebrow}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>
          {!!title && <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginTop: 2, marginBottom: s.sm }} accessibilityRole="header">{title}</Text>}
          {children}
          {footer}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Loading without a spinner ──────────────────────────────────────────────
function usePulse() {
  const v = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.9, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

/** Grey lines where content is coming: the shape of the page, not a spinner. */
export function Skeleton({ lines = 3, height = 12, card = false, style }) {
  const { colors: c, spacing: s, radius: r } = useTheme();
  const opacity = usePulse();
  const body = (
    <Animated.View style={{ opacity, gap: 8 }} accessible accessibilityLabel="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={{ height: i === 0 ? height + 6 : height, width: i === lines - 1 && lines > 1 ? '60%' : '100%', borderRadius: 6, backgroundColor: c.bg2 }} />
      ))}
    </Animated.View>
  );
  if (!card) return <View style={style}>{body}</View>;
  return <View style={[{ padding: s.lg, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }, style]}>{body}</View>;
}

/** A small pulsing dot inside a control that's working (saving a tick). */
export function BusyDot({ color, size = 10, style }) {
  const { accent } = useTheme();
  const opacity = usePulse();
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color || accent.primary, opacity }, style]} accessible accessibilityLabel="Working" />;
}

// ── CircleFill: the hand-in moment's four circles ──────────────────────────
// The four circles side by side; `fill` (one key) grows a little from
// `from` to `to` (0..1) when it mounts.
const CIRCLES = [['love', 'Love'], ['goodAt', 'Good at'], ['needs', 'Needs'], ['paid', 'Paid']];
export function CircleFill({ fill = 'goodAt', from = 0, to = 0.25, size = 44, style }) {
  const { colors: c, typography: t } = useTheme();
  const v = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: to, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, to]);
  return (
    <View style={[{ flexDirection: 'row', gap: 10, justifyContent: 'center' }, style]} accessible accessibilityLabel="Your four circles. Good at grew a little.">
      {CIRCLES.map(([key, label]) => {
        const look = circleLook(c, key);
        const growing = key === fill;
        return (
          <View key={key} style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: look.color, backgroundColor: look.soft, overflow: 'hidden', justifyContent: 'flex-end' }}>
              {growing && (
                <Animated.View style={{ height: v.interpolate({ inputRange: [0, 1], outputRange: [0, size] }), backgroundColor: look.color }} />
              )}
            </View>
            <Text style={{ fontSize: 11, fontWeight: t.bold, color: growing ? look.color : c.text3 }}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Press feedback for anything tappable that isn't a Button ───────────────
export function Tap({ onPress, children, style, a11y, role = 'button', disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole={role} accessibilityLabel={a11y}
      style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}>
      {children}
    </Pressable>
  );
}
