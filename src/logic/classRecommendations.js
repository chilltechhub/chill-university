// src/logic/classRecommendations.js
import { getEnabledGames } from '../services/gameRegistry';

// "Recommended for you" on the Academy hub. This is a small, local heuristic —
// NOT the same thing as src/api/recommendationEngine.js, which scores a separate
// Supabase content catalog against onboarding fields (life areas, tech level,
// age category). Academy topics and games are static app data, not catalog rows,
// so this stays a plain client-side pick with no network call.

// Pull a handful of topics matching the selected grade band, spread across
// as many different subjects as possible so it isn't all one subject.
export function pickRecommendedTopics(subjects, band, count = 3) {
  if (!band || band === 'All') return [];

  const bySubject = {};
  subjects.forEach(subject => {
    (subject.children || []).forEach(child => {
      if (child.grade !== band) return;
      (bySubject[subject.title] ||= []).push({
        subjectTitle: subject.title,
        subjectColor: subject.color,
        subjectIcon: subject.icon,
        label: child.label,
        grade: child.grade,
      });
    });
  });

  const subjectTitles = Object.keys(bySubject);
  const picked = [];
  let round = 0;
  while (picked.length < count && subjectTitles.some(t => bySubject[t].length)) {
    for (const title of subjectTitles) {
      if (picked.length >= count) break;
      const bucket = bySubject[title];
      if (bucket.length > round) picked.push(bucket[round]);
    }
    round++;
  }
  return picked;
}

// Pull a couple of games matching the selected grade band, from the shared
// GAME_REGISTRY (src/services/gameRegistry.js) — the single source of truth
// for game metadata, per that file's own header comment.
export function pickRecommendedGames(band, count = 2) {
  if (!band || band === 'All') return [];
  return getEnabledGames().filter(g => g.grade === band).slice(0, count);
}
