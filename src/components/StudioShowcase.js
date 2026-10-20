// src/components/StudioShowcase.js
// "Made in the Studio" on the Portfolio: everything they've built, with
// their own receipt on each, so the place for finished work shows the
// things they actually made (docs/studio-plan.md). A mastered Build wears
// its trophy. Tap one to open it.
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import PixelArt from './PixelArt';
import useStudio from '../logic/useStudio';
import { ART } from '../data/sceneArt';
import { buildTitle, receipt, isMastered, kindOf } from '../logic/builds';

export default function StudioShowcase({ style }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { builds } = useStudio();

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.sm }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Made in the Studio</Text>
        <TouchableOpacity onPress={() => navigation.navigate('StudioScreen')} accessibilityRole="button" accessibilityLabel="Open the Studio" hitSlop={8}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: accent.primary }}>{builds.length ? 'Studio →' : 'Make one →'}</Text>
        </TouchableOpacity>
      </View>
      {builds.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s.sm }}>
          {builds.map(b => {
            const kind = kindOf(b);
            const rc = receipt(b);
            const done = isMastered(b);
            const trophy = done && kind?.trophy ? ART[kind.trophy.art] : null;
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => navigation.navigate('BuildScreen', { buildId: b.id })}
                accessibilityRole="button"
                accessibilityLabel={`${buildTitle(b)}, ${kind?.medium}. You changed ${rc.changed} of ${rc.total} parts${done ? ', mastered' : ''}`}
                style={{ width: 150, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: done ? 1.5 : 0.5, borderColor: done ? accent.primary : c.border }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 30 }}>
                  <Ionicons name={kind?.icon || 'cube-outline'} size={20} color={accent.primary} />
                  {!!trophy && <PixelArt art={trophy} scale={Math.min(26 / trophy.w, 26 / trophy.h)} />}
                </View>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginTop: s.sm }} numberOfLines={1}>{buildTitle(b)}</Text>
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{kind?.medium}</Text>
                <Text style={{ fontSize: t.xs, color: c.text2, marginTop: s.sm }}>
                  {done ? 'Every part understood' : `You changed ${rc.changed} of ${rc.total}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={{ fontSize: t.sm, color: c.text3 }}>
          Nothing made yet. A page, a game, a beat or a business takes about a minute.
        </Text>
      )}
    </View>
  );
}
