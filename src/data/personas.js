// src/data/personas.js
// The ONE list of persona modes — same single-source-of-truth pattern as
// gameRegistry.js and classCatalog.js. The switcher drawer, the onboarding
// step, the dashboard widget filter, and SettingsScreen all read this rather
// than keeping their own copies of the labels/colors/widget defaults.
//
// `adultOnly` is the app-side half of the age gate. The enforcing half is the
// persona_profiles trigger (enforce_profile_limits, tightened to a real
// under-18 test in 20260917140000_age_gating_fixes.sql) — this flag is what
// keeps the adult modes from being *shown* to a minor, so they never hit a
// database error they can't act on.

// ─── defaultWidgets ─────────────────────────────────────────────────────────
// Every type leads with the Compass (the goal in flight) and the desk (the
// one next action). Stats, quotes and rings come after the thing to do.
// The ORDERED list of Home widgets a new profile of this type gets, by key.
// Anything not listed starts hidden (and is still one tap away in Home's
// widget-edit tray) — see layoutForPersona in src/screens/HomeScreen.js.
//
// These keys used to name twelve widgets that did not exist anywhere
// (`studyBlocks`, `orgSnapshot`, `founderQuest`...) while Home rendered its
// own fixed list of nine, and nothing read this field at all — so every
// account got an identical dashboard whatever type it picked. The widgets
// are now real (src/components/widgets/) and Home reads this.
//
// Two were renamed on the way in, because the originals had no data source
// in the schema and the alternative was a dial wired to a constant:
//   systemAudit      -> systemsCheck      (digital + professional check-in ratings)
//   sopTracker       -> recurringOps      (weekly/monthly planner subscriptions)
//   capitalScorecard -> targetsReadiness  (profile baseline + vault deliverables)
// Don't reintroduce the old keys without a table behind them.
export const PERSONAS = [
  {
    key: 'PERSONAL',
    label: 'Personal Life & Habits',
    short: 'Personal',
    emoji: '🌿',
    color: '#3AC860',
    blurb: 'Habits, routines, time-blocking, life balance',
    questLine: 'Daily Mastery',
    // Shown on the onboarding persona step, so the choice is made with the
    // consequences visible rather than from a one-line blurb. Keep these
    // TRUE — every line is checkable against defaultWidgets below and the
    // persona filter in Classes.js.
    changes: [
      'Home leads with your habit rings, life areas and today’s drills',
      'Academy shows the general and wellbeing subjects',
      'Sectors start as Physical, Mental and Social',
    ],
    adultOnly: false,
    defaultWidgets: ['compass', 'goalSteps', 'desk', 'hq', 'lifeAreas', 'habitRings', 'dailyDrills', 'quests', 'wayfinder', 'focus', 'streak', 'wisdom'],
  },
  {
    key: 'STUDENT',
    label: 'Student & Academic',
    short: 'Student',
    emoji: '🎓',
    color: '#4A90E2',
    blurb: 'Study blocks, grades, exams, academic growth',
    questLine: 'Knowledge Tree',
    changes: [
      'Home leads with study blocks, subject progress and today’s drills',
      'Academy shows the full grade-level coursework',
      'Sectors start as Mental, Professional and Social',
    ],
    adultOnly: false,
    defaultWidgets: ['compass', 'goalSteps', 'desk', 'hq', 'studyBlocks', 'dailyDrills', 'classProgress', 'quests', 'wayfinder', 'activities', 'focus', 'checkins', 'streak'],
  },
  {
    key: 'BUSINESS',
    label: 'Business Systems & Ops',
    short: 'Business',
    emoji: '📈',
    color: '#E0A830',
    blurb: 'Operational KPIs, team output, SOPs, revenue vs. burn',
    questLine: 'Empire Builder',
    changes: [
      'Home leads with recurring ops, a systems check and your organization',
      'Academy adds the business-operations subjects',
      'Sectors start as Professional, Financial and Digital',
    ],
    adultOnly: true,
    defaultWidgets: ['compass', 'goalSteps', 'desk', 'hq', 'recurringOps', 'systemsCheck', 'builds', 'quests', 'orgSnapshot', 'focus', 'checkins', 'streak'],
  },
  {
    key: 'ENTREPRENEUR',
    label: 'Entrepreneur & Startup',
    short: 'Entrepreneur',
    emoji: '🚀',
    color: '#8B4FC4',
    blurb: 'Entity setup, business credit, funding readiness, scaling',
    questLine: "Founder's Quest",
    changes: [
      'Home leads with the founder quest, your vault and your targets',
      'Academy adds the entity, credit and funding tracks',
      'Sectors start as Financial, Professional and Creative',
    ],
    adultOnly: true,
    defaultWidgets: ['compass', 'goalSteps', 'desk', 'hq', 'founderQuest', 'builds', 'vaultStatus', 'targetsReadiness', 'quests', 'ideas', 'checkins', 'streak'],
  },
];

