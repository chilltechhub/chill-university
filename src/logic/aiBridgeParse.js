// src/logic/aiBridgeParse.js
// Reads a chatbot's reply to the "Fill with AI" prompt (aiBridgeFormat.js)
// and turns it into a list of changes the person can check before anything
// is written.
//
// Chatbot output is messy in predictable ways, so this is forgiving on
// purpose: the code block can be fenced or bare, surrounded by chat, use
// smart quotes, trailing commas, comments or unquoted keys, or be cut off
// part-way (whatever finished before the cut is kept, with a warning). Field
// names get common synonyms ("name" for "title", "steps" for "tasks") and
// values get common spellings ("in progress" for "building").
//
// It is strict where it matters: a ref is only ever matched against a real
// row, never guessed; a delete needs a ref; links must be http(s); and
// every value is checked against the lists in aiBridgeFormat.js.
//
// Two steps, both pure:
//   parseReply(text)                  -> changes, from the reply alone
//   resolveChanges(changes, snapshot) -> the same, matched to current rows,
//                                        with an old -> new diff for edits
//
// Imports only aiBridgeFormat.js, so scripts/check-ai-bridge.mjs can run it
// under node.

import {
  TARGET_KEYS, PROJECT_TYPES, PROJECT_STAGES, PROJECT_NOTE_TYPES, PLANT_STAGES, PETAL_TYPES,
  VAULT_KINDS, AREA_IDS, ACTION_TYPES, PORTFOLIO_SECTIONS, REPEAT_COUNTS, LIMITS,
  isoDate, addDaysIso,
} from './aiBridgeFormat';

// ─── Lenient JSON ───────────────────────────────────────────────────────────

const CLOSERS = {
  '"': '"', "'": "'",
  '“': '”“"', '”': '”"', '„': '“”"',
  '‘': "’'", '’': "’'",
};
const CUT = Symbol('cut');
const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

// Returns { value, truncated }. Throws when there's nothing usable.
export function lenientParse(src) {
  let i = 0;
  const n = src.length;
  let truncated = false;
  const fail = (msg) => { const e = new Error(`${msg} (character ${i})`); e.pos = i; throw e; };

  const ws = () => {
    while (i < n) {
      const ch = src[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\u00A0') { i++; continue; }
      if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (ch === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); i = end < 0 ? n : end + 2; continue; }
      if (ch === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      break;
    }
  };

  const string = () => {
    const closers = CLOSERS[src[i++]];
    let out = '';
    while (i < n) {
      const ch = src[i];
      if (ch === '\\') {
        const e = src[i + 1];
        if (e === undefined) break;
        i += 2;
        if (e === 'n') out += '\n';
        else if (e === 't') out += '\t';
        else if (e === 'r') out += '\r';
        else if (e === 'b') out += '\b';
        else if (e === 'f') out += '\f';
        else if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(src.slice(i, i + 4))) { out += String.fromCharCode(parseInt(src.slice(i, i + 4), 16)); i += 4; }
        else out += e;
        continue;
      }
      if (closers.includes(ch)) { i++; return out; }
      out += ch;
      i++;
    }
    truncated = true;
    return CUT;
  };

  // An unquoted word. As a key it runs to the colon; as a value, to the next
  // comma, bracket or line end — which is what lets an unquoted URL through.
  const bare = (asKey) => {
    const start = i;
    const stop = asKey ? /[:=\n{}[\],]/ : /[,}\]\n]/;
    while (i < n && !stop.test(src[i])) i++;
    if (i >= n && !asKey) { truncated = true; return CUT; }
    const word = src.slice(start, i).trim();
    if (!word) fail('Unexpected character');
    if (asKey) return word;
    const lower = word.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    if (lower === 'null' || lower === 'none' || lower === 'undefined') return null;
    if (NUMBER_RE.test(word)) return Number(word);
    return word;
  };

  const startsValue = (ch) => ch === '{' || ch === '[' || CLOSERS[ch] || /[\w\-+.]/.test(ch);

  const array = () => {
    i++;
    const arr = [];
    for (;;) {
      ws();
      if (i >= n) { truncated = true; return arr; }
      if (src[i] === ']') { i++; return arr; }
      if (src[i] === ',') { i++; continue; }
      const v = value();
      if (v === CUT) return arr;
      arr.push(v);
      ws();
      if (i >= n) { truncated = true; return arr; }
      if (src[i] === ',') { i++; continue; }
      if (src[i] === ']') { i++; return arr; }
      if (startsValue(src[i])) continue; // a missing comma
      fail('Expected , or ]');
    }
  };

  const object = () => {
    i++;
    const obj = {};
    for (;;) {
      ws();
      if (i >= n) { truncated = true; return obj; }
      if (src[i] === '}') { i++; return obj; }
      if (src[i] === ',') { i++; continue; }
      const key = CLOSERS[src[i]] ? string() : bare(true);
      if (key === CUT) return obj;
      ws();
      if (i >= n) { truncated = true; return obj; }
      if (src[i] === ':' || src[i] === '=') i++;
      else fail(`Expected : after "${key}"`);
      ws();
      if (i >= n) { truncated = true; return obj; }
      const v = value();
      if (v === CUT) return obj;
      obj[key] = v;
      ws();
      if (i >= n) { truncated = true; return obj; }
      if (src[i] === ',') { i++; continue; }
      if (src[i] === '}') { i++; return obj; }
      if (CLOSERS[src[i]] || /[A-Za-z_]/.test(src[i])) continue; // a missing comma
      fail('Expected , or }');
    }
  };

  function value() {
    ws();
    if (i >= n) { truncated = true; return CUT; }
    const ch = src[i];
    if (ch === '{') return object();
    if (ch === '[') return array();
    if (CLOSERS[ch]) return string();
    return bare(false);
  }

  const v = value();
  if (v === CUT || v === undefined) fail('Nothing to read');
  return { value: v, truncated };
}

// ─── Finding the code block ─────────────────────────────────────────────────

