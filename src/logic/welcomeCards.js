// src/logic/welcomeCards.js
// The welcome before login: its cards, what each needs before you can move
// on, the answers kept on the phone, and where the app opens at launch. No
// imports, so scripts/check-tailoring.mjs can run it. The Welcome route
// (src/screens/welcome/) and App.js's boot are built on it.
//
// Since 2026-10-21 it's the founder's Descartes onboarding, exactly as they
// specified it (their Gemini thread + descartes_onboarding_portfolio_builder.html;
// docs/shake-up-plan-2026-10-21.md §7.2 had ikigai cards here):
//
//   quote       Step 1 of 5. "It is not enough to have a good mind…",
//               fading in one line at a time. Tap anywhere.
//   why         Step 2. "Conquer yourself rather than the world." then
//               "What brings you here today?" (pick any: goals)
//   stage       Step 3. "What stage of life are you at right now?" (startPoint)
//   interests   Step 4. "Pick your skills & interests" (pick any)
//   project     Step 5. "Recommended Project", or one of the others
//   build       the live builder: preview, code, customize, export
//   keep        "Want to keep this?" Then a quick look around the app and
//               the first mission (src/logic/useWelcomeTour.js).
//
// Every card can be skipped, and the first four have a fast track straight
// to the project. There is no age card, on purpose: age is asked only at
// signup, where the birth date gate and parent consent already are.

export const WELCOME_KEY = '@cth_welcome_v1';

export const WELCOME_CARDS = ['quote', 'why', 'stage', 'interests', 'project', 'build', 'keep'];
// "Step 1 of 5" … "Step 5 of 5": the founder's five; the builder and keep follow.
export const WELCOME_STEPS = 5;

// What a card needs answered before Next works. Skip moves on without it.
const NEEDS = { why: 'goals', stage: 'startPoint', interests: 'interests', project: 'projectKind', build: 'unit1Done' };

const answered = (v) => (Array.isArray(v) ? v.length > 0 : !!v);

export function canLeave(card, answers = {}) {
  const need = NEEDS[card];
  return !need || answered(answers[need]);
}

// Where a half-done welcome picks up after a relaunch: the card they were
// on (`at`), else the first card still waiting on an answer, else the start.
export function resumeAt(answers = {}) {
  const at = WELCOME_CARDS.indexOf(answers.at);
  if (at >= 0) return at;
  if (!Object.values(NEEDS).some(k => answered(answers[k]))) return 0;
  const i = WELCOME_CARDS.findIndex(card => NEEDS[card] && !canLeave(card, answers));
  return i < 0 ? WELCOME_CARDS.length - 1 : i;
}

// The answers, and nothing else. Whatever else turns up in storage (an
// older shape, a stray field) is dropped rather than carried into an
// account at signup; that includes anything age-like.
// shakiest is from the ikigai welcome; an older half-done one still has it.
const TEXT = { startPoint: 20, shakiest: 20, pathKey: 20, firstName: 40, projectKind: 20, at: 20 };
const LISTS = { goals: 8, interests: 12 }; // picked keys, in the order picked
const FLAGS = ['unit1Done', 'done', 'guest'];

export function normalizeWelcome(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const [k, max] of Object.entries(TEXT)) {
    out[k] = typeof src[k] === 'string' && src[k].trim() ? src[k].trim().slice(0, max) : null;
  }
  for (const [k, max] of Object.entries(LISTS)) {
    const list = Array.isArray(src[k]) ? src[k] : [];
    out[k] = [...new Set(list.filter(v => typeof v === 'string' && /^[a-zA-Z]{1,20}$/.test(v)))].slice(0, max);
  }
  FLAGS.forEach(k => { out[k] = src[k] === true; });
  return out;
}

// Pick or unpick one key of a multi-pick card, keeping the order picked.
export function togglePick(list = [], key) {
  return list.includes(key) ? list.filter(k => k !== key) : [...list, key];
}