export const PERSONA_KEYS = PERSONAS.map(p => p.key);

export const DEFAULT_PERSONA = 'PERSONAL';

export function getPersona(key) {
  return PERSONAS.find(p => p.key === key) || PERSONAS[0];
}

// What a given account may use, in the order to offer them — the first is
// the default.
//   kid (under 13)   Student only. The learning track is the product at this age.
//   teen (13–17)     Student or Personal, Student first.
//   18+              all four, Personal first.
//
// `ageBand` comes from ageBandFor() in src/logic/profileResolver.js, which
// reads the birth date. `isMinor` means "under 18, or age unknown" — the
// restricted flag a guest or an un-aged account carries. It is NOT
// profiles.is_minor: that column is the digital-consent flag (under 13 in
// the US), and reading it as under-18 is how a 15-year-old got offered
// Business. The database trigger makes the same under-18 test on its side.
export function personasFor({ isMinor, ageBand } = {}) {
  if (ageBand === 'kid') return PERSONAS.filter(p => p.key === 'STUDENT');
  if (isMinor || ageBand === 'teen') {
    return PERSONAS.filter(p => !p.adultOnly)
      .sort((a, b) => (b.key === 'STUDENT') - (a.key === 'STUDENT'));
  }
  return PERSONAS;
}

export function defaultPersonaFor(ctx = {}) {
  return personasFor(ctx)[0]?.key || DEFAULT_PERSONA;
}

export function isPersonaAllowed(key, ctx = {}) {
  return personasFor(ctx).some(p => p.key === key);
}

// ─── Per-profile colour ──────────────────────────────────────────────────────
// In an "all profiles" view every item needs to be attributable at a glance.
// The type colour is the right starting point — it's what the switcher and the
// roll-up already use — but two BUSINESS profiles ("Day Job", "Night Job")
// would come out identical, which is exactly the case this view exists to
// disambiguate.
//
// So: first profile of a type keeps the type colour; each subsequent one of
// the same type gets a progressively lighter shade of it. Same colour family,
// so it still reads as "business", but distinguishable. The name and emoji on
// the chip do the precise identification; colour just has to separate them.

function shiftHex(hex, amount) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return hex;
  const ch = (v) => {
    const n = Math.round(parseInt(v, 16) + amount);
    return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  };
  return `#${ch(m[1])}${ch(m[2])}${ch(m[3])}`;
}

// profiles: the account's full list, in display order. Stable as long as the
// order is — which is why it sorts by sort_order rather than trusting input.
export function profileColor(profile, profiles = []) {
  const base = getPersona(profile?.type).color;
  const sameType = profiles
    .filter(p => p.type === profile?.type)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                 || String(a.created_at).localeCompare(String(b.created_at)));
  const idx = sameType.findIndex(p => p.id === profile?.id);
  if (idx <= 0) return base;
  return shiftHex(base, Math.min(idx, 3) * 38);
}

// Lookup of id -> { name, emoji, color, type } for labelling items in an
// all-profiles view without re-deriving the colour per row.
export function buildProfileLookup(profiles = []) {
  const map = {};
  profiles.forEach(p => {
    map[p.id] = {
      id: p.id,
      name: p.name,
      emoji: p.emoji || getPersona(p.type).emoji,
      color: profileColor(p, profiles),
      type: p.type,
    };
  });
  return map;
}
