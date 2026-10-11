// src/logic/screenTutorials.js
// Content for the FAB's "Tutorial" action — a short, CURRENT-SCREEN-ONLY
// walkthrough (see startScreenTour in context/TourContext.js). Distinct
// from the full cross-app guided tour (tourSteps.js): this one never
// changes screen, just cycles through what's on the one you're already
// looking at. It reuses the exact same spotlight overlay (TourOverlay.js)
// — steps whose `id` matches a real <TourSpot id="..."> already in that
// screen's tree get spotlighted; everything else is a plain centered card.
//
// The HOME list ends with an automatic "Getting around" step explaining the
// tab bar (appended by buildScreenTutorial, not listed below) — TourOverlay
// understands the synthetic `navHint` flag and spotlights the bar without it
// needing to be a real TourSpot. No other screen gets one.

import { SCREEN_HELP } from '../data/screenHelp';
import { EXAMPLES } from '../config/chilltech';

// Hand-authored, multi-feature walkthroughs for the screens people spend
// the most time in. `id` matches a real <TourSpot id="..."> when one
// already exists on that screen — omit it for a plain card.
// Every way into a game lands on the same swipe feed (GameFeed.js), so
// Play and PlayGame share one walkthrough. It replaced the SCREEN_HELP line
// "A single training game in progress", which told nobody anything.
const PLAY_STEPS = [
  { title: 'Switch games', body: "**Swipe up or down** for the next game." },
  { title: 'Your level', body: "Pick your **level** first. A hot streak moves you up; misses ease you down." },
  { title: 'Leaving', body: "Tap **X** (top left) to leave. Every right answer is **already saved**." },
];

// App Nav (route 'Compass'). The guide sends people here once their first
// goal is done (src/logic/useGuidedFirstGoal.js), and this is what greets them.
const APP_NAV_STEPS = [
  { title: 'App Nav', body: "Your **map** of the app. Every **stage**: ✓ open, 🔒 still to come.", id: 'appnav-stages' },
  { title: 'How stages open', body: "**Finish a goal** or **gain a level**. Each one opens the next stage." },
  { title: 'Getting back', body: "Tap the **arrow** (top left) for Home. **App Nav** is always on your goal card." },
];

