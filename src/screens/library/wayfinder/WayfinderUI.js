// src/screens/library/wayfinder/WayfinderUI.js
//
// Small presentational pieces shared by every Wayfinder file, so the map,
// the steps, and the "go deeper" sections can't drift apart visually.

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { FONTS } from '../../../theme';

export function Pill({ text, color, bg }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: bg || c.bg2, maxWidth: '100%' }}>
      <Text style={{ fontSize: 12, color: color || c.text2, flexShrink: 1 }}>{text}</Text>
    </View>
  );
}

export function SectionTitle({ title, sub }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ marginTop: 10, marginBottom: 10 }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text1 }}>{title}</Text>
      {!!sub && <Text style={{ fontSize: 13, color: c.text3, marginTop: 3, lineHeight: 18 }}>{sub}</Text>}
    </View>
  );
}

export function Kicker({ children, color, style }) {
  const { colors: c } = useTheme();
  return (
    <Text style={[{ fontSize: 11, color: color || c.text3, fontFamily: FONTS.mono, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8 }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style, tone }) {
  const { colors: c, radius: r } = useTheme();
  return (
    <View style={[{ backgroundColor: tone === 'inset' ? c.bg0 : c.bg1, borderRadius: r.lg, padding: 16, borderWidth: 0.5, borderColor: c.border, marginBottom: 14 }, style]}>
      {children}
    </View>
  );
}

export function StepHeader({ kicker, title, body }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <Kicker color={c.teal} style={{ letterSpacing: 1.2, marginBottom: 6 }}>{kicker}</Kicker>
      <Text style={{ fontSize: 24, fontWeight: '700', color: c.text1, marginBottom: 8, lineHeight: 30 }}>{title}</Text>
      {!!body && <Text style={{ fontSize: 14, color: c.text2, lineHeight: 21 }}>{body}</Text>}
    </View>
  );
}

export function ChoiceRow({ label, sub, emoji, on, onPress, disabled, color, kind = 'checkbox' }) {
  const { colors: c, radius: r } = useTheme();
  const tone = color || c.teal;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole={kind}
      accessibilityState={{ checked: on, disabled }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
        borderRadius: r.md, borderWidth: 1,
        borderColor: on ? tone : c.border,
        backgroundColor: on ? tone + '16' : c.bg1,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {!!emoji && <Text style={{ fontSize: 20 }}>{emoji}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: on ? c.text1 : c.text2, fontWeight: on ? '600' : '500', lineHeight: 19 }}>{label}</Text>
        {!!sub && <Text style={{ fontSize: 12, color: c.text3, marginTop: 2, lineHeight: 16 }}>{sub}</Text>}
      </View>
      <View style={{
        width: 22, height: 22, borderRadius: kind === 'radio' ? 11 : 6, borderWidth: 1.5,
        borderColor: on ? tone : c.border, backgroundColor: on ? tone : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

export function Chip({ label, on, onPress, disabled, color }) {
  const { colors: c } = useTheme();
  const tone = color || c.teal;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on, disabled }}
      style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: on ? tone : c.border, backgroundColor: on ? tone + '1a' : c.bg1, opacity: disabled ? 0.45 : 1 }}
    >
      <Text style={{ fontSize: 13, color: on ? tone : c.text2, fontWeight: on ? '700' : '400' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// A help resource: name, what it does, and Call / Website buttons.
export function ResourceRow({ resource, last }) {
  const { colors: c, radius: r } = useTheme();
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: c.border }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: c.text1 }}>{resource.label}</Text>
      <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19, marginTop: 2 }}>{resource.detail}</Text>
      {(resource.phone || resource.url) && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {!!resource.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${resource.phone}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${resource.label}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: r.full, backgroundColor: c.teal }}
            >
              <Ionicons name="call" size={13} color="#fff" />
              <Text style={{ fontSize: 12.5, color: '#fff', fontWeight: '700' }}>Call</Text>
            </TouchableOpacity>
          )}
          {!!resource.url && (
            <TouchableOpacity
              onPress={() => Linking.openURL(resource.url)}
              accessibilityRole="link"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: r.full, borderWidth: 1, borderColor: c.teal }}
            >
              <Ionicons name="open-outline" size={13} color={c.teal} />
              <Text style={{ fontSize: 12.5, color: c.teal, fontWeight: '700' }}>Website</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// Back / Next pair used at the end of every step. In the content, not a
// sticky footer — see the note in WayfinderScreen about the app-wide + button.
export function StepNav({ onBack, onNext, nextLabel = 'Next', nextDisabled, above }) {
  const { colors: c, radius: r } = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      {above}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" style={{ flex: 1, paddingVertical: 14, borderRadius: r.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: c.text2, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          disabled={nextDisabled}
          accessibilityRole="button"
          style={{ flex: 2, paddingVertical: 14, borderRadius: r.md, backgroundColor: c.teal, alignItems: 'center', opacity: nextDisabled ? 0.4 : 1 }}
        >
          <Text style={{ fontSize: 15, color: '#fff', fontWeight: '700' }}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
