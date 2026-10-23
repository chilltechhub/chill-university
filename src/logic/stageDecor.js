// src/logic/stageDecor.js
// A player's own layout for a scene: which items are in it, where, how big,
// which way they face, and where the pet's bowl sits. Saved per scene inside
// the character loadout (useCharacterLoadout.js `decor`), so it follows the
// account like the rest of the loadout (prefsSync.js).
//
// Layout shape: { items: [{ art, x, y, scale, flip }], bowlX }
//   x: the item's centre, as a fraction of the stage width
//   y: its bottom, as a fraction of the stage height above the ground line
//   scale: relative to a 300px-tall stage, like scene props
// No saved layout means the scene's own props (backgroundOptions.js).

import { ART, decorById } from '../data/sceneArt';

export const MAX_DECOR = 24;
export const DEFAULT_BOWL_X = 0.4;
export const SCALE_MIN = 0.4;
export const SCALE_MAX = 2.6;

// Where things stand, in px above the stage's bottom edge: on top of the
// tiled ground strip outdoors, on the floor band indoors, on the painted
// ground of a full scene.
const GROUND = { tile: 22, room: 12, plain: 12, image: 6 };
export const groundFor = (background) => GROUND[background?.kind] ?? 12;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A scene's own props, as an editable layout (what "Reset" goes back to).
// Wall items are measured from the top; the editor measures everything from
// the ground, so turn `top` into a height (at a 200px stage, near enough).
export function seedLayout(background, level = 1) {
  // Every prop from the start: decor no longer waits for a level (shake-up P5, §6.3).
  const items = (background?.props || [])
    .filter(p => ART[p.art])
    .map(p => {
      const scale = p.scale || 1;
      const y = p.top != null
        ? clamp(1 - p.top - (ART[p.art].h * scale) / 300 - 0.06, 0, 1)
        : (p.lift || 0);
      return { art: p.art, x: p.x, y, scale, flip: !!p.flip };
    });
  return { items, bowlX: DEFAULT_BOWL_X };
}

// Studio trophies they've earned (src/logic/studio.js trophyArts). Set by
// buildService whenever their Builds load or change, so every stage and
// the Decorate tray agree without each one loading Builds itself.
let earnedTrophies = new Set();
export function setEarnedTrophies(arts) { earnedTrophies = new Set(arts || []); }
export const trophyEarned = (art) => earnedTrophies.has(art);
// How many, for the room editor's Trophies (shake-up P5).
export const earnedTrophyCount = () => earnedTrophies.size;

// Trophies are earned by real work (a Build mastered); everything else is
// open (shake-up P5, §6.3).
export function decorAllowed(art, level, background) {
  const item = decorById(art);
  if (item?.build) return earnedTrophies.has(art);
  if (item) return true;
  return !!background?.props?.some(p => p.art === art);
}
