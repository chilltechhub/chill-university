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
    body: "A tour of where everything lives — a couple of minutes, and you can replay it any time from Settings.",
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
    id: 'hub-ClassesStack',
    tab: 'Library',
    title: 'Academy Classes',
    body: "Structured coursework by grade level, across every subject — Math, Science, Language Arts, and more. Pick a subject, pick a topic, and mark it complete to earn XP toward your rank.",
  },
  {
    id: 'hub-ProjectsScreen',
    tab: 'Library',
    title: 'The Workshop',
    body: "Every build lives here, from a rough blueprint to something you're shipping. Start a project, add tasks and research as you go — finished ones land in your Portfolio automatically.",
  },
  {
    id: 'hub-PortfolioScreen',
    tab: 'Library',
    title: 'Portfolio',
    body: "Your real track record — XP, skills, and shipped projects, auto-built as you use the app. This is what you'd actually show someone.",
  },
  {
    id: 'hub-KnowledgeScreen',
    tab: 'Library',
    title: 'Knowledge Vault',
    body: "Notes, bookmarks, research papers, and tools in one place. Jot something down, save a link worth coming back to, or browse Discover for curated research tools and sites.",
  },
  {
    id: 'hub-PlannerScreen',
    tab: 'Library',
    title: 'Planner',
    body: "Your full agenda — daily, weekly, monthly. Schedule a one-off event or a recurring habit, with a reminder before it's due.",
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
    id: 'settings-background',
    screen: 'Settings',
    title: 'Backgrounds',
    body: 'You started with a plain background, on purpose — flip these on any time to match Home or Library to whatever landscape your traveler has equipped.',
  },
  {
    id: 'settings-family',
    screen: 'Settings',
    title: 'Family',
    body: "New: link a parent or child's account here to follow their progress — read-only, no controls over their account.",
  },
  {
    id: 'profile-rank',
    screen: 'Profile',
    title: 'Your Profile',
    body: "Level, rank, streak, and stats all in one place — tap Customize up top to change how your traveler looks.",
  },
  {
    id: null,
    title: "🎉 You're set!",
    body: "That's the tour. Find it again any time from Settings → Replay Tutorial — and on any screen, the round + button's Tutorial action explains just that screen.",
  },
];
