import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function NutritionScreen() {
  return <WellnessAreaScreen title="Nutrition" emoji="🥗" areaId="physical" categories={['Meals','Snacks','Drinks','Supplements','Goals']} accentColor="#4caf7d" description="Track what you eat and drink" entryPlaceholder="e.g. Ate a balanced lunch, drank 2L water today..." />;
}
