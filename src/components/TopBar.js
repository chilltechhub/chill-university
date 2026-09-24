// src/components/TopBar.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useTour } from '../../context/TourContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import ProfileSwitcher from './ProfileSwitcher';
import TourSpot from './TourSpot';
import NotificationBell from './NotificationBell';
import { RANK_LABELS } from '../theme';
import LoginScreen from '../screens/LoginScreen';

// Profile / Help / Screen Tutorial / Settings / Search — one tap-menu off
// the crest instead of five separate rows. These used to live on the FAB's
// speed dial; they moved here because they're "go somewhere" shortcuts, not
// "create something" actions, and the crest is a root-level control that
// can navigate to them just as reliably as the FAB could (see
// FloatingActionButton.js's header comment for why that reliability matters).
//
// Guests get the same menu with "Sign in" in Profile's place. It used to
// open sign-in directly, which left a guest no way to reach Settings, Help
// or Search at all.
function CrestMenu({ visible, onClose, onSelect, signedIn, c, t, s }) {
  const items = [
    signedIn
      ? { key: 'profile', label: 'Profile', icon: 'person-circle-outline', colorKey: 'gold' }
      : { key: 'signin',  label: 'Sign in', icon: 'log-in-outline',        colorKey: 'teal' },
    { key: 'help',     label: 'Help',           icon: 'help-circle-outline',   colorKey: 'purple' },
    { key: 'tutorial', label: 'Screen Tutorial', icon: 'school-outline',       colorKey: 'teal' },
    { key: 'settings', label: 'Settings',       icon: 'settings-outline',      colorKey: 'text3' },
    // The phone-side entry to the command palette — Cmd/Ctrl+K only exists
    // where there's a keyboard, so search needs a visible control too.
    { key: 'search',   label: 'Search',         icon: 'search-outline',        colorKey: 'tealMid' },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: s.sm, paddingBottom: s.xxl }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.sm }} />
          {items.map(item => {
            const color = item.colorKey ? c[item.colorKey] : item.color;
            return (
              <TouchableOpacity key={item.key} onPress={() => onSelect(item.key)} activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.xl, paddingVertical: 13 }}>
                <Ionicons name={item.icon} size={19} color={color} />
                <Text style={{ fontSize: t.md, fontWeight: '600', color: c.text1 }}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function TopBar({ currentScreen }) {
  const { user, points, rank, level, progress, loading, pendingRewards } = useUserProgress();
  const { colors, typography, spacing, shadows, accent, style: ui } = useTheme();
  const { showEmojis } = useUIPrefs();
  const navigation = useNavigation();
  const { startScreenTour } = useTour();
  const { openPalette } = useCommandPalette();
  const [showLogin, setShowLogin] = useState(false);
  const [showCrestMenu, setShowCrestMenu] = useState(false);

  const s = makeStyles(colors, typography, spacing, shadows, accent, ui);
  const rankInfo = RANK_LABELS[rank] || RANK_LABELS[20];

  const handleCrestMenuSelect = (key) => {
    setShowCrestMenu(false);
    switch (key) {
      case 'profile':  navigation.navigate('Profile'); break;
      case 'signin':   setShowLogin(true); break;
      case 'help':     navigation.navigate('Help', { fromScreen: currentScreen }); break;
      case 'tutorial': startScreenTour(currentScreen); break;
      case 'settings': navigation.navigate('Settings'); break;
      case 'search':   openPalette(); break;
    }
  };

  if (loading) {
    return (
      <View style={[s.container, { flexDirection: 'row', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <View style={s.container}>
        <View style={s.topRow}>
          {/* Crest — opens the Profile/Help/Tutorial/Settings/Search menu
              (Sign in instead of Profile for a guest). */}
          <TourSpot id="topbar-menu">
          <TouchableOpacity
            style={s.crest}
            onPress={() => setShowCrestMenu(true)}
            activeOpacity={0.75}
            accessibilityLabel="Menu: profile, help, settings, search"
          >
            <Text style={s.crestEmoji}>{rankInfo.emoji}</Text>
          </TouchableOpacity>
          </TourSpot>

          {/* Which profile the app is currently rendering — "Day Job",
              "Halcyon", "Home". Here rather than on Home because switching
              has to be reachable from every screen, same reasoning as the
              FAB/command palette. */}
          <TourSpot id="topbar-profile" radius={999}>
            <ProfileSwitcher />
          </TourSpot>

          <View style={{ flex: 1 }} />

          {/* Level + points — one compact readout instead of a separate
              rank-name/percent row plus its own points block. The full
              rank label ("Beginner", "Grandmaster", ...) still shows on
              Profile; it doesn't need to live in the header too. Streak
              lived here too until it was pulled to cut down on header
              noise — still visible on Home and Profile. */}
          {user ? (
            <TourSpot id="topbar-stats" radius={999} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={s.statPill} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
              <Text style={s.statPillText} numberOfLines={1}>LV {level} · {points.toLocaleString()} PTS</Text>
            </TouchableOpacity>
            <NotificationBell userId={user.id} />
            </TourSpot>
          ) : (
            <TouchableOpacity style={s.signInBtn} onPress={() => setShowLogin(true)}>
              <Ionicons name="person-circle-outline" size={14} color={accent.onPrimary} />
              <Text style={s.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}

          {/* Notification Center — reminders, what needs doing, app news.
              Signed-out people get app news there too, but the bell is for
              an account's own stuff, so it waits for sign-in. */}

          {/* Pending rewards */}
          {user && pendingRewards?.length > 0 && (
            <TouchableOpacity
              style={s.rewardBtn}
              onPress={() => navigation.navigate('Profile', { tab: 'rewards' })}
            >
              {showEmojis ? <Text style={{ fontSize: 20 }}>🎁</Text> : <Ionicons name="gift-outline" size={18} color={colors.gold} />}
              <View style={s.rewardDot}>
                <Text style={s.rewardDotText}>{pendingRewards.length}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress toward next level — a thin full-width strip below the
            row instead of squeezed into it alongside the profile switcher
            and stat pill. */}
        {user && (
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        )}
      </View>

      <CrestMenu
        visible={showCrestMenu}
        onClose={() => setShowCrestMenu(false)}
        onSelect={handleCrestMenuSelect}
        signedIn={!!user}
        c={colors} t={typography} s={spacing}
      />

      <Modal visible={showLogin} animationType="slide" onRequestClose={() => setShowLogin(false)}>
        <LoginScreen onSuccess={() => setShowLogin(false)} onClose={() => setShowLogin(false)} />
      </Modal>
    </>
  );
}

const makeStyles = (c, t, s, sh, accent, ui) => StyleSheet.create({
  container: {
    paddingHorizontal: s.lg,
    paddingVertical: s.sm,
    backgroundColor: c.headerBg,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    borderTopWidth: 0,
    ...sh.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crest: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1.5, borderColor: c.gold,
    backgroundColor: c.goldLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: s.sm,
  },
  crestEmoji: { fontSize: 15 },
  statPill: {
    backgroundColor: c.bg2,
    borderRadius: 14,
    paddingHorizontal: s.sm + 2,
    paddingVertical: 6,
  },
  statPillText: { fontSize: t.sm, fontWeight: t.bold, color: c.gold, fontFamily: ui.numberFont },
  barBg: { height: 4, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden', marginTop: s.sm },
  barFill: { height: 4, backgroundColor: c.goldMid, borderRadius: 3 },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: accent.primary, borderRadius: 14,
    paddingHorizontal: s.sm + 2, paddingVertical: 6,
  },
  signInText: { fontSize: t.xs, color: accent.onPrimary, fontWeight: t.semibold },
  rewardBtn: { marginLeft: s.sm, position: 'relative' },
  rewardDot: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: c.error, borderRadius: 9,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  rewardDotText: { color: '#ffffff', fontSize: 9, fontWeight: t.bold }, // style-ok: white count on the red badge in both modes
});
