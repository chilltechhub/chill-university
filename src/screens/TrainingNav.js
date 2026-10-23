// src/screens/TrainingNav.js
// The Training tab, shown as "Learn" since 2026-10-18: the games screen
// (Classes first on it, games as Practice), with Classes stacked on it. The
// games screen stays the root: the pet finds coins there (useCoinRewards),
// so it must be mounted from launch.
//
// Classes used to live in the Library (Library → Knowledge → Academy
// Classes). Learning sits with the games and drills now, so the app keeps
// three tabs and the Library holds fewer things (2026-10-14).
//
// The first screen is 'TrainingHome', not 'Training': a screen named like
// the tab it sits in draws a React Navigation warning and makes
// navigate('Training') ambiguous. App.js reports 'TrainingHome' as
// 'Training' (routeLabel), so tutorials, the guide and everything else
// keyed on 'Training' are unchanged.

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import GamesScreen from './GamesScreen';
import ClassesStack from './ClassesStack';
import { rootStackRouter } from '../logic/navRules';
import { useAccess } from '../../context/AccessContext';
import useTabsV2 from '../logic/useTabsV2';
import { gatedScreen } from '../components/FeatureGate';

// Practice: the games, on top of Learn (shake-up P4). Gated like the games
// were, so a locked shelf shows its lock, not the games.
const GatedPractice = gatedScreen('training', GamesScreen);

const Stack = createStackNavigator();

export default function TrainingNav() {
  // Classes picked without the games ("Just my picks"): the tab opens on
  // Classes instead of a games screen they didn't ask for.
  // With the new tabs, Learn is also your path and Finds: it always opens there.
  const { isFeatureShown } = useAccess();
  const [tabsV2] = useTabsV2();
  return (
    <Stack.Navigator
      initialRouteName={tabsV2 || isFeatureShown('training') ? 'TrainingHome' : 'ClassesStack'}
      // Going to a screen already open goes back to it (navRules.js).
      UNSTABLE_router={rootStackRouter}
      screenOptions={{ headerShown: false, gestureEnabled: true, ...TransitionPresets.SlideFromRightIOS }}
    >
      <Stack.Screen name="TrainingHome" component={GamesScreen} options={{ title: 'Learn' }} />
      <Stack.Screen name="Practice" component={GatedPractice} options={{ title: 'Practice' }} />
      <Stack.Screen name="ClassesStack" component={ClassesStack} />
    </Stack.Navigator>
  );
}
