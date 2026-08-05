// App.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// remove direct createClient usage — import the client you made
import { supabase } from './src/api/supabaseClient';

// Context & UI
import { UserProgressProvider, useUserProgress } from './context/UserProgressContext';
import TopBar from './src/components/TopBar';
import HomeScreen from './src/screens/HomeScreen';
import ClassesStack from './src/screens/ClassesStack';
import LibraryNav from './src/screens/library/LibraryNav';
import MissionPopup from './src/components/MissionPopup';

// MissionsOverlay: lives inside UserProgressProvider so it can read context
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
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileQuickSetup from './src/screens/ProfileQuickSetup';
import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import PlayScreen from './src/screens/PlayScreen';
import ParentHome from './src/screens/ParentHome';
import ChildDashboard from './src/screens/ChildDashboard';
import AddChildByCode from './src/screens/AddChildByCode';
import ChildInviteCode from './src/screens/ChildInviteCode';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

function Placeholder({ name }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{name} Screen</Text>
    </View>
  );
}

/* Keep your Tab navigator as a separate component so we can push full-screen flows */
function MainTabs() {
  // All tabs — Login gate is handled at the Stack level in App, not here
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryNav} />
      <Tab.Screen name="Classes" component={ClassesStack} />
      <Tab.Screen name="Parent"  component={ParentStackScreen} options={{ title: 'Parent' }} />
    </Tab.Navigator>
  );
}

const ParentStack = createNativeStackNavigator();

function ParentStackScreen() {
  return (
    <ParentStack.Navigator>
      <ParentStack.Screen 
        name="ParentHome" 
        component={ParentHome} 
        options={{ title: 'Parent Portal' }} 
      />
      <ParentStack.Screen 
        name="ChildDashboard" 
        component={ChildDashboard} 
        options={{ title: 'Child Dashboard' }} 
      />
      <ParentStack.Screen 
        name="AddChildByCode" 
        component={AddChildByCode} 
        options={{ title: 'Add Child' }} 
      />
      <ParentStack.Screen 
        name="ChildInviteCode" 
        component={ChildInviteCode} 
        options={{ title: 'Child Code' }} 
      />
    </ParentStack.Navigator>
  );
}



export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const prevUserRef = useRef(null);


  
  useEffect(() => {
    // setup listener
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // initial session check
    
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoadingAuth(false);
    }).catch(err => {
      console.error('getSession error', err);
      setLoadingAuth(false);
    });

    return () => {
      try { listener.subscription.unsubscribe(); } catch (e) {}
    };
  }, []);

  // optional: respond to first login (no forced navigation)
  useEffect(() => {
    if (!prevUserRef.current && user) {
      console.log('[App] user logged in — no forced navigation (guest can still play)');
    }
    prevUserRef.current = user;
  }, [user]);

  if (loadingAuth) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>Loading auth...</Text>
      </View>
    );
  }

  return (
    <UserProgressProvider>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaView style={{ flex: 1 }}>
          <TopBar />
          {/* Use a Stack so onboarding/modal flows can replace the whole UI */}
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Gate: show Login for unauthenticated users, tabs for authenticated */}
            {user ? (
              <Stack.Screen name="MainTabs" component={MainTabs} />
            ) : (
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
            )}

            {/* Full-screen flows */}
            <Stack.Screen name="MultiStepOnboarding" component={MultiStepOnboarding} />
            <Stack.Screen name="ProfileQuickSetup" component={ProfileQuickSetup} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Play" component={PlayScreen} />
            <Stack.Screen name="ChildInviteCode" component={ChildInviteCode} />
          </Stack.Navigator>

          <MissionsOverlay />
        </SafeAreaView>
      </NavigationContainer>
    </UserProgressProvider>
  );
}
