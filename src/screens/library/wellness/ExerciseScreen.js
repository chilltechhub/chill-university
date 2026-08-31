import React from 'react';
import WellnessAreaScreen from './WellnessAreaScreen';
export default function ExerciseScreen() {
  return <WellnessAreaScreen title="Exercise" emoji="💪" areaId="physical" categories={['Cardio','Strength','Flexibility','Sports','Walk']} accentColor="#e05c5c" description="Track your workouts and movement" entryPlaceholder="e.g. 30min run, 5km walk, upper body day..."
    presets={['Completed a workout', 'Went for a walk', 'Stretched', 'Hit a personal best', 'Rest day']} />;
}
