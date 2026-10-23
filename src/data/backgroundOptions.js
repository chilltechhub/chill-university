// src/data/backgroundOptions.js
// Landscape backdrops for the Player screen, unlocked by overall rank —
// rank is 1-20 where LOWER is better (rank 1 = top of the leaderboard);
// see context/UserProgressContext.js / src/logic/rankUtils.js.
//
// Kinds, tagged by `kind` (see LandscapeBackground.js):
//   - 'room': the default. The plain wall and floor, furnished; furniture
//     with `minLevel` moves in as you level up, so it starts nearly bare.
//   - 'plain': the same wall and floor, empty ("Blank").
//   - 'tile': a sky gradient + tiled "32rogues" ground strip
//   - 'image': a full illustrated scene, no cropping — CraftPix free packs
//     ("Nature Landscapes Free Pixel Art", "free-city-backgrounds-pixel-art",
//     Free Summer / Autumn / Winter Pixel Backgrounds, Free Pixel Art Street
//     Backgrounds; commercial OK, no attribution required, no resale, no
//     AI-training use). Each folder's flattened full composite is used (the
//     highest-numbered PNG, `origbig.png`, or the file named after the
//     scene) — every one checked for zero transparent pixels.
//
// Any kind can carry scenery, drawn by StageProps.js behind the character:
//   - `props`: objects from src/data/sceneArt.js. `x` is the centre as a
//     fraction of the width; `scale` is relative to a 300px-tall stage;
//     `top` (a fraction) hangs it on the wall instead of standing it on the
//     ground; `lift` (a fraction) raises it off the ground, e.g. onto the
//     shelf; `minLevel` holds it back until that level.
//   - `npc`: someone idling in the scene (sceneArt.js NPCS). `size` is a
//     fraction of the stage's height.

import { fetchContentPool } from '../api/remoteConfigService';

// Every cosmetic is open to everyone from the first minute (shake-up P5,
// §6.3: cosmetics without bait). Nothing can re-lock, so an equipped item
// always stays. Pets keep their own system (petOptions.js petsOpen).
function withUnlock(option) {
  return { ...option, unlock: () => true };
}

