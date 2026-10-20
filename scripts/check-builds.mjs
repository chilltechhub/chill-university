// scripts/check-builds.mjs
// The Studio's rules (src/logic/builds.js) and its renderer
// (src/logic/buildRender.js): unlocks open in order and never for free,
// the receipt is honest, every kind × option renders a whole page with
// what they typed escaped, and every script inside a made thing parses.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const src = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const asUrl = (code) => 'data:text/javascript,' + encodeURIComponent(code);

const dataUrl = asUrl(await src('src/data/builds.js'));
const logicUrl = asUrl((await src('src/logic/builds.js')).replace("'../data/builds'", `"${dataUrl}"`));
const renderUrl = asUrl((await src('src/logic/buildRender.js')).replace("'./builds'", `"${logicUrl}"`));
const studioUrl = asUrl((await src('src/logic/studio.js')).replace("'../data/builds'", `"${dataUrl}"`).replace("'./builds'", `"${logicUrl}"`));
const D = await import(dataUrl);
const B = await import(logicUrl);
const R = await import(renderUrl);
const S = await import(studioUrl);

const problems = [];
let count = 0;
const check = (name, ok, detail) => { count += 1; if (!ok) problems.push(`${name}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`); };
const T = '2026-10-20T10:00:00.000Z';

// ── The content itself ──────────────────────────────────────────────────
for (const kind of D.BUILD_KINDS) {
  const where = `kind ${kind.id}`;
  check(`${where}: has a renderer`, R.RENDERED_KINDS.includes(kind.id));
  check(`${where}: asks something`, kind.asks.length > 0);
  check(`${where}: 3-5 parts`, kind.parts.length >= 3 && kind.parts.length <= 5, kind.parts.length);
  for (const part of kind.parts) {
    const at = `${where}.${part.id}`;
    const start = part.options.find(o => o.id === part.start);
    check(`${at}: start option exists`, !!start);
    check(`${at}: start option is level 1`, start?.level === 1);
    check(`${at}: has another level-1 option`, part.options.filter(o => o.level === 1).length >= 2);
    check(`${at}: has an upgrade`, part.options.some(o => o.level === 2));
    check(`${at}: option ids unique`, new Set(part.options.map(o => o.id)).size === part.options.length);
    const words = part.lesson.says.replace(/\*\*/g, '').split(/\s+/).length;
    check(`${at}: lesson under 40 words`, words <= 40, words);
    check(`${at}: lesson bolds one idea`, (part.lesson.says.match(/\*\*/g) || []).length >= 2);
    const c = part.lesson.check;
    check(`${at}: check answer in range`, Number.isInteger(c.answer) && c.answer >= 0 && c.answer < c.options.length);
  }
}

// ── Unlock rules ────────────────────────────────────────────────────────
{
  const b = B.newBuild('page', { name: '  Sam  ', line: 'Fixing   bikes' }, T);
  check('new: answers squeezed', b.answers.name === 'Sam' && b.answers.line === 'Fixing bikes', b.answers);
  check('new: every part made for you', Object.values(b.levels).every(l => l === B.LEVEL_MADE));
  check('new: app picks the start options', b.picks.colors === 'calm' && b.picks.layout === 'center');
  check('new: unknown kind is null', B.newBuild('nope', {}) === null);

  check('locked: can\'t pick before looking', B.pickOption(b, 'colors', 'night', T) === b);
  const looked = B.lookAtPart(b, 'colors', T);
  check('look: part becomes yours', B.partLevel(looked, 'colors') === B.LEVEL_YOURS);
  check('look: other parts unchanged', B.partLevel(looked, 'layout') === B.LEVEL_MADE);
  const night = B.pickOption(looked, 'colors', 'night', T);
  check('yours: everyday option opens', night.picks.colors === 'night');
  check('yours: upgrade still shut', B.pickOption(night, 'colors', 'neon', T).picks.colors === 'night');

  const wrong = B.answerCheck(night, 'colors', 0, T);
  check('check: wrong answer changes nothing', !wrong.right && wrong.build === night);
  const right = B.answerCheck(night, 'colors', 1, T);
  check('check: right answer masters', right.right && B.partLevel(right.build, 'colors') === B.LEVEL_MASTERED);
  check('mastered: upgrade opens', B.pickOption(right.build, 'colors', 'neon', T).picks.colors === 'neon');
  check('check: mastering without looking still works', B.partLevel(B.answerCheck(b, 'layout', 0, T).build, 'layout') === B.LEVEL_MASTERED);

  const forged = B.normalizeBuild({ ...b, picks: { ...b.picks, colors: 'neon' } });
  check('normalize: an upgrade above their level goes back to the start', forged.picks.colors === 'calm');
  const junk = B.normalizeBuild({ ...b, levels: { colors: 9, layout: -3, type: 'x' } });
  check('normalize: levels clamp', junk.levels.colors === 2 && junk.levels.layout === 0 && junk.levels.type === 0, junk.levels);
  check('normalize: junk is null', B.normalizeBuild('nope') === null && B.normalizeBuild(null) === null);
}