const HAS_TAG = /["'“]?chill["'”]?\s*:/;

export function extractCandidates(raw) {
  const text = String(raw || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');
  const found = [];
  const fence = /(`{3,}|~{3,})[^\n]*\n([\s\S]*?)(?:\n[ \t]*\1|$)/g;
  let m;
  while ((m = fence.exec(text))) {
    if (/[{[]/.test(m[2])) found.push(m[2].trim());
  }
  // Outside a fence: from the first bracket to the last one. A bare list
  // (`[{...}, {...}]`) goes first when it starts first, or its first object
  // would be read on its own.
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  const c = text.indexOf('[');
  const d = text.lastIndexOf(']');
  const objectSlice = a >= 0 ? (b > a ? text.slice(a, b + 1) : text.slice(a)) : null;
  const arraySlice = c >= 0 && (a < 0 || c < a) ? (d > c ? text.slice(c, d + 1) : text.slice(c)) : null;
  if (arraySlice) found.push(arraySlice);
  if (objectSlice) found.push(objectSlice);
  const uniq = [...new Set(found)];
  // Anything carrying the "chill" tag first; otherwise keep the order found.
  return [...uniq.filter(s => HAS_TAG.test(s)), ...uniq.filter(s => !HAS_TAG.test(s))];
}

// ─── Field readers ──────────────────────────────────────────────────────────
// Each returns undefined when the field wasn't given, null when it was given
// empty (meaning "clear it" on an edit), INVALID when it can't be used, or
// the cleaned value.

export const INVALID = Symbol('invalid');
const PLACEHOLDER = /^(\.{2,}|…|n\/?a|none|null|undefined|tbd|\[[^\]]*\]|<[^>]*>)$/i;

export const normKey = (k) => String(k)
  .replace(/([a-z])([A-Z])/g, '$1_$2')
  .toLowerCase()
  .replace(/[\s-]+/g, '_')
  .replace(/[^\w]/g, '');

// For matching against the app's own (English) values: emoji and punctuation
// go, accented Latin letters stay.
const normWord = (v) => String(v).toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9À-ɏ]+/g, ' ')
  .trim();

// For comparing the person's own titles, which can be in any script.
const titleKey = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();

function keyed(raw) {
  if (typeof raw === 'string' || typeof raw === 'number') return { title: String(raw) };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = {};
  for (const [k, v] of Object.entries(raw)) {
    const nk = normKey(k);
    if (!(nk in o)) o[nk] = v;
  }
  return o;
}

function pick(o, ...names) {
  for (const k of names) if (k in o) return o[k];
  return undefined;
}

function text(v, max) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
  if (Array.isArray(v) && v.every(x => typeof x === 'string')) v = v.join('\n');
  if (typeof v !== 'string') return INVALID;
  let s = v.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  if (!s || PLACEHOLDER.test(s)) return null;
  if (max && s.length > max) s = `${s.slice(0, max - 1).trimEnd()}…`;
  return s;
}

function line(v, max) {
  const s = text(v, null);
  if (typeof s !== 'string') return s;
  const one = s.replace(/\s+/g, ' ').replace(/^[-*•]\s+/, '');
  return max && one.length > max ? `${one.slice(0, max - 1).trimEnd()}…` : one;
}

function bool(v) {
  if (v === undefined) return undefined;
  if (v === null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', 'done', 'complete', 'completed', 'finished', '1', 'x', '✓', '✅'].includes(s)) return true;
  if (['false', 'no', 'n', 'not done', 'todo', 'open', 'pending', '0', ''].includes(s)) return false;
  return INVALID;
}

export function cleanUrl(v) {
  const s = line(v, 2000);
  if (typeof s !== 'string') return s;
  let u = s;
  const md = u.match(/\]\((\S+?)\)/);
  if (md) u = md[1];
  u = u.replace(/^<|>$/g, '').replace(/[)\].,;]+$/, '');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) {
    if (/^(www\.)?[\w-]+(\.[\w-]+)+([/?#]|$)/i.test(u)) u = `https://${u}`;
    else return INVALID;
  }
  if (!/^https?:\/\/[^\s/]+\.[^\s]/i.test(u) || /\s/.test(u)) return INVALID;
  return u;
}

// v against a list of allowed values plus synonyms. Matching ignores case,
// emoji and punctuation, so "💻 Coding" and "coding" are both Coding.
function oneOf(v, allowed, synonyms = {}) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string' && typeof v !== 'number') return INVALID;
  const w = normWord(v);
  if (!w || PLACEHOLDER.test(String(v).trim())) return null;
  const hit = allowed.find(a => normWord(a) === w);
  if (hit) return hit;
  if (synonyms[w]) return synonyms[w];
  // "Coding project", "a habit": a single allowed word inside the value.
  const inside = allowed.filter(a => w.split(' ').includes(normWord(a)));
  if (inside.length === 1) return inside[0];
  const syn = Object.keys(synonyms).filter(k => w.split(' ').includes(k));
  if (syn.length === 1) return synonyms[syn[0]];
  return INVALID;
}

function minutes(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v === 'number') return v > 0 && v <= 1440 ? Math.round(v) : INVALID;
  const s = String(v).toLowerCase();
  const h = s.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  const m = s.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
  let total = (h ? parseFloat(h[1]) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
  if (!h && !m) {
    const plain = s.match(/^\s*(\d+)\s*$/);
    if (!plain) return INVALID;
    total = parseInt(plain[1], 10);
  }
  total = Math.round(total);
  return total > 0 && total <= 1440 ? total : INVALID;
}

function tags(v) {
  if (v === undefined) return undefined;
  if (v === null) return [];
  const raw = Array.isArray(v) ? v : String(v).split(/[,;\n]/);
  const out = [];
  for (const t of raw) {
    if (typeof t !== 'string' && typeof t !== 'number') continue;
    const s = String(t).trim().replace(/^#/, '').toLowerCase().slice(0, 30);
    if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 8);
}

// A list field: an array, a single object, or a block of lines.
function items(v) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') return [v];
  const s = String(v);
  const lines = s.split('\n').map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()).filter(Boolean);
  return lines.length ? lines : [];
}

// A phone reminder: minutes before (0 = at the time), true (the usual 15),
// or false / null (none).
function remindValue(v) {
  if (v === undefined) return undefined;
  if (v === null || v === false) return false;
  if (v === true) return true;
  if (v === 0 || v === '0') return 0;
  if (typeof v === 'string' && /^(at (the )?(start|time)|on time|now)$/i.test(v.trim())) return 0;
  const m = minutes(v);
  if (typeof m === 'number') return Math.min(m, 240);
  const b = bool(v);
  return b === INVALID ? INVALID : b;
}

