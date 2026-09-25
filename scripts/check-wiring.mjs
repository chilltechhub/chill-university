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
// Every widget is explained the first time it lands on Home, so every one
// needs words (src/data/widgetIntros.js).
const { WIDGET_INTROS } = await load('src/data/widgetIntros.js');
for (const key of widgetKeys) {
  if (!WIDGET_INTROS[key]) problems.push(`widgetIntros.js: widget '${key}' has no intro, so it would arrive on Home unexplained`);
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

// ── Topic catalog links ─────────────────────────────────────────────────────
// A catalog entry marked built/related has to lead somewhere real: a class
// screen that is registered and has that topic key, or a quest that exists.
const importPath = new Map([...stack.matchAll(/^import (\w+) from '(\.\/classes\/[^']+)';/gm)].map(m => [m[1], m[2]]));
const screenFile = new Map([...stack.matchAll(/name="(\w+)"\s+component=\{(\w+)\}/g)]
  .filter(m => importPath.has(m[2]))
  .map(m => [m[1], `src/screens/${importPath.get(m[2]).slice(2).replace(/\.js$/, '')}.js`]));
const topicKeysCache = new Map();
async function topicKeysFor(screen) {
  if (!topicKeysCache.has(screen)) {
    const file = screenFile.get(screen);
    const src = file ? await text(file).catch(() => '') : '';
    topicKeysCache.set(screen, new Set([...src.matchAll(/^\s{4,6}key:\s*'(\w+)'/gm)].map(m => m[1])));
  }
  return topicKeysCache.get(screen);
}
const { TOPIC_CATALOG } = await load('src/data/topicCatalog.js');
const questSrc = await text('src/data/quests.js');
const questIds = new Set([...questSrc.matchAll(/^\s{4}id:\s*'([\w-]+)'/gm)].map(m => m[1]));
const subjectTitles = new Set(CLASS_SUBJECTS.map(sj => sj.title));
const catalogIds = new Set();
let catalogTopics = 0;
for (const entry of TOPIC_CATALOG) {
  if (!subjectTitles.has(entry.subject)) problems.push(`topicCatalog.js: subject '${entry.subject}' is not in CLASS_SUBJECTS`);
  for (const group of entry.groups) {
    for (const tp of group.topics) {
      catalogTopics += 1;
      if (catalogIds.has(tp.id)) problems.push(`topicCatalog.js: duplicate id '${tp.id}'`);
      catalogIds.add(tp.id);
      if (![1, 2, 3].includes(tp.level)) problems.push(`topicCatalog.js: ${tp.id} level must be 1, 2 or 3`);
      if (!tp.title || !tp.hook || !tp.summary) problems.push(`topicCatalog.js: ${tp.id} needs a title, hook and summary`);
      for (const kind of ['built', 'related']) {
        const link = tp[kind];
        if (!link) continue;
        if (link.quest) {
          if (!questIds.has(link.quest)) problems.push(`topicCatalog.js: ${tp.id} ${kind} quest '${link.quest}' doesn't exist`);
        } else if (!screenFile.has(link.screen)) {
          problems.push(`topicCatalog.js: ${tp.id} ${kind} screen '${link.screen}' isn't a registered class screen`);
        } else if (!(await topicKeysFor(link.screen)).has(link.topicKey)) {
          problems.push(`topicCatalog.js: ${tp.id} ${kind} topic '${link.topicKey}' isn't in ${link.screen}`);
        }
      }
    }
  }
}

// ── What did you come here for? ────────────────────────────────────────────
// Onboarding's answer is a purpose; its first goal is walked through by the
// guide, and AIM_OPENS puts what that goal needs on stage 1. Every account
// type can pick every aim, so each first goal has to be doable on each
// type's stage 1 plus that aim's openings. A step pointing at something
// hidden would teach the person, in their first five minutes, that the app
// hides the thing they came for.
{
  const { AIM_OPENS, STAGED_SCREENS } = await load('src/data/experienceStages.js');
  const { PURPOSES, ONBOARDING_AIMS, AIM_PERSONA, OBJECTIVE_BY_ID } = await load('src/data/objectives.js');
  const { FEATURES } = await load('src/data/featureCatalog.js');
  const { FIRST_GOAL_GUIDE } = await load('src/data/firstGoalGuide.js');
  const purposeKeys = new Set(PURPOSES.map(p => p.key));
  const featureByScreen = Object.fromEntries(FEATURES.map(f => [f.screen, f]));
  const featureById = Object.fromEntries(FEATURES.map(f => [f.id, f]));

  for (const key of ONBOARDING_AIMS) {
    if (!purposeKeys.has(key)) problems.push(`objectives.js: ONBOARDING_AIMS lists '${key}', which is not a purpose`);
    if (!AIM_OPENS[key]) problems.push(`experienceStages.js: aim '${key}' has no AIM_OPENS entry`);
  }
  for (const [key, type] of Object.entries(AIM_PERSONA)) {
    if (!PATHS[type]) problems.push(`objectives.js: AIM_PERSONA.${key} names unknown type '${type}'`);
  }
  for (const [aim, opens] of Object.entries(AIM_OPENS)) {
    if (!purposeKeys.has(aim)) problems.push(`experienceStages.js: AIM_OPENS.${aim} is not a purpose`);
    for (const id of opens.games || []) if (!GAME_REGISTRY[id]) problems.push(`experienceStages.js: AIM_OPENS.${aim} lists unknown game '${id}'`);
    for (const k of opens.widgets || []) if (!widgetKeys.has(k)) problems.push(`experienceStages.js: AIM_OPENS.${aim} adds unknown widget '${k}'`);
    for (const id of opens.features || []) if (!featureById[id]) problems.push(`experienceStages.js: AIM_OPENS.${aim} lists unknown feature '${id}'`);
  }

  // Every first goal the guide can be asked to lead has a script for each step.
  for (const o of Object.values(OBJECTIVE_BY_ID)) {
    if (!o.intro) continue;
    const script = FIRST_GOAL_GUIDE[o.id];
    if (!script) { problems.push(`firstGoalGuide.js: no script for first goal '${o.id}'`); continue; }
    for (const step of o.steps) {
      if (!script[step.id]) problems.push(`firstGoalGuide.js: '${o.id}' has no entry for step '${step.id}'`);
    }
  }

  const shownOn = (stage1, screen) => {
    if (!screen) return true;
    const allTools = (stage1.caps || new Set()).has('all-tools');
    const f = featureByScreen[screen];
    if (f) return f.gate !== 'open' ? false : allTools || stage1.features.has(f.id);
    const rule = STAGED_SCREENS[screen];
    if (rule === undefined) return true;
    if (typeof rule === 'string') return allTools || stage1.features.has(rule);
    return allTools || stage1.screens.has(screen);
  };
  for (const p of PURPOSES) {
    if (!p.firstGoal) continue;
    const goal = OBJECTIVE_BY_ID[p.firstGoal];
    if (!goal) { problems.push(`objectives.js: purpose '${p.key}' firstGoal '${p.firstGoal}' doesn't exist`); continue; }
    if (!goal.intro) problems.push(`objectives.js: purpose '${p.key}' firstGoal '${p.firstGoal}' isn't marked intro`);
    for (const id of p.path || []) if (!OBJECTIVE_BY_ID[id]) problems.push(`objectives.js: purpose '${p.key}' path names unknown objective '${id}'`);
    for (const [type, stages] of Object.entries(PATHS)) {
      const opens = AIM_OPENS[p.key] || {};
      const stage1 = {
        features: new Set([...(stages[0].features || []), ...(opens.features || [])]),
        screens: new Set([...(stages[0].screens || []), ...(opens.screens || [])]),
        caps: new Set([...(stages[0].caps || []), ...(opens.caps || [])]),
      };
      for (const step of goal.steps) {
        if (!shownOn(stage1, step.screen)) {
          problems.push(`${goal.id} step '${step.id}' opens ${step.screen}, which a ${type} profile that picked '${p.key}' can't see on stage 1 (add it to AIM_OPENS.${p.key})`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`Wiring: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`Wiring OK: ${Object.keys(GAME_REGISTRY).length} games, all in the feed; every stage and lesson link resolves; ${topics} class topics, all with a screen; ${catalogTopics} catalog topics, every built/related link real.`);
