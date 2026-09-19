// scripts/check-wiring.mjs
//
// Fails if a game or class topic is listed but not wired, or wired to an id
// that doesn't exist.
//
// A game lives in two places: its metadata in src/services/gameRegistry.js
// and its component in GameFeed.js's COMPONENT_MAP. Forget the second and
// nothing complains until someone swipes to that page of the feed and it
// crashes. The same goes for a stage (experienceStages.js) or a lesson link
// (skillLinks.js) naming a game id that was renamed or never added: the
// game silently never shows, or the "Practise this" chip goes nowhere.
//
// Keeping the two lists apart is deliberate (the registry is read by Home,
// search and the planner, which shouldn't have to load every game), so this
// script is what keeps them honest instead.
//
// Classes have the same shape of problem: a topic in classCatalog.js needs a
// CLASS_SCREEN_MAP entry, and that screen needs to be registered in
// ClassesStack.js. Miss either and the tap does nothing.
//
// Run: node scripts/check-wiring.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

// These data files have no imports of their own, so they can be evaluated
// as-is, the same way gen-gating-seed.mjs loads featureCatalog.js.
async function load(path) {
  const src = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  return import('data:text/javascript,' + encodeURIComponent(src));
}
const text = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const { GAME_REGISTRY, MECHANIC_META } = await load('src/services/gameRegistry.js');
const { PATHS } = await load('src/data/experienceStages.js');
const { CLASS_SUBJECTS, CLASS_SCREEN_MAP } = await load('src/data/classCatalog.js');

// The subject keys useGame writes to Supabase. Mirrors SUBJECT_CONFIG in
// context/UserProgressContext.js, which can't be loaded outside the app.
const SUBJECTS = new Set([
  'math', 'language_arts', 'science', 'health', 'finance', 'home_ec',
  'social_studies', 'arts', 'technology', 'foreign_language', 'mental',
  'social_skills', 'career', 'general',
]);

const problems = [];

// ── GameFeed's COMPONENT_MAP and its imports ────────────────────────────────
const feed = stripComments(await text('src/components/GameFeed.js'));
const imported = new Set([...feed.matchAll(/^import\s+(\w+)\s+from\s+'\.\/\w+';/gm)].map(m => m[1]));
const mapBody = feed.match(/const COMPONENT_MAP = \{([\s\S]*?)\};/)?.[1];
if (!mapBody) {
  problems.push('GameFeed.js: could not find COMPONENT_MAP');
}
const mapped = new Map(); // registry `component` name -> imported identifier
for (const entry of (mapBody || '').split(',').map(e => e.trim()).filter(Boolean)) {
  const [key, value] = entry.split(':').map(p => p.trim());
  mapped.set(key, value || key);
}
for (const [key, ident] of mapped) {
  if (!imported.has(ident)) problems.push(`GameFeed.js: COMPONENT_MAP.${key} uses ${ident}, which is never imported`);
}

// ── The registry itself ─────────────────────────────────────────────────────
const used = new Set();
for (const [key, game] of Object.entries(GAME_REGISTRY)) {
  const where = `gameRegistry.js: ${key}`;
  if (game.id !== key) problems.push(`${where}: id is '${game.id}', must equal its key`);
  if (!mapped.has(game.component)) problems.push(`${where}: component '${game.component}' is missing from GameFeed's COMPONENT_MAP`);
  used.add(game.component);
  if (!SUBJECTS.has(game.subject)) problems.push(`${where}: subject '${game.subject}' is not one of the 14 subject keys`);
  if (!MECHANIC_META[game.mechanic]) problems.push(`${where}: mechanic '${game.mechanic}' has no MECHANIC_META row`);
  for (const field of ['name', 'subjectLabel', 'grade', 'icon', 'color', 'desc']) {
    if (!game[field]) problems.push(`${where}: missing '${field}'`);
  }
}
for (const key of mapped.keys()) {
  if (!used.has(key)) problems.push(`GameFeed.js: COMPONENT_MAP.${key} matches no registry entry (dead import?)`);
}

