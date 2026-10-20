// src/screens/studio/StudioScreen.js
// The Studio: make something real with the app, then take it apart until
// it's yours (docs/studio-plan.md). Pick a kind (a page, a game, a beat, a
// small business), answer a question or two, and the app makes it. Your
// Builds list below, each with its honest receipt.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { Card, SectionLabel, ListRow, ScreenTitle } from '../../components/ui';
import BuildAskSheet from '../../components/BuildAskSheet';
import { supabase } from '../../api/supabaseClient';
import { loadBuilds, saveBuild, cachedBuilds, onBuildsChange } from '../../api/buildService';
import useDream from '../../logic/useDream';
import { BUILD_KINDS } from '../../data/builds';
import { newBuild, buildTitle, receiptLine, kindOf } from '../../logic/builds';

const plain = (md) => md.replace(/\*\*/g, '');

export default function StudioScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const [userId, setUserId] = useState(null);
  const [builds, setBuilds] = useState(() => cachedBuilds(null) || []);
  const [asking, setAsking] = useState(null); // kind id
  const { dream } = useDream(userId);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession()
      .then(({ data }) => { if (alive) setUserId(data?.session?.user?.id || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    let alive = true;
    loadBuilds(userId).then(list => { if (alive) setBuilds(list); });
    const off = onBuildsChange((uid, list) => { if (alive && (uid || null) === (userId || null)) setBuilds(list); });
    return () => { alive = false; off(); };
  }, [userId]));

  const make = async (answers) => {
    const saved = await saveBuild(userId, newBuild(asking, answers));
    setAsking(null);
    if (saved) navigation.navigate('BuildScreen', { buildId: saved.id, fresh: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 120 }}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
          accessibilityRole="button" accessibilityLabel="Back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: s.md, alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={22} color={accent.primary} />
          <Text style={{ fontSize: t.md, color: accent.primary, fontWeight: t.semibold }}>Library</Text>
        </TouchableOpacity>

        <ScreenTitle title="Studio" subtitle="Make something real. Then see how every part works." />

        <SectionLabel label="Make one" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
          {BUILD_KINDS.map(kind => (
            <Card
              key={kind.id}
              onPress={() => setAsking(kind.id)}
              accessibilityLabel={`Make ${kind.label}`}
              style={{ flexBasis: '47%', flexGrow: 1 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: r.md, backgroundColor: accent.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: s.sm }}>
                <Ionicons name={kind.icon} size={22} color={accent.primary} />
              </View>
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{kind.label}</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>{kind.blurb}</Text>
            </Card>
          ))}
        </View>

        <SectionLabel label="Your builds" />
        {builds.length ? builds.map(b => (
          <ListRow
            key={b.id}
            icon={kindOf(b)?.icon}
            iconColor={accent.primary}
            title={buildTitle(b)}
            subtitle={plain(receiptLine(b))}
            alwaysShowSubtitle
            chevron
            onPress={() => navigation.navigate('BuildScreen', { buildId: b.id })}
          />
        )) : (
          <Text style={{ fontSize: t.sm, color: c.text3 }}>
            Nothing yet. Pick one above. It takes about a minute, and you can keep it.
          </Text>
        )}
      </ScrollView>

      <BuildAskSheet
        visible={!!asking}
        kindId={asking}
        dream={dream}
        onClose={() => setAsking(null)}
        onDone={make}
      />
    </View>
  );
}
