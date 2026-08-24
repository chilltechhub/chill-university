// src/screens/library/connections/SecurityScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';

const TIPS = [
  { icon: 'key-outline',             color: '#FFB800', title: 'Password Manager', body: 'Use Bitwarden (free) or 1Password to store and generate strong, unique passwords for every account.', link: 'https://bitwarden.com', linkLabel: 'Get Bitwarden (free)' },
  { icon: 'phone-portrait-outline',  color: '#00F0FF', title: '2-Factor Authentication', body: 'Enable 2FA on every account that offers it. Use an authenticator app (Google Authenticator, Authy) instead of SMS when possible.' },
  { icon: 'wifi-outline',            color: '#7C4DFF', title: 'Public WiFi Safety', body: 'Never do banking or login to important accounts on public WiFi without a VPN. Your traffic can be monitored.' },
  { icon: 'update-outline',          color: '#00E676', title: 'Keep Everything Updated', body: 'Software updates patch security vulnerabilities. Enable auto-updates on your phone, computer, and router.' },
  { icon: 'alert-circle-outline',    color: '#FF4081', title: 'Phishing Awareness', body: 'Never click suspicious links in emails or texts. Hover links to see where they go. Legit companies never ask for passwords via email.' },
  { icon: 'cloud-outline',           color: '#64b5f6', title: 'Backup Your Data', body: 'Keep encrypted backups of important files. Use 3-2-1 rule: 3 copies, 2 formats, 1 offsite.' },
];

export default function SecurityScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const color = '#00E676';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={20} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>🛡️ Digital Security</Text>
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>Keep your accounts and data safe</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        <View style={{ backgroundColor: color + '18', borderRadius: r.lg, padding: s.lg, borderWidth: 1, borderColor: color + '44', marginBottom: s.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
            <Ionicons name="shield-checkmark" size={20} color={color} />
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Security Essentials</Text>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>
            Most data breaches happen because of weak passwords, no 2FA, and phishing. These 6 habits eliminate 90% of your risk.
          </Text>
        </View>

        {TIPS.map((tip, i) => (
          <View key={i} style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: tip.color }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tip.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tip.icon} size={18} color={tip.color} />
              </View>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{tip.title}</Text>
            </View>
            <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{tip.body}</Text>
            {tip.link && (
              <TouchableOpacity onPress={() => Linking.openURL(tip.link)} style={{ marginTop: s.sm }}>
                <Text style={{ fontSize: t.xs, color: tip.color, fontWeight: '600' }}>{tip.linkLabel || 'Learn more →'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
