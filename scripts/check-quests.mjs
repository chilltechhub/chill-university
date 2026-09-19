// scripts/check-quests.mjs
//
// Validates src/data/quests.js: the shape every quest needs so QuestScreen
// can run it, and the content rules written at the top of that file.
//
// The content rules are the same ones the Life Area action generator and
// the curriculum follow: a real-world figure carries "(reviewed 2026)" in
// its own sentence, and money content never tells someone what they
// personally should do. Checked per SENTENCE, because a whole-string check
// passes while a bare figure sits next to a stamped one.
//
// Run: node scripts/check-quests.mjs                 (or `npm run check`)
//      node scripts/check-quests.mjs --check-links   (also loads every resource)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/data/quests.js', import.meta.url), 'utf8');
const { QUESTS, QUEST_ORDER } = await import('data:text/javascript,' + encodeURIComponent(src));

const SUBJECTS = new Set([
  'math', 'language_arts', 'science', 'health', 'finance', 'home_ec',
  'social_studies', 'arts', 'technology', 'foreign_language', 'mental',
  'social_skills', 'career', 'general',
]);
// plannerService.js AREAS
const AREAS = new Set(['physical', 'mental', 'social', 'financial', 'professional', 'spiritual', 'creative', 'digital']);
const KINDS = new Set(['read', 'tool', 'watch']);
const TYPES = ['PERSONAL', 'STUDENT', 'BUSINESS', 'ENTREPRENEUR'];

const problems = [];
const bad = (quest, msg) => problems.push(`${quest?.id || '?'}: ${msg}`);

const sentences = (text) => String(text).split(/(?<=[.!?])\s+/).filter(Boolean);
const STAMP = '(reviewed 2026)';
const ILLUSTRATION = /\bImagine\b|50\/30\/20/;
const PRESCRIPTIVE = /\byou (should|need to|must)\b/i;

// Every piece of text a quest shows, with where it lives, so a failure says
// exactly which string to fix. Check items that open with "Imagine" are a
// worked example as a whole, options and explanation included.
function textsOf(q) {
  const out = [
    ['tagline', q.tagline],
    ['spark.hook', q.spark?.hook],
    ...(q.spark?.points || []).map((p, i) => [`spark.points[${i}]`, p]),
    ['research.intro', q.research?.intro],
    ...(q.research?.tasks || []).map((p, i) => [`research.tasks[${i}]`, p]),
    ['doIt.title', q.doIt?.title],
    ['doIt.detail', q.doIt?.detail],
  ];
  (q.check || []).forEach((item, i) => {
    const example = /^Imagine\b/.test(item.question || '');
    const parts = [item.question, ...(item.options || []), item.explanation];
    parts.forEach((p, j) => out.push([`check[${i}]${j ? `.${j}` : ''}`, p, example]));
  });
  return out.filter(([, text]) => text);
}

