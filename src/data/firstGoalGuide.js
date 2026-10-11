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
// `more` (optional, for a step with a signalCount) is added to the short
// "1 of 3, two more to go" note after each one that counts.
//
// `go` is a route name (src/logic/appRoutes.js resolves it). `params`
// 'firstArea' means "the person's first life area", filled in at run time.
// Every `spot` must be a TourSpot rendered on its `go` screen;
// scripts/check-tour-spots.mjs fails the build if one isn't.
//
// No imports on purpose: plain data.

const DRILL = (say) => ({ go: 'Training', spot: 'training-enter', mode: 'tap', path: "Training → Enter Training", say });

export const FIRST_GOAL_GUIDE = {
  'first-steps': {
    area: {
      go: 'LifeAreaScreen', params: 'firstArea', spot: 'lifearea-rating', mode: 'tap',
      path: "Library → double-tap a life area",
      say: "Tap the **number** that fits this area right now. Only you see it.",
    },
    habit: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: "Library → Knowledge → Planner",
      say: "Tap **Add**, type one small habit (a glass of water counts), set it to **Daily**, and save.",
    },
    drill: DRILL("Tap here and play **one round**. It ticks itself when the round ends."),
  },
  'first-look': {
    area: {
      go: 'LifeAreaScreen', params: 'firstArea', spot: 'lifearea-rating', mode: 'tap',
      path: "Library → double-tap a life area",
      say: "Tap the **number** that fits this area right now. Only you see it.",
    },
    log: {
      go: 'LifeAreaScreen', params: 'ratedArea', spot: 'lifearea-quicklog', mode: 'tap',
      path: "Library → double-tap a life area",
      say: "Tap one to **log** something you did today. Small counts.",
    },
    drill: DRILL("Tap here and play **one round**. It ticks itself when the round ends."),
  },
  'first-study-session': {
    class: {
      go: 'ClassesMain', mode: 'point',
      path: "Library → Knowledge → Academy Classes",
      say: "Pick **any subject**, then open one topic.",
    },
    drill: DRILL("Tap here and play **one round**. It ticks itself when the round ends."),
    block: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: "Library → Knowledge → Planner",
      say: "Tap **Add** and plan one **20-minute** study block.",
    },
  },
  'first-ops-check': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: "+ → Capture Inbox",
      say: "Tap the lit-up **+** and write your **biggest task** this week.",
    },
    routine: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: "Library → Knowledge → Planner",
      say: "Tap **Add**: one routine that repeats (payroll, a restock). Set it to **Weekly**.",
    },
    drill: DRILL("Tap here and play **a round**. Try **Register Ready** or **Shift Manager**."),
  },
  'first-founder-step': {
    seed: {
      go: 'IdeaGardenScreen', spot: 'ideas-list', mode: 'tap',
      path: "Library → Knowledge → Idea Garden",
      say: "Tap the lit-up **+** and plant your idea in **one line**. Rough is fine.",
    },
    project: {
      go: 'ProjectsScreen', spot: 'projects-add', mode: 'tap',
      path: "Library → Build → The Workshop",
      say: "Tap **New Project** and give your idea a name.",
    },
    drill: DRILL("Tap here and play **a round**. Try **Budget Balance** or **Survive the Month**."),
  },

  // ── First goals by aim (onboarding's "What did you come here for?") ──
  'first-build': {
    seed: {
      go: 'IdeaGardenScreen', spot: 'ideas-list', mode: 'tap',
      path: "Library → Knowledge → Idea Garden",
      say: "Tap the lit-up **+** and plant your idea in **one line**. Rough is fine.",
    },
    project: {
      go: 'ProjectsScreen', spot: 'projects-add', mode: 'tap',
      path: "Library → Build → The Workshop",
      say: "Tap **New Project**. Fill in **Next step** too: the real next move, not \"work on it\".",
    },
    step: {
      go: 'ProjectsScreen', spot: 'projects-list', mode: 'point',
      path: "Library → Build → The Workshop",
      say: "Open your project and write its **next step**, like \"sketch the home screen\".",
    },
  },
  'first-direction': {
    map: {
      go: 'WayfinderScreen', params: { stage: 'core' }, mode: 'point',
      path: "Library → Build → Wayfinder",
      say: "**Three short question sets**: what you've done, what pulls you, what matters. No wrong answers. You get a **map** at the end.",
    },
    try: {
      go: 'WayfinderScreen', params: { stage: 'map' }, mode: 'point',
      path: "Library → Build → Wayfinder",
      say: "Pick a path on your map and try **one small experiment** this week. Come back after and say how it felt.",
    },
  },
  'first-toolkit': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: "+ → Capture Inbox",
      say: "Your **inbox**: drop a thought before you lose it. Tap the lit-up **+**. Sort it later.",
    },
    plan: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: "Library → Knowledge → Planner",
      say: "Your **Planner**: days, habits, to-dos. Tap **Add** and plan one real thing.",
    },
    vault: {
      go: 'KnowledgeScreen', spot: 'notes-input', mode: 'tap',
      path: "Library → Knowledge → Knowledge Vault",
      say: "Your **Vault** keeps notes and links. Type a note here and tap **+**.",
    },
  },
  // The person picks the area: that's the point of "improve parts of my
  // life". The log step then goes back to the one they rated.
  'first-areas': {
    rate: {
      go: 'LibraryScreen', spot: 'library-life-areas', mode: 'point',
      path: "Library",
      say: "Each circle is a **part of your life**. **Double-tap** the one to improve, then tap a **number**. Only you see it.",
    },
    log: {
      go: 'LifeAreaScreen', params: 'ratedArea', spot: 'lifearea-quicklog', mode: 'tap',
      path: "Library → double-tap a life area",
      say: "Tap one to **log** something you did. Small counts.",
    },
    plan: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: "Library → Knowledge → Planner",
      say: "Tap **Add**, pick the same **life area**, and plan one small thing.",
    },
  },
  'first-snapshot': {
    rate: {
      go: 'LibraryScreen', spot: 'library-life-areas', mode: 'point',
      path: "Library",
      say: "**Double-tap** a circle, tap a **number**, come back. Do **three**.",
      // Said after each one that counts, by the "1 of 3" note.
      more: "Tap the **arrow** (top left), then double-tap the next one.",
    },
    weigh: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: "+ → Capture Inbox",
      say: "Tap the lit-up **+** and write what's **weighing on you**, in one sentence.",
    },
    situation: {
      go: 'WayfinderScreen', params: { stage: 'situation' }, mode: 'point',
      path: "Library → Build → Wayfinder",
      say: "Pick what fits **right now**, then tap **See my plan**.",
    },
  },
  'first-store': {
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: "+ → Capture Inbox",
      say: "Tap the lit-up **+** and drop in a to-do, link or thought. **Speed over tidiness.**",
    },
    note: {
      go: 'KnowledgeScreen', spot: 'notes-input', mode: 'tap',
      path: "Library → Knowledge → Knowledge Vault",
      say: "The **Vault** keeps things for good. Type a note here and tap **+**.",
    },
    sort: {
      go: 'CaptureInbox', spot: 'inbox-list', mode: 'point',
      path: "+ → Capture Inbox",
      say: "Open one inbox item and **send it** somewhere: a project, a note or the Planner.",
    },
  },
  'first-rhythm': {
    habit: {
      go: 'PlannerScreen', spot: 'planner-add', mode: 'tap',
      path: "Library → Knowledge → Planner",
      say: "Tap **Add**, type one small habit, set it to **Daily**, and save.",
    },
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: "+ → Capture Inbox",
      say: "Tap the lit-up **+** and write the thing you **keep trying to remember**.",
    },
    focus: {
      go: 'Home', spot: 'home-focus-input', mode: 'tap',
      path: "the Focus card on Home",
      say: "Tap here and write **one line**: what today is for.",
    },
  },
  'first-money-look': {
    area: {
      go: 'LifeAreaScreen', params: { areaId: 'financial' }, spot: 'lifearea-rating', mode: 'tap',
      path: "Library → double-tap Financial",
      say: "Tap the **number** that fits your money **today**. Only you see it.",
    },
    capture: {
      go: 'CaptureInbox', spot: 'inbox-capture', mode: 'tap',
      path: "+ → Capture Inbox",
      say: "Tap the lit-up **+** and write your **biggest monthly cost**, like \"Rent, $1,200\".",
    },
    // Straight into the game: with every game open, "swipe until you find
    // it" could be twenty swipes.
    game: {
      go: 'Play', params: { gameId: 'budget' }, mode: 'point',
      path: "Training → Enter Training → Budget Balance",
      say: "**Budget Balance**: keep, swap or cut costs until the month **balances**. One round is enough. Tap **X** when done.",
    },
  },
};

