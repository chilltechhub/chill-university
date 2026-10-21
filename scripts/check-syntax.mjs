// scripts/check-syntax.mjs
// Every source file parses. The other checks load data files and scan
// screens with regexes, so a typo in a screen (a missing comma) passed
// `npm run check` and only showed up as a blank app when Metro bundled it.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parser = require('@babel/parser');

const files = ['App.js'];
(function walk(dirs) {
  for (const d of dirs) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk([p]);
      else if (p.endsWith('.js')) files.push(p);
    }
  }
})(['src', 'context']);

const problems = [];
for (const f of files) {
  try {
    parser.parse(readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    problems.push(`${f.replace(/\\/g, '/')}: ${e.message}`);
  }
}
if (problems.length) {
  console.error(`check-syntax: ${problems.length} file(s) don't parse:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-syntax: ${files.length} files parse.`);
