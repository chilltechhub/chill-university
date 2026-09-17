// src/data/curriculum/moduleContent.js
// Registry of fully-written modules.
//
// Every module in ownershipCurriculum.js has structure — lessons, objectives,
// actions, Vault deliverables. Some additionally have a long-form written
// version in modules/, with prose sections, worked examples, key terms,
// common pitfalls and step-by-step exercises. Those render as a full page
// rather than a card.
//
// A module without an entry here still works: the module screen falls back to
// the structural version, which is a shorter page but a complete one. So
// writing depth is incremental and never blocking, and the app never has a
// dead link waiting for content.
//
// Key format is `${levelId}M${moduleIndex + 1}` — L1M1, S1M3, and so on.

import L0M1 from './modules/L0M1';
import L0M2 from './modules/L0M2';
import L0M3 from './modules/L0M3';
import L0M4 from './modules/L0M4';
import L0M5 from './modules/L0M5';
import L1M1 from './modules/L1M1';
import W1M1 from './modules/W1M1';
import W1M2 from './modules/W1M2';

const REGISTRY = {
  L0M1,
  L0M2,
  L0M3,
  L0M4,
  L0M5,
  L1M1,
  W1M1,
  W1M2,
};

export function getModuleContent(levelId, moduleIndex) {
  return REGISTRY[`${levelId}M${moduleIndex + 1}`] || null;
}

export function hasModuleContent(levelId, moduleIndex) {
  return !!REGISTRY[`${levelId}M${moduleIndex + 1}`];
}

// How many modules across the whole curriculum are written in full — used to
// show honest progress rather than implying everything is finished.
export function writtenModuleCount() {
  return Object.keys(REGISTRY).length;
}

export default REGISTRY;
