// src/data/guides.js
//
// The character who shows you around.
//
// Since the shake-up's P7 that's **your own character, with your pet beside
// it** (getGuide with a look from useCharacterLoadout's readEquippedLook).
// The persona guides below are the fallback only, for the moment before the
// look has loaded.
//
// Tutorials used to be anonymous tooltips — a title, a paragraph, a Next
// button. Attaching a face to them costs nothing (every outfit below is
// already in the game) and turns "here is some text about this screen" into
// someone telling you about it.
//
// One guide per account type, on purpose. The account type decides the Home
// dashboard, the Academy subjects and the quest line, and until now nothing
// in the app made that felt. A Student being walked around by Quill and an
// Entrepreneur by Rook is a reminder, on every single tutorial, that these
// are different modes of the app.
//
// Every outfit here is starter tier (`requirement: null` in
// characterOptions.js) — guides have to render on a brand-new level-1
// account, which is exactly when tutorials matter most. Check that before
// swapping any of them.

import { OUTFITS } from './characterOptions';
import { DEFAULT_PERSONA } from './personas';

export const GUIDES = {
  PERSONAL: {
    name: 'Sage',
    outfitId: 'homesteader',
    // Spoken on the first tutorial an account ever sees. One line — it's a
    // greeting, not a monologue, and there's a real screen behind it.
    intro: "I'm Sage. You're set up for habits and daily life — I'll point out the bits that matter as you go.",
  },
  STUDENT: {
    name: 'Quill',
    outfitId: 'bookworm',
    intro: "I'm Quill. You're on the student track, so I'll keep an eye out for the study and coursework tools.",
  },
  BUSINESS: {
    name: 'Ward',
    outfitId: 'uniformcadet',
    intro: "I'm Ward. You're running this as an operation — I'll show you where the systems and process tools live.",
  },
  ENTREPRENEUR: {
    name: 'Rook',
    outfitId: 'squire',
    intro: "I'm Rook. You're building something — I'll show you the workshop, the vault, and how a venture gets tracked here.",
  },
};

/**
 * Who's talking. `look` ({ outfit, pet }) is your own character: it's you
 * showing yourself around, so the label is plain. Without one, the
 * account type's guide.
 */
export function getGuide(look, personaKey) {
  if (look?.outfit) return { name: 'Your guide', outfit: look.outfit, pet: look.pet || null };
  const guide = GUIDES[personaKey] || GUIDES[DEFAULT_PERSONA];
  return {
    ...guide,
    // Resolved here rather than stored, so a rename or retier in
    // characterOptions.js can't leave this file pointing at nothing.
    outfit: OUTFITS.find(o => o.id === guide.outfitId) || OUTFITS[0],
    pet: null,
  };
}
