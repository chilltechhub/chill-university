import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function SelfCareScreen() {
  return <WellnessAreaScreen screenTag="SelfCareScreen" title="Self-Care" emoji="✨" icon="sparkles-outline" areaId="spiritual" categories={['Morning','Evening','Rest','Creative','Social']} accentColor="#c084e0" description="Track your self-care and mindfulness practices" entryPlaceholder="e.g. 10min meditation, journaled tonight..."
    presets={['Meditated', 'Journaled', 'Took time to rest', 'Did something just for me', 'Unplugged for a bit']} />;
}
