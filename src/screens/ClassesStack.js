// src/screens/ClassesStack.js

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';

import Classes from './Classes';  // your expandable list

// Classroom Day Lesson Plan Builder — separate from the per-topic classes
// above; see LessonBuilder.js for why.
import LessonBuilder from './LessonBuilder';
import MyLessonPlans from './MyLessonPlans';

// Quests: the short learn-research-do lessons (src/data/quests.js).
import QuestScreen from './QuestScreen';
// Topic map: every planned topic, built or not (src/data/topicCatalog.js).
import TopicCatalogScreen from './TopicCatalogScreen';

// Math
import NumbersAndOperations from './classes/mathClass/numbersandoperations';
import AlgebraAndFunctions from './classes/mathClass/algebraandfunctions';
import GeometrySpatialReasoning from './classes/mathClass/geometryspatialreasoning';
import Measurement from './classes/mathClass/measurement';
import DataStatisticsProbability from './classes/mathClass/datastatisticsprobability';
import AdvancedMath from './classes/mathClass/advancedmath';
import EverydayMath from './classes/mathClass/everydaymath';

// Language Arts (folder: languageartClass)
import Reading from './classes/languageartClass/reading';
import Writing from './classes/languageartClass/writing';
import SpeakingAndListening from './classes/languageartClass/speakinglistening';
import Language from './classes/languageartClass/language';
import MediaDigitalLiteracy from './classes/languageartClass/medialiteracy';

// Science (folder: scienceClass)
import AstronomyAndSpace from './classes/scienceClass/space';
import Physics from './classes/scienceClass/physics';
import EarthAndEnvironmental from './classes/scienceClass/earth';
import Chemistry from './classes/scienceClass/chemistry';
import Biology from './classes/scienceClass/biology';
import Oceanography from './classes/scienceClass/oceanography';

// Social Sciences (folder: socialscienceClass)
import History from './classes/socialscienceClass/history';
import Geography from './classes/socialscienceClass/geography';
import CivicsAndGovernment from './classes/socialscienceClass/government';
import PsychologicalAndSociology from './classes/socialscienceClass/psychology';

// Art & Music
import VisualArt from './classes/arts/visualart';
import Music from './classes/arts/music.js';

// Home Economics & Workshop (folder: homeecworkshopClass)
import NutritionAndFood from './classes/homeecworkshopClass/nutrition';
import TextilesAndApparel from './classes/homeecworkshopClass/fashion';
import FamilyAndHumanDevelopment from './classes/homeecworkshopClass/family';
import HouseholdAndResourceManagement from './classes/homeecworkshopClass/house';
import HealthAndWellness from './classes/homeecworkshopClass/health';
import MaterialWorking from './classes/homeecworkshopClass/materialworking';
import Construction from './classes/homeecworkshopClass/construction';
import Automotive from './classes/homeecworkshopClass/automotive';
import ToolSafetyAndShopPractices from './classes/homeecworkshopClass/toolsafety';

// Technology & Engineering
import TechnologyAndEngineering from './classes/technologyEngineeringClass/foundations';

// Foreign Language
import ForeignLanguage from './classes/foreignLanguageClass/spanishFoundations';

// Health & Fitness
import HealthAndFitness from './classes/healthFitnessClass/foundations';

// Business & Finance
import BusinessAndFinance from './classes/businessFinanceClass/foundations';

// Entrepreneur track (adult business-ownership curriculum)
import BusinessArchitecture from './classes/entrepreneurClass/businessArchitecture';
import RetailOperations from './classes/entrepreneurClass/retailOperations';
// The other eight levels are generated from src/data/ownershipCurriculum.js
// rather than hand-written — see LevelScreen.js for why.
import { makeLevelScreen } from './classes/entrepreneurClass/LevelScreen';
import CurriculumModule from './classes/entrepreneurClass/ModuleScreen';
const MoneySystems = makeLevelScreen('L0');
const PersonalSovereignty = makeLevelScreen('L1');
const CapitalFunding = makeLevelScreen('L3A');
const RealEstateAssets = makeLevelScreen('L3B');
const WealthProtection = makeLevelScreen('L4');
const IdeaValidation = makeLevelScreen('S1');
const ProductEngineering = makeLevelScreen('S2');
const GoToMarket = makeLevelScreen('S3');
const VentureScale = makeLevelScreen('S4');
const WorkplaceCompliance = makeLevelScreen('W1');

const Stack = createStackNavigator();

