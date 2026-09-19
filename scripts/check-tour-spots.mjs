// scripts/check-tour-spots.mjs
//
// Fails if a tutorial step points at a TourSpot that doesn't exist.
//
// This bug class is invisible at runtime: TourOverlay finds no registered
// target, shrugs, and renders the step as a plain unhighlighted card. The
// tutorial still "works", it just quietly stops pointing at anything — which
// is how a step describing the old Trophy Hall carousel survived long after
// that carousel was replaced by the Portfolio Archives count.
//
// Run: node scripts/check-tour-spots.mjs

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');
const CONTEXT = join(ROOT, 'context');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = [...walk(SRC), ...walk(CONTEXT)];

// ── Ids that TourSpots actually render ──────────────────────────────────────
const literal = new Set();
// Some spots build their id from data (`hub-section-${hub.id}`). Rather than
// evaluate the app, record the static prefix and treat any referenced id
// starting with it as satisfied. Loose on purpose: a wrong suffix is a
// content typo the browser pass will catch, whereas a missing spot entirely
// is the silent failure this script exists for.
const prefixes = [];

// Strip comments first: TourSpot.js's own doc comment contains a literal
// `<TourSpot id="some-id">` example, and counting that as a real spot makes
// the unused list untrustworthy.
const decomment = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

for (const f of files) {
  const src = decomment(readFileSync(f, 'utf8'));
  for (const m of src.matchAll(/<TourSpot[^>]*\bid=["']([^"']+)["']/g)) literal.add(m[1]);
  for (const m of src.matchAll(/<TourSpot[^>]*\bid=\{`([^`$]*)\$\{/g)) prefixes.push(m[1]);
}

// ── Ids the tutorials reference ─────────────────────────────────────────────
const referenced = new Map(); // id -> source file
for (const f of [join(SRC, 'logic', 'screenTutorials.js'), join(SRC, 'logic', 'tourSteps.js')]) {
  const src = decomment(readFileSync(f, 'utf8'));
  for (const m of src.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, f));
  }
}
// The guided first goal names its spots as `spot:` rather than `id:`.
{
  const f = join(SRC, 'data', 'firstGoalGuide.js');
  const src = decomment(readFileSync(f, 'utf8'));
  for (const m of src.matchAll(/\bspot:\s*['"]([^'"]+)['"]/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, f));
  }
}

const missing = [...referenced.entries()].filter(
  ([id]) => !literal.has(id) && !prefixes.some(p => p && id.startsWith(p)),
);

// Spots that exist but nothing points at. Not a failure — a spot can be left
// in place for a tutorial that hasn't been written yet — but worth seeing.
const unused = [...literal].filter(
  id => !referenced.has(id) && !prefixes.some(p => p && id.startsWith(p)),
).sort();

console.log(`TourSpots rendered: ${literal.size} literal + ${new Set(prefixes).size} dynamic prefix(es)`);
console.log(`Ids referenced by tutorials: ${referenced.size}`);

if (unused.length) {
  console.log(`\nRendered but unreferenced (${unused.length}) — fine, just unused:`);
  for (const id of unused) console.log(`  · ${id}`);
}

if (missing.length) {
  console.log(`\nFAIL — referenced with no TourSpot (${missing.length}):`);
  for (const [id, where] of missing) console.log(`  ✗ ${id}   (${where})`);
  process.exit(1);
}

console.log('\nOK — every referenced id has a TourSpot.');
