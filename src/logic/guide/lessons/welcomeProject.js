// src/logic/guide/lessons/welcomeProject.js
// The welcome's first lesson, in the builder: see it live, change one part,
// take it home, then one quick check. Generated from the Studio kind's own
// data since P7 (it was hand-written): the part it points at, what to try
// and the check are that part's lesson (src/data/builds.js), so every kind
// the welcome can make gets its own walk.
//
// The spots are in src/components/ProjectWorkspace.js and PortfolioEditor.js
// (welcome-project-look is the first part's row). The second step is
// passthrough: it moves on when they pick an option (the welcome calls
// completeAction), though Next is offered too. Skip ends the tips, never the
// project. WelcomeBuild passes the kind; the one import is pure.

import { partQuiz } from './unitLesson';

const plain = (s) => String(s || '').replace(/\*\*/g, '');

export function welcomeProjectLesson({ kind = null } = {}) {
  const thing = plain(kind?.label || 'project').replace(/^(a|an)\s+/i, '');
  const part = kind?.parts?.[0] || null;
  const quiz = partQuiz(part);
  return [
    {
      title: 'Live, from your answers',
      body: `Your **${thing}**, made from your picks. Every change shows here **at once**.`,
      id: 'welcome-project-preview',
      skipLabel: 'Skip tips',
    },
    {
      title: part ? `Change the ${plain(part.label).toLowerCase()}` : 'Make it yours',
      body: part?.lesson?.tryIt ? `${plain(part.lesson.tryIt)} **Pick one.**` : 'Pick any **option**. Watch it change.',
      id: 'welcome-project-look',
      passthrough: true,
      allowNext: true,
      skipLabel: 'Skip tips',
    },
    {
      title: 'Take it home',
      body: '**Code** shows the real file. **Copy**, **Download** or **Publish** it. It’s yours.',
      id: 'welcome-project-bar',
      ...(quiz ? { skipLabel: 'Skip tips' } : {}),
    },
    ...(quiz ? [{ title: 'Quick check', body: '', quiz, nextLabel: 'Done', hideSkip: true }] : []),
  ];
}
