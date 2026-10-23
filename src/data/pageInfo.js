// src/data/pageInfo.js
// "About this page" (docs/shake-up-plan-2026-10-21.md §7.3, P7): what each
// page is for, written for the new app. It replaces the Screen Tutorial,
// whose per-screen tours taught the old app and were not ported.
//
// PAGES, one per surface (src/logic/guide/surfaces.js), four short parts:
//   what     what this is for, one line
//   helps    how it helps you: which circle or the ground, and your path.
//            { default, path: { <pathKey>: line }, start: { <startPoint>: line } }
//            A starting point's line wins over a path's (a GED user's Learn
//            says "Your practice tests live here").
//   actions  the 2-3 main things to do here, each a button that does it:
//            { label, icon, screen, params? }
//   show     "Show me": up to three spotlight steps { id, title, body, on? },
//            `on` naming the routes a step's spot lives on
//
// ROUTE_HELP is the old screenHelp.js, folded in and reworded: one line for
// a screen that isn't a surface of its own (Settings, a life area...).
//
// Plain words, under 60 words a sheet, nothing about points, levels,
// streaks or rank, and only the new tab names (scripts/check-guide.mjs).
// No imports, so the check scripts load it as-is.

export const PAGES = {
  'today.day': {
    title: 'Today',
    what: 'Your day: the **next step**, your plans, and what is due.',
    helps: {
      default: 'Steady days are **the ground** everything else stands on.',
      path: { money: 'Money steps land here **on a real day**.', career: 'Applications and chats get **a time**, not a someday.' },
    },
    actions: [
      { label: 'Add a plan', icon: 'add', screen: 'PlannerScreen', params: { addFor: {} } },
      { label: 'See the week', icon: 'calendar-outline', screen: 'PlannerScreen', params: { view: 'week' } },
    ],
    show: [
      { id: 'home-compass', on: ['Home'], title: 'The next step', body: 'One thing at a time. **Tap it** to start.' },
      { id: 'planner-add', title: '+ Add', body: 'A plan, a reminder or a note, **on your day**.' },
      { id: 'planner-views', title: 'Day, Week, Month', body: '**Switch** how far ahead you look.' },
    ],
  },
  'today.week': {
    title: 'Your week',
    what: 'Seven days at a glance. **Tap a day** to plan it.',
    helps: { default: 'A week with gaps in it is **a week you can keep**.' },
    actions: [
      { label: 'Add a plan', icon: 'add', screen: 'PlannerScreen', params: { addFor: {} } },
      { label: 'Back to today', icon: 'today-outline', screen: 'PlannerScreen', params: { view: 'day' } },
    ],
    show: [
      { id: 'planner-views', title: 'Day, Week, Month', body: '**Switch** how far ahead you look.' },
      { id: 'planner-add', title: '+ Add', body: 'Put something on **any day**.' },
    ],
  },
  'today.month': {
    title: 'Your month',
    what: 'The whole month: **deadlines** and busy days.',
    helps: { default: 'See a crunch **before** it arrives.' },
    actions: [
      { label: 'See the week', icon: 'calendar-outline', screen: 'PlannerScreen', params: { view: 'week' } },
      { label: 'Add a plan', icon: 'add', screen: 'PlannerScreen', params: { addFor: {} } },
    ],
    show: [
      { id: 'planner-views', title: 'Day, Week, Month', body: '**Switch** how far ahead you look.' },
    ],
  },
  'today.calm': {
    title: 'Today, calm',
    what: 'One panel: the **next step** and your day. Nothing else.',
    helps: { default: 'Less on the screen, **more done**. Switch to Full any time.' },
    actions: [
      { label: 'Add a plan', icon: 'add', screen: 'PlannerScreen', params: { addFor: {} } },
      { label: 'My path', icon: 'map-outline', screen: 'PathScreen' },
    ],
    show: [
      { id: 'calm-next', title: 'The next step', body: 'One thing. **Tap it** when you are ready.' },
      { id: 'calm-plan', title: 'Your day', body: 'Your **focus** and what is planned.' },
      { id: 'planner-add', title: '+ Add', body: 'A plan, a reminder or a note.' },
    ],
  },
  'learn.path': {
    title: 'My path',
    what: 'Your path, **one unit at a time**, each ending in something real.',
    helps: {
      default: 'Each unit fills a circle: what you **love**, are **good at**, the world **needs**, or gets you **paid**.',
      path: {
        like: 'Small tries show **what you love**.',
        next: 'Every road after school, **side by side**.',
        money: 'How money works **when it is yours**.',
        career: 'From a job to **work that fits you**.',
        ground: 'One **small fix** first. Then your path.',
      },
      start: { ged: 'Your **practice tests** live here.' },
    },
    actions: [
      { label: 'Open my path', icon: 'map-outline', screen: 'PathScreen' },
      { label: 'Classes', icon: 'school-outline', screen: 'ClassesStack' },
      { label: 'Practice', icon: 'game-controller-outline', screen: 'Practice' },
    ],
    show: [
      { id: 'learn-path', on: ['Training'], title: 'My path', body: 'The unit you are on. **Open** picks it up.' },
      { id: 'path-current', on: ['PathScreen'], title: 'This unit', body: 'Where you are. **Open** it to keep going.' },
      { id: 'learn-find', on: ['Training'], title: 'Find', body: '**Tools and know-how** that save time or money.' },
    ],
  },
  'learn.unit': {
    title: 'A unit',
    what: 'A few short steps, then **one thing you make** and hand in.',
    helps: { default: 'Handed-in work is **proof**. It fills "good at" on You.' },
    actions: [
      { label: 'My path', icon: 'map-outline', screen: 'PathScreen' },
      { label: 'Make', icon: 'color-wand-outline', screen: 'LibraryScreen' },
    ],
    show: [
      { id: 'unit-beats', title: 'The steps', body: 'Short. Each **ticks** when you do it.' },
      { id: 'unit-handin', title: 'Hand it in', body: 'Tick the three **What good looks like** lines, then hand it in.' },
    ],
  },
  'learn.finds': {
    title: 'Finds',
    what: 'Free **tools and know-how**, picked to save you time or money.',
    helps: { default: 'Trying things is how you find **what you love**.' },
    actions: [
      { label: "Today's Find", icon: 'sparkles-outline', screen: 'Training' },
      { label: 'Wayfinder', icon: 'navigate-circle-outline', screen: 'WayfinderScreen' },
    ],
    show: [],
  },
  'make.board': {
    title: 'Make',
    what: 'Everything you make: **your work**, the Studio and your projects.',
    helps: { default: 'Making things shows what you are **good at**, to you first.' },
    actions: [
      { label: 'Make something', icon: 'color-wand-outline', screen: 'StudioScreen' },
      { label: 'Projects', icon: 'construct-outline', screen: 'ProjectsScreen' },
      { label: 'Showcase', icon: 'star-outline', screen: 'PortfolioScreen' },
    ],
    show: [
      { id: 'make-board', on: ['LibraryScreen'], title: 'Your work', body: '**To do, Doing, Handed in, Shown.** Tap one to open it.' },
      { id: 'home-studio', on: ['LibraryScreen'], title: 'The Studio', body: 'Make a page, a game, a plan. **About a minute.**' },
      { id: 'studio-kinds', on: ['StudioScreen'], title: 'What to make', body: '**Pick one.** Every part can be changed.' },
    ],
  },
  'make.saved': {
    title: 'Saved',
    what: 'What you **jotted down** or kept for later.',
    helps: { default: 'Kept things come back **when you need them**.' },
    actions: [
      { label: 'Capture Inbox', icon: 'file-tray-full-outline', screen: 'CaptureInbox' },
      { label: 'Saved', icon: 'bookmark-outline', screen: 'KnowledgeScreen' },
    ],
    show: [
      { id: 'inbox-capture', on: ['CaptureInbox'], title: 'Jot it down', body: 'Anything. **Sort it later.**' },
      { id: 'notes-input', on: ['KnowledgeScreen'], title: 'A note', body: 'Type, then **+** to keep it.' },
    ],
  },
  you: {
    title: 'You',
    what: 'Your **Dream**, your four circles, and what you have done.',
    helps: { default: 'Where the circles meet is **worth walking toward**.' },
    actions: [
      { label: 'My path', icon: 'map-outline', screen: 'PathScreen' },
      { label: 'Make it yours', icon: 'options-outline', screen: 'MakeItYours' },
      { label: 'Settings', icon: 'settings-outline', screen: 'Settings' },
    ],
    show: [
      { id: 'you-circles', title: 'Your four circles', body: 'Filled from **what you do**, not a quiz.' },
      { id: 'profile-rank', title: 'Receipts', body: 'What you **made, tried and handed in**.' },
    ],
  },
  'you.room': {
    title: 'Your room',
    what: 'Your character and pet, in **a room you decorate**.',
    helps: { default: 'Just for fun. **Every outfit is open.**' },
    actions: [
      { label: 'Make it yours', icon: 'options-outline', screen: 'MakeItYours' },
    ],
    show: [],
  },
};

