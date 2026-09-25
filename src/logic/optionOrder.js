// src/logic/optionOrder.js
// Display order for a multiple-choice question's options.
//
// Question banks are written with the right answer wherever it fell, which
// in practice is almost always the second option. Screens show the options
// in this shuffled order instead. The shuffle is seeded from the question
// text, so it's the same on every visit, and it returns ORIGINAL indexes:
// answers are still stored and checked against `answerIndex` as written.
//
//   const order = optionOrder(q.question, q.options.length);
//   order.map(oi => <Option key={oi} text={q.options[oi]} ... />)
export function optionOrder(seedText, count) {
  // FNV-1a hash of the text, then mulberry32 for the shuffle.
  let seed = 2166136261;
  for (const ch of String(seedText || '')) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let x = Math.imul(seed ^ (seed >>> 15), seed | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Unbiased random shuffle (Fisher-Yates) for games that reshuffle every
// round. `arr.sort(() => Math.random() - 0.5)` is not uniform: items drift
// toward where they started, so a correct answer written first shows up
// first far more often than 1 in 4.
export function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
