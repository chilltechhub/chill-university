// src/data/firstGoalGuide.js
// What the guide says and points at for each step of a first goal
// (objectives.js, `intro: true`). src/logic/useGuidedFirstGoal.js walks
// through these one at a time: it takes the person to `go`, lights up the
// TourSpot `spot`, and waits for the step to tick itself (each first-goal
// step has a `signal` or an `auto` counter behind it).
//
//   mode 'tap'    the lit-up control is live (a passthrough step) — the
//                 person presses the real thing, and the guide steps aside
//                 once it's done or it opens another screen
//   mode 'point'  a pointer and a "Got it", then the person does it
//                 themselves — for steps with no single button to press
//
// `path` is how to get there without the guide, said in the bubble before
// it takes them. Keep it true to the Library's pages (Life / Build /
// Knowledge, LIBRARY_HUBS in LibraryScreen.js) and the tab bar.
//
// `go` is a route name (src/logic/appRoutes.js resolves it). `params`
// 'firstArea' means "the person's first life area", filled in at run time.
// Every `spot` must be a TourSpot rendered on its `go` screen;
// scripts/check-tour-spots.mjs fails the build if one isn't.
//
// No imports on purpose: plain data.

const DRILL = (say) => ({ go: 'Training', spot: 'training-enter', mode: 'tap', path: 'the Training tab at the bottom, then Enter Training', say });

