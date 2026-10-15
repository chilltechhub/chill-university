// src/logic/fuzzyMatch.js
// How well a query matches a title (and optional subtitle), for search.
// Exact text first, then every word in any order ("bills rent" finds "Rent
// and bills"), then one typo per word of four letters or more ("plannr",
// "wokshop"). 0 = no match. No imports: scripts/check-search.mjs runs it.

export const words = (s) => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// Edit distance, stopping early past `max`.
export function within(a, b, max = 1) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

// A query word matches a text word when it starts it ("plan" → "planner"),
// or, at four letters or more, is one edit away from the word or its start.
function wordHits(q, w) {
  if (w.startsWith(q)) return 2;
  if (q.length >= 4 && (within(q, w) || within(q, w.slice(0, q.length)))) return 1;
  return 0;
}

export function matchScore(query, title, subtitle = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return 0;
  const t = String(title || '').toLowerCase();
  const sub = String(subtitle || '').toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const qw = words(q);
  if (!qw.length) return 0;
  const tw = words(t);
  const all = [...tw, ...words(sub)];
  // Every query word somewhere: in the title (better) or the subtitle.
  const inTitle = qw.map(x => Math.max(0, ...tw.map(w => wordHits(x, w))));
  if (inTitle.every(h => h === 2)) return 50;
  if (sub.includes(q)) return 30;
  const anywhere = qw.map(x => Math.max(0, ...all.map(w => wordHits(x, w))));
  if (anywhere.every(h => h === 2)) return 28;
  if (inTitle.every(h => h > 0)) return 25;
  if (anywhere.every(h => h > 0)) return 15;
  return 0;
}
