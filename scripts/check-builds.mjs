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
const pathDataUrl = asUrl(await src('src/data/softwarePath.js'));
const pathUrl = asUrl((await src('src/logic/softwarePath.js')).replace("'../data/softwarePath'", `"${pathDataUrl}"`));
const D = await import(dataUrl);
const PD = await import(pathDataUrl);
const P = await import(pathUrl);
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
  check('project: none to start', b.projectId === null);
  const grown = B.withProject(b, 'p1', T);
  check('project: kept through normalize', B.normalizeBuild(grown).projectId === 'p1');
  check('project: junk dropped', B.normalizeBuild({ ...b, projectId: 42 }).projectId === null);
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
  check('title: page', B.buildTitle(B.newBuild('page', { name: 'Sam' })) === "Sam's portfolio");
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
  const page = B.newBuild('page', { name: 'Sam' }, T);
  const html = R.renderBuild(page, me);
  check('me: page shows your pet, escaped', html.includes('with &lt;b&gt;Mochi&lt;/b&gt;'));
  check('me: dream block, escaped', html.includes('the &lt;farm&gt;') && html.includes('Becoming someone who finishes'));
  check('me: no dream, no dream block', !R.renderBuild(page).includes('Where I'));
}

// ── The portfolio's content (the Descartes builder) ─────────────────────
{
  const EV = '<img src=x onerror=alert(1)>';
  const raw = {
    bio: '  Builds   things  ', cta: EV, quote: '', email: 'sam@x.co', github: 'github.com/sam',
    skills: ['Web', 'Web', '', EV, ...Array.from({ length: 30 }, (_, i) => 's' + i)],
    projects: [{ title: 'Real thing', desc: 'Made it', tag: 'Web' }, { title: '', desc: '' }, ...Array.from({ length: 12 }, (_, i) => ({ title: 'p' + i }))],
    sections: { quote: false, junk: true },
    stage: { title: 'Student', sub: 'High School / Learner', desc: 'Learning by building.' },
  };
  const p = B.newBuild('page', { name: 'Sam', line: 'Student & Web Developer' }, T, raw);
  check('content: text squeezed', p.content.bio === 'Builds things', p.content.bio);
  check('content: skills unique, capped', p.content.skills[0] === 'Web' && p.content.skills.filter(s => s === 'Web').length === 1 && p.content.skills.length === B.PAGE_LIMITS.skills);
  check('content: empty project cards dropped, capped', p.content.projects.length === B.PAGE_LIMITS.projects && p.content.projects[0].title === 'Real thing');
  check('content: sections default on, junk dropped', p.content.sections.hero === true && p.content.sections.quote === false && !('junk' in p.content.sections));
  check('content: other kinds have none', B.newBuild('game', { name: 'G' }, T, raw).content === null);
  check('content: an old page gets the defaults', B.normalizeBuild({ kind: 'page', answers: { name: 'Sam' } }).content.sections.skills === true);
  const html = R.renderBuild(p);
  check('portfolio: hero, skills, projects, phase, contact', ['Personal Portfolio', 'Core expertise', 'Featured projects', 'Current phase', 'High School / Learner', 'mailto:sam@x.co'].every(s => html.includes(s)));
  check('portfolio: typed text escaped', !html.includes('<img src=x') && html.includes('&lt;img'));
  check('portfolio: a section switched off is gone', !html.includes('René Descartes'));
  check('portfolio: the quote shows when on', R.renderBuild(B.setContent(p, { sections: { ...p.content.sections, quote: true } }, T)).includes('René Descartes'));
  const bare = R.renderBuild(B.newBuild('page', { name: 'Sam' }, T));
  check('portfolio: empty sections never show', !bare.includes('Featured projects') && !bare.includes('Core expertise') && !bare.includes('Current phase') && !bare.includes('href="#projects"'));
  check('portfolio: hero off keeps the name', R.renderBuild(B.setContent(p, { sections: { ...p.content.sections, hero: false } }, T)).includes('<h1>Sam</h1>'));
  const edited = B.setContent(p, { skills: ['Design'] }, T);
  check('setContent: merges and cleans', edited.content.skills.join() === 'Design' && edited.content.bio === 'Builds things' && edited.updatedAt === T);
  const all = B.lookAtAll(p, T);
  check('lookAtAll: every everyday option open, no upgrades', D.BUILD_KIND_MAP.page.parts.every(pt => B.partLevel(all, pt.id) === B.LEVEL_YOURS) && B.pickOption(all, 'colors', 'neon', T).picks.colors === 'calm' && B.pickOption(all, 'colors', 'synth', T).picks.colors === 'synth');
  for (const layout of ['center', 'split', 'bento']) {
    const h = R.renderBuild(B.pickOption(B.answerCheck(p, 'layout', 0, T).build, 'layout', layout, T));
    check(`portfolio: ${layout} layout renders every section`, h.includes('Featured projects') && h.includes('Current phase'));
  }
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
  check(`grow: ${k.id} has a first real step`, typeof k.growNext === 'string' && k.growNext.length > 10);
  for (const ft of k.freeTools || []) check(`free: ${k.id}.${ft.name} is whole`, !!ft.name && !!ft.what && /^https:\/\//.test(ft.url));
}

// ── Software for You: teach, show, practise, do ─────────────────────────
{
  const M = PD.SOFTWARE_PATH.missions;
  check('path: four missions', M.length === 4);
  for (const m of M) {
    const at = `path ${m.id}`;
    check(`${at}: 2-3 teach cards`, m.teach.length >= 2 && m.teach.length <= 3);
    for (const card of m.teach) {
      const words = card.replace(/\*\*/g, '').split(/\s+/).length;
      check(`${at}: card under 40 words`, words <= 40, words);
      check(`${at}: card bolds one idea`, (card.match(/\*\*/g) || []).length >= 2);
    }
    check(`${at}: shows something`, !!(m.show.build || m.show.compare || m.show.own) && !!m.show.line);
    if (m.show.build) {
      check(`${at}: demo kind exists`, !!D.BUILD_KIND_MAP[m.show.build]);
      const html = R.renderBuild(B.newBuild(m.show.build, m.show.answers, T));
      check(`${at}: demo renders`, /^<!doctype html>/.test(html) && !/undefined/.test(html));
    }
    check(`${at}: 3-4 practice questions`, m.practice.length >= 3 && m.practice.length <= 4);
    for (const q of m.practice) {
      check(`${at}: answer in range`, Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
      check(`${at}: has a why`, !!q.why);
      const sh = P.shuffledOptions(q, m.id);
      check(`${at}: shuffle keeps every option and one right`, sh.length === q.options.length && sh.filter(o => o.right).length === 1 && sh.find(o => o.right).label === q.options[q.answer]);
      check(`${at}: shuffle is stable`, JSON.stringify(sh) === JSON.stringify(P.shuffledOptions(q, m.id)));
    }
    check(`${at}: a real step`, ['build', 'try', 'export'].includes(m.doIt.type) && !!m.doIt.label && !!m.doIt.how);
    if (m.doIt.type === 'build') check(`${at}: step kind exists`, !!D.BUILD_KIND_MAP[m.doIt.kind]);
  }
  check('path: answers aren\'t always first after shuffling', M.flatMap(m => m.practice.map(q => P.shuffledOptions(q, m.id).findIndex(o => o.right))).some(i => i > 0));

  // Done means practised AND really done. Seeing the cards isn't required.
  const what = PD.PATH_MISSION_MAP.what;
  let pr = P.emptyProgress();
  check('path: fresh is nothing done', P.pathSummary(pr, []).done === 0 && P.pathSummary(pr, []).next.id === 'what');
  pr = P.recordPractice(pr, 'what', 2);
  check('path: practised alone is not done', !P.missionState(what, pr, []).done);
  const page = B.newBuild('page', { name: 'Sam' }, T);
  check('path: practised + a page made = done', P.missionState(what, pr, [page]).done);
  check('path: newly done names it', P.newlyDone(P.emptyProgress(), pr, [page]).join() === 'what');
  check('path: best score kept', P.recordPractice(pr, 'what', 1).missions.what.score === 2);
  const free = PD.PATH_MISSION_MAP.free;
  check('path: try step needs a try', !P.stepDone(free, pr, []) && P.stepDone(free, P.markTried(pr, 'free', 'fs1'), []));
  check('path: export step', !P.stepDone(PD.PATH_MISSION_MAP.own, pr, []) && P.stepDone(PD.PATH_MISSION_MAP.own, P.markExported(pr), []));
  const junk = P.normalizeProgress({ missions: { what: { practiced: 1, score: 99 }, nope: { practiced: true } }, exported: 'yes' });
  check('path: normalize clamps and drops unknowns', junk.missions.what.score === what.practice.length && !junk.missions.nope && junk.exported === true, junk);
  check('path: normalize junk', JSON.stringify(P.normalizeProgress('x')) === JSON.stringify(P.emptyProgress()));
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

// ── Your work, to share (shake-up P8) ──────────────────────────────────
{
  const bad = '<script>alert(1)</script>';
  const item = {
    title: `My plan ${bad}`, unit: 'Pick a path', path: 'What do I like?', status: 'Handed in', at: T, kind: 'reflection',
    answers: [{ q: 'Why this one', a: `Because ${bad}` }], checklist: [], build: null,
    feedback: [{ who: 'My aunt', said: `Nice ${bad}`, change: 'Shorter', changed: true }],
  };
  const page = R.renderShowcase({ name: 'Sam', items: [item], receipts: [{ value: 2, label: 'handed in' }] });
  check('showcase: a whole page', /^<!doctype html>/.test(page) && /<\/html>\s*$/.test(page));
  check('showcase: what they typed is escaped', !page.includes('<script>alert(1)'));
  check('showcase: no level, XP, points or streak', !/(level|xp|points?|streak|rank)/i.test(page.replace(/<style>[\s\S]*?<\/style>/, '')));
  check('showcase: feedback notes stay private by default', !page.includes('My aunt'));
  check('showcase: feedback notes when asked', R.renderShowcase({ items: [item], feedback: true }).includes('My aunt'));
  check('showcase: loads nothing from the network', !/src=["']https?:/i.test(page) && !/<link/i.test(page) && !/@import|url\(http/i.test(page));
  check('showcase: empty says so', R.renderShowcase({}).includes('Nothing handed in yet'));
  const one = R.renderDeliverable(item);
  check('one piece of work: a whole page, escaped, private notes', /^<!doctype html>/.test(one) && !one.includes('<script>alert(1)') && !one.includes('My aunt'));
  const card = R.renderPictureCard({ title: `A very long title that wraps ${bad} onto lines`, line: `Handed in ${bad}` });
  check('picture card: an SVG image', /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(card) && /<\/svg>\s*$/.test(card));
  check('picture card: escaped, no script', !/<script/i.test(card));
  check('picture card: at most four title lines', (card.match(/<tspan /g) || []).length <= 4);
  check('picture card: a bad colour falls back', !R.renderPictureCard({ accent: 'red;" onload="x' }).includes('onload'));
}

if (problems.length) {
  console.error(`check-builds: ${problems.length} of ${count} failed`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`check-builds: ${count} checks passed.`);
