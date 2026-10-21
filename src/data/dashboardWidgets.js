// src/data/dashboardWidgets.js
// ─── Dashboard widgets ─────────────────────────────────────────────────────
// The rearrangeable pieces of Home, iOS-widget-screen style — see
// WidgetBoard.js for the drag/jiggle mechanics and how `layout` (order +
// hidden flags) round-trips through user_settings.home_widget_layout.
// Every widget Home can render, across all account types. Titles here are
// what shows in the "hidden widgets" tray while editing. What each key
// draws is HomeScreen's `widgets` list (scripts/check-wiring.mjs keeps the
// two in step).
//
// The first nine are the originals, available to everyone. The eleven below
// them are the persona widgets — they're in the same flat list on purpose,
// so a Student who wants the Vault on their dashboard can just un-hide it.
// The account type decides the DEFAULT layout, not what's permitted.
//
// Moved out of HomeScreen.js for the shake-up (docs/shake-up-plan-2026-10-21.md
// §3.3), so Today can share it. No imports: the check scripts load it as-is.
export const WIDGET_DEFS = [
  { key: 'hq',         title: 'You' },
  { key: 'wisdom',      title: "Today's Wisdom" },
  // 'focus' is drawn as the Today card since 2026-10-20: focus, Right now,
  // and whichever of activities / desk / checkins this Home has, in one
  // card (src/components/TodayCard.js). The keys stay for stages and picks.
  { key: 'focus',       title: 'Today' },
  { key: 'activities',  title: "Today's Activities" },
  { key: 'desk',        title: 'On the Desk' },
  { key: 'ideas',       title: 'Latest Ideas' },
  { key: 'builds',      title: 'Active Projects' },
  { key: 'checkins',    title: 'Check-ins' },
  // Not tied to one persona — see personas.defaultWidgets and the
  // `exploring` option on layoutForPersona.
  { key: 'wayfinder',   title: 'Wayfinder' },
  // The purpose/objective layer. A widget rather than a pinned card so the
  // board stays the one system that owns the dashboard — it defaults to
  // directly under the HQ card, and stays reorderable from there.
  { key: 'compass',     title: 'Your goal' },
  // The steps of the goal in flight, ticked or not — the Compass card
  // shows only the next one.
  { key: 'goalSteps',   title: 'Your steps' },
  // Which stage the app is at, what the next one brings, and the two things
  // that open it. See src/components/StageStepsWidget.js.
  { key: 'stageSteps',  title: "What's next" },
  // Persona widgets — src/components/widgets/
  { key: 'habitRings',       title: 'Habits' },
  { key: 'lifeAreas',        title: 'Life Areas' },
  { key: 'dailyDrills',      title: "Today's Drills" },
  { key: 'studyBlocks',      title: 'Study Blocks' },
  { key: 'classProgress',    title: 'Subjects' },
  { key: 'orgSnapshot',      title: 'Organization' },
  { key: 'systemsCheck',     title: 'Systems Check' },
  { key: 'recurringOps',     title: 'Recurring Ops' },
  { key: 'vaultStatus',      title: 'The Vault' },
  { key: 'founderQuest',     title: 'Founder Quest' },
  { key: 'targetsReadiness', title: 'Targets & Readiness' },
  // Every type: the next quest (src/data/quests.js). Joins Home at each
  // type's third stage, alongside the next three games.
  { key: 'quests',           title: 'Missions' },
];
export const WIDGET_KEYS = WIDGET_DEFS.map(w => w.key);

// One line on what each widget shows, for the "new widget" offer. A title on
// its own ("Systems Check") doesn't tell anyone whether they'd want it.
export const WIDGET_BLURBS = {
  hq:               'Your name, level and the Play button.',
  wisdom:           'Your takeaways, brought back so they stick. A quote and your affirmation otherwise.',
  focus:            "Today in one card: your focus, what's on, the next thing to pick up, and a check-in when one's due.",
  activities:       'Everything scheduled for today, in time order.',
  desk:             'The next thing to pick up from your projects, notes and ideas.',
  ideas:            'The newest ideas in your Idea Garden.',
  builds:           'Projects in progress and how far along each is.',
  checkins:         'Life areas you have not rated in a while.',
  wayfinder:        'Work out what you want, one small experiment at a time.',
  compass:          "Your goal in flight, its next step, and what's next in the app.",
  goalSteps:        'Every step of your current goal, ticked or not.',
  stageSteps:       "What's next in the app, and how to get there.",
  habitRings:       'How often you kept each habit over the last week.',
  lifeAreas:        'Your rating for each life area, most out of date first.',
  dailyDrills:      "Today's three drills and the game for the next one.",
  studyBlocks:      "Today's study blocks, done or not.",
  classProgress:    'How far along you are in each class subject.',
  orgSnapshot:      "Your school or team's latest, if you're in one.",
  systemsCheck:     'Your ratings for the work and digital sides of life.',
  recurringOps:     'Routines that repeat weekly or monthly, and what is due.',
  vaultStatus:      'What is in your Vault and what needs filing.',
  founderQuest:     'The next step on the founder track.',
  targetsReadiness: 'Your targets and how ready the paperwork is.',
  quests:           'The next ten-minute quest to try.',
};

// A widget added by an app update is appended HIDDEN, so an update never
// rearranges a dashboard someone has already set up. These are the
// exceptions: ones that answer "what do I do next", which are no use
// sitting switched off in the tray.
export const NEW_WIDGETS_SHOWN = new Set(['goalSteps', 'stageSteps']);

// Keys Today adds in later phases (shake-up plan §3.3). Each moves from here
// into WIDGET_DEFS in the PR that builds it, together with its BASE_WIDGETS
// or pickables entry, or check-pickables goes red.
export const PLANNED_WIDGET_KEYS = [
  'nextStep', 'quickAdd', 'yourDay', 'dream', 'deliverable', 'dueSoon', 'stillOpen',
  'find', 'room', 'money', 'assignments', 'unit', 'missions', 'checkin',
];

// What a saved layout's key becomes once the shake-up renames or retires it
// (persona_profiles.active_widgets, user_settings.home_widget_layout). A
// renamed key takes the new one's place in the saved order instead of
// dropping out; null means retired. Every current key is listed, the ones
// that stay as themselves, so removing a key later is a decision made here.
// Read by src/logic/widgetLayout.js; nothing renames until the new key is
// in WIDGET_DEFS, so today every key resolves to itself.
export const WIDGET_ALIASES = {
  hq:               'room',        // CommanderCard: no level, no rank
  wisdom:           null,          // retired
  focus:            'yourDay',     // the plan is the day now
  activities:       'yourDay',
  desk:             'deliverable', // "Next on your project" lives in it
  ideas:            'ideas',
  builds:           'builds',
  checkins:         'checkin',
  wayfinder:        'wayfinder',   // kept, and no longer forced to the top
  compass:          'nextStep',
  goalSteps:        'unit',        // this unit's 4 beats
  stageSteps:       'unit',        // "gain a level" retires
  habitRings:       'habitRings',
  lifeAreas:        'lifeAreas',
  dailyDrills:      'dailyDrills',
  studyBlocks:      'studyBlocks',
  classProgress:    'classProgress',
  orgSnapshot:      'orgSnapshot',
  systemsCheck:     'systemsCheck',
  recurringOps:     'recurringOps',
  vaultStatus:      'vaultStatus',
  founderQuest:     'founderQuest',
  targetsReadiness: 'targetsReadiness',
  quests:           'missions',    // Software for You + quests
};
