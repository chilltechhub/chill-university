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
// `go` is a route name (src/logic/appRoutes.js resolves it). `params`
// 'firstArea' means "the person's first life area", filled in at run time.
// Every `spot` must be a TourSpot rendered on its `go` screen;
// scripts/check-tour-spots.mjs fails the build if one isn't.
//
// No imports on purpose: plain data.

const DRILL = (say) => ({ go: 'Training', spot: 'training-enter', mode: 'tap', say });

export const FIRST_GOAL_GUIDE = {
  'first-steps': {
    area: {
      go: 'LifeAreaScreen', params: 'firstArea', spot: 'lifearea-rating', mode: 'tap',
      say: 'Tap the number that fits this part of your life right now. Honest beats flattering, and nobody else sees it. You can add a note about why afterwards.',
    },
    habit: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      say: 'Tap Add and put in one small habit, something you could do most days. A glass of water counts. Set it to repeat daily, then save it.',
    },
    drill: DRILL('Tap here and play any round. The step ticks itself when you finish.'),
  },
  'first-study-session': {
    class: {
      go: 'ClassesMain', mode: 'point',
      say: 'Pick any subject below, then open one topic inside it. You can switch any time.',
    },
    drill: DRILL('Tap here and play any round. The step ticks itself when you finish.'),
    block: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      say: 'Tap Add and put in one study block. Twenty minutes on a real day counts.',
    },
  },
  'first-ops-check': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      say: 'Tap + and write down the biggest thing on your plate this week. Speed over tidiness.',
    },
    routine: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      say: 'Tap Add and put in one routine that repeats: payroll, a restock, a report. Set it to weekly.',
    },
    drill: DRILL('Tap here and play a round. Register Ready or Shift Manager is a good start.'),
  },
  'first-founder-step': {
    seed: {
      go: 'IdeaGardenScreen', spot: 'ideas-list', mode: 'tap',
      say: 'Tap + and plant your idea: one line on the problem it solves. Rough is fine.',
    },
    project: {
      go: 'ProjectsScreen', spot: 'projects-add', mode: 'tap',
      say: 'Tap New Build and start your idea as a project. Give it a name you would say out loud.',
    },
    drill: DRILL('Tap here and play a round. Budget Balance or Survive the Month is a good start.'),
  },
};

// The last step of every first goal: claiming it, on Home.
export const CLAIM_STEP = {
  go: 'Home', spot: 'home-compass', mode: 'tap',
  say: 'Tap Finish on your goal card to claim it, and see what opens next.',
};
