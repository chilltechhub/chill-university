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

// A hook called after an early return: the first render and the next call
// a different number of hooks, and React breaks ("change in the order of
// Hooks"). DreamCard shipped with one (found in the 2026-10-24 stress
// test, signed in). Checked on each component (Capitalised function) and
// custom hook (useX): once a top-level statement can return, no later
// top-level statement may call a hook.
const isHookCall = (node) => !!node && node.type === 'CallExpression'
  && ((node.callee.type === 'Identifier' && /^use[A-Z]/.test(node.callee.name))
    || (node.callee.type === 'MemberExpression' && node.callee.object?.name === 'React' && /^use[A-Z]/.test(node.callee.property?.name || '')));
function callsHookAtTop(stmt) {
  if (stmt.type === 'ExpressionStatement') return isHookCall(stmt.expression);
  if (stmt.type === 'VariableDeclaration') return stmt.declarations.some(d => isHookCall(d.init));
  return false;
}
function canReturn(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'ReturnStatement') return true;
  // A nested function's returns are its own.
  if (/Function/.test(node.type || '')) return false;
  return Object.entries(node).some(([k, v]) => k !== 'loc' && (Array.isArray(v) ? v.some(canReturn) : v && typeof v === 'object' && v.type ? canReturn(v) : false));
}
function hookOrderProblems(ast, file) {
  const out = [];
  const check = (name, body) => {
    if (!name || !(/^[A-Z]/.test(name) || /^use[A-Z]/.test(name)) || body?.type !== 'BlockStatement') return;
    let returnedAt = null;
    for (const stmt of body.body) {
      if (returnedAt !== null && callsHookAtTop(stmt)) out.push(`${file}:${stmt.loc.start.line} ${name}: a hook after the return on line ${returnedAt}`);
      if (returnedAt === null && stmt.type !== 'ReturnStatement' && canReturn(stmt)) returnedAt = stmt.loc.start.line;
    }
  };
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') check(node.id?.name, node.body);
    if (node.type === 'VariableDeclarator' && node.init && /Function/.test(node.init.type)) check(node.id?.name, node.init.body);
    for (const [k, v] of Object.entries(node)) {
      if (k === 'loc') continue;
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object' && v.type) visit(v);
    }
  };
  visit(ast.program);
  return out;
}

const problems = [];
for (const f of files) {
  const file = f.replace(/\\/g, '/');
  try {
    const ast = parser.parse(readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    problems.push(...hookOrderProblems(ast, file));
  } catch (e) {
    problems.push(`${file}: ${e.message}`);
  }
}
if (problems.length) {
  console.error(`check-syntax: ${problems.length} file(s) (a file that doesn't parse, or a hook after an early return):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-syntax: ${files.length} files parse; no hook after an early return.`);
