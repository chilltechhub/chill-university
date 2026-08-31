// App.js
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';

import { UserProgressProvider } from './context/UserProgressContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FabPositionProvider } from './context/FabPositionContext';
import { RemoteConfigProvider, useFeatureFlag, useConfigValue } from './context/RemoteConfigContext';
import { TourProvider, useTour } from './context/TourContext';
import { loadRemotePets } from './src/data/petOptions';
import { loadRemoteBackgrounds } from './src/data/backgroundOptions';
import { ensureAndroidChannel } from './src/logic/notificationScheduler';
import * as ScreenOrientation from 'expo-screen-orientation';
import TourOverlay from './src/components/TourOverlay';

import HomeScreen    from './src/screens/HomeScreen';
import GamesScreen   from './src/screens/GamesScreen';
import LibraryNav    from './src/screens/library/LibraryNav';

import LoginScreen        from './src/screens/LoginScreen';
import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import Onboarding      from './src/screens/OnboardingScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import PlayScreen      from './src/screens/PlayScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import TopBar           from './src/components/TopBar';
import MissionPopup      from './src/components/MissionPopup';
import FloatingActionButton from './src/components/FloatingActionButton';
import HelpScreen       from './src/screens/HelpScreen';
import AnnouncementBanner from './src/components/AnnouncementBanner';
import MaintenanceScreen from './src/components/MaintenanceScreen';
import FamilyScreen from './src/screens/family/FamilyScreen';
import ChildProgressScreen from './src/screens/family/ChildProgressScreen';
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
const NO_TOPBAR_ROUTES = new Set(['Login', 'MultiStepOnboarding']);

function AppInner() {
  const { colors: c } = useTheme();
  const navigationRef = useRef(null);
  const [initialRoute, setInitialRoute] = React.useState(null);
  const [showTopBar, setShowTopBar] = React.useState(true);
  const [currentRouteName, setCurrentRouteName] = React.useState(null);

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

    // app.json's "orientation": "portrait" is a manifest hint that iPad
    // (and Expo Go generally) doesn't reliably honor on its own — nothing
    // in this app's layout was built for landscape, so lock it for real.
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  React.useEffect(() => {
    // Check auth state on launch
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
          }}>
          <Stack.Screen name="Login"               component={LoginScreen} />
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
          <Stack.Screen name="Help"                component={HelpScreen} />
        </Stack.Navigator>
        <MissionsOverlay />
        {showTopBar && <FloatingActionButton currentScreen={currentRouteName} />}
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
        <RemoteConfigProvider>
          <UserProgressProvider>
            <FabPositionProvider>
              <TourProvider>
                <AppInner />
              </TourProvider>
            </FabPositionProvider>
          </UserProgressProvider>
        </RemoteConfigProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
