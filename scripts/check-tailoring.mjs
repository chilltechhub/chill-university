// scripts/check-tailoring.mjs
//
// Checks the shake-up's tailoring (docs/shake-up-plan-2026-10-21.md §7.2, §8):
//   - src/data/pathKits.js names only real things: widgets that exist or are
//     planned, Studio kinds, + actions, catalog tools, guide surfaces
//   - src/logic/tailoring.js follows the §8.1 table for every starting point ×
//     shakiest circle, and gives Today its core widgets + at most 4 more
//   - src/logic/derivePersona.js gives every account an existing type
//   - src/logic/welcomeCards.js asks no age, keeps only the answers, and
//     opens the app where §7.2's boot table says
//
// Run: node scripts/check-tailoring.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const text = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const asUrl = (code) => 'data:text/javascript,' + encodeURIComponent(code);
const load = async (p) => import(asUrl(await text(p)));

const kitsUrl = asUrl(await text('src/data/pathKits.js'));
const personaUrl = asUrl(await text('src/logic/derivePersona.js'));
const K = await import(kitsUrl);
const P = await import(personaUrl);
const T = await import(asUrl((await text('src/logic/tailoring.js'))
  .replace("'../data/pathKits'", `"${kitsUrl}"`)
  .replace("'./derivePersona'", `"${personaUrl}"`)));
const W = await load('src/logic/welcomeCards.js');
const { WIDGET_KEYS, PLANNED_WIDGET_KEYS } = await load('src/data/dashboardWidgets.js');
const { BUILD_KINDS } = await load('src/data/builds.js');
const { FEATURES } = await load('src/data/featureCatalog.js');
const { PERSONA_KEYS } = await load('src/data/personas.js');
const { SURFACE_IDS } = await load('src/logic/guide/surfaces.js');

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const show = (x) => JSON.stringify(x);

// ── pathKits names real things ─────────────────────────────────────────────
const widgets = new Set([...WIDGET_KEYS, ...PLANNED_WIDGET_KEYS]);
const kinds = new Set([...BUILD_KINDS.map(k => k.id), ...K.PLANNED_BUILD_KINDS]);
const fabSrc = await text('src/components/FloatingActionButton.js');
const fabBody = fabSrc.slice(fabSrc.indexOf('ACTIONS = ['), fabSrc.indexOf('];', fabSrc.indexOf('ACTIONS = [')));
const fab = new Set([...fabBody.matchAll(/key:\s*'([a-z]+)'/g)].map(m => m[1]));
const place = Object.fromEntries(FEATURES.map(f => [f.id, f.place]));
const surfaces = new Set(SURFACE_IDS);
check('FloatingActionButton ACTIONS readable', fab.size >= 5, [...fab].join());
check('planned Build kinds are not built yet', K.PLANNED_BUILD_KINDS.every(k => !BUILD_KINDS.some(b => b.id === k)),
  'move a kind out of PLANNED_BUILD_KINDS once builds.js has it');

for (const [key, kit] of Object.entries(K.PATH_KITS)) {
  const where = `pathKits.${key}`;
  check(`${where} has a label and icon`, !!kit.label && !!kit.icon);
  check(`${where} has at most ${K.MAX_PATH_WIDGETS} widgets`, kit.widgets.length <= K.MAX_PATH_WIDGETS, show(kit.widgets));
  kit.widgets.forEach(w => check(`${where} widget '${w}' exists or is planned`, widgets.has(w)));
  kit.widgets.forEach(w => check(`${where} widget '${w}' isn't a core widget`, !K.CORE_TODAY.includes(w)));
  kit.calmTiles.forEach(w => check(`${where} Calm tile '${w}' exists or is planned`, widgets.has(w)));
  kit.learnShelves.forEach(s => check(`${where} Learn shelf '${s}' is in LEARN_SHELVES`, Object.hasOwn(K.LEARN_SHELVES, s)));
  kit.makeKinds.forEach(k => check(`${where} Make kind '${k}' is a Studio kind`, kinds.has(k)));
  kit.fabFirst.forEach(a => check(`${where} + action '${a}' is in FloatingActionButton ACTIONS`, fab.has(a)));
  kit.tools.forEach(t => check(`${where} tool '${t}' is a catalog feature that isn't off`, place[t] && place[t] !== 'off', `place ${place[t]}`));
  kit.notes.forEach(n => check(`${where} note surface '${n}' exists`, surfaces.has(n)));
}
K.CORE_TODAY.forEach(w => check(`core Today widget '${w}' exists or is planned`, widgets.has(w)));
check('DEFAULT_PATH is a path', Object.hasOwn(K.PATH_KITS, K.DEFAULT_PATH));
check('every starting point has a kit', K.START_POINTS.every(s => K.START_POINT_KITS[s.key]?.say));
for (const s of K.START_POINTS) {
  for (const c of K.SHAKIEST) {
    const p = K.SUGGESTED_PATH[s.key]?.[c.key];
    check(`SUGGESTED_PATH covers ${s.key} × ${c.key}`, Object.hasOwn(K.PATH_KITS, p) && p !== 'ground', show(p));
  }
}

