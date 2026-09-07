// src/data/gameContent/factBattle.js
// Fact Battle — a Top-Trumps-style card game (Science: animal stats),
// tiered by grade band. Every deck's Speed/Size/Lifespan values are all
// distinct within that deck (verified) so there's never an ambiguous tie.

export const STAT_LABELS = {
  Speed: { emoji: '⚡', unit: 'mph' },
  Size: { emoji: '📏', unit: '/10' },
  Lifespan: { emoji: '⏳', unit: 'yrs' },
};

export const CARD_DECKS = {
  'K-2': [
    { name: 'Cheetah',  emoji: '🐆', stats: { Speed: 70, Size: 3, Lifespan: 12 } },
    { name: 'Elephant', emoji: '🐘', stats: { Speed: 25, Size: 10, Lifespan: 65 } },
    { name: 'Mouse',    emoji: '🐭', stats: { Speed: 8, Size: 1, Lifespan: 2 } },
    { name: 'Tortoise', emoji: '🐢', stats: { Speed: 1, Size: 4, Lifespan: 100 } },
    { name: 'Rabbit',   emoji: '🐇', stats: { Speed: 35, Size: 2, Lifespan: 9 } },
    { name: 'Giraffe',  emoji: '🦒', stats: { Speed: 32, Size: 9, Lifespan: 25 } },
    { name: 'Snail',    emoji: '🐌', stats: { Speed: 0.03, Size: 0.5, Lifespan: 5 } },
    { name: 'Lion',     emoji: '🦁', stats: { Speed: 50, Size: 8, Lifespan: 15 } },
  ],

  '3-5': [
    { name: 'Peregrine Falcon', emoji: '🦅', stats: { Speed: 240, Size: 2, Lifespan: 17 } },
    { name: 'Blue Whale',       emoji: '🐋', stats: { Speed: 20, Size: 10, Lifespan: 90 } },
    { name: 'Ostrich',          emoji: '🦤', stats: { Speed: 43, Size: 7, Lifespan: 40 } },
    { name: 'Hippopotamus',     emoji: '🦛', stats: { Speed: 19, Size: 9, Lifespan: 45 } },
    { name: 'Grizzly Bear',     emoji: '🐻', stats: { Speed: 35, Size: 8, Lifespan: 25 } },
    { name: 'Kangaroo',         emoji: '🦘', stats: { Speed: 44, Size: 5, Lifespan: 8 } },
    { name: 'Sloth',            emoji: '🦥', stats: { Speed: 0.2, Size: 3, Lifespan: 30 } },
    { name: 'Dolphin',          emoji: '🐬', stats: { Speed: 30, Size: 6, Lifespan: 20 } },
  ],

  '6-8': [
    { name: 'Sailfish',         emoji: '🐟', stats: { Speed: 68, Size: 5, Lifespan: 4 } },
    { name: 'Komodo Dragon',    emoji: '🦎', stats: { Speed: 13, Size: 7, Lifespan: 30 } },
    { name: 'Golden Eagle',     emoji: '🦅', stats: { Speed: 99, Size: 3, Lifespan: 24 } },
    { name: 'Polar Bear',       emoji: '🐻‍❄️', stats: { Speed: 40, Size: 9, Lifespan: 25 } },
    { name: 'Wolverine',        emoji: '🦫', stats: { Speed: 30, Size: 2, Lifespan: 14 } },
    { name: 'Green Sea Turtle', emoji: '🐢', stats: { Speed: 35, Size: 4, Lifespan: 80 } },
    { name: 'African Elephant', emoji: '🐘', stats: { Speed: 25, Size: 10, Lifespan: 70 } },
    { name: 'Emperor Penguin',  emoji: '🐧', stats: { Speed: 6, Size: 6, Lifespan: 20 } },
  ],

  '9-12': [
    { name: 'Mako Shark',            emoji: '🦈', stats: { Speed: 74, Size: 6, Lifespan: 29 } },
    { name: 'Bowhead Whale',         emoji: '🐋', stats: { Speed: 6, Size: 10, Lifespan: 200 } },
    { name: 'Greenland Shark',       emoji: '🦈', stats: { Speed: 1.7, Size: 8, Lifespan: 390 } },
    { name: 'Cheetah',               emoji: '🐆', stats: { Speed: 70, Size: 3, Lifespan: 12 } },
    { name: 'Galapagos Tortoise',    emoji: '🐢', stats: { Speed: 0.3, Size: 5, Lifespan: 150 } },
    { name: 'Arctic Tern',           emoji: '🐦', stats: { Speed: 55, Size: 1, Lifespan: 30 } },
    { name: 'African Bush Elephant', emoji: '🐘', stats: { Speed: 25, Size: 9, Lifespan: 65 } },
    { name: 'Mayfly',                emoji: '🦟', stats: { Speed: 4, Size: 0.5, Lifespan: 0.003 } },
  ],
};

export default CARD_DECKS;
