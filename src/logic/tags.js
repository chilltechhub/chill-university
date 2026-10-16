// src/logic/tags.js
// One way to read a comma-separated "tags" box, used everywhere one is typed.
//
// Each screen used to split it its own way: some lowercased and one didn't,
// none dropped a typed "#" (the chips add their own, so "#dup" showed as
// "##dup") and none dropped repeats, so "dup, DUP, #dup" saved three tags.

export function parseTags(raw) {
  const seen = new Set();
  const out = [];
  for (const part of String(raw || '').split(',')) {
    const tag = part.trim().replace(/^#+/, '').trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}
