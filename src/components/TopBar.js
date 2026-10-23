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
import { useAccess } from '../../context/AccessContext';
import useTabsV2 from '../logic/useTabsV2';
import useProgressV2 from '../logic/useProgressV2';
import { pathChip } from '../logic/nextStep';
import { goToScreen } from '../logic/appRoutes';

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

// With the new tabs (TABS_V2, shake-up P4), the new bar; off, the old one.
export default function TopBar(props) {
  const [tabsV2] = useTabsV2();
  return tabsV2 ? <TopBarV2 {...props} /> : <TopBarV1 {...props} />;
}

// The new bar (docs/shake-up-plan-2026-10-21.md §2.3):
//   [avatar ▾]   your path · step 2 of 4          [🔍] [🔔]
//   ▔▔▔▔▔▔▔▔▔▔▔▔▔ thin bar: steps done
// The avatar opens You (and closes it again). The chip is the goal in
// flight until units exist (P6), and opens Learn. The level/points pill,
// the tier crest and its menu are gone: the menu's rows are in You.
function TopBarV2({ currentScreen }) {
  const { user, profile, loading, level, points: earned } = useUserProgress();
  // Receipts off (PROGRESS_V2 rollback): the level and points pill comes back.
  const [progressV2] = useProgressV2();
  const pillPoints = useSpendablePoints(user?.id, earned);
  const { colors: c, typography: t, spacing: s, shadows: sh, accent } = useTheme();
  const navigation = useNavigation();
  const { openPalette } = useCommandPalette();
  const { activeObjective } = useAccess();
  const o = activeObjective?.active ? activeObjective : null;
  const chip = pathChip(o && {
    active: true, complete: !!o.complete, label: o.objective?.label, done: o.done, total: o.total,
  });
  const youOpen = currentScreen === 'You' || currentScreen === 'Profile';
  const bp = useBlueprint();
  const onPaper = WORKSHOP_SCREENS.has(currentScreen);
  const name = profile?.traveler_name || profile?.display_name || '';
  const initial = name.trim().charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={{ paddingHorizontal: s.lg, paddingVertical: s.sm, backgroundColor: c.headerBg, flexDirection: 'row', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={c.gold} />
      </View>
    );
  }

  const toggleYou = () => {
    if (youOpen && navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('You', { from: currentScreen });
  };

  return (
    <View style={[{ paddingHorizontal: s.lg, paddingTop: s.sm, paddingBottom: chip.total ? s.xs : s.sm, backgroundColor: c.headerBg,
      borderBottomWidth: 0.5, borderBottomColor: c.border, ...sh.sm }, onPaper && { backgroundColor: bp.paper, borderBottomColor: bp.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
        <TourSpot id="topbar-avatar" radius={999}>
          <TouchableOpacity onPress={toggleYou} hitSlop={7} activeOpacity={0.75} accessibilityRole="button"
            accessibilityLabel={youOpen ? 'Close You' : 'You: your page, search, settings and more'}
            accessibilityState={{ expanded: youOpen }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: accent.primary + '22', borderWidth: 1.5, borderColor: accent.primary }}>
              {initial
                ? <Text style={{ fontSize: 14, fontWeight: '800', color: accent.primary }}>{initial}</Text>
                : <Ionicons name="person" size={16} color={accent.primary} />}
            </View>
            <Ionicons name={youOpen ? 'chevron-up' : 'chevron-down'} size={14} color={c.text3} />
          </TouchableOpacity>
        </TourSpot>

        {/* Your path: the goal in flight, or an invitation to start one. */}
        <TouchableOpacity onPress={() => goToScreen(navigation, 'Training')} activeOpacity={0.75} accessibilityRole="button"
          accessibilityLabel={chip.empty ? 'Pick where to start. Open Learn' : `${chip.label}${chip.sub ? `, ${chip.sub}` : ''}. Open Learn`}
          style={{ flex: 1, minWidth: 0, paddingHorizontal: 4 }}>
          <Text numberOfLines={1} style={{ fontSize: t.sm, fontWeight: '800', color: chip.empty ? accent.primary : c.text1 }}>
            {chip.empty ? 'Pick where to start →' : chip.label}
          </Text>
          {!!chip.sub && <Text numberOfLines={1} style={{ fontSize: 11, color: c.text3 }}>{chip.sub}</Text>}
        </TouchableOpacity>

        {/* A Work Mode session still going: its clock, one tap back to it. */}
        {currentScreen !== 'WorkMode' && currentScreen !== 'WorkModeScreen' && <WorkSessionPill navigation={navigation} c={c} />}

        <TouchableOpacity onPress={openPalette} hitSlop={8} accessibilityRole="button" accessibilityLabel="Search"
          style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="search" size={19} color={c.text2} />
        </TouchableOpacity>
        {!!user && !progressV2 && (
          <TouchableOpacity onPress={() => navigation.navigate('You', { from: currentScreen })} hitSlop={6} accessibilityRole="button"
            accessibilityLabel={`Level ${level}, ${pillPoints} points. Open You`}
            style={{ backgroundColor: c.bg2, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: t.xs, fontWeight: '800', color: c.text2 }} numberOfLines={1}>Level {level} · {pillPoints.toLocaleString()} points</Text>
          </TouchableOpacity>
        )}
        {!!user && <NotificationBell userId={user.id} />}
      </View>

      {/* Steps done on the goal in flight. It used to draw tier progress. */}
      {chip.total > 0 && (
        <View style={{ height: 3, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden', marginTop: 6 }}
          accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: chip.total, now: chip.done }}>
          <View style={{ height: 3, width: `${chip.pct}%`, backgroundColor: accent.primary, borderRadius: 2 }} />
        </View>
      )}
    </View>
  );
}

function TopBarV1({ currentScreen }) {
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
              <Text style={s.statPillText} numberOfLines={1}>Level {level} · {points.toLocaleString()} points</Text>
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
