// App.js
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { UserProgressProvider } from './context/UserProgressContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import HomeScreen    from './src/screens/HomeScreen';
import GamesScreen   from './src/screens/GamesScreen';
import LibraryNav    from './src/screens/library/LibraryNav';

import LoginScreen        from './src/screens/LoginScreen';
import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import Onboarding      from './src/screens/OnboardingScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import PlayScreen      from './src/screens/PlayScreen';
import TopBar           from './src/components/TopBar';
import MissionPopup      from './src/components/MissionPopup';
import { useUserProgress } from './context/UserProgressContext';
import { supabase } from './src/api/supabaseClient';


// NOTE: OnboardingScreen.js (life-areas / commandCenterService), ProfileQuickSetup.js,
// and ChildInviteCode.js are retired by this rebuild — OnboardingScreen.js was already
// orphaned (unreferenced), and ProfileQuickSetup's fields now live in Onboarding.js /
// SettingsScreen.js under one consistent `profiles` schema. Parent/child invite flow
// was dropped per product decision — restore ChildInviteCode + its Stack.Screen if that
// feature comes back.

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:    { active: 'home',       inactive: 'home-outline' },
  Games:   { active: 'game-controller', inactive: 'game-controller-outline' },
  Library: { active: 'book',       inactive: 'book-outline' },
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
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          height: Platform.OS === 'ios' ? 84 : 60,
        },
        tabBarActiveTintColor:   c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}

    >
      <Tab.Screen name="Library" component={LibraryNav} />
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Games"   component={GamesScreen} />
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

function AppInner() {
  const { colors: c } = useTheme();
  const navigationRef = useRef(null);
  const [initialRoute, setInitialRoute] = React.useState(null);

  React.useEffect(() => {
    // Check auth state on launch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setInitialRoute('Login');
        return;
      }
      // Logged in — check onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      const needsOnboarding = !profile || profile.onboarding_completed !== true;
      setInitialRoute(needsOnboarding ? 'MultiStepOnboarding' : 'MainTabs');
    });
  }, []);

  if (!initialRoute) return null; // splash while checking

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.headerBg }} edges={['top']}>
        <TopBar />
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
        </Stack.Navigator>
        <MissionsOverlay />
      </SafeAreaView>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProgressProvider>
          <AppInner />
        </UserProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
