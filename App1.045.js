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

import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import ProfileQuickSetup   from './src/screens/ProfileQuickSetup';
import ProfileScreen       from './src/screens/ProfileScreen';
import PlayScreen          from './src/screens/PlayScreen';
import ChildInviteCode     from './src/screens/ChildInviteCode';
import TopBar              from './src/components/TopBar';
import MissionPopup        from './src/components/MissionPopup';
import { useUserProgress } from './context/UserProgressContext';

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
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Games"   component={GamesScreen} />
      <Tab.Screen name="Library" component={LibraryNav} />
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

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.headerBg }} edges={['top']}>
        <TopBar />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs"            component={MainTabs} />
          <Stack.Screen name="MultiStepOnboarding" component={MultiStepOnboarding} />
          <Stack.Screen name="ProfileQuickSetup"   component={ProfileQuickSetup} />
          <Stack.Screen name="Profile"             component={ProfileScreen} />
          <Stack.Screen name="Play"                component={PlayScreen} />
          <Stack.Screen name="ChildInviteCode"     component={ChildInviteCode} />
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