// ─── Dates and times ────────────────────────────────────────────────────────

const WEEKDAY_IDX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MONTH_IDX = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function validYmd(y, m, d) {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? isoDate(dt) : null;
}

export function parseTime(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const s = String(v).trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (s === 'noon') return '12:00';
  if (s === 'midnight') return '00:00';
  const m = s.match(/^(\d{1,2})(?:[:h](\d{2}))?(?::\d{2})?(am|pm|a|p)?$/);
  if (!m) return INVALID;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (m[3]) {
    if (h < 1 || h > 12) return INVALID;
    h = (h % 12) + (m[3][0] === 'p' ? 12 : 0);
  } else if (!m[2] && s.length > 2) {
    return INVALID; // "700" is too ambiguous to guess at
  }
  if (h > 23 || min > 59) return INVALID;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Returns { date, time } — time only when the value carried one.
export function parseDate(v, today) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const base = isoDate(today);
  let s = String(v).trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ').replace(/\s+/g, ' ');

  // ISO time zones and fractions: planning happens in local time anyway.
  s = s.replace(/(\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?(?:z|[+-]\d{2}:?\d{2})?$/, '$1');

  let time;
  const tm = s.match(/(?:t|\s|\bat\s)(\d{1,2}(?::\d{2})?(?::\d{2})?\s*(?:am|pm)?)$/);
  if (tm && /[:apm]/.test(tm[1])) {
    const t = parseTime(tm[1]);
    if (t && t !== INVALID) { time = t; s = s.slice(0, tm.index).replace(/\bat$/, '').trim(); }
  }

  const done = (date) => (date ? { date, time } : INVALID);

  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return done(validYmd(+m[1], +m[2], +m[3]));
  if (s === 'today' || s === 'tonight') return done(base);
  if (s === 'tomorrow') return done(addDaysIso(base, 1));
  m = s.match(/^(?:in\s+)?\+?(\d{1,3})\s*(day|days|d|week|weeks|w)(?:\s+from\s+now)?$/);
  if (m) return done(addDaysIso(base, +m[1] * (m[2][0] === 'w' ? 7 : 1)));
  m = s.match(/^(this\s+|next\s+|on\s+)?(sun|mon|tue|wed|thu|fri|sat)[a-z]*$/);
  if (m) {
    const want = WEEKDAY_IDX[m[2]];
    let ahead = (want - today.getDay() + 7) % 7;
    if (m[1] && m[1].startsWith('next') && ahead === 0) ahead = 7;
    return done(addDaysIso(base, ahead));
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : today.getFullYear();
    return done(validYmd(y, +m[1], +m[2]));
  }
  m = s.match(/^(?:[a-z]+\s+)?([a-z]{3})[a-z]*\s+(\d{1,2})(?:\s+(\d{4}))?$/) // "mon sep 22 2026", "september 22"
    || null;
  if (m && MONTH_IDX[m[1]]) return done(validYmd(m[3] ? +m[3] : today.getFullYear(), MONTH_IDX[m[1]], +m[2]));
  m = s.match(/^(\d{1,2})\s+([a-z]{3})[a-z]*(?:\s+(\d{4}))?$/); // "22 september"
  if (m && MONTH_IDX[m[2]]) return done(validYmd(m[3] ? +m[3] : today.getFullYear(), MONTH_IDX[m[2]], +m[1]));
  return INVALID;
}

// ─── Synonyms ───────────────────────────────────────────────────────────────

const SECTION_SYNONYMS = {
  projects: 'projects', project: 'projects', builds: 'projects', build: 'projects', workshop: 'projects',
  ideas: 'ideas', idea: 'ideas', idea_garden: 'ideas', garden: 'ideas',
  vault: 'vault', knowledge: 'vault', knowledge_vault: 'vault', notes: 'vault', bookmarks: 'vault', library: 'vault',
  planner: 'planner', plan: 'planner', plans: 'planner', agenda: 'planner', schedule: 'planner', calendar: 'planner', events: 'planner',
  life_areas: 'life_areas', life_area: 'life_areas', lifeareas: 'life_areas', areas: 'life_areas', habits: 'life_areas',
  portfolio: 'portfolio', portfolio_entries: 'portfolio',
};

const TYPE_SYNONYMS = {
  tech: 'Coding', software: 'Coding', app: 'Coding', programming: 'Coding', code: 'Coding', website: 'Coding', game: 'Coding', computer: 'Coding',
  money: 'Finance', budget: 'Finance', investing: 'Finance', savings: 'Finance',
  craft: 'DIY', build: 'DIY', home: 'DIY', woodworking: 'DIY', repair: 'DIY',
  art: 'Art', design: 'Art', drawing: 'Art', painting: 'Art', photography: 'Art', video: 'Art', film: 'Art',
  study: 'Research', school: 'Research', learning: 'Research', education: 'Research',
  health: 'Personal', fitness: 'Personal', life: 'Personal', self: 'Personal', personal_growth: 'Personal',
  startup: 'Business', side_hustle: 'Business', hustle: 'Business', marketing: 'Business', career: 'Business',
  trip: 'Travel', vacation: 'Travel', writing: 'Writing', blog: 'Writing', book: 'Writing', song: 'Music', band: 'Music',
  general: 'Other', misc: 'Other',
};
const STAGE_SYNONYMS = {
  active: 'building', in_progress: 'building', 'in progress': 'building', doing: 'building', started: 'building', working: 'building', now: 'building',
  idea: 'blueprint', planning: 'blueprint', planned: 'blueprint', plan: 'blueprint', draft: 'blueprint', someday: 'blueprint', later: 'blueprint', not_started: 'blueprint', 'not started': 'blueprint',
  done: 'shipped', complete: 'shipped', completed: 'shipped', finished: 'shipped', launched: 'shipped',
};
const NOTE_TYPE_SYNONYMS = { thought: 'note', journal: 'note', q: 'question', ask: 'question' };
const PLANT_SYNONYMS = {
  seed: 'sprout', early: 'sprout', raw: 'sprout', new: 'sprout',
  growing: 'plant', developing: 'plant', active: 'plant', working: 'plant',
  creative: 'flower', research: 'flower', bloom: 'flower',
  big: 'tree', major: 'tree', initiative: 'tree', large: 'tree',
};
const PETAL_SYNONYMS = { todo: 'task', 'to do': 'task', action: 'task', step: 'task', link: 'resource', url: 'resource', thought: 'note', q: 'question' };
const VAULT_SYNONYMS = {
  link: 'bookmark', website: 'bookmark', site: 'bookmark', page: 'bookmark', web: 'bookmark', video: 'bookmark',
  article: 'paper', research: 'paper', study: 'paper', pdf: 'paper',
  app: 'tool', software: 'tool', resource: 'tool', service: 'tool', utility: 'tool',
  notes: 'note', text: 'note', summary: 'note', study_notes: 'note', 'study notes': 'note',
};
const AREA_SYNONYMS = {
  health: 'physical', fitness: 'physical', exercise: 'physical', body: 'physical', sleep: 'physical', nutrition: 'physical', food: 'physical',
  mind: 'mental', wellbeing: 'mental', 'well being': 'mental', emotional: 'mental', stress: 'mental', mindfulness: 'mental',
  friends: 'social', family: 'social', relationships: 'social', community: 'social',
  money: 'financial', finance: 'financial', finances: 'financial', budget: 'financial',
  work: 'professional', career: 'professional', school: 'professional', study: 'professional', job: 'professional', business: 'professional', learning: 'professional',
  faith: 'spiritual', purpose: 'spiritual', values: 'spiritual', religion: 'spiritual',
  art: 'creative', music: 'creative', hobbies: 'creative', hobby: 'creative', writing: 'creative',
  tech: 'digital', technology: 'digital', online: 'digital', screen: 'digital', screens: 'digital', privacy: 'digital', security: 'digital',
};
const ACTION_SYNONYMS = {
  daily: 'habit', repeat: 'habit', routine: 'habit', recurring: 'habit', every: 'habit',
  once: 'step', task: 'step', todo: 'step', one_time: 'step', 'one time': 'step', learn: 'step', goal: 'step',
  win: 'quick', easy: 'quick', fast: 'quick', '2 minute': 'quick', 'two minute': 'quick', small: 'quick',
};
const PORTFOLIO_SYNONYMS = {
  skill: 'skills', project: 'projects', work: 'experience', job: 'experience', jobs: 'experience', employment: 'experience',
  volunteer: 'experience', volunteering: 'experience', internship: 'experience',
  hobby: 'passions', hobbies: 'passions', interest: 'passions', interests: 'passions', passion: 'passions',
  paper: 'research', study: 'research', studies: 'research',
};
const REPEAT_SYNONYMS = {
  day: 'daily', 'every day': 'daily', everyday: 'daily', week: 'weekly', 'every week': 'weekly', month: 'monthly', 'every month': 'monthly',
  once: null, none: null, no: null, never: null, 'one time': null,
};

// ─── Refs, deletes ──────────────────────────────────────────────────────────

// Refs are id prefixes (hex and dashes). Anything else — "new", "P1", a
// title — isn't a ref the prompt ever handed out, so the item is new.
function refOf(o) {
  const v = pick(o, 'ref', 'id', 'ref_id', 'reference');
  if (v === undefined || v === null) return null;
  const s = String(v).trim().replace(/^#/, '').toLowerCase();
  return /^[0-9a-f][0-9a-f-]{3,}$/.test(s) ? s : null;
}

function isDelete(o) {
  if (bool(pick(o, 'delete', 'deleted', 'remove', 'removed', '_delete')) === true) return true;
  const op = pick(o, 'op', 'action', 'do', 'operation', 'change');
  return typeof op === 'string' && /^(delete|remove|drop|destroy)$/i.test(op.trim());
}

// Puts a read field on `fields`, or a warning when it can't be used.
function put(fields, warnings, key, value, what) {
  if (value === undefined) return;
  if (value === INVALID) { warnings.push(`Ignored ${what} (not a value the app understands).`); return; }
  fields[key] = value;
}

// ─── Section readers ────────────────────────────────────────────────────────
// Each returns a change { op, ref, fields, children?, warnings } or a string
// explaining why the item was skipped.

function base(o) {
  const ref = refOf(o);
  if (isDelete(o)) return ref ? { op: 'delete', ref, fields: {}, warnings: [] } : 'a delete with no ref';
  return { op: ref ? 'update' : 'create', ref, fields: {}, warnings: [] };
}

function readChildren(value, kind, reader, parent) {
  const out = [];
  for (const raw of items(value).slice(0, LIMITS.children)) {
    const o = keyed(raw);
    if (!o) continue;
    const ch = reader(o);
    if (typeof ch === 'string') { parent.warnings.push(`Skipped ${ch}.`); continue; }
    out.push({ kind, ...ch });
  }
  if (items(value).length > LIMITS.children) parent.warnings.push(`Only the first ${LIMITS.children} ${kind}s were kept.`);
  return out;
}

const needTitle = (ch, what) => (ch.op === 'create' && !ch.fields.title ? `a new ${what} with no title` : ch);

function readTask(o) {
  const ch = base(o);
  if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a task (${ch})` : ch;
  put(ch.fields, ch.warnings, 'title', line(pick(o, 'title', 'name', 'task', 'text'), 200), 'a task title');
  put(ch.fields, ch.warnings, 'done', bool(pick(o, 'done', 'completed', 'complete', 'finished', 'checked')), 'a done value');
  if (ch.fields.title === null) delete ch.fields.title;
  return needTitle(ch, 'task');
}

function readProjectNote(o) {
  const ch = base(o);
  if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a note (${ch})` : ch;
  let title = line(pick(o, 'title', 'name', 'heading'), 120);
  const body = text(pick(o, 'body', 'text', 'content', 'note', 'details'), LIMITS.body);
  // A bare string arrives as { title }: a long one is really a body.
  if (typeof title === 'string' && body === undefined && title.length > 80) {
    ch.fields.body = text(o.title, LIMITS.body);
    title = line(o.title.split('\n')[0], 80);
  }
  put(ch.fields, ch.warnings, 'title', title, 'a note title');
  put(ch.fields, ch.warnings, 'body', body, 'note text');
  put(ch.fields, ch.warnings, 'type', oneOf(pick(o, 'type', 'kind'), PROJECT_NOTE_TYPES, NOTE_TYPE_SYNONYMS), 'a note type');
  if (ch.op === 'create' && !ch.fields.title && !ch.fields.body) return 'an empty note';
  return ch;
}

function readLink(o) {
  const ch = base(o);
  if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a link (${ch})` : ch;
  let url = cleanUrl(pick(o, 'url', 'link', 'href'));
  let title = line(pick(o, 'title', 'name'), 120);
  // A bare string arrives as { title } — it may be the URL itself.
  if (url === undefined && typeof title === 'string') {
    const asUrl = cleanUrl(title);
    if (typeof asUrl === 'string') { url = asUrl; title = asUrl.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0]; }
  }
  if (url === INVALID) {
    if (ch.op === 'create') return 'a link whose address isn\'t a web link';
    ch.warnings.push('Ignored a link address that isn\'t a web link.');
    url = undefined;
  }
  put(ch.fields, ch.warnings, 'url', url, 'a link');
  put(ch.fields, ch.warnings, 'title', title, 'a link title');
  put(ch.fields, ch.warnings, 'notes', text(pick(o, 'notes', 'note', 'description', 'why'), 1000), 'link notes');
  if (ch.op === 'create' && !ch.fields.url) return 'a new link with no web address';
  if (ch.op === 'create' && !ch.fields.title) ch.fields.title = ch.fields.url.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0];
  return ch;
}

function readPetal(o) {
  const ch = base(o);
  if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a petal (${ch})` : ch;
  put(ch.fields, ch.warnings, 'title', line(pick(o, 'title', 'name', 'text'), 120), 'a petal title');
  put(ch.fields, ch.warnings, 'body', text(pick(o, 'body', 'details', 'content', 'note'), LIMITS.body), 'petal text');
  put(ch.fields, ch.warnings, 'type', oneOf(pick(o, 'type', 'kind', 'petal_type'), PETAL_TYPES, PETAL_SYNONYMS), 'a petal type');
  put(ch.fields, ch.warnings, 'done', bool(pick(o, 'done', 'completed', 'complete')), 'a done value');
  if (ch.fields.title === null) delete ch.fields.title;
  return needTitle(ch, 'petal');
}

const READERS = {
  projects(o) {
    const ch = base(o);
    if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a project (${ch})` : ch;
    const w = ch.warnings;
    put(ch.fields, w, 'title', line(pick(o, 'title', 'name', 'project'), LIMITS.title), 'a title');
    put(ch.fields, w, 'goal', text(pick(o, 'goal', 'objective', 'description', 'summary', 'outcome'), 600), 'a goal');
    put(ch.fields, w, 'type', oneOf(pick(o, 'type', 'category', 'kind'), PROJECT_TYPES, TYPE_SYNONYMS), 'a project type');
    put(ch.fields, w, 'stage', oneOf(pick(o, 'stage', 'status', 'phase'), Object.keys(PROJECT_STAGES), STAGE_SYNONYMS), 'a stage');
    put(ch.fields, w, 'next_step', line(pick(o, 'next_step', 'next_action', 'next', 'nextstep'), 200), 'a next step');
    if (ch.fields.title === null) delete ch.fields.title;
    ch.children = [
      ...readChildren(pick(o, 'tasks', 'steps', 'todo', 'todos', 'checklist', 'to_do'), 'task', readTask, ch),
      ...readChildren(pick(o, 'notes', 'journal', 'note'), 'note', readProjectNote, ch),
      ...readChildren(pick(o, 'links', 'resources', 'research', 'urls', 'sources'), 'link', readLink, ch),
    ];
    return needTitle(ch, 'project');
  },

  ideas(o) {
    const ch = base(o);
    if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `an idea (${ch})` : ch;
    const w = ch.warnings;
    put(ch.fields, w, 'title', line(pick(o, 'title', 'name', 'idea'), LIMITS.title), 'a title');
    put(ch.fields, w, 'description', text(pick(o, 'description', 'summary', 'details', 'body', 'goal'), 1000), 'a description');
    put(ch.fields, w, 'stage', oneOf(pick(o, 'stage', 'plant_type', 'plant', 'type', 'status'), Object.keys(PLANT_STAGES), PLANT_SYNONYMS), 'a stage');
    if (ch.fields.title === null) delete ch.fields.title;
    ch.children = readChildren(pick(o, 'petals', 'thoughts', 'notes', 'questions', 'tasks', 'details_list'), 'petal', readPetal, ch);
    return needTitle(ch, 'idea');
  },

  vault(o) {
    const ch = base(o);
    if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a vault item (${ch})` : ch;
    const w = ch.warnings;
    put(ch.fields, w, 'kind', oneOf(pick(o, 'kind', 'type', 'category'), Object.keys(VAULT_KINDS), VAULT_SYNONYMS), 'a kind');
    put(ch.fields, w, 'title', line(pick(o, 'title', 'name'), 200), 'a title');
    // body_preview is what the prompt sends for long text; it never comes back in.
    put(ch.fields, w, 'body', text(pick(o, 'body', 'text', 'content', 'notes', 'summary'), LIMITS.body), 'text');
    put(ch.fields, w, 'url', cleanUrl(pick(o, 'url', 'link', 'href')), 'a link');
    put(ch.fields, w, 'tags', tags(pick(o, 'tags', 'tag', 'labels', 'keywords')), 'tags');
    const area = pick(o, 'area', 'life_area', 'domain');
    put(ch.fields, w, 'area', normWord(area || '') === 'general' ? null : oneOf(area, AREA_IDS, AREA_SYNONYMS), 'an area');
    if (ch.fields.title === null) delete ch.fields.title;
    if (ch.op === 'create') {
      if (!ch.fields.kind) ch.fields.kind = ch.fields.url ? 'bookmark' : 'note';
      if ((ch.fields.kind === 'bookmark' || ch.fields.kind === 'paper') && !ch.fields.url) {
        w.push(`Saved as a note, since the ${ch.fields.kind} had no link.`);
        ch.fields.kind = 'note';
      }
      if (!ch.fields.title && ch.fields.body) ch.fields.title = line(ch.fields.body.split('\n')[0], 80);
      if (!ch.fields.title && ch.fields.url) ch.fields.title = ch.fields.url.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0];
      if (!ch.fields.title) return 'an empty vault item';
    }
    return ch;
  },

  planner(o, ctx) {
    const ch = base(o);
    if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a planner item (${ch})` : ch;
    const w = ch.warnings;
    put(ch.fields, w, 'title', line(pick(o, 'title', 'name', 'task', 'event'), 200), 'a title');
    const when = parseDate(pick(o, 'date', 'day', 'when', 'start', 'start_date', 'due', 'due_date'), ctx.today);
    if (when === INVALID) w.push('Ignored a date the app couldn\'t read.');
    else if (when !== undefined) ch.fields.date = when && when.date;
    const time = parseTime(pick(o, 'time', 'start_time', 'at'));
    if (time === INVALID) w.push('Ignored a time the app couldn\'t read.');
    else if (time !== undefined) ch.fields.time = time;
    else if (when && when.time) ch.fields.time = when.time;
    put(ch.fields, w, 'minutes', minutes(pick(o, 'minutes', 'duration', 'duration_minutes', 'length', 'mins')), 'a duration');
    put(ch.fields, w, 'area', oneOf(pick(o, 'area', 'life_area', 'category'), AREA_IDS, AREA_SYNONYMS), 'an area');
    put(ch.fields, w, 'notes', text(pick(o, 'notes', 'note', 'details', 'description'), 1000), 'notes');
    put(ch.fields, w, 'done', bool(pick(o, 'done', 'completed', 'complete')), 'a done value');
    put(ch.fields, w, 'remind', remindValue(pick(o, 'remind', 'reminder', 'remind_before', 'remind_me', 'alert', 'notify')), 'a reminder');
    if (ch.fields.title === null) delete ch.fields.title;
    if (ch.fields.date === null) delete ch.fields.date; // a planner item always has a day
    const rep = pick(o, 'repeat', 'repeats', 'recurring', 'recurrence', 'frequency', 'cadence');
    if (rep !== undefined) {
      const r = oneOf(rep, Object.keys(REPEAT_COUNTS), REPEAT_SYNONYMS);
      if (ch.op === 'update' && r) w.push('Repeat only works on new items. Ignored it here.');
      else if (r === INVALID && rep !== false) w.push('Ignored a repeat the app couldn\'t read.');
      else if (r) ch.fields.repeat = r;
    }
    if (ch.op === 'create') {
      if (!ch.fields.title) return 'a new planner item with no title';
      if (!ch.fields.date) { ch.fields.date = isoDate(ctx.today); w.push('No date given. Set to today.'); }
      else if (ch.fields.date < isoDate(ctx.today)) w.push('This date is in the past.');
    }
    return ch;
  },

  portfolio(o) {
    const ch = base(o);
    if (typeof ch === 'string' || ch.op === 'delete') return typeof ch === 'string' ? `a portfolio entry (${ch})` : ch;
    const w = ch.warnings;
    put(ch.fields, w, 'section', oneOf(pick(o, 'section', 'category', 'type', 'kind'), PORTFOLIO_SECTIONS, PORTFOLIO_SYNONYMS), 'a section');
    put(ch.fields, w, 'title', line(pick(o, 'title', 'name', 'role', 'skill'), LIMITS.title), 'a title');
    put(ch.fields, w, 'description', text(pick(o, 'description', 'desc', 'details', 'summary', 'body'), 1000), 'a description');
    put(ch.fields, w, 'link', cleanUrl(pick(o, 'link', 'url', 'href')), 'a link');
    let tag = pick(o, 'tag', 'tags', 'label', 'tool', 'tools');
    if (Array.isArray(tag)) tag = tag.filter(t => typeof t === 'string').slice(0, 3).join(', ');
    put(ch.fields, w, 'tag', line(tag, 40), 'a tag');
    if (ch.fields.title === null) delete ch.fields.title;
    if (ch.fields.section === null) delete ch.fields.section;
    if (ch.op === 'create') {
      if (!ch.fields.title) return 'a new portfolio entry with no title';
      if (!ch.fields.section) { ch.fields.section = 'projects'; w.push('No section given. Put under Projects.'); }
    }
    return ch;
  },
};

// Life areas come in groups (area + section + actions + notes); each action
// and note becomes its own change so they can be ticked one by one.
function matchArea(v, catalog) {
  if (v === undefined || v === null) return v;
  const ids = catalog.length ? catalog.map(a => a.id) : AREA_IDS;
  const labelHit = catalog.find(a => normWord(a.label || '') === normWord(v));
  return labelHit ? labelHit.id : oneOf(v, ids, AREA_SYNONYMS);
}

export function matchSection(catalog, areaId, v) {
  if (v === undefined || v === null || v === '') return undefined;
  const w = normWord(v);
  const pool = catalog.filter(a => !areaId || a.id === areaId);
  const hit = (test) => {
    for (const a of pool) for (const s of a.sections) if (test(s)) return { area: a.id, section: s.title, screen: s.screen };
    return null;
  };
  return hit(s => normWord(s.title) === w || normWord(s.screen) === w || normWord(s.screen.replace(/Screen$/, '')) === w)
    || hit(s => normWord(s.title).includes(w) || w.includes(normWord(s.title)))
    || hit(s => (s.items || []).some(it => normWord(it) === w))
    || INVALID;
}

function readLifeAreaGroup(o, ctx, push, skip) {
  const cat = ctx.areaCatalog;
  let area = matchArea(pick(o, 'area', 'life_area', 'domain', 'category'), cat);
  if (area === INVALID) { skip('a life area group with an area the app doesn\'t have'); return; }
  const secRaw = pick(o, 'section', 'subsection', 'sub_section', 'screen', 'topic');
  let sec = matchSection(cat, area || null, secRaw);
  const unknownSection = sec === INVALID ? String(secRaw) : null;
  if (sec === INVALID) sec = null;
  if (!area && sec) area = sec.area;

  // A flat entry — { area, section, title, type } — is one action.
  const list = pick(o, 'actions', 'habits', 'steps', 'items');
  const actions = list !== undefined ? items(list) : ((o.title || o.ref || o.name) ? [o] : []);
  const fromHabits = 'habits' in o && !('actions' in o);
  const fromSteps = 'steps' in o && !('actions' in o);

  for (const raw of actions.slice(0, LIMITS.actions)) {
    const a = keyed(raw);
    if (!a) continue;
    const ch = base(a);
    if (typeof ch === 'string') { skip(`an action (${ch})`); continue; }
    ch.kind = 'action';
    if (ch.op !== 'delete') {
      put(ch.fields, ch.warnings, 'title', line(pick(a, 'title', 'name', 'action', 'habit', 'text'), LIMITS.actionTitle), 'a title');
      put(ch.fields, ch.warnings, 'why', line(pick(a, 'why', 'reason', 'description', 'because'), LIMITS.actionWhy), 'a reason');
      const t = oneOf(pick(a, 'type', 'tier', 'kind'), Object.keys(ACTION_TYPES), ACTION_SYNONYMS);
      put(ch.fields, ch.warnings, 'type', t === undefined && ch.op === 'create' ? (fromSteps ? 'step' : fromHabits ? 'habit' : undefined) : t, 'an action type');
      if (ch.fields.title === null) delete ch.fields.title;
      if (ch.fields.type === null) delete ch.fields.type;
      if (ch.op === 'create') {
        if (!ch.fields.title) { skip('a new action with no title'); continue; }
        if (!ch.fields.type) ch.fields.type = 'habit';
        const first = area && cat.find(x => x.id === area)?.sections?.[0];
        const place = sec || (first ? { area, section: first.title, screen: first.screen } : null);
        if (!place) { skip(`"${ch.fields.title}" (no life area given)`); continue; }
        if (!sec) {
          ch.warnings.push(unknownSection
            ? `There's no section called “${unknownSection}”. Put under ${place.section}.`
            : `No section given. Put under ${place.section}.`);
        }
        Object.assign(ch.fields, place);
      } else if (sec) {
        Object.assign(ch.fields, sec); // moving it to another section
      }
    }
    push('life_areas', ch);
  }
  if (actions.length > LIMITS.actions) skip(`all but the first ${LIMITS.actions} actions in one group`);

  for (const raw of items(pick(o, 'notes', 'note', 'reflections', 'journal')).slice(0, LIMITS.actions)) {
    const s = text(typeof raw === 'object' && raw ? pick(keyed(raw), 'text', 'body', 'note', 'title', 'content') : raw, 2000);
    if (typeof s !== 'string') continue;
    if (!area) { skip('a note with no life area'); continue; }
    push('life_areas', { kind: 'note', op: 'create', ref: null, fields: { area, ...(sec ? { section: sec.section, screen: sec.screen } : {}), text: s }, warnings: [] });
  }
}

