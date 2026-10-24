// src/screens/SharedScreen.js
// A share link's page (docs/shake-up-plan-2026-10-21.md §4.5, P8):
// /s/<token> on the web build, for anyone with the link, signed in or not.
// Read-only: the page as it was when it was shared, in a sandboxed frame
// (scripts run, but in their own origin: nothing here is reachable from it).
// A revoked or unknown link says so, the same way for both.
//
// App.js opens this route straight from the address, before the welcome or
// sign-in, and shows no top bar or + button over it.

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import BuildPreview from '../components/BuildPreview';
import { fetchSharedPage, tokenFromPath } from '../api/shareLinkService';

export default function SharedScreen() {
  const route = useRoute();
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { height } = useWindowDimensions();
  const token = route.params?.token
    || (Platform.OS === 'web' && typeof window !== 'undefined' ? tokenFromPath(window.location.pathname) : null);
  const [page, setPage] = useState(undefined); // undefined loading · null gone · { title, html }

  useEffect(() => {
    let alive = true;
    if (!token) { setPage(null); return undefined; }
    fetchSharedPage(token).then(p => { if (alive) setPage(p || null); });
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && page?.title) document.title = page.title;
  }, [page?.title]);

  if (page === undefined) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0 }}><ActivityIndicator color={c.teal} /></View>;
  }
  if (!page) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xl, backgroundColor: c.bg0 }}>
        <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, textAlign: 'center' }} accessibilityRole="header">This link isn't working</Text>
        <Text style={{ fontSize: t.md, color: c.text2, textAlign: 'center', marginTop: s.sm }}>It may have been turned off. Ask the person who sent it for a new one.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#f6f3ec' }}>
      <BuildPreview html={page.html} height={height} style={{ borderRadius: 0, borderWidth: 0 }} />
    </View>
  );
}
