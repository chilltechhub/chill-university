// scripts/check-a11y.mjs
// Accessibility guards from docs/fix-plan.md Phase 3. Fails on:
//   • `text4` used as a text colour. It is 1.9–2.2:1 on its backgrounds
//     (theme.js calls it "placeholders / decoration only"); readable text uses
//     text3, which passes WCAG AA. placeholderTextColor and icon colours are
//     not checked here.
//   • an icon-only button (a pressable whose only content is an icon) with no
//     accessibilityLabel — a screen reader announces it as nothing. Only 4%
//     of pressables had a label on 2026-09-27; scripts/label-icon-buttons.mjs
//     labelled the icon-only ones.
//   • a literal fontSize under 11.
// A line that genuinely needs an exception (a disabled button label — WCAG
// exempts disabled controls) opts out with an `a11y-ok` comment saying why.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { findIconButtons } from './lib/iconButtons.mjs';

const ROOTS = ['src', 'context'];
const TEXT4_COLOR = /\bcolor:\s*[^,}]*\b[A-Za-z_]+(?:\.c)?\.text4\b/;
// 229 styles were 7–10.5px on 2026-09-27; 11 is the theme's own `xs`.
const TINY_FONT = /\bfontSize:\s*(?:[0-9]|10)(?:\.\d+)?\b(?!\.)/;

const files = [];
(function walk(dirs) {
  for (const d of dirs) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk([p]);
      else if (p.endsWith('.js')) files.push(p);
    }
  }
})(ROOTS);

const problems = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const b of findIconButtons(src)) {
    if (!b.labelled && !b.opening.includes('a11y-ok')) {
      problems.push(`${f.replace(/\\/g, '/')}:${b.line}  icon-only ${b.tag} without accessibilityLabel (icon: ${b.iconName ?? 'dynamic'})`);
    }
  }
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('a11y-ok')) return;
    if (/placeholderTextColor/.test(line) && !/\bcolor:/.test(line.replace(/placeholderTextColor[^,}]*/g, ''))) return;
    if (TEXT4_COLOR.test(line)) problems.push(`${f.replace(/\\/g, '/')}:${i + 1}  text4 as a text colour (use text3)`);
    if (TINY_FONT.test(line)) problems.push(`${f.replace(/\\/g, '/')}:${i + 1}  font size under 11 (the smallest readable size)`);
  });
}

if (problems.length) {
  console.error(`check-a11y: ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-a11y: ${files.length} files clean.`);
