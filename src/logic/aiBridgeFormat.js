// src/logic/aiBridgeFormat.js
// "Fill with AI" — the free path. The app writes a prompt, the person pastes
// it into whatever chatbot they already use (ChatGPT, Claude, Gemini...), and
// pastes the reply back. Nothing is sent anywhere by the app, so it costs
// nothing per use — unlike 'ai-import' (featureCatalog.js), which runs a
// paid model and is a Plus feature.
//
// The reply is a change script, not SQL. Every existing item goes out in the
// prompt with a short `ref`, and each item in the reply is one of:
//
//   no ref                      create it
//   ref + some fields           change just those fields
//   ref + "delete": true        delete it
//
// Anything the reply leaves out stays as it is. A chatbot that forgets half
// the list must not be able to wipe it.
//
// This file is the contract both sides share: the six places a reply can
// touch, the values each field may take, how current data is written into
// the prompt, and the prompt itself. aiBridgeParse.js reads replies against
// the same lists; src/api/aiBridgeData.js loads and writes the rows.
//
// No imports on purpose: scripts/check-ai-bridge.mjs evaluates this file
// directly under node, the way the other check scripts load data files.

export const FORMAT_VERSION = 1;

// route: where "Open" goes after a run. feature: the featureCatalog id that
// gates that screen (null = no gate), so a reply can't write into a screen
// the person hasn't unlocked yet.
export const TARGETS = [
  { key: 'projects',   label: 'Projects',        emoji: '🏗️', icon: 'construct-outline', route: 'ProjectsScreen',   feature: 'workshop',        blurb: 'Builds, with their tasks, notes and links',
    placeholder: 'e.g. I want to build a gaming PC by December. Budget is about $800 and I have never done it before.' },
  { key: 'ideas',      label: 'Ideas',           emoji: '🌱', icon: 'leaf-outline',      route: 'IdeaGardenScreen', feature: 'idea-garden',     blurb: 'Idea Garden plants and the thoughts on them',
    placeholder: 'e.g. Three business ideas I keep thinking about: a lawn-care service, reselling sneakers, and a tutoring app.' },
  { key: 'vault',      label: 'Knowledge Vault', emoji: '📚', icon: 'library-outline',   route: 'KnowledgeScreen',  feature: 'knowledge-vault', blurb: 'Notes, bookmarks, papers and tools',
    placeholder: 'e.g. Make me study notes on how credit scores work, plus the best free sites to learn more.' },
  { key: 'planner',    label: 'Planner',         emoji: '📅', icon: 'calendar-outline',  route: 'PlannerScreen',    feature: 'planner',         blurb: 'Things to do on a day, once or repeating',
    placeholder: 'e.g. Plan my week: gym Mon/Wed/Fri mornings, study for my math test on Thursday, call grandma on Sunday.' },
  { key: 'life_areas', label: 'Life Areas',      emoji: '🧭', icon: 'compass-outline',   route: 'LifeAreaScreen',   feature: null,              blurb: 'Your own habits and steps for each part of life',
    placeholder: 'e.g. I sleep badly, skip breakfast and feel tired all day. Give me a few small habits to fix it.' },
  { key: 'portfolio',  label: 'Portfolio',       emoji: '💼', icon: 'briefcase-outline', route: 'PortfolioScreen',  feature: 'portfolio',       blurb: 'Skills, experience and work to show people',
    placeholder: 'e.g. I worked 2 summers at a grocery store, I edit videos for my friends, and I built a Minecraft server.' },
];
export const TARGET_KEYS = TARGETS.map(t => t.key);
export const TARGET_BY_KEY = Object.fromEntries(TARGETS.map(t => [t.key, t]));

// Build types, without their emoji. Must match BUILD_TYPES in
// src/screens/library/projects.js (the check script compares them).
export const PROJECT_TYPES = ['Science', 'Coding', 'Art', 'Writing', 'Business', 'DIY', 'Research', 'Personal', 'Travel', 'Music', 'Finance', 'Other'];

// projects.status, as the Workshop names its stages.
export const PROJECT_STAGES = { building: 'active', blueprint: 'idea', shipped: 'completed' };
export const STAGE_FOR_STATUS = { active: 'building', idea: 'blueprint', completed: 'shipped' };

// project_journal.type
export const PROJECT_NOTE_TYPES = ['note', 'idea', 'question'];

// Idea Garden (PLANT_TYPES / PETAL_TYPES in src/screens/library/ideagarden.js).
export const PLANT_STAGES = {
  sprout: 'raw seed, early stage',
  plant:  'developing, being worked on',
  flower: 'creative or research idea',
  tree:   'big initiative',
};
export const PETAL_TYPES = ['idea', 'task', 'note', 'question', 'resource'];

