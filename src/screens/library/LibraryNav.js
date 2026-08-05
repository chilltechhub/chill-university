// src/screens/library/LibraryNav.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../../../context/ThemeContext';

// Main screens
import LibraryScreen   from './LibraryScreen';
import OnboardingScreen from '../OnboardingScreen';
import LifeAreaScreen  from './LifeAreaScreen';
import CaptureInbox    from '../CaptureInbox';

// Classes
import ClassesStack from '../ClassesStack';

//planner
import PlannerScreen from '../PlannerScreen';

// Academic & Career
import CareerExplorationScreen from './careerexplore';
import PortfolioScreen         from './portfolio';
import ProjectsScreen          from './projects';
import LabsScreen              from './labs';
import ResearchScreen          from './research';

// Discover
import DiscoverScreen       from './discover/DiscoverScreen';
import BreakthroughsScreen  from './discover/BreakthroughsScreen';
import FellowScholarsScreen from './discover/FellowScholarsScreen';
import TopTalentScreen      from './discover/TopTalentScreen';
import MentorsScreen        from './discover/MentorsScreen';

// Knowledge Hub
import IdeaGardenScreen    from './ideagarden';
import NotesScreen         from './notes';
import ResourcesToolsScreen from './resourcetools';

// Wellness
import NutritionScreen from './wellness/NutritionScreen';
import ExerciseScreen  from './wellness/ExerciseScreen';
import WellbeingScreen from './wellness/WellbeingScreen';
import SelfCareScreen  from './wellness/SelfCareScreen';
import HobbiesScreen   from './wellness/HobbiesScreen';

// Connections
import RelationshipsScreen from './connections/RelationshipsScreen';
import NetworkScreen       from './connections/NetworkScreen';
import PrivacyScreen       from './connections/PrivacyScreen';
import SecurityScreen      from './connections/SecurityScreen';

const Stack = createStackNavigator();

export default function LibraryNavigator() {
  const { colors: c } = useTheme();

  const headerStyle = {
    backgroundColor: c.headerBg,
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  };

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerStyle,
        headerTintColor: c.teal,
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: c.text1 },
        headerBackTitleVisible: false,
      }}
    >
      {/* Main — no header, has its own */}
      <Stack.Screen name="LibraryScreen"   component={LibraryScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} options={{ headerShown: false }} />

      {/* Life area */}
      <Stack.Screen name="LifeAreaScreen" component={LifeAreaScreen}
        options={({ route }) => ({
          title: route.params?.areaId
            ? route.params.areaId.charAt(0).toUpperCase() + route.params.areaId.slice(1)
            : 'Life Area',
          headerTitleStyle: { fontWeight: '700', color: c.gold },
        })}
      />

      <Stack.Screen name="PlannerScreen" component={PlannerScreen} options={{ headerShown: false }} />
      {/* Inbox */}
      <Stack.Screen name="CaptureInbox" component={CaptureInbox} options={{ title: 'Capture Inbox' }} />

      {/* Academic & Career */}
      <Stack.Screen name="ProjectsScreen"          component={ProjectsScreen}          options={{ title: 'Your Projects' }} />
      <Stack.Screen name="LabsScreen"              component={LabsScreen}              options={{ title: 'Labs' }} />
      <Stack.Screen name="PortfolioScreen"         component={PortfolioScreen}         options={{ title: 'Portfolio' }} />
      <Stack.Screen name="ResearchScreen"          component={ResearchScreen}          options={{ title: 'Research' }} />
      <Stack.Screen name="CareerExplorationScreen" component={CareerExplorationScreen} options={{ title: 'Career Explorer' }} />

      {/* Discover */}
      <Stack.Screen name="DiscoverScreen"      component={DiscoverScreen}      options={{ title: 'Discover' }} />
      <Stack.Screen name="BreakthroughsScreen" component={BreakthroughsScreen} options={{ title: 'Breakthroughs' }} />
      <Stack.Screen name="FellowScholarsScreen"component={FellowScholarsScreen}options={{ title: 'Fellow Scholars' }} />
      <Stack.Screen name="TopTalentScreen"     component={TopTalentScreen}     options={{ title: 'Top Talent' }} />
      <Stack.Screen name="MentorsScreen"       component={MentorsScreen}       options={{ title: 'Mentors & Experts' }} />

      {/* Knowledge Hub */}
      <Stack.Screen name="IdeaGardenScreen"    component={IdeaGardenScreen}    options={{ title: 'Idea Garden' }} />
      <Stack.Screen name="NotesScreen"         component={NotesScreen}         options={{ title: 'Notes' }} />
      <Stack.Screen name="ResourcesToolsScreen"component={ResourcesToolsScreen}options={{ title: 'Resources & Tools' }} />
        
      {/* Classes */}
      <Stack.Screen name="ClassesStack" component={ClassesStack} options={{ headerShown: false }} />

      {/* Wellness */}
      <Stack.Screen name="NutritionScreen" component={NutritionScreen} options={{ title: 'Nutrition' }} />
      <Stack.Screen name="ExerciseScreen"  component={ExerciseScreen}  options={{ title: 'Exercise' }} />
      <Stack.Screen name="WellbeingScreen" component={WellbeingScreen} options={{ title: 'Well-being' }} />
      <Stack.Screen name="SelfCareScreen"  component={SelfCareScreen}  options={{ title: 'Self-care' }} />
      <Stack.Screen name="HobbiesScreen"   component={HobbiesScreen}   options={{ title: 'Hobbies & Interests' }} />

      {/* Connections */}
      <Stack.Screen name="RelationshipsScreen" component={RelationshipsScreen} options={{ title: 'Relationships' }} />
      <Stack.Screen name="NetworkScreen"       component={NetworkScreen}       options={{ title: 'Network' }} />
      <Stack.Screen name="PrivacyScreen"       component={PrivacyScreen}       options={{ title: 'Privacy' }} />
      <Stack.Screen name="SecurityScreen"      component={SecurityScreen}      options={{ title: 'Security' }} />
    </Stack.Navigator>
  );
}
