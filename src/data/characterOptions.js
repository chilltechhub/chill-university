// src/data/characterOptions.js
// Character customization catalog — outfits and accessory badges.
//
// Outfits mix three kinds of art on one unlock ladder, on purpose (none
// of them replace another — all three are kept side by side):
//   - static "32rogues" portraits (sheet/row/col into rogues.png via
//     src/components/SpriteIcon.js) — one pose; CharacterWalker.js gives
//     these a little hop + a flip to sell "walking" since there's no
//     walk-cycle frame data for them.
//   - animated rigs (src/data/characterRigs.js) — real idle/walk frame
//     animation, played by src/components/AnimatedSprite.js.
//   - standalone portraits (`image`) — one pre-cropped picture, no sheet
//     to index into. Gets the same hop treatment as the 32rogues
//     portraits (still no walk-cycle frames). `imageAspect` (width÷height)
//     keeps each one's own proportions instead of stretching/squashing it
//     into a square box — see PlayerCharacter.js.
// PlayerCharacter.js picks the right renderer per-outfit based on which
// of `rig` / `sheet` / `image` the entry carries.
//
// The `image` outfits — Woodland Warden, Tide Conjurer, Shadowblade,
// Fangguard, Emberweaver, Nightwhisper, Starforged Knight, Sunfall
// Champion, Crimson Sentinel — are a curated 9-of-526 pick from "500 Free
// Pixel Art Fantasy Character Pack" (batareya.itch.io/
// 500-free-pixel-art-fantasy-character-pack — commercial/modification OK,
// no resale/redistribution of the pack). Each source file is one
// character alone on a big *opaque black* canvas (not transparent — real
// RGB(0,0,0), confirmed by sampling pixels directly), so before either was
// usable here every pick got background-removed (flood-filled from the
// canvas edges, so the character's own near-black shadow/armor pixels —
// which aren't pure (0,0,0) — survive untouched) and auto-cropped to its
// actual content, saved into assets/Characters/curated/. The other ~517
// characters in that pack are untouched — same background-removal script,
// just not yet run on them; ask if you want more picked and added.
//
// The level cap is 20 (src/logic/gamificationService.js getLevel()). With
// 34 outfits now sharing that range, several levels unlock more than one
// at once (same reasoning as petOptions.js after its own recent
// additions) — 7 are starter-tier (see the note above OUTFITS), the
// other 27 are spread across levels 2-20 by requirement, doubled up at
// most levels rather than each getting its own untouched rung.
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
//
// Homesteader/Squire/Grunt and Prep Student/Uniform Cadet/Bookworm (added
// with the second sprite batch) don't have that same live-play trail yet
// — they're read from their walk-cycle frames the careful way (multiple
// frames, not a single crop), same method that's been reliable since the
// Gangster mistake, but not yet watched moving in-app the way everything
// above was. The schoolgirl trio's walk cycles are unambiguous side-view
// strides (clearly facing right); the Pixel Character Pack trio's
// idle/walk is a near-frontal bob rather than a side profile, so a flip
// either way reads fine — left at the default (facing right) rather than
// guessing a `false` with nothing but a symmetric bob to judge it from.
//
// The 9 curated `image` portraits have even less to go on than that —
// one static hero-select-screen pose each, no walk cycle or even a second
// frame to compare against, mostly front-on or three-quarter. None had a
// lean or weapon-hand clear enough to call a `false` from with any real
// confidence (the way Templar's/Warlock's forward-weapon-hand read did),
// so all 9 are left at the default. Static portraits like this tolerate a
// wrong flip far better than a side-view walker would — worth fixing if
// one looks off in play, but not worth a guess dressed up as a finding.

import { RIGS } from './characterRigs';

function meetsRequirement(requirement, stats) {
  if (!requirement) return true;
  return (stats[requirement.stat] || 0) >= requirement.value;
}

function withUnlock(option) {
  return { ...option, unlock: (stats) => meetsRequirement(option.requirement, stats) };
}

