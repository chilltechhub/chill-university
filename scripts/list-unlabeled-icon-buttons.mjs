// scripts/list-unlabeled-icon-buttons.mjs
// Prints every icon-only pressable still missing an accessibilityLabel, with
// its opening tag and icon, so they can be labelled by hand.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, sep } from 'path';
import { findIconButtons } from './lib/iconButtons.mjs';

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
})('src');

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const h of findIconButtons(src).filter(x => !x.labelled)) {
    const icon = src.slice(h.openEnd, h.openEnd + 400).match(/<Ionicons[^>]*>/);
    console.log(`== ${f.split(sep).join('/')}:${h.line}`);
    console.log(`   ${h.opening.replace(/\s+/g, ' ').slice(0, 170)}`);
    console.log(`   ${icon ? icon[0].replace(/\s+/g, ' ').slice(0, 170) : ''}`);
  }
}