// ── Stages ──────────────────────────────────────────────────────────────────
for (const [type, stages] of Object.entries(PATHS)) {
  stages.forEach((stage, i) => {
    for (const id of stage.games || []) {
      if (!GAME_REGISTRY[id]) problems.push(`experienceStages.js: ${type} stage ${i + 1} (${stage.key}) lists unknown game '${id}'`);
    }
  });
}

// ── Home widgets named by stages and account types ──────────────────────────
// A key Home doesn't render is silently dropped from the dashboard, so a
// stage that "opens" it opens nothing.
const home = stripComments(await text('src/screens/HomeScreen.js'));
const defsBody = home.match(/const WIDGET_DEFS = \[([\s\S]*?)\];/)?.[1] || '';
const widgetKeys = new Set([...defsBody.matchAll(/key:\s*'(\w+)'/g)].map(m => m[1]));
if (!widgetKeys.size) problems.push('HomeScreen.js: could not read WIDGET_DEFS');
const rendered = new Set([...home.matchAll(/key:\s*'(\w+)',\s*title:[^\n]*\n\s*render:/g)].map(m => m[1]));
for (const key of widgetKeys) {
  if (!rendered.has(key)) {
    problems.push(`HomeScreen.js: widget '${key}' is in WIDGET_DEFS but has no render entry`);
  }
}
for (const [type, stages] of Object.entries(PATHS)) {
  stages.forEach((stage, i) => {
    for (const key of stage.widgets || []) {
      if (!widgetKeys.has(key)) problems.push(`experienceStages.js: ${type} stage ${i + 1} (${stage.key}) adds unknown widget '${key}'`);
    }
  });
}
const { PERSONAS } = await load('src/data/personas.js');
for (const p of PERSONAS) {
  for (const key of p.defaultWidgets || []) {
    if (!widgetKeys.has(key)) problems.push(`personas.js: ${p.key} defaultWidgets has unknown widget '${key}'`);
  }
}

// ── Lesson links ────────────────────────────────────────────────────────────
// skillLinks.js imports the registry, so read its LINKS table as text.
const links = stripComments(await text('src/data/skillLinks.js'));
const screens = new Set(Object.values(CLASS_SCREEN_MAP));
for (const m of links.matchAll(/\{\s*game:\s*'([^']+)',\s*screen:\s*'([^']+)'/g)) {
  const [, game, screen] = m;
  if (!GAME_REGISTRY[game]) problems.push(`skillLinks.js: link to unknown game '${game}'`);
  if (!screens.has(screen)) problems.push(`skillLinks.js: link to '${screen}', which is not a screen in CLASS_SCREEN_MAP`);
}

// ── Class topics ────────────────────────────────────────────────────────────
// A subject with children navigates by child label; one without navigates
// by its own title (Classes.js goToChild). Remote class_subject rows only
// override icon/colour/description/comingSoon, never labels, so the
// hardcoded catalog is the whole list.
const stack = stripComments(await text('src/screens/ClassesStack.js'));
const registered = new Set([...stack.matchAll(/name="(\w+)"/g)].map(m => m[1]));
let topics = 0;
for (const subj of CLASS_SUBJECTS) {
  const labels = subj.children ? subj.children.map(ch => ch.label) : [subj.title];
  for (const label of labels) {
    topics += 1;
    const screen = CLASS_SCREEN_MAP[label];
    if (!screen) problems.push(`classCatalog.js: "${label}" (${subj.title}) has no CLASS_SCREEN_MAP entry`);
    else if (!registered.has(screen)) problems.push(`ClassesStack.js: "${label}" maps to screen '${screen}', which isn't registered`);
  }
}

if (problems.length) {
  console.error(`Wiring: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`Wiring OK: ${Object.keys(GAME_REGISTRY).length} games, all in the feed; every stage and lesson link resolves; ${topics} class topics, all with a screen.`);