const SCREEN_FEATURES = {
  Compass: APP_NAV_STEPS,
  Play: PLAY_STEPS,
  PlayGame: PLAY_STEPS,
  Home: [
    { title: "Today's Focus", body: "The **one thing** that matters today. Tap the date box for your calendar.", id: 'home-focus-input' },
    { title: 'On the Desk', body: "What to **pick up next** from your projects, notes and ideas. Tap **+ Add** to pin one.", id: 'home-desk' },
    { title: "Today's Activities", body: "Everything **scheduled today**, in time order.", id: 'home-today-activities' },
    { title: 'Study & Play', body: "**Study** opens Daily Drills. **Play** opens a game. Both grow your streak.", id: 'home-study-play' },
    { title: "Today's Wisdom", body: "A daily quote, plus **your own affirmations** if you add some with **+**.", id: 'home-focus' },
  ],
  Training: [
    { title: 'Where the points come from', body: "Points and your **streak**. The streak is the one that matters.", id: 'training-stats' },
    { title: 'Daily Drills & Challenges', body: "**Daily Drills**: three small targets, new each day. **Challenges**: the bigger weekly ones.", id: 'training-games' },
    { title: 'Pick a subject', body: "Tap **Enter Training** to pick a subject and play.", id: 'training-enter' },
    { title: 'Try one now', body: "One round takes **two minutes**, and helps the app suggest the right things.", id: 'training-enter' },
  ],
  // The Library is three sub-views behind one tab bar, and a hub's cards only
  // exist while their own sub-view is showing. Steps that point at a card
  // therefore have to declare `librarySubTab` — LibraryScreen switches to it
  // while the tour is active (see the effect next to setActiveTab there).
  // Without it these steps rendered with no highlight at all, because the
  // TourSpot they name genuinely wasn't mounted.
  LibraryScreen: [
    {
      title: 'Life Areas',
      body: "Each circle is a **part of your life**. **Double-tap** to open it. One tap filters the list.",
      id: 'library-life-areas',
      librarySubTab: 'domains',
    },
    {
      title: 'Three views, one Library',
      body: "**Life**: how it's going. **Build**: what you're making. **Knowledge**: what you're learning and planning.",
      id: 'library-life-areas',
      librarySubTab: 'domains',
    },
    {
      title: 'Build',
      body: "**Workshop**: your projects. **Portfolio**: what you've finished. **Wayfinder** and **Careers**: where it could go.",
      id: 'hub-section-academic',
      librarySubTab: 'build',
    },
    {
      title: 'Knowledge',
      body: "**Classes** to learn. **Idea Garden** for ideas. **Vault** for notes and links. **Planner** for your days.",
      id: 'hub-section-knowledge',
      librarySubTab: 'knowledge',
    },
    {
      // Was 'library-trophy-hall', pointing at a carousel that no longer
      // exists — the Trophy Hall was replaced by an Archives count on the
      // Portfolio card (see the comment above PreviewSection in
      // LibraryScreen.js). No TourSpot ever had that id, so this step
      // rendered with no highlight at all, describing a screen the user
      // couldn't see. Now points at the card that actually holds it.
      title: 'Portfolio Archives',
      body: "Finish a project or class and it **lands here** on its own. Your record to show people.",
      id: 'hub-PortfolioScreen',
      librarySubTab: 'build',
    },
    { title: 'Capture', body: "Tap **Capture** (top right) to save a thought now. **Sort it later.**", id: 'library-capture', librarySubTab: 'domains' },
  ],
  PlannerScreen: [
    { title: 'Three views', body: "**Daily**, **Weekly** or **Monthly** view. Tap a life area to filter.", id: 'planner-views' },
    { title: 'Habits vs. one-offs', body: "**One-off**: happens once. **Habit**: repeats every day, week or month.", id: 'planner-add' },
    { title: 'Add', body: "Tap **Add** to plan something. **⋯ → Add from ideas** has ready-made habits.", id: 'planner-add' },
  ],
  // Capture -> label -> process, in that order, because that's the actual
  // loop: the whole point of the inbox is that capturing is separated from
  // deciding, so the tutorial has to teach both halves and the handoff.
  CaptureInbox: [
    {
      title: 'Capture first, decide later',
      body: "Drop anything here: a link, a task, half a thought. **Don't decide where it goes yet.**",
      id: 'inbox-capture',
      prefill: EXAMPLES.capture,
    },
    {
      title: 'Give it a label',
      body: "Pick a **label** (Note, Task, Link…). It decides where the item can go next.",
      id: 'inbox-capture',
    },
    {
      title: 'Then process it',
      body: "Tap an item to **send it** to a project, the Planner, your notes or the Idea Garden.",
      id: 'inbox-list',
    },
    {
      title: "Don't let it rot",
      body: "Items show **time left**. Empty the inbox a few at a time.",
      id: 'inbox-list',
    },
  ],
  // Ends by actually starting a build rather than describing how. The last
  // step is `passthrough`, so the tap lands on the real button and the sheet
  // opens pre-filled with EXAMPLES.project — editable, and nothing is saved
  // until the user presses Start themselves.
  ProjectsScreen: [
    { title: 'This is the Workshop', body: "**Every project lives here**, with its own tasks, notes and log.", id: 'projects-list' },
    { title: 'Stages', body: "**Idea**: not started. **In progress**: underway. **Done**: finished, and it goes to your **Portfolio**.", id: 'projects-list' },
    { title: 'Finding one later', body: "**Search** by name once you have a few.", id: 'projects-search' },
    {
      title: "Let's make one",
      body: "Tap **New Project**. I've filled in an example: a **clear name** and what **done** looks like. Change it to yours.",
      id: 'projects-add',
      passthrough: true,
      prefill: EXAMPLES.project,
    },
  ],
  // Notes Desk, the Research Vault, and Resources & Instruments merged into
  // the Knowledge Vault. All four route names land on the same screen, so
  // each gets a tutorial framed around the view it opens on.
  KnowledgeScreen: [
    { title: 'One vault', body: "Notes, links, papers and tools in **one list**. Tap a type to filter.", id: 'resources-list' },
    { title: 'Quick notes', body: "Type in the box and tap **+** to save a note.", id: 'notes-input' },
    { title: 'Add anything else', body: "Tap **New** for a link, paper or tool. Paste a URL and it **files itself**.", id: 'research-list' },
    { title: 'Folders come later', body: "**Save first, sort later.** Make folders once you see what you keep.", id: 'resources-list' },
  ],
  ResearchScreen: [
    { title: 'Research Vault', body: "Links saved to read later. Part of your **Knowledge Vault**.", id: 'research-list' },
    { title: 'Papers get citations', body: "Save an arXiv, DOI or PDF link and it files as a **paper** with its citation.", id: 'resources-list' },
  ],
  // ProjectDetail has no TourSpots of its own yet — every step below is a
  // plain centered card (no spotlight). Still real, structured coverage;
  // wire in TourSpots later if the exact highlight matters.
  ProjectDetail: [
    { title: 'Workbench', body: "**Next tasks**, deadlines, work time and open questions. What to pick up." },
    { title: 'Materials', body: "**Everything saved** for this project, filterable by type." },
    { title: 'Project log', body: "The **history** of this project: steps done, notes, milestones." },
    { title: 'Add', body: "Tap **Add** (top right) to log a thought, task or note here." },
  ],
  ResourcesToolsScreen: [
    { title: 'Tools you keep coming back to', body: "**Tools** you use again: calculators, references, useful sites.", id: 'resources-list' },
    { title: 'Discover has more', body: "**Discover** has picked tools and research sites.", id: 'resources-list' },
  ],
  // No TourSpots here yet either — see the ProjectDetail note above.
  DiscoverScreen: [
    { title: 'Still growing', body: "Share wins and **find people** to learn with. Grows as more people join." },
    { title: 'Breakthroughs & Top Talent', body: "What other people are **making**." },
    { title: 'Fellow Scholars & Mentors', body: "People on **your path**, and people to **learn from**." },
  ],
  // The garden canvas itself is a WebView (buildGardenHTML in
  // ideagarden.js), so individual plants and vines can't be spotlighted —
  // TourSpot measures native views. Every step here points at the native
  // chrome around the canvas and explains what's happening inside it.
  IdeaGardenScreen: [
    {
      title: 'This is the garden',
      body: "Each idea is a **plant**. Ideas that connect get a **vine** between them.",
      id: 'garden-view',
    },
    {
      title: 'Map or list',
      body: "**Map**: the garden. **List**: the same ideas as rows. Tap a plant to open it.",
      id: 'garden-view',
    },
    {
      title: 'Linking two ideas',
      body: "Tap **Link ideas**, then tap **two plants** to connect them.",
      id: 'garden-vine',
    },
    // Last on purpose. A passthrough step hands control back to the app,
    // and the sheet it opens is a real Modal, which paints above this
    // overlay. Any step after this one would have its bubble hidden
    // behind that sheet.
    {
      title: "Now plant one",
      body: "Tap **+**. I've filled in an example. Give it a **title** and **one line** on what it is.",
      id: 'ideas-list',
      passthrough: true,
      prefill: EXAMPLES.ideas[0],
    },
  ],
  NotesScreen: [
    { title: 'Quick notes', body: "Type in the box and tap **+**. No title or folder needed.", id: 'notes-input' },
    { title: 'Same vault as everything else', body: "Notes sit with your links and tools, so **one search finds it all**.", id: 'resources-list' },
    { title: 'When a note outgrows itself', body: "Note turning into a plan? Send it to the **Workshop** or the **Idea Garden**.", id: 'resources-list' },
  ],
  // The route name React Navigation reports for the Classes list is
  // 'ClassesMain' (the initial screen inside the ClassesStack nested
  // navigator, per src/screens/ClassesStack.js) — not 'ClassesStack'
  // itself, which is never the *current* route once mounted.
  ClassesMain: [
    { title: 'Real coursework', body: "Real lessons by **subject and level**. Pick up where you left off.", id: 'classes-list' },
    { title: 'Your account type filters this', body: "Your **account type** decides which subjects show. Switch profiles at the top.", id: 'classes-list' },
    { title: 'Finishing counts', body: "Finishing a topic earns **XP** and grows that **subject's progress**.", id: 'classes-list' },
  ],
  Settings: [
    { title: 'Backgrounds', body: "Use your character's **landscape** behind Home or the Library, or keep it plain.", id: 'settings-background' },
    { title: 'Family', body: "Link a parent or child account. **Read-only.**", id: 'settings-family' },
    { title: 'Organizations', body: "Join a school or team with a **code**, or start one. They never see your personal profiles.", id: 'settings-organization' },
    { title: 'Everything else', body: "Theme, life areas, notifications, tutorials, account: **all here**.", id: 'settings-appearance' },
  ],
  Profile: [
    { title: 'Your rank', body: "Level, points and streak, **shared by all your profiles**.", id: 'profile-rank' },
    { title: 'Your character', body: "Your **traveler** walks around Home and Training. New gear unlocks as you level up.", id: 'profile-rank' },
  ],
  PortfolioScreen: [
    { title: 'Your stats', body: "XP, projects, skills and streak **at a glance**.", id: 'portfolio-stats' },
    { title: 'Sections', body: "Experience, Skills, Projects, Education… Some **fill in on their own**.", id: 'portfolio-sections' },
    { title: 'Add Entry', body: "Tap **Add Entry** for anything outside the app, like a certificate.", id: 'portfolio-add' },
  ],
  ImportScreen: [
    { title: 'Paste anything', body: "Paste **anything**: URLs, bookmarks, lists, CSV. It works out the format.", id: 'import-paste' },
    { title: 'Format', body: "**Auto-detect** usually gets it right. Change it here if not.", id: 'import-format' },
    { title: 'Parse or Analyze', body: "Tidy formats import **instantly**. Messy text uses **AI** (add your key in Settings).", id: 'import-analyze' },
  ],
  Family: [
    { title: 'Link a Child', body: "Your child makes a **code** in Family on their account. Enter it here.", id: 'family-link' },
    { title: 'My Invite Code', body: "Make a **code** here and give it to a parent. **Read-only** for them.", id: 'family-invite' },
  ],
  // Route name is 'Organization' (App.js's Stack.Screen), not
  // 'OrganizationScreen'. Both TourSpots here already existed and nothing
  // pointed at them.
  Organization: [
    { title: 'Join with a code', body: "Got an **invite code** from a school or team? Enter it here.", id: 'organization-join' },
    { title: 'Or start one', body: "**Start one** to invite members, make groups and set assignments.", id: 'organization-create' },
  ],
  LifeAreaScreen: [
    { title: 'Rate it', body: "Tap **1 to 5**: how this area is going. It keeps the ring honest.", id: 'lifearea-rating' },
    { title: 'Quick Log', body: "**One tap** logs something you did. No typing.", id: 'lifearea-quicklog' },
    { title: 'Sub-Sections', body: "**Deeper pages** for one part of this area.", id: 'lifearea-sections' },
    { title: 'Weekly Reflection', body: "A **weekly check-in** on this area. Good for spotting patterns.", id: 'lifearea-reflection' },
  ],
};

