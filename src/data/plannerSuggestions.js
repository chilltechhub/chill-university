// src/data/plannerSuggestions.js
//
// What to offer somebody staring at an empty "What are you scheduling?" box.
//
// The Add sheet already asks which life area an item belongs to, and that
// answer is the most useful thing anyone has said at that point — "Physical"
// narrows "anything at all" down to a handful of things people actually put
// in a planner. So the suggestions below are keyed on the area picker's own
// keys (AREAS in src/api/plannerService.js) and re-offered every time that
// picker changes.
//
// Each one carries the cadence it only makes sense at: "Drink water" is
// daily, "Review the budget" is monthly. Tapping a suggestion fills the
// title AND sets the cadence, because the two answers come as a pair — and
// both stay editable afterwards, which is the point of a suggestion rather
// than a template.
//
// Content rules, same as src/data/lifeAreaActions.js:
//   - Plain language that reads right at 13 and at 70.
//   - Nothing that names a product, a brand, or a figure to follow.
//   - Money entries schedule an ACT of attention ("check what went out"),
//     never a decision about what someone should do with their money.
//   - Nothing asks a younger user to contact strangers or sign up anywhere.
//
// No imports: plain data, same as objectives.js and experienceStages.js.

export const PLANNER_SUGGESTIONS = {
  physical: [
    { title: 'Walk for 20 minutes',      cadence: 'daily' },
    { title: 'Drink a glass of water',   cadence: 'daily' },
    { title: 'Stretch before bed',       cadence: 'daily' },
    { title: 'Strength session',         cadence: 'weekly' },
    { title: 'Lights out by a set time', cadence: 'daily' },
    { title: 'Plan the week’s meals',    cadence: 'weekly' },
  ],
  mental: [
    { title: 'Ten quiet minutes',        cadence: 'daily' },
    { title: 'Write down three lines about today', cadence: 'daily' },
    { title: 'One hour with no screen',  cadence: 'daily' },
    { title: 'Deep work block',          cadence: 'daily' },
    { title: 'Weekly reflection',        cadence: 'weekly' },
    { title: 'Read for 20 minutes',      cadence: 'daily' },
  ],
  social: [
    { title: 'Message someone you have not spoken to', cadence: 'weekly' },
    { title: 'Call family',              cadence: 'weekly' },
    { title: 'Plan something with a friend', cadence: 'weekly' },
    { title: 'Eat a meal with someone',  cadence: 'daily' },
    { title: 'Say thank you to one person', cadence: 'weekly' },
    { title: 'Turn up to something in person', cadence: 'monthly' },
  ],
  financial: [
    { title: 'Check what went out this week', cadence: 'weekly' },
    { title: 'Review the budget',        cadence: 'monthly' },
    { title: 'Move something into savings', cadence: 'monthly' },
    { title: 'Read one page on how money works', cadence: 'weekly' },
    { title: 'Check every subscription', cadence: 'monthly' },
    { title: 'Log this week’s income',   cadence: 'weekly' },
  ],
  professional: [
    { title: 'Plan tomorrow before you stop', cadence: 'daily' },
    { title: 'Clear the inbox',          cadence: 'weekly' },
    { title: 'Practise one work skill',  cadence: 'weekly' },
    { title: 'Write down what you got done', cadence: 'weekly' },
    { title: 'Tidy up your CV or profile', cadence: 'monthly' },
    { title: 'Ask for feedback on one thing', cadence: 'monthly' },
  ],
  spiritual: [
    { title: 'Five minutes still, first thing', cadence: 'daily' },
    { title: 'Write down one thing you are glad about', cadence: 'daily' },
    { title: 'Read something that steadies you', cadence: 'daily' },
    { title: 'A walk with no phone',     cadence: 'weekly' },
    { title: 'Time with your community', cadence: 'weekly' },
    { title: 'Look back over the month', cadence: 'monthly' },
  ],
  creative: [
    { title: 'Make something for 20 minutes', cadence: 'daily' },
    { title: 'Fill a page — anything',   cadence: 'daily' },
    { title: 'Work on the current project', cadence: 'weekly' },
    { title: 'Collect things you liked this week', cadence: 'weekly' },
    { title: 'Finish one small piece',   cadence: 'monthly' },
    { title: 'Show someone what you made', cadence: 'monthly' },
  ],
  digital: [
    { title: 'Clear the downloads folder', cadence: 'weekly' },
    { title: 'Back up what you would hate to lose', cadence: 'monthly' },
    { title: 'Check your privacy settings', cadence: 'monthly' },
    { title: 'Install the updates',      cadence: 'weekly' },
    { title: 'A screen-free evening',    cadence: 'weekly' },
    { title: 'Empty one folder of old files', cadence: 'monthly' },
  ],
};

/**
 * Suggestions for one life area, with anything already on the agenda
 * dropped — offering "Walk for 20 minutes" to somebody who scheduled it
 * last week is the kind of suggestion that teaches people to stop reading
 * them. Matching is on a squashed title, so "Call Family" and "call
 * family" count as the same thing.
 *
 * @param areaKey  a key of AREAS in src/api/plannerService.js
 * @param existingTitles  titles already scheduled, any casing
 * @param limit    how many to return
 */
export function suggestionsForArea(areaKey, existingTitles = [], limit = 4) {
  const pool = PLANNER_SUGGESTIONS[areaKey] || [];
  const taken = new Set(existingTitles.map(normalise).filter(Boolean));
  return pool.filter(sg => !taken.has(normalise(sg.title))).slice(0, limit);
}

function normalise(title) {
  return String(title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
