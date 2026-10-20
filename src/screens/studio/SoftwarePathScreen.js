// src/screens/studio/SoftwarePathScreen.js
// Software for You: four missions that teach, show, practise and do what
// software can do for someone who isn't an engineer, for free
// (src/data/softwarePath.js, docs/north-star.md).
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { ScreenTitle } from '../../components/ui';
import RichText from '../../components/RichText';
import PetCompanion from '../../components/PetCompanion';
import usePath from './usePath';
import { SOFTWARE_PATH } from '../../data/softwarePath';

const BEATS = [
  ['seen', 'Learn'],
  ['practiced', 'Practise'],
  ['did', 'Do it'],
];

export default function SoftwarePathScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { studio, summary } = usePath();

  const line = summary.done === summary.total
    ? '**All four done.** You’ve seen it, practised it and done it. That’s yours now.'
    : summary.done > 0
      ? `**${summary.done} of ${summary.total} done.** Next: ${summary.next.title.toLowerCase()}.`
      : 'Four short missions. **Learn it, see it, practise it, do it for real.**';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 120 }}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudioScreen'))}
          accessibilityRole="button" accessibilityLabel="Back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: s.md, alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={22} color={accent.primary} />
          <Text style={{ fontSize: t.md, color: accent.primary, fontWeight: t.semibold }}>Back</Text>
        </TouchableOpacity>

        <ScreenTitle title={SOFTWARE_PATH.title} subtitle={SOFTWARE_PATH.promise} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: s.sm, marginBottom: s.lg }}>
          {!!studio.pet && <PetCompanion pet={studio.pet} size={44} />}
          <View style={{ flex: 1, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}>
            <RichText style={{ fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{line}</RichText>
          </View>
        </View>

        {summary.states.map((st, i) => {
          const m = st.mission;
          const isNext = summary.next?.id === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => navigation.navigate('MissionScreen', { missionId: m.id })}
              accessibilityRole="button"
              accessibilityLabel={`Mission ${i + 1}: ${m.title}. ${st.done ? 'Done' : isNext ? 'Up next' : 'Not done yet'}`}
              style={{
                padding: s.lg, marginBottom: s.sm, borderRadius: r.lg, backgroundColor: c.bg1,
                borderWidth: isNext || st.done ? 1.5 : 0.5, borderColor: st.done || isNext ? accent.primary : c.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: accent.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={st.done ? 'checkmark' : m.icon} size={20} color={accent.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>Mission {i + 1}{isNext ? ' · up next' : ''}</Text>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{m.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.text3} />
              </View>
              <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
                {BEATS.map(([key, label]) => {
                  const on = !!st[key];
                  return (
                    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: r.full, backgroundColor: on ? accent.primaryLight : c.bg2 }}>
                      <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={on ? accent.primary : c.text3} />
                      <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: on ? c.text1 : c.text3 }}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
