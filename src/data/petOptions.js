// src/data/petOptions.js
// Pet companion tiers — unlocked by overall level, escalating in rarity.
// Three rendering kinds, tagged by `kind` (see PetCompanion.js):
//   - 'sprite': a static crop from the "32rogues" animals sheet
//   - 'animated': a real multi-frame animation loop, playing its Idle loop
//     continuously (pets don't walk with the player, so there's no need
//     for idle/walk frame sets — just the one loop):
//       - Fairy (papoycore.itch.io/fairy — commercial/modification OK, no resale)
//       - Street Animal pack (CraftPix, free license): Dog/Dog2/Cat/Cat2/Rat/Rat2/Bird/Bird2
//   - 'image': one standalone image, no cropping — "Free Mythic Monsters"
//     (willibab.itch.io/free-mythic-monsters — commercial OK)
// The level cap is 20 (src/logic/gamificationService.js getLevel()), so
// all 17 tiers fit inside levels 1-20.
//
// `facingRight` records which way the art itself natively faces — not
// every sheet agrees, so CharacterWalker.js can't assume "unflipped means
// facing right" for all of them. Omitted (or true) = faces right by
// default; only set `false` for the ones verified (by cropping and
// comparing against a center line, not guessing) to face left instead:
// Rabbit, Fox, Wolf, Lion, Rat.

import { fetchContentPool } from '../api/remoteConfigService';

function withUnlock(option) {
  return { ...option, unlock: (stats) => (stats.level || 0) >= option.requiredLevel };
}

// Metro's bundler needs require() calls to be static string literals (no
// template interpolation), so each image gets its own literal require —
// see https://reactnative.dev/docs/images#static-image-resources.
export const PET_TIERS = [
  { id: 'rabbit',    name: 'Rabbit',          kind: 'sprite',   sheet: 'animals', row: 6, col: 6, requiredLevel: 1, facingRight: false },
  {
    id: 'dog', name: 'Dog', kind: 'animated', requiredLevel: 2,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/1 Dog/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  { id: 'fox',       name: 'Fox',             kind: 'sprite',   sheet: 'animals', row: 4, col: 3, requiredLevel: 3, facingRight: false },
  {
    id: 'cat', name: 'Cat', kind: 'animated', requiredLevel: 4,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/3 Cat/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  {
    id: 'fairy', name: 'Fairy', kind: 'animated', requiredLevel: 5,
    sheet: { source: require('../../assets/Fairy/Fairy 1.png'), frameWidth: 32, frameHeight: 32, frames: 8 },
  },
  {
    id: 'rat', name: 'Rat', kind: 'animated', requiredLevel: 6, facingRight: false,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/5 Rat/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'wolf',      name: 'Wolf',            kind: 'sprite',   sheet: 'animals', row: 4, col: 6, requiredLevel: 7, facingRight: false },
  {
    id: 'bird', name: 'Bird', kind: 'animated', requiredLevel: 8,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/7 Bird/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'jellyfish', name: 'Jellyfish Spirit',kind: 'image',    source: require('../../assets/Free Mythic Monsters/Free Mythic Monsters/Transparent/3x Size/010_1.png'), requiredLevel: 9 },
  {
    id: 'dog2', name: 'Alley Dog', kind: 'animated', requiredLevel: 10,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/2 Dog 2/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  {
    id: 'cat2', name: 'Tabby Cat', kind: 'animated', requiredLevel: 11,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/4 Cat 2/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  { id: 'lion',      name: 'Lion',            kind: 'sprite',   sheet: 'animals', row: 3, col: 6, requiredLevel: 12, facingRight: false },
  {
    id: 'rat2', name: 'Sewer Rat', kind: 'animated', requiredLevel: 13,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/6 Rat 2/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'naga',      name: 'Naga',            kind: 'image',    source: require('../../assets/Free Mythic Monsters/Free Mythic Monsters/Transparent/3x Size/031_1.png'), requiredLevel: 15 },
  {
    id: 'bird2', name: 'Crow', kind: 'animated', requiredLevel: 17,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/8 Bird 2/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'bear',      name: 'Grizzly Bear',    kind: 'sprite',   sheet: 'animals', row: 0, col: 0, requiredLevel: 18 },
  { id: 'spider',    name: 'Spider Guardian', kind: 'image',    source: require('../../assets/Free Mythic Monsters/Free Mythic Monsters/Transparent/3x Size/001_1.png'), requiredLevel: 20 },
].map(withUnlock);

export const DEFAULT_PET_ID = PET_TIERS[0].id;

export function petUnlockLabel(option, stats) {
  if ((stats.level || 0) >= option.requiredLevel) return null;
  return `Unlocks at Level ${option.requiredLevel}`;
}

// Admin-added pets from Supabase (app_content, type='pet_option') —
// appended onto PET_TIERS in place, so every existing consumer (which
// just imports the PET_TIERS array) picks them up with no changes. Only
// the 'image' kind (one flat picture) can come from a remote URL — see
// supabase/migrations/20260828_remote_art_storage.sql for why, and for
// the exact row shape to add one. Call once at app launch (see App.js);
// guarded so a second call never double-appends.
let remotePetsLoaded = false;
export async function loadRemotePets() {
  if (remotePetsLoaded) return;
  remotePetsLoaded = true;
  const rows = await fetchContentPool('pet_option');
  rows.forEach((row) => {
    if (!row.meta?.imageUrl || PET_TIERS.some((p) => p.id === row.id)) return;
    PET_TIERS.push(withUnlock({
      id: row.id,
      name: row.title,
      kind: 'image',
      source: { uri: row.meta.imageUrl },
      requiredLevel: row.meta.requiredLevel || 1,
      facingRight: row.meta.facingRight !== false,
    }));
  });
}
