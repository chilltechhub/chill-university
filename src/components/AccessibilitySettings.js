// src/components/AccessibilitySettings.js
// Text size, bold text, easy-read font, high contrast, reduce motion and
// the accent colour, as one card. Shown in Settings → Accessibility and in
// Make it yours, so both change the same things (src/logic/a11yPrefs.js).

import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ACCENTS } from '../theme';
import {
  useA11yPrefs, setA11yPrefs, resetA11yPrefs, TEXT_SIZES, FONT_CHOICES, DEFAULT_A11Y, READABLE_FONTS,
} from '../logic/a11yPrefs';

export default function AccessibilitySettings() {
  const { colors: c, typography: t, spacing: s, radius: r, accent, accentName, setAccent, isDark } = useTheme();
  const p = useA11yPrefs();
  const changed = Object.keys(DEFAULT_A11Y).some(k => p[k] !== DEFAULT_A11Y[k]);

  const card = { backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md, overflow: 'hidden' };
  const Row = ({ icon, title, value, right, last }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: c.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: accent.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={accent.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{title}</Text>
        {!!value && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{value}</Text>}
      </View>
      {right}
    </View>
  );
  const Toggle = ({ value, onChange, label }) => (
    <Switch value={value} onValueChange={onChange} accessibilityLabel={label}
      trackColor={{ false: c.borderStrong, true: accent.primary + '88' }} thumbColor={value ? accent.primary : c.text3} />
  );
  const Segments = ({ options, value, onChange, label, renderLabel }) => (
    <View style={{ flexDirection: 'row', backgroundColor: c.bg2, borderRadius: r.md, padding: 3, marginHorizontal: s.md, marginBottom: s.md }}
      accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o, i) => {
        const on = value === o.key;
        return (
          <TouchableOpacity key={String(o.key)} onPress={() => onChange(o.key)}
            accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={o.label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36, paddingVertical: 6, borderRadius: r.sm, backgroundColor: on ? c.bg1 : 'transparent' }}>
            {renderLabel ? renderLabel(o, on, i) : (
              <Text style={{ fontSize: t.xs, fontWeight: on ? '800' : '600', color: on ? c.text1 : c.text3 }}>{o.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const sizeLabel = TEXT_SIZES.find(z => z.key === p.textScale)?.label || 'Default';

  return (
    <View>
      <View style={card}>
        <Row icon="text-outline" title="Text size" value={`${sizeLabel}. Your phone's text size adds on top.`} />
        <Segments label="Text size" value={p.textScale} options={TEXT_SIZES}
          onChange={(v) => setA11yPrefs({ textScale: v })}
          renderLabel={(o, on, i) => (
            <Text style={{ fontSize: 11 + i * 2.5, fontWeight: on ? '800' : '600', color: on ? c.text1 : c.text3 }}>A</Text>
          )} />
        <View style={{ marginHorizontal: s.md, marginBottom: s.md, padding: s.md, borderRadius: r.md, backgroundColor: c.bg0, borderWidth: 0.5, borderColor: c.border }}>
          <Text style={{ fontSize: t.md, color: c.text1, fontWeight: '700' }}>Preview</Text>
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 4, lineHeight: 20 }}>
            This is how text looks across the app. Pick what's comfortable to read.
          </Text>
        </View>
        <Row icon="reader-outline" title="Font" value={p.font === 'readable' ? 'Easy read: letters that look alike are drawn apart.' : 'The standard font.'} />
        <Segments label="Font" value={p.font} options={FONT_CHOICES}
          onChange={(v) => setA11yPrefs({ font: v })}
          renderLabel={(o, on) => (
            <Text style={{ fontSize: t.xs, fontWeight: on ? '800' : '600', color: on ? c.text1 : c.text3, ...(o.key === 'readable' ? { fontFamily: on ? READABLE_FONTS.bold : READABLE_FONTS.regular } : null) }}>{o.label}</Text>
          )} />
        <Row icon="text" title="Bold text" value="Makes all text heavier."
          right={<Toggle value={p.boldText} onChange={(v) => setA11yPrefs({ boldText: v })} label="Bold text" />} last />
      </View>

      <View style={card}>
        <Row icon="contrast-outline" title="High contrast" value="Darker greys and clearer edges."
          right={<Toggle value={p.highContrast} onChange={(v) => setA11yPrefs({ highContrast: v })} label="High contrast" />} />
        <Row icon="color-palette-outline" title="Button colour" value={`${ACCENTS[accentName]?.label || 'Teal'}. Used for buttons and highlights.`} />
        <View style={{ flexDirection: 'row', gap: s.sm, paddingHorizontal: s.md, paddingBottom: s.md }} accessibilityRole="radiogroup" accessibilityLabel="Button colour">
          {Object.entries(ACCENTS).map(([key, a]) => {
            const on = key === accentName;
            const swatch = a[isDark ? 'dark' : 'light'].primary;
            return (
              <TouchableOpacity key={key} onPress={() => setAccent(key)}
                accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={a.label}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, borderRadius: r.md, borderWidth: on ? 2 : 1, borderColor: on ? swatch : c.border, backgroundColor: c.bg0 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: swatch }} />
                <Text style={{ fontSize: t.xs, fontWeight: on ? '800' : '600', color: c.text1 }}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Row icon="pause-circle-outline" title="Reduce motion" value="Stops scrolling text and bouncy pop-ups. Your pet still walks."
          right={<Toggle value={p.reduceMotion} onChange={(v) => setA11yPrefs({ reduceMotion: v })} label="Reduce motion" />} last />
      </View>

      {changed && (
        <TouchableOpacity onPress={resetA11yPrefs} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: s.sm, marginBottom: s.md }}>
          <Text style={{ fontSize: t.sm, fontWeight: '700', color: accent.primary }}>Reset accessibility to default</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