// ─── The reply → changes ────────────────────────────────────────────────────

export const PARSE_ERRORS = {
  empty: 'Paste the AI’s reply first.',
  questions: 'It looks like the AI asked you some questions. Answer them in the chat, then copy its next reply.',
  no_block: 'Couldn’t find the code block in that. Copy the AI’s whole reply, or tap the copy button on its code box.',
  broken: 'The code block looks broken. Ask the AI: “Send the whole code block again.”',
  nothing: 'The code block didn’t have anything the app can use. Check the AI used the format from the prompt.',
};

function sectionsOf(root, defaultTarget) {
  if (Array.isArray(root)) return defaultTarget ? { [defaultTarget]: root } : null;
  if (!root || typeof root !== 'object') return null;
  for (const wrap of ['chill', 'data', 'changes', 'result']) {
    const inner = root[wrap];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) { root = inner; break; }
  }
  const out = {};
  for (const [k, v] of Object.entries(root)) {
    const key = SECTION_SYNONYMS[normKey(k)];
    if (!key) continue;
    const arr = Array.isArray(v) ? v : (v && typeof v === 'object' ? [v] : []);
    out[key] = (out[key] || []).concat(arr);
  }
  if (!Object.keys(out).length && defaultTarget && (root.title || root.name || root.ref)) out[defaultTarget] = [root];
  return Object.keys(out).length ? out : null;
}

