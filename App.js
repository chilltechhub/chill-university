// App.js
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';

import { UserProgressProvider } from './context/UserProgressContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { UIPrefsProvider } from './context/UIPrefsContext';
import { FabPositionProvider } from './context/FabPositionContext';
import { RemoteConfigProvider, useFeatureFlag, useConfigValue } from './context/RemoteConfigContext';
import { TourProvider, useTour } from './context/TourContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { loadRemotePets } from './src/data/petOptions';
import { loadRemoteBackgrounds } from './src/data/backgroundOptions';
import { ensureAndroidChannel } from './src/logic/notificationScheduler';
import { initPlanReminders } from './src/logic/planReminderActions';
import { flushQueue } from './src/api/offlineCache';
import * as ScreenOrientation from 'expo-screen-orientation';
import TourOverlay from './src/components/TourOverlay';

import HomeScreen    from './src/screens/HomeScreen';
import GamesScreen   from './src/screens/GamesScreen';
import LibraryNav    from './src/screens/library/LibraryNav';

import LoginScreen        from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import Onboarding      from './src/screens/OnboardingScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import PlayScreen      from './src/screens/PlayScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import TopBar           from './src/components/TopBar';
import MissionPopup      from './src/components/MissionPopup';
import FloatingActionButton from './src/components/FloatingActionButton';
import CommandPalette from './src/components/CommandPalette';
import HelpScreen       from './src/screens/HelpScreen';
import AnnouncementBanner from './src/components/AnnouncementBanner';
import LevelUpNotification from './src/components/LevelUpNotification';
import MaintenanceScreen from './src/components/MaintenanceScreen';
import FamilyScreen from './src/screens/family/FamilyScreen';
import ChildProgressScreen from './src/screens/family/ChildProgressScreen';
import OrganizationScreen from './src/screens/organization/OrganizationScreen';
import CohortRosterScreen from './src/screens/organization/CohortRosterScreen';
import { useUserProgress } from './context/UserProgressContext';
import { supabase } from './src/api/supabaseClient';


// NOTE: OnboardingScreen.js (life-areas / commandCenterService) and ProfileQuickSetup.js
// are retired by this rebuild — OnboardingScreen.js was already orphaned (unreferenced),
// and ProfileQuickSetup's fields now live in Onboarding.js / SettingsScreen.js under one
// consistent `profiles` schema. Parent/child linking is back — see FamilyScreen.js /
// ChildProgressScreen.js (rebuilt from scratch; the old ParentHome/ChildDashboard/
// AddChildByCode/ChildInviteCode prototype in archive/src/screens/ referenced a
// `profiles` schema — role, grade, goals_completed — that never existed).

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     { active: 'home',    inactive: 'home-outline' },
  Training: { active: 'barbell', inactive: 'barbell-outline' },
  Library:  { active: 'book',    inactive: 'book-outline' },
};

function MainTabs() {
  const { colors: c } = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        // Unset default is an instant hard cut between tabs — the most
        // frequent "screen switch" in the app (Library/Home/Training),
        // so it's the one most worth smoothing. 'shift' cross-fades with a
        // slight horizontal offset, same motion modern iOS/Android tab
        // bars use natively.
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopWidth: 0.5,
          borderTopColor: c.border,
          paddingBottom: Platform.OS === 'ios' ? 10 : 3,
          paddingTop: 3,
          height: Platform.OS === 'ios' ? 66 : 52,
        },
        tabBarActiveTintColor:   c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 0 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}

    >
      <Tab.Screen name="Library"  component={LibraryNav} />
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Training" component={GamesScreen} />
    </Tab.Navigator>
  );
}

function MissionsOverlay() {
  const { dailyMissions } = useUserProgress();
  const [visible, setVisible] = React.useState(false);
  return (
    <MissionPopup
      visible={visible}
      onClose={() => setVisible(false)}
      missions={dailyMissions || []}
    />
  );
}

// Routes that own their own full-screen auth chrome — the global TopBar
// (rank/points/sign-in) would just duplicate or clash with them.
const NO_TOPBAR_ROUTES = new Set(['Login', 'MultiStepOnboarding', 'ResetPassword']);

