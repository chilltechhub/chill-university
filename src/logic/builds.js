// src/logic/builds.js
// The rules for a Studio Build (src/data/builds.js). Pure: no React, no
// storage, so scripts/check-builds.mjs can run every rule in Node.
//
// Each part of a Build has a level:
//   0  made for you   the app picked it; they can see it but not change it
//   1  yours          they looked at how it works: the everyday options open
//   2  mastered       they passed its one-question check: the upgrades open
//
// The thing works from the first second at level 0. Unlocking never gates
// the result, only the control, so a lock is "not yet", never bait.
//
// A wrong answer costs nothing: they read it again and try when ready.
//
// The receipt keeps the honest split between what the app made and what
// they changed (docs/north-star.md: their own receipts, never canned praise).
import { BUILD_KINDS, BUILD_KIND_MAP } from '../data/builds';

export const LEVEL_MADE = 0;
export const LEVEL_YOURS = 1;
export const LEVEL_MASTERED = 2;
export const LEVEL_NAMES = ['Made for you', 'Yours', 'Mastered'];

const squeeze = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const stamp = (now) => now || new Date().toISOString();

export const kindOf = (build) => BUILD_KIND_MAP[build?.kind] || null;
export const partOf = (kind, partId) => kind?.parts.find(p => p.id === partId) || null;
export const optionOf = (part, optionId) => part?.options.find(o => o.id === optionId) || null;

export function newBuildId() {
  return `b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Junk in, a valid Build (or null for an unknown kind) out. Unknown parts
// are dropped, missing ones come back at the app's pick, levels clamp.
export function normalizeBuild(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = BUILD_KIND_MAP[raw.kind];
  if (!kind) return null;
  const answers = {};
  for (const ask of kind.asks) answers[ask.key] = squeeze(raw.answers?.[ask.key], ask.max);
  const picks = {};
  const levels = {};
  for (const part of kind.parts) {
    const lv = Number(raw.levels?.[part.id]);
    levels[part.id] = Number.isFinite(lv) ? Math.max(LEVEL_MADE, Math.min(LEVEL_MASTERED, Math.round(lv))) : LEVEL_MADE;
    const pick = optionOf(part, raw.picks?.[part.id]);
    // A pick above their level (an old save, a hand edit) goes back to the
    // app's choice rather than handing over an upgrade for free.
    picks[part.id] = pick && (pick.id === part.start || pick.level <= levels[part.id]) ? pick.id : part.start;
  }
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newBuildId(),
    kind: kind.id,
    answers,
    picks,
    levels,
    // The Workshop project it grew into ("Grow it into a project"), if any.
    projectId: typeof raw.projectId === 'string' && raw.projectId ? raw.projectId : null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export const withProject = (build, projectId, now) => touch(build, { projectId }, now);

// The app makes it: their answers, its picks.
export function newBuild(kindId, answers = {}, now) {
  const at = stamp(now);
  return normalizeBuild({ kind: kindId, answers, createdAt: at, updatedAt: at });
}

export const partLevel = (build, partId) => build?.levels?.[partId] ?? LEVEL_MADE;

// Can they choose this option right now? The current pick always counts as
// open (they can see it, it's in their thing).
export function isOptionOpen(build, partId, optionId) {
  const part = partOf(kindOf(build), partId);
  const option = optionOf(part, optionId);
  if (!option) return false;
  if (build.picks[partId] === option.id) return true;
  return option.level <= partLevel(build, partId);
}

const touch = (build, patch, now) => ({ ...build, ...patch, updatedAt: stamp(now) });

// They opened the part and read how it works.
export function lookAtPart(build, partId, now) {
  if (!partOf(kindOf(build), partId) || partLevel(build, partId) >= LEVEL_YOURS) return build;
  return touch(build, { levels: { ...build.levels, [partId]: LEVEL_YOURS } }, now);
}

// Their answer to the part's check. Right → mastered (and looked at, if
// they somehow skipped that). Wrong → nothing changes.
export function answerCheck(build, partId, choice, now) {
  const part = partOf(kindOf(build), partId);
  if (!part) return { build, right: false };
  const right = choice === part.lesson.check.answer;
  if (!right || partLevel(build, partId) >= LEVEL_MASTERED) return { build, right };
  return { build: touch(build, { levels: { ...build.levels, [partId]: LEVEL_MASTERED } }, now), right };
}

export function pickOption(build, partId, optionId, now) {
  if (!isOptionOpen(build, partId, optionId) || build.picks[partId] === optionId) return build;
  return touch(build, { picks: { ...build.picks, [partId]: optionId } }, now);
}

export function setAnswers(build, answers, now) {
  const next = normalizeBuild({ ...build, answers: { ...build.answers, ...answers } });
  return touch(next, {}, now);
}

// What they did, in their numbers.
export function receipt(build) {
  const kind = kindOf(build);
  const parts = kind?.parts || [];
  return {
    total: parts.length,
    looked: parts.filter(p => partLevel(build, p.id) >= LEVEL_YOURS).length,
    mastered: parts.filter(p => partLevel(build, p.id) >= LEVEL_MASTERED).length,
    changed: parts.filter(p => build.picks[p.id] !== p.start).length,
  };
}

// One mentor line for the receipt. Names what they did; never scolds what
// they haven't.
export function receiptLine(build) {
  const r = receipt(build);
  if (!r.total) return '';
  if (r.mastered === r.total) return `You understand every part of this. **You built this.**`;
  if (r.changed > 0) return `You changed **${r.changed} of ${r.total}** parts. It's becoming yours.`;
  if (r.looked > 0) return `You know how **${r.looked} of ${r.total}** parts work. Change one.`;
  return `The app made this for you. **Tap a part** to see how it works.`;
}

// Where to point them next: a part they haven't opened, then one they
// haven't mastered. Null when there's nothing left to learn here.
export function nextPart(build) {
  const parts = kindOf(build)?.parts || [];
  return parts.find(p => partLevel(build, p.id) === LEVEL_MADE)
    || parts.find(p => partLevel(build, p.id) < LEVEL_MASTERED)
    || null;
}

export const isMastered = (build) => {
  const r = receipt(build);
  return r.total > 0 && r.mastered === r.total;
};

export function buildTitle(build) {
  const kind = kindOf(build);
  if (!kind) return 'Build';
  const a = build.answers || {};
  if (kind.id === 'page') return a.name ? `${a.name}'s page` : 'My page';
  if (kind.id === 'business') return a.idea || 'My business';
  if (kind.id === 'ai') return a.name || 'My AI helper';
  return a.name || kind.label;
}

export function buildFilename(build) {
  const slug = buildTitle(build).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return `${slug || 'my-build'}.html`;
}

// Ready to make? Every ask needs a few words; these are the empty ones.
export function missingAsks(kindId, answers = {}) {
  const kind = BUILD_KIND_MAP[kindId];
  if (!kind) return [];
  return kind.asks.filter(a => !squeeze(answers[a.key], a.max)).map(a => a.key);
}

export { BUILD_KINDS };