// The last step of every first goal: claiming it, on Home.
export const CLAIM_STEP = {
  go: 'Home', spot: 'home-compass', mode: 'tap',
  path: "your goal card on Home",
  say: "Tap **Finish** on your goal card to claim it.",
};

// ── Every other goal ────────────────────────────────────────────────────────
// The guide walks every goal now, not only the first (2026-10-10). A goal
// with no hand-written script above gets one built from its own steps: go
// to the step's screen, light up that screen's main button, say the step's
// hint. Each `spot` here is a TourSpot that scripts/check-tour-spots.mjs
// already checks for the hand-written scripts.
const SPOT_FOR = {
  PlannerScreen: 'planner-add',
  CaptureInbox: 'inbox-capture',
  KnowledgeScreen: 'notes-input',
  IdeaGardenScreen: 'ideas-list',
  ProjectsScreen: 'projects-add',
  Training: 'training-enter',
  LifeAreaScreen: 'lifearea-rating',
};
// Steps whose signal is done somewhere other than the screen's main button.
const SPOT_FOR_SIGNAL = {
  'area-logged': 'lifearea-quicklog',
  'inbox-processed': 'inbox-list',
  'inbox-zero': 'inbox-list',
  'project-next-set': 'projects-list',
  'project-shipped': 'projects-list',
  'planner-item-done': null, // a circle on any item: pointed at, not lit
  'class-opened': null,
};
const GO_FOR = { ClassesStack: 'ClassesMain' };