const ids = new Set();
for (const q of QUESTS) {
  if (!q.id || !/^[a-z0-9-]+$/.test(q.id)) bad(q, 'id must be lowercase letters, digits and dashes');
  if (ids.has(q.id)) bad(q, 'duplicate id');
  ids.add(q.id);

  for (const f of ['title', 'tagline', 'subjectLabel', 'icon', 'color']) if (!q[f]) bad(q, `missing ${f}`);
  if (!SUBJECTS.has(q.subject)) bad(q, `subject '${q.subject}' is not one of the 14 subject keys`);
  if (!AREAS.has(q.area)) bad(q, `area '${q.area}' is not a planner area`);
  if (!(q.minutes > 0)) bad(q, 'minutes must be a positive number');

  if (!q.spark?.hook) bad(q, 'spark.hook is missing');
  const points = q.spark?.points || [];
  if (points.length < 2 || points.length > 5) bad(q, `spark.points has ${points.length}; keep it to 2-5`);

  if ((q.research?.tasks || []).length < 2) bad(q, 'research needs at least 2 tasks');
  for (const f of ['intro', 'sourcePrompt', 'explainPrompt']) if (!q.research?.[f]) bad(q, `research.${f} is missing`);

  const check = q.check || [];
  if (check.length < 5 || check.length > 8) bad(q, `check has ${check.length} questions; keep it to 5-8`);
  check.forEach((item, i) => {
    const where = `check[${i}]`;
    if (!item.question) bad(q, `${where} has no question`);
    if (!item.explanation) bad(q, `${where} has no explanation (every answer shows one)`);
    // QuestScreen shuffles the options, so "the first one" points at nothing.
    if (/\b(first|second|third|fourth|last|other) (one|option|answer|choice)\b|\boption [a-d1-4]\b/i.test(item.explanation || '')) {
      bad(q, `${where}.explanation refers to an option by position, but options are shuffled`);
    }
    if ('answer' in item) {
      if (!Number.isFinite(item.answer)) bad(q, `${where}.answer must be a number`);
      if (item.options) bad(q, `${where} has both a number answer and options`);
    } else {
      const opts = item.options || [];
      if (opts.length < 3 || opts.length > 5) bad(q, `${where} has ${opts.length} options; use 3-5`);
      if (new Set(opts).size !== opts.length) bad(q, `${where} has duplicate options`);
      if (!Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex >= opts.length) {
        bad(q, `${where}.answerIndex ${item.answerIndex} is out of range`);
      }
    }
  });

  if (!q.doIt?.title || !q.doIt?.detail) bad(q, 'doIt needs a title and detail');
  if (!['today', 'tomorrow'].includes(q.doIt?.due)) bad(q, `doIt.due must be 'today' or 'tomorrow'`);

  const res = q.resources || [];
  if (res.length < 2) bad(q, 'needs at least 2 resources to go further with');
  res.forEach((r, i) => {
    if (!r.title || !r.who) bad(q, `resources[${i}] needs a title and who made it`);
    if (!/^https:\/\//.test(r.url || '')) bad(q, `resources[${i}] url must be https`);
    if (!KINDS.has(r.kind)) bad(q, `resources[${i}].kind '${r.kind}' must be read, tool or watch`);
  });

  // Content rules
  for (const [where, text, example] of textsOf(q)) {
    for (const sentence of sentences(text)) {
      if (!example && /[$%]/.test(sentence) && !sentence.includes(STAMP) && !ILLUSTRATION.test(sentence)) {
        bad(q, `${where}: figure without "${STAMP}": "${sentence}"`);
      }
      if (q.regulated && PRESCRIPTIVE.test(sentence)) {
        bad(q, `${where}: tells the reader what to do (regulated): "${sentence}"`);
      }
    }
  }
}

for (const type of TYPES) {
  const order = QUEST_ORDER[type] || [];
  const missing = [...ids].filter(id => !order.includes(id));
  const unknown = order.filter(id => !ids.has(id));
  if (missing.length) problems.push(`QUEST_ORDER.${type} is missing ${missing.join(', ')}`);
  if (unknown.length) problems.push(`QUEST_ORDER.${type} lists unknown ${unknown.join(', ')}`);
}

if (process.argv.includes('--check-links')) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';
  for (const q of QUESTS) {
    for (const r of q.resources || []) {
      try {
        const res = await fetch(r.url, { redirect: 'follow', headers: { 'User-Agent': UA } });
        if (!res.ok) bad(q, `link ${res.status}: ${r.url}`);
      } catch (e) {
        bad(q, `link failed (${e.message}): ${r.url}`);
      }
    }
  }
}

if (problems.length) {
  console.error(`Quests: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
const questions = QUESTS.reduce((n, q) => n + q.check.length, 0);
console.log(`Quests OK: ${QUESTS.length} quests, ${questions} check questions${process.argv.includes('--check-links') ? ', every resource loads' : ''}.`);
