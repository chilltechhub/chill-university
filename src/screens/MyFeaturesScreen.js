// src/screens/MyFeaturesScreen.js
// Make it yours → My features: the same "Pick your features" list as
// onboarding, for after. Every tick saves at once (AccessContext.setPicks),
// so there's no Save button to forget.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import FeaturePicker, { pickableAvailable } from '../components/FeaturePicker';
import { PICKABLES, recommendedFrom } from '../data/pickables';
import { openedAt } from '../logic/experienceStage';

const TITLES = {
  picks: 'Just my picks',
  auto: 'Level up',
  full: 'All in',
};

export default function MyFeaturesScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { experienceMode, picks, setPicks, purposeKey, plusOnSale, socialOn, experimentalOn } = useAccess();
  const { activeType } = useProfiles();
  const track = ['picks', 'auto', 'full'].includes(experienceMode) ? experienceMode : 'auto';
  const recommended = recommendedFrom(openedAt(activeType || 'PERSONAL', 1, { aim: purposeKey }));
  // "All in" with nothing unticked yet has no saved list: everything is on.
  const shown = picks || (track === 'full'
    ? PICKABLES.filter(p => (!p.labs || experimentalOn) && pickableAvailable(p, { plusOnSale, socialOn })).map(p => p.id)
    : []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={c.text2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontWeight: '800', color: c.text1 }}>My features</Text>
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>
            You're on <Text style={{ fontWeight: '800', color: c.text1 }}>{TITLES[track]}</Text>. Change that in Make it yours.
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingTop: s.sm, paddingBottom: 100 }}>
        <FeaturePicker
          track={track}
          picks={shown}
          recommended={recommended}
          plusOnSale={plusOnSale}
          socialOn={socialOn}
          onChange={setPicks}
        />
      </ScrollView>
    </View>
  );
}
