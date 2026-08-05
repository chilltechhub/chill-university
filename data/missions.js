// src/data/missions.js
// Mission templates — these seed the Supabase missions table.
// Each entry maps to a row in the missions table.

export const missionTemplates = [
  // ── Daily missions ──────────────────────────────────────────────────────
  {
    type: 'daily',
    title: 'Daily Grind',
    description: 'Complete 3 daily tasks in a row.',
    criteria: { type: 'questions_answered', subject: null },
    target_value: 3,
    xp_reward: 30,
    point_reward: 15,
    active: true,
  },
  {
    type: 'daily',
    title: 'Math Practice',
    description: 'Spend time practicing math today.',
    criteria: { type: 'questions_answered', subject: 'math' },
    target_value: 10,
    xp_reward: 20,
    point_reward: 10,
    active: true,
  },
  {
    type: 'daily',
    title: 'Comeback Kid',
    description: 'Finish a level you did not pass yesterday.',
    criteria: { type: 'correct_answers', subject: null },
    target_value: 5,
    xp_reward: 25,
    point_reward: 12,
    active: true,
  },
  {
    type: 'daily',
    title: 'Game Explorer',
    description: 'Try 2 different games today.',
    criteria: { type: 'questions_answered', subject: null },
    target_value: 2,
    xp_reward: 15,
    point_reward: 8,
    active: true,
  },
  // ── Weekly missions ─────────────────────────────────────────────────────
  {
    type: 'weekly',
    title: 'Subject Hopper',
    description: 'Play games from 3 different subject categories this week.',
    criteria: { type: 'questions_answered', subject: null },
    target_value: 30,
    xp_reward: 100,
    point_reward: 50,
    active: true,
  },
  {
    type: 'weekly',
    title: 'Accuracy Ace',
    description: 'Answer 20 questions correctly this week.',
    criteria: { type: 'correct_answers', subject: null },
    target_value: 20,
    xp_reward: 80,
    point_reward: 40,
    active: true,
  },
  // ── Longterm / achievements ─────────────────────────────────────────────
  {
    type: 'longterm',
    title: 'Century Club',
    description: 'Answer 100 questions correctly.',
    criteria: { type: 'correct_answers', subject: null },
    target_value: 100,
    xp_reward: 500,
    point_reward: 250,
    active: true,
  },
];

// Simple string list for quick reference / local display
export const missionStrings = missionTemplates.map(m => m.description);
