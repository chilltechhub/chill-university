// scripts/check-ai-bridge.mjs
//
// Checks the "Fill with AI" reply reader (src/logic/aiBridgeParse.js) against
// the kinds of replies chatbots actually send: chat around the code block,
// smart quotes, trailing commas, comments, unquoted keys, a reply cut off
// part-way, questions instead of a block. And that edits and deletes only
// ever touch a row whose ref really matches.
//
// Also keeps PROJECT_TYPES in aiBridgeFormat.js in step with BUILD_TYPES in
// src/screens/library/projects.js, which can't be loaded outside the app.
//
// Run: node scripts/check-ai-bridge.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const text = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const asModule = (src) => 'data:text/javascript,' + encodeURIComponent(src);

// aiBridgeFormat.js has no imports; aiBridgeParse.js imports only it, so the
// specifier is pointed at the evaluated copy. Double quotes: encodeURIComponent
// leaves ' alone but escapes ".
const formatUrl = asModule(await text('src/logic/aiBridgeFormat.js'));
const F = await import(formatUrl);
const P = await import(asModule((await text('src/logic/aiBridgeParse.js')).replace("from './aiBridgeFormat'", `from "${formatUrl}"`)));

const problems = [];
let passed = 0;
function check(name, cond, detail = '') {
  if (cond) passed++;
  else problems.push(`${name}${detail ? ` — ${detail}` : ''}`);
}
const show = (x) => JSON.stringify(x, (k, v) => (typeof v === 'symbol' ? v.toString() : v));

// Monday, Sept 21 2026, local time.
const TODAY = new Date(2026, 8, 21);
const CATALOG = [
  { id: 'physical', label: 'Physical', sections: [
    { title: 'Fitness & Movement', screen: 'ExerciseScreen', items: ['Workouts'] },
    { title: 'Nutrition', screen: 'NutritionScreen', items: ['Hydration', 'Meal tracking'] },
    { title: 'Sleep & Recovery', screen: 'SleepRecoveryScreen', items: ['Sleep schedule'] },
  ] },
  { id: 'financial', label: 'Financial', sections: [
    { title: 'Budgeting', screen: 'BudgetingScreen', items: [] },
  ] },
];
const parse = (t, extra = {}) => P.parseReply(t, { today: TODAY, areaCatalog: CATALOG, ...extra });

// ── 1. A clean fenced reply, with chat around it ────────────────────────────
{
  const r = parse(`Here's your plan! It covers the build.

\`\`\`json
{"chill": 1, "projects": [{"title": "Build a gaming PC", "goal": "A working PC by December", "type": "Coding",
  "stage": "building", "next_step": "Set a budget", "tasks": ["Set a budget", "Pick parts"],
  "links": [{"title": "PCPartPicker", "url": "https://pcpartpicker.com"}]}]}
\`\`\`

Want me to add a timeline?`);
  check('clean: ok', r.ok, show(r));
  const p = r.changes?.[0];
  check('clean: one project create', r.changes?.length === 1 && p.op === 'create' && p.target === 'projects', show(r.changes));
  check('clean: fields', p?.fields.title === 'Build a gaming PC' && p.fields.type === 'Coding' && p.fields.stage === 'building' && p.fields.next_step === 'Set a budget', show(p?.fields));
  check('clean: children', p?.children.filter(c => c.kind === 'task').length === 2 && p.children.some(c => c.kind === 'link' && c.fields.url === 'https://pcpartpicker.com'), show(p?.children));
}

// ── 2. Messy JSON: smart quotes, trailing commas, comments, unquoted keys ───
{
  const r = parse(`Sure:
{
  chill: 1,
  // the new ideas
  ideas: [
    { “title”: “Sneaker reselling”, stage: 'seed', petals: ['Who buys?', { type: "todo", title: "Check StockX fees", }], },
    { title: "Tutoring app", "description": "Match students with tutors" /* no stage */ }
  ],
}`);
  check('messy: ok', r.ok, show(r));
  check('messy: two ideas', r.changes?.length === 2, show(r.changes));
  const a = r.changes?.[0];
  check('messy: smart quotes + synonyms', a?.fields.title === 'Sneaker reselling' && a.fields.stage === 'sprout', show(a?.fields));
  check('messy: petal synonym', a?.children[1]?.fields.type === 'task' && a.children[0].fields.title === 'Who buys?', show(a?.children));
}

