// src/theme.js
// Royal Mythical Library — Light + Dark themes
// Import: import { useTheme } from '../context/ThemeContext';
// Then: const { theme, colors } = useTheme();

export const THEMES = {

  // ── Light: Illuminated Parchment ─────────────────────────────────────────
  light: {
    name: 'light',
    label: 'Parchment',

    // Backgrounds
    bg0:        '#faf8f4',   // page canvas
    bg1:        '#f2ede4',   // card / surface
    bg2:        '#e8e0d0',   // inset / subtle
    bg3:        '#ddd5c0',   // input bg

    // Borders
    border:     '#d4c9b0',
    borderStrong:'#b8a888',

    // Gold — rank, points, primary CTA
    gold:       '#9a7228',
    goldMid:    '#c9a84c',
    goldLight:  '#f5e8c8',
    goldDim:    '#6a4e10',

    // Teal — action, discovery, progress
    teal:       '#1a8a7a',
    tealMid:    '#2bb5a0',
    tealLight:  '#e0f4f0',
    tealDim:    '#0f5a50',

    // Arcane purple — spiritual, secondary
    purple:     '#6b3fa0',
    purpleLight:'#f0e8fc',
    purpleDim:  '#4a2070',

    // Text
    text1:      '#2a2018',   // primary
    text2:      '#5a4a30',   // body
    text3:      '#8a7a60',   // secondary
    text4:      '#b0a080',   // muted / caption

    // Semantic
    success:    '#2a8a4a',
    successLight:'#e8f8ee',
    error:      '#c43030',
    errorLight: '#fdeaea',
    warning:    '#c97a10',
    warningLight:'#fef4e4',

    // Subject / life area colors
    math:       '#2a4ac9',
    mathLight:  '#e8effe',
    science:    '#1a8a7a',   // reuse teal
    scienceLight:'#e0f4f0',
    language:   '#b84010',
    languageLight:'#fdeee8',
    social:     '#9a3a8a',
    socialLight:'#fce8fa',
    arts:       '#c97a10',
    artsLight:  '#fef4e4',
    health:     '#c43030',
    healthLight:'#fdeaea',
    finance:    '#2a8a4a',
    financeLight:'#e8f8ee',
    tech:       '#2a4ac9',
    techLight:  '#e8effe',

    // Life area rune colors
    physical:   '#c43030',
    mental:     '#1a8a7a',
    social2:    '#6b3fa0',
    financial:  '#2a8a4a',
    creative:   '#c97a10',
    professional:'#9a7228',
    spiritual:  '#6b3fa0',
    digital:    '#2a4ac9',

    // UI chrome
    tabBar:     '#f2ede4',
    tabActive:  '#c9a84c',
    tabInactive:'#b0a080',
    headerBg:   '#faf8f4',
    modalBg:    '#faf8f4',
    inputBg:    '#e8e0d0',
    inputBorder:'#c8bda0',

    // Glyph / ornament
    glyph:      '#c9a84c',
  },

  // ── Dark: Royal Midnight Library ─────────────────────────────────────────
  dark: {
    name: 'dark',
    label: 'Royal',

    bg0:        '#0e0818',
    bg1:        '#150e28',
    bg2:        '#1e1035',
    bg3:        '#2a1a40',

    border:     '#2d1f4e',
    borderStrong:'#3d2f5e',

    gold:       '#c9a84c',
    goldMid:    '#e4c97a',
    goldLight:  '#2a1f06',
    goldDim:    '#8a6a2a',

    teal:       '#2bb5a0',
    tealMid:    '#5ce0c8',
    tealLight:  '#0a2825',
    tealDim:    '#1a7a6a',

    purple:     '#8b4fc4',
    purpleLight:'#2a0a4a',
    purpleDim:  '#5a2a8a',

    text1:      '#e8dfc8',
    text2:      '#c4b090',
    text3:      '#7a6a9a',
    text4:      '#4a3a6a',

    success:    '#3ac860',
    successLight:'#0a2818',
    error:      '#e05050',
    errorLight: '#2a0808',
    warning:    '#e0a030',
    warningLight:'#2a1a04',

    math:       '#5a80e8',
    mathLight:  '#0a1035',
    science:    '#2bb5a0',
    scienceLight:'#0a2825',
    language:   '#e07850',
    languageLight:'#2a1008',
    social:     '#c878e0',
    socialLight:'#280a38',
    arts:       '#e0a830',
    artsLight:  '#281a04',
    health:     '#e05858',
    healthLight:'#280808',
    finance:    '#40c870',
    financeLight:'#083018',
    tech:       '#5a80e8',
    techLight:  '#0a1035',

    physical:   '#e05858',
    mental:     '#2bb5a0',
    social2:    '#c878e0',
    financial:  '#40c870',
    creative:   '#e0a830',
    professional:'#c9a84c',
    spiritual:  '#8b4fc4',
    digital:    '#5a80e8',

    tabBar:     '#0e0818',
    tabActive:  '#c9a84c',
    tabInactive:'#4a3a6a',
    headerBg:   '#0e0818',
    modalBg:    '#150e28',
    inputBg:    '#0e0818',
    inputBorder:'#2d1f4e',

    glyph:      '#c9a84c',
  },
};

