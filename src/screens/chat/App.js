// App.js — wrap everything in ThemeProvider
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { UserProgressProvider, useUserProgress } from './context/UserProgressContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import HomeScreen          from './src/screens/HomeScreen';
import LibraryScreen       from './src/screens/LibraryScreen';
import LibraryNav          from './src/screens/library/LibraryNav';
import ClassesStack        from './src/screens/ClassesStack';
import ParentHome          from './src/screens/ParentHome';
import LoginScreen         from './src/screens/LoginScreen';
import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import ProfileQuickSetup   from './src/screens/ProfileQuickSetup';
import ProfileScreen       from './src/screens/ProfileScreen';
import PlayScreen          from './src/screens/PlayScreen';
import ChildInviteCode     from './src/screens/ChildInviteCode';
import TopBar              from './src/components/TopBar';
import MissionPopup        from './src/components/MissionPopup';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// Tab icons
const TAB_ICONS = {
  Home:    { active: 'home',        inactive: 'home-outline' },
  Library: { active: 'book',        inactive: 'book-outline' },
  Classes: { active: 'school',      inactive: 'school-outline' },
  Parent:  { active: 'people',      inactive: 'people-outline' },
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
        },
        tabBarActiveTintColor:   c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryNav} />
      <Tab.Screen name="Classes" component={ClassesStack} />
      <Tab.Screen name="Parent"  component={ParentHome} options={{ title: 'Parent' }} />
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
  const [user, setUser] = useState(null);

  // Auth state is handled inside UserProgressContext
  // Here we just get the user from context for the stack gate
  const { user: ctxUser } = useUserProgress();

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.headerBg }} edges={['top']}>
        <TopBar />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {ctxUser ? (
            <Stack.Screen name="MainTabs" component={MainTabs} />
          ) : (
            <Stack.Screen name="MainTabs" component={MainTabs} />
          )}
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
    <ThemeProvider>
      <UserProgressProvider>
        <AppInner />
      </UserProgressProvider>
    </ThemeProvider>
  );
}