// WELCOME_V1, the rollback switch (plan §11 P2). Set either way, it wins.
// Unset, it's on for a device nobody has signed in on, and off for one
// someone has: a person who signed out lands on Login, as they always did.
// `chosen`: someone tapped "New here? Start here" on Login, so the welcome
// is theirs on this device too (until someone signs in).
export function welcomeEnabled(setting, signedInBefore, chosen = false) {
  if (setting === true || setting === false) return setting;
  return !signedInBefore || !!chosen;
}

// "New here? Start here" on Login opens the welcome. A finished one opens
// again (the answers stay, and "Start over" is there); a half-done one picks
// up where it was. The patch to save first, or null.
export function startHerePatch(welcome) {
  return normalizeWelcome(welcome).done ? { done: false, guest: false, at: null } : null;
}

// The line a page project starts with, from where they are and the path
// they're on. A draft in plain words; it's theirs to change.
const START_LINE = {
  highSchool: 'Finishing high school.', college: 'In college.', working: 'Working now.',
  creator: 'Making my own thing.', ged: 'Getting my diploma.', unsure: 'Starting from here.',
};
const PATH_LINE = {
  like: 'Trying things to find what fits.',
  next: 'Working out what comes next.',
  money: 'Getting my money right.',
  career: 'Turning a job into a career.',
  ground: 'Getting my basics steady first.',
};
export const PAGE_LINE_MAX = 90; // the page Build's own limit (src/data/builds.js)
export function pageLineFor({ startPoint, pathKey } = {}) {
  return [START_LINE[startPoint], PATH_LINE[pathKey]].filter(Boolean).join(' ') || START_LINE.unsure;
}

// DASHBOARD_V2 (shake-up P3): Today as the Planner dashboard. Set either way,
// it wins. Unset: on for an account made through the welcome (finish()
// writes metadata.shakeup_onboarded_at) and for a guest who kept going from
// it; off for every account from before, who can opt in.
export function dashboardV2On(setting, { signedIn = false, onboardedAt = null, welcomeGuest = false } = {}) {
  if (setting === true || setting === false) return setting;
  return signedIn ? !!onboardedAt : !!welcomeGuest;
}

// TABS_V2 (shake-up P4): the tabs Today · Learn · Make, the new top bar and
// You. Set either way, it wins; unset, it follows Today (DASHBOARD_V2).
export function tabsV2On(setting, dashboardV2) {
  if (setting === true || setting === false) return setting;
  return !!dashboardV2;
}

// PROGRESS_V2 (shake-up P5): receipts, not a score. Set either way, it wins;
// unset, it follows the new tabs.
export function progressV2On(setting, tabsV2) {
  if (setting === true || setting === false) return setting;
  return !!tabsV2;
}

/**
 * Where the app opens (§7.2 Boot).
 *   hasSession           someone is signed in
 *   onboardingCompleted  profiles.onboarding_completed
 *   hasPathKey           profiles.metadata.path_key is set
 *   welcome              the stored answers (normalizeWelcome)
 *   welcomeOn            the WELCOME_V1 setting; off sends everyone
 *                        signed out to Login, as before
 *   timedOut             the session check failed or took too long
 * Returns { route, guest, pickPathNote }. 'MainTabs' opens on Today.
 */
export function bootTarget({ hasSession, onboardingCompleted, hasPathKey, welcome, welcomeOn = true, timedOut = false } = {}) {
  const w = normalizeWelcome(welcome);
  const asGuest = { route: 'MainTabs', guest: true, pickPathNote: false };
  const login = { route: 'Login', guest: false, pickPathNote: false };
  // A guest who chose to keep going stays a guest through a slow start.
  if (timedOut) return welcomeOn && w.done && w.guest ? asGuest : login;
  if (hasSession) {
    if (onboardingCompleted !== true) return { route: 'MultiStepOnboarding', guest: false, pickPathNote: false };
    // An account from before the shake-up gets one "Pick your path" note,
    // never the welcome.
    return { route: 'MainTabs', guest: false, pickPathNote: !hasPathKey };
  }
  if (!welcomeOn) return login;
  if (!w.done) return { route: 'Welcome', guest: false, pickPathNote: false };
  return w.guest ? asGuest : login;
}
