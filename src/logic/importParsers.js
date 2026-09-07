// src/logic/importParsers.js
// Deterministic import parsing — no AI call, no API key needed. Handles the
// structured formats (CSV, browser bookmark HTML exports, markdown link
// lists, plain URL dumps) instantly and for free. Only genuinely freeform
// text (a paragraph of notes with no recognizable structure) falls back to
// the AI enrichment pass in ImportScreen.js.

function titleFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname !== '/' ? u.pathname.replace(/\/$/, '') : '';
    return u.hostname.replace(/^www\./, '') + path;
  } catch {
    return url;
  }
}

function guessTypeFromUrl(url) {
  if (!url) return 'note';
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return 'video';
  if (/github\.com|docs\.google\.com|notion\.so|figma\.com|npmjs\.com/i.test(url)) return 'resource';
  return 'link';
}

const VALID_TYPES = ['note', 'idea', 'link', 'video', 'resource', 'task'];
function normalizeType(raw, url) {
  const t = (raw || '').trim().toLowerCase();
  if (VALID_TYPES.includes(t)) return t;
  if (t === 'tool' || t === 'tools') return 'resource';
  if (t === 'bookmark' || t === 'article') return 'link';
  return guessTypeFromUrl(url);
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// Collapses cosmetic differences (scheme, www, trailing slash, case) so
// "https://Website.com/", "http://www.website.com" and "website.com" are all
// recognized as the same link — used both for within-paste dedup here and
// for cross-checking against what's already saved (see ImportScreen.js).
export function normalizeUrlForDedupe(url) {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    return `${host}${path}${u.search}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

function dedupeByUrl(items) {
  const seen = new Set();
  return items.filter(it => {
    if (!it.url) return true;
    const key = normalizeUrlForDedupe(it.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Honors quoted commas — "Title, with a comma",https://...
function splitCSVLine(line) {
  const out = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function splitTags(raw) {
  if (!raw) return [];
  return raw.split(/[;,]/).map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 4);
}

const blankItem = () => ({ title: '', url: null, type: 'link', description: '', tags: [], suggested_destination: null });

// Loosely validates a token as a hostname (with optional scheme/path), so
// plain sentences like "Note: remember this" aren't mistaken for a site.
const DOMAIN_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;

// Finds every "site.com" (or "https://site.com/path") anchor anywhere in a
// blob of text — NOT split line-by-line first, because a pasted list can
// arrive with a real newline before every entry, no newlines at all (one
// run-on paragraph), or something in between depending on where it was
// copied from. Scanning the whole string for domain-shaped tokens sidesteps
// having to guess which of those it is.
function findSiteAnchors(text) {
  const re = /(^|\s)((?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const anchors = [];
  let m;
  while ((m = re.exec(text))) {
    const site = m[2];
    if (!DOMAIN_RE.test(site)) continue;
    const start = m.index + m[1].length;
    anchors.push({ site, start, end: start + site.length });
  }
  return anchors;
}

// ─── Format detection ──────────────────────────────────────────────────────
export function detectFormat(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return 'freeform';

  if (/<!DOCTYPE NETSCAPE-Bookmark-file-1>/i.test(trimmed) || /<A\s+HREF="/i.test(trimmed)) return 'bookmarks';

  const lines = trimmed.split(/\r?\n/).filter(Boolean);

  if (lines.length >= 2) {
    const firstCommaCount = (lines[0].match(/,/g) || []).length;
    if (firstCommaCount >= 1) {
      const sample = lines.slice(1, Math.min(6, lines.length));
      const consistent = sample.every(l => Math.abs((l.match(/,/g) || []).length - firstCommaCount) <= 1);
      if (consistent) return 'csv';
    }
  }

  if (/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/.test(trimmed)) return 'markdown';

  // "site.com - what it does" / "site.com: description" / "site.com is a
  // great tool" — a site (with or without http://) followed by a
  // description, with or without a separator between them, one per line or
  // all run together in a paragraph. Two or more site-shaped tokens is a
  // strong enough signal to prefer this over the loose "urls" catch or AI.
  if (findSiteAnchors(trimmed).length >= 2) return 'sitelist';

  const urlLines = lines.filter(l => /^https?:\/\/\S+$/.test(l.trim()));
  if (lines.length > 0 && urlLines.length / lines.length > 0.6) return 'urls';

  // A block of text that still contains some URLs — treat as a URL dump
  // mixed with prose; the deterministic URL extractor still helps here.
  if ((trimmed.match(/https?:\/\/[^\s"'<>)\]]+/g) || []).length > 0) return 'urls';

  return 'freeform';
}

// ─── Per-format parsers ────────────────────────────────────────────────────
export function parseUrlList(text) {
  const urls = text.match(/https?:\/\/[^\s"'<>)\]]+/g) || [];
  const items = urls.map(url => ({ ...blankItem(), title: titleFromUrl(url), url, type: guessTypeFromUrl(url) }));
  return dedupeByUrl(items);
}

// Also picks up a trailing description for each link — handles both a
// tidy one-link-per-line list AND a run-on paragraph like
// "[site.com](url) - what it does. [site2.com](url2) does this other
// thing." by taking whatever text sits between one link and the next as
// that first link's description.
export function parseMarkdownLinks(text) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const matches = [];
  let m;
  while ((m = re.exec(text))) {
    matches.push({ title: m[1].trim(), url: m[2], start: m.index, end: re.lastIndex });
  }
  const items = matches.map((mm, idx) => {
    const nextStart = idx + 1 < matches.length ? matches[idx + 1].start : text.length;
    const raw = text.slice(mm.end, nextStart);
    // Strip a leading separator (-, –, —, :, |) if present, then collapse
    // any internal line breaks/whitespace into single spaces.
    const description = raw.replace(/^\s*[-–—:|]?\s*/, '').replace(/\s+/g, ' ').trim();
    return {
      ...blankItem(),
      title: mm.title || titleFromUrl(mm.url),
      url: mm.url,
      type: guessTypeFromUrl(mm.url),
      description,
    };
  });
  return dedupeByUrl(items);
}

export function parseBookmarksHTML(text) {
  const items = [];
  const re = /<A[^>]*HREF="([^"]+)"[^>]*>([^<]*)<\/A>/gi;
  let m;
  while ((m = re.exec(text))) {
    const url = m[1];
    const title = decodeEntities(m[2].trim()) || titleFromUrl(url);
    items.push({ ...blankItem(), title, url, type: guessTypeFromUrl(url) });
  }
  return dedupeByUrl(items);
}

// "site.com - what it does" — no AI, no scheme required, and no assumption
// about line breaks (one per line, or a single run-on paragraph, both work
// the same way — see findSiteAnchors above). The description becomes the
// capture's body/notes and the URL is inferred straight from the site
// (https:// is added automatically if missing).
export function parseSiteDescriptionList(text) {
  const anchors = findSiteAnchors(text);
  const items = anchors.map((a, idx) => {
    const nextStart = idx + 1 < anchors.length ? anchors[idx + 1].start : text.length;
    const raw = text.slice(a.end, nextStart);
    // Strip a leading separator (-, –, —, :, |) if present, then collapse
    // any internal line breaks/whitespace into single spaces.
    const description = raw.replace(/^\s*[-–—:|]?\s*/, '').replace(/\s+/g, ' ').trim();
    const url = /^https?:\/\//i.test(a.site) ? a.site : `https://${a.site}`;
    return {
      ...blankItem(),
      title: titleFromUrl(url),
      url,
      type: guessTypeFromUrl(url),
      description,
    };
  });
  return dedupeByUrl(items);
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const firstCols = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const knownCols = ['title', 'url', 'type', 'tags', 'description', 'notes'];
  const hasHeader = firstCols.some(h => knownCols.includes(h));

  const idx = (name) => firstCols.indexOf(name);
  const titleIdx = hasHeader && idx('title') >= 0 ? idx('title') : 0;
  const urlIdx = hasHeader ? idx('url') : -1;
  const typeIdx = hasHeader ? idx('type') : -1;
  const tagsIdx = hasHeader ? idx('tags') : -1;
  const descIdx = hasHeader ? (idx('description') >= 0 ? idx('description') : idx('notes')) : -1;

  const dataLines = hasHeader ? lines.slice(1) : lines;

  const items = dataLines.map(line => {
    const cols = splitCSVLine(line);
    const url = (urlIdx >= 0 ? cols[urlIdx] : cols.find(c => /^https?:\/\//.test(c.trim())))?.trim() || null;
    const title = (titleIdx >= 0 ? cols[titleIdx] : '')?.trim() || titleFromUrl(url) || 'Untitled';
    return {
      title,
      url,
      type: typeIdx >= 0 ? normalizeType(cols[typeIdx], url) : guessTypeFromUrl(url),
      description: descIdx >= 0 ? (cols[descIdx] || '').trim() : '',
      tags: tagsIdx >= 0 ? splitTags(cols[tagsIdx]) : [],
      suggested_destination: null,
    };
  }).filter(it => it.title);
  return dedupeByUrl(items);
}

// ─── Unified entry point ───────────────────────────────────────────────────
// Returns { items, format, needsAI }. needsAI is true only for freeform text
// with no recognizable structure — everything else is parsed for free.
export function parseDeterministic(text, format) {
  const fmt = format === 'auto' ? detectFormat(text) : format;
  switch (fmt) {
    case 'csv':       return { items: parseCSV(text), format: 'csv', needsAI: false };
    case 'bookmarks': return { items: parseBookmarksHTML(text), format: 'bookmarks', needsAI: false };
    case 'markdown':  return { items: parseMarkdownLinks(text), format: 'markdown', needsAI: false };
    case 'sitelist':  return { items: parseSiteDescriptionList(text), format: 'sitelist', needsAI: false };
    case 'urls':       return { items: parseUrlList(text), format: 'urls', needsAI: false };
    default:           return { items: [], format: 'freeform', needsAI: true };
  }
}