// Turns a single help-blurb paragraph into a rough "features" list for
// screens without hand-authored steps above — split on sentence
// boundaries so each step still reads as one bite-sized idea.
function splitBody(body) {
  return body.split(/(?<=[.!?])\s+/).filter(Boolean);
}

// Tailors a couple of the hand-authored screens with what onboarding
// learned this user cares about — same personalization payload the main
// tour uses (context/TourContext.js's setPersonalization), so both stay in
// sync with a single source of truth.
function personalize(routeName, steps, personalization) {
  if (!personalization) return steps;
  const { areaLabels, focusHub, recommendations } = personalization;
  let next = steps;

  if (routeName === 'LibraryScreen') {
    if (areaLabels?.length) {
      next = next.map(step => step.title === 'Life Areas'
        ? { ...step, body: `**${areaLabels.join(', ')}**: the parts of life you picked. **Double-tap** one to open it.` }
        : step);
    }
    if (focusHub) {
      next = [...next, { title: focusHub.label, body: focusHub.reason, id: `hub-${focusHub.screen}` }];
    }
  }

  // Surfaced once, on Home — same recommendations shown at the end of
  // onboarding (buildRecommendations in MultiStepOnboarding.js), so anyone
  // who skipped past that screen still runs into them here.
  if (routeName === 'Home' && recommendations?.length) {
    const body = recommendations.map(r => `**${r.title}**: ${r.body}`).join(' ');
    next = [...next, { title: 'Recommended for you', body }];
  }

  return next;
}

