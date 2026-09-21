// src/logic/plusContent.js
// Which business-course lessons are free and which need Plus.
//
// The rule, as decided 2026-09-21: every business / startup level (all four
// adult subjects in src/data/classCatalog.js — Business Foundations,
// Acquisition & Ownership, Startup & Venture, Operations & Compliance) keeps
// its FIRST lesson free as a taste; the rest of the level is Plus.
//
// Per level, not per course, so someone who jumps straight to Startup or to
// Retail Operations still gets to try it before being asked to pay.
//
// This only decides what the app SHOWS. The lesson text ships inside the app
// bundle, so it isn't secret from someone determined to dig it out — that's
// accepted: the paywall is for honest people, and the Vault deliverables
// (the part that's actually worth something) need the lessons done.
//
// Only applies while Plus is on sale — see PlusContext.contentLocked.

// How many lessons at the start of each level are free.
export const FREE_LESSONS_PER_LEVEL = 1;

// A lesson's place in its whole level, counting module 1's lessons first,
// then module 2's, and so on. `modules` is the level's module list.
export function lessonPosition(modules, moduleIndex, lessonIndex) {
  let before = 0;
  for (let m = 0; m < moduleIndex; m++) before += modules[m]?.lessons?.length || 0;
  return before + lessonIndex;
}

export function isLessonFree(modules, moduleIndex, lessonIndex) {
  return lessonPosition(modules, moduleIndex, lessonIndex) < FREE_LESSONS_PER_LEVEL;
}
