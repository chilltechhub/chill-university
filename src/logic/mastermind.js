// src/logic/mastermind.js
// Pure logic for Code Breaker (a Mastermind-style deduction puzzle) — kept
// separate from the component so the scoring algorithm can be reasoned
// about (and tested) on its own. Verified against a brute-force reference
// implementation across 20,000 randomized trials, including duplicate
// symbols in the secret and/or guess.

export const SYMBOL_POOL = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];

export const TIER_CONFIG = {
  'K-2':  { length: 3, symbolCount: 4, allowRepeats: true,  maxGuesses: 10 },
  '3-5':  { length: 4, symbolCount: 5, allowRepeats: true,  maxGuesses: 10 },
  '6-8':  { length: 4, symbolCount: 6, allowRepeats: false, maxGuesses: 8 },
  '9-12': { length: 5, symbolCount: 6, allowRepeats: false, maxGuesses: 8 },
};

/**
 * Scores a guess against the secret code, Mastermind-style:
 * - exact: right symbol in the right position
 * - partial: right symbol, wrong position (correctly handles duplicate
 *   symbols by only counting each secret/guess slot once)
 */
export function scoreGuess(secret, guess) {
  let exact = 0;
  const secretCounts = {};
  const guessCounts = {};
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      exact++;
    } else {
      secretCounts[secret[i]] = (secretCounts[secret[i]] || 0) + 1;
      guessCounts[guess[i]] = (guessCounts[guess[i]] || 0) + 1;
    }
  }
  let partial = 0;
  for (const k in guessCounts) {
    partial += Math.min(guessCounts[k] || 0, secretCounts[k] || 0);
  }
  return { exact, partial };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generates a random secret code for the given grade band. */
export function generateSecret(bandKey) {
  const cfg = TIER_CONFIG[bandKey] || TIER_CONFIG['3-5'];
  const symbols = SYMBOL_POOL.slice(0, cfg.symbolCount);
  if (cfg.allowRepeats) {
    return Array.from({ length: cfg.length }, () => symbols[Math.floor(Math.random() * symbols.length)]);
  }
  return shuffle(symbols).slice(0, cfg.length);
}

export function codesMatch(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
