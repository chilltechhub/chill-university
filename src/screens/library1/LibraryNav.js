// library/LibraryNav.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LibraryScreen from '../LibraryScreen';
import OnboardingScreen from './OnboardingScreen';
import LifeAreaScreen from './LifeAreaScreen';


//Classes
import ClassesStack from '../ClassesStack';

// Academic & Career Screens
import CareerExplorationScreen from './careerexplore';
import PortfolioScreen from './portfolio';
import ProjectsScreen from './projects';
import LabsScreen from './labs';
import ResearchScreen from './research';

// Discover Section
import DiscoverScreen from './discover/DiscoverScreen';
import BreakthroughsScreen from './discover/BreakthroughsScreen';
import FellowScholarsScreen from './discover/FellowScholarsScreen';
import TopTalentScreen from './discover/TopTalentScreen';
import MentorsScreen from './discover/MentorsScreen';
import DiscoverPScreen from './discover/projects/DiscoverPSceeen';
import ProjectDetailScreen from './discover/projects/ProjectDetailScreen';

// Knowledge Hub Screens
import IdeaGardenScreen from './ideagarden';
import NotesScreen from './notes';
import ResourcesToolsScreen from './resourcetools';

// Wellness Screens
import NutritionScreen from './wellness/NutritionScreen';
import ExerciseScreen from './wellness/ExerciseScreen';
import WellbeingScreen from './wellness/WellbeingScreen';
import SelfCareScreen from './wellness/SelfCareScreen';
import HobbiesScreen from './wellness/HobbiesScreen';

// Connections & Security Screens
import RelationshipsScreen from './connections/RelationshipsScreen';
import NetworkScreen from './connections/NetworkScreen';
import PrivacyScreen from './connections/PrivacyScreen';
import SecurityScreen from './connections/SecurityScreen';

import CaptureInbox from '../CaptureInbox';

const Stack = createStackNavigator();

export default function LibraryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0e1a2e',
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: '#243850',
        },
        headerTintColor: '#f5edd6',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
          color: '#f5edd6',
        },
      }}
    >
      {/* Main Library */}
      <Stack.Screen
        name="LibraryScreen"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />

      {/* Onboarding — no header */}
      <Stack.Screen
        name="OnboardingScreen"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />

      {/* Life Area dedicated screen */}
      <Stack.Screen
        name="LifeAreaScreen"
        component={LifeAreaScreen}
        options={({ route }) => ({
          title: route.params?.areaId ? route.params.areaId.charAt(0).toUpperCase() + route.params.areaId.slice(1) : 'Life Area',
          headerStyle: { backgroundColor: '#0e1a2e', shadowOpacity: 0, elevation: 0, borderBottomWidth: 0.5, borderBottomColor: '#243850' },
          headerTintColor: '#f5edd6',
          headerTitleStyle: { fontWeight: '600', color: '#c9a84c' },
        })}
      />
      <Stack.Screen name="CaptureInbox" component={CaptureInbox} options={{ title: 'Inbox' }} />
      
      {/* Academic & Career */}
      <Stack.Screen name="CareerExplorationScreen" component={CareerExplorationScreen} options={{ title: 'Career Exploration' }} />
      <Stack.Screen name="PortfolioScreen" component={PortfolioScreen} options={{ title: 'Portfolio' }} />
      <Stack.Screen name="ProjectsScreen" component={ProjectsScreen} options={{ title: 'Your Projects' }} />
      <Stack.Screen name="LabsScreen" component={LabsScreen} options={{ title: 'Labs' }} />
      <Stack.Screen name="ResearchScreen" component={ResearchScreen} options={{ title: 'Research' }} />

      {/* Discover */}
      <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} options={{ title: 'Discover' }} />
      <Stack.Screen name="DiscoverPScreen" component={DiscoverPScreen} options={{ title: 'Discover Projects' }} />
      <Stack.Screen name="ProjectDetailScreen" component={ProjectDetailScreen} options={{ title: 'Project Details' }} />
      <Stack.Screen name="BreakthroughsScreen" component={BreakthroughsScreen} options={{ title: 'Breakthroughs' }} />
      <Stack.Screen name="FellowScholarsScreen" component={FellowScholarsScreen} options={{ title: 'Fellow Scholars' }} />
      <Stack.Screen name="TopTalentScreen" component={TopTalentScreen} options={{ title: 'Top Talent' }} />
      <Stack.Screen name="MentorsScreen" component={MentorsScreen} options={{ title: 'Mentors & Experts' }} />

      {/* Knowledge Hub */}
      <Stack.Screen name="IdeaGardenScreen" component={IdeaGardenScreen} options={{ title: 'Idea Garden' }} />
      <Stack.Screen name="NotesScreen" component={NotesScreen} options={{ title: 'Notes' }} />
      <Stack.Screen name="ResourcesToolsScreen" component={ResourcesToolsScreen} options={{ title: 'Resources & Tools' }} />

      {/* Wellness */}
      <Stack.Screen name="NutritionScreen" component={NutritionScreen} options={{ title: 'Nutrition' }} />
      <Stack.Screen name="ExerciseScreen" component={ExerciseScreen} options={{ title: 'Exercise & Movement' }} />
      <Stack.Screen name="WellbeingScreen" component={WellbeingScreen} options={{ title: 'Emotional Well-being' }} />
      <Stack.Screen name="SelfCareScreen" component={SelfCareScreen} options={{ title: 'Self-care' }} />
      <Stack.Screen name="HobbiesScreen" component={HobbiesScreen} options={{ title: 'Hobbies & Interests' }} />



        {/* Classes */}
      <Stack.Screen name="ClassesStack" component={ClassesStack} options={{ headerShown: false }} />
      
      {/* Connections & Security */}
      <Stack.Screen name="RelationshipsScreen" component={RelationshipsScreen} options={{ title: 'Relationships' }} />
      <Stack.Screen name="NetworkScreen" component={NetworkScreen} options={{ title: 'Network' }} />
      <Stack.Screen name="PrivacyScreen" component={PrivacyScreen} options={{ title: 'Privacy Settings' }} />
      <Stack.Screen name="SecurityScreen" component={SecurityScreen} options={{ title: 'Security' }} />
    </Stack.Navigator>
  );
}
