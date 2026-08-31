import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function WellbeingScreen() {
  return <WellnessAreaScreen title="Well-being" emoji="💙" areaId="mental" categories={['Mood','Stress','Sleep','Mindfulness','Gratitude']} accentColor="#7eb8e0" description="Track your emotional and mental state" entryPlaceholder="e.g. Feeling anxious today, practiced breathing..."
    presets={['Feeling good today', 'Managed stress well', 'Practiced gratitude', 'Had a rough day', 'Processed my emotions']} />;
}