// One line for screens that aren't a surface of their own (the old
// screenHelp.js, folded in).
export const ROUTE_HELP = {
  Compass: { title: 'Goals', body: 'Every goal, the one you are on, and **what it opens**. Your path lives in **Learn → My path**.' },
  Stats: { title: 'Insights', body: 'Your last four weeks: **things done**, habits kept, focus time, and what you used of what you saved.' },
  PlannerScreen: { title: 'Planner', body: '**Day, Week, Month.** Filter by life area. **+ Add** puts something on a day.' },
  CaptureInbox: { title: 'Capture Inbox', body: 'Anything you jot down lands here. **Tap one** to send it to a project, a note or a day.' },
  ImportScreen: { title: 'Bring stuff in', body: 'Lists, links and files land in your **Capture Inbox**. Messy notes go to **Fill with AI**.' },
  ProjectsScreen: { title: 'Projects', body: 'Every project, from a rough idea to **done**. Tap **+** to start one.' },
  ProjectDetail: { title: 'A project', body: 'Its tasks, research and notes, **in one place**.' },
  KnowledgeScreen: { title: 'Saved', body: 'Notes, links and tools you kept. **Type pills** narrow the list.' },
  ResearchScreen: { title: 'Research', body: 'Links and papers you kept **for later**.' },
  ResourcesToolsScreen: { title: 'Tools', body: 'Tools and references you kept **to use again**.' },
  IdeaGardenScreen: { title: 'Idea Garden', body: 'Loose ideas, planted. **Add to one** and it grows.' },
  DiscoverScreen: { title: 'Community', body: 'Mentors and people **worth knowing**.' },
  WayfinderScreen: { title: 'Wayfinder', body: "For when you **don't know yet**. Three short steps, then small experiments to try." },
  LifeAreaScreen: { title: 'Life area', body: 'One part of your life: **rate it 1 to 5**, plan one fix, rate it again.' },
  NotesScreen: { title: 'Notes', body: 'Quick notes. Type in the box and tap **+**.' },
  StudioScreen: { title: 'Studio', body: 'Make a page, a game, a plan. **Every part can be changed.**' },
  BuildScreen: { title: 'A Build', body: 'Open **a part** to see how it works, then make it yours.' },
  PortfolioScreen: { title: 'Showcase', body: 'What you finished, **ready to show**.' },
  Settings: { title: 'Settings', body: 'Your **account**, reminders, privacy and help. Look and features are on **Make it yours**.' },
  MakeItYours: { title: 'Make it yours', body: 'The **look**, what is in the app, Today and your character.' },
  Practice: { title: 'Practice', body: 'Short games that **practise** what classes teach.' },
  Play: { title: 'Play', body: 'A practice round.' },
  PlayGame: { title: 'Play', body: 'A practice round.' },
  Family: { title: 'Family', body: "Link a parent's or child's account. **Read-only**: they see progress, nothing else." },
  Credits: { title: 'Sources and credits', body: 'Where **every fact** comes from, and who made the art.' },
};

/**
 * What "About this page" shows.
 *   surface  a surface id, or null
 *   route    the route, for ROUTE_HELP when there's no surface
 *   ctx      { pathKey, startPoint }
 * Returns { title, what, helps, actions, show } (helps/actions/show may be
 * empty for a route-only page), or null for a page with nothing written.
 */
export function pageInfoFor(surface, route, { pathKey = null, startPoint = null } = {}) {
  const page = surface ? PAGES[surface] : null;
  if (page) {
    const h = page.helps || {};
    const helps = (startPoint && h.start?.[startPoint]) || (pathKey && h.path?.[pathKey]) || h.default || '';
    return {
      title: page.title, what: page.what, helps,
      actions: page.actions || [],
      show: (page.show || []).filter(st => !st.on || !route || st.on.includes(route)),
    };
  }
  const r = route ? ROUTE_HELP[route] : null;
  return r ? { title: r.title, what: r.body, helps: '', actions: [], show: [] } : null;
}

/** The words on a sheet, for the length rule. */
export function pageWords(info) {
  if (!info) return 0;
  const text = [info.what, info.helps, ...(info.actions || []).map(a => a.label)].join(' ').replace(/\*\*/g, '');
  return text.split(/\s+/).filter(Boolean).length;
}
