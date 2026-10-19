// src/data/connectorsCatalog.js
// Every app Deskartes connects to, or will (docs/connections-plan-2026-10-18.md).
//
// People already use different apps; Deskartes meets them there. It PULLS
// IN what they did and have (it lands as proof on a life area, Used N×,
// or a step) and PUSHES OUT what to do next. The other apps stay the
// source: Deskartes never becomes the place you manage those things.
//
// Phase A connects through the phone's own hubs, which already gather
// hundreds of apps: the share sheet, the calendar, Reminders, and files.
// Later phases (B Health, C automation hubs, D direct sign-in sync) are
// listed as `status: 'soon'` with a "Request this app" vote, so what gets
// built next follows what people ask for.
//
//   status     'live' (src/connectors/<id>.js does the work) | 'soon'
//   platforms  where a live one works: 'ios' | 'android' | 'web'
//   reads      what it brings in, in plain words (shown on the screen)
//   writes     what it sends out, in plain words. 'Nothing' if nothing
//   lands      where pulled data goes: 'inbox' | 'planner' | 'vault' |
//              'life-areas' (the one layer: Done / Stuff / Numbers)
//   examples   the apps it reaches, when it's a hub
//   phase      for 'soon': which phase of the plan builds it
//
// No imports: scripts/check-connectors.mjs loads it as plain data.

export const CONNECTOR_GROUPS = [
  { key: 'phone', label: 'Connected through your phone' },
  { key: 'soon',  label: 'Coming next' },
];

export const CONNECTORS = [
  // ── Phase A: the phone's hubs ──
  {
    id: 'share-sheet', group: 'phone', status: 'live', icon: 'share-outline',
    name: 'Share from any app',
    examples: 'YouTube, TikTok, Reddit, articles, any app with a Share button',
    platforms: ['ios', 'android'],
    reads: 'Links and text you share to Deskartes',
    writes: 'Nothing',
    lands: 'inbox',
    how: 'In any app, tap **Share**, then **Deskartes**. It lands in your **Inbox**.',
  },
  {
    id: 'phone-calendar', group: 'phone', status: 'live', icon: 'calendar-outline',
    name: 'Calendar',
    examples: 'Google, Outlook, iCloud: every calendar on your phone',
    platforms: ['ios', 'android'],
    reads: 'Your events, shown on your Planner',
    writes: 'Your next two weeks of plans, only if you turn it on',
    lands: 'planner',
  },
  {
    id: 'apple-reminders', group: 'phone', status: 'live', icon: 'list-outline',
    name: 'Apple Reminders',
    platforms: ['ios'],
    reads: 'Open reminders from the lists you pick, into your Inbox',
    writes: 'Nothing',
    lands: 'inbox',
  },
  {
    id: 'files', group: 'phone', status: 'live', icon: 'document-text-outline',
    name: 'Files',
    examples: 'Exports from Notion, Obsidian, Day One, Daylio, your bank',
    platforms: ['ios', 'android', 'web'],
    reads: 'Notes, links and bookmarks (Markdown, CSV, browser bookmarks)',
    writes: 'A calendar file of your plans, and a copy of all your data',
    lands: 'inbox',
  },

  // ── Coming next: request one, the votes pick the order ──
  {
    id: 'health', group: 'soon', status: 'soon', phase: 'B', icon: 'fitness-outline',
    name: 'Apple Health / Health Connect',
    examples: 'Strava, Fitbit, Garmin, Oura, MyFitnessPal',
    reads: 'Workouts, steps and sleep, as a weekly count on Physical',
    writes: 'Focus sessions as mindful minutes',
    lands: 'life-areas',
  },
  {
    id: 'automation', group: 'soon', status: 'soon', phase: 'C', icon: 'git-network-outline',
    name: 'Zapier, Make, IFTTT, n8n',
    examples: 'Thousands of apps',
    reads: 'Anything those apps can send',
    writes: 'Steps done, Finds saved, lessons finished',
    lands: 'inbox',
  },
  {
    id: 'shortcuts', group: 'soon', status: 'soon', phase: 'C', icon: 'flash-outline',
    name: 'iOS Shortcuts',
    reads: '"Add to Deskartes" from anywhere',
    writes: '"What\'s my step today?"',
    lands: 'inbox',
  },
  { id: 'todoist',       group: 'soon', status: 'soon', phase: 'D', icon: 'checkbox-outline',  name: 'Todoist',          reads: 'Tasks, into your Inbox',                 writes: 'Your steps',           lands: 'inbox' },
  { id: 'google-tasks',  group: 'soon', status: 'soon', phase: 'D', icon: 'checkbox-outline',  name: 'Google Tasks',     reads: 'Tasks, into your Inbox',                 writes: 'Your steps',           lands: 'inbox' },
  { id: 'ms-todo',       group: 'soon', status: 'soon', phase: 'D', icon: 'checkbox-outline',  name: 'Microsoft To Do',  reads: 'Tasks, into your Inbox',                 writes: 'Your steps',           lands: 'inbox' },
  { id: 'ticktick',      group: 'soon', status: 'soon', phase: 'D', icon: 'checkbox-outline',  name: 'TickTick',         reads: 'Tasks, into your Inbox',                 writes: 'Your steps',           lands: 'inbox' },
  { id: 'notion',        group: 'soon', status: 'soon', phase: 'D', icon: 'document-outline',  name: 'Notion',           reads: 'Pages and database rows, into your Vault', writes: 'Lessons and plans',  lands: 'vault' },
  { id: 'readwise',      group: 'soon', status: 'soon', phase: 'D', icon: 'book-outline',      name: 'Readwise',         examples: 'Kindle, articles', reads: 'Highlights, into your Vault', writes: 'Nothing', lands: 'vault' },
  { id: 'ynab',          group: 'soon', status: 'soon', phase: 'D', icon: 'wallet-outline',    name: 'YNAB',             reads: "The month's spending by category, on Financial", writes: 'Nothing', lands: 'life-areas' },
  { id: 'strava',        group: 'soon', status: 'soon', phase: 'D', icon: 'bicycle-outline',   name: 'Strava',           reads: 'Activities, on Physical',                writes: 'Nothing',              lands: 'life-areas' },
  { id: 'habitica',      group: 'soon', status: 'soon', phase: 'D', icon: 'game-controller-outline', name: 'Habitica',   reads: 'Habits you checked off',                 writes: 'Your steps as to-dos', lands: 'life-areas' },
];

export const CONNECTOR_BY_ID = Object.fromEntries(CONNECTORS.map(c => [c.id, c]));
