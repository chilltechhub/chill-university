// src/ui/tokens.js
// The visual kit's tokens (docs/shake-up-plan-2026-10-21.md §9, P9). The one
// place in the front screens where a colour is a value rather than a theme
// key: the Calm panel's palette (always dark, tinted by your accent), the
// scrim behind a sheet, and what sits on art (white on a pixel scene).
// Everything else reads the theme (context/ThemeContext.js).
//
// scripts/check-style.mjs keeps raw colours out of the front screens; this
// file is where they live instead.

import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ACCENTS } from '../theme';

// ── The scrim behind a sheet or a moment ───────────────────────────────────
export const SCRIM = { soft: 'rgba(0,0,0,0.4)', strong: 'rgba(0,0,0,0.55)', shadow: '#000000' };

// ── Activity categories on Today (the same palette as CalendarModal's) ────
export const CATEGORY_COLOR = {
  event: '#2bb5a0', reminder: '#c9a84c', note: '#8b4fc4', task: '#3ac860', assignment: '#c9a84c', planner: '#2bb5a0',
};

// ── On art: labels over the room, a scene, a photo ─────────────────────────
export const ON_ART = { text: '#ffffff', chip: 'rgba(10,22,40,0.55)', shade: 'rgba(0,0,0,0.35)' };

// ── Paths: one colour and one icon each (§9, "school cues") ───────────────
// Theme keys, so both modes keep their contrast. Used on the path chip,
// unit edges and deliverable cards. Buttons follow the person's accent.
// Ground fix was 'health' (red), which read as a warning; What's next was
// 'science', the same teal as the default accent (stress test 2026-10-24).
const PATH_COLOR = { like: 'arts', next: 'tech', money: 'finance', career: 'purple', ground: 'science' };
const PATH_ICON = { like: 'sparkles-outline', next: 'map-outline', money: 'wallet-outline', career: 'briefcase-outline', ground: 'leaf-outline' };

/** { color, soft, icon } for a path, from the theme's colours `c`. */
export function pathLook(c, pathKey) {
  const key = PATH_COLOR[pathKey] || 'teal';
  return { color: c[key] || c.teal, soft: c[`${key}Light`] || c.tealLight, icon: PATH_ICON[pathKey] || 'map-outline' };
}

// ── The four circles on You ────────────────────────────────────────────────
const CIRCLE_COLOR = { love: 'arts', goodAt: 'success', needs: 'science', paid: 'finance' };
export function circleLook(c, key) {
  const k = CIRCLE_COLOR[key] || 'teal';
  return { color: c[k] || c.teal, soft: c[`${k}Light`] || c.tealLight };
}

// ── Status: always words, and a quiet tint (§9) ────────────────────────────
// To do is plain; Doing is your accent; Handed in and Shown are success.
export function statusLook(c, accent, status) {
  if (status === 'doing') return { fg: accent.primary, bg: accent.primaryLight };
  if (status === 'handed' || status === 'shown' || status === 'reviewed') return { fg: c.success, bg: c.successLight };
  return { fg: c.text2, bg: c.bg2 };
}

// ── The Calm panel's palette ───────────────────────────────────────────────
// Always dark, tinted by your accent, in light mode too (CalmKit.js).
const INK = '#0b0f14';
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// w of b mixed into a.
export const mix = (a, b, w) => {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((x, i) => Math.round(x * (1 - w) + B[i] * w).toString(16).padStart(2, '0')).join('');
};

export function useCalmPalette() {
  const { accentName } = useTheme();
  const tint = (ACCENTS[accentName] || ACCENTS.teal).dark.primary;
  return useMemo(() => ({
    top: mix(tint, INK, 0.88),
    bottom: mix(tint, INK, 0.7),
    text: '#f1f5f4',
    text2: 'rgba(241,245,244,0.72)',
    eyebrow: mix(tint, '#ffffff', 0.35),
    glass: 'rgba(255,255,255,0.07)',
    glassEdge: 'rgba(255,255,255,0.14)',
    fill: tint,
    onFill: '#0d1119',
    track: 'rgba(255,255,255,0.14)',
    tile: mix(tint, '#ffffff', 0.93),
    tileInk: mix(tint, INK, 0.82),
    tileMuted: mix(tint, INK, 0.62),
    warn: '#b3261e',
  }), [tint]);
}
