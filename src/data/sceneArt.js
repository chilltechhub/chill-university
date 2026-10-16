// src/data/sceneArt.js
// Named pixel-art objects cut from the scenery sheets: trees, plants, rocks,
// furniture, bowls, toys, food. Each entry is a box on a sheet (source
// pixels); src/components/PixelArt.js draws just that box at any size, so
// nothing had to be cropped into new files. Boxes were read off the sheets by
// scanning for each object's non-transparent pixels, not guessed.
//
// Also: the little animated extras that live in scenes (NPCs standing in the
// street scenes, sleeping cats for quiet empty screens). Same strip shape as
// characterRigs.js (frameWidth/frameHeight/frames), played by AnimatedSprite.
//
// Sources (all allow use in a paid app, no reselling the files):
//   - ToffeeCraft "MEGA BUNDLE Forest, Cat, UI, Animals" free pack
//     (toffeecraft.itch.io/mega-bundle-forest-cat-user-interface-animals):
//     FreeEnvironment, CatRoomFree furniture, Pochi sprites, sleeping cats,
//     dog treats. Its license covers personal and commercial use.
//   - ToffeeCraft "Panda Character" (bamboo) and "Retro Vegetables FREE".
//   - CraftPix "Free City Trader Character" + "Free Townspeople Cyberpunk"
//     (free-game-assets.itch.io, craftpix.net/file-licenses: commercial OK,
//     no credit needed, no AI training).

export const SHEETS = {
  nature: { source: require('../../assets/MegaPackFree/FreeEnvironment/FreePack.png'), width: 512, height: 384 },
  room:   { source: require('../../assets/MegaPackFree/CatMegaFree/CatRoomFree/Furnitures.png'), width: 512, height: 512 },
  pochi:  { source: require('../../assets/MegaPackFree/CatMegaFree/PochiFree/FreeSprites.png'), width: 256, height: 435 },
  bamboo: { source: require('../../assets/PandaFree/Bambu.png'), width: 256, height: 96 },
  veg:    { source: require('../../assets/RetroVegetables/retrovegetables.png'), width: 128, height: 128 },
  treats: { source: require('../../assets/MegaPackFree/FreeAnimalPack/AnimalStuffs/DogMeat.png'), width: 32, height: 32 },
  // Made here from bowlBlue: its kibble pixels repainted the bowl's inside
  // colour, so a hungry pet's bowl can show empty (the pack has no empty one).
  bowlEmpty: { source: require('../../assets/scene/bowl-empty.png'), width: 43, height: 37 },
};

const box = (sheet, x, y, w, h) => ({ sheet, x, y, w, h });
// Retro Vegetables is a 4x4 grid of 32px cells.
const veg = (row, col) => box('veg', col * 32, row * 32, 32, 32);

