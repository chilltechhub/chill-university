// src/logic/wayfinderDeeper.js
//
// Scoring for Wayfinder's optional sections — personality, learning, life
// beyond work, and situations. Pure functions like wayfinderScoring.js, and
// deliberately independent of it (callers pass `interest` in) so the two
// files never import each other.

import {
  PERSONALITY_ITEMS, TRAITS, TECHNIQUES, LEARNING_PREFS, LIFE_PATHS, LIFE_ZONE_MAP,
} from '../data/wayfinderDeeper';
import { SITUATION_MAP } from '../data/wayfinderSituations';
import { THEME_MAP, VALUE_MAP } from '../data/wayfinder';

// ─── Personality ────────────────────────────────────────────────────────────
export function personalityAnswered(answers = {}) {
  return PERSONALITY_ITEMS.filter(i => answers[i.id] >= 1 && answers[i.id] <= 5).length;
}

// 0–100 per trait over the items answered; null for a trait with none.
export function personalityScores(answers = {}) {
  const out = {};
  TRAITS.forEach(trait => {
    const items = PERSONALITY_ITEMS.filter(i => i.trait === trait.id && answers[i.id] >= 1 && answers[i.id] <= 5);
    if (!items.length) { out[trait.id] = null; return; }
    const mean = items.reduce((acc, i) => acc + (i.r ? 6 - answers[i.id] : answers[i.id]), 0) / items.length;
    out[trait.id] = Math.round(((mean - 1) / 4) * 100);
  });
  return out;
}

export function traitBand(score) {
  if (score === null || score === undefined) return null;
  if (score < 40) return 'low';
  if (score > 60) return 'high';
  return 'mid';
}

// The closest Myers-Briggs-style four letters. Near-the-middle letters are
// flagged `close` rather than silently rounded, because that's exactly where
// the real test flips people between types on a retake.
export function fourLetter(scores) {
  const order = ['E', 'O', 'A', 'C'];
  if (order.some(id => scores[id] === null || scores[id] === undefined)) return null;
  const letters = order.map(id => {
    const trait = TRAITS.find(t => t.id === id);
    const score = scores[id];
    return {
      trait: id,
      letter: score >= 50 ? trait.letter[1] : trait.letter[0],
      other: score >= 50 ? trait.letter[0] : trait.letter[1],
      close: Math.abs(score - 50) <= 12,
    };
  });
  return { code: letters.map(l => l.letter).join(''), letters };
}

export function personalityTips(scores) {
  return TRAITS
    .map(trait => {
      const band = traitBand(scores[trait.id]);
      if (!band) return null;
      if (band === 'mid') {
        return { trait, band, tip: `You’re near the middle on ${trait.name.toLowerCase()} — you can flex either way depending on the situation.` };
      }
      return { trait, band, tip: band === 'high' ? trait.highTip : trait.lowTip };
    })
    .filter(Boolean);
}

// ─── Learning ───────────────────────────────────────────────────────────────
// Techniques ranked by the blockers someone named, then by whether there's a
// version written for one of their preferences. The first two always make
// the list — they're the best-supported techniques and help everyone.
export function learningPlan(learning = {}, { limit = 4 } = {}) {
  const prefs = learning.prefs || [];
  const blockers = learning.blockers || [];
  const scored = TECHNIQUES.map((tech, index) => {
    const matchedBlockers = tech.blockers.filter(b => blockers.includes(b));
    const pref = prefs.find(p => tech.byPref[p]);
    const score = matchedBlockers.length * 3 + (pref ? 1 : 0) + (index < 2 ? 2 : 0) - index * 0.01;
    return { tech, score, matchedBlockers, how: pref ? tech.byPref[pref] : tech.how, forPref: pref || null };
  });
  scored.sort((a, b) => b.score - a.score);
  const picks = scored.slice(0, limit);

  // Every preference someone named should show up at least once, or the
  // plan reads as if their answer was ignored. Swap in from the bottom,
  // never touching the top two.
  prefs.forEach(pref => {
    if (picks.some(x => x.forPref === pref)) return;
    const candidate = scored.find(x => !picks.includes(x) && x.tech.byPref[pref]);
    if (!candidate) return;
    for (let i = picks.length - 1; i >= 2; i--) {
      if (!picks[i].forPref) {
        picks[i] = { ...candidate, how: candidate.tech.byPref[pref], forPref: pref };
        return;
      }
    }
  });
  return picks;
}

export function formatsFromLearning(learning = {}) {
  const set = new Set();
  (learning.prefs || []).forEach(id => (LEARNING_PREFS.find(p => p.id === id)?.formats || []).forEach(f => set.add(f)));
  return [...set];
}

// ─── Situations ─────────────────────────────────────────────────────────────
export function activeSituations(state) {
  return (state.situations || []).map(id => SITUATION_MAP[id]).filter(Boolean);
}

export function urgentSituations(state) {
  return activeSituations(state).filter(s => s.urgent);
}

export function needsIncomeFromSituations(state) {
  return activeSituations(state).some(s => s.needsIncome);
}

