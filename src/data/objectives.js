// src/data/objectives.js
// Purposes and objectives — the "why am I here" and "what is the one thing
// I'm doing about it" behind the Compass.
//
// The app can do a great many things, which is precisely the problem this
// solves: opening it should feel like being handed one next step, not a
// directory. So:
//
//   A PURPOSE is picked once (onboarding, or Compass later) and written to
//   profiles.purpose_key. Everything the app chooses to lead with is ranked
//   against it — see rankForPurpose() in src/logic/featureAccess.js.
//
//   An OBJECTIVE is a single finishable achievement, 4 steps, days not
//   months. Exactly one is active at a time (enforced in SQL by
//   user_objectives_one_active_idx) because the whole point is that there is
//   one answer to "what now".
//
// Finishing an objective is also how most locked features open — the reward
// for focus is more app, rather than more app being the thing you have to
// wade through first. src/data/featureCatalog.js names which.
//
// A step ticks itself wherever the app can honestly tell that it happened.
// Two ways, and by hand only when neither fits:
//
//   `auto`        names a number the app already tracks (streak days, level,
//                 points, missions, rounds played). Asking someone to
//                 self-report a streak the app is already counting is
//                 busywork, and inviting them to tick "kept a 3-day streak"
//                 on day one is just an invitation to lie to themselves.
//                 These steps can't be hand-ticked at all.
//   `signal`      names an action a screen reports through
//                 AccessContext.signalAction — 'inbox-captured',
//                 'planner-item-added', 'vault-saved'. A colon narrows it:
//                 'planner-item-added:physical' only counts a Physical one.
//                 `signalCount` makes it take more than once ("capture five
//                 things"), and the step keeps a running number until then.
//
// Only a step nothing can observe is left to a hand tick — "actually teach
// it to someone", "decide it is ready to show". Those are judgements, not
// events, and asking the app to guess at them would be worse than asking.
//
// Two steps of the SAME objective must not share a signal: one action would
// tick both.

/* ─── Purposes ────────────────────────────────────────────────────────────── */
//
// `matches` maps the answers MultiStepOnboarding already collects
// (primary_goal, motivation, usage_patterns) onto a purpose, so the
// suggestion is drawn from what someone actually said rather than asking
// them the same question a seventh time.

export const PURPOSES = [
  {
    key: 'habits',
    label: 'Build a daily rhythm',
    short: 'Rhythm',
    emoji: '📅',
    accentKey: 'teal',
    blurb: 'Small things, done most days, until they stop taking willpower.',
    leads: ['home-desk', 'planner', 'training'],
    starterObjective: 'hold-the-line',
    matches: {
      goals:       ['Build better habits', 'Feel more confident'],
      motivations: ['growth'],
      usage:       ['habits', 'planning'],
    },
  },
  {
    key: 'build',
    label: 'Ship something real',
    short: 'Build',
    emoji: '🏗️',
    accentKey: 'gold',
    blurb: 'You have an idea. The aim is that it exists by the end of the month.',
    leads: ['workshop', 'idea-garden', 'capture'],
    starterObjective: 'ship-first-build',
    matches: {
      goals:       ['Start a project', 'Learn new skills'],
      motivations: ['creativity'],
      usage:       ['building'],
    },
  },
  {
    key: 'learn',
    label: 'Learn a real skill',
    short: 'Learn',
    emoji: '🎓',
    accentKey: 'purple',
    blurb: 'Pick one subject and get measurably better at it, not busier around it.',
    leads: ['classes', 'training', 'knowledge-vault'],
    starterObjective: 'learn-one-skill',
    matches: {
      goals:       ['Learn new skills'],
      motivations: ['learning'],
      usage:       ['learning'],
    },
  },
  {
    key: 'wellbeing',
    label: 'Look after myself',
    short: 'Wellbeing',
    emoji: '🌿',
    accentKey: 'teal',
    blurb: 'Sleep, movement, and a head that is quiet enough to think in.',
    leads: ['life-areas', 'home-desk', 'planner'],
    starterObjective: 'steady-body',
    matches: {
      goals:       ['Improve my health', 'Find my purpose'],
      motivations: ['wellness'],
      usage:       ['reflecting'],
    },
  },
  {
    key: 'money',
    label: 'Get my money right',
    short: 'Money',
    emoji: '💰',
    accentKey: 'gold',
    blurb: 'Know what comes in, what goes out, and what you are doing about it.',
    leads: ['life-areas', 'planner', 'training'],
    starterObjective: 'money-baseline',
    matches: {
      goals:       ['Grow financially'],
      motivations: ['finance'],
      usage:       [],
    },
  },
  {
    key: 'career',
    label: 'Move my career forward',
    short: 'Career',
    emoji: '🧭',
    accentKey: 'purple',
    blurb: 'Work out where you are heading, then leave evidence that you can get there.',
    leads: ['workshop', 'classes', 'capture'],
    starterObjective: 'map-your-career',
    matches: {
      goals:       ['Advance my career'],
      motivations: ['career'],
      usage:       ['building', 'planning'],
    },
  },
];

