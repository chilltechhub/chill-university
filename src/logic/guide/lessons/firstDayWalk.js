// src/logic/guide/lessons/firstDayWalk.js
// The first-day walk (docs/shake-up-plan-2026-10-21.md §7.1): four steps on
// Today, once, for a new account or a guest who kept going after the
// welcome. The next step → + Add → Day/Week/Month → your picture.
//
// It replaces the welcome tour (src/logic/tourSteps.js) and the after-welcome
// app tour (appTour.js) with the new tabs; Settings → "Replay the first-day
// walk" runs it again. In Calm it points at Calm's own cards and Calm stays
// Calm: nothing here switches the view. No imports.

export function firstDayWalk({ calm = false, project = null } = {}) {
  return [
    {
      id: calm ? 'calm-next' : 'home-compass',
      go: 'Home',
      title: 'Your next step',
      body: project
        ? `**${project}** is saved in Make. This is what comes next: **one thing at a time**.`
        : 'One thing at a time. **Tap it** when you are ready.',
      skipLabel: 'Skip',
    },
    {
      id: 'planner-add',
      go: 'Home',
      title: '+ Add',
      body: 'Puts anything **on your day**: a plan, a reminder, a note.',
      skipLabel: 'Skip',
    },
    {
      id: 'planner-views',
      go: 'Home',
      title: 'Day, Week, Month',
      body: '**Switch** how far ahead you look.',
      skipLabel: 'Skip',
    },
    {
      id: 'topbar-avatar',
      go: 'Home',
      title: 'Your ikigai lives up here',
      body: 'Tap **your picture** for You: your Dream, your four circles, and **About this page** for any screen.',
      nextLabel: 'Done',
      hideSkip: true,
    },
  ];
}
