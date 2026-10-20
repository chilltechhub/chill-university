// src/components/StudioCard.js
// The Studio on Home, under the Dream: the app's front door is making
// something (docs/studio-plan.md). With nothing made yet, your pet asks you
// to make one thing. After that, it picks up where you left off: the Build
// you touched last and its next part, plus what your Builds say about you.
//
// Not a widget, like the Dream and Today's Find: it's the point of the
// app, not a card to rearrange away.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Card, Eyebrow, Button } from './ui';
import { CalmPill, calmEyebrow } from './CalmKit';
import RichText from './RichText';
import PetCompanion from './PetCompanion';
import useStudio from '../logic/useStudio';
import { buildTitle, nextPart, receiptLine, isMastered, kindOf } from '../logic/builds';
import { sparkLine, companionLine } from '../logic/studio';
import { todayStr } from '../logic/dateUtils';

// Home and Calm Home are tabs; the Studio lives in the Library stack.
function openIn(navigation, screen, params) {
  navigation.navigate('Library');
  setTimeout(() => navigation.navigate('Library', { screen, params }), 0);
}

export default function StudioCard({ variant = 'card', pal }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s } = useTheme();
  const studio = useStudio();
  const { builds, pet, petName } = studio;
  if (!studio.ready) return null;

  const last = builds[0] || null;
  const next = last ? nextPart(last) : null;
  const speaker = pet ? petName : null;
  const line = !last
    ? companionLine('empty', todayStr())
    : isMastered(last) ? sparkLine(builds)
    : receiptLine(last);
  const action = !last
    ? { label: 'Make something', icon: 'color-wand-outline', go: () => openIn(navigation, 'StudioScreen') }
    : next
      ? { label: `Next: ${next.label}`, icon: 'construct-outline', go: () => openIn(navigation, 'BuildScreen', { buildId: last.id }) }
      : { label: 'Make another', icon: 'add', go: () => openIn(navigation, 'StudioScreen') };
  const title = last ? buildTitle(last) : 'Make one thing today';

  if (variant === 'calm' && pal) {
    return (
      <View style={{ marginTop: s.lg, backgroundColor: pal.glass, borderWidth: 1, borderColor: pal.glassEdge, borderRadius: 22, padding: s.lg }}>
        <Text style={{ ...calmEyebrow, color: pal.eyebrow }}>Studio</Text>
        <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '700', color: pal.text, marginTop: 8 }}>{title}</Text>
        <RichText style={{ fontSize: 13, color: pal.text2, marginTop: 4 }} boldStyle={{ color: pal.text }}>{line}</RichText>
        <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
          <CalmPill label={action.label} icon={action.icon} onPress={action.go} pal={pal} solid />
          {!!last && <CalmPill label="All builds" onPress={() => openIn(navigation, 'StudioScreen')} pal={pal} />}
        </View>
      </View>
    );
  }

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>Studio</Eyebrow>
        {!!last && (
          <TouchableOpacity onPress={() => openIn(navigation, 'StudioScreen')} accessibilityRole="button" accessibilityLabel="Open the Studio" hitSlop={8}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text2 }}>All builds →</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginTop: s.sm }}>
        {pet ? <PetCompanion pet={pet} size={48} /> : (
          <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={last ? kindOf(last)?.icon || 'color-wand-outline' : 'color-wand-outline'} size={28} color={c.text3} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{title}</Text>
          {!!speaker && <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3, marginTop: 4 }}>{speaker}</Text>}
          <RichText style={{ fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{line}</RichText>
        </View>
      </View>
      <Button label={action.label} icon={action.icon} size="sm" onPress={action.go} style={{ marginTop: s.md }} />
    </Card>
  );
}
