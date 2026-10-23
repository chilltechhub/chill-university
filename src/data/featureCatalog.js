// src/data/featureCatalog.js
// The ONE list of every surface the Compass can gate, rank or recommend.
//
// Same reasoning as src/services/gameRegistry.js: three screens keeping
// their own idea of what exists is how entries drift into pointing at
// routes that were renamed two builds ago. LibraryScreen, GamesScreen,
// SettingsScreen, CompassScreen and the unlock sheet all read this.
//
// ─── gate ───────────────────────────────────────────────────────────────────
//
//   'open'          Always available. Most of the app. Listed here anyway so
//                   the Compass can rank it for a purpose.
//   'locked'        Opens by finishing one of `unlockedBy`, or — when
//                   `testable` — by passing its competence test first time.
//   'experimental'  Real, reachable, and visibly unfinished. Off until the
//                   account opts in (profiles.experimental_opt_in), because
//                   stumbling into rough work you never asked for reads as a
//                   broken app, not an early look.
//   'paid'          Needs an active plan (profiles.plan = 'plus'). Kept out of
//                   sight entirely until Plus is on sale (app_config row
//                   'plus_on_sale'): a door with no key is noise.
//
// A gate is a front door, not a security boundary. Anything that genuinely
// must not happen — publishing as a minor, reading another account's rows —
// is enforced in SQL (see src/logic/allowed.js) and
// stays enforced whatever this file says.
//
// ─── the rest of the fields ─────────────────────────────────────────────────
//
//   screen      route name in App.js / LibraryNav.js. Null for things that
//               aren't a screen of their own (a capability inside one).
//   parent      the feature whose screen hosts it, for capabilities.
//   purposes    which of PURPOSES (src/data/objectives.js) this actually
//               serves. Drives ranking, and nothing else.
//   depth       'first-step' | 'core' | 'deep'. What the Compass leads
//               with for someone brand new versus what it holds back.
//   unlockedBy  objective ids; finishing ANY of them opens it.
//   testable    offer the test-out route (src/data/competencyTests.js).
//   settingKey  a Settings switch that is also a key to this door (Educator
//               Mode for the Lesson Builder). One more way in, and the lock
//               knows about it — not a side door around the lock.
//   why         shown on the lock — what you get, in plain words.
//   social      only worth showing once there are people on it. Hidden
//               while app_config 'social_on' is off (featureAccess.js).
//   place       where it sits in the app since the 2026-10-18 refocus
//               (docs/refocus-plan-2026-10-18.md): the app is for finding,
//               learning and doing; everything else supports that.
//                 'front'       the tabs, Home, the pitch
//                 'background'  no big card: a slim row in Library → Tools,
//                               and wherever a flow needs it
//                 'extra'       off until wanted: My features → More tools
//                               (or your path opens it). Never in "All in"
//                               unless ticked
//                 'off'         v2 (schools, teams, people). Not offered;
//                               a settingKey (Educator Mode) still opens it
//               Nothing is ever locked by its place: a goal step or a link
//               that opens one of these screens still opens it.

// Social screens outside this catalog, hidden by the same switch.
export const SOCIAL_SCREENS = ['Leaderboard'];

