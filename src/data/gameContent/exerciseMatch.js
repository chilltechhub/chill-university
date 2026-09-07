// src/data/gameContent/exerciseMatch.js
// Exercise Match content, tiered by grade band.

export const EXERCISE_CAT_COLORS = {
  Cardio: '#2bb5a0', Strength: '#e05858', Flexibility: '#c9a84c',
  Sport: '#8b4fc4', Recovery: '#3B82F6',
};

export const EXERCISE_BANK = {
  'K-2': [
    { exercise: '🏃 Running',    benefit: 'Improves heart health and endurance',     category: 'Cardio',     muscle: 'Heart & Lungs', options: ['Improves heart health and endurance', 'Builds arm muscles', 'Increases flexibility', 'Improves balance'] },
    { exercise: '💪 Push-Ups',   benefit: 'Strengthens chest, arms, and shoulders',  category: 'Strength',   muscle: 'Chest & Arms',  options: ['Strengthens chest, arms, and shoulders', 'Burns belly fat', 'Improves posture', 'Increases speed'] },
    { exercise: '🏊 Swimming',   benefit: 'Low-impact full body workout',            category: 'Cardio',     muscle: 'Full Body',     options: ['Low-impact full body workout', 'Only works leg muscles', 'Increases weight', 'Reduces coordination'] },
    { exercise: '🦵 Squats',     benefit: 'Builds leg and glute strength',           category: 'Strength',   muscle: 'Legs & Glutes', options: ['Builds leg and glute strength', 'Improves breathing', 'Reduces flexibility', 'Builds arm strength'] },
    { exercise: '🚴 Cycling',    benefit: 'Burns calories and builds leg muscles',   category: 'Cardio',     muscle: 'Legs & Heart',  options: ['Burns calories and builds leg muscles', 'Improves grip strength', 'Reduces heart rate', 'Builds upper body'] },
    { exercise: '🤸 Stretching', benefit: 'Prevents injury and improves range of motion', category: 'Flexibility', muscle: 'All Muscles', options: ['Prevents injury and improves range of motion', 'Builds explosive strength', 'Burns most calories', 'Increases muscle mass quickly'] },
    { exercise: '⛹️ Basketball', benefit: 'Improves coordination and teamwork',      category: 'Sport',      muscle: 'Full Body',     options: ['Improves coordination and teamwork', 'Only builds upper body', 'Reduces heart health', 'Decreases stamina'] },
    { exercise: '🪢 Jump Rope',  benefit: 'Boosts coordination and cardio fitness fast', category: 'Cardio', muscle: 'Legs & Heart',  options: ['Boosts coordination and cardio fitness fast', 'Only builds upper body', 'Slows your heart rate', 'Reduces balance'] },
  ],

  '3-5': [
    { exercise: '🧘 Yoga',       benefit: 'Increases flexibility and reduces stress',       category: 'Flexibility', muscle: 'Whole Body',   options: ['Increases flexibility and reduces stress', 'Builds big muscles', 'Improves sprinting speed', 'Increases bone density'] },
    { exercise: '🏋️ Deadlifts',   benefit: 'Strengthens back, legs, and core',               category: 'Strength',    muscle: 'Back & Legs',  options: ['Strengthens back, legs, and core', 'Improves breathing capacity', 'Increases reaction time', 'Reduces body fat only'] },
    { exercise: '🧗 Climbing',    benefit: 'Builds grip strength and problem solving',       category: 'Strength',    muscle: 'Arms & Core',  options: ['Builds grip strength and problem solving', 'Only improves flexibility', 'Reduces bone density', 'Hurts back muscles'] },
    { exercise: '🧍 Plank',       benefit: 'Builds core stability without any movement',     category: 'Strength',    muscle: 'Core',         options: ['Builds core stability without any movement', 'Improves sprint speed', 'Only works the legs', 'Increases heart rate the most'] },
    { exercise: '🦵 Lunges',      benefit: 'Builds single-leg strength and balance',         category: 'Strength',    muscle: 'Legs & Glutes',options: ['Builds single-leg strength and balance', 'Only trains the arms', 'Reduces coordination', 'Increases flexibility only'] },
    { exercise: '🤾 Jumping Jacks', benefit: 'Raises heart rate while working the whole body', category: 'Cardio',    muscle: 'Full Body',    options: ['Raises heart rate while working the whole body', 'Only stretches the arms', 'Builds maximum strength', 'Works one muscle group'] },
    { exercise: '🚣 Rowing',      benefit: 'Combines cardio with back and leg strength',     category: 'Cardio',      muscle: 'Back & Legs',  options: ['Combines cardio with back and leg strength', 'Only trains balance', 'Reduces heart rate', 'Works the neck only'] },
    { exercise: '🔥 Burpees',     benefit: 'Full-body move that spikes heart rate fast',     category: 'Cardio',      muscle: 'Full Body',    options: ['Full-body move that spikes heart rate fast', 'Isolates one small muscle', 'Improves flexibility only', 'Lowers your heart rate'] },
  ],

  '6-8': [
    { exercise: '🏃‍♂️ Interval Training',benefit: 'Alternates high and low intensity to build speed and endurance together', category: 'Cardio', muscle: 'Heart & Lungs', options: ['Alternates high and low intensity to build speed and endurance together', 'Only trains flexibility', 'Keeps effort constant the whole time', 'Works one small muscle group'] },
    { exercise: '🧍 Isometric Hold',   benefit: 'Builds strength while the muscle stays the same length',                category: 'Strength', muscle: 'Legs & Core',   options: ['Builds strength while the muscle stays the same length', 'Requires constant movement', 'Only improves cardio', 'Reduces muscle activation'] },
    { exercise: '🏋️ Progressive Overload', benefit: 'Gradually adding weight or reps so muscles keep adapting',        category: 'Strength', muscle: 'Full Body',     options: ['Gradually adding weight or reps so muscles keep adapting', 'Doing the exact same workout forever', 'Only stretching before exercise', 'Skipping rest between sets'] },
    { exercise: '😴 Rest Day',         benefit: 'Lets muscles repair and grow stronger after training',                 category: 'Recovery', muscle: 'Whole Body',    options: ['Lets muscles repair and grow stronger after training', 'Makes muscles weaker over time', 'Has no effect on performance', 'Only helps flexibility'] },
    { exercise: '🫁 Aerobic Exercise', benefit: 'Uses oxygen to fuel longer, steady-paced activity like jogging',       category: 'Cardio',   muscle: 'Heart & Lungs', options: ['Uses oxygen to fuel longer, steady-paced activity like jogging', 'Relies only on short bursts of effort', 'Builds maximum muscle size', "Doesn't use the heart or lungs"] },
    { exercise: '💨 Anaerobic Exercise', benefit: "Short, intense bursts of effort, like sprinting, that don't rely on oxygen", category: 'Strength', muscle: 'Fast-Twitch Muscles', options: ["Short, intense bursts of effort, like sprinting, that don't rely on oxygen", 'Long steady-state cardio like jogging', 'Only used for stretching', 'Requires zero muscle effort'] },
    { exercise: '🧘 Dynamic Stretching', benefit: 'Active movements that warm up muscles before exercise',              category: 'Flexibility', muscle: 'Whole Body', options: ['Active movements that warm up muscles before exercise', 'Holding a single stretch for minutes after exercise', 'Only done for the arms', 'Increases injury risk'] },
    { exercise: '🧊 Cool Down',        benefit: 'Gradually lowers heart rate and helps prevent injury after exercise',  category: 'Recovery', muscle: 'Whole Body',    options: ['Gradually lowers heart rate and helps prevent injury after exercise', 'Raises your heart rate quickly', 'Should be skipped to save time', 'Builds the most muscle mass'] },
  ],

  '9-12': [
    { exercise: '🫀 VO2 Max Training',   benefit: 'Measures and improves the maximum oxygen your body can use during intense exercise', category: 'Cardio', muscle: 'Heart & Lungs', options: ['Measures and improves the maximum oxygen your body can use during intense exercise', 'Only measures muscle size', 'Tracks flexibility over time', 'Has no link to endurance'] },
    { exercise: '🔁 Periodization',      benefit: 'Structuring training into cycles of varying intensity to peak and avoid burnout', category: 'Strength', muscle: 'Full Body', options: ['Structuring training into cycles of varying intensity to peak and avoid burnout', 'Doing maximum intensity every single day', 'Skipping structured planning entirely', 'Training only one muscle group forever'] },
    { exercise: '🦵 Plyometrics',        benefit: 'Explosive jump training that builds power by combining speed and strength', category: 'Strength', muscle: 'Legs & Glutes', options: ['Explosive jump training that builds power by combining speed and strength', 'Slow, controlled stretching only', 'Long steady-state cardio', 'Isolated finger exercises'] },
    { exercise: '😖 DOMS',               benefit: 'Muscle soreness 24-48 hours after new or intense exercise from tiny muscle fiber damage', category: 'Recovery', muscle: 'Whole Body', options: ['Muscle soreness 24-48 hours after new or intense exercise from tiny muscle fiber damage', 'Soreness felt during the exercise itself', 'A sign your muscles are shrinking', 'Only happens to beginners'] },
    { exercise: '❤️ Target Heart Rate Zone', benefit: "Training within a specific heart-rate range to maximize a workout's benefit", category: 'Cardio', muscle: 'Heart & Lungs', options: ["Training within a specific heart-rate range to maximize a workout's benefit", 'Training with your eyes closed', 'Ignoring your heart rate entirely', 'Only relevant for weightlifting'] },
    { exercise: '🐌 Slow-Twitch Fibers', benefit: 'Fatigue-resistant muscle fibers built for endurance activities like distance running', category: 'Strength', muscle: 'Full Body', options: ['Fatigue-resistant muscle fibers built for endurance activities like distance running', 'Fibers built only for sprinting', 'Fibers that never fatigue at all', 'Fibers found only in the heart'] },
    { exercise: '⚡ Fast-Twitch Fibers', benefit: 'Powerful muscle fibers built for short, explosive movements like sprinting', category: 'Strength', muscle: 'Full Body', options: ['Powerful muscle fibers built for short, explosive movements like sprinting', 'Fibers built for long-distance running', 'Fibers that only exist in the legs', 'Fibers that improve flexibility'] },
    { exercise: '🧊 Active Recovery',   benefit: 'Light movement on a rest day that keeps blood flowing without adding training stress', category: 'Recovery', muscle: 'Whole Body', options: ['Light movement on a rest day that keeps blood flowing without adding training stress', 'Complete bed rest for a full week', 'Maximum-intensity training every rest day', 'Skipping meals to recover faster'] },
  ],
};

export default EXERCISE_BANK;
