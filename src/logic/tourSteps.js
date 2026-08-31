// src/logic/tourSteps.js
// Ordered steps for the guided feature tour (context/TourContext.js). Each
// step with a `tab` navigates to that MainTabs tab; a `screen` navigates
// to that top-level Stack.Screen; neither means "stay where you are"
// (used for the FAB, which is visible on every MainTabs screen, and the
// closing step). `id` matches the <TourSpot id="..."> wrapping the real
// element being highlighted — omit it for a plain centered card with no
// spotlight (the opening/closing steps).

export const TOUR_STEPS = [
  {
    id: null,
    title: '👋 Welcome to Chill',
    body: "Quick tour of where everything lives — about a minute, and you can replay it any time from Settings.",
  },
  {
    id: 'home-focus',
    tab: 'Home',
    title: 'Home',
    body: "Set today's focus, get a daily quote, and see your desk — tasks, projects, and captured notes all in one place.",
  },
  {
    id: 'training-games',
    tab: 'Training',
    title: 'Training',
    body: "Check your Objectives (missions) and Daily Drills here, or tap ENTER TRAINING to pick a game across any subject — Math, Science, Language Arts, and more.",
  },
  {
    id: 'library-life-areas',
    tab: 'Library',
    title: 'Life Areas',
    body: 'Physical, Mental, Social, Financial, Creative, Professional, Spiritual, Digital — check in on each and get tips tailored to it.',
  },
  {
    // No id/spotlight here on purpose — the FAB is absolutely positioned
    // and user-repositionable (see FabPositionContext), so wrapping it in
    // a measured TourSpot risked interfering with its layout. A plain
    // card still gets the idea across.
    id: null,
    title: '➕ Quick Actions',
    body: "See the round + button floating on screen? Tap it any time for a new project, a quick note, your Capture Inbox, or reminders — it follows you to every tab.",
  },
  {
    id: 'settings-family',
    screen: 'Settings',
    title: 'Family',
    body: "New: link a parent or child's account here to follow their progress — read-only, no controls over their account.",
  },
  {
    id: null,
    title: "🎉 You're set!",
    body: "That's the tour. Find it again any time from Settings → Replay Tutorial.",
  },
];