export const PURPOSE_BY_KEY = Object.fromEntries(PURPOSES.map(p => [p.key, p]));

export function getPurpose(key) {
  return PURPOSE_BY_KEY[key] || null;
}

/* ─── Objectives ──────────────────────────────────────────────────────────── */
//
// step.auto — a stat the app already counts, so the step ticks itself:
//   { stat: 'streak' | 'level' | 'points' | 'missions' | 'played', value: n }
// 'missions' is daily missions completed today — which only completes when
// one of the day's randomly picked missions does, so it's the wrong counter
// for "play a game". 'played' is lifetime activities answered in any game
// (subject_progress), which ticks after one round of anything. The rest are
// lifetime figures straight off the profile. See stepSatisfied() in
// src/logic/featureAccess.js, which is the only thing that reads this.
//
// step.screen — a route name, so the step card can offer "Open" instead of
// leaving someone to hunt for the screen it means. Route names come from
// src/screens/library/LibraryNav.js and App.js's stack.

export const OBJECTIVES = [
  {
    id: 'hold-the-line',
    purpose: 'habits',
    label: 'Hold the Line',
    promise: 'Three days in a row where you showed up. That is the whole thing.',
    why: 'Nothing else in here works until turning up is boring. This is the smallest version of that.',
    estimate: '3 days',
    steps: [
      { id: 'focus',   label: 'Set a focus for today',        hint: 'One line on Home. What today is actually for.', screen: 'Home', signal: 'focus-set' },
      { id: 'mission', label: 'Finish a daily drill',          hint: "Open shows today's three and a game for each. Ticks itself when one is done.", screen: 'Training', params: { openDrills: true }, auto: { stat: 'missions', value: 1 } },
      { id: 'plan',    label: 'Put one thing in the Planner',  hint: 'Something real and dated, not a wish.', screen: 'PlannerScreen', signal: 'planner-item-added' },
      { id: 'streak',  label: 'Reach a 3-day streak',          hint: 'Ticks itself the day your streak hits three.', auto: { stat: 'streak', value: 3 } },
    ],
    unlocks: ['weekly-review', 'work-mode'],
    next: 'clear-the-inbox',
  },

  {
    id: 'ship-first-build',
    purpose: 'build',
    label: 'Ship Your First Build',
    promise: 'One project taken from a rough idea to something you would show someone.',
    why: 'A finished small thing teaches more than a shelf of unfinished ambitious ones.',
    estimate: 'About a week',
    steps: [
      { id: 'seed',    label: 'Plant the idea in the Idea Garden', hint: 'Rough is fine. It only has to be written down.', screen: 'IdeaGardenScreen', signal: 'idea-planted' },
      { id: 'project', label: 'Start a project in the Workshop',   hint: 'Give it a name you would say out loud.', screen: 'ProjectsScreen', signal: 'project-started' },
      { id: 'step',    label: 'Set its next physical step',        hint: 'Not "work on it" — the actual next move.', screen: 'ProjectsScreen', signal: 'project-next-set' },
      { id: 'ship',    label: 'Mark the project shipped',          hint: 'Open the build and tap SHIPPED at the top. Shipped beats perfect.', screen: 'ProjectsScreen', signal: 'project-shipped' },
    ],
    unlocks: ['portfolio'],
    next: 'show-your-work',
  },

  {
    id: 'learn-one-skill',
    purpose: 'learn',
    label: 'One Skill, Properly',
    promise: 'Pick a single subject and put real reps into it instead of sampling six.',
    why: 'Breadth is easy to fake and hard to use. This is the depth version.',
    estimate: 'About a week',
    steps: [
      { id: 'pick',   label: 'Open a class and pick one topic',  hint: 'One. The other twenty will keep.', screen: 'ClassesStack', signal: 'class-opened' },
      { id: 'note',   label: 'Save a note or source to the Vault', hint: 'Something you would want again in a month.', screen: 'KnowledgeScreen', signal: 'vault-saved' },
      { id: 'drill',  label: 'Finish three game rounds',          hint: 'Any game counts; a class topic often links its own. Ticks itself.', screen: 'Training', signal: 'round-played', signalCount: 3 },
      { id: 'level',  label: 'Reach level 3',                     hint: 'Ticks itself as your level comes up.', auto: { stat: 'level', value: 3 } },
    ],
    unlocks: ['import-hub', 'work-mode'],
    next: 'run-one-lesson',
  },

  {
    id: 'steady-body',
    purpose: 'wellbeing',
    label: 'Steady State',
    promise: 'A week of paying attention to sleep, movement and mood on purpose.',
    why: 'Every other goal in here is downstream of whether you are rested.',
    estimate: '1 week',
    steps: [
      { id: 'area',    label: 'Rate your Physical life area',    hint: 'Honestly. Nobody else sees it.', screen: 'LibraryScreen', signal: 'area-rated:physical' },
      { id: 'agenda',  label: 'Schedule one movement block',     hint: 'Twenty minutes, on a day, in the Planner. Tag it Physical and it ticks itself.', screen: 'PlannerScreen', signal: 'planner-item-added:physical' },
      { id: 'reflect', label: 'Write one reflection',            hint: 'What helped, what did not.', screen: 'KnowledgeScreen', signal: 'vault-saved' },
      { id: 'streak',  label: 'Reach a 5-day streak',            hint: 'Ticks itself on day five.', auto: { stat: 'streak', value: 5 } },
    ],
    unlocks: ['weekly-review'],
    next: 'clear-the-inbox',
  },

  {
    id: 'money-baseline',
    purpose: 'money',
    label: 'Know Your Numbers',
    promise: 'The unglamorous baseline: what comes in, what goes out, what is owed.',
    why: 'You cannot plan around numbers you are avoiding looking at.',
    estimate: '3 days',
    steps: [
      { id: 'area',    label: 'Rate your Financial life area',    hint: 'Where it actually is today.', screen: 'LibraryScreen', signal: 'area-rated:financial' },
      { id: 'game',    label: 'Play Budget Balance once',         hint: 'A cheap way to find the gaps in what you know.', screen: 'Training' },
      { id: 'capture', label: 'Capture your three biggest costs', hint: 'Rent-sized things, not coffee. Ticks itself at three.', screen: 'CaptureInbox', signal: 'inbox-captured', signalCount: 3 },
      { id: 'plan',    label: 'Schedule a monthly money review',  hint: 'Recurring, in the Planner. Half an hour — tag it Financial and it ticks itself.', screen: 'PlannerScreen', signal: 'planner-item-added:financial' },
    ],
    unlocks: ['savings-investing', 'debt-credit'],
    next: null,
  },

  {
    id: 'map-your-career',
    purpose: 'career',
    label: 'Draw the Map',
    promise: 'Name where you are trying to get to, and one piece of evidence you could get there.',
    why: '"Advance my career" is not a plan. A named target and one artefact is.',
    estimate: 'About a week',
    steps: [
      { id: 'area',    label: 'Rate your Professional life area', hint: 'Start from where you are, not where you would like to be.', screen: 'LibraryScreen', signal: 'area-rated:professional' },
      { id: 'capture', label: 'Capture the role you are aiming at', hint: 'A title, a company, or a description of the work.', screen: 'CaptureInbox', signal: 'inbox-captured' },
      { id: 'project', label: 'Start a project that proves it',   hint: 'Something a stranger could look at.', screen: 'ProjectsScreen', signal: 'project-started' },
      { id: 'points',  label: 'Earn 250 points',                  hint: 'Ticks itself. Evidence that you kept at it.', auto: { stat: 'points', value: 250 } },
    ],
    unlocks: ['career-map'],
    next: 'show-your-work',
  },

  /* ── First goals — one per profile type, started for you ─────────────────
     The first thing a brand-new account is handed (FIRST_GOALS in
     src/data/experienceStages.js names which type gets which). Three steps,
     one sitting, and every step points at a screen that type's stage 1
     already shows. The guide walks through them one at a time
     (src/logic/useGuidedFirstGoal.js), and each step ticks itself when the
     thing is actually done — `signal` names the action that does it (sent by
     that screen through AccessContext.signalAction). They open no feature of
     their own: finishing one opens the next stage. `intro` keeps them out of
     the general objective picker once they've done their job. */

  {
    id: 'first-steps',
    purpose: 'habits',
    intro: true,
    label: 'First Steps',
    promise: 'Three small things, today, to see how the app works for you.',
    why: 'Every habit starts with a day where you showed up once. This is that day.',
    estimate: 'About 10 minutes',
    // Not "set a focus": the focus widget isn't on stage 1's Home. Every
    // step here has to be doable with what stage 1 shows.
    steps: [
      { id: 'area',  label: 'Rate one life area',          hint: 'Honestly. Nobody else sees it. Ticks itself when you rate one.', screen: 'LibraryScreen', signal: 'area-rated' },
      { id: 'habit', label: 'Put one small habit in the Planner', hint: 'Something you could do most days. A glass of water counts.', screen: 'PlannerScreen', signal: 'planner-item-added' },
      { id: 'drill', label: 'Play one training game',      hint: 'Ticks itself when you finish a round.', screen: 'Training', auto: { stat: 'played', value: 1 } },
    ],
    unlocks: [],
    next: 'hold-the-line',
  },

  {
    id: 'first-study-session',
    purpose: 'learn',
    intro: true,
    label: 'First Study Session',
    promise: 'Open a class, play one game and put one study block on the calendar.',
    why: 'Studying gets easier once it has a time and a place. This sets both.',
    estimate: 'About 15 minutes',
    steps: [
      { id: 'class', label: 'Open a class and pick a topic',     hint: 'Any subject. You can switch any time.', screen: 'ClassesStack', signal: 'class-opened' },
      { id: 'drill', label: 'Play one training game',            hint: 'Ticks itself when you finish a round.', screen: 'Training', auto: { stat: 'played', value: 1 } },
      { id: 'block', label: 'Put one study block in the Planner', hint: 'Twenty minutes on a real day counts.', screen: 'PlannerScreen', signal: 'planner-item-added',
        idea: { title: 'Study block: 20 minutes', cadence: 'weekly', area: 'professional' } },
    ],
    unlocks: [],
    next: 'learn-one-skill',
  },

  {
    id: 'first-ops-check',
    purpose: 'career',
    intro: true,
    label: 'First Ops Check',
    promise: 'Get what you are juggling out of your head and give one routine a home.',
    why: 'Running things well starts with seeing all of it in one place.',
    estimate: 'About 15 minutes',
    steps: [
      { id: 'capture', label: 'Capture what is on your plate',     hint: 'The biggest thing this week. Speed over tidiness.', screen: 'CaptureInbox', signal: 'inbox-captured' },
      { id: 'routine', label: 'Put one weekly routine in the Planner', hint: 'Payroll, a restock, a report: something that repeats.', screen: 'PlannerScreen', signal: 'planner-item-added',
        idea: { title: 'Weekly numbers check', cadence: 'weekly', area: 'professional' } },
      { id: 'drill',   label: 'Play one training game',            hint: 'Register Ready or Shift Manager is a good start. Ticks itself.', screen: 'Training', auto: { stat: 'played', value: 1 } },
    ],
    unlocks: [],
    next: 'hold-the-line',
  },

  {
    id: 'first-founder-step',
    purpose: 'build',
    intro: true,
    label: 'First Founder Step',
    promise: 'Write the idea down, give it a project and try one money game.',
    why: 'An idea you have written down is one you can actually work on.',
    estimate: 'About 15 minutes',
    steps: [
      { id: 'seed',    label: 'Plant your idea in the Idea Garden', hint: 'One line on the problem it solves. Rough is fine.', screen: 'IdeaGardenScreen', signal: 'idea-planted' },
      { id: 'project', label: 'Start it as a project in the Workshop', hint: 'Give it a name you would say out loud.', screen: 'ProjectsScreen', signal: 'project-started' },
      { id: 'drill',   label: 'Play one training game',            hint: 'Budget Balance or Survive the Month. Ticks itself.', screen: 'Training', auto: { stat: 'played', value: 1 } },
    ],
    unlocks: [],
    next: 'ship-first-build',
  },

  /* ── Follow-ons — not starter objectives, offered once you have one done ── */

  {
    id: 'clear-the-inbox',
    purpose: 'habits',
    label: 'Clear the Deck',
    promise: 'Empty the Capture Inbox once, properly, and learn where things go.',
    why: 'A capture inbox you never process is a to-do list wearing a disguise.',
    estimate: '2 days',
    steps: [
      { id: 'capture', label: 'Capture five things',          hint: 'Anything on your mind. Speed over tidiness. Ticks itself at five.', screen: 'CaptureInbox', signal: 'inbox-captured', signalCount: 5 },
      { id: 'route',   label: 'Route three of them',          hint: 'To a project, a note, the planner — anywhere but back. Ticks itself at three.', screen: 'CaptureInbox', signal: 'inbox-processed', signalCount: 3 },
      { id: 'zero',    label: 'Get the inbox to zero',         hint: 'Archive counts. Deciding it does not matter is deciding.', screen: 'CaptureInbox', signal: 'inbox-zero' },
      { id: 'repeat',  label: 'Do it again the next day',     hint: 'Once is a tidy-up. Twice is a habit forming.', screen: 'CaptureInbox' },
    ],
    unlocks: ['import-hub'],
    next: null,
  },

  {
    id: 'show-your-work',
    purpose: 'build',
    label: 'Show Your Work',
    promise: 'Put a finished thing somewhere other people can see it.',
    why: 'Discover is a room full of other people’s work. Turning up with something of your own changes what it is for.',
    estimate: '2 days',
    steps: [
      { id: 'ship',      label: 'Have one shipped project',     hint: 'Open the build and tap SHIPPED at the top.', screen: 'ProjectsScreen', signal: 'project-shipped' },
      { id: 'portfolio', label: 'Add it to your Portfolio',      hint: 'Title, one line on what it was.', screen: 'PortfolioScreen', signal: 'portfolio-added' },
      { id: 'write',     label: 'Write what you learned',        hint: 'Two sentences. The part that surprised you.', screen: 'KnowledgeScreen', signal: 'vault-saved' },
      { id: 'ready',     label: 'Decide it is ready to show',    hint: 'It is. Tick it.' },
    ],
    unlocks: ['discover'],
    next: null,
  },

  {
    id: 'run-one-lesson',
    purpose: 'learn',
    label: 'Teach It Once',
    promise: 'Plan and run a single lesson for someone else.',
    why: 'Teaching a thing is the fastest audit of whether you actually know it.',
    estimate: 'About a week',
    steps: [
      { id: 'topic',  label: 'Pick the topic you know best',  hint: 'The one you would not need to look up.', screen: 'ClassesStack', signal: 'class-opened' },
      { id: 'outline', label: 'Outline it in the Knowledge Vault', hint: 'Five bullets is a lesson plan.', screen: 'KnowledgeScreen', signal: 'vault-saved' },
      { id: 'teach',  label: 'Actually teach it to someone',   hint: 'One person is a class.' },
      { id: 'revise', label: 'Note what you would change',     hint: 'The bit where they looked confused.', screen: 'KnowledgeScreen' },
    ],
    unlocks: ['lesson-builder'],
    next: null,
  },
];

