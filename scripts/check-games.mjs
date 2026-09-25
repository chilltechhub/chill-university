// scripts/check-games.mjs
//
// Checks that the training games can't be won by a trick instead of by
// knowing the material:
//
//   Budget Balance   every scenario is solvable, "cut everything that
//                    isn't a need" loses, and keeping it all is over budget.
//
// Run: node scripts/check-games.mjs          (or `npm run check`)

import { readFile } from 'node:fs/promises';

// Content files have no imports, so they load as data: URLs (no module-type
// warning, no package.json change).
async function load(rel) {
  const src = await readFile(new URL('../' + rel, import.meta.url), 'utf8');
  return import('data:text/javascript,' + encodeURIComponent(src));
}

const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const notes = [];

// ── Budget Balance ────────────────────────────────────────────────────────
{
  const { BUDGET_BANK, gradePlan } = await load('src/data/gameContent/budgetBalance.js');
  let scenarios = 0;
  for (const [band, list] of Object.entries(BUDGET_BANK)) {
    for (const sc of list) {
      scenarios++;
      const where = `budgetBalance ${band} "${sc.title}"`;
      const ex = sc.expenses;
      if (!ex.some(e => e.need) || !ex.some(e => !e.need)) { bad(where, 'needs both needs and wants'); continue; }
      if (ex.some(e => e.need && !e.why)) bad(where, 'every need needs a `why` (shown when it gets cut)');
      if (ex.some(e => e.swap && e.swap.cost >= e.cost)) bad(where, 'a swap has to be cheaper than the item');

      // Every combination of keep / swap / cut.
      const opts = ex.map(e => (e.swap ? ['keep', 'swap', 'cut'] : ['keep', 'cut']));
      let wins = 0;
      const walk = (i, choice) => {
        if (i === ex.length) { if (gradePlan(sc, choice).ok) wins++; return; }
        for (const o of opts[i]) walk(i + 1, [...choice, o]);
      };
      walk(0, []);
      if (!wins) bad(where, 'no plan wins');

      const keepAll = gradePlan(sc, ex.map(() => 'keep'));
      if (keepAll.overBy === 0) bad(where, 'keeping everything already fits: nothing to decide');
      const cutWants = gradePlan(sc, ex.map(e => (e.need ? 'keep' : 'cut')));
      if (cutWants.ok) bad(where, 'cutting every want wins: the answer is "cut anything fun"');
      const cutWantsSwapNeeds = gradePlan(sc, ex.map(e => (e.need ? (e.swap ? 'swap' : 'keep') : 'cut')));
      if (cutWantsSwapNeeds.ok) bad(where, 'cutting every want (with needs swapped down) wins');
    }
  }
  notes.push(`Budget Balance: ${scenarios} scenarios`);
}