export default function ClassesStack() {
  return (
    <Stack.Navigator
      initialRouteName="ClassesMain"
      screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}
    >
      <Stack.Screen name="ClassesMain" component={Classes} />

      {/* Classroom Day Lesson Plan Builder */}
      <Stack.Screen name="LessonBuilder" component={LessonBuilder} />
      <Stack.Screen name="MyLessonPlans" component={MyLessonPlans} />
      <Stack.Screen name="Quest" component={QuestScreen} />
      <Stack.Screen name="TopicCatalog" component={TopicCatalogScreen} />

      {/* Math */}
      <Stack.Screen name="NumbersAndOperations" component={NumbersAndOperations} />
      <Stack.Screen name="AlgebraAndFunctions" component={AlgebraAndFunctions} />
      <Stack.Screen name="GeometrySpatialReasoning" component={GeometrySpatialReasoning} />
      <Stack.Screen name="Measurement" component={Measurement} />
      <Stack.Screen name="DataStatisticsProbability" component={DataStatisticsProbability} />
      <Stack.Screen name="AdvancedMath" component={AdvancedMath} />
      <Stack.Screen name="EverydayMath" component={EverydayMath} />

      {/* Language Arts */}
      <Stack.Screen name="Reading" component={Reading} />
      <Stack.Screen name="Writing" component={Writing} />
      <Stack.Screen name="SpeakingAndListening" component={SpeakingAndListening} />
      <Stack.Screen name="Language" component={Language} />
      <Stack.Screen name="MediaDigitalLiteracy" component={MediaDigitalLiteracy} />

      {/* Science */}
      <Stack.Screen name="AstronomyAndSpace" component={AstronomyAndSpace} />
      <Stack.Screen name="Physics" component={Physics} />
      <Stack.Screen name="EarthAndEnvironmental" component={EarthAndEnvironmental} />
      <Stack.Screen name="Chemistry" component={Chemistry} />
      <Stack.Screen name="Biology" component={Biology} />
      <Stack.Screen name="Oceanography" component={Oceanography} />

      {/* Social Sciences */}
      <Stack.Screen name="History" component={History} />
      <Stack.Screen name="Geography" component={Geography} />
      <Stack.Screen name="CivicsAndGovernment" component={CivicsAndGovernment} />
      <Stack.Screen name="PsychologicalAndSociology" component={PsychologicalAndSociology} />

      {/* Art & Music */}
      <Stack.Screen name="VisualArt" component={VisualArt} />
      <Stack.Screen name="Music" component={Music} />

      {/* Home Economics & Workshop */}
      <Stack.Screen name="NutritionAndFood" component={NutritionAndFood} />
      <Stack.Screen name="TextilesAndApparel" component={TextilesAndApparel} />
      <Stack.Screen name="FamilyAndHumanDevelopment" component={FamilyAndHumanDevelopment} />
      <Stack.Screen
        name="HouseholdAndResourceManagement"
        component={HouseholdAndResourceManagement}
      />
      <Stack.Screen name="HealthAndWellness" component={HealthAndWellness} />
      <Stack.Screen name="MaterialWorking" component={MaterialWorking} />
      <Stack.Screen name="Construction" component={Construction} />
      <Stack.Screen name="Automotive" component={Automotive} />
      <Stack.Screen
        name="ToolSafetyAndShopPractices"
        component={ToolSafetyAndShopPractices}
      />

      {/* Technology & Engineering / Foreign Language / Health & Fitness / Business & Finance */}
      <Stack.Screen name="TechnologyAndEngineering" component={TechnologyAndEngineering} />
      <Stack.Screen name="ForeignLanguage" component={ForeignLanguage} />
      <Stack.Screen name="HealthAndFitness" component={HealthAndFitness} />
      <Stack.Screen name="BusinessAndFinance" component={BusinessAndFinance} />
      <Stack.Screen name="BusinessArchitecture" component={BusinessArchitecture} />
      {/* One screen serving every module of every level, addressed by
          route params rather than registered 45 times. */}
      <Stack.Screen name="CurriculumModule" component={CurriculumModule} />
      <Stack.Screen name="MoneySystems" component={MoneySystems} />
      <Stack.Screen name="RetailOperations" component={RetailOperations} />
      <Stack.Screen name="PersonalSovereignty" component={PersonalSovereignty} />
      <Stack.Screen name="CapitalFunding" component={CapitalFunding} />
      <Stack.Screen name="RealEstateAssets" component={RealEstateAssets} />
      <Stack.Screen name="WealthProtection" component={WealthProtection} />
      <Stack.Screen name="IdeaValidation" component={IdeaValidation} />
      <Stack.Screen name="ProductEngineering" component={ProductEngineering} />
      <Stack.Screen name="GoToMarket" component={GoToMarket} />
      <Stack.Screen name="VentureScale" component={VentureScale} />
      <Stack.Screen name="WorkplaceCompliance" component={WorkplaceCompliance} />
    </Stack.Navigator>
  );
}