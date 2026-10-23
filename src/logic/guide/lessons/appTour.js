// src/logic/guide/lessons/appTour.js
// After the welcome's project: a quick look around, ending on the next
// mission. The founder (2026-10-21): "once the user completes the project
// they should be introduced to a tutorial around the app and towards the
// next mission."
//
// useWelcomeTour runs it once on Home, for a guest who kept going or a new
// account; then the guided first goal (useGuidedFirstGoal) takes over and
// walks the mission itself. Every step keeps Home in Calm (`keepCalm`,
// HomeScreen.js). Skip is the fast track: it goes straight to the mission.

const SKIP = 'Skip to my mission';

export const APP_TOUR = [
  {
    id: 'home-studio',
    go: 'Home',
    keepCalm: true,
    title: 'Your project lives here',
    body: '**{project}** is saved. Tap it any time to take another part apart.',
    skipLabel: SKIP,
  },
  {
    id: 'nav-tabbar',
    go: 'Home',
    keepCalm: true,
    title: 'Getting around',
    body: '**Home** = your day. **Learn** = classes and practice. **Library** = your tools, and the **Studio** where you make things.',
    skipLabel: SKIP,
  },
  {
    id: 'fab',
    go: 'Home',
    keepCalm: true,
    title: 'The + button',
    body: 'On every screen. **Jot a note**, **set a reminder**, **capture a thought**.',
    skipLabel: SKIP,
  },
  {
    id: 'calm-next',
    go: 'Home',
    keepCalm: true,
    title: 'Your next mission',
    body: '**{mission}**. I’ll walk you through it, one step at a time.',
    nextLabel: "Let's go",
    hideSkip: true,
  },
];

// The steps with their words filled in. No project (they skipped it) drops
// its step; no mission yet says where the next step always sits.
export function appTour({ project, mission } = {}) {
  return APP_TOUR
    .filter(step => project || step.id !== 'home-studio')
    .map(step => ({
      ...step,
      body: step.id === 'calm-next' && !mission
        ? 'Your **next step** always sits here. Tap it when you’re ready.'
        : step.body.replace('{project}', project || '').replace('{mission}', mission || ''),
    }));
}