export const FEATURES = [
  /* ── Always open ─────────────────────────────────────────────────────── */
  {
    id: 'home-desk',
    place: 'front',
    label: 'Home',
    screen: 'Home',
    icon: 'home-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['habits', 'wellbeing', 'build', 'learn', 'money', 'career'],
    blurb: 'Today’s focus and the one thing worth doing next.',
  },
  {
    id: 'training',
    place: 'front',
    label: 'Practice',
    screen: 'Training',
    icon: 'game-controller-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['learn', 'habits', 'money'],
    blurb: 'Short skill games that feed your rank and your daily drills.',
  },
  {
    id: 'capture',
    place: 'background',
    label: 'Capture Inbox',
    screen: 'CaptureInbox',
    icon: 'create-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['build', 'career', 'habits'],
    blurb: 'Somewhere to put a thought before you have decided what it is.',
  },
  {
    id: 'life-areas',
    place: 'front',
    label: 'Life Areas',
    screen: 'LibraryScreen',
    icon: 'compass-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['wellbeing', 'money', 'career'],
    blurb: 'Eight areas of a life, each with an honest rating you set yourself.',
  },
  {
    id: 'workshop',
    place: 'background',
    label: 'The Workshop',
    screen: 'ProjectsScreen',
    icon: 'hammer-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['build', 'career'],
    blurb: 'Every project, from idea to done.',
  },
  {
    id: 'idea-garden',
    place: 'extra',
    label: 'Idea Garden',
    screen: 'IdeaGardenScreen',
    icon: 'leaf-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['build', 'learn'],
    blurb: 'Where an idea lives before it is a project.',
  },
  {
    id: 'knowledge-vault',
    place: 'front',
    label: 'Knowledge Vault',
    screen: 'KnowledgeScreen',
    icon: 'library-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['learn', 'build', 'career'],
    blurb: 'Notes, bookmarks, papers and tools, all searchable.',
  },
  {
    id: 'planner',
    place: 'background',
    label: 'Planner',
    screen: 'PlannerScreen',
    icon: 'calendar-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['habits', 'wellbeing', 'money', 'career'],
    blurb: 'Your agenda, daily through monthly, with reminders that fire.',
  },
  {
    id: 'classes',
    place: 'front',
    label: 'Classes',
    screen: 'ClassesStack',
    icon: 'ribbon-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['learn', 'career'],
    blurb: 'Structured lessons across every subject the app teaches.',
  },
  {
    id: 'compass',
    place: 'front',
    // "Goals" since 2026-10-20 (docs/consolidation-plan-2026-10-20.md §9:
    // it's where your goal and the stages live). Was "App Nav" from
    // 2026-10-10 (user: "compass should say APP NAV"). The id and route stay
    // 'compass' / 'Compass': saved progress and every navigate() use them.
    label: 'Goals',
    screen: 'Compass',
    icon: 'navigate-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['habits', 'build', 'learn', 'wellbeing', 'money', 'career'],
    blurb: 'What you are here for, the goal you are on, and what it opens.',
  },

  /* ── Locked — earned by finishing an objective, or tested out of ──────── */
  {
    id: 'portfolio',
    place: 'background',
    label: 'Showcase',
    screen: 'PortfolioScreen',
    icon: 'briefcase-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['build', 'career'],
    // Any unit finished opens it too (units.js: every unit unlocks it, since
    // its last step is handing the work in). The lock screen lists the goal.
    unlockedBy: ['ship-first-build'],
    testable: true,
    blurb: 'A public-facing record of what you have actually finished.',
    why: 'An empty showcase is worse than none. This opens once you hand in your first piece of work, or once you show you already know what belongs there.',
  },
  {
    id: 'career-map',
    place: 'front',
    label: 'Career Explorer',
    screen: 'CareerExplorationScreen',
    icon: 'map-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['career', 'learn'],
    unlockedBy: ['map-your-career'],
    testable: true,
    blurb: 'Explore paths, compare them, and work out the next real step.',
    why: 'Career browsing without a target is procrastination with a nice interface. Name the target first.',
  },
  {
    id: 'weekly-review',
    place: 'background',
    label: 'Weekly Review',
    screen: 'WeeklyReviewScreen',
    icon: 'stats-chart-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['habits', 'wellbeing', 'career'],
    unlockedBy: ['hold-the-line', 'steady-body'],
    testable: true,
    blurb: 'A weekly look back at what moved, what stalled, and what to drop.',
    why: 'A review of a week you were barely present for has nothing to review. Build the week first.',
  },
  {
    id: 'work-mode',
    place: 'background',
    label: 'Work Mode',
    screen: 'WorkModeScreen',
    icon: 'timer-outline',
    // Core, not earned: staying on a task is half of what the app is for
    // (CORE_OPENS in experienceStages.js). unlockedBy below is kept so the
    // goals that used to open it still name it, and earned unlocks stand.
    gate: 'open',
    depth: 'core',
    purposes: ['build', 'learn', 'career'],
    unlockedBy: ['hold-the-line', 'learn-one-skill'],
    testable: true,
    blurb: 'A stripped-back focus session against one project at a time.',
    why: 'Deep work needs something worth going deep on. Get a rhythm going, then this earns its place.',
  },
  {
    id: 'import-hub',
    place: 'extra',
    label: 'Bring stuff in',
    screen: 'ImportScreen',
    icon: 'download-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['learn', 'build', 'habits'],
    unlockedBy: ['learn-one-skill', 'clear-the-inbox'],
    testable: true,
    blurb: 'Lists, links and files into your inbox at once. Messy notes go to Fill with AI.',
    why: 'Importing hundreds of items into an inbox you have never processed just moves the pile. Learn the inbox first.',
  },
  {
    id: 'discover',
    place: 'off',
    social: true,
    label: 'Community',
    screen: 'DiscoverScreen',
    icon: 'people-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['build', 'career', 'learn'],
    unlockedBy: ['show-your-work'],
    testable: false,
    blurb: 'Other people’s breakthroughs, projects and mentors.',
    why: 'There is no test for this one on purpose — turning up with something of your own is the entire point of the room.',
  },
  {
    id: 'lesson-builder',
    place: 'off',
    label: 'Lesson Plan Builder',
    screen: 'LessonBuilder',
    icon: 'school-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['learn', 'career'],
    unlockedBy: ['run-one-lesson'],
    testable: true,
    settingKey: 'educatorMode',
    blurb: 'Build and save classroom-day lesson plans for other people.',
    why: 'An authoring tool in a learner’s hands is clutter. Show you teach, or prove you know how, and it appears. If you already teach, tick it in My features and it opens straight away.',
  },
  {
    id: 'savings-investing',
    place: 'extra',
    label: 'Savings & Investing',
    screen: 'SavingsInvestingScreen',
    icon: 'trending-up-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['money'],
    unlockedBy: ['money-baseline'],
    testable: true,
    blurb: 'The growth half of the money picture.',
    why: 'Investing before you know your own numbers is a fast way to lose them. Baseline first.',
  },
  {
    id: 'debt-credit',
    place: 'extra',
    label: 'Debt & Credit',
    screen: 'DebtCreditScreen',
    icon: 'card-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['money'],
    unlockedBy: ['money-baseline'],
    testable: true,
    blurb: 'What is owed, at what rate, and in what order to kill it.',
    why: 'Same reason as savings: this only makes sense on top of a baseline you have actually looked at.',
  },

  /* ── Experimental — real, rough, opt-in ───────────────────────────────── */
  {
    id: 'labs',
    place: 'off',
    social: true,
    label: 'Labs',
    screen: 'LabsScreen',
    icon: 'flask-outline',
    gate: 'experimental',
    depth: 'deep',
    purposes: ['build', 'learn'],
    blurb: 'Half-built experiments that may change shape or disappear.',
    why: 'Genuinely unfinished. Layout is rough in places and some of it will be rebuilt.',
  },
  {
    id: 'mentors',
    place: 'off',
    social: true,
    label: 'Mentors & Experts',
    screen: 'MentorsScreen',
    icon: 'person-add-outline',
    gate: 'experimental',
    depth: 'deep',
    purposes: ['career', 'learn'],
    blurb: 'Request time with someone further along than you.',
    why: 'The request flow works; matching is crude and the empty states are not finished.',
  },
  {
    id: 'community-feed',
    place: 'off',
    social: true,
    label: 'Community Feed',
    screen: 'CommunityFeedScreen',
    icon: 'chatbubbles-outline',
    gate: 'experimental',
    depth: 'deep',
    purposes: ['build', 'learn'],
    blurb: 'What everyone else is shipping, in one stream.',
    why: 'Moderation tooling is still catching up with the feed itself.',
  },
  {
    id: 'fellow-scholars',
    place: 'off',
    social: true,
    label: 'Fellow Scholars',
    screen: 'FellowScholarsScreen',
    icon: 'people-circle-outline',
    gate: 'experimental',
    depth: 'deep',
    purposes: ['learn'],
    blurb: 'Find people studying the same thing you are.',
    why: 'Matching is a first pass and the profiles are thin.',
  },

  /* ── Paid — the deep end ──────────────────────────────────────────────── */
  {
    id: 'organization',
    place: 'off',
    label: 'Organizations & Cohorts',
    screen: 'Organization',
    icon: 'business-outline',
    gate: 'paid',
    depth: 'deep',
    purposes: ['career', 'learn'],
    blurb: 'Run a class, team or group: rosters, invites, assignments, progress.',
    why: 'Multi-seat tooling — invite codes, cohort rosters, assignment tracking across other people’s accounts.',
  },
  // Was sold in Plus as "Deep Insights" while the screen only had game
  // stats. Now real life first (src/components/InsightsPanel.js), games
  // below. Free for now; whether it moves into Plus is the founder's call.
  {
    id: 'insights',
    place: 'background',
    label: 'Insights',
    screen: 'Stats',
    icon: 'analytics-outline',
    gate: 'open',
    depth: 'deep',
    purposes: ['habits', 'build', 'learn'],
    blurb: 'Your last four weeks: things done, habits kept, focus time, what you used.',
    why: 'See your real progress add up, then your game stats.',
  },
  // 'ai-import' (AI Import, a Plus perk on a paid model) was folded into
  // Fill with AI on 2026-10-16: the same job, free, with any chatbot. Its
  // server function was never deployed, so the perk had never worked.
  // 'custom-paths' (Custom Goals) was listed here and sold in Plus with no
  // screen behind it. Removed until it's built.
];

export const FEATURE_BY_ID = Object.fromEntries(FEATURES.map(f => [f.id, f]));

export function getFeature(id) {
  return FEATURE_BY_ID[id] || null;
}

// Every feature a given objective opens. The objective's own `unlocks` list
// is the source of truth for granting; this is the reverse lookup, derived
// from `unlockedBy` so the two can be cross-checked rather than hand-synced.
export function featuresUnlockedBy(objectiveId) {
  return FEATURES.filter(f => (f.unlockedBy || []).includes(objectiveId));
}

export function featuresWithGate(gate) {
  return FEATURES.filter(f => f.gate === gate);
}

// Route name -> feature, for screens that only know where they are. Several
// features can share a screen (a capability hosted inside another feature's
// screen has `screen: null`), so this only indexes the ones that own a route.
export const FEATURE_BY_SCREEN = Object.fromEntries(
  FEATURES.filter(f => f.screen).map(f => [f.screen, f])
);

export function featureForScreen(screenName) {
  return FEATURE_BY_SCREEN[screenName] || null;
}
