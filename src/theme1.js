// src/theme.js
// Single source of truth for all colors, typography and spacing.
// Import from here instead of hardcoding values in each screen.

export const colors = {
  // ── Primary brand ────────────────────────────────────────────────
  primary:        '#4CAF50',   // green — main action color
  primaryDark:    '#2E7D32',   // darker green — pressed states
  primaryLight:   '#E8F5E9',   // light green — backgrounds / badges

  // ── Accent ──────────────────────────────────────────────────────
  accent:         '#FF9800',   // orange — secondary actions, warnings
  accentLight:    '#FFF3E0',

  // ── Library / academic theme ─────────────────────────────────────
  navy:           '#0e1a2e',
  navyMid:        '#152236',
  navyLight:      '#1c2f47',
  navyBorder:     '#243850',
  brass:          '#c9a84c',
  brassLight:     '#e4c97a',
  brassDim:       '#8a6f2e',
  cream:          '#f5edd6',
  creamDim:       '#c4b99a',

  // ── Neutrals ────────────────────────────────────────────────────
  white:          '#ffffff',
  background:     '#f9f9f9',
  surface:        '#ffffff',
  border:         '#e0e0e0',
  borderLight:    '#eeeeee',

  // ── Text ────────────────────────────────────────────────────────
  textPrimary:    '#111827',
  textSecondary:  '#374151',
  textMuted:      '#6B7280',
  textLight:      '#9CA3AF',

  // ── Semantic ────────────────────────────────────────────────────
  success:        '#4CAF50',
  successLight:   '#E8F5E9',
  warning:        '#FF9800',
  warningLight:   '#FFF3E0',
  error:          '#F44336',
  errorLight:     '#FFEBEE',
  info:           '#2196F3',
  infoLight:      '#E3F2FD',

  // ── Subject colors (classes) ─────────────────────────────────────
  math:           '#6366F1',
  mathLight:      '#E0E7FF',
  science:        '#059669',
  scienceLight:   '#D1FAE5',
  language:       '#EC4899',
  languageLight:  '#FCE7F3',
  social:         '#F59E0B',
  socialLight:    '#FEF3C7',
  arts:           '#8B5CF6',
  artsLight:      '#EDE9FE',
  homeEc:         '#EF4444',
  homeEcLight:    '#FEE2E2',
};

export const typography = {
  // Font sizes
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 28,

  // Font weights (React Native uses string values)
  regular:    '400',
  medium:     '500',
  semibold:   '600',
  bold:       '700',
  extrabold:  '800',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
};

export const radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Convenience: common style objects reused across screens
export const common = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
};
