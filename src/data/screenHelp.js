// src/data/screenHelp.js
// Per-screen help copy, shared by HelpScreen (the full Help screen) and
// screenTutorials.js (the in-app tour).
//
// This lives here rather than inside HelpScreen.js to break a require cycle:
// TourContext -> screenTutorials -> HelpScreen -> TourContext. Metro allows
// cycles but warns that they "can result in uninitialized values", and this
// one resolved during provider setup at launch — the worst place for a module
// to come back half-initialised. It's pure data with no dependencies, so
// nothing imports a component to read it any more.

export const SCREEN_HELP = {
  Home: {
    title: 'Home',
    body: 'Your dashboard — daily missions, streak, and a snapshot of what needs attention today.',
  },
  Training: {
    title: 'Training',
    body: 'Skill games that build real-world abilities while you play. Progress here feeds your rank and points.',
  },
  LibraryScreen: {
    title: 'Library',
    body: 'The hub for everything you build and collect: Projects, Notes, Research, Life Areas, Discover, and more.',
  },
  PlannerScreen: {
    title: 'Planner',
    body: 'Your agenda. Switch between Daily, Weekly, and Monthly views, filter by life area, and tap Add (or the grid icon) to schedule something. Reminders you create here can send a notification before the scheduled time.',
  },
  CaptureInbox: {
    title: 'Capture Inbox',
    body: 'A landing zone for anything you jot down before deciding where it belongs. Tap an item to route it — to a project, your notes, the planner, a life area, and more.',
  },
  ImportScreen: {
    title: 'Import Hub',
    body: 'Bulk-import text, links, or files. Items land in your Capture Inbox so you can process them the same way as anything else.',
  },
  ProjectsScreen: {
    title: 'The Workshop',
    body: 'Every project you’re building, from a rough blueprint to something you’re showing off. Tap + to start a new one.',
  },
  ProjectDetail: {
    title: 'Build',
    body: 'A single project’s workspace — tasks, research, and journal entries all live here.',
  },
  // Notes Desk, the Research Vault, and Resources & Instruments are one
  // screen now (src/screens/library/knowledge.js). The old route names still
  // resolve to it, so each keeps help copy describing the view it opens on.
  KnowledgeScreen: {
    title: 'Knowledge Vault',
    body: 'Everything you write down or save for later — notes, bookmarks, papers, and tools — in one list. Use the type pills to narrow it down, or Discover to add curated sites and research tools.',
  },
  ResearchScreen: {
    title: 'Research Vault',
    body: 'Links and resources you’ve saved for later reading or reference, outside of any one project. Lives in the Knowledge Vault alongside your notes and tools.',
  },
  ResourcesToolsScreen: {
    title: 'Resources & Tools',
    body: 'A library of tools and references you’ve saved for reuse — the Tools filter of your Knowledge Vault.',
  },
  IdeaGardenScreen: {
    title: 'Idea Garden',
    body: 'Where loose ideas get planted as seeds and grow over time as you add to them.',
  },
  DiscoverScreen: {
    title: 'Discover',
    body: 'Find mentors, fellow scholars, and interesting people and breakthroughs worth knowing about.',
  },
  LifeAreaScreen: {
    title: 'Life Area',
    body: 'A focused view into one part of your life — log notes and track how it’s going over time.',
  },
  NotesScreen: {
    title: 'Notes',
    body: 'Quick notes and thoughts — the Notes filter of your Knowledge Vault. Type in the box under the folders and tap + to save.',
  },
  Profile: {
    title: 'Profile',
    body: 'Your rank, points, streak, and account details live here.',
  },
  Settings: {
    title: 'Settings',
    body: 'Theme (light/dark), notifications, and account preferences.',
  },
  Play: {
    title: 'Play',
    body: 'A single training game in progress.',
  },
  PlayGame: {
    title: 'Play',
    body: 'A single training game in progress.',
  },
  Leaderboard: {
    title: 'Leaderboard',
    body: 'See how your rank and points stack up.',
  },
  Family: {
    title: 'Family',
    body: "Link a parent or child's account. Read-only — a linked parent sees level, XP, points, and streak, and nothing else.",
  },
};