export function autoScript(objective) {
  if (!objective?.steps) return null;
  const out = {};
  objective.steps.forEach(st => {
    // A step nothing can see happen ("teach it to someone") is ticked by
    // hand on the goal card. A counted one with no screen (level, points)
    // is earned in Training.
    if (!st.screen) {
      out[st.id] = st.auto
        ? { go: 'Training', spot: 'training-enter', mode: 'tap', path: 'Training', say: st.hint || 'Play a round. **Ticks itself.**' }
        : { go: 'Home', spot: 'home-compass', mode: 'point', path: 'your goal card on Home', say: `${st.hint ? `${st.hint} ` : ''}Then **tick it** on your goal card.` };
      return;
    }
    const go = GO_FOR[st.screen] || st.screen;
    const base = typeof st.signal === 'string' ? st.signal.split(':')[0] : null;
    let spot = base && base in SPOT_FOR_SIGNAL ? SPOT_FOR_SIGNAL[base] : (SPOT_FOR[go] || null);
    if (go === 'Home' && st.widget === 'focus') spot = 'home-focus-input';
    // Today's drills open in a sheet over Training: nothing on the screen to light.
    if (st.params?.openDrills) spot = null;
    out[st.id] = {
      go,
      // Not Home's openFocus: the guide lights up the box instead.
      params: go === 'Home' ? undefined : st.params,
      spot,
      mode: spot ? 'tap' : 'point',
      say: st.hint || st.label,
    };
  });
  return out;
}
