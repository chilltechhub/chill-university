// src/data/widgetIntros.js
// What the guide says the first time a widget arrives on Home.
//
// Home starts with three cards and takes on the rest a couple per stage
// (homeWidgetsAt in src/logic/experienceStage.js). Each one that arrives is
// pointed at once, with this: what it shows, then what to do with it. A new
// card nobody explained is just more screen.
//
// Keys are HomeScreen's WIDGET_DEFS keys. Keep each one true to what the
// widget actually renders: one short sentence, key words in **bold**
// (TourOverlay renders the markers).
//
// No imports on purpose: plain data.

export const WIDGET_INTROS = {
  hq:               "Your name, level and points. **Play** starts a game; **press and hold** to pick one.",
  stageSteps:       "**What's next** in the app. Finish a goal or gain a level to get there.",
  compass:          "Your **goal** and its next step. Tap **Open** to go straight to it.",
  goalSteps:        "Every step of your goal, **ticked or not**.",
  focus:            "Write **one line**: what today is for. Tap the date for your calendar.",
  wisdom:           "A quote a day. Tap **+** to add your own.",
  activities:       "Everything **scheduled today**, in time order.",
  desk:             "What to **pick up next**. Tap one to open it, or **+ Add** to pin your own.",
  ideas:            "Your **newest ideas**. Tap one to open it.",
  builds:           "Your **projects** and how far along each is.",
  checkins:         "Life areas **due a check-in**. Takes ten seconds.",
  wayfinder:        "Work out **what you want**: short questions, then small experiments.",
  habitRings:       "How often you **kept each habit** this week.",
  lifeAreas:        "Your **life area ratings**, oldest first. Tap one to rate it again.",
  dailyDrills:      "**Three small targets**, new each day. Any game counts.",
  studyBlocks:      "Today’s **study blocks**. Tap one to tick it off.",
  classProgress:    "Your progress in **each subject**. Tap one to continue.",
  orgSnapshot:      "The latest from **your school or team**.",
  systemsCheck:     "Your **work and digital** ratings: which needs attention.",
  recurringOps:     "**Routines** that repeat, and which are due.",
  vaultStatus:      "Your **business worksheets**: done and still to do. (Not your notes Vault.)",
  founderQuest:     "Your **next founder step**. Tap to open the lesson.",
  targetsReadiness: "Your **revenue target** or stage, and funding worksheets done.",
  quests:           "A **ten-minute quest**: an idea, some research, one real thing to do.",
};