// Metro's bundler needs require() calls to be static string literals (no
// template interpolation), so each image gets its own literal require —
// see https://reactnative.dev/docs/images#static-image-resources.
export const BACKGROUNDS = [
  // Everyone starts in their room; it fills up as they level. The scenes
  // below are rewards to pick from Customize. First in the list, so it's
  // DEFAULT_BACKGROUND_ID.
  {
    id: 'room', name: 'Cozy Room', kind: 'room', maxRank: 20,
    props: [
      { art: 'windowCream', x: 0.34, top: 0.1, scale: 0.95 },
      { art: 'yarnPink', x: 0.47, scale: 0.9 },
      { art: 'ficus', x: 0.94, scale: 1.05, minLevel: 2 },
      { art: 'plantPainting', x: 0.7, top: 0.12, scale: 0.85, minLevel: 3 },
      { art: 'shelf', x: 0.09, scale: 0.95, minLevel: 4 },
      { art: 'bedBlue', x: 0.62, scale: 0.85, minLevel: 5 },
      { art: 'smallPlant', x: 0.09, lift: 0.4, scale: 0.9, minLevel: 6 },   // on top of the shelf
      { art: 'postPeach', x: 0.8, scale: 0.95, minLevel: 7 },
      { art: 'sunPainting', x: 0.84, top: 0.14, scale: 0.75, minLevel: 9 },
      { art: 'yarnBlue', x: 0.27, scale: 0.9, minLevel: 9 },
      { art: 'windowTan', x: 0.5, top: 0.1, scale: 0.95, minLevel: 12 },
      { art: 'catTree', x: 0.21, scale: 0.75, minLevel: 15 },
    ],
  },
  { id: 'plain', name: 'Blank', kind: 'plain', maxRank: 20 },
  {
    id: 'meadow', name: 'Sunny Meadow', kind: 'tile', maxRank: 20,
    sky: ['#8FD3F4', '#E8F9C9'],
    groundSheet: 'tiles', groundRow: 2, groundCol: 0,   // stone brick (pale, sage-tinted)
    props: [
      { art: 'pineTeal', x: 0.08, scale: 1.1 },
      { art: 'rock', x: 0.74, scale: 0.6 },
      { art: 'bigPine', x: 0.92, scale: 1.0 },
    ],
  },
  {
    id: 'farmhouse', name: 'Farmhouse', kind: 'image', maxRank: 20,
    source: require('../../assets/summer/PNG/summer 1/Summer1.png'),
  },
  {
    id: 'wildflowers', name: 'Wildflower Field', kind: 'image', maxRank: 20,
    source: require('../../assets/summer/PNG/summer 2/Summer2.png'),
  },
  {
    id: 'garden', name: 'Veggie Garden', kind: 'tile', maxRank: 20,
    sky: ['#A8DADC', '#F1FAEE'],
    groundSheet: 'tiles', groundRow: 0, groundCol: 0,   // dirt wall (warm)
    props: [
      { art: 'vegCarrot', x: 0.06, scale: 1.6 },
      { art: 'vegCabbage', x: 0.15, scale: 1.6 },
      { art: 'vegCorn', x: 0.24, scale: 1.6 },
      { art: 'vegTomato', x: 0.33, scale: 1.6 },
      { art: 'vegBroccoli', x: 0.68, scale: 1.6 },
      { art: 'vegEggplant', x: 0.77, scale: 1.6 },
      { art: 'pineTeal', x: 0.93, scale: 1.1 },
    ],
  },
  {
    id: 'greenhills', name: 'Green Hills', kind: 'image', maxRank: 19,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_2/origbig.png'),
  },
  {
    id: 'pinehills', name: 'Pine Hills', kind: 'image', maxRank: 19,
    source: require('../../assets/summer/PNG/summer 4/Summer4.png'),
  },
  {
    id: 'autumnmeadow', name: 'Autumn Meadow', kind: 'image', maxRank: 19,
    source: require('../../assets/autumn/PNG/background 1/background 1.png'),
  },
  {
    id: 'pineforest', name: 'Pine Forest', kind: 'image', maxRank: 18,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_4/origbig.png'),
  },
  {
    id: 'birchtrail', name: 'Birch Trail', kind: 'image', maxRank: 18,
    source: require('../../assets/summer/PNG/summer6/Summer6.png'),
    npc: { id: 'backpacker', x: 0.86, size: 0.6 },
  },
  {
    id: 'mainstreet', name: 'Main Street', kind: 'image', maxRank: 18,
    source: require('../../assets/street2d/PNG/City2/Bright/City2.png'),
    npc: { id: 'vendor', x: 0.14, size: 0.6 },
  },
  {
    id: 'mountainpeak', name: 'Mountain Peak', kind: 'image', maxRank: 17,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_3/origbig.png'),
  },
  {
    id: 'greenpeak', name: 'Green Peak', kind: 'image', maxRank: 17,
    source: require('../../assets/summer/PNG/summer5/Summer5.png'),
  },
  {
    id: 'snowfield', name: 'Snowfield', kind: 'image', maxRank: 17,
    source: require('../../assets/winter/1/3.png'),
  },
  {
    id: 'coastalcove', name: 'Coastal Cove', kind: 'image', maxRank: 16,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_7/origbig.png'),
  },
  {
    id: 'bigsky', name: 'Big Sky', kind: 'image', maxRank: 16,
    source: require('../../assets/summer/PNG/summer7/Summer7.png'),
  },
  {
    id: 'desert', name: 'Desert Bloom', kind: 'tile', maxRank: 16,
    sky: ['#F6C177', '#FBE3B4'],
    groundSheet: 'tiles', groundRow: 0, groundCol: 0,   // dirt wall (warm, sandy)
    props: [
      { art: 'saguaro', x: 0.07, scale: 1.0 },
      { art: 'agave', x: 0.3, scale: 0.75 },
      { art: 'pricklyPear', x: 0.7, scale: 0.9 },
      { art: 'aloe', x: 0.82, scale: 0.7 },
      { art: 'saguaroTall', x: 0.94, scale: 1.05 },
    ],
  },
  {
    id: 'forest', name: 'Deep Forest', kind: 'tile', maxRank: 15,
    sky: ['#274E3D', '#5C8A5A'],
    groundSheet: 'tiles', groundRow: 4, groundCol: 0,   // large stone (mossy olive)
    props: [
      { art: 'bigPine', x: 0.08, scale: 1.25 },
      { art: 'pineOlive', x: 0.27, scale: 1.1 },
      { art: 'pineTeal', x: 0.78, scale: 1.2 },
      { art: 'pineOlive', x: 0.94, scale: 1.25, flip: true },
    ],
  },
  {
    id: 'oldoak', name: 'Old Oak', kind: 'image', maxRank: 15,
    source: require('../../assets/autumn/PNG/background 2/background 2.png'),
  },
  {
    id: 'backalley', name: 'Back Alley', kind: 'image', maxRank: 15,
    source: require('../../assets/street2d/PNG/City1/Bright/City1.png'),
    npc: { id: 'sitter', x: 0.88, size: 0.5, flip: true },
  },
  {
    id: 'dawncity', name: 'Dawn City', kind: 'image', maxRank: 14,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 2/10.png'),
  },
  {
    id: 'peachclouds', name: 'Peach Clouds', kind: 'image', maxRank: 14,
    source: require('../../assets/summer/PNG/summer8/Summer8.png'),
  },
  {
    id: 'bamboo', name: 'Bamboo Grove', kind: 'tile', maxRank: 14,
    sky: ['#BFE3C0', '#F1F8E4'],
    groundSheet: 'tiles', groundRow: 4, groundCol: 0,   // large stone (mossy olive)
    props: [
      { art: 'bamboo4', x: 0.08, scale: 1.35 },
      { art: 'bamboo2', x: 0.22, scale: 1.3 },
      { art: 'bamboo3', x: 0.8, scale: 1.35 },
      { art: 'bamboo1', x: 0.93, scale: 1.3 },
    ],
  },
  {
    id: 'monoliths', name: 'Ancient Monoliths', kind: 'image', maxRank: 13,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_6/origbig.png'),
  },
  {
    id: 'redwoods', name: 'Red Woods', kind: 'image', maxRank: 13,
    source: require('../../assets/autumn/PNG/background 3/background 3.png'),
  },
  {
    id: 'fountainsquare', name: 'Fountain Square', kind: 'image', maxRank: 13,
    source: require('../../assets/street2d/PNG/City4/Bright/City4.png'),
    npc: { id: 'wanderer', x: 0.12, size: 0.6 },
  },
  {
    id: 'rosecity', name: 'Rose City', kind: 'image', maxRank: 12,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 4/9.png'),
  },
  {
    id: 'frozenlake', name: 'Frozen Lake', kind: 'image', maxRank: 12,
    source: require('../../assets/winter/2/5.png'),
  },
  {
    id: 'mainstreetdusk', name: 'Main Street at Dusk', kind: 'image', maxRank: 12,
    source: require('../../assets/street2d/PNG/City2/Pale/City2_pale.png'),
    npc: { id: 'vendor', x: 0.14, size: 0.6 },
  },
  {
    id: 'blushcity', name: 'Blush City', kind: 'image', maxRank: 11,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 3/7.png'),
  },
  {
    id: 'goldengrove', name: 'Golden Grove', kind: 'image', maxRank: 11,
    source: require('../../assets/autumn/PNG/background 4/background 4.png'),
  },
  {
    id: 'snowywoods', name: 'Snowy Woods', kind: 'tile', maxRank: 11,
    sky: ['#9DB4CF', '#E6EEF6'],
    groundSheet: 'tiles', groundRow: 2, groundCol: 0,   // stone brick (pale)
    props: [
      { art: 'snowyPine', x: 0.08, scale: 1.2 },
      { art: 'iceRock', x: 0.3, scale: 0.75 },
      { art: 'bareTree', x: 0.74, scale: 1.1 },
      { art: 'snowyPine', x: 0.93, scale: 1.05, flip: true },
    ],
  },
  {
    id: 'mountain', name: 'Mountain Pass', kind: 'tile', maxRank: 10,
    sky: ['#4A6FA5', '#B8D4E8'],
    groundSheet: 'tiles', groundRow: 1, groundCol: 0,   // rough stone (purple-gray rock)
    props: [
      { art: 'rock', x: 0.12, scale: 0.7 },
      { art: 'snowyPine', x: 0.7, scale: 1.0 },
      { art: 'bareTree', x: 0.9, scale: 1.15 },
    ],
  },
  {
    id: 'stormvalley', name: 'Storm Valley', kind: 'image', maxRank: 10,
    source: require('../../assets/summer/PNG/summer 3/Summer3.png'),
  },
  {
    id: 'backalleydusk', name: 'Back Alley at Dusk', kind: 'image', maxRank: 10,
    source: require('../../assets/street2d/PNG/City1/Pale/City1.png'),
    npc: { id: 'sitter', x: 0.88, size: 0.5, flip: true },
  },
  {
    id: 'nightcity', name: 'Night City', kind: 'image', maxRank: 9,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 1/10.png'),
  },
  {
    id: 'neonblock', name: 'Neon Block', kind: 'image', maxRank: 9,
    source: require('../../assets/street2d/PNG/City3/Bright/City3.png'),
    npc: { id: 'firestarter', x: 0.86, size: 0.5, flip: true },
  },
  {
    id: 'reef', name: 'Coral Reef', kind: 'tile', maxRank: 9,
    sky: ['#0E4C75', '#2E8BC0'],
    groundSheet: 'tiles', groundRow: 0, groundCol: 0,   // dirt wall (sandy sea floor)
    props: [
      { art: 'coralRed', x: 0.08, scale: 1.25 },
      { art: 'coralOrange', x: 0.24, scale: 1.1 },
      { art: 'rock', x: 0.62, scale: 0.5 },
      { art: 'coralPurple', x: 0.78, scale: 1.15 },
      { art: 'coralRed', x: 0.93, scale: 1.0, flip: true },
    ],
  },
  {
    id: 'aurora', name: 'Aurora Peaks', kind: 'image', maxRank: 8,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_5/origbig.png'),
  },
  {
    id: 'winternight', name: 'Winter Night', kind: 'image', maxRank: 8,
    source: require('../../assets/winter/3/10.png'),
  },
  {
    id: 'beach', name: 'Sunset Beach', kind: 'tile', maxRank: 7,
    sky: ['#F4A261', '#E76F51'],
    groundSheet: 'tiles', groundRow: 0, groundCol: 0,   // dirt wall (warm, sandy)
    props: [
      { art: 'coralRed', x: 0.1, scale: 0.9 },
      { art: 'coralPurple', x: 0.22, scale: 0.8 },
      { art: 'pricklyPear', x: 0.8, scale: 0.85 },
      { art: 'saguaroTall', x: 0.94, scale: 0.9 },
    ],
  },
  {
    id: 'fountaindusk', name: 'Old Town Square', kind: 'image', maxRank: 7,
    source: require('../../assets/street2d/PNG/City4/Pale/City4_pale.png'),
    npc: { id: 'wanderer', x: 0.12, size: 0.6 },
  },
  {
    id: 'cyberteal', name: 'Cyber Teal City', kind: 'image', maxRank: 6,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 5/7.png'),
  },
  {
    id: 'icedusk', name: 'Ice Dusk', kind: 'image', maxRank: 6,
    source: require('../../assets/winter/4/5.png'),
  },
  {
    id: 'cyberpink', name: 'Cyber Pink City', kind: 'image', maxRank: 5,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 6/8.png'),
  },
  {
    id: 'neondusk', name: 'Neon Block at Dusk', kind: 'image', maxRank: 5,
    source: require('../../assets/street2d/PNG/City3/Pale/City3_pale.png'),
    npc: { id: 'firestarter', x: 0.86, size: 0.5, flip: true },
  },
  {
    id: 'nebula', name: 'Space Nebula', kind: 'tile', maxRank: 4,
    sky: ['#1B1035', '#5B2A86'],
    groundSheet: 'tiles', groundRow: 5, groundCol: 0,   // catacombs (dark, moody)
    propRow: null, propCol: null,
  },
  {
    id: 'mistycity', name: 'Misty Rose City', kind: 'image', maxRank: 3,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 7/7.png'),
  },
  {
    id: 'mintcity', name: 'Mint Night City', kind: 'image', maxRank: 2,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 8/7.png'),
  },
  {
    id: 'throne', name: 'Golden Throne Room', kind: 'tile', maxRank: 1,
    sky: ['#2A1F06', '#E8B34A'],
    groundSheet: 'tiles', groundRow: 3, groundCol: 0,   // igneous (regal deep red)
    propRow: 17, propCol: 0,                            // treasure chest
  },
  {
    // pixel-1992.itch.io — free for commercial use, no attribution required,
    // no resale/redistribution. Tied with Golden Throne Room at the very
    // top of the ladder — both are the rarest unlock, rank 1.
    id: 'gothiccastle', name: 'Gothic Castle', kind: 'image', maxRank: 1,
    source: require('../../assets/HR_Dark Gothic Castle.png'),
  },
].map(withUnlock);

export const DEFAULT_BACKGROUND_ID = BACKGROUNDS[0].id;

// Every backdrop is open (above), so there's nothing to say.
export function backgroundUnlockLabel() {
  return null;
}

// Admin-added backgrounds from Supabase (app_content, type='background_option')
// — appended onto BACKGROUNDS in place, so every existing consumer (which
// just imports the BACKGROUNDS array) picks them up with no changes. Only
// the 'image' kind (one flat illustration) can come from a remote URL —
// see supabase/migrations/20260828_remote_art_storage.sql for why, and
// for the exact row shape to add one. Call once at app launch (see
// App.js); guarded so a second call never double-appends.
let remoteBackgroundsLoaded = false;
export async function loadRemoteBackgrounds() {
  if (remoteBackgroundsLoaded) return;
  remoteBackgroundsLoaded = true;
  const rows = await fetchContentPool('background_option');
  rows.forEach((row) => {
    if (!row.meta?.imageUrl || BACKGROUNDS.some((b) => b.id === row.id)) return;
    BACKGROUNDS.push(withUnlock({
      id: row.id,
      name: row.title,
      kind: 'image',
      source: { uri: row.meta.imageUrl },
      maxRank: row.meta.maxRank ?? 20,
    }));
  });
}