export function parseReply(textIn, { today = new Date(), areaCatalog = [], defaultTarget = null } = {}) {
  const raw = String(textIn || '');
  if (!raw.trim()) return { ok: false, error: 'empty', message: PARSE_ERRORS.empty };
  const candidates = extractCandidates(raw);
  if (!candidates.length) {
    const code = raw.includes('?') ? 'questions' : 'no_block';
    return { ok: false, error: code, message: PARSE_ERRORS[code] };
  }

  let parsedSomething = false;
  for (const cand of candidates) {
    let root;
    let truncated = false;
    try {
      root = JSON.parse(cand);
    } catch {
      try { ({ value: root, truncated } = lenientParse(cand)); } catch { continue; }
    }
    parsedSomething = true;
    const sections = sectionsOf(root, defaultTarget);
    if (!sections) continue;

    const changes = [];
    const warnings = [];
    if (truncated) warnings.push('The reply looks cut off, so the last part may be missing. Ask the AI to "send the rest of the code block".');
    const ctx = { today, areaCatalog };
    let n = 0;
    const push = (target, ch) => { changes.push({ key: `${target}-${n++}`, target, children: [], ...ch }); };
    const skip = (why) => warnings.push(`Skipped ${why}.`);

    for (const target of TARGET_KEYS) {
      for (const rawItem of sections[target] || []) {
        if (changes.length >= LIMITS.changes) break;
        const o = keyed(rawItem);
        if (!o) continue;
        if (target === 'life_areas') { readLifeAreaGroup(o, ctx, push, skip); continue; }
        const ch = READERS[target](o, ctx);
        if (typeof ch === 'string') { warnings.push(`Skipped ${ch}.`); continue; }
        push(target, ch);
      }
    }
    if (changes.length >= LIMITS.changes) warnings.push(`Only the first ${LIMITS.changes} changes were read. Run the rest in a second batch.`);
    if (!changes.length) return { ok: false, error: 'nothing', message: PARSE_ERRORS.nothing, warnings };
    return { ok: true, changes, warnings, version: root && root.chill };
  }
  const code = parsedSomething ? 'nothing' : 'broken';
  return { ok: false, error: code, message: PARSE_ERRORS[code] };
}