// Knowledge Vault kinds (KINDS in src/screens/library/knowledge.js).
export const VAULT_KINDS = {
  note:     'written notes, put the text in "body"',
  bookmark: 'a web page worth keeping',
  paper:    'a research paper or article',
  tool:     'an app or website to use',
};

export const AREA_IDS = ['physical', 'mental', 'social', 'financial', 'professional', 'spiritual', 'creative', 'digital'];

// user_area_actions.tier. 'learn' exists too, but it opens a reading card
// with a body a custom action doesn't have, so a reply can't ask for it.
export const ACTION_TYPES = {
  habit: 'something to repeat',
  step:  'something to do once',
  quick: 'a 2-minute win',
};

export const PORTFOLIO_SECTIONS = ['projects', 'skills', 'experience', 'research', 'passions'];

// How many planner rows one repeating item turns into.
export const REPEAT_COUNTS = { daily: 7, weekly: 4, monthly: 3 };

export const LIMITS = {
  changes: 150,
  title: 120,
  actionTitle: 120, // user_area_actions title check constraint
  actionWhy: 240,   // user_area_actions why check constraint
  children: 40,     // tasks / notes / links / petals per parent in one reply
  actions: 15,
  body: 8000,
  // Longer than this and the prompt carries a preview instead of the text,
  // under a different key, so a reply can't write a cut-off copy back.
  exportBody: 1500,
  previewBody: 280,
};

// How much current data goes into the prompt, per section.
export const EXPORT_CAPS = { projects: 40, ideas: 40, vault: 80, planner: 150, life_areas: 80, portfolio: 60 };

// ─── Dates ──────────────────────────────────────────────────────────────────

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + n));
}

export function addMonthsIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  // Clamp to the month's last day: Jan 31 + 1 month is Feb 28, not Mar 3.
  const last = new Date(y, m - 1 + n + 1, 0).getDate();
  return isoDate(new Date(y, m - 1 + n, Math.min(d, last)));
}

// Every date a new planner item lands on.
export function repeatDates(iso, repeat) {
  const count = REPEAT_COUNTS[repeat];
  if (!count) return [iso];
  return Array.from({ length: count }, (_, i) => (
    repeat === 'daily' ? addDaysIso(iso, i)
      : repeat === 'weekly' ? addDaysIso(iso, i * 7)
        : addMonthsIso(iso, i)
  ));
}

// ─── Refs ───────────────────────────────────────────────────────────────────
// A ref is the shortest prefix of the row's id (8 characters at least) that
// no other row in the same list shares. Nothing is stored: the reply's ref is
// matched against the ids of freshly loaded rows, so it still works after the
// app was closed while the person was in the chatbot.

export function shortRefs(ids) {
  const out = new Map();
  for (const id of ids) {
    let len = 8;
    while (len < id.length && ids.some(o => o !== id && o.startsWith(id.slice(0, len)))) len += 4;
    out.set(id, id.slice(0, len));
  }
  return out;
}

// ─── Current data, as the prompt shows it ──────────────────────────────────
// A snapshot (built by loadSnapshot in src/api/aiBridgeData.js) holds each
// section as plain records in the reply's own shape, plus the row id. This
// writes them out with refs in place of ids, one compact line per item.

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => (
  v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
)));

function bodyFields(body) {
  if (!body) return {};
  if (body.length <= LIMITS.exportBody) return { body };
  return { body_preview: `${body.slice(0, LIMITS.previewBody)}… (${body.length} characters, cut short here)` };
}

function withRefs(list) {
  const refs = shortRefs(list.map(x => x.id));
  return (x) => refs.get(x.id);
}

