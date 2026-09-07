// src/data/backgroundOptions.js
// Landscape backdrops for the Player screen, unlocked by overall rank —
// rank is 1-20 where LOWER is better (rank 1 = top of the leaderboard);
// see context/UserProgressContext.js / src/logic/rankUtils.js.
//
// Two kinds, tagged by `kind` (see LandscapeBackground.js):
//   - 'tile': the original sky-gradient + tiled "32rogues" ground strip
//   - 'image': a full illustrated scene, no cropping — CraftPix free packs
//     ("Nature Landscapes Free Pixel Art", "free-city-backgrounds-pixel-art";
//     commercial OK, no attribution required, no resale, no AI-training use)
//     Each folder's highest-numbered PNG (or nature's own `origbig.png`) is
//     the flattened full composite — verified by eye, not just file names,
//     since a couple of packs' numbering turned out not to match their own
//     naming convention on inspection.

import { fetchContentPool } from '../api/remoteConfigService';

function withUnlock(option) {
  return { ...option, unlock: (stats) => (stats.rank ?? 20) <= option.maxRank };
}

// Metro's bundler needs require() calls to be static string literals (no
// template interpolation), so each image gets its own literal require —
// see https://reactnative.dev/docs/images#static-image-resources.
export const BACKGROUNDS = [
  {
    id: 'meadow', name: 'Sunny Meadow', kind: 'tile', maxRank: 20,
    sky: ['#8FD3F4', '#E8F9C9'],
    groundSheet: 'tiles', groundRow: 2, groundCol: 0,   // stone brick (pale, sage-tinted)
    propRow: 25, propCol: 1,                            // small tree
  },
  {
    id: 'greenhills', name: 'Green Hills', kind: 'image', maxRank: 19,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_2/origbig.png'),
  },
  {
    id: 'pineforest', name: 'Pine Forest', kind: 'image', maxRank: 18,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_4/origbig.png'),
  },
  {
    id: 'mountainpeak', name: 'Mountain Peak', kind: 'image', maxRank: 17,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_3/origbig.png'),
  },
  {
    id: 'coastalcove', name: 'Coastal Cove', kind: 'image', maxRank: 16,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_7/origbig.png'),
  },
  {
    id: 'forest', name: 'Deep Forest', kind: 'tile', maxRank: 15,
    sky: ['#274E3D', '#5C8A5A'],
    groundSheet: 'tiles', groundRow: 4, groundCol: 0,   // large stone (mossy olive)
    propRow: 25, propCol: 2,                            // full pine tree
  },
  {
    id: 'dawncity', name: 'Dawn City', kind: 'image', maxRank: 14,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 2/10.png'),
  },
  {
    id: 'monoliths', name: 'Ancient Monoliths', kind: 'image', maxRank: 13,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_6/origbig.png'),
  },
  {
    id: 'rosecity', name: 'Rose City', kind: 'image', maxRank: 12,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 4/9.png'),
  },
  {
    id: 'blushcity', name: 'Blush City', kind: 'image', maxRank: 11,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 3/7.png'),
  },
  {
    id: 'mountain', name: 'Mountain Pass', kind: 'tile', maxRank: 10,
    sky: ['#4A6FA5', '#B8D4E8'],
    groundSheet: 'tiles', groundRow: 1, groundCol: 0,   // rough stone (purple-gray rock)
    propRow: 18, propCol: 1,                            // boulder
  },
  {
    id: 'nightcity', name: 'Night City', kind: 'image', maxRank: 9,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 1/10.png'),
  },
  {
    id: 'aurora', name: 'Aurora Peaks', kind: 'image', maxRank: 8,
    source: require('../../assets/Nature Landscapes Free Pixel Art/nature_5/origbig.png'),
  },
  {
    id: 'beach', name: 'Sunset Beach', kind: 'tile', maxRank: 7,
    sky: ['#F4A261', '#E76F51'],
    groundSheet: 'tiles', groundRow: 0, groundCol: 0,   // dirt wall (warm, sandy)
    propRow: 17, propCol: 4,                            // barrel
  },
  {
    id: 'cyberteal', name: 'Cyber Teal City', kind: 'image', maxRank: 6,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 5/7.png'),
  },
  {
    id: 'cyberpink', name: 'Cyber Pink City', kind: 'image', maxRank: 5,
    source: require('../../assets/free-city-backgrounds-pixel-art/city 6/8.png'),
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

export function backgroundUnlockLabel(option, stats) {
  if ((stats.rank ?? 20) <= option.maxRank) return null;
  return `Unlocks at Rank ${option.maxRank} or better`;
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
