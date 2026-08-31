// src/screens/SettingsScreen.js
// App settings — theme toggle controls app-wide dark/light mode

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { RANK_LABELS, FONTS } from '../theme';
import LevelRing from '../components/LevelRing';
import { getRank, getRankProgress } from '../logic/rankUtils';
import { getUserApiKey, setUserApiKey, clearUserApiKey, maskKey } from '../api/aiKey';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { useFabPosition } from '../../context/FabPositionContext';
import { syncReminders, cancelAllReminders, computeReminderState } from '../logic/notificationScheduler';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTour } from '../../context/TourContext';
import TourSpot from '../components/TourSpot';

function SettingRow({ icon, iconColor, label, subtitle, right, onPress, c, t, s, r }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconColor + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{label}</Text>
        {subtitle && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity> : content;
}

function SectionLabel({ label, c, t, s }) {
  return <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm, marginTop: s.lg, paddingHorizontal: 2 }}>{label}</Text>;
}

// 2x2 grid, laid out the way the corners actually sit on screen.
const FAB_POSITIONS = [
  { key: 'top-left',     label: 'Top Left' },
  { key: 'top-right',    label: 'Top Right' },
  { key: 'bottom-left',  label: 'Bottom Left' },
  { key: 'bottom-right', label: 'Bottom Right' },
];

