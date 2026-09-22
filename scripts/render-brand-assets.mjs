// Renders the Deskartes pencil-D mark to the app icon / splash PNGs.
// Source of truth for the icon: edit the mark here, then
//   node scripts/render-brand-assets.mjs assets/brand
// and copy the PNGs into assets/. Uses Playwright's Chromium (devDependency).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

// Mark drawn in a 400x400 box; silhouette used to cut the gap into the D.
const PENCIL = 'M117,14 L152,95 V343 Q152,355 140,355 H94 Q82,355 82,343 V95 Z';
const mark = (p) => `
  <defs>
    <linearGradient id="bowl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.bowlTop}"/><stop offset="1" stop-color="${p.bowlBot}"/>
    </linearGradient>
    <mask id="gap" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
      <rect width="400" height="400" fill="#fff"/>
      <path d="${PENCIL}" fill="#000" stroke="#000" stroke-width="18" stroke-linejoin="round"/>
    </mask>
    <clipPath id="pc"><path d="${PENCIL}"/></clipPath>
  </defs>
  <path mask="url(#gap)" fill="url(#bowl)"
        d="M150,45 H212 A155,155 0 0 1 212,355 H161 V305 H212 A105,105 0 0 0 212,95 H150 Z"/>
  <g clip-path="url(#pc)">
    <rect x="70" y="0" width="100" height="400" fill="${p.wood}"/>
    <path fill="${p.body}" d="M82,104 Q93.7,86 105.3,104 Q117,86 128.7,104 Q140.3,86 152,104 V400 H82 Z"/>
    <path fill="${p.shade}" d="M128.7,104 Q140.3,86 152,104 V400 H133 Z"/>
    <path fill="${p.lead}" d="M117,14 L130,44 H104 Z"/>
    <rect x="82" y="281" width="70" height="40" fill="${p.ferrule}"/>
    <rect x="82" y="290" width="70" height="4" fill="${p.stripe}"/>
    <rect x="82" y="300" width="70" height="4" fill="${p.stripe}"/>
    <rect x="82" y="310" width="70" height="4" fill="${p.stripe}"/>
    <rect x="82" y="321" width="70" height="40" fill="${p.eraser}"/>
  </g>`;

const LIGHT = { bowlTop: '#1c6880', bowlBot: '#175a6d', body: '#1c6880', shade: '#16586e',
  wood: '#f8d1aa', lead: '#485158', ferrule: '#eef2f3', stripe: '#c3ced1', eraser: '#ec7c92' };
// Brighter teal for the dark splash, so the mark doesn't sink into #12161f.
const DARK = { ...LIGHT, bowlTop: '#3a9bb8', bowlBot: '#2f87a2', body: '#3a9bb8', shade: '#2f87a2' };

// scale = fraction of the canvas the 400-box mark fills; bg = null → transparent
const svg = (size, palette, scale, bg) => {
  const s = (size * scale) / 400;
  const off = (size - 400 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    <g transform="translate(${off - 24.5 * s},${off + 15.5 * s}) scale(${s})">${mark(palette)}</g></svg>`;
};

const PAPER = '#fafbf5';
const jobs = [
  ['icon.png',             svg(1024, LIGHT, 0.70, PAPER)],  // iOS: opaque, OS rounds corners
  ['adaptive-icon.png',    svg(1024, LIGHT, 0.56, null)],   // Android fg: inside the 66% safe zone
  ['splash-icon.png',      svg(1024, LIGHT, 0.80, null)],
  ['splash-icon-dark.png', svg(1024, DARK,  0.80, null)],
  ['favicon.png',          svg(48,   LIGHT, 0.86, PAPER)],
  ['mark.svg',             svg(400,  LIGHT, 1.00, null)],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, code] of jobs) {
  if (name.endsWith('.svg')) { writeFileSync(`${OUT}/${name}`, code); continue; }
  const size = Number(code.match(/width="(\d+)"/)[1]);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${code}</body></html>`);
  await page.screenshot({ path: `${OUT}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', name);
}
await browser.close();