export const ART = {
  // Outdoors (FreeEnvironment)
  saguaro:      box('nature', 15, 11, 39, 117),
  saguaroTall:  box('nature', 78, 8, 35, 120),
  agave:        box('nature', 130, 47, 93, 81),
  aloe:         box('nature', 226, 59, 92, 69),
  pricklyPear:  box('nature', 325, 66, 57, 62),
  apple:        box('nature', 421, 68, 20, 25),
  tomato:       box('nature', 423, 104, 17, 19),
  grapes:       box('nature', 457, 72, 14, 18),
  corn:         box('nature', 458, 101, 12, 22),
  cauliflower:  box('nature', 483, 70, 26, 22),
  carrot:       box('nature', 490, 96, 13, 32),
  bigPine:      box('nature', 7, 137, 88, 119),
  rock:         box('nature', 400, 171, 101, 69),
  coralRed:     box('nature', 130, 199, 57, 57),
  coralOrange:  box('nature', 197, 211, 56, 45),
  coralPurple:  box('nature', 262, 216, 50, 40),
  iceRock:      box('nature', 390, 271, 118, 102),
  pineOlive:    box('nature', 105, 272, 47, 112),
  pineTeal:     box('nature', 202, 272, 47, 112),
  snowyPine:    box('nature', 5, 273, 56, 111),
  bareTree:     box('nature', 294, 276, 59, 108),
  bamboo1:      box('bamboo', 9, 5, 13, 87),
  bamboo2:      box('bamboo', 65, 5, 30, 87),
  bamboo3:      box('bamboo', 108, 4, 55, 88),
  bamboo4:      box('bamboo', 182, 4, 68, 87),
  vegCarrot:    veg(0, 0),
  vegCauli:     veg(0, 1),
  vegCucumber:  veg(0, 2),
  vegBroccoli:  veg(0, 3),
  vegEggplant:  veg(1, 0),
  vegTomato:    veg(1, 1),
  vegCabbage:   veg(1, 3),
  vegCorn:      veg(2, 0),
  vegRadish:    veg(2, 2),
  vegPotato:    veg(2, 3),
  vegOnion:     veg(3, 0),
  vegLettuce:   veg(3, 1),

  // Indoors (CatRoomFree furniture)
  windowCream:  box('room', 19, 0, 61, 95),
  windowRose:   box('room', 115, 0, 61, 95),
  windowGrey:   box('room', 19, 96, 61, 95),
  windowTan:    box('room', 115, 96, 61, 95),
  postPeach:    box('room', 191, 16, 64, 110),
  postOlive:    box('room', 287, 15, 64, 110),
  postBlue:     box('room', 383, 15, 64, 110),
  bedBlue:      box('room', 202, 137, 110, 82),
  bedGrey:      box('room', 329, 137, 110, 82),
  bedRose:      box('room', 202, 235, 110, 82),
  bedGreen:     box('room', 329, 235, 110, 82),
  plantPainting: box('room', 460, 194, 39, 89),
  stripePainting: box('room', 12, 225, 41, 63),
  sunPainting:  box('room', 79, 225, 38, 62),
  smallPlant:   box('room', 132, 225, 23, 29),
  shelf:        box('room', 14, 288, 100, 128),
  ficus:        box('room', 140, 298, 45, 108),
  scratchPole:  box('room', 197, 425, 55, 77),
  dumbbell:     box('room', 132, 427, 24, 12),
  yarnPink:     box('room', 67, 453, 22, 20),
  yarnBlue:     box('room', 132, 454, 22, 20),
  bowlBlue:     box('room', 266, 335, 43, 37),
  bowlTan:      box('room', 331, 335, 43, 37),
  emptyBowl:    box('bowlEmpty', 0, 0, 43, 37),

  // Pet things (Pochi + dog treats)
  catTree:      box('pochi', 6, 256, 85, 175),
  foodBag:      box('pochi', 216, 267, 33, 62),
  foodCan:      box('pochi', 103, 343, 18, 18),
  mealBowl:     box('pochi', 9, 207, 43, 37),
  drumstick:    box('treats', 1, 1, 14, 14),
  steak:        box('treats', 0, 18, 16, 13),
};

// Animated extras. Frame counts checked by scanning every cell of each strip
// for content (see characterRigs.js on why that matters).
const strip = (source, frameWidth, frames) => ({ source, frameWidth, frameHeight: frameWidth, frames });

export const NPCS = {
  backpacker: strip(require('../../assets/citytrader/Trader_1/Idle.png'), 128, 6),
  vendor:     strip(require('../../assets/citytrader/Trader_2/Idle.png'), 128, 14),
  wanderer:   strip(require('../../assets/citytrader/Trader_3/Idle.png'), 128, 6),
  sitter:     strip(require('../../assets/townsppl/7/Idle.png'), 48, 4),
  firestarter: strip(require('../../assets/townsppl/8/Idle.png'), 48, 4),
};

// Curled-up sleeping cats (6 frames each): the "all quiet" art for empty screens.
export const SLEEPING_CATS = [
  strip(require('../../assets/MegaPackFree/CatMegaFree/SleepingCatFree/sleepingcat1.png'), 64, 6),
  strip(require('../../assets/MegaPackFree/CatMegaFree/SleepingCatFree/sleepingcat2.png'), 64, 6),
  strip(require('../../assets/MegaPackFree/CatMegaFree/SleepingCatFree/sleepingcat3.png'), 64, 6),
  strip(require('../../assets/MegaPackFree/CatMegaFree/SleepingCatFree/sleepingcat4.png'), 64, 6),
  strip(require('../../assets/MegaPackFree/CatMegaFree/SleepingCatFree/sleepingcat5.png'), 64, 6),
];

