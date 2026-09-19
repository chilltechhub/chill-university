// src/logic/searchIndex.js
// The navigable index behind the command palette (src/components/
// CommandPalette.js): every screen a person can actually land on, as flat
// searchable rows.
//
// Almost all of it is derived from lists that already exist — LIBRARY_HUBS,
// LIFE_AREAS (and each area's own sections), the class catalog, the game
// registry — so adding a subject, a life-area section, or a game puts it in
// search with no edit here. Only the handful of screens that belong to no
// such list are written out below.

import { LIBRARY_HUBS } from '../screens/library/LibraryScreen';
import { LIFE_AREAS } from '../screens/library/LifeAreaScreen';
import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from '../data/classCatalog';
import { GAMES_MASTER } from '../screens/GamesScreen';

// ─── Route descriptors ─────────────────────────────────────────────────────
// The palette renders above the navigator, not inside a screen, so every
// jump has to name its full path: a bare navigate('SomeLibraryScreen') from
// out there only resolves if that nested stack happens to be mounted
// already (see the note at the top of FloatingActionButton.js). These
// helpers keep every destination in the explicit nested form instead.
const root = (screen, params) => ({ type: 'root', screen, params });
const tab = (tabName) => ({ type: 'tab', tab: tabName });
const library = (screen, params) => ({ type: 'tab', tab: 'Library', screen, params });
const classes = (screen) => ({ type: 'tab', tab: 'Library', screen: 'ClassesStack', params: { screen } });

export function navigateTo(navigation, route) {
  if (!route) return;
  if (route.type === 'root') return navigation.navigate(route.screen, route.params);
  const inner = route.screen ? { screen: route.screen, params: route.params } : undefined;
  return navigation.navigate('MainTabs', { screen: route.tab, params: inner });
}

// ─── Screens with no list of their own ─────────────────────────────────────
// Compass-gated screens (Work Mode, Weekly Review, Import Hub, Labs,
// Mentors, Organization, Deep Insights...) stay listed here on purpose.
// Searching for something and being told it doesn't exist is worse than
// searching for it and being told what opens it — the routes themselves are
// gated at the navigator (see src/components/FeatureGate.js's gatedScreen),
// so landing on one shows its lock and the way through rather than its
// contents.
const STANDALONE = [
  { title: 'Home',            subtitle: 'Today, focus & quick actions',      icon: 'home-outline',            route: tab('Home') },
  { title: 'Training',        subtitle: 'Games & daily drills',              icon: 'barbell-outline',         route: tab('Training') },
  { title: 'Library',         subtitle: 'Every hub, life area & class',      icon: 'book-outline',            route: tab('Library') },
  { title: 'Capture Inbox',   subtitle: 'Process what you jotted down',      icon: 'file-tray-full-outline',  route: library('CaptureInbox') },
  { title: 'Import Hub',      subtitle: 'Bulk-import text, links or files',  icon: 'cloud-upload-outline',    route: library('ImportScreen') },
  { title: 'Work Mode',       subtitle: 'Focus session timer',               icon: 'timer-outline',           route: library('WorkModeScreen') },
  { title: 'Weekly Review',   subtitle: 'Look back on the week',             icon: 'calendar-clear-outline',  route: library('WeeklyReviewScreen') },
  { title: 'Labs',            subtitle: 'Experiments in progress',           icon: 'flask-outline',           route: library('LabsScreen') },
  { title: 'Breakthroughs',   subtitle: 'What others are shipping',          icon: 'sparkles-outline',        route: library('BreakthroughsScreen') },
  { title: 'Fellow Scholars', subtitle: 'People on a similar path',          icon: 'people-outline',          route: library('FellowScholarsScreen') },
  { title: 'Top Talent',      subtitle: 'Standout work worth knowing',       icon: 'ribbon-outline',          route: library('TopTalentScreen') },
  { title: 'Mentors & Experts', subtitle: 'More experienced people',         icon: 'school-outline',          route: library('MentorsScreen') },
  { title: 'Community Projects', subtitle: 'Builds from the community',      icon: 'git-network-outline',     route: library('CommunityProjectsScreen') },
  { title: 'Profile',         subtitle: 'Rank, points, streak & account',    icon: 'person-circle-outline',   route: root('Profile') },
  { title: 'Compass',       subtitle: 'Your purpose, objective & unlocks',  icon: 'navigate-outline',        route: root('Compass') },
  { title: 'Deep Insights',   subtitle: 'Long-range stats across subjects',   icon: 'analytics-outline',       route: root('Stats') },
  { title: 'Settings',        subtitle: 'Theme, sections, notifications',    icon: 'settings-outline',        route: root('Settings') },
  { title: 'Help',            subtitle: 'What this screen is for',           icon: 'help-circle-outline',     route: root('Help') },
  { title: 'Leaderboard',     subtitle: 'Where you stand',                   icon: 'trophy-outline',          route: root('Leaderboard') },
  { title: 'Family',          subtitle: 'Link a parent or child account',    icon: 'people-circle-outline',   route: root('Family') },
  { title: 'Organization',    subtitle: 'Manage or join a class or group',   icon: 'business-outline',        route: root('Organization') },
];

// The Knowledge Vault's type filters, reachable directly — searching
// "papers" should land on papers, not on a screen you then have to filter.
const VAULT_VIEWS = [
  { title: 'Notes',     subtitle: 'Knowledge Vault · your written notes',   icon: 'document-text-outline', type: 'note' },
  { title: 'Bookmarks', subtitle: 'Knowledge Vault · saved links',          icon: 'link-outline',          type: 'bookmark' },
  { title: 'Papers',    subtitle: 'Knowledge Vault · research & citations', icon: 'school-outline',        type: 'paper' },
  { title: 'Tools',     subtitle: 'Knowledge Vault · reference & utilities', icon: 'construct-outline',    type: 'tool' },
];

