// src/screens/you/YouParts.js
// The pieces You adds around the profile (docs/shake-up-plan-2026-10-21.md
// §2.2, P4): the header with its close, search, your life areas (the old
// Library → Life page, "the ground"), and the footer that holds what the top
// bar's crest menu used to, plus "What's next?".
//
// Every row that goes somewhere leaves You first (YouScreen's `leave`), so
// back from Settings lands on the app, not on the dropdown.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import { LIFE_AREAS } from '../library/LifeAreaScreen';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import LoginScreen from '../LoginScreen';

export function YouHeader({ onClose }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
      <Text style={{ flex: 1, fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">You</Text>
      <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close You"
        style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg2 }}>
        <Ionicons name="chevron-up" size={20} color={c.text2} />
      </TouchableOpacity>
    </View>
  );
}

// The crest menu's Search, as a bar (it opens the command palette).
export function YouSearch({ onOpen }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  return (
    <TouchableOpacity onPress={onOpen} accessibilityRole="search" accessibilityLabel="Search Deskartes"
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 11,
        borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md }}>
      <Ionicons name="search" size={16} color={c.text3} />
      <Text style={{ flex: 1, fontSize: t.sm, color: c.text3 }}>Search for a screen, a tool or a class</Text>
    </TouchableOpacity>
  );
}

// Your life areas: the old Library → Life page, now part of You (§2.1).
export function YouGround({ onOpenArea }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { isFeatureShown, experienceMode } = useAccess();
  if (experienceMode !== 'auto' && !isFeatureShown('life-areas')) return null;
  return (
    <View style={{ marginTop: s.lg }}>
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>Your life areas</Text>
      <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.sm }}>How each part of your life is going. <Text style={{ fontWeight: t.bold, color: c.text2 }}>Tap one</Text> to open it.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {LIFE_AREAS.map(area => (
          <TouchableOpacity key={area.id} onPress={() => onOpenArea(area.id)} accessibilityRole="button" accessibilityLabel={`${area.label}. Open this life area`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full,
              backgroundColor: (area.color || c.teal) + '18', borderWidth: 1, borderColor: (area.color || c.teal) + '55' }}>
            {!!area.icon && <Ionicons name={area.icon} size={14} color={area.color || c.teal} />}
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{area.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function FooterRow({ icon, label, sub, onPress, c, t, s }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${label}. ${sub}` : label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: 12 }}>
      <Ionicons name={icon} size={19} color={c.text2} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.md, fontWeight: '600', color: c.text1 }}>{label}</Text>
        {!!sub && <Text style={{ fontSize: t.xs, color: c.text3 }}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={15} color={c.text4} />
    </TouchableOpacity>
  );
}

/**
 * The footer. `go(key)` is YouScreen's: it leaves You, then opens the row.
 * Guests get Sign in; an account gets Notifications and Insights.
 */
export function YouFooter({ signedIn, go, onClose }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { isScreenVisible } = useAccess();
  const [signIn, setSignIn] = useState(false);
  const rows = [
    { key: 'next', icon: 'chatbubble-ellipses-outline', label: "What's next?", sub: 'Your guide, on the step you are on' },
    signedIn && { key: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
    { key: 'workmode', icon: 'timer-outline', label: 'Work Mode', sub: 'A focus session' },
    signedIn && { key: 'insights', icon: 'analytics-outline', label: 'Insights', sub: 'Your weeks in real life' },
    { key: 'yours', icon: 'options-outline', label: 'Make it yours', sub: 'Look, layout and features' },
    { key: 'settings', icon: 'settings-outline', label: 'Settings', sub: 'Account, reminders, privacy' },
    // My class: only with Organizations switched on.
    signedIn && isScreenVisible('Organization') && { key: 'organization', icon: 'school-outline', label: 'My class', sub: 'A class, team or group you joined' },
    { key: 'about', icon: 'information-circle-outline', label: 'About this page', sub: 'What the page you were on is for' },
    { key: 'tour', icon: 'map-outline', label: 'Show me around' },
    { key: 'help', icon: 'help-circle-outline', label: 'Help' },
  ].filter(Boolean);
  return (
    <View style={{ marginTop: s.xl }}>
      {/* Which profile the app is showing ("Day Job", "Home"). It sat in the top bar. */}
      {signedIn && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
          <Text style={{ fontSize: t.sm, color: c.text3 }}>Profile</Text>
          <ProfileSwitcher />
        </View>
      )}
      <View style={{ borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, paddingHorizontal: s.lg }}>
        {rows.map(({ key, ...row }) => <FooterRow key={key} {...row} onPress={() => go(key)} c={c} t={t} s={s} />)}
        {!signedIn && <FooterRow icon="log-in-outline" label="Sign in" sub="Your progress, on any device" onPress={() => setSignIn(true)} c={c} t={t} s={s} />}
      </View>
      <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close You"
        style={{ alignSelf: 'center', alignItems: 'center', marginTop: s.lg, padding: s.sm }}>
        <Ionicons name="chevron-up" size={22} color={c.text3} />
        <Text style={{ fontSize: t.xs, color: c.text3 }}>Close</Text>
      </TouchableOpacity>
      <Modal visible={signIn} animationType="slide" onRequestClose={() => setSignIn(false)}>
        <LoginScreen onSuccess={() => setSignIn(false)} onClose={() => setSignIn(false)} />
      </Modal>
    </View>
  );
}
