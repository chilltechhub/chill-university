// src/screens/SettingsScreen.js
// App settings — theme toggle controls app-wide dark/light mode

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';

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

export default function SettingsScreen() {
  const navigation  = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, isDark, toggleTheme } = useTheme();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [signingOut,setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('display_name, email, level, xp, streak_count').eq('id', user.id).maybeSingle();
        setProfile({ ...data, email: user.email });
      }
      setLoading(false);
    });
  }, []);

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
        {profile && (
          <View style={{ backgroundColor: c.bg1, borderRadius: r.xl, padding: s.xl, marginBottom: s.lg, borderWidth: 0.5, borderColor: c.border, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.teal + '22', borderWidth: 2, borderColor: c.teal, alignItems: 'center', justifyContent: 'center', marginBottom: s.md }}>
              <Text style={{ fontSize: 32 }}>👨‍🚀</Text>
            </View>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>
              {profile.display_name || 'Traveler'}
            </Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.md }}>{profile.email}</Text>
            <View style={{ flexDirection: 'row', gap: s.lg }}>
              {[
                { label: 'Level', val: profile.level || 1,         color: c.gold  },
                { label: 'XP',    val: profile.xp || 0,            color: c.teal  },
                { label: 'Streak',val: (profile.streak_count || 0) + 'd', color: '#FF4081' },
              ].map(st => (
                <View key={st.label} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: st.color }}>{st.val}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text4 }}>{st.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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

        {/* Notifications */}
        <SectionLabel label="Notifications" c={c} t={t} s={s} />
        <SettingRow icon="notifications-outline" iconColor="#4caf7d" label="Daily Reminders" subtitle="Get reminded to check in and log progress"
          right={<Switch value={false} trackColor={{ false: c.bg2, true: c.teal + '88' }} thumbColor={c.text4} />}
          c={c} t={t} s={s} r={r} />

        {/* Data */}
        <SectionLabel label="Data & Privacy" c={c} t={t} s={s} />
        <SettingRow icon="shield-checkmark-outline" iconColor="#64b5f6" label="Privacy Settings" subtitle="Manage your data and privacy"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('PrivacyScreen')}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="download-outline" iconColor={c.gold} label="Export My Data" subtitle="Download a copy of all your data"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          c={c} t={t} s={s} r={r} />

        {/* About */}
        <SectionLabel label="About" c={c} t={t} s={s} />
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
