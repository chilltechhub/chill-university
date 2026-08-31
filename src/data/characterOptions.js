// src/data/characterOptions.js
// Character customization catalog — outfits and accessory badges.
//
// Outfits mix two kinds of art on one unlock ladder, on purpose (both
// sources are kept, not one replacing the other):
//   - static "32rogues" portraits (sheet/row/col into rogues.png via
//     src/components/SpriteIcon.js) — one pose; CharacterWalker.js gives
//     these a little hop + a flip to sell "walking" since there's no
//     walk-cycle frame data for them.
//   - animated rigs (src/data/characterRigs.js) — real idle/walk frame
//     animation, played by src/components/AnimatedSprite.js.
// PlayerCharacter.js picks the right renderer per-outfit based on which
// of `rig` / `sheet` the entry carries.
//
// The level cap is 20 (src/logic/gamificationService.js getLevel()), so
// all 19 tiers fit inside levels 1-20.
//
// Each unlockable option carries an explicit `requirement` (checked against
// stats from context/UserProgressContext.js) instead of just a predicate,
// so the UI can always show *why* something is locked without having to
// inspect function internals. `unlock(stats)` re-derives from the same
// requirement, so the two can never drift apart.
//
// `facingRight` records which way the art itself natively faces — not
// every pack agrees, so CharacterWalker.js can't assume "unflipped means
// facing right" for all of them. Omitted (or true) = faces right by
// default; only set `false` for the ones verified to face left instead.
//
// An earlier pass got this wrong for the Gangster rigs (flagged them
// `false` from a walk-frame crop read that turned out backwards) — the
// user caught it by actually watching them walk. Re-verified everything
// after that: Peasant, Farmer, Rogue, Knight (32rogues static portraits),
// Bat, and Soldier face left, so those get `false`. The Gangsters, Orc,
// Templar, Warlock, Punk, Biker, and Cyborg all face right already and
// need no flag. Confirmed two ways — live in-app walk testing (up to the
// tester's own level 12) plus, for everything above that level, driving
// the same walk controls with the outfit's lock temporarily bypassed in
// code (reverted after) so it could be watched moving rather than judged
// from a single static crop, which is what led to the Gangster mistake
// in the first place.

import { RIGS } from './characterRigs';

function meetsRequirement(requirement, stats) {
  if (!requirement) return true;
  return (stats[requirement.stat] || 0) >= requirement.value;
}

function withUnlock(option) {
  return { ...option, unlock: (stats) => meetsRequirement(option.requirement, stats) };
}

export const OUTFITS = [
  { id: 'peasant',   name: 'Peasant',       sheet: 'rogues', row: 6, col: 1, requirement: null, facingRight: false },
  { id: 'pink',      name: 'Pink Monster',  rig: RIGS.pink,                  requirement: { stat: 'level', value: 2 } },
  { id: 'mushroom',  name: 'Mushroom',      rig: RIGS.mushroom,              requirement: { stat: 'level', value: 3 } },
  { id: 'farmer',    name: 'Farmer',        sheet: 'rogues', row: 5, col: 0, requirement: { stat: 'level', value: 4 }, facingRight: false },
  { id: 'gangster3', name: 'Gangster',      rig: RIGS.gangster3,             requirement: { stat: 'level', value: 5 } },
  { id: 'owlet',     name: 'Owlet Monster', rig: RIGS.owlet,                 requirement: { stat: 'level', value: 6 } },
  { id: 'rogue',     name: 'Rogue',         sheet: 'rogues', row: 0, col: 3, requirement: { stat: 'level', value: 7 }, facingRight: false },
  { id: 'gangster2', name: 'Wiseguy',       rig: RIGS.gangster2,             requirement: { stat: 'level', value: 8 } },
  { id: 'dude',      name: 'Dude Monster',  rig: RIGS.dude,                  requirement: { stat: 'level', value: 9 } },
  { id: 'bat',       name: 'Bat',           rig: RIGS.bat,                   requirement: { stat: 'level', value: 10 }, facingRight: false },
  { id: 'gangster1', name: 'Made Man',      rig: RIGS.gangster1,             requirement: { stat: 'level', value: 11 } },
  { id: 'knight',    name: 'Knight',        sheet: 'rogues', row: 1, col: 0, requirement: { stat: 'level', value: 12 }, facingRight: false },
  { id: 'punk',      name: 'Punk',          rig: RIGS.punk,                  requirement: { stat: 'level', value: 13 } },
  { id: 'soldier',   name: 'Soldier',       rig: RIGS.soldier,               requirement: { stat: 'level', value: 14 }, facingRight: false },
  { id: 'templar',   name: 'Templar',       sheet: 'rogues', row: 2, col: 4, requirement: { stat: 'level', value: 15 } },
  { id: 'orc',       name: 'Orc',           rig: RIGS.orc,                   requirement: { stat: 'level', value: 16 } },
  { id: 'biker',     name: 'Biker',         rig: RIGS.biker,                 requirement: { stat: 'level', value: 17 } },
  { id: 'warlock',   name: 'Warlock',       sheet: 'rogues', row: 4, col: 5, requirement: { stat: 'level', value: 18 } },
  { id: 'cyborg',    name: 'Cyborg',        rig: RIGS.cyborg,                requirement: { stat: 'level', value: 20 } },
].map(withUnlock);
export const DEFAULT_OUTFIT_ID = OUTFITS[0].id;

// A held item shown as a small badge in the corner of the character —
// sheet/row/col index into assets/32rogues/items.png (see items.txt).
export const ACCESSORIES = [
  { id: 'none',   name: 'None',         sheet: null,    row: null, col: null, requirement: null },
  { id: 'sword',  name: 'Iron Sword',   sheet: 'items', row: 0,    col: 1,    requirement: { stat: 'points', value: 200 } },
  { id: 'shield', name: 'Kite Shield',  sheet: 'items', row: 11,   col: 1,    requirement: { stat: 'points', value: 750 } },
  { id: 'staff',  name: 'Golden Staff', sheet: 'items', row: 10,   col: 4,    requirement: { stat: 'points', value: 2000 } },
  { id: 'ankh',   name: 'Ankh',         sheet: 'items', row: 16,   col: 6,    requirement: { stat: 'points', value: 5000 } },
].map(withUnlock);
export const DEFAULT_ACCESSORY_ID = ACCESSORIES[0].id;

const REQUIREMENT_NOUN = {
  level: (v) => `Unlocks at Level ${v}`,
  streakDays: (v) => `Unlocks at a ${v}-day streak`,
  points: (v) => `Unlocks at ${v.toLocaleString()} points`,
};

/** Human-readable unlock requirement, or null if already unlocked/free. */
export function unlockLabel(option, stats) {
  if (!option.requirement || meetsRequirement(option.requirement, stats)) return null;
  const noun = REQUIREMENT_NOUN[option.requirement.stat] || (() => 'Locked');
  return noun(option.requirement.value);
}
