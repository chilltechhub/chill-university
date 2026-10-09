// src/screens/MakeItYoursScreen.js
// "Make it yours": every way to shape the app, on one page.
//
// The app opens a little at a time and suggests a goal, which guides a new
// person. This page is the other half of that promise: nothing about the
// guiding is fixed. What you're here for, which cards sit on Home, which life
// areas and Library pages show, how much of the app is open, where the +
// sits, how it looks and whether tips pop up: each is one row here, either
// changed in place or one tap from the screen that changes it.
//
// It used to be spread over Settings (four sections apart), the Compass, the
// Home Edit button and the top-left profile chip, with no page saying they
// were all choices.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { useFabPosition } from '../../context/FabPositionContext';
import { getPersona } from '../data/personas';
import { LIFE_AREAS } from './library/LifeAreaScreen';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import RichText from '../components/RichText';

const MODES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']];
const CORNERS = [['top-left', 'Top left'], ['top-right', 'Top right'], ['bottom-left', 'Bottom left'], ['bottom-right', 'Bottom right']];

export default function MakeItYoursScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, mode, setMode, accent } = useTheme();
  const { purpose, experienceMode, setExperienceMode } = useAccess();
  const { profile } = useUserProgress();
  const { activeType } = useProfiles();
  const { fabPosition, setFabPosition } = useFabPosition();
  const [tutorials, setTutorials] = useSetting(SETTING_KEYS.SCREEN_TUTORIALS_ENABLED, true);

  const areaNames = (Array.isArray(profile?.active_life_areas) ? profile.active_life_areas : [])
    .map(id => LIFE_AREAS.find(a => a.id === id)?.label).filter(Boolean);
  const persona = getPersona(activeType);
  const full = experienceMode === 'full';

  const goLibrary = (screen, params) => navigation.navigate('MainTabs', { screen: 'Library', params: { screen, params } });

  const card = { backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md, overflow: 'hidden' };
  const Row = ({ icon, title, value, onPress, right, last }) => (
    <TouchableOpacity disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: c.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: accent.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={accent.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{title}</Text>
        {!!value && <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }} boldStyle={{ color: c.text1 }}>{value}</RichText>}
      </View>
      {right || (onPress ? <Ionicons name="chevron-forward" size={16} color={c.text4} /> : null)}
    </TouchableOpacity>
  );
  const Segments = ({ options, value, onChange, label }) => (
    <View style={{ flexDirection: 'row', backgroundColor: c.bg2, borderRadius: r.md, padding: 3, marginHorizontal: s.md, marginBottom: s.md }}
      accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(([key, text]) => {
        const on = value === key;
        return (
          <TouchableOpacity key={key} onPress={() => onChange(key)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: r.sm, backgroundColor: on ? c.bg1 : 'transparent' }}>
            <Text style={{ fontSize: t.xs, fontWeight: on ? '800' : '600', color: on ? c.text1 : c.text3 }}>{text}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
  const Head = ({ children }) => (
    <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: c.text3, marginBottom: s.sm, marginTop: s.sm }}>{children}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={c.text2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontWeight: '800', color: c.text1 }}>Make it yours</Text>
          <RichText style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }} boldStyle={{ color: c.text1 }}>
            The app suggests a path. **Change any of it, any time.**
          </RichText>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingTop: s.sm, paddingBottom: 100 }}>
        <Head>What it's for</Head>
        <View style={card}>
          <Row icon="compass-outline" title="What you're here for"
            value={purpose?.you ? `To **${purpose.you}**` : 'Pick what you came for'}
            onPress={() => navigation.navigate('Compass')} />
          <Row icon="person-outline" title="Account type"
            value={`**${persona?.short || 'Personal'}**. Sets which classes and cards come first.`}
            onPress={() => navigation.navigate('AllProfiles')} last />
        </View>

        <Head>What you see</Head>
        <View style={card}>
          <Row icon="grid-outline" title="Home cards" value="**Add, hide or move** the cards on Home"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home', params: { editWidgets: Date.now() } })} />
          <Row icon="heart-outline" title="Life areas"
            value={areaNames.length ? `**${areaNames.join(', ')}**` : 'Pick the parts of life you track'}
            onPress={() => navigation.navigate('Settings', { section: 'personalization' })} />
          <Row icon="library-outline" title="Library pages" value="**Hide** the tools you don't use"
            onPress={() => navigation.navigate('Settings', { section: 'personalization' })} last />
        </View>

        <Head>How much is open</Head>
        <View style={card}>
          <Row icon="layers-outline" title={full ? 'Everything is open' : 'Opens as you go'}
            value={full ? 'Every tool from today. Locked ones say what opens them.' : 'A few tools first, more with each goal. Any locked tool has **Open it now**.'} />
          <Segments label="How much is open" value={full ? 'full' : 'auto'}
            options={[['auto', 'Step by step'], ['full', 'Everything']]}
            onChange={(v) => setExperienceMode(v)} />
        </View>

        <Head>How it feels</Head>
        <View style={card}>
          <Row icon="contrast-outline" title="Light or dark" />
          <Segments label="Light or dark" value={mode} options={MODES} onChange={setMode} />
          <Row icon="add-circle-outline" title="Where the + button sits" />
          <Segments label="Where the + button sits" value={fabPosition} options={CORNERS} onChange={setFabPosition} />
          <Row icon="school-outline" title="Tips on new screens"
            value={tutorials !== false ? 'A short tip the first time you open a screen' : 'Off. Find them in **your picture → Screen Tutorial**'}
            right={<Switch value={tutorials !== false} onValueChange={setTutorials}
              trackColor={{ false: c.borderStrong, true: c.teal + '88' }} thumbColor={tutorials !== false ? c.teal : c.text3} />} />
          <Row icon="color-palette-outline" title="Style, colours and backgrounds" value="Accent colour, card style, character backgrounds"
            onPress={() => navigation.navigate('Settings', { section: 'appearance' })} last />
        </View>
      </ScrollView>
    </View>
  );
}