// ── Budget Trail ──────────────────────────────────────────────────────────
// Plays each journey with fixed strategies, mirroring BudgetTrailGame's
// round resolution, and checks that only the thoughtful one works.
{
  const { TRAIL_BANK } = await load('src/data/gameContent/budgetTrail.js');
  const RUNS = 4000;
  // Seeded so the check gives the same answer every time.
  let seed = 12345;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

  const play = (j, pick) => {
    let cash = j.startingBalance, savings = 0, bonus = 0, due = 0;
    for (const round of j.rounds) {
      const ev = j.eventPool[Math.floor(rand() * j.eventPool.length)];
      cash += round.income + bonus + ev.delta - due;
      const buy = round.optional.map(pick);
      const req = round.required.reduce((a, r) => a + r.cost, 0);
      const opt = round.optional.reduce((a, o, i) => a + (buy[i] ? o.cost : 0), 0);
      const tiers = pick.save === false ? [0] : j.saveTiers;
      const save = [...tiers].reverse().find(t => req + opt + t <= cash) ?? 0;
      const out = req + opt + save;
      if (cash >= out) { cash -= out; savings += save; }
      else {
        const short = out - cash; // save is 0 here
        if (savings >= short) { savings -= short; cash = 0; } else return { broke: true, savings };
      }
      bonus += round.optional.reduce((a, o, i) => a + (buy[i] && o.payback ? o.payback : 0), 0);
      due = round.optional.reduce((a, o, i) => a + (!buy[i] && o.skipCost ? o.skipCost.cost : 0), 0);
    }
    return { broke: false, savings };
  };
  const smart = o => !!(o.payback || o.skipCost);
  const strategies = {
    everything: Object.assign(() => true, {}),
    nothing: Object.assign(() => false, {}),
    smart: Object.assign(smart, {}),
    spendAll: Object.assign(() => true, { save: false }),
  };
  const rows = [];
  for (const [band, j] of Object.entries(TRAIL_BANK)) {
    const where = `budgetTrail ${band}`;
    if (!j.rounds.some(r => r.optional.some(o => o.payback))) bad(where, 'needs at least one payback item');
    j.rounds.at(-1).optional.forEach(o => { if (o.payback || o.skipCost) bad(where, `"${o.label}" pays off after the last round, so it never matters`); });
    const rate = {};
    for (const [name, pick] of Object.entries(strategies)) {
      let goal = 0, broke = 0;
      for (let i = 0; i < RUNS; i++) {
        const r = play(j, pick);
        if (r.broke) broke++; else if (r.savings >= j.savingsGoal) goal++;
      }
      rate[name] = { goal: goal / RUNS, broke: broke / RUNS };
    }
    rows.push(`${band} goal%: smart ${Math.round(rate.smart.goal * 100)}, nothing ${Math.round(rate.nothing.goal * 100)}, everything ${Math.round(rate.everything.goal * 100)}, spendAll broke ${Math.round(rate.spendAll.broke * 100)}`);
    if (rate.smart.goal < 0.75) bad(where, `the thoughtful plan only reaches the goal ${Math.round(rate.smart.goal * 100)}% of the time`);
    if (rate.smart.broke > 0) bad(where, 'the thoughtful plan can go broke');
    if (rate.nothing.goal > 0.35) bad(where, `buying nothing reaches the goal ${Math.round(rate.nothing.goal * 100)}% of the time`);
    if (rate.everything.goal > 0.2) bad(where, `buying everything reaches the goal ${Math.round(rate.everything.goal * 100)}% of the time`);
  }
  if (process.argv.includes('-v')) rows.forEach(r => console.log('  ' + r));
  notes.push(`Budget Trail: ${Object.keys(TRAIL_BANK).length} journeys simulated`);
}

// ── Survive the Month / Shift Manager ─────────────────────────────────────
// Card games: the good option must not be predictable from how it looks
// (always the cheapest, always the longest), and playing every good option
// must never end a week.
{
  const games = [
    { name: 'surviveMonth', file: 'src/data/gameContent/surviveMonth.js', bank: 'SURVIVE_BANK', money: 'cash', meter: 'stress', start: 'startingCash', startMeter: 'startingStress' },
    { name: 'shiftManager', file: 'src/data/gameContent/shiftManager.js', bank: 'SHIFT_BANK', money: 'till', meter: 'risk', start: 'startingTill', startMeter: 'startingRisk' },
  ];
  for (const g of games) {
    const bank = (await load(g.file))[g.bank];
    let cards = 0, cheapest = 0, longest = 0;
    for (const [band, b] of Object.entries(bank)) {
      const where = `${g.name} ${band}`;
      if (b.cardPool.length < 6) bad(where, 'needs at least 6 cards (a week can deal 6)');
      for (const card of b.cardPool) {
        cards++;
        const goods = card.options.filter(o => o.good);
        if (!goods.length || goods.length === card.options.length) { bad(`${where} ${card.id}`, 'needs at least one good and one bad option'); continue; }
        const maxMoney = Math.max(...card.options.map(o => o[g.money]));
        if (goods.some(o => o[g.money] === maxMoney)) cheapest++;
        const lens = card.options.map(o => o.label.length);
        const goodLen = Math.max(...goods.map(o => o.label.length));
        if (goodLen > Math.max(...card.options.filter(o => !o.good).map(o => o.label.length))) longest++;
        if (lens.some(l => l > 60)) bad(`${where} ${card.id}`, 'an option is over 60 characters; keep buttons short');
      }
      // Good-only play, many random decks and week lengths 4-6.
      for (let run = 0; run < 400; run++) {
        const days = 4 + (run % 3);
        const deck = [...b.cardPool].sort(() => Math.random() - 0.5).slice(0, days);
        let money = b[g.start], meter = b[g.startMeter];
        for (let d = 0; d < deck.length; d++) {
          if (d > 0) money += b.incomePerDay;
          const opt = deck[d].options.find(o => o.good);
          money += opt[g.money]; meter += opt[g.meter];
          if (money <= 0) { bad(where, `playing only good options can hit $0 (${deck.map(c => c.id).join(', ')})`); run = 1e9; break; }
          if (meter >= 100) { bad(where, `playing only good options can max out ${g.meter}`); run = 1e9; break; }
        }
      }
    }
    const pctCheap = Math.round(100 * cheapest / cards), pctLong = Math.round(100 * longest / cards);
    if (pctCheap > 60) bad(g.name, `the good option is also the cheapest on ${pctCheap}% of cards`);
    if (pctLong > 45) bad(g.name, `the good option is the longest on ${pctLong}% of cards`);
    notes.push(`${g.name}: ${cards} cards (good is cheapest ${pctCheap}%, longest ${pctLong}%)`);
  }
}

