// src/logic/contrast.js
// Keeps a brand colour readable on whatever background it lands on.
//
// Persona colours (src/data/personas.js) are single hex values used as text
// on both themes: Entrepreneur purple was 3.5:1 on the dark header and Student
// blue 2.9:1 on the light one, under WCAG AA's 4.5:1 for small text.
// readableOn() nudges the colour toward white (dark background) or black
// (light background) just far enough to pass, so it still reads as "purple".
// No imports: safe from any component or data file.

function parseHex(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a, b) {
  const ca = parseHex(a), cb = parseHex(b);
  if (!ca || !cb) return 21;
  const la = luminance(ca), lb = luminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * White or near-black — whichever reads on `bg`. For text on a fill whose
 * colour comes from data (a subject, a life area, a notice tone), where white
 * was assumed and failed on the brighter ones.
 */
export function textOn(bg) {
  return contrastRatio('#ffffff', bg) >= 4.5 ? '#ffffff' : '#0d1119';
}

/** `color`, or the nearest tint/shade of it that reaches `min` on `bg`. */
export function readableOn(color, bg, min = 4.5) {
  const fg = parseHex(color), back = parseHex(bg);
  if (!fg || !back) return color;
  if (contrastRatio(color, bg) >= min) return color;
  const target = luminance(back) < 0.5 ? [255, 255, 255] : [0, 0, 0];
  for (let step = 1; step <= 20; step++) {
    const t = step / 20;
    const mixed = fg.map((v, i) => v + (target[i] - v) * t);
    const hex = toHex(mixed);
    if (contrastRatio(hex, bg) >= min) return hex;
  }
  return toHex(target);
}
