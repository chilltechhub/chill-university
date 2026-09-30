// src/logic/linkSources.js
// Knows the sites people save things from — what kind of thing a link is,
// what to call it when the page itself won't say, and where its useful text
// lives so the person can copy it in for planning.
//
// Most of these sites won't let an app read the page (Instagram, Reddit and
// Etsy block it outright), so nothing here promises a transcript. It gives a
// readable title from the address itself and tells the person exactly where
// to copy the words from. YouTube and TikTok have open oEmbed endpoints,
// used by fetchUrlMeta in src/api/captureService.js.
//
// noLookup: the site refuses page lookups (Instagram, Reddit and Etsy failed
// every try in Sept 2026; Facebook puts posts behind a login), so asking
// only makes the person wait for the timeout. The address gives the title.
//
// No imports on purpose: scripts/check-link-sources.mjs loads this under node.

// kind: what the link points at, which decides the capture type and how the
// AI is asked to plan it.
//   video   a video; its words are in a transcript or captions
//   post    a forum or social post; its words are the post and replies
//   listing something for sale
//   model   a 3D model page; its words are the description and print settings
//   page    anything else
export const SOURCES = [
  { key: 'youtube',   label: 'YouTube',   kind: 'video',   hosts: ['youtube.com', 'youtu.be', 'm.youtube.com'],
    textLabel: 'Transcript',
    howTo: 'On YouTube, open the description (…more) and tap Show transcript. Select all of it and copy.' },
  { key: 'instagram', label: 'Instagram', kind: 'video',   noLookup: true, hosts: ['instagram.com', 'instagr.am'],
    textLabel: 'Caption or what it said',
    howTo: 'Instagram won’t let apps read posts. Copy the caption, or jot down the steps you remember. Rough notes are fine.' },
  { key: 'tiktok',    label: 'TikTok',    kind: 'video',   hosts: ['tiktok.com', 'vm.tiktok.com'],
    textLabel: 'Caption or what it said',
    howTo: 'TikTok won’t let apps read videos. Jot down the steps you remember, or copy anything in the caption and comments.' },
  { key: 'facebook',  label: 'Facebook',  kind: 'post',    noLookup: true, hosts: ['facebook.com', 'fb.watch', 'm.facebook.com'],
    textLabel: 'Post text',
    howTo: 'Copy the post text, or jot down what the video showed.' },
  { key: 'x',         label: 'X',         kind: 'post',    hosts: ['x.com', 'twitter.com'],
    textLabel: 'Post text',
    howTo: 'Copy the post (and the thread, if it has one).' },
  { key: 'reddit',    label: 'Reddit',    kind: 'post',    noLookup: true, hosts: ['reddit.com', 'redd.it', 'old.reddit.com'],
    textLabel: 'Post and useful comments',
    howTo: 'Open the post, copy its text, and add any comments with good advice.' },
  { key: 'pinterest', label: 'Pinterest', kind: 'post',    hosts: ['pinterest.com', 'pin.it'],
    textLabel: 'Pin details',
    howTo: 'Copy the pin’s description. If it links to a page, copy the useful part of that page too.' },
  { key: 'etsy',      label: 'Etsy',      kind: 'listing', noLookup: true, hosts: ['etsy.com', 'etsy.me'],
    textLabel: 'Listing details',
    howTo: 'Copy the item details and description: size, materials, price, anything you’d want to copy or change.' },
  { key: 'amazon',    label: 'Amazon',    kind: 'listing', hosts: ['amazon.com', 'a.co', 'amzn.to'],
    textLabel: 'Listing details',
    howTo: 'Copy the product details you care about: size, specs, price.' },
  { key: 'printables',    label: 'Printables',    kind: 'model', hosts: ['printables.com'],
    textLabel: 'Description and print settings',
    howTo: 'Copy the model’s description and print settings (printer, filament, supports, infill, layer height).' },
  { key: 'thingiverse',   label: 'Thingiverse',   kind: 'model', hosts: ['thingiverse.com'],
    textLabel: 'Description and print settings',
    howTo: 'Copy the Summary and Print Settings sections.' },
  { key: 'makerworld',    label: 'MakerWorld',    kind: 'model', hosts: ['makerworld.com'],
    textLabel: 'Description and print profile',
    howTo: 'Copy the description and the print profile details (plate, filament, time).' },
  { key: 'thangs',        label: 'Thangs',        kind: 'model', hosts: ['thangs.com'],
    textLabel: 'Description and print settings',
    howTo: 'Copy the model description and any print notes.' },
  { key: 'cults3d',       label: 'Cults',         kind: 'model', hosts: ['cults3d.com'],
    textLabel: 'Description and print settings',
    howTo: 'Copy the description and the print settings.' },
  { key: 'myminifactory', label: 'MyMiniFactory', kind: 'model', hosts: ['myminifactory.com'],
    textLabel: 'Description and print settings',
    howTo: 'Copy the description and print settings.' },
];

