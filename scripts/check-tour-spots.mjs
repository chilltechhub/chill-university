// scripts/check-tour-spots.mjs
//
// Fails if a tutorial step points at a TourSpot that doesn't exist, or if
// anything hands the navigator a route that doesn't exist (see Routes,
// below).
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

// App.js too: the tab bar's spot (nav-tabbar) is rendered there.
const files = [...walk(SRC), ...walk(CONTEXT), join(ROOT, 'App.js')];

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

// "About this page" Show me steps (src/data/pageInfo.js) point at spots too.
{
  const f = join(SRC, 'data', 'pageInfo.js');
  for (const m of decomment(readFileSync(f, 'utf8')).matchAll(/\bid:\s*['"]([^'"]+)['"]/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, f));
  }
}

// Guide lessons (src/logic/guide/lessons/, the shake-up's guide) name their
// spots as `id:` like the screen tutorials.
{
  const dir = join(SRC, 'logic', 'guide', 'lessons');
  let lessonFiles = [];
  try { lessonFiles = walk(dir); } catch { /* no lessons yet */ }
  for (const f of lessonFiles) {
    for (const m of decomment(readFileSync(f, 'utf8')).matchAll(/\bid:\s*['"]([^'"]+)['"]/g)) {
      if (!referenced.has(m[1])) referenced.set(m[1], relative(ROOT, f));
    }
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

// ── Routes ──────────────────────────────────────────────────────────────────
// The same silent failure, one level up: a tour step, goal step, search row
// or link that names a route nobody registered navigates nowhere, and
// nothing says so. The shake-up (docs/shake-up-plan-2026-10-21.md) renames
// and moves routes, so every name the app's data hands to the navigator must
// be a registered route or an alias in src/logic/routeAliases.js.

const read = (rel) => decomment(readFileSync(join(ROOT, rel), 'utf8'));
const asModule = (rel) => import('data:text/javascript,' + encodeURIComponent(readFileSync(join(ROOT, rel), 'utf8')));
const { ALIASES } = await asModule('src/logic/routeAliases.js');
const { SURFACES, ROUTE_TO_SURFACE, SURFACE_IDS, seedGuideSeen } = await asModule('src/logic/guide/surfaces.js');

// Every <X.Screen name="..."> in any navigator. `name` comes first on all
// of them, sometimes on the next line.
const registered = new Set();
for (const f of files) {
  for (const m of decomment(readFileSync(f, 'utf8')).matchAll(/<\w+\.Screen\s+name=["']([^"']+)["']/g)) registered.add(m[1]);
}
const isRoute = (name) => registered.has(name) || Object.hasOwn(ALIASES, name);

// The top-level keys of `const NAME = { ... }` in `src`.
function objectKeys(src, name) {
  const at = src.indexOf(`const ${name} = {`);
  if (at < 0) return null;
  const keys = [];
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i++) {
    const ch = src[i];
    if ('{[('.includes(ch)) depth++;
    else if ('}])'.includes(ch)) { if (--depth === 0) break; }
    else if (depth === 1 && /[\s,{]/.test(src[i - 1])) {
      const m = src.slice(i).match(/^([A-Za-z]\w*)\s*:/);
      if (m) { keys.push(m[1]); i += m[0].length - 1; }
    }
  }
  return keys;
}

// Route names a source hands to the navigator. Exported shape so the
// self-test below can run it on a made-up file.
function routeRefs(src, rel) {
  const out = [];
  const add = (name, how) => out.push({ name, how, where: rel });
  // Tour, lesson and guide steps
  for (const m of src.matchAll(/\bgo:\s*['"]([A-Za-z]\w*)['"]/g)) add(m[1], 'go');
  // Goal steps, catalog features, link targets, search rows
  for (const m of src.matchAll(/\bscreen:\s*['"]([A-Za-z]\w*)['"]/g)) add(m[1], 'screen');
  // Any file: a literal screen handed to goToScreen or navigate
  for (const m of src.matchAll(/goToScreen\(\s*[\w.]+\s*,\s*'([A-Za-z]\w*)'/g)) add(m[1], 'goToScreen');
  for (const m of src.matchAll(/\.(?:navigate|push|replace)\(\s*'([A-Za-z]\w*)'/g)) add(m[1], 'navigate');
  return out;
}

// Self-test: a deliberately bad step must fail, or this check proves nothing.
if (!routeRefs(`const STEP = { go: 'Nope', spot: 'x' };`, 'self-test').some(r => r.name === 'Nope' && !isRoute(r.name))) {
  console.log('\nFAIL — the route check no longer catches a bad `go:`');
  process.exit(1);
}

const refs = [];
// Data that names routes. `screen:` is only read here, where it always means
// a route (elsewhere it can be a nested navigator param pointing anywhere).
const DATA = [
  'src/data/firstGoalGuide.js', 'src/logic/tourSteps.js', 'src/logic/useGuidedFirstGoal.js',
  'src/data/objectives.js', 'src/data/units.js', 'src/data/featureCatalog.js', 'src/logic/openTarget.js',
  'src/logic/searchIndex.js', 'src/data/experienceStages.js', 'src/data/pageInfo.js',
];
const guideDir = join(SRC, 'logic', 'guide');
for (const f of walk(guideDir)) DATA.push(relative(ROOT, f).replace(/\\/g, '/'));
for (const rel of DATA) refs.push(...routeRefs(read(rel), rel).filter(r => r.how !== 'goToScreen' && r.how !== 'navigate'));
// Literal navigation calls anywhere in the app
for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  refs.push(...routeRefs(decomment(readFileSync(f, 'utf8')), rel).filter(r => r.how === 'goToScreen' || r.how === 'navigate'));
}
{
  const search = read('src/logic/searchIndex.js');
  for (const m of search.matchAll(/\b(?:root|library|classes)\(\s*'([A-Za-z]\w*)'/g)) refs.push({ name: m[1], how: 'search row', where: 'src/logic/searchIndex.js' });
  const stages = read('src/data/experienceStages.js');
  for (const m of stages.matchAll(/\b(?:reteach|screens):\s*\[([^\]]*)\]/g)) {
    for (const n of m[1].matchAll(/'([A-Za-z]\w*)'/g)) refs.push({ name: n[1], how: 'stage screen', where: 'src/data/experienceStages.js' });
  }
  for (const k of objectKeys(stages, 'STAGED_SCREENS') || []) refs.push({ name: k, how: 'STAGED_SCREENS', where: 'src/data/experienceStages.js' });
  const tutorials = read('src/logic/screenTutorials.js');
  for (const block of ['SCREEN_FEATURES', 'STARTER_FEATURES']) {
    const keys = objectKeys(tutorials, block);
    if (!keys) { console.log(`\nFAIL — couldn't read ${block} from screenTutorials.js`); process.exit(1); }
    keys.forEach(k => refs.push({ name: k, how: block, where: 'src/logic/screenTutorials.js' }));
  }
  for (const k of objectKeys(read('src/data/pageInfo.js'), 'ROUTE_HELP') || []) refs.push({ name: k, how: 'ROUTE_HELP', where: 'src/data/pageInfo.js' });
}

const routeProblems = [];
const seenRef = new Set();
for (const r of refs) {
  const key = `${r.name}|${r.how}|${r.where}`;
  if (seenRef.has(key) || isRoute(r.name)) continue;
  seenRef.add(key);
  routeProblems.push(`${r.how} '${r.name}' isn't a registered route or alias   (${r.where})`);
}

// Aliases: one hop, to a route that exists or is marked for a later phase.
for (const [from, a] of Object.entries(ALIASES)) {
  if (!a?.to) { routeProblems.push(`routeAliases: '${from}' has no target`); continue; }
  if (ALIASES[a.to]) routeProblems.push(`routeAliases: '${from}' → '${a.to}', which is itself an alias`);
  if (!registered.has(a.to) && !a.phase) routeProblems.push(`routeAliases: '${from}' → '${a.to}', which isn't registered and has no phase`);
}

// What an alias does today: nothing until its target exists and its gate is
// on. PlannerScreen keeps opening the Planner, with its params.
{
  const { resolveAlias, setAliasGate } = await asModule('src/logic/routeAliases.js');
  const known = (n) => registered.has(n);
  const params = { date: '2026-10-21' };
  const planner = resolveAlias('PlannerScreen', params, known);
  if (planner.screen !== 'PlannerScreen' || planner.params !== params) routeProblems.push(`routeAliases: PlannerScreen should still open the Planner, got ${JSON.stringify(planner)}`);
  setAliasGate('dashboardV2', true);
  const today = resolveAlias('PlannerScreen', params, known);
  if (today.screen !== 'Home' || today.params?.date !== params.date) routeProblems.push(`routeAliases: with dashboardV2 on, PlannerScreen should open Home with its date, got ${JSON.stringify(today)}`);
  setAliasGate('dashboardV2', false);
  // Profile opens You with the new tabs (TABS_V2, P4), and stays Profile without.
  if (resolveAlias('Profile', undefined, known).screen !== 'Profile') routeProblems.push('routeAliases: Profile should stay Profile with the new tabs off');
  setAliasGate('tabsV2', true);
  if (resolveAlias('Profile', undefined, known).screen !== 'You') routeProblems.push('routeAliases: with tabsV2 on, Profile should open You');
  setAliasGate('tabsV2', false);
  // Stats keeps opening Insights until You has the receipts (P5).
  if (resolveAlias('Stats', { x: 1 }, known).screen !== 'Stats') routeProblems.push('routeAliases: Stats should keep opening Insights until the receipts gate is on');
  setAliasGate('receipts', true);
  const stats = resolveAlias('Stats', { x: 1 }, (n) => n === 'You');
  if (stats.screen !== 'You' || stats.params?.anchor !== 'receipts' || stats.params?.x !== 1) routeProblems.push(`routeAliases: Stats should open You at receipts once its gate is on, got ${JSON.stringify(stats)}`);
  setAliasGate('receipts', false);
}

// The guide's seen-set syncs across devices (prefsSync.js PREFIXES), loaded
// for real with its two imports stubbed.
{
  const stub = (rel, swaps) => {
    let src = readFileSync(join(ROOT, rel), 'utf8');
    for (const [from, to] of swaps) {
      if (!src.includes(from)) routeProblems.push(`${rel}: expected \`${from}\``);
      src = src.replace(from, to);
    }
    return 'data:text/javascript,' + encodeURIComponent(src);
  };
  const storage = "const AsyncStorage = { setItem: async () => {}, removeItem: async () => {}, getItem: async () => null, getAllKeys: async () => [], multiGet: async () => [] };";
  const sync = await import(stub('src/logic/prefsSync.js', [
    ["import AsyncStorage from '@react-native-async-storage/async-storage';", storage],
    ["import { supabase } from '../api/supabaseClient';", 'const supabase = {};'],
  ]));
  const surfacesUrl = 'data:text/javascript,' + encodeURIComponent(readFileSync(join(ROOT, 'src/logic/guide/surfaces.js'), 'utf8'));
  const seen = await import(stub('src/logic/guide/seenSet.js', [
    ["import AsyncStorage from '@react-native-async-storage/async-storage';", storage],
    ["from './surfaces';", `from "${surfacesUrl}";`],
  ]));
  if (!sync.isSyncedPref('@cth_guide_seen_v2_x')) routeProblems.push("prefsSync: '@cth_guide_seen_v2_x' should sync (add '@cth_guide_seen' to PREFIXES)");
  if (seen.guideSeenKey('x') !== '@cth_guide_seen_v2_x' || !sync.isSyncedPref(seen.guideSeenKey('abc'))) routeProblems.push(`seenSet: guideSeenKey gave '${seen.guideSeenKey('x')}', which must start '@cth_guide_seen' to sync`);
}

// appRoutes.js's ROOT_SCREENS must be exactly App.js's root stack, or
// goToScreen sends a root screen into the Library tab (ConnectedApps did).
{
  const app = decomment(readFileSync(join(ROOT, 'App.js'), 'utf8'));
  const appRoot = new Set([...app.matchAll(/<Stack\.Screen\s+name=["']([^"']+)["']/g)].map(m => m[1]));
  const body = read('src/logic/appRoutes.js').match(/const ROOT_SCREENS = new Set\(\[([\s\S]*?)\]\)/)?.[1] || '';
  const listed = new Set([...body.matchAll(/'([A-Za-z]\w*)'/g)].map(m => m[1]));
  if (!listed.size) routeProblems.push("appRoutes.js: couldn't read ROOT_SCREENS");
  appRoot.forEach(n => { if (!listed.has(n)) routeProblems.push(`appRoutes.js: root screen '${n}' (App.js) is missing from ROOT_SCREENS`); });
  listed.forEach(n => { if (!appRoot.has(n)) routeProblems.push(`appRoutes.js: ROOT_SCREENS lists '${n}', which isn't on App.js's root stack`); });
}

// Surfaces (src/logic/guide/surfaces.js)
{
  const ids = new Set();
  for (const s of SURFACES) {
    if (ids.has(s.id)) routeProblems.push(`surfaces: '${s.id}' is listed twice`);
    ids.add(s.id);
    (s.routes || []).forEach(r => { if (!isRoute(r)) routeProblems.push(`surfaces: '${s.id}' shows on '${r}', which isn't a route`); });
  }
  for (const [route, list] of Object.entries(ROUTE_TO_SURFACE)) {
    if (!isRoute(route)) routeProblems.push(`surfaces: ROUTE_TO_SURFACE names '${route}', which isn't a route`);
    list.forEach(id => { if (!ids.has(id)) routeProblems.push(`surfaces: ROUTE_TO_SURFACE['${route}'] names unknown surface '${id}'`); });
  }
  // Every surface has "About this page" and a mentor note (shake-up P7),
  // short, with at most three of each kind of button, and none of the old
  // app's words.
  const { PAGES, ROUTE_HELP, pageInfoFor, pageWords } = await asModule('src/data/pageInfo.js');
  const { NOTES } = await asModule('src/logic/guide/lessons/notes.js');
  const OLD = /\b(points?|XP|level(?:s| up)?|streaks?|rank|leaderboard|Library|Home tab|Training tab|Screen Tutorial)\b/i;
  for (const id of SURFACE_IDS) {
    const page = PAGES[id];
    if (!page) { routeProblems.push(`pageInfo: surface '${id}' has no page`); continue; }
    if (!NOTES[id]) routeProblems.push(`notes: surface '${id}' has no mentor note`);
    if (!page.what || !page.helps?.default) routeProblems.push(`pageInfo: '${id}' needs what and helps.default`);
    if ((page.actions || []).length > 3 || (page.show || []).length > 3) routeProblems.push(`pageInfo: '${id}' has more than three actions or Show me steps`);
    for (const p of ['like', 'next', 'money', 'career', 'ground']) {
      const words = pageWords(pageInfoFor(id, null, { pathKey: p }));
      if (words >= 60) routeProblems.push(`pageInfo: '${id}' runs ${words} words for path '${p}' (keep it under 60)`);
    }
    const copy = JSON.stringify([page.title, page.what, page.helps, (page.actions || []).map(a => a.label), (page.show || []).map(st => [st.title, st.body]), NOTES[id]]);
    if (OLD.test(copy)) routeProblems.push(`pageInfo/notes: '${id}' says "${copy.match(OLD)[0]}", old app copy`);
  }
  for (const id of Object.keys(PAGES)) if (!ids.has(id)) routeProblems.push(`pageInfo: '${id}' isn't a surface`);
  for (const id of Object.keys(NOTES)) if (!ids.has(id)) routeProblems.push(`notes: '${id}' isn't a surface`);
  for (const [route, h] of Object.entries(ROUTE_HELP)) {
    if (!h.title || !h.body) routeProblems.push(`pageInfo: ROUTE_HELP['${route}'] needs a title and body`);
    if (OLD.test(`${h.title} ${h.body}`)) routeProblems.push(`pageInfo: ROUTE_HELP['${route}'] says "${`${h.title} ${h.body}`.match(OLD)[0]}", old app copy`);
  }
  const ged = pageInfoFor('learn.path', 'Training', { pathKey: 'next', startPoint: 'ged' });
  if (!/practice tests/i.test(ged.helps)) routeProblems.push(`pageInfo: a GED start's Learn should talk about practice tests, got "${ged.helps}"`);
  const shownOn = pageInfoFor('learn.path', 'PathScreen', {}).show.map(st => st.id);
  if (shownOn.includes('learn-path')) routeProblems.push('pageInfo: Show me on My path lists a Learn-only spot');

  // The first-day walk: four steps on Today, ending at your picture, both views.
  {
    const { firstDayWalk } = await asModule('src/logic/guide/lessons/firstDayWalk.js');
    for (const calm of [false, true]) {
      const walk = firstDayWalk({ calm });
      const got = walk.map(st => st.id).join(' ');
      const want = `${calm ? 'calm-next' : 'home-compass'} planner-add planner-views topbar-avatar`;
      if (got !== want) routeProblems.push(`firstDayWalk(calm ${calm}): ${got}, want ${want}`);
      if (walk.some(st => st.go && !isRoute(st.go))) routeProblems.push('firstDayWalk: a step goes to an unknown route');
      if (OLD.test(JSON.stringify(walk))) routeProblems.push(`firstDayWalk: says "${JSON.stringify(walk).match(OLD)[0]}", old app copy`);
    }
  }

  // The v2 seed: old routes carry over, and an existing account is taught
  // nothing it already knew.
  const fresh = seedGuideSeen(['PlannerScreen'], { existingAccount: false });
  if (fresh.join() !== 'today.day,today.week,today.month') routeProblems.push(`surfaces: seeding ['PlannerScreen'] gave [${fresh}]`);
  const existing = seedGuideSeen([], { existingAccount: true });
  const owed = SURFACES.filter(s => s.before).map(s => s.id).filter(id => !existing.includes(id));
  if (owed.length) routeProblems.push(`surfaces: an existing account would be re-taught ${owed.join(', ')}`);
  if (existing.includes('learn.unit')) routeProblems.push('surfaces: an existing account is marked as taught units, which are new');
  if (seedGuideSeen(['Nope', 'Settings']).length) routeProblems.push('surfaces: unknown old routes should seed nothing');
  if (SURFACE_IDS.length !== SURFACES.length) routeProblems.push('surfaces: SURFACE_IDS is out of step with SURFACES');
}

console.log(`\nRoutes registered: ${registered.size} (+ ${Object.keys(ALIASES).length} aliases); names checked: ${refs.length}; surfaces: ${SURFACES.length}`);
if (routeProblems.length) {
  console.log(`\nFAIL — route problems (${routeProblems.length}):`);
  routeProblems.forEach(p => console.log(`  ✗ ${p}`));
  process.exit(1);
}
console.log('OK — every route name the app hands out is registered or aliased.');
