// src/components/TopBar.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import ProfileSwitcher from './ProfileSwitcher';
import TourSpot from './TourSpot';
import NotificationBell from './NotificationBell';
import { RANK_LABELS } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import { readableOn } from '../logic/contrast';
import { useBlueprint, WORKSHOP_SCREENS } from '../screens/library/blueprint';
import { onWorkSessionChange, sessionSeconds } from '../logic/workSession';
import { useSpendablePoints } from '../logic/usePetCare';

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
    // Your weeks in real life (StatsScreen.js). Needs an account to count.
    signedIn && { key: 'insights', label: 'Insights', icon: 'analytics-outline' },
    { key: 'help',     label: 'Help',           icon: 'help-circle-outline',   colorKey: 'purple' },
    { key: 'tutorial', label: 'Screen Tutorial', icon: 'school-outline',       colorKey: 'teal' },
    { key: 'yours',    label: 'Make it yours',  icon: 'options-outline',       colorKey: 'gold' },
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
          {items.filter(Boolean).map(item => {
            // One tint for every row: a different colour per icon read as a
            // rainbow with no meaning (2026-10-14). Colour stays for things
            // that carry meaning, like life areas.
            const color = c.text2;
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

function WorkSessionPill({ navigation, c }) {
  const [session, setSession] = useState(null);
  const [, setTick] = useState(0);
  useEffect(() => onWorkSessionChange(setSession), []);
  const running = !!session?.runningSince;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  if (!session || session.phase === 'start') return null;
  const secs = sessionSeconds(session);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), sec = secs % 60;
  const clock = h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  return (
    <TouchableOpacity onPress={() => navigation.navigate('WorkMode')} hitSlop={6} accessibilityRole="button"
      accessibilityLabel={`Focus session ${running ? 'running' : 'paused'}, ${clock}. Open Work Mode`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6,
        borderRadius: 999, borderWidth: 1, borderColor: c.teal, backgroundColor: c.teal + '1f' }}>
      <Ionicons name={running ? 'timer-outline' : 'pause'} size={13} color={c.teal} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal, fontVariant: ['tabular-nums'] }}>{clock}</Text>
    </TouchableOpacity>
  );
}

export default function TopBar({ currentScreen }) {
  const { user, points: earned, rank, level, progress, loading } = useUserProgress();
  // What's left to spend (pet food comes off it). Rank still counts everything earned.
  const points = useSpendablePoints(user?.id, earned);
  const { colors, typography, spacing, shadows, accent, style: ui } = useTheme();
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
      case 'yours':    navigation.navigate('MakeItYours'); break;
      case 'settings': navigation.navigate('Settings'); break;
      case 'insights': navigation.navigate('Stats'); break;
      case 'search':   openPalette(); break;
    }
  };

  // In the Workshop the bar takes the blueprint paper (blueprint.js).
  const bp = useBlueprint();
  const onPaper = WORKSHOP_SCREENS.has(currentScreen);

  if (loading) {
    return (
      <View style={[s.container, { flexDirection: 'row', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <View style={[s.container, onPaper && { backgroundColor: bp.paper, borderBottomColor: bp.border }]}>
        <View style={s.topRow}>
          {/* Crest — opens the Profile/Help/Tutorial/Settings/Search menu
              (Sign in instead of Profile for a guest). */}
          <TourSpot id="topbar-menu">
          <TouchableOpacity
            style={s.crest}
            hitSlop={7}
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

          {/* A Work Mode session still going: its clock, one tap back to it.
              Leaving the screen used to lose the session. */}
          {/* Work Mode has two routes: the root one and the Library's. */}
          {currentScreen !== 'WorkMode' && currentScreen !== 'WorkModeScreen' && <WorkSessionPill navigation={navigation} c={colors} />}

          {/* Level + points — one compact readout instead of a separate
              rank-name/percent row plus its own points block. The full
              rank label ("Beginner", "Grandmaster", ...) still shows on
              Profile; it doesn't need to live in the header too. Streak
              lived here too until it was pulled to cut down on header
              noise — still visible on Home and Profile. */}
          {user ? (
            <TourSpot id="topbar-stats" radius={999} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={s.statPill} hitSlop={7} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Level ${level}, ${points} points. Open your profile`}>
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
  // Light-mode gold on the pill's bg2 was 4.35:1 — nudged to pass AA.
  statPillText: { fontSize: t.sm, fontWeight: t.bold, color: readableOn(c.gold, c.bg2), fontFamily: ui.numberFont },
  barBg: { height: 4, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden', marginTop: s.sm },
  barFill: { height: 4, backgroundColor: c.goldMid, borderRadius: 3 },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: accent.primary, borderRadius: 14,
    paddingHorizontal: s.sm + 2, paddingVertical: 6,
  },
  signInText: { fontSize: t.xs, color: accent.onPrimary, fontWeight: t.semibold },
});
