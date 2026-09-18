import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function ExerciseScreen() {
  return <WellnessAreaScreen screenTag="ExerciseScreen" title="Fitness & Movement" emoji="💪" icon="barbell-outline" areaId="physical" categories={['Cardio','Strength','Flexibility','Sports','Walk']} description="Track your workouts and movement" entryPlaceholder="e.g. 30min run, 5km walk, upper body day..."
    presets={['Completed a workout', 'Went for a walk', 'Stretched', 'Hit a personal best', 'Rest day']} />;
}