// ── Receipt ─────────────────────────────────────────────────────────────
{
  let b = B.newBuild('beat', { name: 'Late Bus' }, T);
  check('receipt: fresh', JSON.stringify(B.receipt(b)) === JSON.stringify({ total: 4, looked: 0, mastered: 0, changed: 0 }), B.receipt(b));
  check('receipt line: fresh says the app made it', /app made this/.test(B.receiptLine(b)));
  check('next: first unopened part', B.nextPart(b)?.id === 'tempo');
  b = B.pickOption(B.lookAtPart(b, 'tempo', T), 'tempo', 'dance', T);
  check('receipt: counts a change', B.receipt(b).changed === 1 && B.receipt(b).looked === 1);
  check('receipt line: names the change', /1 of 4/.test(B.receiptLine(b)), B.receiptLine(b));
  b = B.pickOption(b, 'tempo', 'mid', T);
  check('receipt: picking the start again isn\'t a change', B.receipt(b).changed === 0);
  for (const p of D.BUILD_KIND_MAP.beat.parts) b = B.answerCheck(b, p.id, p.lesson.check.answer, T).build;
  check('mastered: all parts', B.isMastered(b) && B.nextPart(b) === null);
  check('receipt line: mastered', /You built this/.test(B.receiptLine(b)));
}

// ── Names and files ─────────────────────────────────────────────────────
{
  check('title: page', B.buildTitle(B.newBuild('page', { name: 'Sam' })) === "Sam's page");
  check('title: business', B.buildTitle(B.newBuild('business', { idea: 'Bike repairs', who: 'students' })) === 'Bike repairs');
  check('file: slug', B.buildFilename(B.newBuild('game', { name: 'Snack Attack!!' })) === 'snack-attack.html');
  check('file: empty name still a file', B.buildFilename(B.newBuild('game', {})) === 'a-game.html');
  check('missing: lists empty asks', B.missingAsks('business', { idea: 'x' }).join() === 'who');
}

// ── Your pet, your sparks, your trophies (src/logic/studio.js) ─────────
{
  check('pet: none is null', S.petLook(null) === null);
  const mochi = S.petLook({ id: 'mochi', name: 'Mochi' });
  check('pet: a cat looks like a cat', mochi.emoji === '🐱' && mochi.treat === '🐟', mochi);
  check('pet: nickname wins', S.petLook({ id: 'dog', name: 'Dog' }, 'Biscuit').name === 'Biscuit');
  check('pet: robots are robots', S.petLook({ id: 'gorillaunit', name: 'Gorilla Unit' }).emoji === '🤖');
  check('pet: unknown gets a paw', S.petLook({ id: 'xyz', name: 'Blob' }).emoji === '🐾');

  check('sparks: none yet', S.sparks([]).length === 0 && /Make one thing/.test(S.sparkLine([])));
  const master = (b) => { for (const p of B.kindOf(b).parts) b = B.answerCheck(b, p.id, p.lesson.check.answer, T).build; return b; };
  const beat1 = master(B.newBuild('beat', { name: 'a' }, T));
  const beat2 = B.newBuild('beat', { name: 'b' }, T);
  const page = B.newBuild('page', { name: 'Sam' }, T);
  check('sparks: one medium says try another', /Try a different one/.test(S.sparkLine([beat2])), S.sparkLine([beat2]));
  check('sparks: too early to call a lean', S.leaningMedium([beat2, page]) === null);
  check('sparks: one Build, even mastered, is not a lean', S.leaningMedium([beat1]) === null && !/coming back/.test(S.sparkLine([beat1])));
  const list = S.sparks([beat1, beat2, page]);
  check('sparks: ranked by doing', list[0].kind === 'beat' && list[0].builds === 2 && list[0].mastered === 1, list);
  check('sparks: a clear lean is named', S.leaningMedium([beat1, beat2, page])?.medium === 'Music');
  check('sparks: line names it', /coming back to \*\*Music/.test(S.sparkLine([beat1, beat2, page])), S.sparkLine([beat1, beat2, page]));

  check('trophy: none until mastered', S.trophyArts([beat2, page]).size === 0);
  check('trophy: mastered beat earns its trophy', S.trophyArts([beat1]).has('trophyBeat'));
  check('companion: same seed, same line', S.companionLine('fresh', 'x') === S.companionLine('fresh', 'x'));
  for (const k of D.BUILD_KINDS) check(`trophy: ${k.id} has one`, !!k.trophy?.art);
}