// Appended to the HOME walkthrough only. The tab bar is real, always in the
// same place, and worth pointing at once.
//
// There used to be a NAV_STEP_STACK partner to this — "Tap the back arrow
// (top-left)" — appended to EVERY non-tab screen. It had no TourSpot behind
// it; TourOverlay fabricated a rectangle at a guessed top-left position and
// lit that up whether or not the screen had a back button there. So most
// screens ended a genuinely useful walkthrough by highlighting empty space
// to explain something the user had already done to get there. Gone.
const NAV_STEP_TAB = {
  title: 'Getting around',
  body: "**Library** = your tools. **Home** = today. **Training** = games and drills. Always at the bottom.",
  // The real bar now (App.js wraps it in a TourSpot); navHint stays as the
  // fallback rectangle if it hasn't measured yet.
  id: 'nav-tabbar',
  navHint: 'tabbar',
};

// Builds the ordered step list for a single-screen walkthrough. Never
// includes a `tab`/`screen` field on any step — unlike the main tour, this
// one is not allowed to navigate away from where the user opened it.
// Whether this screen has real content to show, as opposed to the
// last-resort "no walkthrough yet" card buildScreenTutorial falls back to.
//
// Matters because tutorials now fire automatically the first time you open a
// screen (src/logic/useFirstVisitTutorial.js). Interrupting someone to tell
// them there's nothing to tell them is worse than staying quiet, so the
// auto-trigger checks this first. The FAB's manual "Tutorial" action still
// shows the fallback — there, the user asked.
export function hasScreenTutorial(routeName) {
  if (!routeName) return false;
  return !!(SCREEN_FEATURES[routeName] || SCREEN_HELP[routeName]);
}

