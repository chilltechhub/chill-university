// src/logic/studio.js
// How the Studio ties into the rest of someone's app: their pet in what
// they make, what their Builds say about them (sparks), and the trophies a
// mastered Build puts in their room. Pure, like builds.js, so
// scripts/check-builds.mjs covers it.
//
// Sparks are the "find yourself" half (docs/north-star.md: passion is
// built, not found). Nobody is asked what they're into; the app notices
// which mediums they come back to and change things in, and says so in
// their own numbers.
import { BUILD_KINDS, BUILD_KIND_MAP } from '../data/builds';
import { receipt, isMastered } from './builds';

/* ── Your pet, in what you make ──────────────────────────────────────── */

// Which emoji stands in for a pet inside a made thing (an HTML file can't
// carry the pixel sprite), and what it catches in the game. First match
// on the pet's id or name wins.
const PET_LOOKS = [
  [/robot|unit|beak|fin|guard|wing|raider|fang|hide|claw|neck/, '🤖', '🔩'],
  [/cat|kitten|mochi|calico|siamese|bengal|sphinx|tabby/, '🐱', '🐟'],
  [/pup|dog|retriever/, '🐶', '🦴'],
  [/rabbit/, '🐰', '🥕'],
  [/fox/, '🦊', '🍇'],
  [/wolf/, '🐺', '🍖'],
  [/lion/, '🦁', '🍖'],
  [/bear/, '🐻', '🍯'],
  [/panda/, '🐼', '🎋'],
  [/pig/, '🐷', '🍎'],
  [/rat/, '🐭', '🧀'],
  [/frog/, '🐸', '🪰'],
  [/crow|bird/, '🐦', '🫐'],
  [/fairy/, '🧚', '✨'],
  [/jelly/, '🪼', '🫧'],
  [/naga/, '🐍', '🥚'],
  [/spider/, '🕷️', '🪰'],
];

// { name, emoji, treat } for the equipped pet, or null with no pet yet.
// `nickname` is what they named it (usePetCare), when they have.
export function petLook(pet, nickname) {
  if (!pet) return null;
  const key = `${pet.id || ''} ${pet.name || ''}`.toLowerCase();
  const hit = PET_LOOKS.find(([re]) => re.test(key));
  return { name: nickname || pet.name || 'Your pet', emoji: hit ? hit[1] : '🐾', treat: hit ? hit[2] : '⭐' };
}

/* ── Sparks: what your Builds say about you ──────────────────────────── */

// Per medium: how many Builds, how many parts they changed, how many
// Builds they took all the way. Weighted toward doing over starting.
export function sparks(builds = []) {
  const by = {};
  for (const b of builds) {
    const kind = BUILD_KIND_MAP[b?.kind];
    if (!kind) continue;
    const r = receipt(b);
    const row = by[kind.id] || (by[kind.id] = { kind: kind.id, medium: kind.medium, icon: kind.icon, builds: 0, changed: 0, mastered: 0 });
    row.builds += 1;
    row.changed += r.changed;
    row.mastered += isMastered(b) ? 1 : 0;
  }
  return Object.values(by)
    .map(row => ({ ...row, score: row.builds + row.changed + row.mastered * 3 }))
    .sort((a, b) => b.score - a.score || a.medium.localeCompare(b.medium));
}

// A lean needs real doing behind it: coming BACK (two Builds or more in
// the medium) and a score of 5, which two Builds with one taken all the
// way reach. And it has to stand out: twice the next medium.
const LEAN_AT = 5;
const leans = (top, next) => !!top && top.builds >= 2 && top.score >= LEAN_AT && (!next || top.score >= next.score * 2);

// One mentor line about them, from their sparks. Never a verdict on who
// they are, only what they keep doing; a single Build proves nothing yet.
export function sparkLine(builds = []) {
  const list = sparks(builds);
  if (!list.length) return 'Make one thing. **Interest follows doing.**';
  const tried = list.length;
  const [top, next] = list;
  const untried = BUILD_KINDS.length - tried;
  if (leans(top, next)) {
    return `You keep coming back to **${top.medium}**. That's worth following.`;
  }
  if (tried === 1) return `You've tried **${top.medium}**. Try a different one: you find out what you like by comparing.`;
  if (untried > 0) return `You've made things in **${tried} mediums**. ${untried} left to try.`;
  return `You've tried **every medium**. The one you change most is **${top.medium}**.`;
}

// The medium they lean toward, or null while it's too early to tell.
export function leaningMedium(builds = []) {
  const [top, next] = sparks(builds);
  return leans(top, next) ? top : null;
}

/* ── Trophies: a mastered Build shows up in your room ────────────────── */

export function trophyArts(builds = []) {
  const arts = new Set();
  for (const b of builds) {
    const kind = BUILD_KIND_MAP[b?.kind];
    if (kind?.trophy && isMastered(b)) arts.add(kind.trophy.art);
  }
  return arts;
}

/* ── Your companion's lines ──────────────────────────────────────────── */

// What the pet says beside the Studio, by moment. Mentor voice: name what
// they did, never what they didn't. `{pet}` is the pet's name.
const LINES = {
  empty: ['Let’s make something. **Pick one.** It takes a minute.', 'Most people never start. **You can today.**'],
  fresh: ['**It works already.** Now let’s see how.', 'The app made it. **Tap a part** and it starts being yours.'],
  changed: ['**You changed that.** It’s yours now.', 'See that? **One change**, whole new feel.'],
  mastered: ['**You get it.** The upgrades are open.', 'That part’s **yours for good.**'],
  done: [
    '**You built this.** Take it home and show someone.',
    'Every part, understood. **Most people never get here.**',
    '**No license. No subscription.** You made it, and it’s yours.',
  ],
};

// Same moment → same line on the same day, so it doesn't flicker.
export function companionLine(moment, seed = '') {
  const list = LINES[moment] || LINES.empty;
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
