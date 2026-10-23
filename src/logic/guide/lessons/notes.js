// src/logic/guide/lessons/notes.js
// Mentor notes (docs/shake-up-plan-2026-10-21.md §7.1, layer 2): the first
// time someone sees a surface, one card in place, said once. **Got it**
// closes it; **Show me** runs that page's spotlight from src/data/pageInfo.js
// (at most three steps). At most one of these shows automatically a
// session (src/logic/guide/useGuide.js).
//
// One line each, in the mentor's voice: what this is, and the one thing to
// do. Nothing about points, levels, streaks or rank, and only the new tab
// names (scripts/check-guide.mjs). No imports.

export const NOTES = {
  'today.day':   { title: 'This is your day', body: 'Your **next step** up top, your plans below. Tap **+ Add** to plan something.' },
  'today.week':  { title: 'This is your week', body: '**Tap a day** to plan it. Leave some gaps.' },
  'today.month': { title: 'This is your month', body: 'Deadlines and busy days. **Tap a day** to open it.' },
  'today.calm':  { title: 'Today, calm', body: 'One **next step** and your day. That is all you need.' },
  'learn.path':  { title: 'Your path', body: 'One **unit** at a time. Each ends in **something real** you hand in.' },
  'learn.unit':  { title: 'A unit', body: 'A few **short steps**, then make one thing and **hand it in**.' },
  'learn.finds': { title: 'Finds', body: 'Free tools worth **ten minutes**. Try one, tap **I tried it**.' },
  'make.board':  { title: 'Everything you make', body: 'Your **work** in four columns, and the **Studio** to make more.' },
  'make.saved':  { title: 'What you kept', body: 'Jot it now, **sort it later**. Nothing gets lost.' },
  you:           { title: 'This is You', body: 'Your **Dream**, your four circles, and **what you have done**.' },
  'you.room':    { title: 'Your room', body: 'Your character and pet. **Decorate** it any way you like.' },
};

/**
 * The note as a lesson step for TourContext's startLesson. `showMe` runs
 * the page's spotlight; without one, the note is just Got it.
 */
export function noteStep(surface, { showMe = null } = {}) {
  const n = NOTES[surface];
  if (!n) return null;
  return {
    title: n.title,
    body: n.body,
    nonBlocking: true,
    hideSkip: true,
    nextLabel: 'Got it',
    secondary: showMe ? { label: 'Show me', run: showMe } : null,
  };
}