// Early stages (src/data/experienceStages.js): until 'dashboard' Home is a
// few widgets, and until 'all-tools' the Library is a handful of tools, so
// the full walkthroughs above would mostly describe things that aren't on
// screen. These say what is there, and that more is coming. When those
// stages open, AccessContext clears the screen from the seen set so the
// full version runs next visit (`reteach` in experienceStages.js).
const STARTER_FEATURES = {
  Home: [
    { title: 'Your first goal', body: "**The one thing to do now.** Each step has an **Open** button that takes you there.", id: 'home-compass' },
    { title: "What's next", body: "The app opens **in stages**. Finish a goal or gain a level for the next one. **App Nav** shows them all.", id: 'home-appnav' },
    { title: 'Play', body: "**Play** starts a game picked for you. **Press and hold** to choose one.", id: 'home-study-play' },
  ],
  LibraryScreen: [
    {
      title: 'Life Areas',
      body: "Each circle is a **part of your life**. **Double-tap** to open it and rate it.",
      id: 'library-life-areas',
      librarySubTab: 'domains',
    },
    { title: 'Capture', body: "Tap **Capture** (top right) to save a thought now. **Sort it later.**", id: 'library-capture', librarySubTab: 'domains' },
    { title: 'Three pages', body: "**Life**, **Build** and **Knowledge**. Tap one under the title, or swipe.", id: 'library-views' },
    { title: 'More on the way', body: "**More opens** as you finish goals and level up." },
  ],
};

// Which stage opens the full walkthrough for a screen with a starter one.
const FULL_TUTORIAL_AT = { Home: 'dashboard', LibraryScreen: 'all-tools' };

