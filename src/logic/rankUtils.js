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
 * Five named tiers over the 20 ranks, four ranks each. There used to be a
 * name per rank — twenty near-synonyms (Starter, Newcomer, Recruit,
 * Initiate…) that said nothing about which was higher. Rank itself stays
 * 1–20 (the server stores it and backgrounds unlock by it); only the names
 * collapse. Ordered lowest first; `minRank` is the worst rank in the tier.
 */
export const TIERS = [
  { key: 'starter',  label: 'Starter',  emoji: '🐣', color: '#94A3B8', theme: 'base',   minRank: 20 },
  { key: 'explorer', label: 'Explorer', emoji: '🗺️', color: '#22C55E', theme: 'base',   minRank: 16 },
  { key: 'skilled',  label: 'Skilled',  emoji: '🎯', color: '#3B82F6', theme: 'teal',   minRank: 12 },
  { key: 'expert',   label: 'Expert',   emoji: '🌟', color: '#A78BFA', theme: 'arcane', minRank: 8 },
  { key: 'legend',   label: 'Legend',   emoji: '🏆', color: '#FFD700', theme: 'gold',   minRank: 4 },
];

/** Index into TIERS (0 = Starter … 4 = Legend) for a rank 1–20. */
export function tierIndexForRank(rank) {
  const r = Math.min(20, Math.max(1, Math.round(Number(rank) || 20)));
  return Math.min(TIERS.length - 1, Math.floor((20 - r) / 4));
}

export function tierForRank(rank) {
  return TIERS[tierIndexForRank(rank)];
}

/**
 * Progress (0–100) toward the next TIER, not the next rank — with names
 * shared by four ranks, "next rank" would often end on the same name.
 */
export function getTierProgress(points) {
  const idx = tierIndexForRank(getRank(points));
  const thresholdOf = (rank) => rankThresholds.find(t => t.rank === rank).threshold;
  const from = thresholdOf(TIERS[idx].minRank);
  if (idx >= TIERS.length - 1) return { tier: TIERS[idx], progress: 100 };
  const to = thresholdOf(TIERS[idx + 1].minRank);
  const progress = Math.min(Math.max(((points - from) / (to - from)) * 100, 0), 100);
  return { tier: TIERS[idx], progress };
}

/** Label info per rank — the rank's tier. Kept keyed by rank for callers. */
export const rankLabels = Object.fromEntries(
  Array.from({ length: 20 }, (_, i) => {
    const t = tierForRank(i + 1);
    return [i + 1, { label: t.label, emoji: t.emoji, color: t.color }];
  }),
);

/**
 * Get label info for a given rank number.
 */
export function getRankLabel(rank) {
  return rankLabels[rank] || rankLabels[20];
}
