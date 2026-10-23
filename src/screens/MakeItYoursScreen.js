// src/screens/MakeItYoursScreen.js
// "Make it yours": every way to shape the app, on one page.
//
// The app opens a little at a time and suggests a goal, which guides a new
// person. This page is the other half of that promise: nothing about the
// guiding is fixed. What you're here for, what's in the app, what Home and
// the Library show, how it all looks and your character: each is one row
// here, changed in place or one tap from the screen that changes it.
//
// Settings used to hold a second copy of most of this (Calm Home, the
// backgrounds, the + corner, "Show everything now", Educator Mode, the
// experimental switch, Library sections), some of it a different control
// for the same setting. Since 2026-10-16 this page is the only one; Settings
// keeps account, reminders, privacy and help, and links here.

import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { useFabPosition } from '../../context/FabPositionContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { getPersona } from '../data/personas';
import { MAX_STAGE } from '../data/experienceStages';
import { stageMeta } from '../logic/experienceStage';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import RichText from '../components/RichText';
import TourSpot from '../components/TourSpot';
import AccessibilitySettings from '../components/AccessibilitySettings';
import { AppearancePicker, LifeAreaChips } from '../components/LookAndFeel';
import useDashboardV2 from '../logic/useDashboardV2';
import useTabsV2 from '../logic/useTabsV2';

const TRACK_VALUE = {
  picks: '**Just my picks.** Only what you chose. Goals suggest more.',
  auto: '**Level up.** A few tools first, more with each goal.',
  full: '**All in.** Everything, minus what you untick.',
};
const CORNERS = [['top-left', 'Top left'], ['top-right', 'Top right'], ['bottom-left', 'Bottom left'], ['bottom-right', 'Bottom right']];