// Steps are tracked by their index within `now` then `next`, as "n0", "x1".
export function situationProgress(state, situationId) {
  const s = SITUATION_MAP[situationId];
  if (!s) return { done: 0, total: 0 };
  const done = new Set(state.situationDone?.[situationId] || []);
  const keys = [...s.now.map((_, i) => `n${i}`), ...s.next.map((_, i) => `x${i}`)];
  return { done: keys.filter(k => done.has(k)).length, total: keys.length };
}

// ─── Life beyond work ───────────────────────────────────────────────────────
function signalFor(experiments = [], id) {
  return experiments
    .filter(x => x.pathId === id && x.status === 'done' && x.reflection)
    .reduce((acc, x) => acc + Number(x.reflection.energy || 0) + Number(x.reflection.curiosity || 0), 0);
}

export function scoreLifePath(path, { interest, zones, values, situationZones, experiments }) {
  const reasons = [];

  const themeFit = path.themes.length
    ? path.themes.reduce((acc, t) => acc + (interest[t] ?? 50), 0) / path.themes.length
    : 55;
  const strongTheme = path.themes.find(t => (interest[t] ?? 0) >= 60);
  if (strongTheme) reasons.push({ kind: 'interest', text: `Matches what pulls you: ${THEME_MAP[strongTheme].short}` });

  // A path's FIRST zone is what it's mainly for. "Cook for people" touches
  // social life, but "Invest in your people" is about it — so a primary match
  // outranks a secondary one, and each extra match adds a little. Without
  // this, most paths tied and the list came out in file order.
  const [primaryZone] = path.zones;
  const zoneHits = path.zones.filter(z => zones.includes(z));
  let zoneFit = zones.length ? 20 : 50;
  if (zones.includes(primaryZone)) zoneFit = 100;
  else if (zoneHits.length) zoneFit = 70;
  zoneFit += Math.max(0, zoneHits.length - 1) * 8;
  // …and a path that's ONLY about the area beats one that's partly about it.
  const zoneFocus = path.zones.length ? (zoneHits.length / path.zones.length) * 6 : 0;
  if (zoneHits.length) reasons.push({ kind: 'zone', text: `Something you want to change: ${LIFE_ZONE_MAP[zoneHits[0]].label}` });

  const valueHits = path.values.filter(v => values.includes(v));
  const valuesFit = values.length ? (valueHits.length / Math.min(2, values.length)) * 100 : 50;
  if (valueHits.length) reasons.push({ kind: 'values', text: `Fits what matters: ${valueHits.map(v => VALUE_MAP[v].label).join(', ')}` });

  let score = themeFit * 0.35 + zoneFit * 0.35 + Math.min(100, valuesFit) * 0.2 + 10 + zoneFocus;
  // Same primary-first rule for what's going on right now — and the reason
  // is only claimed when the path is mainly about that part of life.
  if (situationZones.includes(primaryZone)) {
    score += 10;
    reasons.push({ kind: 'situation', text: 'Could help with what’s going on right now' });
  } else if (path.zones.some(z => situationZones.includes(z))) {
    score += 4;
  }

  const tried = experiments.filter(x => x.pathId === path.id && x.status === 'done').length;
  const signal = signalFor(experiments, path.id);
  score += Math.max(-30, Math.min(30, signal * 8));

  return { path, score: Math.round(score), reasons, tried, signal };
}

// What "Beyond work" shows.
//
// First, one path for each part of life the person said they want to change
// (then each part their situations touch) — whatever else they're drawn to.
// Someone who picked "I'm lonely" and "Friends, family & love" has to see a
// friendship path even if their creative interests score higher; otherwise
// the answer they gave looks ignored. Then the rest fill by score, at most
// two per primary zone. A path they tried and disliked drops out.
export function suggestLifePaths(state, interest, { limit = 5 } = {}) {
  const situationZones = activeSituations(state).flatMap(s => s.areas);
  const ctx = {
    interest,
    zones: state.life?.zones || [],
    values: state.values || [],
    situationZones,
    experiments: state.experiments || [],
  };
  const scored = LIFE_PATHS.map(p => scoreLifePath(p, ctx)).sort((a, b) => b.score - a.score);
  const eligible = scored.filter(r => !(r.tried && r.signal <= -2));

  const picks = [];
  const perZone = {};
  const take = (r) => {
    picks.push(r);
    const z = r.path.zones[0];
    perZone[z] = (perZone[z] || 0) + 1;
  };

  const mustCover = [...new Set([...ctx.zones, ...situationZones])].filter(z => LIFE_ZONE_MAP[z]);
  for (const zone of mustCover) {
    if (picks.length >= limit) break;
    const best = eligible.find(r => r.path.zones[0] === zone && !picks.includes(r));
    if (best) take(best);
  }
  for (const r of eligible) {
    if (picks.length >= limit) break;
    if (picks.includes(r) || (perZone[r.path.zones[0]] || 0) >= 2) continue;
    take(r);
  }

  picks.sort((a, b) => b.score - a.score);
  return { picks, all: scored };
}