// ── 3. Cut off part-way: finished items kept, cut ones dropped ──────────────
{
  const r = parse(`\`\`\`json
{"chill": 1, "vault": [
  {"kind": "note", "title": "Credit scores", "body": "Payment history matters most."},
  {"kind": "bookmark", "title": "Annual credit report", "url": "https://www.annualcreditreport.com"},
  {"kind": "note", "title": "Utilization", "body": "Keep it under 30 perc`);
  check('cut: ok', r.ok, show(r));
  check('cut: warned', r.warnings?.some(w => /cut off/i.test(w)), show(r.warnings));
  check('cut: kept the two finished items', r.changes?.length === 3 ? r.changes[2].fields.body === undefined : r.changes?.length === 2, show(r.changes));
}

// ── 4. No block at all ──────────────────────────────────────────────────────
{
  const q = parse('Before I plan this, what is your budget? And do you already have a monitor?');
  check('questions: detected', !q.ok && q.error === 'questions', show(q));
  const e = parse('   ');
  check('empty: detected', !e.ok && e.error === 'empty');
  const b = parse('```json\n{"chill": 1, "projects": [{"title": "x"}]\n```'.replace('}]', '}]]]]'));
  check('broken-ish still reads or fails cleanly', b.ok || b.error === 'broken' || b.error === 'nothing', show(b));
}

// ── 5. Planner: dates, times, repeats ───────────────────────────────────────
{
  const r = parse(`{"chill":1,"planner":[
    {"title":"Gym","date":"tomorrow","time":"7am","minutes":"45 min","area":"fitness","repeat":"weekly"},
    {"title":"Math test study","date":"next friday","time":"19:30","area":"school"},
    {"title":"Call grandma","date":"9/27"},
    {"title":"Dentist","date":"2026-09-30T14:15:00Z"},
    {"title":"No date"},
    {"title":"Bad date","date":"someday soon"}
  ]}`);
  const [gym, math, call, dentist, nodate, bad] = r.changes || [];
  check('planner: gym', gym?.fields.date === '2026-09-22' && gym.fields.time === '07:00' && gym.fields.minutes === 45 && gym.fields.area === 'physical' && gym.fields.repeat === 'weekly', show(gym?.fields));
  check('planner: next friday', math?.fields.date === '2026-09-25' && math.fields.area === 'professional', show(math?.fields));
  check('planner: US date', call?.fields.date === '2026-09-27', show(call?.fields));
  check('planner: ISO datetime', dentist?.fields.date === '2026-09-30' && dentist.fields.time === '14:15', show(dentist?.fields));
  check('planner: no date → today + warning', nodate?.fields.date === '2026-09-21' && nodate.warnings.length === 1, show(nodate));
  check('planner: bad date → today + warnings', bad?.fields.date === '2026-09-21' && bad.warnings.length === 2, show(bad));
  check('repeatDates weekly', show(F.repeatDates('2026-09-22', 'weekly')) === show(['2026-09-22', '2026-09-29', '2026-10-06', '2026-10-13']));
  check('repeatDates monthly clamps', show(F.repeatDates('2027-01-31', 'monthly')) === show(['2027-01-31', '2027-02-28', '2027-03-31']));
  const counts = P.countChanges(P.resolveChanges(r.changes, {}));
  check('countChanges expands repeats', counts.create === 4 + 5, show(counts));
}

// ── 6. Vault: kinds, links, safety ──────────────────────────────────────────
{
  const r = parse(`{"chill":1,"vault":[
    {"kind":"bookmark","title":"No link here"},
    {"kind":"tool","title":"Evil","url":"javascript:alert(1)"},
    {"url":"www.khanacademy.org/economics","tags":"#money, Learning"},
    {"body":"Line one of a long note\\nMore text"}
  ]}`);
  const [nolink, evil, bare, note] = r.changes || [];
  check('vault: bookmark without link → note', nolink?.fields.kind === 'note' && nolink.warnings.length === 1, show(nolink));
  check('vault: javascript: link dropped', evil && evil.fields.url === undefined && evil.warnings.length === 1, show(evil));
  check('vault: bare domain + tags', bare?.fields.url === 'https://www.khanacademy.org/economics' && bare.fields.kind === 'bookmark' && show(bare.fields.tags) === show(['money', 'learning']) && bare.fields.title === 'khanacademy.org', show(bare?.fields));
  check('vault: title from body', note?.fields.title === 'Line one of a long note', show(note?.fields));
}