// Things a player can place in their scenes (DecorateSheet.js). `level` is
// when it unlocks (the room's own furniture keeps the levels it moves in at),
// `scale` its size when first placed (relative to a 300px stage, like scene
// props), `wall` puts it up on the wall instead of the floor when added.
const d = (id, name, group, level, scale, wall) => ({ id, name, group, level, scale, wall: !!wall });
export const DECOR_GROUPS = ['Furniture', 'Plants', 'Nature', 'Food', 'Toys'];
export const DECOR = [
  d('windowCream', 'Window', 'Furniture', 1, 0.95, true),
  d('plantPainting', 'Plant Print', 'Furniture', 3, 0.85, true),
  d('shelf', 'Bookshelf', 'Furniture', 4, 0.95),
  d('bedBlue', 'Blue Bed', 'Furniture', 5, 0.85),
  d('stripePainting', 'Striped Print', 'Furniture', 6, 0.8, true),
  d('postPeach', 'Scratch Post', 'Furniture', 7, 0.95),
  d('windowRose', 'Rose Window', 'Furniture', 8, 0.95, true),
  d('sunPainting', 'Sunset Print', 'Furniture', 9, 0.75, true),
  d('scratchPole', 'Rope Pole', 'Furniture', 9, 0.9),
  d('windowGrey', 'Grey Window', 'Furniture', 10, 0.95, true),
  d('bedGrey', 'Grey Bed', 'Furniture', 11, 0.85),
  d('windowTan', 'Wide Window', 'Furniture', 12, 0.95, true),
  d('bedRose', 'Rose Bed', 'Furniture', 13, 0.85),
  d('postOlive', 'Olive Post', 'Furniture', 14, 0.95),
  d('catTree', 'Cat Tree', 'Furniture', 15, 0.75),
  d('bedGreen', 'Green Bed', 'Furniture', 16, 0.85),
  d('postBlue', 'Blue Post', 'Furniture', 18, 0.95),

  d('ficus', 'Fig Tree', 'Plants', 2, 1.05),
  d('bamboo1', 'Bamboo Shoot', 'Plants', 3, 1.3),
  d('aloe', 'Aloe', 'Plants', 4, 0.7),
  d('pricklyPear', 'Prickly Pear', 'Plants', 5, 0.9),
  d('bamboo2', 'Bamboo', 'Plants', 5, 1.3),
  d('smallPlant', 'Little Plant', 'Plants', 6, 0.9),
  d('agave', 'Agave', 'Plants', 6, 0.75),
  d('saguaro', 'Cactus', 'Plants', 7, 1.0),
  d('bamboo3', 'Bamboo Clump', 'Plants', 8, 1.3),
  d('saguaroTall', 'Tall Cactus', 'Plants', 9, 1.05),
  d('bamboo4', 'Bamboo Grove', 'Plants', 10, 1.3),

  d('rock', 'Rock', 'Nature', 1, 0.6),
  d('pineTeal', 'Pine', 'Nature', 2, 1.1),
  d('pineOlive', 'Olive Pine', 'Nature', 4, 1.1),
  d('bareTree', 'Bare Tree', 'Nature', 6, 1.1),
  d('bigPine', 'Big Pine', 'Nature', 8, 1.0),
  d('coralRed', 'Red Coral', 'Nature', 10, 1.0),
  d('snowyPine', 'Snowy Pine', 'Nature', 11, 1.1),
  d('iceRock', 'Ice Rock', 'Nature', 12, 0.75),
  d('coralOrange', 'Orange Coral', 'Nature', 12, 1.0),
  d('coralPurple', 'Purple Coral', 'Nature', 14, 1.0),

  d('vegCarrot', 'Carrot', 'Food', 1, 1.6),
  d('foodCan', 'Food Can', 'Food', 1, 1.6),
  d('apple', 'Apple', 'Food', 2, 1.6),
  d('vegCabbage', 'Cabbage', 'Food', 2, 1.6),
  d('vegCorn', 'Corn', 'Food', 3, 1.6),
  d('vegTomato', 'Tomato', 'Food', 3, 1.6),
  d('foodBag', 'Food Bag', 'Food', 3, 1.0),
  d('vegBroccoli', 'Broccoli', 'Food', 4, 1.6),
  d('grapes', 'Grapes', 'Food', 4, 1.6),
  d('vegEggplant', 'Eggplant', 'Food', 5, 1.6),
  d('vegCucumber', 'Cucumber', 'Food', 5, 1.6),
  d('vegRadish', 'Radish', 'Food', 6, 1.6),
  d('vegPotato', 'Potato', 'Food', 7, 1.6),
  d('vegOnion', 'Onion', 'Food', 7, 1.6),
  d('vegLettuce', 'Lettuce', 'Food', 8, 1.6),
  d('vegCauli', 'Cauliflower', 'Food', 8, 1.6),
  d('drumstick', 'Drumstick', 'Food', 9, 2.0),
  d('steak', 'Steak', 'Food', 10, 2.0),

  d('yarnPink', 'Pink Yarn', 'Toys', 1, 1.0),
  d('dumbbell', 'Chew Toy', 'Toys', 5, 1.2),
  d('yarnBlue', 'Blue Yarn', 'Toys', 9, 1.0),
];
export const decorById = (id) => DECOR.find(x => x.id === id) || null;
