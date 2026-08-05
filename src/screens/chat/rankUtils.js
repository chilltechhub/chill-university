// src/logic/rankUtils.js

/**
 * Ordered list of rank thresholds, from highest rank (1) to lowest (20).
 * Users achieve the first rank whose threshold they meet or exceed.
 */
export const rankThresholds = [
  { rank: 1,  threshold: 32650 },
  { rank: 2,  threshold: 27925 },
  { rank: 3,  threshold: 23675 },
  { rank: 4,  threshold: 19875 },
  { rank: 5,  threshold: 16500 },
  { rank: 6,  threshold: 13550 },
  { rank: 7,  threshold: 11000 },
  { rank: 8,  threshold: 8800  },
  { rank: 9,  threshold: 6900  },
  { rank: 10, threshold: 5300  },
  { rank: 11, threshold: 3975  },
  { rank: 12, threshold: 2900  },
  { rank: 13, threshold: 2050  },
  { rank: 14, threshold: 1400  },
  { rank: 15, threshold: 925   },
  { rank: 16, threshold: 575   },
  { rank: 17, threshold: 325   },
  { rank: 18, threshold: 150   },
  { rank: 19, threshold: 50    },
  { rank: 20, threshold: 0     },
];

/**
 * Determine the user's rank based on their total points.
 *
 * @param {number} points  - The user's current point total.
 * @returns {number}       - The rank (1–20).
 */
export function getRank(points) {
  for (const { rank, threshold } of rankThresholds) {
    if (points >= threshold) {
      return rank;
    }
  }
  // Fallback (shouldn't happen): lowest rank
  return 20;
}

/**
 * Calculate progress toward the next rank as a percentage.
 *
 * @param {number} points  - The user's current point total.
 * @returns {{currentRank: number, progress: number}}
 *   - currentRank: the rank the user currently holds
 *   - progress:  percentage (0–100) toward the next higher rank
 */
export function getRankProgress(points) {
  const currentRank = getRank(points);
  const idx = rankThresholds.findIndex(r => r.rank === currentRank);
  const currentThreshold = rankThresholds[idx].threshold;
  // Next higher rank is at index idx–1
  const nextThreshold = idx > 0
    ? rankThresholds[idx - 1].threshold
    : currentThreshold + 1;
  const rawProgress = (points - currentThreshold) / (nextThreshold - currentThreshold);
  const progress = Math.min(Math.max(rawProgress * 100, 0), 100);
  return { currentRank, progress };
}

/**
 * Human-readable rank tier labels.
 */
export const rankLabels = {
  1:  { label: 'Legend',        emoji: '🏆', color: '#FFD700' },
  2:  { label: 'Grandmaster',   emoji: '💎', color: '#B9F2FF' },
  3:  { label: 'Master',        emoji: '🔮', color: '#A78BFA' },
  4:  { label: 'Expert',        emoji: '🌟', color: '#60A5FA' },
  5:  { label: 'Veteran',       emoji: '⚡', color: '#34D399' },
  6:  { label: 'Skilled',       emoji: '🔥', color: '#F97316' },
  7:  { label: 'Advanced',      emoji: '🎯', color: '#EC4899' },
  8:  { label: 'Proficient',    emoji: '📈', color: '#10B981' },
  9:  { label: 'Competent',     emoji: '📚', color: '#6366F1' },
  10: { label: 'Intermediate',  emoji: '🎓', color: '#3B82F6' },
  11: { label: 'Developing',    emoji: '🌱', color: '#22C55E' },
  12: { label: 'Learner',       emoji: '📝', color: '#F59E0B' },
  13: { label: 'Apprentice',    emoji: '🔑', color: '#84CC16' },
  14: { label: 'Novice',        emoji: '🌙', color: '#06B6D4' },
  15: { label: 'Beginner',      emoji: '🌤️',  color: '#8B5CF6' },
  16: { label: 'Explorer',      emoji: '🗺️',  color: '#F43F5E' },
  17: { label: 'Initiate',      emoji: '🌿', color: '#14B8A6' },
  18: { label: 'Recruit',       emoji: '⭐', color: '#EAB308' },
  19: { label: 'Newcomer',      emoji: '🌱', color: '#64748B' },
  20: { label: 'Starter',       emoji: '🐣', color: '#94A3B8' },
};

/**
 * Get label info for a given rank number.
 */
export function getRankLabel(rank) {
  return rankLabels[rank] || rankLabels[20];
}
