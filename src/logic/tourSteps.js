// src/logic/tourSteps.js
// The welcome tour: "a quick look around", led by the guide.
//
// It runs once, right after onboarding and before the first goal (see
// src/logic/useWelcomeTour.js), and again whenever someone picks Replay
// Tutorial in Settings or Help. Its whole job is the one thing nothing else
// in the app teaches: how to get around. Where the tabs go, what the bar at
// the top is, what the + does, how to switch Library pages, how to open a
// life area and how to get back out, and how to move between games.
//
// It used to be a fourteen-step feature catalogue (Compass, Academy,
// Workshop, Portfolio, Vault, Planner, Settings, Profile...) that described
// screens a new account can't even see yet. Those are taught where they
// live now, by each screen's own first-visit tutorial.
//
// Step fields (context/TourContext.js):
//   id             the TourSpot to light up; null for a plain bubble
//   go             route to be on for this step (src/logic/appRoutes.js)
//   goParams       params for `go`
//   stay           don't navigate if already on `go` (keeps whichever life
//                  area the person just opened themselves)
//   librarySubTab  which Library page to show (LibraryScreen reads it)
//   passthrough    the lit-up control is live; doing the thing advances
//   allowNext      ...but still offer Next, for anyone who'd rather not
//
// Every id here must be a TourSpot rendered on its `go` screen (or on every
// screen: the tab bar, top bar and + button). scripts/check-tour-spots.mjs
// fails the build otherwise, since a missing one just draws no highlight.
//
// Gestures described here are real, and worth re-checking if they change:
// Library pages swipe left/right (LibraryScreen's PanResponder), a life
// area opens on double-tap or long-press (handleDomainPress/onLongPress),
// Play opens its game picker on long-press (HomeScreen), the game feed
// swipes up/down with arrow buttons as well (GameFeed.js), and pushed
// screens go back by the arrow or an edge swipe (App.js gestureEnabled).

export const TOUR_STEPS = [
  {
    id: null,
    go: 'Home',
    title: 'A quick look around',
    body: "Before your first goal, here's how to get around. It takes about a minute. Tap Next › to move on, Back to see a step again, or Skip if you'd rather explore on your own.",
  },
  {
    id: 'nav-tabbar',
    go: 'Home',
    title: 'The bar at the bottom',
    body: 'This is how you get around. Three places: Library holds your tools, Home is your day, and Training has quick games. Tap one any time, from anywhere.',
  },
  {
    id: 'home-study-play',
    go: 'Home',
    title: 'Play (and Study)',
    body: 'Play starts a quick game. On a Student profile, Study sits beside it and opens a class or your notes. Press and hold either one to choose.',
  },
  {
    id: 'home-stage',
    go: 'Home',
    title: 'What to do next',
    body: 'Your "what now?" card. The app opens up in stages: finish a goal or level up to reach the next one.',
  },
  {
    id: 'topbar-menu',
    go: 'Home',
    title: 'Your menu',
    body: 'Tap this badge for Profile, Help, Settings and Search. "Screen Tutorial" in there explains whatever screen you are on.',
  },
  {
    id: 'topbar-profile',
    go: 'Home',
    title: 'Your profile',
    body: 'Which profile you are using. Tap it to rename it, or add another one later (say, Student next to Personal).',
  },
  {
    id: 'topbar-stats',
    go: 'Home',
    title: 'Level, points and the bell',
    body: 'Right answers and finished steps earn points and level you up. Tap your level to see your profile. The bell holds your reminders and updates.',
  },
  {
    id: 'fab',
    go: 'Home',
    title: 'The + button',
    body: 'It follows you to every screen. Tap it to jot a note, set a reminder, or drop a thought in your inbox before you lose it.',
  },
  {
    id: 'library-views',
    go: 'LibraryScreen',
    librarySubTab: 'domains',
    title: 'The Library',
    body: 'Your tools live here, on three pages: Life, Build and Knowledge. Swipe left or right to switch pages, or tap the title to pick one.',
  },
  {
    id: 'library-life-areas',
    go: 'LibraryScreen',
    librarySubTab: 'domains',
    passthrough: true,
    allowNext: true,
    title: 'Your life areas',
    body: 'Each circle is one part of your life. Tap once to filter the list below it. Double-tap, or press and hold, to open it. Try it now: double-tap one.',
  },
  {
    id: 'lifearea-back',
    go: 'LifeAreaScreen',
    goParams: { areaId: 'physical' },
    stay: true,
    title: 'Getting back',
    body: "Pages like this open on top of the one you came from. To go back, tap the arrow at the top left, or swipe right from the left edge of the screen (or use your phone's back button).",
  },
  {
    id: 'training-enter',
    go: 'Training',
    title: 'Training',
    body: 'Quick games that earn points. Tap Enter Training to play. Inside, swipe up or down (or tap the arrows on the right) to switch games, and tap X at the top left to come back.',
  },
  {
    id: null,
    go: 'Home',
    title: "That's the tour",
    body: "You can replay it any time from Settings. Scroll down Home for your goal and more cards. Next up is your first goal: three small steps, and I'll walk you through each one.",
  },
];
