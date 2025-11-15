import React, { useState } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Context
import { UserProgressProvider } from './context/UserProgressContext';

// Components & Screens
import TopBar from './src/components/TopBar';
import HomeScreen from './src/screens/HomeScreen';
import Classes from './src/screens/Classes';
import LibraryScreen from './src/screens/LibraryScreen';
import MissionPopup from './src/components/MissionPopup';
import ClassesStack from './src/screens/ClassesStack';
import LibraryNav from './src/screens/library/LibraryNav';
import TestScreen from './src/screens/TestScreen';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


const Tab = createBottomTabNavigator();

function Placeholder({ name }) {
  return (
    <View style={{ flex: 1, justifyContent: 'left', alignItems: 'center' }}>
      <Text>{name} Screen</Text>
    </View>
  );
}

export default function App() {
  const [missionVisible, setMissionVisible] = useState(false);

  const sampleMission = {
    title: 'First Steps',
    description: 'Welcome to your journey! Tap to begin.',
    progress: { current: 0, total: 1 },
    reward: 50,
  };

  return (
    <UserProgressProvider>
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Top bar: Rank & Points */}
          <TopBar />

          {/* Main Tab Navigation */}
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Classes" component={ClassesStack} />
            <Tab.Screen name="Library" component={LibraryNav} />
           <Tab.Screen name="Clubs & Events" component={TestScreen} />
          <Tab.Screen name="Food & Lounge" children={() => <Placeholder name="Food & Lounge" />} />
          </Tab.Navigator>

          {/* Mission Popup overlay */}
          <MissionPopup
            visible={missionVisible}
            onClose={() => setMissionVisible(false)}
            mission={sampleMission}
          />
        </SafeAreaView>
      </NavigationContainer>
    </UserProgressProvider>
  );
}