// Starter-tier outfits — `requirement: null`, so ALL of these (not just
// Peasant) are available from the very first level. useCharacterLoadout's
// DEFAULT_OUTFIT_ID stays Peasant (existing players' equipped outfit
// doesn't change under them), but MultiStepOnboarding's character step
// lets a brand-new player choose among all of them, not just one fixed
// look — see Step3 in that file.
export const OUTFITS = [
  { id: 'peasant',   name: 'Peasant',       sheet: 'rogues', row: 6, col: 1, requirement: null, facingRight: false },
  { id: 'homesteader', name: 'Homesteader', rig: RIGS.homesteader,           requirement: null },
  { id: 'squire',    name: 'Squire',        rig: RIGS.squire,                requirement: null },
  { id: 'grunt',     name: 'Grunt',         rig: RIGS.grunt,                 requirement: null },
  { id: 'prepstudent', name: 'Prep Student', rig: RIGS.prepstudent,          requirement: null },
  { id: 'uniformcadet', name: 'Uniform Cadet', rig: RIGS.uniformcadet,       requirement: null },
  { id: 'bookworm',  name: 'Bookworm',      rig: RIGS.bookworm,              requirement: null },
  { id: 'pink',      name: 'Pink Monster',  rig: RIGS.pink,                  requirement: { stat: 'level', value: 2 } },
  { id: 'woodlandwarden', name: 'Woodland Warden', image: require('../../assets/Characters/curated/1.png'), imageAspect: 272/656, requirement: { stat: 'level', value: 2 } },
  { id: 'mushroom',  name: 'Mushroom',      rig: RIGS.mushroom,              requirement: { stat: 'level', value: 3 } },
  { id: 'farmer',    name: 'Farmer',        sheet: 'rogues', row: 5, col: 0, requirement: { stat: 'level', value: 4 }, facingRight: false },
  { id: 'tideconjurer', name: 'Tide Conjurer', image: require('../../assets/Characters/curated/50.png'), imageAspect: 336/744, requirement: { stat: 'level', value: 4 } },
  { id: 'gangster3', name: 'Gangster',      rig: RIGS.gangster3,             requirement: { stat: 'level', value: 5 } },
  { id: 'owlet',     name: 'Owlet Monster', rig: RIGS.owlet,                 requirement: { stat: 'level', value: 6 } },
  { id: 'shadowblade', name: 'Shadowblade', image: require('../../assets/Characters/curated/120.png'), imageAspect: 240/688, requirement: { stat: 'level', value: 6 } },
  { id: 'rogue',     name: 'Rogue',         sheet: 'rogues', row: 0, col: 3, requirement: { stat: 'level', value: 7 }, facingRight: false },
  { id: 'gangster2', name: 'Wiseguy',       rig: RIGS.gangster2,             requirement: { stat: 'level', value: 8 } },
  { id: 'fangguard', name: 'Fangguard',     image: require('../../assets/Characters/curated/300.png'), imageAspect: 288/632, requirement: { stat: 'level', value: 8 } },
  { id: 'dude',      name: 'Dude Monster',  rig: RIGS.dude,                  requirement: { stat: 'level', value: 9 } },
  { id: 'bat',       name: 'Bat',           rig: RIGS.bat,                   requirement: { stat: 'level', value: 10 }, facingRight: false },
  { id: 'emberweaver', name: 'Emberweaver', image: require('../../assets/Characters/curated/450.png'), imageAspect: 312/744, requirement: { stat: 'level', value: 10 } },
  { id: 'gangster1', name: 'Made Man',      rig: RIGS.gangster1,             requirement: { stat: 'level', value: 11 } },
  { id: 'knight',    name: 'Knight',        sheet: 'rogues', row: 1, col: 0, requirement: { stat: 'level', value: 12 }, facingRight: false },
  { id: 'nightwhisper', name: 'Nightwhisper', image: require('../../assets/Characters/curated/470.png'), imageAspect: 264/600, requirement: { stat: 'level', value: 12 } },
  { id: 'punk',      name: 'Punk',          rig: RIGS.punk,                  requirement: { stat: 'level', value: 13 } },
  { id: 'soldier',   name: 'Soldier',       rig: RIGS.soldier,               requirement: { stat: 'level', value: 14 }, facingRight: false },
  { id: 'templar',   name: 'Templar',       sheet: 'rogues', row: 2, col: 4, requirement: { stat: 'level', value: 15 } },
  { id: 'starforgedknight', name: 'Starforged Knight', image: require('../../assets/Characters/curated/510.png'), imageAspect: 312/872, requirement: { stat: 'level', value: 15 } },
  { id: 'orc',       name: 'Orc',           rig: RIGS.orc,                   requirement: { stat: 'level', value: 16 } },
  { id: 'biker',     name: 'Biker',         rig: RIGS.biker,                 requirement: { stat: 'level', value: 17 } },
  { id: 'warlock',   name: 'Warlock',       sheet: 'rogues', row: 4, col: 5, requirement: { stat: 'level', value: 18 } },
  { id: 'sunfallchampion', name: 'Sunfall Champion', image: require('../../assets/Characters/curated/520.png'), imageAspect: 368/936, requirement: { stat: 'level', value: 19 } },
  { id: 'cyborg',    name: 'Cyborg',        rig: RIGS.cyborg,                requirement: { stat: 'level', value: 20 } },
  { id: 'crimsonsentinel', name: 'Crimson Sentinel', image: require('../../assets/Characters/curated/526.png'), imageAspect: 328/816, requirement: { stat: 'level', value: 20 } },
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
