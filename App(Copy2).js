// App.js
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Supabase client
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Context
import { UserProgressProvider } from './context/UserProgressContext';

// Components & Screens
import TopBar from './src/components/TopBar';
import HomeScreen from './src/screens/HomeScreen';
import ClassesStack from './src/screens/ClassesStack';
import LibraryNav from './src/screens/library/LibraryNav';
import TestScreen from './src/screens/TestScreen';
import MissionPopup from './src/components/MissionPopup';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function Placeholder({ name }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{name} Screen</Text>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const prevUserRef = useRef(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Auth listener
  useEffect(() => {
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      prevUserRef.current = user; // store previous value for comparison
      setUser(newUser);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => authListener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to user login transition: null -> non-null
  useEffect(() => {
    // prevUserRef.current holds the previous user value (may be stale at very first render)
    // Compare and navigate if necessary
    if (prevUserRef.current === null && user) {
      // Wait one tick so navigator has re-rendered and the Profile tab is registered
      // Using requestAnimationFrame ensures a render tick has passed
      requestAnimationFrame(() => {
        if (navigationRef.isReady() && navigationRef.current?.navigate) {
          // Navigate to Profile tab now that it's registered
          navigationRef.current.navigate('Profile');
        }
      });
    }
    // update prevUserRef for next comparison
    prevUserRef.current = user;
  }, [user]);

  const sampleMission = {
    title: 'First Steps',
    description: 'Welcome to your journey! Tap to begin.',
    progress: { current: 0, total: 1 },
    reward: 50,
  };

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading auth...</Text>
      </View>
    );
  }

  return (
    <UserProgressProvider>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Top bar: Rank & Points */}
          <TopBar />

          {/* Main Tab Navigation */}
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            {/* Public tab: always accessible */}
            <Tab.Screen name="Home" component={HomeScreen} />

            {/* Protected tabs: only visible if logged in */}
            {user ? (
              <>
                <Tab.Screen name="Classes" component={ClassesStack} />
                <Tab.Screen name="Library" component={LibraryNav} />
                <Tab.Screen name="Clubs & Events" component={TestScreen} />
                <Tab.Screen name="Food & Lounge" children={() => <Placeholder name="Food & Lounge" />} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
              </>
            ) : (
              // Show a Login tab so the user can sign in
              <Tab.Screen name="Login" component={LoginScreen} />
            )}
          </Tab.Navigator>

          {/* Mission Popup overlay */}
          <MissionPopup visible={false} onClose={() => {}} mission={sampleMission} />
        </SafeAreaView>
      </NavigationContainer>
    </UserProgressProvider>
  );
}
