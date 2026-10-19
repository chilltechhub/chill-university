// scripts/check-connectors.mjs
// Connected apps (src/data/connectorsCatalog.js, docs/connections-plan-2026-10-18.md):
// every app says in plain words what it reads and writes, every live one
// has code behind it (src/connectors/index.js CONNECTOR_IMPL), and every
// "soon" one names the phase that builds it.
import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/data/connectorsCatalog.js', import.meta.url), 'utf8');
const { CONNECTORS, CONNECTOR_GROUPS } = await import('data:text/javascript,' + encodeURIComponent(src));
const impl = await readFile(new URL('../src/connectors/index.js', import.meta.url), 'utf8');
const implBlock = impl.slice(impl.indexOf('export const CONNECTOR_IMPL'), impl.indexOf('\n};', impl.indexOf('export const CONNECTOR_IMPL')));

const problems = [];
const fail = (m) => problems.push(m);
const GROUPS = new Set(CONNECTOR_GROUPS.map(g => g.key));
const LANDS = new Set(['inbox', 'planner', 'vault', 'life-areas']);
const PLATFORMS = new Set(['ios', 'android', 'web']);
const PHASES = new Set(['B', 'C', 'D', 'E']);
const seen = new Set();

for (const c of CONNECTORS) {
  const at = `connector '${c.id}'`;
  if (!c.id || seen.has(c.id)) fail(`${at}: missing or duplicate id`);
  seen.add(c.id);
  if (!GROUPS.has(c.group)) fail(`${at}: unknown group '${c.group}'`);
  if (!c.name) fail(`${at}: no name`);
  if (!c.icon) fail(`${at}: no icon`);
  for (const k of ['reads', 'writes']) {
    if (!c[k] || typeof c[k] !== 'string') fail(`${at}: no plain-words '${k}' line`);
    else if (c[k].includes('**')) fail(`${at}: '${k}' is shown as plain text, drop the **`);
  }
  if (!LANDS.has(c.lands)) fail(`${at}: lands '${c.lands}' is not one of ${[...LANDS].join('/')}`);
  if (c.status === 'live') {
    if (!Array.isArray(c.platforms) || !c.platforms.length || c.platforms.some(p => !PLATFORMS.has(p))) fail(`${at}: live needs platforms from ios/android/web`);
    const key = c.id.includes('-') ? `'${c.id}':` : `${c.id}:`;
    if (!implBlock.includes(key)) fail(`${at}: live but has no entry in CONNECTOR_IMPL (src/connectors/index.js)`);
  } else if (c.status === 'soon') {
    if (!PHASES.has(c.phase)) fail(`${at}: soon needs a phase (B-E)`);
  } else {
    fail(`${at}: status '${c.status}' is not live/soon`);
  }
}

if (problems.length) {
  console.error(`check-connectors: ${problems.length} problem(s)`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
const live = CONNECTORS.filter(c => c.status === 'live').length;
console.log(`check-connectors: ${CONNECTORS.length} apps (${live} live, ${CONNECTORS.length - live} coming), each with reads/writes and code or a phase.`);