// ── 7. Life areas: sections, flat actions, notes ────────────────────────────
{
  const r = parse(`{"chill":1,"life_areas":[
    {"area":"Physical","section":"sleep and recovery","actions":[{"title":"Phone away by 10pm","why":"Screens keep you up","type":"daily"}],"notes":["Tired most days"]},
    {"area":"physical","section":"Hydration","habits":["Drink a glass of water at breakfast"]},
    {"area":"financial","title":"Write down every purchase for a week","type":"once"},
    {"area":"underwater basket weaving","actions":["x"]},
    {"area":"physical","section":"Underwater stuff","actions":["Stretch for 2 minutes"]}
  ]}`);
  const acts = (r.changes || []).filter(c => c.kind === 'action');
  const notes = (r.changes || []).filter(c => c.kind === 'note');
  check('life: section match', acts[0]?.fields.screen === 'SleepRecoveryScreen' && acts[0].fields.type === 'habit', show(acts[0]));
  check('life: item → section', acts[1]?.fields.screen === 'NutritionScreen' && acts[1].fields.type === 'habit', show(acts[1]));
  check('life: flat action, default section', acts[2]?.fields.screen === 'BudgetingScreen' && acts[2].fields.type === 'step' && acts[2].warnings.length === 1, show(acts[2]));
  check('life: note keeps section', notes[0]?.fields.screen === 'SleepRecoveryScreen' && notes[0].fields.text === 'Tired most days', show(notes));
  check('life: unknown area skipped', r.warnings?.some(w => /area/.test(w)), show(r.warnings));
  check('life: unknown section named in the warning', acts[3]?.fields.screen === 'ExerciseScreen' && /Underwater stuff/.test(acts[3].warnings[0] || ''), show(acts[3]));
}

// ── 8. Portfolio + top-level array with a default target ───────────────────
{
  const r = parse('[{"section":"job","title":"Grocery store cashier","tag":["Customer service","Cash handling"]},{"title":"Video editing"}]', { defaultTarget: 'portfolio' });
  check('portfolio: array + default target', r.ok && r.changes.length === 2, show(r));
  check('portfolio: synonyms', r.changes?.[0]?.fields.section === 'experience' && r.changes[0].fields.tag === 'Customer service, Cash handling', show(r.changes?.[0]));
  check('portfolio: no section → projects', r.changes?.[1]?.fields.section === 'projects', show(r.changes?.[1]));
}

// ── 9. Edits and deletes against a snapshot ─────────────────────────────────
const SNAP = {
  projects: [
    { id: '3f9a2c1b-0000-4000-8000-000000000001', title: 'Gaming PC', goal: 'Play games', type: 'Coding', stage: 'building', next_step: null,
      tasks: [{ id: 'aa11bb22-0000-4000-8000-000000000001', title: 'Set budget', done: false }, { id: 'aa11bb22-9999-4000-8000-000000000002', title: 'Buy case', done: false }],
      notes: [], links: [] },
    { id: '77aa0000-0000-4000-8000-000000000003', title: 'Old blog', stage: 'blueprint', tasks: [], notes: [], links: [] },
  ],
  planner: [{ id: 'cc00dd11-0000-4000-8000-000000000004', title: 'Gym', date: '2026-09-22', time: '07:00', area: 'physical' }],
};
{
  const refs = F.shortRefs(SNAP.projects[0].tasks.map(t => t.id));
  check('shortRefs: unique when prefixes collide', new Set(refs.values()).size === 2 && [...refs.values()].every(v => v.length > 8), show([...refs.values()]));

  const prompt = F.buildPrompt({ targets: ['projects', 'planner'], idea: 'Tidy up', today: TODAY, areaCatalog: CATALOG, snapshot: SNAP });
  check('prompt: carries refs and data', prompt.includes('"ref":"3f9a2c1b"') && prompt.includes('Set budget') && prompt.includes('"delete": true'), prompt.slice(-900));
  check('prompt: date line', prompt.includes('Today is Monday, September 21, 2026'));
  const plain = F.buildPrompt({ targets: ['portfolio'], today: TODAY });
  check('prompt: no data section when not shared', !plain.includes('WHAT IS IN THE APP NOW') && !plain.includes('"delete"'));

  const taskRefs = [...refs.values()];
  const r = parse(`\`\`\`json
{"chill":1,
 "projects":[
   {"ref":"3f9a2c1b","title":"Gaming PC build","goal":"Play games","tasks":[{"ref":"${taskRefs[0]}","done":true},{"ref":"${taskRefs[1]}","delete":true},"Order the GPU"]},
   {"ref":"77aa0000","delete":true},
   {"ref":"deadbeef","title":"Ghost"},
   {"title":"gaming pc","tasks":["Install Windows"]},
   {"ref":"aa11bb22","title":"Ambiguous?"}
 ],
 "planner":[{"ref":"cc00dd11","time":"07:00","title":"Gym"},{"id":"new","title":"Stretch","date":"today"}]
}
\`\`\``);
  check('edit: parsed', r.ok, show(r));
  const res = P.resolveChanges(r.changes || [], SNAP);
  const [upd, del, ghost, twin, amb, gymNoop, stretch] = res;
  check('edit: only changed fields in diff', upd?.op === 'update' && upd.diff.length === 1 && upd.diff[0].field === 'title' && upd.diff[0].from === 'Gaming PC', show(upd?.diff));
  check('edit: child update + delete + create', upd?.children.map(k => `${k.op}:${k.status}`).join(',') === 'update:ok,delete:ok,create:ok', show(upd?.children));
  check('edit: child done diff', upd?.children[0].diff[0]?.field === 'done' && upd.children[0].diff[0].to === true, show(upd?.children[0]));
  check('delete: resolved', del?.op === 'delete' && del.status === 'ok' && del.current?.title === 'Old blog', show(del));
  check('missing ref: not applied', ghost?.status === 'missing', show(ghost));
  check('twin title: merged into existing', twin?.op === 'update' && twin.merged && twin.id === SNAP.projects[0].id && twin.children[0].op === 'create', show(twin));
  check('ref of a different kind: not matched', amb?.status === 'missing', show(amb));
  check('no-op edit flagged', gymNoop?.status === 'noop', show(gymNoop));
  check('non-hex id means new', stretch?.op === 'create' && stretch.fields.date === '2026-09-21', show(stretch));
  const counts = P.countChanges(res);
  check('counts', counts.create === 3 && counts.update === 2 && counts.delete === 2, show(counts));

  const noRef = parse('{"chill":1,"portfolio":[{"delete":true,"title":"x"}]}');
  check('delete without ref is refused', !noRef.ok && noRef.warnings?.some(w => /no ref/.test(w)), show(noRef));
}

