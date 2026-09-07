// src/data/characterRigs.js
// Real animated character rigs — multi-frame walk-cycle sprite sheets,
// used by some outfit tiers in src/data/characterOptions.js (the rest are
// static 32rogues portraits — see that file for the mixed static/animated
// tier ladder). Frames are laid out left-to-right in one image;
// frameWidth/frameHeight let AnimatedSprite.js crop each one (most packs
// use square frames, but Mushroom's — and now Homesteader/Squire/Grunt's —
// are wider than tall, so both are tracked separately). Which way each
// rig's art actually faces varies by pack — see the `facingRight` notes
// in characterOptions.js, not any blanket assumption here.
//
// Sources, all free-license, commercial use OK, no attribution required
// unless noted, no reselling/redistributing the raw files:
//   - "Tiny Hero" pack (CraftPix): Pink / Owlet / Dude Monster
//   - "3 Cyberpunk Sprites" pack (CraftPix): Punk / Biker / Cyborg
//   - "Gangsters" pack (CraftPix): Gangster 1 / 2 / 3
//   - "Dark Fantasy Enemies" pack (monopixelart, itch.io): Bat
//   - "Forest Monsters" pack (monopixelart, itch.io): Mushroom
//   - "Tiny RPG Character Asset Pack 01" (zerie, itch.io): Soldier / Orc —
//     commercial OK, modification OK, no resale, no AI-training/NFT use.
//   - "The Pixel Character Pack — Free Version" (pidroudays, itch.io):
//     Homesteader / Squire / Grunt (that pack's Farmer/Knight/Orc, renamed
//     here to avoid colliding with the existing 32rogues-based Farmer,
//     Knight, and rig-based Orc above) — commercial OK, modification OK,
//     no individual resale/redistribution.
//   - "Free Schoolgirls Anime Character Pixel Sprite Pack" (CraftPix, via
//     free-game-assets.itch.io): Prep Student / Uniform Cadet / Bookworm
//     (that pack's Girl_1/2/3) — craftpix.net/file-licenses/, same terms
//     as every other CraftPix pack here.
//
// `frames` below is worth being paranoid about: a wrong (too-low) count
// doesn't just skip trailing frames — since AnimatedSprite.js sizes the
// full <Image> as `frames × frameWidth × scale` and relies on
// `resizeMode: 'stretch'` to fit it, undercounting shrinks that computed
// width below the sheet's real content width, so the *whole* sheet gets
// squeezed into too-small a box; that box's own single-frame clip window
// then shows a sliver of more than one real frame at once — two
// characters overlapping in what's supposed to be a one-character crop.
// That's exactly what shipped here at first: all six of the above rigs
// (Homesteader/Squire/Grunt/Prep Student/Uniform Cadet/Bookworm) got their
// `frames` from a crop-and-look verification script that silently drew
// blank past a certain column instead of erroring, so frames actually
// present in the file read as "blank" and got left out of the count.
// The fix was a completely different, boring method: scan every column of
// the raw file for any non-transparent pixel and read off the real
// frame-content boundaries directly — no cropping, no rendering, nothing
// to have a bug in. Re-verify any new rig's frame count that way, not by
// eyeballing a rendered crop.

