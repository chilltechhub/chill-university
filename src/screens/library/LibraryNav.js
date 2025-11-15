// src/navigation/LibraryNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LibraryScreen from '../LibraryScreen';

// Academic & Career Screens
import CareerExplorationScreen from './careerexplore';
import PortfolioScreen from './portfolio';
import ProjectsScreen from './projects';
import LabsScreen from './labs'; // You'll need to create this
import ResearchScreen from './research'; // You'll need to create this

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
import NotesScreen from './notes'; // You'll need to create this
import ResourcesToolsScreen from './resourcetools';

// Wellness Screens
import NutritionScreen from './wellness/NutritionScreen'; // You'll need to create this
import ExerciseScreen from './wellness/ExerciseScreen'; // You'll need to create this
import WellbeingScreen from './wellness/WellbeingScreen'; // You'll need to create this
import SelfCareScreen from './wellness/SelfCareScreen'; // You'll need to create this
import HobbiesScreen from './wellness/HobbiesScreen'; // You'll need to create this

// Connections & Security Screens
import RelationshipsScreen from './connections/RelationshipsScreen'; // You'll need to create this
import NetworkScreen from './connections/NetworkScreen'; // You'll need to create this
import PrivacyScreen from './connections/PrivacyScreen'; // You'll need to create this
import SecurityScreen from './connections/SecurityScreen'; // You'll need to create this

const Stack = createStackNavigator();

export default function LibraryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5E5',
        },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      {/* Main Library */}
      <Stack.Screen 
        name="LibraryScreen" 
        component={LibraryScreen} 
        options={{ title: 'Library' }} 
      />

      {/* Academic & Career */}
      <Stack.Screen 
        name="CareerExplorationScreen" 
        component={CareerExplorationScreen} 
        options={{ title: 'Career Exploration' }} 
      />
      <Stack.Screen 
        name="PortfolioScreen" 
        component={PortfolioScreen} 
        options={{ title: 'Portfolio' }} 
      />
      <Stack.Screen 
        name="ProjectsScreen" 
        component={ProjectsScreen} 
        options={{ title: 'Your Projects' }} 
      />
      <Stack.Screen 
        name="LabsScreen" 
        component={LabsScreen} 
        options={{ title: 'Labs' }} 
      />
      <Stack.Screen 
        name="ResearchScreen" 
        component={ResearchScreen} 
        options={{ title: 'Research' }} 
      />

      {/* Discover Section */}
      <Stack.Screen 
        name="DiscoverScreen" 
        component={DiscoverScreen} 
        options={{ title: 'Discover' }} 
      />
      <Stack.Screen
        name="DiscoverPScreen"
        component={DiscoverPScreen}
        options={{ title: 'Discover Projects' }}
      />
      <Stack.Screen
        name="ProjectDetailScreen"
        component={ProjectDetailScreen}
        options={{ title: 'Project Details' }}
      />
      <Stack.Screen 
        name="BreakthroughsScreen" 
        component={BreakthroughsScreen} 
        options={{ title: 'Breakthroughs' }} 
      />
      <Stack.Screen 
        name="FellowScholarsScreen" 
        component={FellowScholarsScreen} 
        options={{ title: 'Fellow Scholars' }} 
      />
      <Stack.Screen 
        name="TopTalentScreen" 
        component={TopTalentScreen} 
        options={{ title: 'Top Talent' }} 
      />
      <Stack.Screen 
        name="MentorsScreen" 
        component={MentorsScreen} 
        options={{ title: 'Mentors & Experts' }} 
      />

      {/* Knowledge Hub */}
      <Stack.Screen 
        name="IdeaGardenScreen" 
        component={IdeaGardenScreen} 
        options={{ title: 'Idea Garden' }} 
      />
      <Stack.Screen 
        name="NotesScreen" 
        component={NotesScreen} 
        options={{ title: 'Notes' }} 
      />
      <Stack.Screen 
        name="ResourcesToolsScreen" 
        component={ResourcesToolsScreen} 
        options={{ title: 'Resources & Tools' }} 
      />

      {/* Wellness */}
      <Stack.Screen 
        name="NutritionScreen" 
        component={NutritionScreen} 
        options={{ title: 'Nutrition' }} 
      />
      <Stack.Screen 
        name="ExerciseScreen" 
        component={ExerciseScreen} 
        options={{ title: 'Exercise & Movement' }} 
      />
      <Stack.Screen 
        name="WellbeingScreen" 
        component={WellbeingScreen} 
        options={{ title: 'Emotional Well-being' }} 
      />
      <Stack.Screen 
        name="SelfCareScreen" 
        component={SelfCareScreen} 
        options={{ title: 'Self-care' }} 
      />
      <Stack.Screen 
        name="HobbiesScreen" 
        component={HobbiesScreen} 
        options={{ title: 'Hobbies & Interests' }} 
      />

      {/* Connections & Security */}
      <Stack.Screen 
        name="RelationshipsScreen" 
        component={RelationshipsScreen} 
        options={{ title: 'Relationships' }} 
      />
      <Stack.Screen 
        name="NetworkScreen" 
        component={NetworkScreen} 
        options={{ title: 'Network' }} 
      />
      <Stack.Screen 
        name="PrivacyScreen" 
        component={PrivacyScreen} 
        options={{ title: 'Privacy Settings' }} 
      />
      <Stack.Screen 
        name="SecurityScreen" 
        component={SecurityScreen} 
        options={{ title: 'Security' }} 
      />
    </Stack.Navigator>
  );
}