// ── §8.1, cell by cell (the plan's table, pinned) ─────────────────────────
// Rows: start point. Columns: love/not sure · good at · world needs · paid · ground.
const TABLE = {
  highSchool: ['like', 'next', 'like', 'money', 'ground>like'],
  working:    ['like', 'career', 'like', 'money', 'ground>career'],
  ged:        ['next+ged', 'next+ged', 'next+ged', 'money', 'ground>next+ged'],
  unsure:     ['like', 'like', 'like', 'money', 'ground>like'],
};
const COLS = ['love', 'goodAt', 'needs', 'paid', 'ground'];
for (const [start, row] of Object.entries(TABLE)) {
  row.forEach((want, i) => {
    const t = T.tailor({ startPoint: start, shakiest: COLS[i] });
    const got = `${t.then ? `ground>${t.then}` : t.pathKey}${t.overlay ? `+${t.overlay}` : ''}`;
    check(`§8.1 ${start} × ${COLS[i]}`, got === want, `got ${got}, want ${want}`);
  });
}

// ── tailor() ───────────────────────────────────────────────────────────────
{
  const t = T.tailor({ startPoint: 'working', shakiest: 'paid' });
  check('Today starts with the core widgets', show(t.todayWidgets.slice(0, 3)) === show(K.CORE_TODAY), show(t.todayWidgets));
  check('money path widgets follow the core', show(t.todayWidgets) === show(['nextStep', 'yourDay', 'find', 'deliverable', 'money', 'dueSoon', 'stillOpen']), show(t.todayWidgets));
  check('fab, kinds and tools come from the kit', show(t.fabFirst) === show(['next', 'calendar', 'reminder'])
    && show(t.makeKinds) === show(['money', 'business']) && t.tools.includes('debt-credit'));
  check('a working start gets Work Mode in ⋯', t.start.workMode === true);
}
for (const start of Object.keys(TABLE)) {
  for (const s of COLS) {
    for (const roomPlace of ['you', 'today', 'off', undefined]) {
      const t = T.tailor({ startPoint: start, shakiest: s, roomPlace });
      const w = t.todayWidgets;
      if (new Set(w).size !== w.length || w.length > K.CORE_TODAY.length + K.MAX_PATH_WIDGETS) {
        problems.push(`tailor ${start}/${s}/${roomPlace}: Today widgets ${show(w)}`);
      } else passed++;
      check(`tailor ${start}/${s}/${roomPlace}: room only when placed on Today`, w.includes('room') === (roomPlace === 'today' && t.pathKey === 'like'), show(w));
      check(`tailor ${start}/${s}: persona exists`, PERSONA_KEYS.includes(t.persona), t.persona);
    }
  }
}
{
  const chosen = T.tailor({ startPoint: 'highSchool', shakiest: 'love', pathKey: 'money' });
  check('a chosen path beats the suggestion', chosen.pathKey === 'money' && chosen.suggested.pathKey === 'like');
  check('an unknown path falls back to the suggestion', T.tailor({ startPoint: 'working', shakiest: 'goodAt', pathKey: 'astronaut' }).pathKey === 'career');
  check('an unknown start counts as not sure', T.tailor({ startPoint: '17', shakiest: 'goodAt' }).startPoint === 'unsure');
  check('no answers at all → What do I like?', T.tailor().pathKey === K.DEFAULT_PATH);
  check('a chosen Ground fix still knows what comes after', T.tailor({ startPoint: 'working', shakiest: 'love', pathKey: 'ground' }).then === 'like');
  check('high school puts Classes first in Learn', T.tailor({ startPoint: 'highSchool', shakiest: 'goodAt' }).learnShelves[0] === 'classes');
  check('GED asks which state', T.tailor({ startPoint: 'ged', shakiest: 'love' }).start.asksState === true);
  check('GED overlay only on What\'s next', T.tailor({ startPoint: 'ged', shakiest: 'paid' }).overlay === null);
  const kit = K.PATH_KITS.money;
  T.tailor({ startPoint: 'working', shakiest: 'paid' }).todayWidgets.push('x');
  check('tailor() hands out copies, not the kit', !kit.widgets.includes('x'));
}
// Minors: unknown age counts as under 18 for content; links are 18+.
check('a guest (age unknown) is treated as under 18', T.tailor({}).minor === true && T.tailor({}).canShareLinks === false);
check('an under-18 account gets export only', T.tailor({ isMinor: true }).canShareLinks === false);
check('an adult can make share links', T.tailor({ isMinor: false }).canShareLinks === true);

