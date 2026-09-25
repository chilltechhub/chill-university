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
  { title: 'Switch games', body: "Swipe up or down to move to the next game. Some games use swipes themselves, so these arrows always work too. The number shows which game you're on.", id: 'play-switch' },
  { title: 'Your level', body: 'Each game asks your level first, then keeps adjusting as you play: a hot streak moves you up, a couple of misses ease you back down.' },
  { title: 'Leaving', body: 'Tap X at the top left to go back. Every right answer is saved as you go, so leaving early loses nothing.' },
];

const SCREEN_FEATURES = {
  Play: PLAY_STEPS,
  PlayGame: PLAY_STEPS,
  Home: [
    { title: "Today's Wisdom", body: "A quote plus your own affirmation, if you've set one — tap + to write one that rotates in daily.", id: 'home-focus' },
    { title: "Today's Focus", body: "Pin the one thing that matters most today — it's the first thing you see when you open the app. Tap the date box next to it to jump into the calendar.", id: 'home-focus-input' },
    { title: 'Study & Play', body: 'STUDY jumps into Daily Drills; PLAY opens a game pick across any subject. Both feed your streak and points.', id: 'home-study-play' },
    { title: 'On the Desk', body: 'Priorities pulled from your projects, notes, and ideas — the app works out what you should probably pick up. Tap + Add to pin one yourself, or tap a card to jump straight to it.', id: 'home-desk' },
    { title: "Today's Activities", body: "Anything scheduled for today — planner items, class assignments, reminders — in one list, in time order. If it isn't here, it isn't scheduled.", id: 'home-today-activities' },
  ],
  Training: [
    { title: 'Where the points come from', body: "Rank, points and streak, all fed by what you finish here. The streak is the one that matters — it's the difference between using this app and having installed it.", id: 'training-stats' },
    { title: 'Daily Drills & Challenges', body: "Daily Drills are three small targets that reset every day; any game you play counts toward them. Challenges are the bigger weekly ones and your achievements.", id: 'training-games' },
    { title: 'Pick a subject', body: "ENTER TRAINING opens the game picker — Math, Science, Language Arts and the rest. Every round feeds that subject's own progress as well as your overall rank.", id: 'training-enter' },
    { title: 'Try one now', body: "Genuinely — one round takes a couple of minutes, and the app can't recommend anything sensible until it has seen you play once.", id: 'training-enter' },
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
      body: "Eight sides of a life, each with a ring showing how it's actually tracking. Tap one to check in; the ring is only as honest as the check-ins behind it.",
      id: 'library-life-areas',
      librarySubTab: 'domains',
    },
    {
      title: 'Three views, one Library',
      body: "Domains is how life is going. Build is what you're making. Knowledge is what you're learning and planning. Same Library, sorted by what you came here to do.",
      id: 'library-life-areas',
      librarySubTab: 'domains',
    },
    {
      title: 'Build',
      body: "The Workshop holds active builds with their own tasks, research and journal. Portfolio Archives is what you've finished. The Research Vault keeps sources that don't belong to any one build, and Career Expeditions is for exploring where this all goes.",
      id: 'hub-section-academic',
      librarySubTab: 'build',
    },
    {
      title: 'Knowledge',
      body: "Academy Classes is structured coursework. The Idea Garden grows loose thoughts and links them together. Notes and Resources are the quick stuff. The Planner is your actual agenda, daily to monthly.",
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
      body: "Ship something — finish a build, complete a class — and it lands in here on its own. This is the honest record of what you've actually done, and it's what you'd show someone.",
      id: 'hub-PortfolioScreen',
      librarySubTab: 'build',
    },
    { title: 'Capture', body: "Capture, top-right, from anywhere in the Library. Get the thought out now and decide where it belongs later — that's the whole trick.", id: 'library-capture', librarySubTab: 'domains' },
  ],
  PlannerScreen: [
    { title: 'Three views', body: "Daily for today, Weekly to see the shape of the week, Monthly for the long view. Filter by life area to check one part of your life at a time.", id: 'planner-views' },
    { title: 'Habits vs. events', body: "A one-off event happens once. A recurring habit regenerates on a cadence — daily, weekly, monthly — and it's the recurring ones that feed the Habits widget on Home.", id: 'planner-add' },
    { title: 'Add', body: 'Tap Add (or the grid icon) to schedule something — a one-off event, or a recurring habit. Reminders can send a notification before the scheduled time.', id: 'planner-add' },
  ],
  // Capture -> label -> process, in that order, because that's the actual
  // loop: the whole point of the inbox is that capturing is separated from
  // deciding, so the tutorial has to teach both halves and the handoff.
  CaptureInbox: [
    {
      title: 'Capture first, decide later',
      body: "Anything you don't want to lose goes in here — a link, a task, half a thought. The reason this screen exists is so you never have to stop and work out where something belongs at the moment you think of it.",
      id: 'inbox-capture',
      prefill: EXAMPLES.capture,
    },
    {
      title: 'Give it a label',
      body: "Note, Idea, Link, Task, Video, Resource. The label isn't decoration — it decides where the item can be sent next, so a Link offers the Research Vault while a Task offers your Planner.",
      id: 'inbox-capture',
    },
    {
      title: 'Then process it',
      body: "Tap anything in the list to route it: add it to a project, start a new one, plant it in the Idea Garden, file it in your notes. Emptying this inbox is the habit — capture is only half of it.",
      id: 'inbox-list',
    },
    {
      title: "Don't let it rot",
      body: "Items show how long they've got left. That's deliberate pressure: an inbox you never empty is just a second pile. Process a few whenever you open it.",
      id: 'inbox-list',
    },
  ],
  // Ends by actually starting a build rather than describing how. The last
  // step is `passthrough`, so the tap lands on the real button and the sheet
  // opens pre-filled with EXAMPLES.project — editable, and nothing is saved
  // until the user presses Start themselves.
  ProjectsScreen: [
    { title: 'This is the Workshop', body: "Every build lives here, from a one-line idea to something you're shipping. A build holds its own tasks, research and journal, so the whole thing stays in one place instead of scattered across notes.", id: 'projects-list' },
    { title: 'Stages', body: 'Blueprints are ideas you haven’t started. Building is in progress. Shipped is done — and shipped builds land in your Portfolio on their own, which is the record you’d actually show someone.', id: 'projects-list' },
    { title: 'Finding one later', body: 'Search by name once you have a few. Worth knowing now so you don’t end up scrolling for something you made three months ago.', id: 'projects-search' },
    {
      title: "Let's make one",
      body: "Tap NEW BUILD. I've put an example in for you — a Grow Shed sensor rig — so you can see the shape of a good one: a clear title, and an objective that says what done looks like. Change it to whatever you're actually building, or clear it.",
      id: 'projects-add',
      passthrough: true,
      prefill: EXAMPLES.project,
    },
  ],
  // Notes Desk, the Research Vault, and Resources & Instruments merged into
  // the Knowledge Vault. All four route names land on the same screen, so
  // each gets a tutorial framed around the view it opens on.
  KnowledgeScreen: [
    { title: 'One vault', body: "Notes, bookmarks, papers, and tools all live in one list now — tap a type pill to narrow it down, or All to see everything together.", id: 'resources-list' },
    { title: 'Quick notes', body: 'Type in the box under the folders and tap + to save a note without opening anything.', id: 'notes-input' },
    { title: 'Add anything else', body: "Tap New for a link, paper, or tool. Paste a URL and it files itself — an arXiv or DOI link becomes a paper, with author, journal and DOI fields already set up.", id: 'research-list' },
    { title: 'Folders come later', body: "Don't organise up front. Save things, then file them once you can see what you actually keep — a structure you guessed at on day one is a structure you'll fight.", id: 'resources-list' },
  ],
  ResearchScreen: [
    { title: 'Research Vault', body: "Links and resources saved for later reading, outside of any one project — now part of your Knowledge Vault.", id: 'research-list' },
    { title: 'Papers get citations', body: "Save an arXiv, DOI, JSTOR, or PDF link and it files as a paper, with author, journal, year, and DOI fields.", id: 'resources-list' },
  ],
  // ProjectDetail has no TourSpots of its own yet — every step below is a
  // plain centered card (no spotlight). Still real, structured coverage;
  // wire in TourSpots later if the exact highlight matters.
  ProjectDetail: [
    { title: 'Workspace', body: "The default tab when you open a project — Next (your top few open tasks), Open Questions, and Recent Work, so you always know what to pick up." },
    { title: 'Library', body: "Everything you've captured for this project — notes, ideas, questions, research, and tasks — filterable by type. Nothing here gets lost." },
    { title: 'Activity', body: "A running history of milestones and notes for this project — useful for seeing how it actually came together over time." },
    { title: 'Add', body: "Tap Add (top-right) or the capture prompt any time to log a thought, question, task, or research note without leaving the project." },
  ],
  ResourcesToolsScreen: [
    { title: 'Tools you keep coming back to', body: "The Tools filter of your Knowledge Vault — calculators, references, sites worth a second visit. Separate from research because you use these rather than read them.", id: 'resources-list' },
    { title: 'Discover has more', body: "Browse Discover for curated tools and research sites if you're not sure what's worth saving yet.", id: 'resources-list' },
  ],
  // No TourSpots here yet either — see the ProjectDetail note above.
  DiscoverScreen: [
    { title: 'Still growing', body: "Discover is where you'll share breakthroughs, find collaborators, and connect with other learners — it gets better as the community grows." },
    { title: 'Breakthroughs & Top Talent', body: "See what other people are shipping — recent discoveries and standout work worth knowing about." },
    { title: 'Fellow Scholars & Mentors', body: "Find people on a similar path, or more experienced people to learn from." },
  ],
  // The garden canvas itself is a WebView (buildGardenHTML in
  // ideagarden.js), so individual plants and vines can't be spotlighted —
  // TourSpot measures native views. Every step here points at the native
  // chrome around the canvas and explains what's happening inside it.
  IdeaGardenScreen: [
    {
      title: 'This is the garden',
      body: "Every idea is a plant. Ideas that feed each other get a vine drawn between them. It sounds whimsical, but the point is practical: half the value of an idea is what it connects to, and a flat list hides that completely.",
      id: 'garden-view',
    },
    {
      title: 'Map or list',
      body: "Map is the growing canvas — tap a plant to open it, hold to edit. List is the same ideas as plain rows, which is easier once you have a lot. (The map is native-only for now; on the web build you'll land in List.)",
      id: 'garden-view',
    },
    {
      title: 'Vining two together',
      body: "Tap Vine, then tap two plants to link them. Say you have “sell the rig as a kit” and “3D-print the enclosures in-house” — the kit needs an enclosure and you already print them. That's a vine, and it's exactly the connection you'd otherwise forget you'd made.",
      id: 'garden-vine',
    },
    // Last on purpose. A passthrough step hands control back to the app,
    // and the sheet it opens is a real Modal, which paints above this
    // overlay. Any step after this one would have its bubble hidden
    // behind that sheet.
    {
      title: "Now plant one",
      body: "Tap +. I've put an example in — an idea that came out of the sensor rig build. Give it a title and a line about what it actually is; the description is what makes it worth something when you come back in a month.",
      id: 'ideas-list',
      passthrough: true,
      prefill: EXAMPLES.ideas[0],
    },
  ],
  NotesScreen: [
    { title: 'Quick notes', body: "Type in the box under the folders and tap + to save. No title, no folder, no decisions — the point is that writing something down costs you nothing.", id: 'notes-input' },
    { title: 'Same vault as everything else', body: "Notes sit alongside your links, papers and tools rather than in their own silo, so one search finds all of it.", id: 'resources-list' },
    { title: 'When a note outgrows itself', body: "If a note turns into something you're actually going to do, send it to the Workshop as a build, or plant it in the Idea Garden to see what it connects to.", id: 'resources-list' },
  ],
  // The route name React Navigation reports for the Classes list is
  // 'ClassesMain' (the initial screen inside the ClassesStack nested
  // navigator, per src/screens/ClassesStack.js) — not 'ClassesStack'
  // itself, which is never the *current* route once mounted.
  ClassesMain: [
    { title: 'Real coursework', body: "Structured classes by subject and grade level — not quiz questions dressed up as lessons. Pick one up where you left off, or start something new.", id: 'classes-list' },
    { title: 'Your account type filters this', body: "Which subjects appear depends on your account type. A Student profile gets the full grade-level set; an Entrepreneur profile also gets the entity, credit and funding tracks. Switch profiles at the top of the screen to see the others.", id: 'classes-list' },
    { title: 'Finishing counts', body: "Completing a topic earns XP toward your rank and moves that subject's progress — the same figure the Subjects widget on Home reads.", id: 'classes-list' },
  ],
  Settings: [
    { title: 'Backgrounds', body: "Match Home or Library to your traveler's equipped landscape any time, or keep it plain.", id: 'settings-background' },
    { title: 'Family', body: "Link a parent or child's account here — read-only, no controls over their account.", id: 'settings-family' },
    { title: 'Organizations', body: "Join a school or team with an invite code, or create one. An organization can set shared assignments and see a roster; it never gets access to your personal profiles.", id: 'settings-organization' },
    { title: 'Everything else', body: "Theme, life areas, library sections, notifications, screen tutorials and your account all live on this one screen. If something in the app is annoying you, the switch for it is probably here.", id: 'settings-appearance' },
  ],
  Profile: [
    { title: 'Your rank', body: "Level, points and streak. These are shared across every profile on the account — switching from Personal to Student doesn't restart your progress.", id: 'profile-rank' },
    { title: 'Your character', body: "The traveler here is the one who walks around Home and Training. New outfits, pets and gear unlock as you level up.", id: 'profile-rank' },
  ],
  PortfolioScreen: [
    { title: 'Your stats', body: 'XP, projects, skills, and streak — a snapshot of everything you\'ve built and how consistent you\'ve been.', id: 'portfolio-stats' },
    { title: 'Sections', body: 'Experience, Skills, Projects, Education, and more — each tab holds entries you can add yourself, or that auto-populate as you use the app.', id: 'portfolio-sections' },
    { title: 'Add Entry', body: "Tap Add Entry on any section to fill in something that doesn't auto-populate, like a certification or outside project.", id: 'portfolio-add' },
  ],
  ImportScreen: [
    { title: 'Paste anything', body: "Raw URLs, a bookmarks export, a markdown list, CSV, tab dumps — drop in whatever you've got and it figures out the format.", id: 'import-paste' },
    { title: 'Format', body: "Auto-detect gets it right most of the time — override it here if you know exactly what you pasted.", id: 'import-format' },
    { title: 'Parse or Analyze', body: "Structured formats parse instantly, no AI needed. Messy or unstructured text uses AI to make sense of it — set your API key in Settings first.", id: 'import-analyze' },
  ],
  Family: [
    { title: 'Link a Child', body: "Ask your child to open Family on their account, generate a code, and enter it here to follow their progress.", id: 'family-link' },
    { title: 'My Invite Code', body: "On a child's account, generate a code here and hand it to a parent — read-only, they can never change anything for you.", id: 'family-invite' },
  ],
  // Route name is 'Organization' (App.js's Stack.Screen), not
  // 'OrganizationScreen'. Both TourSpots here already existed and nothing
  // pointed at them.
  Organization: [
    { title: 'Join with a code', body: "A school, class or team gives you an invite code — enter it here. Joining lets them set shared assignments and see your progress on those; it does not give them your personal profiles.", id: 'organization-join' },
    { title: 'Or start one', body: "Creating an organization makes you its manager: you can invite members, group them into cohorts, and hand out assignments.", id: 'organization-create' },
  ],
  LifeAreaScreen: [
    { title: 'Rate it', body: "How's this area right now, 1 to 5? Rating it keeps the ring on the Library grid accurate.", id: 'lifearea-rating' },
    { title: 'Quick Log', body: 'One-tap log entries for the stuff you do often in this area — no typing required.', id: 'lifearea-quicklog' },
    { title: 'Sub-Sections', body: 'Deeper, focused pages within this life area — tap into any of them for more specific tracking and tips.', id: 'lifearea-sections' },
    { title: 'Weekly Reflection', body: 'A guided prompt to check in on this area once a week — more thoughtful than a quick log, good for spotting patterns.', id: 'lifearea-reflection' },
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
        ? { ...step, body: `${areaLabels.join(', ')} — the sectors you picked at setup. Tap one to check in, or + Add to bring in more.` }
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
    const body = recommendations.map(r => `${r.title} — ${r.body}`).join(' ');
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
  body: "Three tabs, bottom of the screen. Library is everything you're building and learning, Home is today, Training is games and drills. They're always there.",
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
    { title: 'Your first goal', body: "This card is the one thing to do right now. Each step has an Open button that takes you straight to it, and the whole goal takes a few minutes. Every goal you finish opens a little more of the app.", id: 'home-compass' },
    { title: 'What opens next', body: "The app opens up in stages. This card says what the next stage brings and the two ways to get there: finish your goal, or gain a level by playing.", id: 'home-stage' },
    { title: 'Play', body: "PLAY drops you straight into one of the games picked for you. Press and hold it to choose the game yourself. Every round counts toward your streak and your points.", id: 'home-study-play' },
  ],
  LibraryScreen: [
    {
      title: 'Life Areas',
      body: "Sides of your life, each with a ring showing how it's tracking. Tap one to filter the list below; double-tap or press and hold to open it, rate it and get a small thing to do about it.",
      id: 'library-life-areas',
      librarySubTab: 'domains',
    },
    { title: 'Capture', body: "Capture, top-right. Get a thought out of your head now and decide where it belongs later.", id: 'library-capture', librarySubTab: 'domains' },
    { title: 'Three pages', body: "Life, Build and Knowledge. Swipe left or right anywhere on the page to switch, or tap the title at the top.", id: 'library-views' },
    { title: 'More on the way', body: "The Library starts with the tools that fit your profile. Each goal you finish and each level you gain opens a little more, here and across the app." },
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
  LibraryScreen: [
    { title: 'Three pages', body: 'The Library has three pages: Life, Build and Knowledge. Swipe left or right to switch, or tap the title.', id: 'library-views', librarySubTab: 'domains' },
    { title: 'Your life areas', body: 'Each circle is one part of your life. Double-tap one, or press and hold it, to open it.', id: 'library-life-areas', librarySubTab: 'domains' },
  ],
  LifeAreaScreen: [
    { title: 'Rate it', body: 'Tap the number that fits this part of your life right now. Nobody else sees it.', id: 'lifearea-rating' },
    { title: 'Getting back', body: 'Tap the arrow at the top left, or swipe right from the left edge of the screen, to go back. That works on every page like this one.', id: 'lifearea-back' },
  ],
  Training: [
    { title: 'Training', body: 'Quick games that earn points. Tap Enter Training to play. Inside, swipe up or down to switch games, and tap X to come back.', id: 'training-enter' },
  ],
  Play: [PLAY_STEPS[0], PLAY_STEPS[2]],
  PlayGame: [PLAY_STEPS[0], PLAY_STEPS[2]],
};
const FIRST_VISIT_STEPS = 2;
const MORE_NOTE = ' There is more in Screen Tutorial, in the menu at the top left.';

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
