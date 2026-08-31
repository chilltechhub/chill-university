// src/components/AnnouncementBanner.js
// App-wide announcement banner ("🎉 New feature dropped") — content lives
// in the app_content table (type='announcement'), so posting/editing/
// retiring an announcement is a Supabase edit, not a build. Renders
// nothing when there's no active announcement.
//
// Dismissal is per-announcement: the id + updated_at are stamped into
// AsyncStorage when closed, so editing the row (which bumps updated_at)
// makes it reappear even for someone who already dismissed the old text.
// Rendered once, high in the tree (see App.js), above the tab navigator.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { fetchContentPool } from '../api/remoteConfigService';

const DISMISSED_KEY = '@cth_announcement_dismissed';

export default function AnnouncementBanner() {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [announcement, setAnnouncement] = useState(null);

  const load = useCallback(async () => {
    const rows = await fetchContentPool('announcement');
    if (!rows.length) { setAnnouncement(null); return; }
    const top = rows[0];
    const dismissedRaw = await AsyncStorage.getItem(DISMISSED_KEY);
    const dismissed = dismissedRaw ? JSON.parse(dismissedRaw) : {};
    if (dismissed[top.id] === top.updated_at) { setAnnouncement(null); return; }
    setAnnouncement(top);
  }, []);

  useEffect(() => { load(); }, [load]);
  // Re-check on focus too — catches "just dismissed elsewhere" and gives a
  // cheap way to see a freshly-published announcement without relaunching.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dismiss = async () => {
    if (!announcement) return;
    try {
      const raw = await AsyncStorage.getItem(DISMISSED_KEY);
      const dismissed = raw ? JSON.parse(raw) : {};
      dismissed[announcement.id] = announcement.updated_at;
      await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    } catch {}
    setAnnouncement(null);
  };

  if (!announcement) return null;

  const tone = announcement.meta?.tone || 'info';
  const toneColor = tone === 'warning' ? c.gold : tone === 'danger' ? '#e05858' : c.teal;

  return (
    <View style={[styles.banner, { borderLeftColor: toneColor }]}>
      <View style={styles.textWrap}>
        {!!announcement.title && <Text style={styles.title}>{announcement.title}</Text>}
        {!!announcement.body && <Text style={styles.body}>{announcement.body}</Text>}
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={c.text3} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: c.bg1,
    borderLeftWidth: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  textWrap: { flex: 1 },
  title: { color: c.text1, fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  body: { color: c.text3, fontSize: 12, lineHeight: 16 },
  closeBtn: { padding: 2, marginTop: 2 },
});
