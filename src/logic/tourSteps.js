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

// Four bubbles since 2026-09-25. It used to be thirteen (top bar, profile,
// stats, Library pages, life areas, going back, Training...), and the user
// found that too long to take in before doing anything. Now it's only what
// every screen shares: the bar at the bottom and the + button. Everything
// else is taught where it happens, the first time someone gets there — the
// Library's pages on the Library, going back on the first pushed screen,
// switching games in the feed (FIRST_VISIT in src/logic/screenTutorials.js).
export const TOUR_STEPS = [
  {
    id: null,
    go: 'Home',
    title: 'A quick look around',
    body: "Two things before your first goal. Tap Next › to move on, or Skip if you'd rather go straight in.",
  },
  {
    id: 'nav-tabbar',
    go: 'Home',
    title: 'The bar at the bottom',
    body: 'Three places: Library holds your tools, Home is your day, and Training has quick games. Tap one any time, from anywhere.',
  },
  {
    id: 'fab',
    go: 'Home',
    title: 'The + button',
    body: 'It follows you to every screen. Tap it to jot a note, set a reminder, or drop a thought in your inbox before you lose it.',
  },
  {
    id: null,
    go: 'Home',
    title: "That's all for now",
    body: "I'll show you the rest as you get to it. Next up is your first goal, and I'll walk you through each step.",
  },
];
