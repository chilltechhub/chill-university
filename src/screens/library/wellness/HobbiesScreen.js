import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function HobbiesScreen() {
  return <WellnessAreaScreen title="Hobbies & Interests" emoji="🎨" areaId="creative" categories={['Creative','Outdoor','Tech','Social','Learning']} accentColor="#f5a623" description="Track your hobbies, passions and interests" entryPlaceholder="e.g. Painted for an hour, learned guitar chord..."
    presets={['Worked on a hobby', 'Tried something new', 'Spent time outdoors', 'Learned a new skill', 'Made time for fun']} />;
}