export const RIGS = {
  pink: {
    idle: { source: require('../../assets/free-pixel-art-tiny-hero-sprites/1 Pink_Monster/Pink_Monster_Idle_4.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
    walk: { source: require('../../assets/free-pixel-art-tiny-hero-sprites/1 Pink_Monster/Pink_Monster_Walk_6.png'), frameWidth: 32, frameHeight: 32, frames: 6 },
  },
  owlet: {
    idle: { source: require('../../assets/free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster_Idle_4.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
    walk: { source: require('../../assets/free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster_Walk_6.png'), frameWidth: 32, frameHeight: 32, frames: 6 },
  },
  dude: {
    idle: { source: require('../../assets/free-pixel-art-tiny-hero-sprites/3 Dude_Monster/Dude_Monster_Idle_4.png'), frameWidth: 32, frameHeight: 32, frames: 4 },
    walk: { source: require('../../assets/free-pixel-art-tiny-hero-sprites/3 Dude_Monster/Dude_Monster_Walk_6.png'), frameWidth: 32, frameHeight: 32, frames: 6 },
  },
  punk: {
    idle: { source: require('../../assets/Free 3 Cyberpunk Sprites Pixel Art/2 Punk/Punk_idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
    walk: { source: require('../../assets/Free 3 Cyberpunk Sprites Pixel Art/2 Punk/Punk_run.png'), frameWidth: 48, frameHeight: 48, frames: 6 },
  },
  biker: {
    idle: { source: require('../../assets/Free 3 Cyberpunk Sprites Pixel Art/1 Biker/Biker_idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
    walk: { source: require('../../assets/Free 3 Cyberpunk Sprites Pixel Art/1 Biker/Biker_run.png'), frameWidth: 48, frameHeight: 48, frames: 6 },
  },
  cyborg: {
    idle: { source: require('../../assets/Free 3 Cyberpunk Sprites Pixel Art/3 Cyborg/Cyborg_idle.png'), frameWidth: 48, frameHeight: 48, frames: 4 },
    walk: { source: require('../../assets/Free 3 Cyberpunk Sprites Pixel Art/3 Cyborg/Cyborg_run.png'), frameWidth: 48, frameHeight: 48, frames: 6 },
  },
  bat: {
    idle: { source: require('../../assets/DarkFantasyEnemies_FREE/DarkFantasyEnemies_FREE/Bat/Bat without VFX/Bat-IdleFly.png'), frameWidth: 64, frameHeight: 64, frames: 9 },
    walk: { source: require('../../assets/DarkFantasyEnemies_FREE/DarkFantasyEnemies_FREE/Bat/Bat without VFX/Bat-Run.png'), frameWidth: 64, frameHeight: 64, frames: 8 },
  },
  mushroom: {
    idle: { source: require('../../assets/Forest_Monsters_FREE/Mushroom/Mushroom without VFX/Mushroom-Idle.png'), frameWidth: 80, frameHeight: 64, frames: 7 },
    walk: { source: require('../../assets/Forest_Monsters_FREE/Mushroom/Mushroom without VFX/Mushroom-Run.png'), frameWidth: 80, frameHeight: 64, frames: 8 },
  },
  gangster1: {
    idle: { source: require('../../assets/Gangsters_1/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 6 },
    walk: { source: require('../../assets/Gangsters_1/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 10 },
  },
  gangster2: {
    idle: { source: require('../../assets/Gangsters_2/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 7 },
    walk: { source: require('../../assets/Gangsters_2/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 10 },
  },
  gangster3: {
    idle: { source: require('../../assets/Gangsters_3/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 7 },
    walk: { source: require('../../assets/Gangsters_3/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 10 },
  },
  soldier: {
    idle: { source: require('../../assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Soldier/Soldier/Soldier_Idle.png'), frameWidth: 100, frameHeight: 100, frames: 6 },
    walk: { source: require('../../assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Soldier/Soldier/Soldier_Walk.png'), frameWidth: 100, frameHeight: 100, frames: 8 },
  },
  orc: {
    idle: { source: require('../../assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Orc/Orc/Orc_Idle.png'), frameWidth: 100, frameHeight: 100, frames: 6 },
    walk: { source: require('../../assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Orc/Orc/Orc_Walk.png'), frameWidth: 100, frameHeight: 100, frames: 8 },
  },
  homesteader: {
    idle: { source: require('../../assets/The Pixel Character Pack - Free Version/The Pixel Character Pack - Free Version/Farmer/Farmer-Idle.png'), frameWidth: 44, frameHeight: 34, frames: 7 },
    walk: { source: require('../../assets/The Pixel Character Pack - Free Version/The Pixel Character Pack - Free Version/Farmer/Farmer-Walk.png'), frameWidth: 44, frameHeight: 34, frames: 8 },
  },
  squire: {
    idle: { source: require('../../assets/The Pixel Character Pack - Free Version/The Pixel Character Pack - Free Version/Knight/Knight-Idle.png'), frameWidth: 44, frameHeight: 34, frames: 7 },
    walk: { source: require('../../assets/The Pixel Character Pack - Free Version/The Pixel Character Pack - Free Version/Knight/Knight-Walk.png'), frameWidth: 44, frameHeight: 34, frames: 8 },
  },
  grunt: {
    idle: { source: require('../../assets/The Pixel Character Pack - Free Version/The Pixel Character Pack - Free Version/Orc/Orc-Idle.png'), frameWidth: 44, frameHeight: 34, frames: 7 },
    walk: { source: require('../../assets/The Pixel Character Pack - Free Version/The Pixel Character Pack - Free Version/Orc/Orc-Walk.png'), frameWidth: 44, frameHeight: 34, frames: 8 },
  },
  prepstudent: {
    idle: { source: require('../../assets/free-schoolgirls-anime-character-pixel-sprite-pack/Girl_1/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 9 },
    walk: { source: require('../../assets/free-schoolgirls-anime-character-pixel-sprite-pack/Girl_1/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 12 },
  },
  uniformcadet: {
    idle: { source: require('../../assets/free-schoolgirls-anime-character-pixel-sprite-pack/Girl_2/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 7 },
    walk: { source: require('../../assets/free-schoolgirls-anime-character-pixel-sprite-pack/Girl_2/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 12 },
  },
  bookworm: {
    idle: { source: require('../../assets/free-schoolgirls-anime-character-pixel-sprite-pack/Girl_3/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 6 },
    walk: { source: require('../../assets/free-schoolgirls-anime-character-pixel-sprite-pack/Girl_3/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 12 },
  },
};
