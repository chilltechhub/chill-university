// src/data/areaColors.js
//
// One colour per life area, and every screen reads it from here.
//
// There used to be three palettes that disagreed: LIFE_AREAS in
// LifeAreaScreen.js (Library, Life Areas, Home), AREAS in plannerService.js
// (Planner, agenda items, the Home widgets), and a set of theme.js tokens
// nothing read. Mental was blue in one, purple in another and teal in the
// third, so an area changed colour depending on which screen you were on.
// Sub-section screens also carried their own unrelated colours —
// Relationships was red, Physical's colour, under Social.
//
// Values are LIFE_AREAS' (what Library and Life Areas already showed), with
// the two pairs that were too close to tell apart separated:
//   social   purple -> teal    (was a near-twin of spiritual; teal is what the Planner already used)
//   digital  blue   -> indigo  (was a near-twin of mental)
//
// No imports, so data files and scripts can use it.

export const AREA_COLORS = {
  physical:     '#e05c5c',
  mental:       '#7eb8e0',
  social:       '#2bb5a0',
  financial:    '#4caf7d',
  creative:     '#f5a623',
  professional: '#c9a84c',
  spiritual:    '#c084e0',
  digital:      '#8088f0',
};

export const areaColor = (areaId, fallback = '#8e98b0') => AREA_COLORS[areaId] || fallback;