export default function MakeItYoursScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { purpose, experienceMode, setExperienceMode, picks, stage, nextStage } = useAccess();
  const { activeType } = useProfiles();
  const { fabPosition, setFabPosition } = useFabPosition();
  const { showEmojis, showSubtext, setShowEmojis, setShowSubtext } = useUIPrefs();
  const [tutorials, setTutorials] = useSetting(SETTING_KEYS.SCREEN_TUTORIALS_ENABLED, true);
  const [homeView, setHomeView] = useSetting(SETTING_KEYS.HOME_VIEW, 'full');
  const [libraryView, setLibraryView] = useSetting(SETTING_KEYS.LIBRARY_VIEW, 'full');
  const [quickButtons, setQuickButtons] = useSetting(SETTING_KEYS.HOME_QUICK_BUTTONS, true);
  const [hideDone, setHideDone] = useSetting(SETTING_KEYS.HIDE_DONE_WIDGETS, false);
  const [homeBg, setHomeBg] = useSetting(SETTING_KEYS.HOME_BACKGROUND, 'plain');
  const [libraryBg, setLibraryBg] = useSetting(SETTING_KEYS.LIBRARY_BACKGROUND, 'plain');
  const [heroTap, setHeroTap] = useSetting(SETTING_KEYS.HERO_TAP_TO_PROFILE, true);
  // Today as the Planner (shake-up P3): on for new accounts, opt-in here for
  // everyone else for this release. Off brings the old Home and Planner back.
  const [dashboardV2, setDashboardV2] = useDashboardV2();
  // The tabs Today · Learn · Make and You (shake-up P4). They follow Today
  // until switched here on their own.
  const [tabsV2, setTabsV2] = useTabsV2();

  const persona = getPersona(activeType);
  const track = ['picks', 'auto', 'full'].includes(experienceMode) ? experienceMode : 'auto';
  const pickCount = (picks || []).length;

  // Settings' rows link straight to a part of this page: { section: 'look' }.
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const sectionNode = useRef({});
  const mark = (key) => ({
    ref: (n) => { sectionNode.current[key] = n; },
    onLayout: (e) => { sectionY.current[key] = e.nativeEvent.layout.y; },
  });
  const section = route.params?.section;
  useEffect(() => {
    if (!section) return undefined;
    const timer = setTimeout(() => {
      const node = sectionNode.current[section];
      if (Platform.OS === 'web' && node?.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (sectionY.current[section] != null) scrollRef.current?.scrollTo({ y: Math.max(0, sectionY.current[section] - 8), animated: true });
      navigation.setParams({ section: undefined });
    }, 500);
    return () => clearTimeout(timer);
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const Toggle = ({ value, onChange, label }) => (
    <Switch value={!!value} onValueChange={onChange} accessibilityLabel={label}
      trackColor={{ false: c.borderStrong, true: accent.primary + '88' }} thumbColor={value ? accent.primary : c.text3} />
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
  const Head = ({ children, id }) => (
    <View {...(id ? mark(id) : {})}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: c.text3, marginBottom: s.sm, marginTop: s.sm }}>{children}</Text>
    </View>
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

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: s.lg, paddingTop: s.sm, paddingBottom: 100 }}>
        <Head>What it's for</Head>
        <View style={card}>
          <Row icon="compass-outline" title="What you're here for"
            value={purpose?.you ? `To **${purpose.you}**` : 'Pick what you came for'}
            onPress={() => navigation.navigate('Compass')} />
          <Row icon="person-outline" title="Account type"
            value={`**${persona?.short || 'Personal'}**. Sets which classes and cards come first.`}
            onPress={() => navigation.navigate('AllProfiles')} last />
        </View>

        <Head id="features">What's in your app</Head>
        <View style={card}>
          <Row icon="apps-outline" title="My features"
            value={track === 'full' && !pickCount ? "**Everything.** Untick what you don’t want" : pickCount ? `**${pickCount} picked.** Add or remove any part of the app` : '**Add or remove** any part of the app'}
            onPress={() => navigation.navigate('MyFeatures')} />
          <Row icon="git-network-outline" title="Connected apps"
            value="**Calendar, Reminders, share, files.** Bring in what you do in other apps"
            onPress={() => navigation.navigate('ConnectedApps')} />
          <Row icon="layers-outline" title="How you start" value={TRACK_VALUE[track]} />
          <Segments label="How you start" value={track}
            options={[['picks', 'Just my picks'], ['auto', 'Level up'], ['full', 'All in']]}
            onChange={(v) => {
              setExperienceMode(v);
              // Just my picks is only as good as the picks: straight to them.
              if (v === 'picks' && track !== 'picks') navigation.navigate('MyFeatures');
            }} />
          {track === 'auto' && (
            <Row icon="flag-outline" title={`Stage ${stage} of ${MAX_STAGE} · ${stageMeta(stage, activeType).label}`}
              value={nextStage ? `Next: **${nextStage.label}**. ${nextStage.text}.` : '**Everything is open.**'}
              onPress={() => navigation.navigate('Compass')} last />
          )}
        </View>

        <Head id="home">Home and Library</Head>
        <View style={card}>
          <Row icon="calendar-outline" title="Today as your planner"
            value={dashboardV2 ? '**On.** Home is your day: the plan, the next step, your cards' : '**Off.** Home and the Planner as before'}
            right={<Toggle value={!!dashboardV2} onChange={(v) => setDashboardV2(v)} label="Today as your planner" />} />
          <Row icon="albums-outline" title="Tabs: Today · Learn · Make"
            value={tabsV2 ? '**On.** Your picture (top left) opens **You**' : '**Off.** Library · Home · Learn, as before'}
            right={<Toggle value={!!tabsV2} onChange={(v) => setTabsV2(v)} label="Tabs: Today, Learn, Make" />} />
          <Row icon="leaf-outline" title={dashboardV2 ? 'View, everywhere' : 'Home view'}
            value={homeView === 'calm' ? '**Calm.** Fewer cards, the same day' : '**Full.** Every card you picked'} />
          <Segments label={dashboardV2 ? 'View' : 'Home view'} value={homeView === 'calm' ? 'calm' : 'full'}
            options={[['calm', 'Calm'], ['full', 'Full']]} onChange={setHomeView} />
          {/* One setting with Today on (homeView means the app's view). */}
          {!dashboardV2 && (
            <>
              <Row icon="library-outline" title="Library view"
                value={libraryView === 'calm' ? '**Calm.** One panel per page + a short list' : '**Full.** Every tool card'} />
              <Segments label="Library view" value={libraryView === 'calm' ? 'calm' : 'full'}
                options={[['calm', 'Calm'], ['full', 'Full']]} onChange={setLibraryView} />
            </>
          )}
          <Row icon="grid-outline" title="Home cards" value="**Add, hide or move** the cards on Home"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home', params: { editWidgets: Date.now() } })} />
          <Row icon="game-controller-outline" title="Study & Play buttons" value="On your profile card on Home"
            right={<Toggle value={quickButtons !== false} onChange={setQuickButtons} label="Study and Play buttons" />} />
          <Row icon="checkmark-done-outline" title="Hide cards once they're done" value="They come back **tomorrow**"
            right={<Toggle value={hideDone} onChange={setHideDone} label="Hide cards once they're done" />} />
          <Row icon="heart-outline" title="Life areas" value="The parts of life you **track**" />
          <LifeAreaChips />
        </View>

        <Head id="look">Look</Head>
        <AppearancePicker />
        <TourSpot id="settings-background">
        <View style={card}>
          <Row icon="image-outline" title="Scene behind Home" value="Your character's **landscape**, or plain"
            right={<Toggle value={homeBg === 'player'} onChange={(v) => setHomeBg(v ? 'player' : 'plain')} label="Scene behind Home" />} />
          <Row icon="image-outline" title="Scene behind the Library" value="Your character's **landscape**, or plain"
            right={<Toggle value={libraryBg === 'player'} onChange={(v) => setLibraryBg(v ? 'player' : 'plain')} label="Scene behind the Library" />} />
          <Row icon="happy-outline" title="Emoji" value="Next to titles and labels"
            right={<Toggle value={showEmojis} onChange={setShowEmojis} label="Show emoji" />} />
          <Row icon="reader-outline" title="Subtitles" value="The line under a screen's title"
            right={<Toggle value={showSubtext} onChange={setShowSubtext} label="Show subtitles" />} />
          <Row icon="add-circle-outline" title="Where the + button sits" />
          <Segments label="Where the + button sits" value={fabPosition} options={CORNERS} onChange={setFabPosition} />
        </View>
        </TourSpot>

        <Head id="character">Your character</Head>
        <View style={card}>
          <Row icon="body-outline" title="Character and pet" value="**Outfit, pet and scene**"
            onPress={() => navigation.navigate('Profile')} />
          <Row icon="color-wand-outline" title="Decorate" value="**Place, move and flip** things in your scene"
            onPress={() => navigation.navigate('Profile', { decorate: Date.now() })} />
          <Row icon="hand-left-outline" title="Tap your character to open Profile"
            value={heroTap !== false ? 'On Training. **Off:** the tap makes them jump' : '**Off.** The tap makes them jump'}
            right={<Toggle value={heroTap !== false} onChange={setHeroTap} label="Tap your character to open Profile" />} last />
        </View>

        <Head id="accessibility">Easier to read and use</Head>
        <AccessibilitySettings />

        <Head>Tips and reminders</Head>
        <View style={card}>
          <Row icon="school-outline" title="Tips on new screens"
            value={tutorials !== false ? 'A short tip the **first time** you open a screen' : '**Off.** Replay them in Settings → Help'}
            right={<Toggle value={tutorials !== false} onChange={setTutorials} label="Tips on new screens" />} />
          <Row icon="notifications-outline" title="Reminders" value="Daily nudge and **pet** nudge"
            onPress={() => navigation.navigate('Settings', { section: 'reminders' })} last />
        </View>
      </ScrollView>
    </View>
  );
}
