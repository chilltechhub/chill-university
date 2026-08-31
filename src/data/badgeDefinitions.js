// src/data/badgeDefinitions.js
// Awards shown on the Player screen's Awards tab. Each badge's `check` runs
// against real progress data (context/UserProgressContext.js), so this is
// an honest reflection of what's actually been earned — not decoration.

export const BADGE_TIER_COLOR = {
  bronze: '#C98F63',
  silver: '#B0B8C4',
  gold:   '#E8B34A',
};

export const BADGES = [
  { id: 'first_steps',   name: 'First Steps',        tier: 'bronze', icon: '🏁', desc: 'Complete your first training session.', check: (ctx) => (ctx.gameplayStats?.levelsCompleted || 0) >= 1 },
  { id: 'getting_started', name: 'Getting Started',  tier: 'bronze', icon: '🌱', desc: 'Reach Level 3.', check: (ctx) => (ctx.level || 0) >= 3 },
  { id: 'rising_star',   name: 'Rising Star',        tier: 'silver', icon: '⭐', desc: 'Reach Level 10.', check: (ctx) => (ctx.level || 0) >= 10 },
  { id: 'legend_making', name: 'Legend in the Making', tier: 'gold', icon: '🏆', desc: 'Reach Level 20.', check: (ctx) => (ctx.level || 0) >= 20 },

  { id: 'warming_up',    name: 'Warming Up',         tier: 'bronze', icon: '🔥', desc: 'Reach a 3-day streak.', check: (ctx) => (ctx.streakDays || 0) >= 3 },
  { id: 'on_a_roll',     name: 'On a Roll',          tier: 'silver', icon: '🔥', desc: 'Reach a 7-day streak.', check: (ctx) => (ctx.streakDays || 0) >= 7 },
  { id: 'unstoppable',   name: 'Unstoppable',        tier: 'gold',   icon: '🔥', desc: 'Reach a 30-day streak.', check: (ctx) => (ctx.streakDays || 0) >= 30 },

  { id: 'point_collector', name: 'Point Collector',  tier: 'bronze', icon: '✦', desc: 'Earn 500 points.', check: (ctx) => (ctx.points || 0) >= 500 },
  { id: 'point_hoarder', name: 'Point Hoarder',      tier: 'silver', icon: '✦', desc: 'Earn 2,000 points.', check: (ctx) => (ctx.points || 0) >= 2000 },
  { id: 'point_legend',  name: 'Point Legend',       tier: 'gold',   icon: '✦', desc: 'Earn 10,000 points.', check: (ctx) => (ctx.points || 0) >= 10000 },

  { id: 'well_rounded',  name: 'Well Rounded',       tier: 'silver', icon: '🧭', desc: 'Build progress in 5 different subjects.', check: (ctx) => Object.keys(ctx.subjectProgress || {}).length >= 5 },
  { id: 'subject_master', name: 'Subject Master',    tier: 'gold',   icon: '📚', desc: 'Reach Level 10 in any one subject.', check: (ctx) => Object.values(ctx.subjectProgress || {}).some(sp => (sp.level || 0) >= 10) },
];

/** Splits badges into earned/locked given the current progress context. */
export function splitBadges(ctx) {
  const earned = [];
  const locked = [];
  for (const badge of BADGES) {
    (badge.check(ctx) ? earned : locked).push(badge);
  }
  return { earned, locked };
}