// ── derivePersona (§7.2) ───────────────────────────────────────────────────
for (const [ctx, want] of [
  [{ startPoint: 'highSchool' }, 'STUDENT'],
  [{ startPoint: 'ged' }, 'STUDENT'],
  [{ startPoint: 'working' }, 'PERSONAL'],
  [{ startPoint: 'unsure' }, 'PERSONAL'],
  [{ startPoint: 'working', buildKind: 'business' }, 'ENTREPRENEUR'],
  [{ startPoint: 'highSchool', buildKind: 'page' }, 'STUDENT'],
  [{}, 'PERSONAL'],
  [undefined, 'PERSONAL'],
]) {
  const got = P.derivePersona(ctx);
  check(`derivePersona ${show(ctx)}`, got === want && PERSONA_KEYS.includes(got), `got ${got}, want ${want}`);
}

// ── welcomeCards (§7.2) ────────────────────────────────────────────────────
check('welcome cards in order', W.WELCOME_CARDS.join() === 'ikigai,ground,notBehind,startPoint,shakiest,suggest,firstPage,keep', W.WELCOME_CARDS.join());
check('the welcome never asks for age', !W.WELCOME_CARDS.some(c => /^(age|birth|dob)|Age|Birth|Dob/.test(c)));
check('welcome key', W.WELCOME_KEY === '@cth_welcome_v1');
{
  const n = W.normalizeWelcome({ startPoint: 'working', shakiest: 'ground', pathKey: 'ground', firstName: '  Sam  ', guest: true, done: 'yes', age: 15, birthDate: '2011-01-01', dob: 'x', email: 'a@b.c' });
  check('stored answers drop anything age-like or unknown', !('age' in n) && !('birthDate' in n) && !('dob' in n) && !('email' in n), show(n));
  check('stored answers keep the answers', n.startPoint === 'working' && n.shakiest === 'ground' && n.pathKey === 'ground' && n.firstName === 'Sam', show(n));
  check('flags are true only when true', n.guest === true && n.done === false && n.unit1Done === false, show(n));
  check('garbage storage reads as empty answers', show(W.normalizeWelcome('nope')) === show(W.normalizeWelcome(null)) && W.normalizeWelcome(null).startPoint === null);
}
check('W4 needs a starting point', !W.canLeave('startPoint', {}) && W.canLeave('startPoint', { startPoint: 'ged' }));
check('W5 needs a shakiest circle', !W.canLeave('shakiest', { startPoint: 'ged' }) && W.canLeave('shakiest', { shakiest: 'paid' }));
check('W1 always lets you on', W.canLeave('ikigai', {}));
check('a fresh welcome starts at the top', W.resumeAt({}) === 0);
check('a half-done welcome resumes at the first open question', W.WELCOME_CARDS[W.resumeAt({ startPoint: 'working' })] === 'shakiest');
check('a finished welcome resumes at the end', W.WELCOME_CARDS[W.resumeAt({ startPoint: 'w', shakiest: 's', pathKey: 'p', unit1Done: true })] === 'keep');

// Boot (§7.2): signed-in people never see the welcome.
const boot = (ctx) => { const b = W.bootTarget(ctx); return `${b.route}${b.guest ? ' guest' : ''}${b.pickPathNote ? ' +pickPath' : ''}`; };
for (const [name, ctx, want] of [
  ['session, onboarded', { hasSession: true, onboardingCompleted: true, hasPathKey: true }, 'MainTabs'],
  ['session, onboarded, no path yet', { hasSession: true, onboardingCompleted: true, hasPathKey: false }, 'MainTabs +pickPath'],
  ['session, not onboarded', { hasSession: true, onboardingCompleted: false }, 'MultiStepOnboarding'],
  ['session, onboarding unknown', { hasSession: true }, 'MultiStepOnboarding'],
  ['session ignores a stale welcome', { hasSession: true, onboardingCompleted: true, hasPathKey: true, welcome: { done: false } }, 'MainTabs'],
  ['signed out, welcome not done', { hasSession: false, welcome: { startPoint: 'working' } }, 'Welcome'],
  ['signed out, first launch', { hasSession: false }, 'Welcome'],
  ['signed out, kept going as a guest', { hasSession: false, welcome: { done: true, guest: true } }, 'MainTabs guest'],
  ['signed out, welcome done, not a guest', { hasSession: false, welcome: { done: true } }, 'Login'],
  ['WELCOME_V1 off', { hasSession: false, welcomeOn: false, welcome: { done: true, guest: true } }, 'Login'],
  ['WELCOME_V1 off, first launch', { hasSession: false, welcomeOn: false }, 'Login'],
  ['slow start, guest', { timedOut: true, welcome: { done: true, guest: true } }, 'MainTabs guest'],
  ['slow start, not a guest', { timedOut: true, welcome: { done: true } }, 'Login'],
  ['slow start, half-done welcome', { timedOut: true, welcome: { startPoint: 'ged' } }, 'Login'],
]) check(`boot: ${name}`, boot(ctx) === want, `got ${boot(ctx)}, want ${want}`);

if (problems.length) {
  console.error(`check-tailoring: ${problems.length} problem(s)`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-tailoring: ${passed} checks passed (${Object.keys(K.PATH_KITS).length} paths × ${K.START_POINTS.length} starting points, welcome + boot).`);
