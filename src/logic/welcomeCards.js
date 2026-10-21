// src/logic/welcomeCards.js
// The welcome before login (docs/shake-up-plan-2026-10-21.md §7.2): its
// cards, what each needs before you can move on, the answers kept on the
// phone, and where the app opens at launch. No imports, so
// scripts/check-tailoring.mjs can run it. Not wired yet: P2 builds the
// Welcome route on top of it.
//
//   ikigai, ground, notBehind   W1-W3: the four circles, the ground, "You're
//                               not behind. You're starting from here."
//   startPoint                  W4: "Where are you in life right now?"
//   shakiest                    W5: "Which feels shakiest right now?"
//   suggest                     W6: "Want to start here?" (one path)
//   firstPage                   W7: "A page about you", your first Build
//   keep                        W8: "Want to keep this?"
//
// There is no age card, on purpose: age is asked only at signup, where the
// birth date gate and parent consent already are.

export const WELCOME_KEY = '@cth_welcome_v1';

export const WELCOME_CARDS = ['ikigai', 'ground', 'notBehind', 'startPoint', 'shakiest', 'suggest', 'firstPage', 'keep'];

// What a card needs answered before Next works.
const NEEDS = { startPoint: 'startPoint', shakiest: 'shakiest', suggest: 'pathKey', firstPage: 'unit1Done' };

export function canLeave(card, answers = {}) {
  const need = NEEDS[card];
  return !need || !!answers[need];
}

// Where a half-done welcome picks up after a relaunch: the start if nothing
// is answered yet, else the first card still waiting on an answer, else the
// last one.
export function resumeAt(answers = {}) {
  if (!Object.values(NEEDS).some(k => answers[k])) return 0;
  const i = WELCOME_CARDS.findIndex(card => NEEDS[card] && !canLeave(card, answers));
  return i < 0 ? WELCOME_CARDS.length - 1 : i;
}

// The answers, and nothing else. Whatever else turns up in storage (an
// older shape, a stray field) is dropped rather than carried into an
// account at signup; that includes anything age-like.
const TEXT = { startPoint: 20, shakiest: 20, pathKey: 20, firstName: 40 };
const FLAGS = ['unit1Done', 'done', 'guest'];

export function normalizeWelcome(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const [k, max] of Object.entries(TEXT)) {
    out[k] = typeof src[k] === 'string' && src[k].trim() ? src[k].trim().slice(0, max) : null;
  }
  FLAGS.forEach(k => { out[k] = src[k] === true; });
  return out;
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
