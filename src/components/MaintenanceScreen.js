// src/components/MaintenanceScreen.js
// Full-screen block shown when app_config.maintenance_mode.enabled = true.
// Flipping that one row in Supabase takes the whole app down (and back up)
// for every user instantly — no build, no App Store review. See App.js for
// where this is gated and remoteConfigService.js for the fetch.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function MaintenanceScreen({ message }) {
  const { colors: c } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: c.bg0 }]}>
      <Ionicons name="construct-outline" size={48} color={c.gold} />
      <Text style={[styles.title, { color: c.text1 }]}>Be right back</Text>
      <Text style={[styles.message, { color: c.text3 }]}>
        {message || 'Chill is getting a quick tune-up. Back in a few minutes.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 20, fontWeight: 'bold' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
