// src/screens/library/connections/PrivacyScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';

const CHECKLIST = [
  { id: 'pw',    label: 'Use unique passwords for every account',  tip: 'Use a password manager like Bitwarden (free)' },
  { id: '2fa',   label: 'Enable 2FA on all important accounts',    tip: 'Start with email, then banking, then social' },
  { id: 'email', label: 'Check if your email has been breached',   tip: 'Visit haveibeenpwned.com', link: 'https://haveibeenpwned.com' },
  { id: 'perms', label: 'Review app permissions on your phone',    tip: 'Check location, mic, camera access' },
  { id: 'priv',  label: 'Set social media profiles to private',    tip: 'Review who can see your posts and info' },
  { id: 'vpn',   label: 'Use a VPN on public WiFi',               tip: 'Especially important at coffee shops, airports' },
  { id: 'data',  label: 'Review what data apps collect about you', tip: 'Check Privacy settings on iPhone or Android' },
];

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [checked, setChecked] = useState({});
  const color = '#64b5f6';

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={20} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>🔒 Privacy</Text>
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>Control your data and digital footprint</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        {/* Progress */}
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginBottom: s.lg, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: s.sm }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Privacy Score</Text>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color }}>
              {done}/{CHECKLIST.length} complete
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: c.bg2, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${(done / CHECKLIST.length) * 100}%` }} />
          </View>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }}>
            {done === CHECKLIST.length ? '🎉 Excellent privacy hygiene!' : done > 3 ? 'Good progress — keep going!' : 'Start with the top items first.'}
          </Text>
        </View>

        <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm }}>🛡️ Privacy Checklist</Text>
        {CHECKLIST.map(item => (
          <TouchableOpacity key={item.id} onPress={() => toggle(item.id)}
            style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: checked[item.id] ? color + '44' : c.border, flexDirection: 'row', gap: s.md, alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: checked[item.id] ? color : c.border, backgroundColor: checked[item.id] ? color : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              {checked[item.id] && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }, checked[item.id] && { textDecorationLine: 'line-through', color: c.text4 }]}>{item.label}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4, lineHeight: 18 }}>{item.tip}</Text>
              {item.link && (
                <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                  <Text style={{ fontSize: t.xs, color, marginTop: 4, fontWeight: '600' }}>Open link →</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