// ── Wild Survival ─────────────────────────────────────────────────────────
// One good option per round; the good path always finishes, always
// picking the worst option runs out of stamina, and the good option isn't
// spottable as the longest.
{
  const { SURVIVAL_BANK } = await load('src/data/gameContent/wildSurvival.js');
  let rounds = 0, longest = 0;
  for (const [band, j] of Object.entries(SURVIVAL_BANK)) {
    const where = `wildSurvival ${band}`;
    let good = j.startingStamina, worst = j.startingStamina, goodOk = true;
    for (const r of j.rounds) {
      rounds++;
      const goods = r.options.filter(o => o.good);
      if (goods.length !== 1) { bad(where, `"${r.story}" needs exactly one good option`); continue; }
      if (r.options.some(o => !o.why)) bad(where, `"${r.story}": every option needs a why`);
      good = Math.min(100, good + goods[0].delta);
      worst = Math.min(100, worst + Math.min(...r.options.map(o => o.delta)));
      if (good <= 0) goodOk = false;
      if (goods[0].delta < Math.max(...r.options.filter(o => !o.good).map(o => o.delta))) bad(where, `"${r.story}": a wrong option costs less stamina than the good one`);
      if (goods[0].label.length > Math.max(...r.options.filter(o => !o.good).map(o => o.label.length))) longest++;
    }
    if (!goodOk) bad(where, 'the good path runs out of stamina');
    if (worst > 0) bad(where, 'always picking the worst option still survives');
  }
  if (longest / rounds > 0.45) bad('wildSurvival', `the good option is the longest in ${longest} of ${rounds} rounds`);
  notes.push(`Wild Survival: ${rounds} rounds`);
}

// ── Recipe Builder ────────────────────────────────────────────────────────
// Every recipe can be finished in its written order, flexible steps point
// at a real step, and step text is unique (the screen keys on it).
{
  const { RECIPE_BANK, blockingStep } = await load('src/data/gameContent/recipeBuilder.js');
  let recipes = 0;
  for (const [band, list] of Object.entries(RECIPE_BANK)) {
    for (const r of list) {
      recipes++;
      const where = `recipeBuilder ${band} "${r.name}"`;
      if (new Set(r.steps.map(s => s.text)).size !== r.steps.length) bad(where, 'two steps have the same text');
      for (const s of r.steps) {
        if (s.before != null && !r.steps.some(o => o.order === s.before)) bad(where, `"${s.text}" is before step ${s.before}, which doesn't exist`);
      }
      const remaining = [...r.steps];
      for (const s of [...r.steps].sort((a, b) => a.order - b.order)) {
        const b = blockingStep(s, remaining);
        if (b) { bad(where, `the written order gets stuck: "${s.text}" waits on "${b.text}"`); break; }
        remaining.splice(remaining.indexOf(s), 1);
      }
    }
  }
  notes.push(`Recipe Builder: ${recipes} recipes`);
}