function FabPositionPicker({ value, onChange, c, t, s, r }) {
  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="apps-outline" size={18} color={c.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Quick Actions Button</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Choose where the floating + button sits</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {FAB_POSITIONS.map(pos => {
          const active = value === pos.key;
          return (
            <TouchableOpacity
              key={pos.key}
              onPress={() => onChange(pos.key)}
              style={{
                flexGrow: 1, minWidth: '45%', alignItems: 'center', justifyContent: 'center',
                paddingVertical: s.sm + 2, borderRadius: r.md, borderWidth: 1,
                borderColor: active ? c.teal : c.border,
                backgroundColor: active ? c.teal + '18' : c.bg0,
              }}
            >
              <Text style={{ fontSize: t.xs, fontWeight: '700', color: active ? c.teal : c.text3 }}>{pos.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Bring-your-own Anthropic key for the Import Hub's AI parsing. Stored on
// this device only (SecureStore/Keychain on iOS+Android, AsyncStorage on
// web) — never sent anywhere but api.anthropic.com from your own device.
function AIKeyCard({ c, t, s, r }) {
  const [savedKey, setSavedKey] = useState(null); // null = loading, '' = none saved
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getUserApiKey().then(k => setSavedKey(k || '')); }, []);

  const save = async () => {
    const key = draft.trim();
    if (!key.startsWith('sk-ant-')) {
      Alert.alert('That doesn’t look like an Anthropic key', 'Anthropic API keys start with "sk-ant-". Get one at console.anthropic.com.');
      return;
    }
    setSaving(true);
    await setUserApiKey(key);
    setSaving(false);
    setSavedKey(key);
    setDraft('');
    setEditing(false);
  };

  const remove = () => {
    Alert.alert('Remove your API key?', 'Imports will fall back to the app’s shared AI.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await clearUserApiKey(); setSavedKey(''); } },
    ]);
  };

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.sm }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.gold + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="key-outline" size={18} color={c.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Your Anthropic API Key</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Used for Import Hub AI parsing — kept on this device only</Text>
        </View>
      </View>

      {savedKey === null ? (
        <ActivityIndicator size="small" color={c.gold} />
      ) : savedKey && !editing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: t.sm, fontFamily: FONTS.mono, color: c.text2 }}>{maskKey(savedKey)}</Text>
          <View style={{ flexDirection: 'row', gap: s.md }}>
            <TouchableOpacity onPress={() => { setDraft(savedKey); setEditing(true); }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={remove}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.error }}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="sk-ant-..."
            placeholderTextColor={c.text4}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={{ fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.sm, fontFamily: FONTS.mono }}
          />
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: s.sm }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Get a key →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={save}
              disabled={saving || !draft.trim()}
              style={{ flex: 1, backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.sm, alignItems: 'center', opacity: (saving || !draft.trim()) ? 0.5 : 1 }}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Save key</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const navigation  = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, isDark, toggleTheme } = useTheme();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [signingOut,setSigningOut] = useState(false);
  const [heroTapEnabled, setHeroTapEnabled] = useSetting(SETTING_KEYS.HERO_TAP_TO_PROFILE, true);
  const [homeBgMode, setHomeBgMode] = useSetting(SETTING_KEYS.HOME_BACKGROUND, 'plain');
  const [libraryBgMode, setLibraryBgMode] = useSetting(SETTING_KEYS.LIBRARY_BACKGROUND, 'plain');
  const [remindersEnabled, setRemindersEnabled] = useSetting(SETTING_KEYS.DAILY_REMINDERS_ENABLED, false);
  const { dailyMissions, profile: liveProfile } = useUserProgress();
  const { startTour } = useTour();
  // Shared live context, not useSetting — the FAB itself (not a Screen, so
  // it never gets focus events) also needs to see this change immediately.
  const { fabPosition, setFabPosition } = useFabPosition();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('display_name, email, level, xp, points, streak_count').eq('id', user.id).maybeSingle();
        setProfile({ ...data, email: user.email });
      }
      setLoading(false);
    });
  }, []);

  const toggleReminders = async (v) => {
    setRemindersEnabled(v);
    if (!v) { cancelAllReminders(); return; }
    const { tasksAllComplete, checkedInToday } = computeReminderState({ dailyMissions, profile: liveProfile });
    const granted = await syncReminders({ enabled: true, tasksAllComplete, checkedInToday });
    if (!granted) {
      // OS permission was actually denied — don't leave the toggle showing
      // "on" while nothing is really scheduled.
      setRemindersEnabled(false);
      Alert.alert('Notifications blocked', 'Enable notifications for this app in your device Settings to use reminders.');
    }
  };

  const signOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        navigation.replace('Login');
      }},
    ]);
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={c.teal} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>⚙️ Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        {/* Account card */}
        {profile && (() => {
          const rank = getRank(profile.points || 0);
          const { progress } = getRankProgress(profile.points || 0);
          const rankInfo = RANK_LABELS[rank] || RANK_LABELS[20];
          return (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.xl, padding: s.xl, marginBottom: s.lg, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 2, borderTopColor: c.gold, alignItems: 'center' }}>
              <LevelRing pct={progress} size={72} strokeWidth={5} color={c.gold} trackColor={c.bg2} style={{ marginBottom: s.md }}>
                <Text style={{ fontSize: 30 }}>{rankInfo.emoji}</Text>
              </LevelRing>
              <Text style={{ fontSize: t.xl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>
                {profile.display_name || 'Commander'}
              </Text>
              <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, fontWeight: t.semibold, color: c.gold, marginBottom: 4 }}>
                LV {21 - rank} · {rankInfo.label}
              </Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.md }}>{profile.email}</Text>
              <View style={{ flexDirection: 'row', gap: s.lg }}>
                {[
                  { label: 'Points', val: (profile.points || 0).toLocaleString(), color: c.gold  },
                  { label: 'XP',     val: profile.xp || 0,                        color: c.teal  },
                  { label: 'Streak', val: (profile.streak_count || 0) + 'd',      color: '#FF4081' },
                ].map(st => (
                  <View key={st.label} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: t.lg, fontFamily: FONTS.mono, fontWeight: t.bold, color: st.color }}>{st.val}</Text>
                    <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, color: c.text4 }}>{st.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Appearance */}
        <SectionLabel label="Appearance" c={c} t={t} s={s} />
        <SettingRow
          icon={isDark ? 'moon' : 'sunny'}
          iconColor={isDark ? '#b07be0' : '#f5a623'}
          label={isDark ? 'Dark Mode' : 'Light Mode'}
          subtitle="Toggle between dark and light theme"
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={isDark ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <SettingRow
          icon="image-outline"
          iconColor={c.teal}
          label="Home Background"
          subtitle="Match your equipped landscape instead of a plain background"
          right={
            <Switch
              value={homeBgMode === 'player'}
              onValueChange={(v) => setHomeBgMode(v ? 'player' : 'plain')}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={homeBgMode === 'player' ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <SettingRow
          icon="image-outline"
          iconColor={c.gold}
          label="Library Background"
          subtitle="Match your equipped landscape instead of a plain background"
          right={
            <Switch
              value={libraryBgMode === 'player'}
              onValueChange={(v) => setLibraryBgMode(v ? 'player' : 'plain')}
              trackColor={{ false: c.bg2, true: c.gold + '88' }}
              thumbColor={libraryBgMode === 'player' ? c.gold : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <FabPositionPicker value={fabPosition} onChange={setFabPosition} c={c} t={t} s={s} r={r} />

        {/* Profile */}
        <SectionLabel label="Profile" c={c} t={t} s={s} />
        <SettingRow icon="person-outline" iconColor={c.teal} label="Edit Profile" subtitle="Update your display name, bio, and avatar"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Profile')}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="color-palette-outline" iconColor="#b07be0" label="Traveler Customization" subtitle="Change suit, helmet, and badge"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('MultiStepOnboarding')}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="hand-left-outline" iconColor={c.teal} label="Tap Avatar for Profile" subtitle="Tap your character on the Training screen to open your Profile. Off: the tap makes them jump instead"
          right={
            <Switch
              value={heroTapEnabled}
              onValueChange={setHeroTapEnabled}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={heroTapEnabled ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r} />
        <TourSpot id="settings-family">
        <SettingRow icon="people-outline" iconColor="#e0a830" label="Family" subtitle="Link a parent/child account to follow progress"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Family')}
          c={c} t={t} s={s} r={r} />
        </TourSpot>

        {/* Notifications */}
        <SectionLabel label="Notifications" c={c} t={t} s={s} />
        <SettingRow icon="notifications-outline" iconColor="#4caf7d" label="Daily Reminders" subtitle="A nudge if today's tasks are still open, and if your streak is at risk"
          right={
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={remindersEnabled ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r} />

        {/* AI Import */}
        <SectionLabel label="AI Import" c={c} t={t} s={s} />
        <AIKeyCard c={c} t={t} s={s} r={r} />

        {/* Data */}
        <SectionLabel label="Data & Privacy" c={c} t={t} s={s} />
        <SettingRow icon="shield-checkmark-outline" iconColor="#64b5f6" label="Privacy Settings" subtitle="Manage your data and privacy"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Library', params: { screen: 'PrivacyScreen' } })}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="download-outline" iconColor={c.gold} label="Export My Data" subtitle="Download a copy of all your data"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          c={c} t={t} s={s} r={r} />

        {/* About */}
        <SectionLabel label="About" c={c} t={t} s={s} />
        <SettingRow icon="school-outline" iconColor="#b07be0" label="Replay Tutorial" subtitle="Take the guided tour of the app's features again"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => { navigation.navigate('MainTabs'); setTimeout(startTour, 300); }}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="information-circle-outline" iconColor={c.teal} label="App Version" subtitle="CT App · ChillTech Hub LLC"
          right={<Text style={{ fontSize: t.xs, color: c.text4 }}>v1.0.0</Text>}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="globe-outline" iconColor="#64b5f6" label="Privacy Policy"
          right={<Ionicons name="open-outline" size={16} color={c.text4} />}
          c={c} t={t} s={s} r={r} />

        {/* Sign out */}
        <SectionLabel label="Account" c={c} t={t} s={s} />
        <TouchableOpacity onPress={signOut} disabled={signingOut}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, backgroundColor: '#e05858' + '18', borderRadius: r.md, padding: s.lg, borderWidth: 1, borderColor: '#e05858' + '44' }}>
          {signingOut
            ? <ActivityIndicator color="#e05858" size="small" />
            : <>
                <Ionicons name="log-out-outline" size={18} color="#e05858" />
                <Text style={{ color: '#e05858', fontWeight: t.bold, fontSize: t.sm }}>Sign Out</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
