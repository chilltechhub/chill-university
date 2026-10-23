// src/logic/guide/lessons/unitLesson.js
// Guided units, generated from the unit's own data
// (docs/shake-up-plan-2026-10-21.md §7.1, layer 3): framed by the thing
// you'll make, then the steps, then the hand-in, and one check for
// understanding at the end. Nothing here is hand-written per unit, so a new
// unit gets its walk for free.
//
//   unitLesson(unit, { kind, first })
//     first  the first unit someone starts: the full walk (4 steps, quiz
//            last). Every later unit's first time: one note.
//     kind   the Studio kind, for a unit whose work is a Build: its first
//            part's own check is the quiz. Otherwise the quiz is about the
//            hand-in itself.
//
// The spots are UnitScreen's: unit-beats (the first step's card) and
// unit-handin (the work card). No imports: the caller passes the kind.

const HAND_IN_CHECK = {
  question: 'When is your work ready to hand in?',
  options: [
    'When it is there and all three "What good looks like" lines are ticked',
    'As soon as you open the unit',
    'When someone else says it is good enough',
  ],
  answerIndex: 0,
  explain: 'The three lines are the bar. **You** check it, then you hand it in.',
};

const plain = (s) => String(s || '').replace(/\*\*/g, '');

/** A part's own check from the Studio data, as a quiz step's quiz. */
export function partQuiz(part) {
  const ck = part?.lesson?.check;
  if (!ck?.q || !Array.isArray(ck.options) || !Number.isInteger(ck.answer)) return null;
  return { question: ck.q, options: ck.options, answerIndex: ck.answer, explain: part.lesson.says || '' };
}

export function unitLesson(unit, { kind = null, first = true } = {}) {
  if (!unit) return [];
  const d = unit.deliverable || {};
  const beat = unit.beats?.[0];
  if (!first) {
    return [{
      title: `Let's make ${d.title}`,
      body: `${plain(unit.promise)} Start with **${beat?.title || 'the first step'}**.`,
      nonBlocking: true,
      hideSkip: true,
      nextLabel: 'Got it',
    }];
  }
  const quiz = (d.kind === 'build' && partQuiz(kind?.parts?.[0])) || HAND_IN_CHECK;
  return [
    {
      id: null,
      title: `Let's make ${d.title}`,
      body: `${plain(unit.promise)} **${unit.beats?.length || 0} short steps**, then you hand it in.`,
      skipLabel: 'Skip tips',
    },
    {
      id: 'unit-beats',
      title: 'Short steps first',
      body: 'Each one **ticks** when you do it. A button takes you **where to do it**.',
      skipLabel: 'Skip tips',
    },
    {
      id: 'unit-handin',
      title: 'Then hand it in',
      body: 'Tick the three **What good looks like** lines, then **Hand it in**.',
      skipLabel: 'Skip tips',
    },
    {
      id: null,
      title: 'Quick check',
      body: '',
      quiz,
      nextLabel: 'Done',
      hideSkip: true,
    },
  ];
}
