// src/logic/screenTutorials.js
// Content for the FAB's "Tutorial" action — a short, CURRENT-SCREEN-ONLY
// walkthrough (see startScreenTour in context/TourContext.js). Distinct
// from the full cross-app guided tour (tourSteps.js): this one never
// changes screen, just cycles through what's on the one you're already
// looking at. It reuses the exact same spotlight overlay (TourOverlay.js)
// — steps whose `id` matches a real <TourSpot id="..."> already in that
// screen's tree get spotlighted; everything else is a plain centered card.
//
// Every screen's list ends with an automatic "Navigation" step (appended
// by buildScreenTutorial, not listed per-screen below) explaining how to
// get around from there — TourOverlay understands the synthetic `navHint`
// flag and spotlights the tab bar or back button without needing a real
// TourSpot for either.

import { SCREEN_HELP } from '../data/screenHelp';

// Route names reached via the bottom tab bar vs. everything else (reached
// by navigating deeper, with a back arrow to return) — decides which
// Navigation step to append.
const TAB_SCREENS = new Set(['Home', 'Training', 'LibraryScreen']);

// Hand-authored, multi-feature walkthroughs for the screens people spend
// the most time in. `id` matches a real <TourSpot id="..."> when one
// already exists on that screen — omit it for a plain card.
const SCREEN_FEATURES = {
  Home: [
    { title: "Today's Wisdom", body: "A quote plus your own affirmation, if you've set one — tap + to write one that rotates in daily.", id: 'home-focus' },
    { title: "Today's Focus", body: "Pin the one thing that matters most today — it's the first thing you see when you open the app. Tap the date box next to it to jump into the calendar.", id: 'home-focus-input' },
    { title: 'Study & Play', body: 'STUDY jumps into Daily Drills; PLAY opens a game pick across any subject. Both feed your streak and points.', id: 'home-study-play' },
    { title: 'On the Desk', body: 'Priorities pulled from your projects, notes, and ideas. Tap + Add to pin one, or tap a card to jump straight to it.', id: 'home-desk' },
  ],
  Training: [
    { title: 'Your Stats', body: 'Points, streak, and rank at a glance — every game and drill you finish feeds these.', id: 'training-stats' },
    { title: 'Objectives & Drills', body: 'Missions and Daily Drills live here — clear them for points toward your rank.', id: 'training-games' },
    { title: 'Enter Training', body: 'Tap ENTER TRAINING to pick a game across any subject — Math, Science, Language Arts, and more.', id: 'training-enter' },
  ],
  LibraryScreen: [
    { title: 'Life Areas', body: "The sectors you focus on show as bubbles up top, each with a ring showing how it's tracking — tap one to check in and log how it's going, or + Add to bring in more you haven't started yet.", id: 'library-life-areas' },
    {
      title: 'The Lab',
      body: "Execution & career archives. The Workshop is where active projects live — tasks, research, and journal entries per build. Portfolio Archives showcases the ones you've finished. The Research Vault holds sources you've saved outside any one project. Career Expeditions is for exploring professional paths.",
      id: 'hub-section-academic',
    },
    {
      title: 'The Library',
      body: 'Synthesis & planning. Academy Classes has structured coursework across every subject. Idea Garden grows loose thoughts into something bigger over time. Notes Desk is for quick written entries. Resources & Instruments holds curated references and tools. The Planner is your full agenda — daily, weekly, and monthly.',
      id: 'hub-section-knowledge',
    },
    {
      title: 'Trophy Hall',
      body: "Once you ship something — finish a project, complete a class — it lands here as a running highlight reel. Tap Portfolio → for the full showcase, useful for tracking real progress over time.",
      id: 'library-trophy-hall',
    },
    { title: 'Capture', body: 'Tap Capture (top-right) any time to jot something down fast without deciding yet where it belongs — sort it later from the Capture Inbox.', id: 'library-capture' },
  ],
  PlannerScreen: [
    { title: 'Views', body: 'Switch between Daily, Weekly, and Monthly at the top, and filter by life area.', id: 'planner-views' },
    { title: 'Add', body: 'Tap Add (or the grid icon) to schedule something — a one-off event, or a recurring habit. Reminders can send a notification before the scheduled time.', id: 'planner-add' },
  ],
  CaptureInbox: [
    { title: 'Quick capture', body: "A landing zone for anything you jot down before deciding where it belongs — just get it out of your head.", id: 'inbox-capture' },
    { title: 'Route it', body: 'Tap any item to send it where it really lives — a project, your notes, the planner, a life area, and more.', id: 'inbox-list' },
  ],
  ProjectsScreen: [
    { title: 'Every build', body: "From a rough blueprint to something you're showing off — this is the Workshop. Search by name any time.", id: 'projects-search' },
    { title: 'Stages', body: 'Filter by Blueprints (not started), Building (in progress), or Shipped (done) to focus on what matters right now.', id: 'projects-list' },
    { title: 'Start one', body: 'Tap + to start a new project. You can add tasks, research, and journal entries once it exists.', id: 'projects-add' },
  ],
  // Notes Desk, the Research Vault, and Resources & Instruments merged into
  // the Knowledge Vault. All four route names land on the same screen, so
  // each gets a tutorial framed around the view it opens on.
  KnowledgeScreen: [
    { title: 'One vault', body: "Notes, bookmarks, papers, and tools all live in one list now — tap a type pill to narrow it down, or All to see everything together.", id: 'resources-list' },
    { title: 'Quick notes', body: 'Type in the box under the folders and tap + to save a note without opening anything.', id: 'notes-input' },
    { title: 'Add anything else', body: "Tap New for a link, paper, or tool. Paste a URL and it files itself — an arXiv or DOI link becomes a paper, with citation fields to match.", id: 'research-list' },
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
    { title: 'Resources & Tools', body: "A library of tools and references you've saved for reuse — the Tools filter of your Knowledge Vault.", id: 'resources-list' },
  ],
  // No TourSpots here yet either — see the ProjectDetail note above.
  DiscoverScreen: [
    { title: 'Still growing', body: "Discover is where you'll share breakthroughs, find collaborators, and connect with other learners — it gets better as the community grows." },
    { title: 'Breakthroughs & Top Talent', body: "See what other people are shipping — recent discoveries and standout work worth knowing about." },
    { title: 'Fellow Scholars & Mentors', body: "Find people on a similar path, or more experienced people to learn from." },
  ],
  IdeaGardenScreen: [
    { title: 'Plant a seed', body: 'Loose ideas start small here and grow over time as you keep adding to them.', id: 'ideas-list' },
  ],
  NotesScreen: [
    { title: 'Quick notes', body: 'Type in the box under the folders and tap + to save — the permanent home for quick written thoughts, now filed alongside your links and tools.', id: 'notes-input' },
  ],
  // The route name React Navigation reports for the Classes list is
  // 'ClassesMain' (the initial screen inside the ClassesStack nested
  // navigator, per src/screens/ClassesStack.js) — not 'ClassesStack'
  // itself, which is never the *current* route once mounted.
  ClassesMain: [
    { title: 'Academy Classes', body: 'Structured learning modules and coursework — pick one up where you left off, or start something new.', id: 'classes-list' },
  ],
  Settings: [
    { title: 'Backgrounds', body: "Match Home or Library to your traveler's equipped landscape any time, or keep it plain.", id: 'settings-background' },
    { title: 'Family', body: "Link a parent or child's account here — read-only, no controls over their account.", id: 'settings-family' },
    { title: 'Everything else', body: 'Theme, life areas, library sections, notifications, and your account all live on this one screen too.', id: 'settings-appearance' },
  ],
  Profile: [
    { title: 'Your rank', body: 'Level, points, streak, and account details all live here.', id: 'profile-rank' },
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

const NAV_STEP_TAB = {
  title: 'Navigation',
  body: 'Use these three tabs — Library, Home, Training — to jump between sections any time.',
  navHint: 'tabbar',
};
const NAV_STEP_STACK = {
  title: 'Navigation',
  body: 'Tap the back arrow (top-left) any time to return to where you came from.',
  navHint: 'back',
};

// Builds the ordered step list for a single-screen walkthrough. Never
// includes a `tab`/`screen` field on any step — unlike the main tour, this
// one is not allowed to navigate away from where the user opened it.
export function buildScreenTutorial(routeName, personalization) {
  const hand = SCREEN_FEATURES[routeName];
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
  const navStep = TAB_SCREENS.has(routeName) ? NAV_STEP_TAB : NAV_STEP_STACK;
  return [...steps, navStep];
}