const WEB = {
  key: 'web', label: 'Web page', kind: 'page', hosts: [],
  textLabel: 'The useful part',
  howTo: 'Copy the part of the page you want to use: the steps, the list, the measurements.',
};

const BY_KEY = Object.fromEntries([...SOURCES, WEB].map(s => [s.key, s]));

// What the capture's `type` column should be for each kind.
export const CAPTURE_TYPE_FOR_KIND = { video: 'video', post: 'link', listing: 'resource', model: 'resource', page: 'link' };

// Nouns for "a YouTube video", "a Reddit post" ...
const NOUN = { video: 'video', post: 'post', listing: 'listing', model: '3D model', page: 'page' };

// How the AI is told to treat the source, by kind.
export const PLAN_HINTS = {
  video: 'It is a video, so the text is a transcript or my rough notes of it. Transcripts ramble: pull out the actual steps, materials, tools, measurements and costs, and skip the chatter.',
  post: 'It is a post, maybe with replies. Use the advice people agree on and note anything disputed as a question.',
  listing: 'It is something for sale. I may want to buy it, or make my own version. If it is not clear which, ask me.',
  model: 'It is a 3D model to print. Plan the print (printer, filament, settings, supports), any post-processing, and assembly if it has parts.',
  page: 'It is a web page. Use only what is in the text I give you.',
};

export function hostOf(url) {
  const m = String(url || '').trim().match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#:]+)/i);
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
}

export function detectSource(url) {
  const host = hostOf(url);
  if (!host) return WEB;
  return SOURCES.find(s => s.hosts.some(h => host === h || host.endsWith(`.${h}`))) || WEB;
}

export function sourceByKey(key) { return BY_KEY[key] || WEB; }

export function sourceNoun(src) { return `${src.label === 'Web page' ? 'web' : src.label} ${NOUN[src.kind] || 'page'}`; }

const STOP_SEGMENTS = new Set([
  'watch', 'shorts', 'reel', 'reels', 'p', 'tv', 'video', 'videos', 'comments', 'r', 'u', 'user', 'listing', 'model', 'models',
  'thing', 'pin', 'status', 'dp', 'gp', 'product', 'en', 'de', 'fr', 'es', '3d-model', 'designer', 'post', 'posts', 'item', 'itm',
  'www', 'index', 'html', 'php', 'amp', 's',
]);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// A readable title from the address alone: the longest slug-like piece of
// the path ("chicken-coop-plans-for-8-hens" → "Chicken coop plans for 8
// hens"). Null when the path is only ids.
export function titleFromUrl(url) {
  const m = String(url || '').match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]+([^?#]*)/i);
  if (!m) return null;
  let best = null;
  for (const raw of m[1].split('/')) {
    let seg;
    try { seg = decodeURIComponent(raw); } catch { seg = raw; }
    seg = seg.replace(/\.(html?|php|aspx?)$/i, '');
    if (!seg || STOP_SEGMENTS.has(seg.toLowerCase())) continue;
    // "3161-3d-benchy" → "3d-benchy"; "coop-plans-a1b2c3d4" keeps its words.
    seg = seg.replace(/^\d+[-_]/, '');
    const words = seg.split(/[-_+]+/).filter(Boolean);
    // Ids mix letters and digits ("dQw4w9WgXcQ", "a1b2c3d4"); words and
    // sizes ("3d", "8x10", "12mm") don't, or are short.
    const idLike = (w) => w.length >= 6 && /\d/.test(w) && /[a-z]/i.test(w);
    const wordy = words.filter(w => (/[a-z]/i.test(w) && !idLike(w)) || /^\d{1,4}$/.test(w));
    if (wordy.length < 2 || !wordy.some(w => /[a-z]/i.test(w))) continue;
    const text = wordy.join(' ');
    if (!best || text.length > best.length) best = text;
  }
  if (!best) return null;
  return cap(best.toLowerCase()).slice(0, 100);
}

// A title the page gave that says nothing about this link: the site's own
// name, its homepage tagline, or the address.
export function isGenericTitle(title, url) {
  const t = String(title || '').trim().toLowerCase();
  if (!t) return true;
  const src = detectSource(url);
  const host = hostOf(url);
  if (t === host || t === `www.${host}` || t === String(url).toLowerCase()) return true;
  const brand = src.label.toLowerCase();
  if (src.key !== 'web' && (t === brand || [' -', ' |', ':', ' –', ' —'].some(sep => t.startsWith(brand + sep)))) return true;
  return /^(log ?in|sign ?in|just a moment|access denied|blocked|attention required|page not found|404)\b/.test(t);
}

// The fallback title when nothing better is known: "Reddit post" plus
// whatever the address says.
export function fallbackTitle(url) {
  const src = detectSource(url);
  const fromPath = titleFromUrl(url);
  if (fromPath) return fromPath;
  return src.key === 'web' ? (hostOf(url) || 'Saved link') : `${cap(sourceNoun(src))}`;
}