// What a screen says the FIRST time someone lands on it, on its own. Just
// the basics: how to move around it and the one thing it's for. The user
// found the full walkthroughs (four to six bubbles, on every new screen) too
// much at once, and asked for the app to be introduced as they move around
// it. The gestures the welcome tour used to teach up front live here now,
// on the screen where they're used. Screens not listed get their first two
// steps. Screen Tutorial in the menu always runs the full version.
const FIRST_VISIT = {
  Compass: APP_NAV_STEPS,
  LibraryScreen: [
    { title: 'Three pages', body: "Three pages: **Life**, **Build**, **Knowledge**. Tap one under the title.", id: 'library-views', librarySubTab: 'domains' },
    { title: 'Your life areas', body: "Each circle is a **part of your life**. **Double-tap** to open it.", id: 'library-life-areas', librarySubTab: 'domains' },
  ],
  LifeAreaScreen: [
    { title: 'Rate it', body: "Tap the **number** that fits right now. Only you see it.", id: 'lifearea-rating' },
    { title: 'Getting back', body: "Tap the **arrow** (top left) or **swipe right** to go back.", id: 'lifearea-back' },
  ],
  Training: [
    { title: 'Training', body: "Quick games that earn points. Tap **Enter Training**. **Swipe** to switch games, **X** to leave.", id: 'training-enter' },
  ],
  Play: [PLAY_STEPS[0], PLAY_STEPS[2]],
  PlayGame: [PLAY_STEPS[0], PLAY_STEPS[2]],
  // The core screens, said in a sentence or two. Their full walkthroughs
  // (above) explain the thinking behind each one, which is a lot to read on
  // a first visit, so a first visit gets what the screen is for and the one
  // button to press.
  PlannerScreen: [
    { title: 'Your plan', body: "Tap **Add** to plan something. Set it to **repeat** and it's a habit.", id: 'planner-add' },
  ],
  CaptureInbox: [
    { title: 'Your inbox', body: "Jot anything here. Later, **tap it** to send it where it belongs.", id: 'inbox-capture' },
  ],
  ProjectsScreen: [
    { title: 'Your projects', body: "Each project keeps its **next step**, tasks and notes. Tap **New Project** to start.", id: 'projects-add' },
  ],
  ProjectDetail: [
    { title: 'One step at a time', body: "The **flag** is your next step. **Tick it** when done. **Work** starts a timer." },
  ],
  KnowledgeScreen: [
    { title: 'Your vault', body: "Notes, links and tools in **one list**. Type a note and tap **+**.", id: 'notes-input' },
  ],
  NotesScreen: [
    { title: 'Your vault', body: "Notes, links and tools in **one list**. Type a note and tap **+**.", id: 'notes-input' },
  ],
  IdeaGardenScreen: [
    { title: 'Your ideas', body: "Each idea is a **plant**. Tap **+** to add one. Ready? **Make it a project.**", id: 'ideas-list' },
  ],
  ClassesMain: [
    { title: 'Classes', body: "Pick a **subject**. **Quests** at the top take ten minutes.", id: 'classes-list' },
  ],
};
const FIRST_VISIT_STEPS = 2;
const MORE_NOTE = ' Full tour: tap **your picture** (top left) → **Screen Tutorial**.';

// `can` is AccessContext's stage check; omitted means the full walkthroughs.
// `firstVisit` is the automatic first-visit version: the basics only.
export function buildScreenTutorial(routeName, personalization, { can, firstVisit = false } = {}) {
  if (firstVisit) {
    if (FIRST_VISIT[routeName]) return FIRST_VISIT[routeName];
    const full = buildScreenTutorial(routeName, personalization, { can });
    if (full.length <= FIRST_VISIT_STEPS) return full;
    const short = full.slice(0, FIRST_VISIT_STEPS);
    const last = short[short.length - 1];
    return [...short.slice(0, -1), { ...last, body: last.body + MORE_NOTE }];
  }
  const starter = !!can && !!FULL_TUTORIAL_AT[routeName] && !can(FULL_TUTORIAL_AT[routeName]);
  const hand = (starter && STARTER_FEATURES[routeName]) || SCREEN_FEATURES[routeName];
  const info = SCREEN_HELP[routeName];

  let steps;
  if (hand) {
    steps = hand;
  } else if (info) {
    steps = splitBody(info.body).map((sentence) => ({ title: info.title, body: sentence }));
  } else {
    steps = [{ title: routeName || 'This screen', body: "No specific walkthrough for this screen yet — check Help for the general FAQ instead." }];
  }

  steps = personalize(routeName, steps, personalization);
  // Home only — see NAV_STEP_TAB. Every other screen ends on its own last
  // feature rather than on a navigation lecture.
  return routeName === 'Home' ? [...steps, NAV_STEP_TAB] : steps;
}
