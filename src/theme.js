// src/theme.js
// Base Command — Light + Dark themes
// Import: import { useTheme } from '../context/ThemeContext';
// Then: const { theme, colors } = useTheme();
import { tierForRank } from './logic/rankUtils';

export const THEMES = {

  // ── Light: Daylight Ops ──────────────────────────────────────────────────
  light: {
    name: 'light',
    label: 'Daylight',

    // Backgrounds — a warm paper canvas under white cards (direction B,
    // 2026-10-14). The old cool steel grey made cards look flat and the
    // page washed out. Text contrast on it is slightly higher, not lower.
    bg0:        '#f5f4f0',   // page canvas
    bg1:        '#ffffff',   // card / surface
    bg2:        '#ebe9e3',   // inset / subtle
    bg3:        '#e4e1d9',   // input bg

    // Borders — lighter hairlines; the soft shadow does the lifting
    border:     '#d6d2c7',
    borderStrong:'#b3ad9f',

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
    onFill:     '#ffffff',   // text/icons on a filled teal/gold/purple/error button

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
    tabInactive:'#5f6880',   // = text3: inactive tab labels are text, and #a7b0c6 was 2.2:1
    headerBg:   '#f5f4f0',
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
    onFill:     '#0d1119',   // text/icons on a filled teal/gold/purple/error button — white is 2:1 on these bright fills

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
    tabInactive:'#8a92ab',   // = text3: inactive tab labels are text, and #414a68 was 2.1:1
    headerBg:   '#12161f',
    modalBg:    '#1a2030',
    inputBg:    '#212942',
    inputBorder:'#2c3550',

    glyph:      '#c9a84c',
  },
};

// High contrast (Settings → Accessibility): the secondary text greys, the
// faint "decoration" grey and the borders pushed toward the main text
// colour, so hints, labels and card edges are easy to see. Applied over
// THEMES in ThemeContext; everything else is unchanged.
export const HIGH_CONTRAST = {
  light: {
    text2: '#232a3a', text3: '#343c50', text4: '#4f586e',
    border: '#7c859b', borderStrong: '#5d667c', tabInactive: '#343c50',
  },
  dark: {
    text2: '#dfe4ef', text3: '#c7cddc', text4: '#9aa2ba',
    border: '#5b6788', borderStrong: '#7884a6', tabInactive: '#c7cddc',
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
  // More to choose from (2026-10-15). Each checked: white on the light
  // primary and the light primary on the page both ≥ 4.8:1; dark-mode text
  // on the dark primary and the dark primary on cards both ≥ 6:1.
  blue: {
    label: 'Blue',
    light: { primary: '#1f5fbf', primaryMid: '#5b8fdc', primaryLight: '#e3ecfa', onPrimary: '#ffffff' },
    dark:  { primary: '#73a9ff', primaryMid: '#9cc2ff', primaryLight: '#0e1f3d', onPrimary: '#0d1119' },
  },
  ocean: {
    label: 'Ocean',
    light: { primary: '#0b6b86', primaryMid: '#3e9bb5', primaryLight: '#ddf0f5', onPrimary: '#ffffff' },
    dark:  { primary: '#52c6e6', primaryMid: '#85d8ee', primaryLight: '#082a33', onPrimary: '#0d1119' },
  },
  green: {
    label: 'Green',
    light: { primary: '#2e7a33', primaryMid: '#5aa35e', primaryLight: '#e3f2e4', onPrimary: '#ffffff' },
    dark:  { primary: '#7ad67c', primaryMid: '#a2e3a3', primaryLight: '#0f2a10', onPrimary: '#0d1119' },
  },
  purple: {
    label: 'Purple',
    light: { primary: '#6b3fa0', primaryMid: '#9670c6', primaryLight: '#efe7f8', onPrimary: '#ffffff' },
    dark:  { primary: '#b896f2', primaryMid: '#cdb4f6', primaryLight: '#24163a', onPrimary: '#0d1119' },
  },
  rose: {
    label: 'Rose',
    light: { primary: '#b0305e', primaryMid: '#d1638b', primaryLight: '#f9e4ec', onPrimary: '#ffffff' },
    dark:  { primary: '#f47ba4', primaryMid: '#f7a1bf', primaryLight: '#3a1121', onPrimary: '#0d1119' },
  },
  red: {
    label: 'Red',
    light: { primary: '#b02a2a', primaryMid: '#d35f5f', primaryLight: '#f9e3e3', onPrimary: '#ffffff' },
    dark:  { primary: '#f47a7a', primaryMid: '#f7a0a0', primaryLight: '#3a1111', onPrimary: '#0d1119' },
  },
  orange: {
    label: 'Orange',
    light: { primary: '#a3461a', primaryMid: '#cf7546', primaryLight: '#f9e8de', onPrimary: '#ffffff' },
    dark:  { primary: '#f59a5b', primaryMid: '#f8b788', primaryLight: '#3a1d0a', onPrimary: '#0d1119' },
  },
  graphite: {
    label: 'Graphite',
    light: { primary: '#44444c', primaryMid: '#77777f', primaryLight: '#ececee', onPrimary: '#ffffff' },
    dark:  { primary: '#d0d0d8', primaryMid: '#e2e2e8', primaryLight: '#24242a', onPrimary: '#0d1119' },
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

// Shadows (2026-10-21: "the app looks flat, especially in light mode").
// Two layers each, like real light: a tight contact shadow under the edge
// plus a wide soft one that lifts the card off the page. boxShadow works
// on web (react-native-web 0.21) and on iOS/Android (RN 0.76+), and it
// stops the "shadow* props are deprecated" warning on web.
//   sm  cards and rows      md  raised: pickers, selected cards
//   lg  sheets and modals   glow(color)  a coloured lift for primary buttons
const INK = '42, 34, 20'; // warm, so light-mode shadows sit on the paper canvas
export const makeShadows = (dark) => (dark
  ? {
    sm: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.45), 0 6px 18px rgba(0, 0, 0, 0.32)' },
    md: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.45), 0 12px 32px rgba(0, 0, 0, 0.42)' },
    lg: { boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.55)' },
  }
  : {
    sm: { boxShadow: `0 1px 2px rgba(${INK}, 0.07), 0 6px 18px rgba(${INK}, 0.08)` },
    md: { boxShadow: `0 2px 4px rgba(${INK}, 0.08), 0 14px 34px rgba(${INK}, 0.12)` },
    lg: { boxShadow: `0 4px 10px rgba(${INK}, 0.1), 0 26px 64px rgba(${INK}, 0.18)` },
  });

// A coloured lift under a filled control (the accent's own light).
// `hex` is a 6-digit colour; anything else gets no glow.
export function glow(hex, strength = 1) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return null;
  const a = (n) => Math.round(Math.min(255, n * strength)).toString(16).padStart(2, '0');
  return { boxShadow: `0 2px 6px ${hex}${a(56)}, 0 10px 24px ${hex}${a(64)}` };
}

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
// Keyed by rank 1–20; the name is the rank's tier (five of them, see
// TIERS in src/logic/rankUtils.js). `tier` is the colour family.
export const RANK_LABELS = Object.fromEntries(
  Array.from({ length: 20 }, (_, i) => {
    const t = tierForRank(i + 1);
    return [i + 1, { label: t.label, emoji: t.emoji, tier: t.theme }];
  }),
);
