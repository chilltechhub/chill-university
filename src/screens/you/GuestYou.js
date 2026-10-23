// src/screens/you/GuestYou.js
// You, for someone without an account yet (docs/shake-up-plan-2026-10-21.md
// P2): their Dream, their first project, and Save my progress. It replaces
// the sign-in wall the Profile route showed a guest. Everything here is on
// the phone; an account keeps it (src/api/claimLocal.js). The full You
// (ikigai, receipts, the room) arrives in P4/P6.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../components/ui';
import RichText from '../../components/RichText';
import DreamCard from '../../components/DreamCard';
import LoginScreen from '../LoginScreen';
import { loadBuilds, onBuildsChange } from '../../api/buildService';
import { buildTitle, kindOf } from '../../logic/builds';
import { goToScreen } from '../../logic/appRoutes';

// `you`: inside You (YouScreen.js), its header and what goes above and below.
export default function GuestYou({ you = null } = {}) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const [page, setPage] = useState(null); // their first project, any kind
  const [signUp, setSignUp] = useState(false);

  useEffect(() => {
    let alive = true;
    const pick = (list) => { if (alive) setPage(list[0] || null); };
    loadBuilds(null).then(pick);
    const off = onBuildsChange((uid, list) => { if (!uid) pick(list); });
    return () => { alive = false; off(); };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {you?.header}
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingTop: you ? s.sm : s.lg, paddingBottom: 120, gap: s.lg }}>
        {you ? you.top : <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>You</Text>}

        <DreamCard userId={null} />
        {/* In You: receipts and your room (shake-up P5). */}
        {you?.receiptsFirst && you.receipts}
        {you?.room}
        {!you?.receiptsFirst && you?.receipts}

        <View style={{ padding: s.lg, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
            <Ionicons name={page ? kindOf(page)?.icon || 'construct-outline' : 'globe-outline'} size={18} color={accent.primary} />
            <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{page ? buildTitle(page) : 'A page about you'}</Text>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4 }}>
            {page ? 'Your project. A real file, yours to keep.' : 'A real web page about you, in about a minute.'}
          </Text>
          <Button
            label={page ? 'Open my project' : 'Make my page'} variant="secondary" size="sm"
            icon={page ? 'open-outline' : 'sparkles-outline'} style={{ marginTop: s.md }}
            onPress={() => (page
              ? goToScreen(navigation, 'BuildScreen', { buildId: page.id })
              : goToScreen(navigation, 'StudioScreen', { start: 'page', at: Date.now() }))}
          />
        </View>

        <View style={{ padding: s.lg, borderRadius: r.lg, backgroundColor: accent.primary + '14', borderWidth: 1, borderColor: accent.primary }}>
          <RichText style={{ fontSize: t.md, color: c.text1 }} boldStyle={{ color: accent.primary }}>
            **Save my progress**: your project, your plans and your Dream, kept on any device. Free.
          </RichText>
          <Button label="Save my progress" icon="person-add-outline" onPress={() => setSignUp(true)} style={{ marginTop: s.md }} />
          <TouchableOpacity onPress={() => setSignUp(true)} accessibilityRole="button" style={{ alignItems: 'center', marginTop: s.sm }}>
            <Text style={{ fontSize: t.sm, color: c.text3 }}>I already have an account</Text>
          </TouchableOpacity>
        </View>
        {you?.bottom}
      </ScrollView>

      <Modal visible={signUp} animationType="slide" onRequestClose={() => setSignUp(false)}>
        <LoginScreen onSuccess={() => setSignUp(false)} onClose={() => setSignUp(false)} />
      </Modal>
    </View>
  );
}
