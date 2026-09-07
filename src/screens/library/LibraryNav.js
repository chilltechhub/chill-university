// src/screens/library/LibraryNav.js
import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useTheme } from '../../../context/ThemeContext';

// Main screens
import LibraryScreen   from './LibraryScreen';
import OnboardingScreen from '../OnboardingScreen';
import LifeAreaScreen  from './LifeAreaScreen';
import CaptureInbox    from '../CaptureInbox';
import ImportScreen    from '../ImportScreen';
import WorkModeScreen   from '../WorkModeScreen';
import WeeklyReviewScreen from '../WeeklyReviewScreen';

// Classes
import ClassesStack from '../ClassesStack';

//planner
import PlannerScreen from '../PlannerScreen';

// Academic & Career
import CareerExplorationScreen from './careerexplore';
import PortfolioScreen         from './portfolio';
import ProjectsScreen          from './projects';
import ProjectDetailScreen     from './ProjectDetail';
import LabsScreen              from './labs';

// Discover
import DiscoverScreen       from './discover/DiscoverScreen';
import CommunityFeedScreen  from './discover/CommunityFeedScreen';
import ModerationQueueScreen from './discover/ModerationQueueScreen';
import FellowScholarsScreen from './discover/FellowScholarsScreen';
import MentorsScreen        from './discover/MentorsScreen';

// Knowledge Hub
import IdeaGardenScreen    from './ideagarden';
import KnowledgeScreen     from './knowledge';

import AreaSectionScreen from './AreaSectionScreen';


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
        // Each Library screen owns its content header. This avoids a second,
        // oversized navigation bar above screens such as Projects, Notes, and Research.
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerStyle,
        headerTintColor: c.teal,
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: c.text1 },
        headerBackTitleVisible: false,
        // Same explicit slide as the root stack (App.js) and ClassesStack —
        // one consistent transition for every push in the app, not whatever
        // each platform's default happens to be.
        ...TransitionPresets.SlideFromRightIOS,
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
      <Stack.Screen name="WorkModeScreen" component={WorkModeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WeeklyReviewScreen" component={WeeklyReviewScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ImportScreen" component={ImportScreen} options={{ headerShown: false }} />

      {/* Academic & Career */}
      <Stack.Screen name="ProjectsScreen"          component={ProjectsScreen}          options={{ title: 'The Workshop' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Build' }} />
      <Stack.Screen name="LabsScreen"              component={LabsScreen}              options={{ title: 'Labs' }} /> 
      <Stack.Screen name="PortfolioScreen"         component={PortfolioScreen}         options={{ title: 'Portfolio' }} />
      <Stack.Screen name="CareerExplorationScreen" component={CareerExplorationScreen} options={{ title: 'Career Explorer' }} />

      {/* Discover */}
      <Stack.Screen name="DiscoverScreen"      component={DiscoverScreen}      options={{ title: 'Discover' }} />
      <Stack.Screen name="CommunityFeedScreen" component={CommunityFeedScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="ModerationQueueScreen" component={ModerationQueueScreen} options={{ title: 'Moderation' }} />
      <Stack.Screen name="FellowScholarsScreen"component={FellowScholarsScreen}options={{ title: 'Fellow Scholars' }} />
      <Stack.Screen name="MentorsScreen"       component={MentorsScreen}       options={{ title: 'Mentors & Experts' }} />

      {/* Knowledge Hub */}
      <Stack.Screen name="IdeaGardenScreen"    component={IdeaGardenScreen}    options={{ title: 'Idea Garden' }} />
      <Stack.Screen name="KnowledgeScreen"     component={KnowledgeScreen}     options={{ title: 'Knowledge Vault' }} />
      {/* Notes Desk, the Research Vault, and Resources & Instruments merged
          into the Knowledge Vault. Their route names stay registered — every
          existing link to them (Capture Inbox destinations, Home's study
          picker, life-area sections, item cross-links, the guided tour) keeps
          working and just lands on the matching type filter. */}
      <Stack.Screen name="NotesScreen"          component={KnowledgeScreen} options={{ title: 'Notes' }}               initialParams={{ initialType: 'note' }} />
      <Stack.Screen name="ResearchScreen"       component={KnowledgeScreen} options={{ title: 'Research' }}            initialParams={{ initialType: 'all' }} />
      <Stack.Screen name="ResourcesToolsScreen" component={KnowledgeScreen} options={{ title: 'Resources & Tools' }}   initialParams={{ initialType: 'tool' }} />
        
      {/* Classes */}
      <Stack.Screen name="ClassesStack" component={ClassesStack} options={{ headerShown: false }} />

{/* Sub-sections */}
<Stack.Screen name="SleepRecoveryScreen"     component={AreaSectionScreen} options={{ title: 'Sleep & Recovery' }} />
<Stack.Screen name="EnergyVitalityScreen"    component={AreaSectionScreen} options={{ title: 'Energy & Vitality' }} />
<Stack.Screen name="StressAnxietyScreen"     component={AreaSectionScreen} options={{ title: 'Stress & Anxiety' }} />
<Stack.Screen name="TherapySupportScreen"    component={AreaSectionScreen} options={{ title: 'Therapy & Support' }} />
<Stack.Screen name="CommunicationScreen"     component={AreaSectionScreen} options={{ title: 'Communication' }} />
<Stack.Screen name="SocialHealthScreen"      component={AreaSectionScreen} options={{ title: 'Social Health' }} />
<Stack.Screen name="IncomeEarningsScreen"    component={AreaSectionScreen} options={{ title: 'Income & Earnings' }} />
<Stack.Screen name="BudgetSpendingScreen"    component={AreaSectionScreen} options={{ title: 'Budget & Spending' }} />
<Stack.Screen name="SavingsInvestingScreen"  component={AreaSectionScreen} options={{ title: 'Savings & Investing' }} />
<Stack.Screen name="DebtCreditScreen"        component={AreaSectionScreen} options={{ title: 'Debt & Credit' }} />
<Stack.Screen name="ArtMusicScreen"          component={AreaSectionScreen} options={{ title: 'Art & Music' }} />
<Stack.Screen name="ContentMediaScreen"      component={AreaSectionScreen} options={{ title: 'Content & Media' }} />
<Stack.Screen name="LearningCuriosityScreen" component={AreaSectionScreen} options={{ title: 'Learning & Curiosity' }} />
<Stack.Screen name="BusinessVenturesScreen"  component={AreaSectionScreen} options={{ title: 'Business & Ventures' }} />
<Stack.Screen name="PurposeValuesScreen"     component={AreaSectionScreen} options={{ title: 'Purpose & Values' }} />
<Stack.Screen name="ReflectionPrayerScreen"  component={AreaSectionScreen} options={{ title: 'Reflection & Prayer' }} />
<Stack.Screen name="PhilosophyWisdomScreen"  component={AreaSectionScreen} options={{ title: 'Philosophy & Wisdom' }} />
<Stack.Screen name="CommunityFaithScreen"    component={AreaSectionScreen} options={{ title: 'Community & Faith' }} />
<Stack.Screen name="ScreenTimeFocusScreen"   component={AreaSectionScreen} options={{ title: 'Screen Time & Focus' }} />
<Stack.Screen name="ToolsSystemsScreen"      component={AreaSectionScreen} options={{ title: 'Tools & Systems' }} />
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
