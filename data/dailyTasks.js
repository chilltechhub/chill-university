// src/data/dailyTasks.js
// Daily task definitions shown in the DailyTasks panel.
// type: 'question' | 'game' | 'accuracy' | 'variety'

export const dailyTasks = [
  {
    id: 'dt-1',
    title: 'Word Problem',
    description: 'Solve a word problem',
    type: 'question',
    target: 1,
    xp: 10,
    points: 5,
  },
  {
    id: 'dt-2',
    title: 'Multiply & Divide',
    description: 'Answer 3 questions using multiplication or division',
    type: 'question',
    target: 3,
    xp: 20,
    points: 10,
  },
  {
    id: 'dt-3',
    title: 'Full Game',
    description: 'Complete one full game or level',
    type: 'game',
    target: 1,
    xp: 30,
    points: 15,
  },
  {
    id: 'dt-4',
    title: 'Accuracy Challenge',
    description: 'Finish a level with at least 80% accuracy',
    type: 'accuracy',
    target: 80,
    xp: 25,
    points: 12,
  },
  {
    id: 'dt-5',
    title: 'Category Switch',
    description: 'Play a game from a different subject than yesterday',
    type: 'variety',
    target: 1,
    xp: 15,
    points: 8,
  },
];
