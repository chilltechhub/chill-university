// src/logic/softwarePath.js
// The rules for the Software for You path (src/data/softwarePath.js). Pure,
// so scripts/check-builds.mjs runs them in Node.
//
// Progress shape:
//   { missions: { [id]: { seen, practiced, score, tried } }, exported }
//     seen       they went through the teach cards and the demo
//     practiced  they finished the practice round (score: how many right)
//     tried      the Find they tried, for a 'try' step
//   exported     they've taken a Build home at least once
//
// A 'build' step is never stored: it's done when a Build of that kind
// exists, so it's always true to what they actually have.
//
// A mission is done when it's practised and its step is done. Seeing the
// cards isn't required: someone who already knows can go straight to the
// practice and the doing.
import { SOFTWARE_PATH } from '../data/softwarePath';

export const emptyProgress = () => ({ missions: {}, exported: false });

export function normalizeProgress(raw) {
  const out = emptyProgress();
  if (!raw || typeof raw !== 'object') return out;
  for (const m of SOFTWARE_PATH.missions) {
    const r = raw.missions?.[m.id];
    if (!r || typeof r !== 'object') continue;
    const score = Number(r.score);
    out.missions[m.id] = {
      seen: !!r.seen,
      practiced: !!r.practiced,
      score: Number.isFinite(score) ? Math.max(0, Math.min(m.practice.length, Math.round(score))) : 0,
      tried: typeof r.tried === 'string' && r.tried ? r.tried : null,
    };
  }
  out.exported = !!raw.exported;
  return out;
}

const rowOf = (progress, id) => progress?.missions?.[id] || { seen: false, practiced: false, score: 0, tried: null };
const withRow = (progress, id, patch) => ({
  ...progress,
  missions: { ...progress.missions, [id]: { ...rowOf(progress, id), ...patch } },
});

export const markSeen = (progress, id) => withRow(progress, id, { seen: true });

// A finished round. Keeps their best score.
export const recordPractice = (progress, id, score) =>
  withRow(progress, id, { practiced: true, score: Math.max(rowOf(progress, id).score, score) });

export const markTried = (progress, id, findKey) => withRow(progress, id, { tried: findKey || 'tried' });

export const markExported = (progress) => (progress.exported ? progress : { ...progress, exported: true });

export function stepDone(mission, progress, builds = []) {
  const step = mission.doIt;
  if (step.type === 'build') return builds.some(b => b?.kind === step.kind);
  if (step.type === 'try') return !!rowOf(progress, mission.id).tried;
  if (step.type === 'export') return !!progress?.exported;
  return false;
}

export function missionState(mission, progress, builds = []) {
  const row = rowOf(progress, mission.id);
  const did = stepDone(mission, progress, builds);
  return { seen: row.seen, practiced: row.practiced, score: row.score, did, done: row.practiced && did };
}

export function pathSummary(progress, builds = []) {
  const states = SOFTWARE_PATH.missions.map(m => ({ mission: m, ...missionState(m, progress, builds) }));
  const done = states.filter(s => s.done).length;
  return { done, total: states.length, next: states.find(s => !s.done)?.mission || null, states };
}

// Missions newly finished between two snapshots: the ones to signal.
export function newlyDone(before, after, builds = []) {
  return SOFTWARE_PATH.missions
    .filter(m => missionState(m, after, builds).done && !missionState(m, before, builds).done)
    .map(m => m.id);
}

// A practice question's options in a fixed shuffled order (the same every
// time for that question), so the right one isn't always first.
export function shuffledOptions(q, seed = '') {
  let h = 2166136261;
  for (const ch of `${seed}|${q.q}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ i, 16777619) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map(i => ({ label: q.options[i], right: i === q.answer }));
}
