// src/screens/studio/StudioScreen.js
// The Studio: make something real with the app, then take it apart until
// it's yours (docs/studio-plan.md).
//
// Top to bottom: your room with your character and pet (your pet talks you
// through it), what your Builds say about you so far (sparks), the four
// things you can make, the trophies a mastered Build earns for your room,
// and everything you've made.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { Card, SectionLabel, ListRow, ScreenTitle } from '../../components/ui';
import RichText from '../../components/RichText';
import PixelArt from '../../components/PixelArt';
import StudioStage from '../../components/StudioStage';
import TourSpot from '../../components/TourSpot';
import { useAccess } from '../../../context/AccessContext';
import BuildAskSheet from '../../components/BuildAskSheet';
import { saveBuild } from '../../api/buildService';
import useStudio from '../../logic/useStudio';
import { BUILD_KINDS } from '../../data/builds';
import { ART } from '../../data/sceneArt';
import { newBuild, buildTitle, receiptLine, kindOf, isMastered } from '../../logic/builds';
import { sparks, sparkLine, trophyArts, companionLine } from '../../logic/studio';
import { todayStr } from '../../logic/dateUtils';

const plain = (md) => md.replace(/\*\*/g, '');

export default function StudioScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const studio = useStudio();
  const { builds, me, userId } = studio;
  const route = useRoute();
  const { signalAction } = useAccess();
  const [asking, setAsking] = useState(null); // kind id

  // Arrived to make a particular thing (Today's Find "Make something with
  // it"): open its questions straight away.
  useEffect(() => {
    if (route.params?.start) setAsking(route.params.start);
  }, [route.params?.start, route.params?.at]);

  const mySparks = sparks(builds);
  const earned = trophyArts(builds);
  const line = builds.length ? sparkLine(builds) : companionLine('empty', todayStr());

  const make = async (answers) => {
    const saved = await saveBuild(userId, newBuild(asking, answers));
    setAsking(null);
    if (saved) signalAction('build-made', { kind: saved.kind });
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
          <Text style={{ fontSize: t.md, color: accent.primary, fontWeight: t.semibold }}>Back</Text>
        </TouchableOpacity>

        <ScreenTitle title="Studio" subtitle="Make something real, free. Then see how every part works." />

        <StudioStage studio={studio} line={line} />

        {mySparks.length > 0 && (
          <>
            <SectionLabel label="What you're drawn to" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
              {mySparks.map((sp, i) => (
                <View key={sp.kind} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: r.full, borderWidth: 1,
                  borderColor: i === 0 ? accent.primary : c.border,
                  backgroundColor: i === 0 ? accent.primaryLight : c.bg1,
                }}>
                  <Ionicons name={sp.icon} size={14} color={i === 0 ? accent.primary : c.text3} />
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{sp.medium}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>
                    {sp.builds} made · {sp.changed} changed{sp.mastered ? ` · ${sp.mastered} mastered` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <SectionLabel label="Make one" />
        <TourSpot id="studio-kinds">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
          {BUILD_KINDS.map(kind => {
            const tried = mySparks.some(sp => sp.kind === kind.id);
            return (
              <Card
                key={kind.id}
                onPress={() => setAsking(kind.id)}
                accessibilityLabel={`Make ${kind.label}`}
                style={{ flexBasis: '47%', flexGrow: 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.sm }}>
                  <View style={{ width: 40, height: 40, borderRadius: r.md, backgroundColor: accent.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={kind.icon} size={22} color={accent.primary} />
                  </View>
                  {!tried && builds.length > 0 && <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: accent.primary }}>New to you</Text>}
                </View>
                <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{kind.label}</Text>
                <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>{kind.blurb}</Text>
              </Card>
            );
          })}
        </View>
        </TourSpot>

        <SectionLabel label="Trophies for your room" />
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {BUILD_KINDS.filter(k => k.trophy).map(k => {
              const got = earned.has(k.trophy.art);
              const a = ART[k.trophy.art];
              return (
                <View key={k.id} style={{ alignItems: 'center', width: 72 }}
                  accessible accessibilityLabel={got ? `${k.trophy.name}, earned` : `${k.trophy.name}, master ${k.label.toLowerCase()} to earn it`}>
                  <View style={{ height: 52, justifyContent: 'center', opacity: got ? 1 : 0.25 }}>
                    {!!a && <PixelArt art={a} scale={Math.min(44 / a.w, 44 / a.h)} />}
                  </View>
                  <Text style={{ fontSize: t.xs, color: got ? c.text1 : c.text3, textAlign: 'center' }} numberOfLines={2}>{k.trophy.name}</Text>
                </View>
              );
            })}
          </View>
          <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: s.md, textAlign: 'center' }} boldStyle={{ color: c.text2 }}>
            {earned.size
              ? 'Put them in your room: **Profile → Decorate → Trophies**.'
              : 'Master every part of a Build and its trophy is yours to place in your room.'}
          </RichText>
        </Card>

        <SectionLabel label="Your builds" />
        <TourSpot id="studio-builds">
        {builds.length ? builds.map(b => (
          <ListRow
            key={b.id}
            icon={kindOf(b)?.icon}
            iconColor={accent.primary}
            title={`${buildTitle(b)}${isMastered(b) ? ' ✓' : ''}`}
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
        </TourSpot>
      </ScrollView>

      <BuildAskSheet
        visible={!!asking}
        kindId={asking}
        dream={me.dream}
        onClose={() => setAsking(null)}
        onDone={make}
      />
    </View>
  );
}
