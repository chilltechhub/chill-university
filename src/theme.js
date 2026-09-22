// src/theme.js
// Base Command — Light + Dark themes
// Import: import { useTheme } from '../context/ThemeContext';
// Then: const { theme, colors } = useTheme();

export const THEMES = {

  // ── Light: Daylight Ops ──────────────────────────────────────────────────
  light: {
    name: 'light',
    label: 'Daylight',

    // Backgrounds — cool steel/paper, not warm parchment
    bg0:        '#eef1f6',   // page canvas
    bg1:        '#ffffff',   // card / surface
    bg2:        '#e3e8f0',   // inset / subtle
    bg3:        '#dbe1ec',   // input bg

    // Borders
    border:     '#c7cedd',
    borderStrong:'#aab3c8',

    // Gold — rank, points, primary CTA
    gold:       '#8a6420',   // AA on bg0/bg1 (was #9a7228, ~3.9:1)
    goldMid:    '#c9a84c',
    goldLight:  '#f5e8c8',
    goldDim:    '#6a4e10',

    // Teal — action, discovery, progress
    teal:       '#167a6c',   // AA on bg0/bg1 (was #1a8a7a, ~3.7:1)
    tealMid:    '#2bb5a0',
    tealLight:  '#e0f4f0',
    tealDim:    '#0f5a50',

    // Arcane purple — spiritual, secondary
    purple:     '#6b3fa0',
    purpleLight:'#f0e8fc',
    purpleDim:  '#4a2070',

    // Text
    text1:      '#161b28',   // primary
    text2:      '#454f66',   // body
    text3:      '#5f6880',   // secondary — AA (was #7a839c, ~3.3:1)
    text4:      '#a7b0c6',   // placeholders / decoration only — below AA on purpose

    // Semantic
    success:    '#237a3f',
    successLight:'#e8f8ee',
    error:      '#c43030',
    errorLight: '#fdeaea',
    warning:    '#9c5a08',
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
    tabBar:     '#ffffff',
    tabActive:  '#9a7228',
    tabInactive:'#a7b0c6',
    headerBg:   '#eef1f6',
    modalBg:    '#ffffff',
    inputBg:    '#dbe1ec',
    inputBorder:'#c7cedd',

    // Glyph / ornament
    glyph:      '#c9a84c',
  },

  // ── Dark: Command Deck ────────────────────────────────────────────────────
  dark: {
    name: 'dark',
    label: 'Command',

    // Backgrounds — neutral slate, not purple-midnight
    bg0:        '#12161f',
    bg1:        '#1a2030',
    bg2:        '#0d1119',
    bg3:        '#212942',

    border:     '#2c3550',
    borderStrong:'#3a4568',

    gold:       '#e8b34a',
    goldMid:    '#f0c164',
    goldLight:  '#2a2007',
    goldDim:    '#a97a24',

    teal:       '#3fcf9e',
    tealMid:    '#6ce0b8',
    tealLight:  '#0a2822',
    tealDim:    '#1e8f6f',

    purple:     '#a67ad8',   // AA on bg1 (was #8b4fc4, ~3.1:1)
    purpleLight:'#2a0a4a',
    purpleDim:  '#5a2a8a',

    text1:      '#eef1f8',
    text2:      '#a7b0c6',
    text3:      '#8a92ab',   // AA (was #6d7690, ~3.6:1)
    text4:      '#414a68',

    success:    '#3ac860',
    successLight:'#0a2818',
    error:      '#ef6a6a',
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

    tabBar:     '#12161f',
    tabActive:  '#e8b34a',
    tabInactive:'#414a68',
    headerBg:   '#12161f',
    modalBg:    '#1a2030',
    inputBg:    '#212942',
    inputBorder:'#2c3550',

    glyph:      '#c9a84c',
  },
};

// HUD fonts — Rajdhani for display/numbers, JetBrains Mono for readouts/labels.
// Loaded via useFonts() in App.js; body text stays on the system font.
export const FONTS = {
  display:         'Rajdhani_700Bold',
  displaySemibold: 'Rajdhani_600SemiBold',
  mono:            'JetBrainsMono_500Medium',
  monoSemibold:    'JetBrainsMono_600SemiBold',
};