// ── 9b. Planner reminders in the change script ─────────────────────────────
{
  const r = parse(`{"chill":1,"planner":[
    {"title":"A","date":"today","time":"9am","remind":15},
    {"title":"B","date":"today","time":"9am","remind":"at the time"},
    {"title":"C","date":"today","time":"9am","remind":"30 min before"},
    {"title":"D","date":"today","time":"9am","remind":true},
    {"ref":"cc00dd11","remind":false},
    {"title":"E","date":"today","remind":"whenever"}
  ]}`);
  const [a, b, c, d, off, bad] = r.changes || [];
  check('remind: minutes', a?.fields.remind === 15, show(a?.fields));
  check('remind: at the time', b?.fields.remind === 0, show(b?.fields));
  check('remind: phrase', c?.fields.remind === 30, show(c?.fields));
  check('remind: true', d?.fields.remind === true, show(d?.fields));
  check('remind: off', off?.fields.remind === false, show(off?.fields));
  check('remind: nonsense ignored with a warning', bad && bad.fields.remind === undefined && bad.warnings.some(w => /reminder/.test(w)), show(bad));
  const prompt = F.buildPrompt({ targets: ['planner'], today: TODAY });
  check('prompt: explains remind', /"remind"/.test(prompt) && /phone reminder/.test(prompt));
}

// ── 10. The Workshop's build types match ────────────────────────────────────
{
  const src = await text('src/screens/library/projects.js');
  const body = src.match(/BUILD_TYPES = \[([\s\S]*?)\];/)?.[1] || '';
  const names = [...body.matchAll(/'([^']+)'/g)].map(m => m[1].replace(/^\S+\s+/, ''));
  check('BUILD_TYPES matches PROJECT_TYPES', show(names) === show(F.PROJECT_TYPES), `projects.js has ${show(names)}`);
}

// ── 11. Every life-area section in LifeAreaScreen.js is reachable ──────────
{
  const src = await text('src/screens/library/LifeAreaScreen.js');
  const sections = [...src.matchAll(/\{ title: '([^']+)',\s*icon: '[^']+',\s*screen: '(\w+)'/g)];
  check('LIFE_AREAS sections found', sections.length >= 30, `found ${sections.length}`);
}

if (problems.length) {
  console.error(`check-ai-bridge: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-ai-bridge: all ${passed} checks passed.`);