export function exportSection(key, records) {
  const ref = withRefs(records);
  switch (key) {
    case 'projects': return records.map(p => {
      const tRef = withRefs(p.tasks || []), nRef = withRefs(p.notes || []), lRef = withRefs(p.links || []);
      return clean({
        ref: ref(p), title: p.title, goal: p.goal, type: p.type, stage: p.stage, next_step: p.next_step,
        tasks: (p.tasks || []).map(t => clean({ ref: tRef(t), title: t.title, done: t.done || undefined })),
        notes: (p.notes || []).map(n => clean({ ref: nRef(n), type: n.type === 'note' ? undefined : n.type, title: n.title, ...bodyFields(n.body) })),
        links: (p.links || []).map(l => clean({ ref: lRef(l), title: l.title, url: l.url, notes: l.notes })),
      });
    });
    case 'ideas': return records.map(i => {
      const pRef = withRefs(i.petals || []);
      return clean({
        ref: ref(i), title: i.title, description: i.description, stage: i.stage,
        petals: (i.petals || []).map(p => clean({ ref: pRef(p), type: p.type, title: p.title, ...bodyFields(p.body), done: p.done || undefined })),
      });
    });
    case 'vault': return records.map(v => clean({
      ref: ref(v), kind: v.kind, title: v.title, ...bodyFields(v.body), url: v.url, tags: v.tags, area: v.area,
    }));
    case 'planner': return records.map(e => clean({
      ref: ref(e), title: e.title, date: e.date, time: e.time, minutes: e.minutes, area: e.area, notes: e.notes, done: e.done || undefined,
      remind: e.remind || undefined,
    }));
    case 'life_areas': {
      // Grouped the way the reply writes them: one entry per area + section.
      const groups = new Map();
      for (const a of records) {
        const k = `${a.area}|${a.section}`;
        if (!groups.has(k)) groups.set(k, { area: a.area, section: a.section, actions: [] });
        groups.get(k).actions.push(clean({ ref: ref(a), title: a.title, why: a.why, type: a.type }));
      }
      return [...groups.values()];
    }
    case 'portfolio': return records.map(e => clean({
      ref: ref(e), section: e.section, title: e.title, description: e.description, link: e.link, tag: e.tag,
    }));
    default: return [];
  }
}

function currentDataBlock(keys, snapshot) {
  const lines = [];
  for (const k of keys) {
    const items = exportSection(k, snapshot[k] || []);
    lines.push(`"${k}": ${items.length ? '' : '(nothing yet)'}`);
    for (const it of items) lines.push(`  ${JSON.stringify(it)}`);
  }
  return lines;
}

// ─── The prompt ─────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const list = (xs) => xs.join(', ');
const enumLines = (obj) => Object.entries(obj).map(([k, v]) => `"${k}" (${v})`).join(', ');

function sectionSpec(key, { areaCatalog, today }) {
  const tomorrow = addDaysIso(isoDate(today), 1);
  switch (key) {
    case 'projects': return [
      '"projects": something I\'m building or working toward, with the steps to get there.',
      '  { "title": "Build a gaming PC", "goal": "One sentence: what done looks like", "type": "Coding", "stage": "building",',
      '    "next_step": "The very next thing to do", "tasks": ["Set a budget", "Pick a CPU and motherboard"],',
      '    "notes": [{ "title": "Parts budget", "body": "..." }], "links": [{ "title": "PCPartPicker", "url": "https://pcpartpicker.com" }] }',
      `  type: one of ${list(PROJECT_TYPES)}`,
      '  stage: "building" (working on it now), "blueprint" (still planning) or "shipped" (finished)',
      '  tasks: concrete actions in the order to do them. Mark one finished with { "ref": "...", "done": true }',
      `  note type (optional): one of ${list(PROJECT_NOTE_TYPES)}`,
    ];
    case 'ideas': return [
      '"ideas": rough ideas to grow later (they live in my Idea Garden).',
      '  { "title": "Sneaker reselling", "description": "One or two sentences", "stage": "sprout",',
      '    "petals": [{ "type": "question", "title": "Who would buy from me?", "body": "" }] }',
      `  stage: ${enumLines(PLANT_STAGES)}`,
      `  petal type: one of ${list(PETAL_TYPES)}`,
    ];
    case 'vault': return [
      '"vault": things to keep and look up later.',
      '  { "kind": "note", "title": "How credit scores work", "body": "...", "url": "https://...", "tags": ["credit", "money"], "area": "financial" }',
      `  kind: ${enumLines(VAULT_KINDS)}`,
      `  area (optional): one of ${list(AREA_IDS)}`,
    ];
    case 'planner': return [
      '"planner": things to do on a specific day.',
      `  { "title": "Gym: upper body", "date": "${tomorrow}", "time": "07:00", "minutes": 45, "area": "physical", "repeat": "weekly", "remind": 15, "notes": "..." }`,
      `  area: one of ${list(AREA_IDS)}`,
      '  repeat (new items only): "daily" (adds the next 7 days), "weekly" (the next 4 weeks) or "monthly" (the next 3 months)',
      '  remind (optional, needs a time): minutes before to send a phone reminder (0 = at the time), or false to turn one off',
      '  Mark one done with { "ref": "...", "done": true }',
    ];
    case 'life_areas': return [
      '"life_areas": my own habits and steps for one part of my life, plus notes.',
      '  { "area": "physical", "section": "Sleep & Recovery",',
      '    "actions": [{ "title": "Phone on the charger by 10pm", "why": "Screens keep your brain awake", "type": "habit" }],',
      '    "notes": ["I wake up tired most days"] }',
      `  action type: ${enumLines(ACTION_TYPES)}`,
      '  Keep action titles under 100 characters and "why" to one short sentence. Notes can only be added, not changed.',
      '  area and section, use these exactly:',
      ...areaCatalog.map(a => `    ${a.id}: ${a.sections.map(s => s.title).join(', ')}`),
    ];
    case 'portfolio': return [
      '"portfolio": things to show people: skills, experience, finished work.',
      '  { "section": "skills", "title": "Video editing", "description": "What I did and what came of it", "link": "https://...", "tag": "Premiere Pro" }',
      `  section: one of ${list(PORTFOLIO_SECTIONS)}`,
      '  Only list things I actually told you about. Do not invent experience.',
    ];
    default: return [];
  }
}