function AppInner() {
  const { colors: c } = useTheme();
  const navigationRef = useRef(null);
  const [initialRoute, setInitialRoute] = React.useState(null);
  const [showTopBar, setShowTopBar] = React.useState(true);
  const [currentRouteName, setCurrentRouteName] = React.useState(null);
  const [resetLinkInvalid, setResetLinkInvalid] = React.useState(false);

  // Remote kill switch — flip app_config.maintenance_mode.enabled in
  // Supabase to take the whole app down (and back up) for every user
  // instantly, no build required. Checked before auth so it also blocks
  // logged-out users.
  const maintenanceOn  = useFeatureFlag('maintenance_mode', false);
  const maintenanceCfg = useConfigValue('maintenance_mode', {});
  const { registerNavigator, startIfFirstTime } = useTour();

  // Pulls in any admin-added pets/backgrounds from Supabase Storage (see
  // supabase/migrations/20260828_remote_art_storage.sql) once per app
  // launch — appends onto the existing PET_TIERS/BACKGROUNDS arrays in
  // place, so every screen's character picker picks them up automatically.
  React.useEffect(() => {
    loadRemotePets();
    loadRemoteBackgrounds();
    ensureAndroidChannel(); // silent — no permission prompt, just registers the channel

    // Plan-aware reminders — registers the Done/Snooze/Reschedule action
    // set a planner-instance notification uses and starts listening for
    // taps on them (see src/logic/planReminderActions.js). No permission
    // prompt here either; that happens the first time an actual reminder
    // is scheduled from PlannerScreen's InstanceModal.
    initPlanReminders();

    // Replay anything stranded in the offline write queue (captures/tasks
    // saved while isOnline() thought we were offline) against Supabase now
    // that we're definitely running. Nothing drained this queue before —
    // see src/api/offlineCache.js — so a queued write could sit invisibly
    // in AsyncStorage indefinitely. Safe to call even when the queue is
    // empty; it's a no-op.
    flushQueue(supabase).then(({ synced, remaining }) => {
      if (synced) console.log(`[queue] synced ${synced} pending write(s)${remaining ? `, ${remaining} still stuck` : ''}`);
    }).catch(() => {});

    // app.json's "orientation": "portrait" is a manifest hint that iPad
    // (and Expo Go generally) doesn't reliably honor on its own — nothing
    // in this app's layout was built for landscape, so lock it for real.
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  React.useEffect(() => {
    // A password-reset (or other auth) link redirects back to the app with
    // the token — or an error — in the URL hash (web only; detectSessionInUrl
    // is web-only too, see supabaseClient.js). Three distinct cases, checked
    // before the normal session check below ever runs:
    const hash = (Platform.OS === 'web' && typeof window !== 'undefined') ? window.location.hash : '';
    const clearHash = () => window.history.replaceState(null, '', window.location.pathname + window.location.search);

    // 1. An expired/already-used/invalid link. supabase-js's own URL
    // handling just silently drops this case rather than surfacing it —
    // this is the only way to actually tell the user what happened instead
    // of leaving them on whatever the normal logged-out/in route is.
    if (hash.includes('error=')) {
      setResetLinkInvalid(true);
      setInitialRoute('ResetPassword');
      setShowTopBar(false);
      setCurrentRouteName('ResetPassword');
      clearHash();
      return;
    }

    // 2. A valid recovery link. Wait for supabase-js to turn it into a
    // session and fire PASSWORD_RECOVERY (not SIGNED_IN) — and don't run
    // the normal getSession() check below in the meantime, since the
    // moment that session exists it would resolve too and race this to
    // MainTabs before the user ever sees the "choose a new password" screen.
    if (hash.includes('type=recovery')) {
      let settled = false;
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          settled = true;
          setResetLinkInvalid(false);
          setInitialRoute('ResetPassword');
          setShowTopBar(false);
          setCurrentRouteName('ResetPassword');
          clearHash();
        }
      });
      // Not every bad token comes back as an `error=` hash (case 1 above) —
      // a token supabase-js can't validate at all just never fires
      // PASSWORD_RECOVERY, and without this the app sits on the splash
      // screen (`if (!initialRoute) return null`) forever. Give it a few
      // seconds, then fall back to the same "invalid" screen.
      const timeout = setTimeout(() => {
        if (!settled) {
          setResetLinkInvalid(true);
          setInitialRoute('ResetPassword');
          setShowTopBar(false);
          setCurrentRouteName('ResetPassword');
          clearHash();
        }
      }, 5000);
      return () => { authListener?.subscription?.unsubscribe(); clearTimeout(timeout); };
    }

    // 3. Normal launch — check auth state.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setInitialRoute('Login');
        setShowTopBar(false);
        setCurrentRouteName('Login');
        return;
      }
      // Logged in — check onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      const needsOnboarding = !profile || profile.onboarding_completed !== true;
      const route = needsOnboarding ? 'MultiStepOnboarding' : 'MainTabs';
      setInitialRoute(route);
      setShowTopBar(!NO_TOPBAR_ROUTES.has(route));
      setCurrentRouteName(route);
    });
  }, []);

  if (maintenanceOn) return <MaintenanceScreen message={maintenanceCfg?.message} />;
  if (!initialRoute) return null; // splash while checking

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // onStateChange doesn't fire for the initial route — without this,
        // currentRouteName stays stuck on the coarse 'MainTabs'/etc value
        // set before the container mounted, instead of e.g. 'Home'.
        const name = navigationRef.current?.getCurrentRoute()?.name;
        setShowTopBar(!NO_TOPBAR_ROUTES.has(name));
        setCurrentRouteName(name);
        registerNavigator((routeName, params) => navigationRef.current?.navigate(routeName, params));
        if (name === 'Home') startIfFirstTime();
      }}
      onStateChange={() => {
        const name = navigationRef.current?.getCurrentRoute()?.name;
        setShowTopBar(!NO_TOPBAR_ROUTES.has(name));
        setCurrentRouteName(name);
        if (name === 'Home') startIfFirstTime();
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: c.headerBg }} edges={['top']}>
        {showTopBar && <TopBar />}
        {showTopBar && <AnnouncementBanner />}
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            // Explicit, platform-uniform slide — the un-set default splits
            // between iOS's slide and Android's scale/fade preset, so the
            // same push read as two different transitions depending on the
            // device. One consistent motion everywhere reads as smoother
            // and more intentional than either platform default alone.
            ...TransitionPresets.SlideFromRightIOS,
          }}>
          <Stack.Screen name="Login"               component={LoginScreen} />
          <Stack.Screen name="ResetPassword">
            {() => <ResetPasswordScreen linkInvalid={resetLinkInvalid} />}
          </Stack.Screen>
          <Stack.Screen name="MultiStepOnboarding" component={MultiStepOnboarding} />
          <Stack.Screen name="MainTabs"            component={MainTabs} />
          <Stack.Screen name="Onboarding"          component={Onboarding} />
          <Stack.Screen name="Profile"             component={ProfileScreen} />
          <Stack.Screen name="Settings"            component={SettingsScreen} />
          <Stack.Screen name="Play"                component={PlayScreen} />
          <Stack.Screen name="PlayGame"            component={PlayScreen} />
          <Stack.Screen name="Leaderboard"         component={LeaderboardScreen} />
          <Stack.Screen name="Family"              component={FamilyScreen} />
          <Stack.Screen name="ChildProgress"       component={ChildProgressScreen} />
          <Stack.Screen name="Organization"        component={OrganizationScreen} />
          <Stack.Screen name="CohortRoster"        component={CohortRosterScreen} />
          <Stack.Screen name="Help"                component={HelpScreen} />
        </Stack.Navigator>
        <MissionsOverlay />
        <LevelUpNotification />
        {showTopBar && <FloatingActionButton currentScreen={currentRouteName} />}
        {/* Global search (Cmd/Ctrl+K, or the FAB's Search action). Sits
            beside the FAB for the same reason: it has to be reachable from
            every screen, and it navigates rather than belonging to any one
            of them. */}
        {showTopBar && <CommandPalette />}
      </SafeAreaView>
      <TourOverlay />
    </NavigationContainer>
  );
}
export default function App() {
  const [fontsLoaded] = useFonts({
    Rajdhani_600SemiBold, Rajdhani_700Bold,
    JetBrainsMono_500Medium, JetBrainsMono_600SemiBold,
  });
  if (!fontsLoaded) return null; // splash while the HUD fonts load

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UIPrefsProvider>
          <RemoteConfigProvider>
            <UserProgressProvider>
              <FabPositionProvider>
                <CommandPaletteProvider>
                <TourProvider>
                  <AppInner />
                </TourProvider>
                </CommandPaletteProvider>
              </FabPositionProvider>
            </UserProgressProvider>
          </RemoteConfigProvider>
        </UIPrefsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