// Typography — same across both themes
export const typography = {
  xs:       11,
  sm:       13,
  md:       15,
  lg:       17,
  xl:       20,
  xxl:      24,
  xxxl:     28,
  display:  34,
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
};

// Spacing
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

// Radius
export const radius = {
  sm: 6, md: 10, lg: 14, xl: 18, xxl: 24, full: 9999,
};

// Shadows
export const makeShadows = (dark) => ({
  sm: {
    shadowColor: dark ? '#000' : '#2a2018',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: dark ? 0.3 : 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: dark ? '#000' : '#2a2018',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: dark ? 0.4 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: dark ? '#000' : '#2a2018',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: dark ? 0.5 : 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
});

// Life area color lookup
export function getLifeAreaColor(areaId, colors) {
  const map = {
    physical:     colors.physical,
    mental:       colors.mental,
    social:       colors.social2,
    financial:    colors.financial,
    creative:     colors.creative,
    professional: colors.professional,
    spiritual:    colors.spiritual,
    digital:      colors.digital,
  };
  return map[areaId] || colors.teal;
}

// Subject color lookup
export function getSubjectColor(subject, colors) {
  const map = {
    math:          { color: colors.math,     light: colors.mathLight },
    science:       { color: colors.science,  light: colors.scienceLight },
    language_arts: { color: colors.language, light: colors.languageLight },
    social_science:{ color: colors.social,   light: colors.socialLight },
    arts:          { color: colors.arts,     light: colors.artsLight },
    health:        { color: colors.health,   light: colors.healthLight },
    finance:       { color: colors.finance,  light: colors.financeLight },
    technology:    { color: colors.tech,     light: colors.techLight },
    general:       { color: colors.teal,     light: colors.tealLight },
  };
  return map[subject] || { color: colors.teal, light: colors.tealLight };
}

// Rank labels — same across themes
export const RANK_LABELS = {
  1:  { label: 'Legend',       emoji: '🏆', tier: 'gold' },
  2:  { label: 'Grandmaster',  emoji: '💎', tier: 'gold' },
  3:  { label: 'Master',       emoji: '🔮', tier: 'arcane' },
  4:  { label: 'Expert',       emoji: '🌟', tier: 'arcane' },
  5:  { label: 'Veteran',      emoji: '⚡', tier: 'teal' },
  6:  { label: 'Skilled',      emoji: '🔥', tier: 'teal' },
  7:  { label: 'Advanced',     emoji: '🎯', tier: 'teal' },
  8:  { label: 'Proficient',   emoji: '📈', tier: 'teal' },
  9:  { label: 'Competent',    emoji: '📚', tier: 'base' },
  10: { label: 'Intermediate', emoji: '🎓', tier: 'base' },
  11: { label: 'Developing',   emoji: '🌱', tier: 'base' },
  12: { label: 'Learner',      emoji: '📝', tier: 'base' },
  13: { label: 'Apprentice',   emoji: '🔑', tier: 'base' },
  14: { label: 'Novice',       emoji: '🌙', tier: 'base' },
  15: { label: 'Beginner',     emoji: '☀️',  tier: 'base' },
  16: { label: 'Explorer',     emoji: '🗺️',  tier: 'base' },
  17: { label: 'Initiate',     emoji: '🌿', tier: 'base' },
  18: { label: 'Recruit',      emoji: '⭐', tier: 'base' },
  19: { label: 'Newcomer',     emoji: '🌱', tier: 'base' },
  20: { label: 'Starter',      emoji: '🐣', tier: 'base' },
};