// targets: the section keys to ask for. snapshot: the person's current data
// (null = don't share it; the AI can then only add). sortEverything: the
// person picked "Everything", so the AI decides which sections fit.
export function buildPrompt({ targets, idea = '', today = new Date(), areaCatalog = [], snapshot = null, sortEverything = false }) {
  const keys = TARGET_KEYS.filter(k => targets.includes(k));
  const dateLine = `${WEEKDAYS[today.getDay()]}, ${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  const ideaText = idea.trim() || '[Write what you want here. As messy as you like.]';
  const skeleton = `{ "chill": ${FORMAT_VERSION}, ${keys.map(k => `"${k}": [ ... ]`).join(', ')} }`;
  const editing = !!snapshot;

  return [
    editing
      ? 'I use an app called Chill Tech Hub to organize my life. Below is what is in it right now. Help me add to it, change it, or clean it up, and write the result as a change script the app can run.'
      : 'I use an app called Chill Tech Hub to organize my life. Help me turn what I want into items the app can import.',
    '',
    'WHAT I WANT:',
    '"""',
    ideaText,
    '"""',
    '',
    'HOW TO ANSWER',
    '1. If what I want is too vague to do well, ask me up to 3 short questions first and wait for my answers.',
    '2. When you are ready, list the changes in plain words (5 lines at most), then ONE code block in the exact format below.',
    '3. If I ask for more changes, send the whole code block again with everything in it.',
    '',
    'RULES FOR THE CODE BLOCK',
    `- Valid JSON in a \`\`\`json code block, starting with {"chill": ${FORMAT_VERSION}`,
    sortEverything
      ? `- Sort what I describe into whichever of these sections fit, and leave out the ones that don't: ${keys.map(k => `"${k}"`).join(', ')}.`
      : `- Only use ${keys.length === 1 ? 'this section' : 'these sections'}: ${keys.map(k => `"${k}"`).join(', ')}.`,
    ...(editing ? [
      '- To ADD an item, leave out "ref". Never make up a ref.',
      '- To CHANGE an item, give its "ref" and ONLY the fields you are changing: { "ref": "3f9a2c1b", "title": "New name" }',
      '- To DELETE an item, give its "ref" and "delete": true: { "ref": "3f9a2c1b", "delete": true }',
      '- Anything you leave out stays exactly as it is. Do not repeat items you are not changing.',
      '- Tasks, notes, links and petals work the same way inside their parent:',
      '  { "ref": "<project ref>", "tasks": [{ "ref": "<task ref>", "done": true }, { "ref": "<task ref>", "delete": true }, "A new task"] }',
      '- "body_preview" means the text was cut short. Never send it back. Only send "body" if you are rewriting the whole text.',
      '- Only delete things I asked you to delete, or that are clearly duplicates.',
    ] : []),
    '- Leave out any field you don\'t have a good answer for.',
    '- Never make up links. Only include a URL if you are sure the page is real.',
    '- Keep titles short (under 80 characters). Make tasks concrete ("Call 3 shops for prices", not "Research").',
    `- Today is ${dateLine}. Write dates as YYYY-MM-DD and times as 24-hour HH:MM.`,
    '',
    'THE FORMAT',
    skeleton,
    '',
    'WHAT GOES IN EACH SECTION (each one is a list of objects like the example)',
    ...keys.flatMap(k => [...sectionSpec(k, { areaCatalog, today }), '']),
    ...(editing ? ['WHAT IS IN THE APP NOW (one item per line)', ...currentDataBlock(keys, snapshot), ''] : []),
    'When it looks right, I will copy your reply and paste it back into the app. It will show me every change before anything is saved.',
  ].join('\n');
}
