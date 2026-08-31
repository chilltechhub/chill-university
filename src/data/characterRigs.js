// src/data/characterRigs.js
// Real animated character rigs — multi-frame walk-cycle sprite sheets
// (side-view, facing right by default), used by some outfit tiers in
// src/data/characterOptions.js (the rest are static 32rogues portraits —
// see that file for the mixed static/animated tier ladder). Frames are
// laid out left-to-right in one image; frameWidth/frameHeight let
// AnimatedSprite.js crop each one (most packs use square frames, but
// Mushroom's are wider than tall, so both are tracked separately).
//
// Sources, all free-license, commercial use OK, no attribution required,
// no reselling/redistributing the raw files:
//   - "Tiny Hero" pack (CraftPix): Pink / Owlet / Dude Monster
//   - "3 Cyberpunk Sprites" pack (CraftPix): Punk / Biker / Cyborg
//   - "Gangsters" pack (CraftPix): Gangster 1 / 2 / 3
//   - "Dark Fantasy Enemies" pack (monopixelart, itch.io): Bat
//   - "Forest Monsters" pack (monopixelart, itch.io): Mushroom
//   - "Tiny RPG Character Asset Pack 01" (zerie, itch.io): Soldier / Orc —
//     commercial OK, modification OK, no resale, no AI-training/NFT use.

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
};
