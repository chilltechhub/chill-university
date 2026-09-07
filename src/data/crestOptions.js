// src/data/crestOptions.js
// The small "commander crest" flourish shown on HomeScreen.js's
// CommanderCard and library/portfolio.js's header — a color + role-tag
// pair, distinct from (and much lighter than) the real wardrobe system in
// characterOptions.js/petOptions.js/backgroundOptions.js. No unlock
// gating — every option is available from the moment the account exists.
//
// Single source of truth for the *options list* (picked in onboarding's
// Traveler step and editable later from Settings). HomeScreen.js and
// portfolio.js keep their own small color/emoji *lookup maps* for
// rendering — those must stay in sync with the `key`s here if this list
// ever changes.

export const CREST_COLORS = [
  { key: 'teal',    color: '#2bb5a0', label: 'Teal' },
  { key: 'gold',    color: '#c9a84c', label: 'Gold' },
  { key: 'purple',  color: '#8b4fc4', label: 'Purple' },
  { key: 'red',     color: '#e05858', label: 'Red' },
  { key: 'blue',    color: '#3a7bd5', label: 'Blue' },
  { key: 'green',   color: '#3ac860', label: 'Green' },
  { key: 'orange',  color: '#e07a30', label: 'Orange' },
  { key: 'silver',  color: '#9a9aa8', label: 'Silver' },
];
export const DEFAULT_CREST_COLOR = 'teal';

export const ROLE_BADGES = [
  { key: 'explorer',   emoji: '🧭', label: 'Explorer' },
  { key: 'builder',    emoji: '🏗️', label: 'Builder' },
  { key: 'scholar',    emoji: '📚', label: 'Scholar' },
  { key: 'guardian',   emoji: '🛡️', label: 'Guardian' },
  { key: 'pioneer',    emoji: '🌟', label: 'Pioneer' },
  { key: 'creator',    emoji: '🎨', label: 'Creator' },
];
export const DEFAULT_ROLE_BADGE = 'explorer';
