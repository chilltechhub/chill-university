// scripts/check-pickables.mjs
//
// "Pick your features" promises every part of the app. This fails if
// something can be on the map but not in that list, or is in it twice:
//   - every featureCatalog id belongs to exactly one pickable item (or is
//     always on: Home and App Nav)
//   - every staged screen that isn't an alias of a feature is pickable
//   - every Home card in HomeScreen's WIDGET_DEFS is a base card or belongs
//     to a pickable item
//   - every + button action belongs to a pickable item
//   - every item names a group that exists, and ids are unique
//
// Run: node scripts/check-pickables.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

async function load(path) {
  const src = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  return import('data:text/javascript,' + encodeURIComponent(src));
}
const text = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const { PICKABLES, PICK_GROUPS, ALWAYS_ON_FEATURES, BASE_WIDGETS } = await load('src/data/pickables.js');
const { FEATURES } = await load('src/data/featureCatalog.js');
const { STAGED_SCREENS } = await load('src/data/experienceStages.js');

const problems = [];
const fail = (msg) => problems.push(msg);

// Ids and groups
const ids = new Set();
const groups = new Set(PICK_GROUPS.map(g => g.key));
PICKABLES.forEach(p => {
  if (ids.has(p.id)) fail(`pickable "${p.id}" is listed twice`);
  ids.add(p.id);
  if (!groups.has(p.group)) fail(`pickable "${p.id}" names group "${p.group}", which doesn't exist`);
  if (!p.label || !p.blurb || !p.icon) fail(`pickable "${p.id}" needs a label, blurb and icon`);
  // One card on Home per pick, so a Home of five picks stays five cards.
  if ((p.widgets || []).length > 1) fail(`pickable "${p.id}" puts ${p.widgets.length} cards on Home; move the rest to extraWidgets`);
});

// Features
const owners = {};
PICKABLES.forEach(p => (p.features || []).forEach(f => { (owners[f] = owners[f] || []).push(p.id); }));
FEATURES.forEach(f => {
  const own = owners[f.id] || [];
  if (ALWAYS_ON_FEATURES.includes(f.id)) {
    if (own.length) fail(`feature "${f.id}" is always on but also pickable (${own.join(', ')})`);
    return;
  }
  if (!own.length) fail(`feature "${f.id}" isn't in any pickable item, so nobody can pick it`);
  if (own.length > 1) fail(`feature "${f.id}" is in ${own.length} pickable items (${own.join(', ')})`);
});
const known = new Set(FEATURES.map(f => f.id));
Object.keys(owners).forEach(f => { if (!known.has(f)) fail(`pickable feature "${f}" isn't in featureCatalog.js`); });

// Staged screens (`true` = its own entry; a string is an alias of a feature)
const screenOwners = new Set(PICKABLES.flatMap(p => p.screens || []));
Object.entries(STAGED_SCREENS).forEach(([screen, rule]) => {
  if (rule === true && !screenOwners.has(screen)) fail(`staged screen "${screen}" isn't in any pickable item`);
});
screenOwners.forEach(s => { if (STAGED_SCREENS[s] !== true) fail(`pickable screen "${s}" isn't a staged screen in experienceStages.js`); });

// Home cards
const home = await text('src/screens/HomeScreen.js');
const defs = home.slice(home.indexOf('const WIDGET_DEFS = ['), home.indexOf('const WIDGET_KEYS'));
const widgetKeys = [...defs.matchAll(/key:\s*'([A-Za-z]+)'/g)].map(m => m[1]);
if (widgetKeys.length < 10) fail(`couldn't read WIDGET_DEFS from HomeScreen.js (found ${widgetKeys.length})`);
const widgetOwners = new Set([...BASE_WIDGETS, 'stageSteps', ...PICKABLES.flatMap(p => [...(p.widgets || []), ...(p.extraWidgets || []), ...(p.typeWidgets || [])])]);
widgetKeys.forEach(k => { if (!widgetOwners.has(k)) fail(`Home card "${k}" isn't a base card or in any pickable item`); });
widgetOwners.forEach(k => { if (!widgetKeys.includes(k)) fail(`pickable Home card "${k}" isn't in HomeScreen's WIDGET_DEFS`); });

// + button actions
const fab = await text('src/components/FloatingActionButton.js');
const actions = fab.slice(fab.indexOf('ACTIONS = ['), fab.indexOf('];', fab.indexOf('ACTIONS = [')));
const actionKeys = [...actions.matchAll(/\{\s*key:\s*'([a-z]+)'[^}]*\}/g)]
  .filter(m => !/always:\s*true/.test(m[0]))
  .map(m => m[1])
  // "Plan from a link" opens with the Inbox (FloatingActionButton maps it).
  .filter(k => k !== 'plan');
const fabOwners = new Set(PICKABLES.flatMap(p => p.fab || []));
actionKeys.forEach(k => { if (!fabOwners.has(k)) fail(`+ button action "${k}" isn't in any pickable item`); });
const { FAB_ACTIONS } = { FAB_ACTIONS: (await text('src/logic/experienceStage.js')).match(/FAB_ACTIONS = \[([^\]]+)\]/)?.[1].match(/'([a-z]+)'/g).map(s => s.slice(1, -1)) || [] };
actionKeys.forEach(k => { if (!FAB_ACTIONS.includes(k)) fail(`+ button action "${k}" is missing from FAB_ACTIONS in experienceStage.js`); });

// Onboarding cards (src/logic/onboardingCards.js): which ones each start
// track sees, and that the rule names the cards MultiStepOnboarding has.
{
  const { ONBOARDING_CARDS, shownCards } = await load('src/logic/onboardingCards.js');
  const stepKeys = [...(await text('src/screens/MultiStepOnboarding.js')).matchAll(/\{ key: '([a-z]+)',\s+component:/g)].map(m => m[1]);
  if (stepKeys.join() !== ONBOARDING_CARDS.join()) fail(`onboarding: STEPS keys [${stepKeys}] don't match ONBOARDING_CARDS [${ONBOARDING_CARDS}]`);
  const seen = (ctx) => shownCards(ONBOARDING_CARDS, ctx).map(i => ONBOARDING_CARDS[i]).join(' ');
  const want = (name, ctx, expected) => { const got = seen(ctx); if (got !== expected) fail(`onboarding ${name}: got "${got}", want "${expected}"`); };
  want('Level up', { mode: 'auto', hasLifeAreas: false }, 'welcome aim persona start name sectors');
  want('Just my picks + Life Areas', { mode: 'picks', hasLifeAreas: true }, 'welcome aim persona start features name sectors');
  want('Just my picks, no Life Areas', { mode: 'picks', hasLifeAreas: false }, 'welcome aim persona start features name');
  want('All in, Life Areas unticked', { mode: 'full', hasLifeAreas: false }, 'welcome aim persona start features name');
}

if (problems.length) {
  console.error(`check-pickables: ${problems.length} problem(s)`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-pickables: ${PICKABLES.length} items cover ${FEATURES.length} features, ${widgetKeys.length} Home cards and ${actionKeys.length} + actions.`);