// ─── Changes → matched to current rows ──────────────────────────────────────
// snapshot is loadSnapshot()'s output: each section as records in the same
// shape the reply uses, plus `id`. Projects carry tasks/notes/links, ideas
// carry petals, life_areas is a flat list of the person's own actions.

export const FIELD_LABELS = {
  title: 'Title', goal: 'Goal', type: 'Type', stage: 'Stage', next_step: 'Next step', description: 'Description',
  kind: 'Kind', body: 'Text', url: 'Link', tags: 'Tags', area: 'Area', date: 'Date', time: 'Time', minutes: 'Minutes',
  notes: 'Notes', done: 'Done', why: 'Why', section: 'Section', link: 'Link', tag: 'Tag', repeat: 'Repeat', text: 'Note', remind: 'Reminder',
};

const CHILD_LIST = { task: 'tasks', note: 'notes', link: 'links', petal: 'petals' };

function same(a, b) {
  const blank = (x) => x === null || x === undefined || x === '' || (Array.isArray(x) && !x.length);
  if (blank(a) && blank(b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') return !!a === !!b;
  return String(a ?? '').trim() === String(b ?? '').trim();
}

function findByRef(list, ref) {
  const hits = list.filter(x => String(x.id).toLowerCase().startsWith(ref));
  if (hits.length === 1) return { item: hits[0] };
  return { error: hits.length ? 'ambiguous' : 'missing' };
}

function diffFields(fields, current) {
  const diff = [];
  const kept = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'screen') continue; // travels with section
    if (same(current[k], v)) continue;
    diff.push({ field: k, from: current[k] ?? null, to: v });
    kept[k] = v;
    if (k === 'section' && fields.screen) kept.screen = fields.screen;
    if (k === 'section' && fields.area) kept.area = fields.area;
  }
  return { diff, fields: kept };
}

