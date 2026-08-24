import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function SelfCareScreen() {
  return <WellnessAreaScreen title="Self-Care" emoji="✨" areaId="spiritual" categories={['Morning','Evening','Rest','Creative','Social']} accentColor="#c084e0" description="Track your self-care and mindfulness practices" entryPlaceholder="e.g. 10min meditation, journaled tonight..." />;
}
