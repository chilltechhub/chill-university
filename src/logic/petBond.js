// src/logic/petBond.js
// The pet's bond: how it levels up. Pure functions, no imports, so
// scripts/check-pet-hunger.mjs can load it straight into Node.
//
// Bond comes from feeding, and only from hearts actually refilled: 1 per
// heart, 2 per heart if the pet still had one left (fed before it went fully
// hungry). Hearts drain 4 a day (a full bowl lasts 24 hours), so that's
// also the daily cap: 6 bond for a daily meal with a heart still left, 4 if
// it went hungry first, 8 at most for topping it up through the day. Bond
// never goes down.
//
// Each level is a real upgrade (Pokémon GO's buddy levels are the model):
//   Pal          name your pet
//   Buddy        coins pay 2 points
//   Great buddy  a gift every day (+10 points)
//   Best buddy   the Best Buddy badge, and coins pay 3 points
// and the pet grows a little at every level.
//
// The server (collect_pet_coin / claim_pet_gift, 20261015130000; feed_pet,
// 20261015140000) keeps the same numbers; scripts/check-pet-hunger.mjs holds
// the two together.

export const BOND_LEVELS = [
  { level: 1, name: 'New friend', min: 0 },
  { level: 2, name: 'Pal', min: 10, perk: 'Name your pet' },
  { level: 3, name: 'Buddy', min: 30, perk: 'Coins pay 2 pts' },
  { level: 4, name: 'Great buddy', min: 70, perk: 'A gift every day' },
  { level: 5, name: 'Best buddy', min: 140, perk: 'Best Buddy badge + coins pay 3 pts' },
];
export const MAX_BOND_LEVEL = BOND_LEVELS.length;

export const NAME_LEVEL = 2;
export const GIFT_LEVEL = 4;
export const GIFT_POINTS = 10;
export const GIFT_GAP_HOURS = 20; // "every day", with slack for a different time of day
export const NAME_MAX = 16;

export function bondLevel(bond = 0) {
  let found = BOND_LEVELS[0];
  for (const l of BOND_LEVELS) if ((bond || 0) >= l.min) found = l;
  return found;
}

// Where the pet stands: its level, the next one (null at the top), and how far
// along. pct is 0..1 toward the next level (1 at the top).
export function bondProgress(bond = 0) {
  const level = bondLevel(bond);
  const next = BOND_LEVELS[level.level] || null;
  if (!next) return { level, next: null, into: 0, need: 0, pct: 1 };
  const into = (bond || 0) - level.min;
  const need = next.min - level.min;
  return { level, next, into, need, pct: Math.max(0, Math.min(1, into / need)) };
}

// Bond for one feed: hearts refilled, doubled if it wasn't empty yet.
export function bondGain(heartsBefore, heartsAfter) {
  const refilled = Math.max(0, (heartsAfter || 0) - (heartsBefore || 0));
  return refilled * (heartsBefore > 0 ? 2 : 1);
}

// Points a coin pays at this bond level.
export function coinValue(level) {
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
}

// How big the pet draws at this level: 1x as a new friend, up to 1.2x.
export const petScale = (level) => 1 + 0.05 * (Math.max(1, Math.min(MAX_BOND_LEVEL, level || 1)) - 1);

// A pet's name: trimmed, spaces squeezed, at most NAME_MAX characters. Empty
// means "use the species name".
export function cleanPetName(raw) {
  return String(raw || '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

// When the gift can be opened next (ms), from when the last one was. null =
// never opened one, so it's ready now.
export const giftReadyAt = (lastGiftAt) => (lastGiftAt == null ? 0 : lastGiftAt + GIFT_GAP_HOURS * 3600000);
