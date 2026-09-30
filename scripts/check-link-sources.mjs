// scripts/check-link-sources.mjs
//
// Checks src/logic/linkSources.js: links from the sites people save things
// from are recognised (with subdomains and short links), each gets the right
// kind, a readable title comes out of the address when the page won't give
// one, and a site's own name or a login wall is never kept as a title.
//
// Run: node scripts/check-link-sources.mjs   (or `npm run check`)

import { readFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/logic/linkSources.js', import.meta.url), 'utf8');
const L = await import('data:text/javascript,' + encodeURIComponent(src));

const problems = [];
let passed = 0;
const check = (name, cond, detail = '') => { if (cond) passed++; else problems.push(`${name}${detail ? ` — ${detail}` : ''}`); };

// url → [site key, kind, title from the address]
const CASES = [
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'video', 'YouTube video'],
  ['https://youtu.be/dQw4w9WgXcQ', 'youtube', 'video', 'YouTube video'],
  ['https://m.youtube.com/shorts/abc123XYZ90', 'youtube', 'video', 'YouTube video'],
  ['https://www.instagram.com/reel/C1Qm3yXr5aB/', 'instagram', 'video', 'Instagram video'],
  ['https://www.tiktok.com/@homestead/video/6718335390845095173', 'tiktok', 'video', 'TikTok video'],
  ['https://www.reddit.com/r/homestead/comments/1c6x1z3/our_first_year_homesteading_on_2_acres/', 'reddit', 'post', 'Our first year homesteading on 2 acres'],
  ['https://old.reddit.com/r/3Dprinting/comments/abc/', 'reddit', 'post', 'Reddit post'],
  ['https://www.etsy.com/listing/1052286434/chicken-coop-plans-for-8-hens-pdf', 'etsy', 'listing', 'Chicken coop plans for 8 hens pdf'],
  ['https://www.printables.com/model/3161-3d-benchy', 'printables', 'model', '3d benchy'],
  ['https://www.thingiverse.com/thing:763622', 'thingiverse', 'model', 'Thingiverse 3D model'],
  ['https://makerworld.com/en/models/12345-modular-drawer-organizer', 'makerworld', 'model', 'Modular drawer organizer'],
  ['https://cults3d.com/en/3d-model/home/planter-self-watering', 'cults3d', 'model', 'Planter self watering'],
  ['https://thangs.com/designer/foo/3d-model/cable-clip-123456', 'thangs', 'model', 'Cable clip'],
  ['https://www.pinterest.com/pin/123456789/', 'pinterest', 'post', 'Pinterest post'],
  ['https://example.com/blog/how-to-build-raised-garden-beds', 'web', 'page', 'How to build raised garden beds'],
  ['https://notyoutube.com/watch?v=1', 'web', 'page', 'notyoutube.com'],
];
for (const [url, key, kind, title] of CASES) {
  const s = L.detectSource(url);
  check(`site: ${url}`, s.key === key && s.kind === kind, `${s.key}/${s.kind}`);
  check(`title: ${url}`, L.fallbackTitle(url) === title, JSON.stringify(L.fallbackTitle(url)));
}

check('every source has copy-it-here help', L.SOURCES.every(s => s.howTo && s.textLabel && L.PLAN_HINTS[s.kind]));
check('every kind has a capture type', L.SOURCES.every(s => L.CAPTURE_TYPE_FOR_KIND[s.kind]));

check('generic: site name', L.isGenericTitle('Instagram', 'https://instagram.com/p/x'));
check('generic: site tagline', L.isGenericTitle('MakerWorld: Download Free 3D Models', 'https://makerworld.com/en/models/1'));
check('generic: login wall', L.isGenericTitle('Log in • Instagram', 'https://instagram.com/p/x'));
check('generic: blocked page', L.isGenericTitle('Blocked', 'https://www.reddit.com/r/x/comments/y/'));
check('generic: empty', L.isGenericTitle('', 'https://example.com'));
check('real title kept', !L.isGenericTitle('How I built a $200 chicken coop', 'https://www.youtube.com/watch?v=1'));
check('real title that mentions the site kept', !L.isGenericTitle('My YouTube setup tour', 'https://www.youtube.com/watch?v=1'));

if (problems.length) {
  console.error(`check-link-sources: ${problems.length} problem(s), ${passed} passed\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check-link-sources: all ${passed} checks passed.`);
