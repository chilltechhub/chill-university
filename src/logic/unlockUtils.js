// src/logic/unlockUtils.js
// Figures out what cosmetic unlocks land between an old and new
// level/rank — used by the level-up / rank-up in-app notification so it
// can say "here's what you just unlocked," not just "you leveled up."
//
// Reuses the SAME requirement data every wardrobe screen already reads
// (OUTFITS/ACCESSORIES's `requirement`, PET_TIERS' `requiredLevel`,
// BACKGROUNDS' `maxRank`) rather than keeping a separate unlock list that
// could drift out of sync with what's actually gated in the wardrobe.

import { OUTFITS, ACCESSORIES } from '../data/characterOptions';
import { PET_TIERS } from '../data/petOptions';
import { BACKGROUNDS } from '../data/backgroundOptions';

// Everything newly reachable by LEVEL going from `fromLevel` (exclusive)
// to `toLevel` (inclusive) — outfits and pets are both gated by level.
export function getLevelUnlocks(fromLevel, toLevel) {
  if (toLevel <= fromLevel) return [];
  const unlocks = [];

  OUTFITS.forEach(o => {
    const v = o.requirement?.stat === 'level' ? o.requirement.value : null;
    if (v != null && v > fromLevel && v <= toLevel) {
      unlocks.push({ name: o.name, kind: 'outfit', emoji: '🧑' });
    }
  });

  PET_TIERS.forEach(p => {
    if (p.requiredLevel > fromLevel && p.requiredLevel <= toLevel) {
      unlocks.push({ name: p.name, kind: 'pet', emoji: '🐾' });
    }
  });

  return unlocks;
}

// Everything newly reachable by RANK improving from `fromRank` to
// `toRank` — rank is 1-20 where LOWER is better, so an improvement means
// toRank < fromRank. Backgrounds unlock at `rank <= maxRank`, so anything
// with maxRank in [toRank, fromRank) just became reachable.
export function getRankUnlocks(fromRank, toRank) {
  if (toRank >= fromRank) return [];
  const unlocks = [];

  BACKGROUNDS.forEach(b => {
    if (b.maxRank >= toRank && b.maxRank < fromRank) {
      unlocks.push({ name: b.name, kind: 'background', emoji: '🏞️' });
    }
  });

  return unlocks;
}

// Points-gated accessories (swords, shields, etc.) — surfaced alongside a
// level-up notification too, since points and level usually climb
// together and accessories have no level of their own to key off of.
export function getPointUnlocks(fromPoints, toPoints) {
  if (toPoints <= fromPoints) return [];
  const unlocks = [];

  ACCESSORIES.forEach(a => {
    const v = a.requirement?.stat === 'points' ? a.requirement.value : null;
    if (v != null && v > fromPoints && v <= toPoints) {
      unlocks.push({ name: a.name, kind: 'accessory', emoji: '⚔️' });
    }
  });

  return unlocks;
}