let cached = null;

// Flat, searchable, built once per app run.
export function getDestinations() {
  if (cached) return cached;
  const out = [];
  const push = (group, row) => out.push({ id: `${group}:${row.title}:${out.length}`, group, ...row });

  STANDALONE.forEach((row) => push('Screens', row));

  LIBRARY_HUBS.forEach((hub) => {
    hub.items.forEach((item) => push('Screens', {
      title: item.label,
      subtitle: item.desc,
      icon: item.icon,
      route: item.screen === 'ClassesStack' ? classes('ClassesMain') : library(item.screen),
    }));
  });

  VAULT_VIEWS.forEach((v) => push('Screens', {
    title: v.title,
    subtitle: v.subtitle,
    icon: v.icon,
    route: library('KnowledgeScreen', { initialType: v.type }),
  }));

  LIFE_AREAS.forEach((area) => {
    push('Life areas', {
      title: area.label,
      subtitle: area.subtitle,
      icon: area.icon,
      color: area.color,
      emoji: area.emoji,
      route: library('LifeAreaScreen', { areaId: area.id }),
    });
    // Each area's own sub-sections (Sleep & Recovery, Debt & Credit, ...) —
    // the tiles you'd otherwise have to drill two levels to reach.
    (area.sections || []).forEach((section) => push('Life areas', {
      title: section.title,
      subtitle: `${area.label} · ${(section.items || []).slice(0, 3).join(', ')}`,
      icon: section.icon,
      color: area.color,
      route: library(section.screen, { areaId: area.id }),
    }));
  });

  CLASS_SUBJECTS.forEach((subject) => {
    push('Classes', {
      title: subject.title,
      subtitle: subject.description,
      icon: subject.icon,
      color: subject.color,
      route: classes('ClassesMain'),
      subject,
    });
    (subject.children || []).forEach((child) => {
      const screen = CLASS_SCREEN_MAP[child.label];
      if (!screen) return;
      push('Classes', {
        title: child.label,
        subtitle: `${subject.title}${child.grade ? ` · Grades ${child.grade}` : ''}`,
        icon: subject.icon,
        color: subject.color,
        route: classes(screen),
        subject,
      });
    });
  });

  GAMES_MASTER.forEach((game) => push('Games', {
    title: game.title,
    subtitle: [game.subject, game.mechanic].filter(Boolean).join(' · '),
    icon: 'game-controller-outline',
    color: game.color,
    emoji: game.emoji,
    route: root('Play', { gameId: game.key }),
  }));

  cached = out;
  return out;
}

// ─── Which rows show ────────────────────────────────────────────────────────
// Search is an entry point like any other, so it asks the same questions the
// screens do (docs/access-system.md), through AccessContext:
//
//   Allowed?    an `adult` class subject never turns up for anyone under 18
//               or of unknown age. This used to be done by account type —
//               a guest or a minor's profile could type "Capital & Funding"
//               and land in adult financial content — and is an age rule now.
//   Shown now?  only what the current stage shows. A first-day account
//               typing "portfolio" shouldn't turn up the one thing the
//               Library is keeping out of sight. Another type's class
//               subjects appear once 'all-tools' opens, same as in Classes.
//
// Class rows are checked by destination screen as well as by row, because
// recents are stored without the subject — an adult-track visit saved on one
// profile must not resurface under "Recent" on another.
let subjectScreens = null;
function subjectForScreen(screen) {
  if (!subjectScreens) {
    subjectScreens = {};
    CLASS_SUBJECTS.forEach((subject) => {
      (subject.children || []).forEach((child) => {
        const target = CLASS_SCREEN_MAP[child.label];
        if (target) subjectScreens[target] = subject;
      });
    });
  }
  return subjectScreens[screen] || null;
}

// `visibility` is { isScreenVisible, isGameVisible, isSubjectVisible } from
// AccessContext. Without it nothing is filtered, which only a script should
// ever rely on.
export function isRowShown(row, { isScreenVisible, isGameVisible, isSubjectVisible } = {}) {
  const route = row?.route;
  const subject = row?.subject || subjectForScreen(route?.params?.screen);
  if (subject && isSubjectVisible && !isSubjectVisible(subject)) return false;
  if (!route || !isScreenVisible) return true;
  if (route.type === 'root') {
    if (route.screen === 'Play') return isGameVisible ? isGameVisible(route.params?.gameId) : true;
    return isScreenVisible(route.screen);
  }
  return route.screen ? isScreenVisible(route.screen) : true;
}

// Rank: a title that starts with the query beats one that merely contains
// it, which beats a subtitle-only match. Without this, typing "math" buries
// the Math subject under every topic whose subtitle says "Math".
export function searchDestinations(query, limit = 8, visibility) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  getDestinations().forEach((row) => {
    if (!isRowShown(row, visibility)) return;
    const title = row.title.toLowerCase();
    const subtitle = (row.subtitle || '').toLowerCase();
    let score = 0;
    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 80;
    else if (title.includes(q)) score = 60;
    else if (subtitle.includes(q)) score = 30;
    if (score) scored.push({ row, score });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.row.title.length - b.row.title.length)
    .slice(0, limit)
    .map((x) => x.row);
}

// What the palette shows before anything is typed.
export function defaultDestinations(visibility) {
  const wanted = ['Capture Inbox', 'Knowledge Vault', 'The Workshop', 'Planner', 'Academy Classes', 'Idea Garden'];
  const all = getDestinations();
  return wanted
    .map((title) => all.find((row) => row.title === title))
    .filter((row) => row && isRowShown(row, visibility));
}