// ── Multiple-choice answer length ─────────────────────────────────────────
// Every multiple-choice question in the app (game banks, lesson quizzes,
// class practice, quests, competency checks): the right answer must not be
// spottable as "the long, careful-sounding one". Parsed as source with
// Babel so JSX screens that hold practice questions can be read too.
{
  const { default: fs } = await import('node:fs');
  const { default: path } = await import('node:path');
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const parser = require('@babel/parser');
  const root = new URL('..', import.meta.url);
  const rootPath = decodeURIComponent(root.pathname).replace(/^\/([A-Za-z]:)/, '$1');

  const files = [];
  const walkDir = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walkDir(p);
      else if (ent.name.endsWith('.js')) files.push(p);
    }
  };
  walkDir(path.join(rootPath, 'src/data'));
  walkDir(path.join(rootPath, 'src/screens/classes'));

  const str = n => n && (n.type === 'StringLiteral' ? n.value
    : n.type === 'TemplateLiteral' && n.expressions.length === 0 ? n.quasis[0].value.cooked : null);
  const prop = (obj, name) => obj.properties.find(p => p.type === 'ObjectProperty' && (p.key.name ?? p.key.value) === name);

  // A question is an object literal with options + a correct marker, or a
  // correct string + distractors (Tool Match).
  const readQuestion = (obj) => {
    const get = k => prop(obj, k)?.value;
    const optsN = get('options');
    const distr = get('distractors');
    const correctN = get('correct') ?? get('answer') ?? get('answerIndex') ?? get('benefit');
    let opts, idx;
    if (distr?.type === 'ArrayExpression' && str(correctN) != null) {
      opts = [str(correctN), ...distr.elements.map(str)];
      idx = 0;
    } else if (optsN?.type === 'ArrayExpression') {
      opts = optsN.elements.map(str);
      if (correctN?.type === 'NumericLiteral') idx = correctN.value;
      else if (str(correctN) != null) {
        idx = opts.indexOf(str(correctN));
        if (idx < 0 && !opts.some(o => o == null)) return { missing: str(correctN), line: obj.loc.start.line };
      }
      else return null;
      if (new Set(opts).size !== opts.length) return { duplicate: true, line: obj.loc.start.line };
    } else return null;
    if (opts.length < 3 || opts.some(o => o == null) || !(idx >= 0 && idx < opts.length)) return null;
    return { opts, idx, line: obj.loc.start.line };
  };

  let total = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (!/options|distractors/.test(src)) continue;
    let ast;
    try { ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] }); }
    catch (e) { bad(path.relative(rootPath, file), `could not parse: ${e.message}`); continue; }
    const qs = [];
    (function walk(n) {
      if (!n || typeof n.type !== 'string') return;
      if (n.type === 'ObjectExpression') { const q = readQuestion(n); if (q) qs.push(q); }
      for (const k in n) {
        if (k === 'loc') continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v);
      }
    })(ast.program);
    const rel = path.relative(rootPath, file).replace(/\\/g, '/');
    for (const q of qs.filter(q => q.missing)) bad(rel, `line ${q.line}: the answer "${q.missing}" is not one of the options`);
    for (const q of qs.filter(q => q.duplicate)) bad(rel, `line ${q.line}: two options are identical`);
    qs.splice(0, qs.length, ...qs.filter(q => q.opts));
    if (!qs.length) continue;
    total += qs.length;
    let longest = 0;
    const obvious = [];
    for (const { opts, idx, line } of qs) {
      const c = opts[idx].length;
      const next = Math.max(...opts.filter((_, i) => i !== idx).map(o => o.length));
      if (c > next) longest++;
      // Half again as long as every other option reads as "the real answer".
      if (c >= 1.5 * next && c - next >= 12) obvious.push(line);
    }
    // Random chance of being longest is 1 in 3 or 4; allow some slack, and
    // at least 2 in small files.
    const allowed = Math.max(2, Math.floor(qs.length * 0.4));
    if (longest > allowed) bad(rel, `right answer is the longest option in ${longest} of ${qs.length} questions (max ${allowed})`);
    if (obvious.length) bad(rel, `right answer is far longer than the rest at line${obvious.length > 1 ? 's' : ''} ${obvious.join(', ')}`);
  }
  notes.push(`${total} multiple-choice questions length-checked`);
}

if (problems.length) {
  console.error(`Games: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`Games OK: ${notes.join('; ')}.`);
