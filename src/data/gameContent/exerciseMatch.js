// src/data/gameContent/exerciseMatch.js
// Exercise Match content, tiered by grade band.
//
// Wrong options are real descriptions of OTHER exercises or ideas from the
// same band, written about as long as the right one, so the answer can't
// be spotted by being the only sensible (or the longest) option.
// scripts/check-games.mjs checks the lengths.

export const EXERCISE_CAT_COLORS = {
  Cardio: '#2bb5a0', Strength: '#e05858', Flexibility: '#c9a84c',
  Sport: '#8b4fc4', Recovery: '#3B82F6',
};

export const EXERCISE_BANK = {
  'K-2': [
    { exercise: '🏃 Running', benefit: 'Makes your heart and lungs stronger', category: 'Cardio', muscle: 'Heart & Lungs', options: ['Makes your heart and lungs stronger', 'Makes your arms and chest stronger', 'Helps you bend and reach farther', 'Helps you balance on one foot for longer'] },
    { exercise: '💪 Push-Ups', benefit: 'Makes your arms and chest stronger', category: 'Strength', muscle: 'Chest & Arms', options: ['Makes your arms and chest stronger', 'Makes your legs jump higher', 'Helps you bend and reach farther', 'Makes your heart and lungs stronger'] },
    { exercise: '🏊 Swimming', benefit: 'Works your whole body, easy on joints', category: 'Cardio', muscle: 'Full Body', options: ['Works your whole body, easy on joints', 'Mostly works your arms and hands', 'Helps you touch your toes', 'Builds strong leg muscles and nothing else'] },
    { exercise: '🦵 Squats', benefit: 'Makes your legs stronger', category: 'Strength', muscle: 'Legs & Glutes', options: ['Makes your legs stronger', 'Makes your arms stronger', 'Helps you bend farther', 'Helps you catch a ball'] },
    { exercise: '🚴 Biking', benefit: 'Works your legs and your heart', category: 'Cardio', muscle: 'Legs & Heart', options: ['Works your legs and your heart', 'Works your arms and your back', 'Helps you stretch your back', 'Helps you throw a ball farther'] },
    { exercise: '🤸 Stretching', benefit: 'Helps you bend and reach farther', category: 'Flexibility', muscle: 'All Muscles', options: ['Helps you bend and reach farther', 'Makes your heart beat faster', 'Makes your arms much bigger', 'Helps you run a lot faster in races'] },
    { exercise: '⛹️ Basketball', benefit: 'Practices teamwork and hand-eye skills', category: 'Sport', muscle: 'Full Body', options: ['Practices teamwork and hand-eye skills', 'Helps you hold still and stay very calm', 'Mostly makes your arms stronger', 'Helps you stretch after playing'] },
    { exercise: '🪢 Jump Rope', benefit: 'Gets your heart pumping and feet quick', category: 'Cardio', muscle: 'Legs & Heart', options: ['Gets your heart pumping and feet quick', 'Helps you bend and touch your toes', 'Makes your arms and chest stronger', 'Helps you relax before bedtime'] },
  ],

  '3-5': [
    { exercise: '🧘 Yoga', benefit: 'Builds flexibility and calms your mind', category: 'Flexibility', muscle: 'Whole Body', options: ['Builds flexibility and calms your mind', 'Builds grip strength and arm power', 'Raises your heart rate as high as it goes', 'Builds strong legs one side at a time'] },
    { exercise: '🏋️ Deadlifts', benefit: 'Strengthens back, legs, and core', category: 'Strength', muscle: 'Back & Legs', options: ['Strengthens back, legs, and core', 'Strengthens chest and shoulders', 'Stretches hamstrings and hips', 'Trains quick feet and better balance'] },
    { exercise: '🧗 Climbing', benefit: 'Builds grip strength and problem solving', category: 'Strength', muscle: 'Arms & Core', options: ['Builds grip strength and problem solving', 'Builds flexibility and calms your mind', 'Trains your heart with nonstop jumping', 'Strengthens each leg on its own'] },
    { exercise: '🧍 Plank', benefit: 'Holds still to build a strong core', category: 'Strength', muscle: 'Core', options: ['Holds still to build a strong core', 'Stretches the back of your legs', 'Builds leg power by jumping up', 'Raises your heart rate quickly'] },
    { exercise: '🦵 Lunges', benefit: 'Strengthens each leg and helps balance', category: 'Strength', muscle: 'Legs & Glutes', options: ['Strengthens each leg and helps balance', 'Strengthens your grip and forearms', 'Holds still to build a strong core', 'Stretches your chest and your shoulders'] },
    { exercise: '🤾 Jumping Jacks', benefit: 'Warms up your whole body fast', category: 'Cardio', muscle: 'Full Body', options: ['Warms up your whole body fast', 'Builds a strong grip for climbing', 'Stretches one muscle at a time', 'Strengthens only your core'] },
    { exercise: '🚣 Rowing', benefit: 'Cardio that also works your back and legs', category: 'Cardio', muscle: 'Back & Legs', options: ['Cardio that also works your back and legs', 'Stretching that also calms your breathing', 'Strength work for just your chest and arms', 'Balance work that trains one leg at a time'] },
    { exercise: '🔥 Burpees', benefit: 'Full-body move that spikes heart rate', category: 'Cardio', muscle: 'Full Body', options: ['Full-body move that spikes heart rate', 'Slow stretch that relaxes your back', 'Still hold that trains only your core', 'Arm exercise that builds your biceps'] },
  ],

  '6-8': [
    { exercise: '🏃‍♂️ Interval Training', benefit: 'Hard and easy bursts back and forth', category: 'Cardio', muscle: 'Heart & Lungs', options: ['Hard and easy bursts back and forth', 'One steady pace for a long time', 'Holding a position without moving', 'Adding a little more weight each week'] },
    { exercise: '🧍 Isometric Hold', benefit: 'Muscle works without changing length', category: 'Strength', muscle: 'Legs & Core', options: ['Muscle works without changing length', 'Muscle stretches while you move', 'Hard and easy bursts back and forth', 'Heart works at a steady easy pace'] },
    { exercise: '🏋️ Progressive Overload', benefit: 'Adding weight or reps over time', category: 'Strength', muscle: 'Full Body', options: ['Adding weight or reps over time', 'Doing the same workout every day', 'Resting a full day between workouts', 'Lifting as heavy as you can each time'] },
    { exercise: '😴 Rest Day', benefit: 'Gives muscles time to repair and grow', category: 'Recovery', muscle: 'Whole Body', options: ['Gives muscles time to repair and grow', 'Keeps your heart rate high all day', 'Loosens muscles before a hard game', 'Adds more and more weight to build strength'] },
    { exercise: '🫁 Aerobic Exercise', benefit: 'Steady effort fueled by oxygen', category: 'Cardio', muscle: 'Heart & Lungs', options: ['Steady effort fueled by oxygen', 'Short all-out bursts of effort', 'Holding still to build strength', 'Slow stretches after a workout'] },
    { exercise: '💨 Anaerobic Exercise', benefit: 'Short, all-out bursts like sprinting', category: 'Strength', muscle: 'Fast-Twitch Muscles', options: ['Short, all-out bursts like sprinting', 'Long, steady efforts like jogging', 'Gentle movement on a day off', 'Holding a stretch for a minute'] },
    { exercise: '🧘 Dynamic Stretching', benefit: 'Moving stretches to warm up first', category: 'Flexibility', muscle: 'Whole Body', options: ['Moving stretches to warm up first', 'Long still stretches to cool down', 'Heavy lifts to build max strength', 'Steady jogging to build endurance'] },
    { exercise: '🧊 Cool Down', benefit: 'Slowly brings your heart rate back down', category: 'Recovery', muscle: 'Whole Body', options: ['Slowly brings your heart rate back down', 'Quickly gets your muscles ready to play', 'Adds weight or reps as you get stronger', 'Pushes your heart rate to its maximum'] },
  ],

  '9-12': [
    { exercise: '🫀 VO2 Max', benefit: 'The most oxygen your body can use', category: 'Cardio', muscle: 'Heart & Lungs', options: ['The most oxygen your body can use', 'Your heart rate when fully rested', 'The most weight you can lift once', 'How far you can stretch a muscle'] },
    { exercise: '🔁 Periodization', benefit: 'Planning training in cycles of intensity', category: 'Strength', muscle: 'Full Body', options: ['Planning training in cycles of intensity', 'Adding weight to every set, every day', 'Training at the same effort all year', 'Resting a full week after each workout'] },
    { exercise: '🦵 Plyometrics', benefit: 'Jump training that builds explosive power', category: 'Strength', muscle: 'Legs & Glutes', options: ['Jump training that builds explosive power', 'Slow lifting that builds muscle size', 'Steady cardio that builds endurance', 'Holding still to build joint strength'] },
    { exercise: '😖 DOMS', benefit: 'Soreness a day or two after new exercise', category: 'Recovery', muscle: 'Whole Body', options: ['Soreness a day or two after new exercise', 'A sharp pain during a lift that means injury', 'Cramping from not drinking enough water', 'The burn you feel during a hard set'] },
    { exercise: '❤️ Target Heart Rate Zone', benefit: 'A heart-rate range to aim for in a workout', category: 'Cardio', muscle: 'Heart & Lungs', options: ['A heart-rate range to aim for in a workout', 'Your heart rate first thing in the morning', 'The highest heart rate that is ever safe', 'How fast your heart rate drops after exercise'] },
    { exercise: '🐌 Slow-Twitch Fibers', benefit: 'Muscle fibers that resist tiring out', category: 'Strength', muscle: 'Full Body', options: ['Muscle fibers that resist tiring out', 'Muscle fibers built for quick bursts', 'Muscle fibers found only in the heart', 'Muscle fibers that grow the biggest'] },
    { exercise: '⚡ Fast-Twitch Fibers', benefit: 'Muscle fibers built for quick bursts', category: 'Strength', muscle: 'Full Body', options: ['Muscle fibers built for quick bursts', 'Muscle fibers that resist tiring out', 'Muscle fibers that control breathing', 'Muscle fibers used only for stretching'] },
    { exercise: '🚶 Active Recovery', benefit: 'Light movement on a rest day', category: 'Recovery', muscle: 'Whole Body', options: ['Light movement on a rest day', 'Total bed rest after a workout', 'A hard workout to push past soreness', 'Stretching as far as it will go'] },
  ],
};

export default EXERCISE_BANK;