export const FIRST_GOAL_GUIDE = {
  'first-steps': {
    area: {
      go: 'LifeAreaScreen', params: 'firstArea', spot: 'lifearea-rating', mode: 'tap',
      path: 'the Library tab, then double-tap a life area',
      say: 'Tap the number that fits this part of your life right now. Honest beats flattering, and nobody else sees it. A note box appears under it if you want to say why.',
    },
    habit: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Planner',
      say: 'Tap Add and put in one small habit, something you could do most days. A glass of water counts. Set it to repeat daily, then save it. Each day, tap the circle next to it to check it off.',
    },
    drill: DRILL('Tap here and play one round: a few quick questions. The step ticks itself when the round ends.'),
  },
  'first-study-session': {
    class: {
      go: 'ClassesMain', mode: 'point',
      path: 'the Library tab, swipe to the Knowledge page, then Academy Classes',
      say: 'Pick any subject below, then open one topic inside it. You can switch any time.',
    },
    drill: DRILL('Tap here and play one round: a few quick questions. The step ticks itself when the round ends.'),
    block: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Planner',
      say: 'Tap Add and put in one study block. Twenty minutes on a real day counts.',
    },
  },
  'first-ops-check': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: 'the + button, then Capture Inbox',
      say: 'Tap + and write down the biggest thing on your plate this week. Speed over tidiness.',
    },
    routine: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Planner',
      say: 'Tap Add and put in one routine that repeats: payroll, a restock, a report. Set it to weekly.',
    },
    drill: DRILL('Tap here and play a round. Register Ready or Shift Manager is a good start.'),
  },
  'first-founder-step': {
    seed: {
      go: 'IdeaGardenScreen', spot: 'ideas-list', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Idea Garden',
      say: 'Tap + and plant your idea: one line on the problem it solves. Rough is fine.',
    },
    project: {
      go: 'ProjectsScreen', spot: 'projects-add', mode: 'tap',
      path: 'the Library tab, swipe to the Build page, then The Workshop',
      say: 'Tap New Build and start your idea as a project. Give it a name you would say out loud.',
    },
    drill: DRILL('Tap here and play a round. Budget Balance or Survive the Month is a good start.'),
  },

  // ── First goals by aim (onboarding's "What did you come here for?") ──
  'first-build': {
    seed: {
      go: 'IdeaGardenScreen', spot: 'ideas-list', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Idea Garden',
      say: 'Tap + and plant your idea: one line on what it is or the problem it solves. Rough is fine; it only has to be written down.',
    },
    project: {
      go: 'ProjectsScreen', spot: 'projects-add', mode: 'tap',
      path: 'the Library tab, swipe to the Build page, then The Workshop',
      say: 'Tap New Build and start your idea as a project. Fill in the Next step box too: the actual next move, not "work on it". That ticks the last step at the same time.',
    },
    step: {
      go: 'ProjectsScreen', spot: 'projects-list', mode: 'point',
      path: 'the Library tab, swipe to the Build page, then The Workshop',
      say: 'Open your project and write its next step: the actual next move, like "sketch the home screen" or "ask Sam about pricing".',
    },
  },
  'first-direction': {
    map: {
      go: 'WayfinderScreen', mode: 'point',
      path: 'the Library tab, swipe to the Build page, then Wayfinder',
      say: 'Three short sets of questions: what you have done, what pulls you, and what matters to you. There are no wrong answers, and it saves as you go. At the end you get a map.',
    },
    try: {
      go: 'WayfinderScreen', mode: 'point',
      path: 'the Library tab, swipe to the Build page, then Wayfinder',
      say: 'Pick a path on your map that looks interesting and commit to one small experiment, something you could do this week. You come back afterwards and say how it felt, and the map learns from it.',
    },
  },
  'first-toolkit': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: 'the + button, then Capture Inbox',
      say: 'This is the inbox: somewhere to drop a thought before you lose it. Tap + and write anything on your mind. You sort it later.',
    },
    plan: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Planner',
      say: 'This is the Planner: your days, habits and to-dos. Tap Add and put in one real thing on a real day.',
    },
    vault: {
      go: 'KnowledgeScreen', spot: 'notes-input', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Knowledge Vault',
      say: 'This is the Knowledge Vault: notes, links and tools you want to find again. Tap here, type a note, and tap + to save it.',
    },
  },
  'first-areas': {
    rate: {
      go: 'LifeAreaScreen', params: 'firstArea', spot: 'lifearea-rating', mode: 'tap',
      path: 'the Library tab, then double-tap a life area',
      say: 'Tap the number that fits this part of your life right now. Honest beats flattering, and nobody else sees it.',
    },
    log: {
      go: 'LifeAreaScreen', params: 'firstArea', spot: 'lifearea-quicklog', mode: 'tap',
      path: 'the Library tab, then double-tap a life area',
      say: 'Tap one of these to log something you did for this area. Small counts: a walk, a call, a bill paid.',
    },
    plan: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Planner',
      say: 'Tap Add and plan one small thing for that area, on a real day. Pick that area on the form if there is a choice.',
    },
  },
  'first-snapshot': {
    rate: {
      go: 'LibraryScreen', spot: 'library-life-areas', mode: 'point',
      path: 'the Library tab',
      say: 'Each circle is one part of your life. Double-tap one to open it, tap the number that fits, then come back and do two more. The step ticks itself at three.',
    },
    weigh: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: 'the + button, then Capture Inbox',
      say: 'Tap + and write down what is weighing on you most right now, in a sentence. Getting it out of your head is the point.',
    },
    situation: {
      go: 'WayfinderScreen', params: { stage: 'situation' }, mode: 'point',
      path: 'the Library tab, swipe to the Build page, then Wayfinder',
      say: 'Pick whatever fits what is going on for you right now, then tap See my plan. You get a few steps for each, one at a time.',
    },
  },
  'first-store': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: 'the + button, then Capture Inbox',
      say: 'Tap + and drop something in: a to-do, a link, a thought. Speed over tidiness. The + button at the bottom of every screen gets you here too.',
    },
    note: {
      go: 'KnowledgeScreen', spot: 'notes-input', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Knowledge Vault',
      say: 'The Vault keeps things for good. Tap here, type a note you would want again in a month, and tap + to save it.',
    },
    sort: {
      go: 'CaptureInbox', spot: 'inbox-list', mode: 'point',
      path: 'the + button, then Capture Inbox',
      say: 'Now sort one thing out of the inbox: open it and send it to a project, a note or the Planner. Archiving counts too. An empty inbox means everything is where it belongs.',
    },
  },
  'first-rhythm': {
    habit: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: 'the Library tab, swipe to the Knowledge page, then Planner',
      say: 'Tap Add and put in one small habit, something you could do most days. Set it to repeat daily, then save it.',
    },
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: 'the + button, then Capture Inbox',
      say: 'Tap + and write down the thing you keep trying to remember. Out of your head, into here. Sort it later.',
    },
    focus: {
      go: 'Home', spot: 'home-focus-input', mode: 'tap',
      path: 'the Focus card on Home',
      say: 'Tap here and write one line: what today is actually for.',
    },
  },
  'first-money-look': {
    area: {
      go: 'LifeAreaScreen', params: { areaId: 'financial' }, spot: 'lifearea-rating', mode: 'tap',
      path: 'the Library tab, then double-tap Financial',
      say: 'Tap the number that fits where your money is today. Not where it should be. Nobody else sees it.',
    },
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: 'the + button, then Capture Inbox',
      say: 'Tap + and write down your biggest monthly cost and roughly what it is. Rent-sized, not coffee.',
    },
    game: DRILL('Tap here, then swipe to Budget Balance and play a round. It shows the gaps in what you know about budgets.'),
  },
};

// The last step of every first goal: claiming it, on Home.
export const CLAIM_STEP = {
  go: 'Home', spot: 'home-compass', mode: 'tap',
  path: 'your goal card on Home',
  say: 'Tap Finish on your goal card to claim it, and see what opens next.',
};