// ── Personalised: your pet stars, your Dream fills in ───────────────────
{
  const me = { pet: { name: '<b>Mochi</b>', emoji: '🐱', treat: '🐟' }, dream: { parts: [{ label: 'the <farm>' }], becoming: 'someone who finishes' } };
  const game = R.renderBuild(B.newBuild('game', { name: 'G' }, T), me);
  check('me: game starts with your pet', game.includes('"hero":"🐱"') && game.includes('"item":"🐟"'));
  check('me: no pet falls back', R.renderBuild(B.newBuild('game', { name: 'G' }, T)).includes('"hero":"🐱"'));
  let page = B.newBuild('page', { name: 'Sam' }, T);
  page = B.pickOption(B.lookAtPart(page, 'block', T), 'block', 'dream', T);
  const html = R.renderBuild(page, me);
  check('me: page shows your pet, escaped', html.includes('with &lt;b&gt;Mochi&lt;/b&gt;'));
  check('me: dream block, escaped', html.includes('the &lt;farm&gt;') && html.includes('Becoming someone who finishes'));
  check('me: dream block without a dream', R.renderBuild(page).includes('Something of my own'));
}

// ── The AI helper: free, honest, age-aware ──────────────────────────────
{
  let ai = B.newBuild('ai', { task: 'plan cheap dinners.', name: 'Dinner Buddy' }, T);
  const prompt = R.aiPrompt(ai);
  check('ai: prompt has role, task, tone, shape and honesty',
    /practical planner/.test(prompt) && /I want help with: plan cheap dinners\./.test(prompt) && /plain words/.test(prompt) && /numbered steps/.test(prompt) && /Never make things up/.test(prompt), prompt);
  check('ai: a change shows in the prompt', /patient tutor/.test(R.aiPrompt(B.pickOption(B.lookAtPart(ai, 'role', T), 'role', 'tutor', T))));
  const adult = R.renderBuild(ai, { adult: true });
  const minor = R.renderBuild(ai, { adult: false });
  check('ai: adults see free chats', adult.includes('https://chatgpt.com') && adult.includes('https://claude.ai'));
  check('ai: under-18s see no named service', !/chatgpt|claude\.ai|gemini/i.test(minor) && /age rules/.test(minor));
  check('ai: title', B.buildTitle(ai) === 'Dinner Buddy');
}

// ── Free tools: every kind has somewhere free to go next ────────────────
for (const k of D.BUILD_KINDS) {
  check(`free: ${k.id} has free tools`, Array.isArray(k.freeTools) && k.freeTools.length > 0);
  for (const ft of k.freeTools || []) check(`free: ${k.id}.${ft.name} is whole`, !!ft.name && !!ft.what && /^https:\/\//.test(ft.url));
}

// ── Every kind × option renders, escapes and parses ─────────────────────
const EVIL = '<script>alert(1)</script>"\'&';
function scriptsParse(html, where) {
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    try { new vm.Script(m[1]); } catch (e) { problems.push(`${where}: script does not parse: ${e.message}`); }
  }
}
for (const kind of D.BUILD_KINDS) {
  const answers = Object.fromEntries(kind.asks.map(a => [a.key, EVIL]));
  for (const part of kind.parts) {
    for (const option of part.options) {
      let b = B.newBuild(kind.id, answers, T);
      b = B.answerCheck(b, part.id, part.lesson.check.answer, T).build;
      b = B.pickOption(b, part.id, option.id, T);
      const where = `render ${kind.id}.${part.id}=${option.id}`;
      check(`${where}: picked`, b.picks[part.id] === option.id);
      const html = R.renderBuild(b);
      count += 1;
      if (!/^<!doctype html>/.test(html) || !/<\/html>\s*$/.test(html)) problems.push(`${where}: not a whole page`);
      check(`${where}: typed text escaped`, !html.includes('<script>alert(1)'));
      check(`${where}: no undefined`, !/undefined|NaN|\[object Object\]/.test(html));
      // Links out are fine (the AI helper names free chats); loading anything isn't.
      check(`${where}: loads nothing from the network`, !/\bsrc=["']https?:/i.test(html) && !/<link\b/i.test(html) && !/@import|url\(http/i.test(html));
      scriptsParse(html, where);
    }
  }
}

if (problems.length) {
  console.error(`check-builds: ${problems.length} of ${count} failed`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-builds: ${count} checks passed.`);
