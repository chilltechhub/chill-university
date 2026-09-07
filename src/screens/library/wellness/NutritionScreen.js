import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function NutritionScreen() {
  return <WellnessAreaScreen screenTag="NutritionScreen" title="Nutrition" emoji="🥗" icon="nutrition-outline" areaId="physical" categories={['Meals','Snacks','Drinks','Supplements','Goals']} accentColor="#4caf7d" description="Track what you eat and drink" entryPlaceholder="e.g. Ate a balanced lunch, drank 2L water today..."
    presets={['Ate a balanced meal', 'Drank enough water', 'Took my supplements', 'Avoided junk food', 'Meal prepped']} />;
}