// ── Style: how the app is dressed, independent of light/dark ──────────────
// `plain` is the default: system type, sentence-case labels, soft cards.
// `command` is the original HUD look: mono uppercase labels, Rajdhani
// titles, tighter corners. Screens read these through useTheme().style
// (or the shared primitives) rather than hard-coding FONTS.mono or
// textTransform: 'uppercase' — see docs/finishing-touches-plan.md.
export const STYLES = {
  plain: {
    name: 'plain',
    label: 'Plain',
    description: 'Clean and calm. Easy on long sessions.',
    // Section / eyebrow labels ("Appearance", "App experience")
    sectionLabel: { fontFamily: undefined, textTransform: 'none', letterSpacing: 0, fontWeight: '600' },
    // Big screen titles. undefined = system font.
    titleFont: undefined,
    titleTracking: 0,
    // Stats and readouts ("LV 3", "12 / 20", timers).
    numberFont: undefined,
    // Small eyebrow above a card title ("Your first goal").
    eyebrow: { fontFamily: undefined, textTransform: 'none', letterSpacing: 0, fontWeight: '600' },
    buttonLabel: { fontFamily: undefined, textTransform: 'none', letterSpacing: 0, fontWeight: '700' },
    cardRadius: 14,
    buttonRadius: 12,
    borderWidth: 0.5,
    cardShadow: 'sm',
    // What "Show Emojis" means until the user sets it themselves.
    emojiDefault: false,
  },
  command: {
    name: 'command',
    label: 'Command',
    description: 'The ops-deck look. Mono labels, sharper edges.',
    sectionLabel: { fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
    titleFont: FONTS.display,
    titleTracking: 0.5,
    numberFont: FONTS.mono,
    eyebrow: { fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
    buttonLabel: { fontFamily: FONTS.display, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
    cardRadius: 6,
    buttonRadius: 6,
    borderWidth: 1,
    cardShadow: null,
    emojiDefault: true,
  },
};
export const DEFAULT_STYLE = 'plain';

// ── Accent: the colour of primary actions ─────────────────────────────────
// Per mode so contrast holds in both. Light-mode teal/gold are one step
// darker than colors.teal / colors.gold: those sit at ~4.2:1 on white, just
// under WCAG AA (4.5) for text, and white-on-button fails the same way.
// These clear 5:1. `onPrimary` is the text/icon colour on a filled button.
export const ACCENTS = {
  teal: {
    label: 'Teal',
    light: { primary: '#167a6c', primaryMid: '#2bb5a0', primaryLight: '#e0f4f0', onPrimary: '#ffffff' },
    dark:  { primary: '#3fcf9e', primaryMid: '#6ce0b8', primaryLight: '#0a2822', onPrimary: '#0d1119' },
  },
  gold: {
    label: 'Gold',
    light: { primary: '#8a6420', primaryMid: '#c9a84c', primaryLight: '#f5e8c8', onPrimary: '#ffffff' },
    dark:  { primary: '#e8b34a', primaryMid: '#f0c164', primaryLight: '#2a2007', onPrimary: '#0d1119' },
  },
  slate: {
    label: 'Slate',
    light: { primary: '#3d5a80', primaryMid: '#6a86ab', primaryLight: '#e6ecf4', onPrimary: '#ffffff' },
    dark:  { primary: '#9db4d3', primaryMid: '#bccde3', primaryLight: '#172238', onPrimary: '#0d1119' },
  },
};
export const DEFAULT_ACCENT = 'teal';

// A persona suggests an accent once, at the end of onboarding, and only if
// the user hasn't picked one. It never sets the style.
export const PERSONA_ACCENT = {
  STUDENT:      'teal',
  PERSONAL:     'teal',
  BUSINESS:     'slate',
  ENTREPRENEUR: 'gold',
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
    shadowColor: dark ? '#000' : '#161b28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: dark ? 0.3 : 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: dark ? '#000' : '#161b28',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: dark ? 0.4 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: dark ? '#000' : '#161b28',
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