const missingText = (ref, what, err) => (err === 'ambiguous'
  ? `The ref ${ref} matches more than one ${what}, so it was left alone.`
  : `No ${what} with ref ${ref}. It may already be gone.`);

const SINGULAR = { projects: 'project', ideas: 'idea', vault: 'vault item', planner: 'planner item', life_areas: 'action', portfolio: 'portfolio entry' };

// status: 'ok' | 'missing' (ref matched nothing) | 'noop' (edit changes nothing)
export function resolveChanges(changes, snapshot) {
  return changes.map((ch) => {
    const r = { ...ch, warnings: [...ch.warnings], status: 'ok', diff: [], current: null, id: null, children: [] };
    const list = (snapshot[ch.target] || []);

    if (ch.kind === 'note' && ch.target === 'life_areas') { r.children = []; return r; }

    if (ch.ref) {
      const hit = findByRef(list, ch.ref);
      if (hit.error) {
        r.status = 'missing';
        r.warnings.push(missingText(ch.ref, SINGULAR[ch.target], hit.error));
        return r;
      }
      r.current = hit.item;
      r.id = hit.item.id;
    } else if (ch.op === 'create' && (ch.target === 'projects' || ch.target === 'ideas') && ch.fields.title) {
      // No ref, but the exact title of something that exists: the AI didn't
      // see the data (or ignored the ref), so add to it rather than make a twin.
      const twins = list.filter(x => titleKey(x.title) === titleKey(ch.fields.title));
      if (twins.length === 1) {
        r.op = 'update';
        r.current = twins[0];
        r.id = twins[0].id;
        r.merged = true;
        const fill = {};
        for (const [k, v] of Object.entries(ch.fields)) if (k !== 'title' && !twins[0][k]) fill[k] = v;
        r.fields = fill;
        r.warnings.push(`You already have a ${SINGULAR[ch.target]} called “${twins[0].title}”, so this adds to it instead of making a copy.`);
      }
    }

    if (r.op === 'update') {
      const d = diffFields(r.fields, r.current);
      r.diff = d.diff;
      r.fields = d.fields;
    }

    // Children resolve inside their parent.
    const parentKids = r.current || {};
    for (const kid of ch.children || []) {
      const k = { ...kid, warnings: [...(kid.warnings || [])], status: 'ok', diff: [], current: null, id: null };
      if (r.op === 'create' || !kid.ref) {
        if (kid.op !== 'create') {
          if (r.op === 'create') k.warnings.push('Its parent is new, so this was added as new.');
          if (kid.op === 'delete') { k.status = 'missing'; }
          else k.op = 'create';
          k.ref = null;
        }
        if (k.op === 'create' && !k.fields.title && kid.kind !== 'note') { k.status = 'missing'; k.warnings.push(`A ${kid.kind} with no title.`); }
      } else {
        const hit = findByRef(parentKids[CHILD_LIST[kid.kind]] || [], kid.ref);
        if (hit.error) {
          k.status = 'missing';
          k.warnings.push(missingText(kid.ref, kid.kind, hit.error));
        } else {
          k.current = hit.item;
          k.id = hit.item.id;
          if (k.op === 'update') {
            const d = diffFields(k.fields, k.current);
            k.diff = d.diff;
            k.fields = d.fields;
            if (!d.diff.length) k.status = 'noop';
          }
        }
      }
      r.children.push(k);
    }

    const liveKids = r.children.filter(k => k.status === 'ok');
    if (r.op === 'update' && !r.diff.length && !liveKids.length) r.status = 'noop';
    return r;
  });
}

// What a resolved list amounts to, for the Apply button.
export function countChanges(resolved, selected = null) {
  const c = { create: 0, update: 0, delete: 0 };
  for (const r of resolved) {
    if (r.status !== 'ok' || (selected && !selected.has(r.key))) continue;
    if (r.op === 'update' && !r.diff.length) {
      // an edit that only touches children counts as those children
    } else {
      c[r.op] += r.op === 'create' && r.target === 'planner' ? (REPEAT_COUNTS[r.fields.repeat] || 1) : 1;
    }
    for (const k of r.children) if (k.status === 'ok') c[k.op] += 1;
  }
  return c;
}
