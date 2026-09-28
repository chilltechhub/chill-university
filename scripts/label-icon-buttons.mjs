// scripts/label-icon-buttons.mjs
// One-off codemod (kept for re-runs): gives icon-only pressables an
// accessibilityLabel derived from their icon, plus accessibilityRole="button".
// Icons without a confident label are listed, not guessed.
//
//   node scripts/label-icon-buttons.mjs          # dry run
//   node scripts/label-icon-buttons.mjs --apply
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { findIconButtons, labelForIcon } from './lib/iconButtons.mjs';

const APPLY = process.argv.includes('--apply');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
})('src');

let fixed = 0;
const unknown = [];
for (const f of files) {
  let src = readFileSync(f, 'utf8');
  const hits = findIconButtons(src).filter(h => !h.labelled);
  if (!hits.length) continue;
  // Apply from the end so earlier offsets stay valid.
  for (const h of [...hits].reverse()) {
    const label = labelForIcon(h.iconName);
    if (!label) { unknown.push(`${f.replace(/\\/g, '/')}:${h.line}  icon=${h.iconName ?? '(dynamic)'}`); continue; }
    const insertAt = h.start + 1 + h.tag.length;
    const attrs = ` accessibilityLabel="${label}"${h.hasRole ? '' : ' accessibilityRole="button"'}`;
    src = src.slice(0, insertAt) + attrs + src.slice(insertAt);
    fixed++;
  }
  if (APPLY) writeFileSync(f, src);
}
console.log(`${APPLY ? 'labelled' : 'would label'} ${fixed} icon-only button(s); ${unknown.length} need a label by hand:`);
console.log(unknown.join('\n'));
