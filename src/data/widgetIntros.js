// src/data/widgetIntros.js
// What the guide says the first time a widget arrives on Home.
//
// Home starts with three cards and takes on the rest a couple per stage
// (homeWidgetsAt in src/logic/experienceStage.js). Each one that arrives is
// pointed at once, with this: what it shows, then what to do with it. A new
// card nobody explained is just more screen.
//
// Keys are HomeScreen's WIDGET_DEFS keys. Keep each one true to what the
// widget actually renders, and to two or three short sentences.
//
// No imports on purpose: plain data.

export const WIDGET_INTROS = {
  hq:               'Your name, level and points. Play starts a quick game; press and hold it to pick which.',
  stageSteps:       'Where you are in the app and what opens next. Finish a goal or gain a level to open the next stage.',
  compass:          'The one goal you are on and its next step. Each step has an Open button that takes you straight to it.',
  goalSteps:        'Every step of your current goal, ticked or not.',
  focus:            'Write one line on what today is for, so it is the first thing you see. Tap the date to jump into your calendar.',
  wisdom:           'A quote a day. Tap + to add your own affirmation and it rotates in with the rest.',
  activities:       'Everything scheduled for today, in time order: planner items, reminders and class work. If it is not here, it is not scheduled.',
  desk:             'The next things worth picking up, pulled from your projects, notes and ideas. Tap one to jump to it, or + Add to pin your own.',
  ideas:            'Your newest ideas from the Idea Garden. Tap one to open it, and grow it into a project when it is ready.',
  streak:           'Your streak and level. Do anything that counts (a game, a goal step) each day and the streak grows.',
  builds:           'Your projects in progress and how far along each one is. Tap one to open it and set its next step.',
  checkins:         'Life areas you have not rated in a while. A check-in takes ten seconds and keeps the picture honest.',
  wayfinder:        'Work out what you want: a few short questions, then small experiments to try. Tap it to carry on where you left off.',
  habitRings:       'How often you kept each habit over the last week. Habits come from repeating items in your Planner.',
  lifeAreas:        'Your rating for each life area, the most out of date first. Tap one to open it and rate it again.',
  dailyDrills:      'Three small targets that reset every day. Any game counts toward them; tap to play the next one.',
  studyBlocks:      'Today’s study blocks from your Planner, done or not. Tap one to tick it off.',
  classProgress:    'How far along you are in each class subject. Tap a subject to pick up where you left off.',
  orgSnapshot:      'The latest from your school or team, if you have joined one.',
  systemsCheck:     'Your ratings for the work and digital sides of life, so you can see which system needs attention.',
  recurringOps:     'Routines that repeat weekly or monthly, and which ones are due.',
  vaultStatus:      'The worksheets from your ownership lessons: what is filed and what still needs doing.',
  founderQuest:     'The next step on the founder track. Tap it to open the lesson.',
  targetsReadiness: 'Your targets, and how ready the paperwork behind them is.',
  quests:           'A ten-minute quest: an idea, a bit of your own research, and one real thing to do. Tap it to start.',
};
