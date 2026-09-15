// src/data/featureCatalog.js
// The ONE list of every surface the Wayfinder can gate, rank or recommend.
//
// Same reasoning as src/services/gameRegistry.js: three screens keeping
// their own idea of what exists is how entries drift into pointing at
// routes that were renamed two builds ago. LibraryScreen, GamesScreen,
// SettingsScreen, WayfinderScreen and the unlock sheet all read this.
//
// ─── gate ───────────────────────────────────────────────────────────────────
//
//   'open'          Always available. Most of the app. Listed here anyway so
//                   the Wayfinder can rank it for a purpose.
//   'locked'        Opens by finishing one of `unlockedBy`, or — when
//                   `testable` — by passing its competence test first time.
//   'experimental'  Real, reachable, and visibly unfinished. Off until the
//                   account opts in (profiles.experimental_opt_in), because
//                   stumbling into rough work you never asked for reads as a
//                   broken app, not an early look.
//   'paid'          Needs an active plan (profiles.plan = 'plus').
//
// A gate is a front door, not a security boundary. Anything that genuinely
// must not happen — publishing as a minor, reading another account's rows —
// is enforced in SQL (see accountAccess.js's note on the same split) and
// stays enforced whatever this file says.
//
// ─── the rest of the fields ─────────────────────────────────────────────────
//
//   screen      route name in App.js / LibraryNav.js. Null for things that
//               aren't a screen of their own (a capability inside one).
//   parent      the feature whose screen hosts it, for capabilities.
//   purposes    which of PURPOSES (src/data/objectives.js) this actually
//               serves. Drives ranking, and nothing else.
//   depth       'first-step' | 'core' | 'deep'. What the Wayfinder leads
//               with for someone brand new versus what it holds back.
//   unlockedBy  objective ids; finishing ANY of them opens it.
//   testable    offer the test-out route (src/data/competencyTests.js).
//   why         shown on the lock — what you get, in plain words.

export const FEATURES = [
  /* ── Always open ─────────────────────────────────────────────────────── */
  {
    id: 'home-desk',
    label: 'Home',
    screen: 'Home',
    icon: 'home-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['habits', 'wellbeing', 'build', 'learn', 'money', 'career'],
    blurb: 'Today’s focus, your streak, and the one thing worth doing next.',
  },
  {
    id: 'training',
    label: 'Training',
    screen: 'Training',
    icon: 'barbell-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['learn', 'habits', 'money'],
    blurb: 'Short skill games that feed your rank and your daily drills.',
  },
  {
    id: 'capture',
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
    label: 'The Workshop',
    screen: 'ProjectsScreen',
    icon: 'hammer-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['build', 'career'],
    blurb: 'Every project you are building, from blueprint to shipped.',
  },
  {
    id: 'idea-garden',
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
    label: 'Academy Classes',
    screen: 'ClassesStack',
    icon: 'ribbon-outline',
    gate: 'open',
    depth: 'core',
    purposes: ['learn', 'career'],
    blurb: 'Structured lessons across every subject the app teaches.',
  },
  {
    id: 'wayfinder',
    label: 'Wayfinder',
    screen: 'Wayfinder',
    icon: 'navigate-outline',
    gate: 'open',
    depth: 'first-step',
    purposes: ['habits', 'build', 'learn', 'wellbeing', 'money', 'career'],
    blurb: 'Your purpose, the one objective you are on, and what it opens.',
  },

  /* ── Locked — earned by finishing an objective, or tested out of ──────── */
  {
    id: 'portfolio',
    label: 'Portfolio Archives',
    screen: 'PortfolioScreen',
    icon: 'briefcase-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['build', 'career'],
    unlockedBy: ['ship-first-build'],
    testable: true,
    blurb: 'A public-facing record of what you have actually finished.',
    why: 'An empty portfolio is worse than no portfolio. This opens once you have something to put in it — or once you show you already know what belongs there.',
  },
  {
    id: 'career-map',
    label: 'Career Expeditions',
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
    label: 'Work Mode',
    screen: 'WorkModeScreen',
    icon: 'timer-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['build', 'learn', 'career'],
    unlockedBy: ['hold-the-line', 'learn-one-skill'],
    testable: true,
    blurb: 'A stripped-back focus session against one project at a time.',
    why: 'Deep work needs something worth going deep on. Get a rhythm going, then this earns its place.',
  },
  {
    id: 'import-hub',
    label: 'Import Hub',
    screen: 'ImportScreen',
    icon: 'download-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['learn', 'build', 'habits'],
    unlockedBy: ['learn-one-skill', 'clear-the-inbox'],
    testable: true,
    blurb: 'Bulk-import text, links and files straight into your inbox.',
    why: 'Importing hundreds of items into an inbox you have never processed just moves the pile. Learn the inbox first.',
  },
  {
    id: 'discover',
    label: 'Discover',
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
    label: 'Lesson Plan Builder',
    screen: 'LessonBuilder',
    icon: 'school-outline',
    gate: 'locked',
    depth: 'deep',
    purposes: ['learn', 'career'],
    unlockedBy: ['run-one-lesson'],
    testable: true,
    blurb: 'Build and save classroom-day lesson plans for other people.',
    why: 'An authoring tool in a learner’s hands is clutter. Show you teach, or prove you know how, and it appears. If you already teach, Settings → Educator Mode switches it on directly — this route is for everyone who was never going to go looking in Settings.',
  },
  {
    id: 'savings-investing',
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
    label: 'Organizations & Cohorts',
    screen: 'Organization',
    icon: 'business-outline',
    gate: 'paid',
    depth: 'deep',
    purposes: ['career', 'learn'],
    blurb: 'Run a class, team or group: rosters, invites, assignments, progress.',
    why: 'Multi-seat tooling — invite codes, cohort rosters, assignment tracking across other people’s accounts.',
  },
  {
    id: 'insights',
    label: 'Deep Insights',
    screen: 'Stats',
    icon: 'analytics-outline',
    gate: 'paid',
    depth: 'deep',
    purposes: ['habits', 'learn', 'career'],
    blurb: 'Long-range trends across subjects, streaks and sessions.',
    why: 'Full history rather than the last fortnight, with per-subject breakdowns.',
  },
  {
    id: 'ai-import',
    label: 'AI Import',
    screen: null,
    parent: 'import-hub',
    icon: 'sparkles-outline',
    gate: 'paid',
    depth: 'deep',
    purposes: ['build', 'learn', 'career'],
    blurb: 'Point it at messy text and it sorts what it found into real items.',
    why: 'Parsing runs against a paid model, so this one genuinely costs money per use.',
  },
  {
    id: 'custom-paths',
    label: 'Custom Objectives',
    screen: null,
    parent: 'wayfinder',
    icon: 'git-branch-outline',
    gate: 'paid',
    depth: 'deep',
    purposes: ['habits', 'build', 'learn', 'wellbeing', 'money', 'career'],
    blurb: 'Write your own objective and its steps instead of picking one of ours.',
    why: 'For when none of the nine built-in objectives is the thing you are actually trying to do.',
  },
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