export const OBJECTIVE_BY_ID = Object.fromEntries(OBJECTIVES.map(o => [o.id, o]));

export function getObjective(id) {
  return OBJECTIVE_BY_ID[id] || null;
}

// The objectives offered as a first pick for a purpose — its own starter
// first, then anything else tagged to that purpose, then everything else.
// Ordered rather than filtered: someone whose purpose is 'money' is still
// allowed to go and ship a build.
//
// The first goals (`intro`) are left out: each belongs to one profile type
// and is handed over at the start, not picked from a list of fifteen.
export function objectivesForPurpose(purposeKey) {
  const purpose = getPurpose(purposeKey);
  const starter = purpose?.starterObjective;
  return OBJECTIVES.filter(o => !o.intro).sort((a, b) => score(b) - score(a));

  function score(o) {
    if (o.id === starter) return 3;
    if (o.purpose === purposeKey) return 2;
    return 0;
  }
}

/* ─── Suggesting a purpose from what onboarding already asked ─────────────── */

// Scores every purpose against the answers already on the profile and
// returns the best key, or null when nothing matched at all (in which case
// the Compass asks outright rather than guessing).
export function suggestPurpose(profile) {
  if (!profile) return null;

  const goal        = profile.primary_goal || null;
  const motivation  = profile.motivation || null;
  const usage       = profile.usage_patterns || [];

  let best = null;
  let bestScore = 0;

  PURPOSES.forEach(p => {
    let n = 0;
    if (goal && p.matches.goals.includes(goal)) n += 3;
    if (motivation && p.matches.motivations.includes(motivation)) n += 2;
    n += (p.matches.usage || []).filter(u => usage.includes(u)).length;
    if (n > bestScore) { bestScore = n; best = p.key; }
  });

  // 'all' as a motivation means "I didn't want to choose", which is the one
  // answer that should not be turned into a confident guess.
  if (motivation === 'all' && bestScore <= 2) return null;

  return bestScore > 0 ? best : null;
}
