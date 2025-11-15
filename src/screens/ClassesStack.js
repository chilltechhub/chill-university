// src/screens/ClassesStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Classes from './Classes';  // your expandable list

// Math
import NumbersAndOperations from './classes/mathClass/numbersandoperations';
import AlgebraAndFunctions from './classes/mathClass/algebraandfunctions';
import GeometrySpatialReasoning from './classes/mathClass/geometryspatialreasoning';
import Measurement from './classes/mathClass/measurement';
import DataStatisticsProbability from './classes/mathClass/datastatisticsprobability';
import AdvancedMath from './classes/mathClass/advancedmath';

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

/*
// Technology & Engineering
import TechnologyAndEngineering from './classes/technologyAndEngineering/TechnologyAndEngineering';

// Foreign Language
import ForeignLanguage from './classes/foreignLanguage/ForeignLanguage';

// Health & Fitness
import HealthAndFitness from './classes/healthAndFitness/HealthAndFitness';

// Business & Finance
import BusinessAndFinance from './classes/businessAndFinance/BusinessAndFinance';

*/

const Stack = createStackNavigator();

export default function ClassesStack() {
  return (
    <Stack.Navigator
      initialRouteName="ClassesMain"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ClassesMain" component={Classes} />

      {/* Math */}
      <Stack.Screen name="NumbersAndOperations" component={NumbersAndOperations} />
      <Stack.Screen name="AlgebraAndFunctions" component={AlgebraAndFunctions} />
      <Stack.Screen name="GeometrySpatialReasoning" component={GeometrySpatialReasoning} />
      <Stack.Screen name="Measurement" component={Measurement} />
      <Stack.Screen name="DataStatisticsProbability" component={DataStatisticsProbability} />
      <Stack.Screen name="AdvancedMath" component={AdvancedMath} />

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
    </Stack.Navigator>
  );
}