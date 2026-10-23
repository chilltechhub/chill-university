// src/logic/guide/lessons/welcomeProject.js
// The welcome's first lesson, in the builder (the founder's Descartes
// onboarding, 2026-10-21): see it live, change the look, take it home.
// Hand-written on TourContext's startLesson; P7 replaces it with the
// version generated from unit data. The spots are in
// src/components/ProjectWorkspace.js and PortfolioEditor.js.
//
// The middle step is passthrough: it moves on when they pick an option
// (the welcome calls completeAction), though Next is offered too. Skip
// ends the tips, never the project.

export function welcomeProjectLesson({ thing = 'project', page = false } = {}) {
  return [
    {
      title: 'Live, from your answers',
      body: `Your **${thing}**, made from your picks. Every change shows here **at once**.`,
      id: 'welcome-project-preview',
      skipLabel: 'Skip tips',
    },
    {
      title: 'Make it yours',
      body: page ? 'Pick a **palette**. Watch the page change.' : 'Pick any **option**. Watch it change.',
      id: 'welcome-project-look',
      passthrough: true,
      allowNext: true,
      skipLabel: 'Skip tips',
    },
    {
      title: 'Take it home',
      body: '**Code** shows the real file. **Copy**, **Download** or **Publish** it. It’s yours.',
      id: 'welcome-project-bar',
    },
  ];
}
