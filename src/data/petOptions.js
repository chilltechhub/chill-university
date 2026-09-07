// src/data/petOptions.js
// Pet companion tiers — unlocked by overall level, escalating in rarity.
// Three rendering kinds, tagged by `kind` (see PetCompanion.js):
//   - 'sprite': a static crop from the "32rogues" animals sheet
//   - 'animated': a real multi-frame animation loop, playing its Idle loop
//     continuously (pets don't walk with the player, so there's no need
//     for idle/walk frame sets — just the one loop):
//       - Fairy (papoycore.itch.io/fairy — commercial/modification OK, no resale)
//       - Street Animal pack (CraftPix, free license): Dog/Dog2/Cat/Cat2/Rat/Rat2/Bird/Bird2
//       - "Animal Mega Pack" (toffeecraft.itch.io/animal-mega-pack —
//         commercial/modification OK, no resale/redistribution): Garden
//         Bird, Tree Frog, Golden Retriever, Playful Kitten, Jackrabbit,
//         Backyard Pig, Napping Pup. Each frame ships as its own numbered
//         PNG rather than one sheet — composed into a single horizontal
//         strip per animal (see each folder's own `_strip.png`, built
//         with a small PowerShell script, not hand-drawn) so these load
//         through the same sheet+frameWidth+frameHeight+frames shape as
//         every other 'animated' entry instead of needing a new loader.
//   - 'image': one standalone image, no cropping:
//       - "Free Mythic Monsters" (willibab.itch.io/free-mythic-monsters —
//         commercial OK): Jellyfish Spirit, Naga, Spider Guardian.
//       - "Fake MMX Bosses" (vubidugil-nrick.itch.io/fakemmxbosses —
//         commercial/modification OK, no resale/redistribution, no AI
//         training, no NFT use): Windbeak, Bladefin, Shellguard,
//         Stingwing, Sky Raider, Bloomfang, Gorilla Unit, Ironhide,
//         Voidclaw, Towerneck. Ten fictional Mega-Man-X-style boss
//         robots, each themed after an animal (which is also, confusingly,
//         what their asset folders are named — Dog, Macaw, Nepenthes,
//         Panther, Pelican, Pig, Roach, Swordfish, Tortoise, giraffe —
//         easy to mistake for the Animal Mega Pack at a glance, but the
//         art is unmistakably armored robots, not animals, once you
//         actually open a frame). These point straight at each boss's own
//         numbered `00` frame (a real standalone transparent PNG, not the
//         composed strip) rather than being 'animated' with `frames: 1` —
//         every one of these ten numbered sequences is a single idle pose
//         (frame 0) followed by an entire one-shot attack/death animation
//         (a roll-and-fly-off projectile for Panther, a full
//         shatter-into-debris explosion for giraffe), and AnimatedSprite
//         always stretches the *whole* source image across `frames ×
//         frameWidth` — telling it `frames: 1` while `sheet.source` still
//         pointed at the full multi-frame strip squeezed all of that
//         attack animation into a one-frame-wide box: an illegible
//         horizontally-crushed smear, not a clean idle pose. Pointing
//         `source` straight at frame 0's own file sidesteps the whole
//         mechanism — nothing left to stretch.
// The level cap is 20 (src/logic/gamificationService.js getLevel()). With
// 34 tiers now sharing that same 1-20 range, several levels unlock more
// than one pet at once — nothing wrong with that, `requiredLevel` was
// always just "unlocked at or after," never "exactly one per level."
//
// `facingRight` records which way the art itself natively faces — not
// every sheet agrees, so CharacterWalker.js can't assume "unflipped means
// facing right" for all of them. Omitted (or true) = faces right by
// default; only set `false` for the ones verified (by cropping and
// comparing against a center line, not guessing) to face left instead:
// Rabbit, Fox, Wolf, Lion, Rat, Garden Bird, Tree Frog, Backyard Pig,
// Napping Pup, Windbeak, Bladefin.
//
// The ten boss pets don't have a walk cycle to read at all (bosses got
// combat animations, not a stroll) — only an idle/attack loop to judge
// facing from, and most of those poses read as roughly symmetric fighting
// stances rather than a clear lean either way. Windbeak (beak) and
// Bladefin (blade) had an unambiguous lean and got `facingRight: false`;
// the rest were left at the default rather than guessing from a stance
// that isn't really designed to say which way it's "facing."

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
  {
    id: 'gardenbird', name: 'Garden Bird', kind: 'animated', requiredLevel: 2, facingRight: false,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/BirdFly.png'), frameWidth: 16, frameHeight: 16, frames: 8 },
  },
  { id: 'fox',       name: 'Fox',             kind: 'sprite',   sheet: 'animals', row: 4, col: 3, requiredLevel: 3, facingRight: false },
  {
    id: 'kitten', name: 'Playful Kitten', kind: 'animated', requiredLevel: 3,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/JumpCattt.png'), frameWidth: 32, frameHeight: 32, frames: 13 },
  },
  {
    id: 'cat', name: 'Cat', kind: 'animated', requiredLevel: 4,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/3 Cat/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  {
    id: 'jackrabbit', name: 'Jackrabbit', kind: 'animated', requiredLevel: 4,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/Jumping.png'), frameWidth: 32, frameHeight: 32, frames: 11 },
  },
  {
    id: 'fairy', name: 'Fairy', kind: 'animated', requiredLevel: 5,
    sheet: { source: require('../../assets/Fairy/Fairy 1.png'), frameWidth: 32, frameHeight: 32, frames: 8 },
  },
  {
    id: 'rat', name: 'Rat', kind: 'animated', requiredLevel: 6, facingRight: false,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/5 Rat/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  {
    id: 'treefrog', name: 'Tree Frog', kind: 'animated', requiredLevel: 6, facingRight: false,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/FrogIdle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'wolf',      name: 'Wolf',            kind: 'sprite',   sheet: 'animals', row: 4, col: 6, requiredLevel: 7, facingRight: false },
  {
    id: 'goldenretriever', name: 'Golden Retriever', kind: 'animated', requiredLevel: 7,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/GoldenBarking.png'), frameWidth: 64, frameHeight: 64, frames: 11 },
  },
  {
    id: 'bird', name: 'Bird', kind: 'animated', requiredLevel: 8,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/7 Bird/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'jellyfish', name: 'Jellyfish Spirit',kind: 'image',    source: require('../../assets/Free Mythic Monsters/Free Mythic Monsters/Transparent/3x Size/010_1.png'), requiredLevel: 9 },
  {
    id: 'nappingpup', name: 'Napping Pup', kind: 'animated', requiredLevel: 9, facingRight: false,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/SleepDog.png'), frameWidth: 64, frameHeight: 64, frames: 8 },
  },
  {
    id: 'dog2', name: 'Alley Dog', kind: 'animated', requiredLevel: 10,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/2 Dog 2/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  {
    id: 'backyardpig', name: 'Backyard Pig', kind: 'animated', requiredLevel: 10, facingRight: false,
    sheet: { source: require('../../assets/FreeAnimalPack/FreeAnimalPack/PigIdle.png'), frameWidth: 64, frameHeight: 64, frames: 4 },
  },
  {
    id: 'cat2', name: 'Tabby Cat', kind: 'animated', requiredLevel: 11,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/4 Cat 2/Idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
  },
  { id: 'windbeak',   name: 'Windbeak',   kind: 'image', source: require('../../assets/Pelican/Pelican 00.png'), requiredLevel: 11, facingRight: false },
  { id: 'lion',      name: 'Lion',            kind: 'sprite',   sheet: 'animals', row: 3, col: 6, requiredLevel: 12, facingRight: false },
  { id: 'bladefin',   name: 'Bladefin',   kind: 'image', source: require('../../assets/Swordfish/Swordfish 00.png'), requiredLevel: 12, facingRight: false },
  {
    id: 'rat2', name: 'Sewer Rat', kind: 'animated', requiredLevel: 13,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/6 Rat 2/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'shellguard', name: 'Shellguard', kind: 'image', source: require('../../assets/Tortoise/Tortoise 00.png'), requiredLevel: 13 },
  { id: 'stingwing',  name: 'Stingwing',  kind: 'image', source: require('../../assets/Roach/Roach 00.png'), requiredLevel: 14 },
  { id: 'naga',      name: 'Naga',            kind: 'image',    source: require('../../assets/Free Mythic Monsters/Free Mythic Monsters/Transparent/3x Size/031_1.png'), requiredLevel: 15 },
  { id: 'skyraider',  name: 'Sky Raider', kind: 'image', source: require('../../assets/Macaw/Macaw 00.png'), requiredLevel: 15 },
  { id: 'bloomfang',  name: 'Bloomfang',  kind: 'image', source: require('../../assets/Nepenthes/Nepenthes 00.png'), requiredLevel: 16 },
  {
    id: 'bird2', name: 'Crow', kind: 'animated', requiredLevel: 17,
    sheet: { source: require('../../assets/Free Street Animal Pixel Art/8 Bird 2/Idle.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
  },
  { id: 'gorillaunit', name: 'Gorilla Unit', kind: 'image', source: require('../../assets/Dog/Dog/Dog 00.png'), requiredLevel: 17 },
  { id: 'bear',      name: 'Grizzly Bear',    kind: 'sprite',   sheet: 'animals', row: 0, col: 0, requiredLevel: 18 },
  { id: 'ironhide',   name: 'Ironhide',   kind: 'image', source: require('../../assets/Pig/Pig 00.png'), requiredLevel: 18 },
  { id: 'voidclaw',   name: 'Voidclaw',   kind: 'image', source: require('../../assets/Panther/Panther 00.png'), requiredLevel: 19 },
  { id: 'spider',    name: 'Spider Guardian', kind: 'image',    source: require('../../assets/Free Mythic Monsters/Free Mythic Monsters/Transparent/3x Size/001_1.png'), requiredLevel: 20 },
  { id: 'towerneck',  name: 'Towerneck',  kind: 'image', source: require('../../assets/giraffe/giraffe 00.png'), requiredLevel: 20 },
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
