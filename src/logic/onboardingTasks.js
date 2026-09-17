// src/logic/onboardingTasks.js
//
// What "setup" consists of, once you stop treating it as one wizard.
//
// The required core — account type, sectors, and theme/layout — is asked
// before the app opens: the first two decide what Home and the Library even
// render, and the third is the "make it look how you want" half of setting
// up, which needs no prior use of the app to answer.
// Everything below is deferred: the same step components, opened one at a
// time from the Getting Started card on Home, where the user can already
// see the thing each answer changes. That ordering is the point — a
// question about which Library sections to hide means something once
// you've seen the Library, and nothing at all before.
//
// Each task declares how to seed itself FROM the profile and how to map
// its answers BACK to columns, because the step components use their own
// field names in a few places (crest_color/role_badge vs. the
// suit_color/badge columns they actually land in).

import {
  CharacterStep, PlannerStep, InterestsStep, GoalsStep,
} from '../screens/onboarding/steps';

// ─── Age category ───────────────────────────────────────────────────────────
// Onboarding used to ask "Where are you at in life?" as a five-way radio
// list — one screen after the age gate had already taken an exact date of
// birth. Same fact, asked twice, and the second answer was the less
// accurate of the two. Derived now; the question is gone.
//
// Buckets and keys match what recommendationEngine.scoreItem() expects
// (src/api/recommendationEngine.js) and what the old radio list wrote, so
// nothing downstream changes.
export function ageCategoryFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;

  if (age < 13) return 'kid';
  if (age < 18) return 'teen';
  if (age < 26) return 'young_adult';
  if (age <= 40) return 'adult';
  return 'professional';
}

// ─── Deferred setup tasks ───────────────────────────────────────────────────
// `isDone` takes both the profile row and the set of task keys saved
// locally, so a task counts as finished whether it was done here or
// somewhere else — Settings has its own crest editor and Library-sections
// editor writing the same fields, and a task the user already completed
// there shouldn't nag them from Home.

export const SETUP_TASKS = [
  {
    key: 'character',
    label: 'Pick your character',
    blurb: 'Your traveler, crest colour, and role badge',
    icon: 'person-circle-outline',
    Component: CharacterStep,
    seed: (profile) => ({
      traveler_name: profile?.traveler_name || '',
      crest_color:   profile?.suit_color || 'teal',
      role_badge:    profile?.badge || 'explorer',
    }),
    toFields: (data) => ({
      traveler_name: data.traveler_name || null,
      suit_color:    data.crest_color,
      badge:         data.role_badge,
    }),
    isDone: (profile, done) => done.has('character') || !!(profile?.suit_color && profile?.badge),
  },
  {
    key: 'planner',
    label: 'Add starter habits',
    blurb: 'Real templates for the sectors you picked',
    icon: 'calendar-outline',
    Component: PlannerStep,
    seed: (profile) => ({
      active_life_areas: profile?.active_life_areas || [],
      planner_picks: [],
    }),
    // Nothing lands on `profiles` — the picks become real planner
    // subscriptions via applyPlannerPicks() in onboardingService.
    toFields: () => ({}),
    // No cheap way to derive this one: "has planner items" would count
    // anything the user added themselves from the Planner, which is a
    // different thing from having answered this. Local flag only.
    isDone: (profile, done) => done.has('planner'),
  },
  {
    key: 'interests',
    label: 'Set your interests',
    blurb: 'Topics, formats, and skill level for recommendations',
    icon: 'sparkles-outline',
    Component: InterestsStep,
    seed: (profile) => ({
      topics:     profile?.topics || [],
      formats:    profile?.formats || [],
      tech_level: profile?.tech_level || 'beginner',
    }),
    toFields: (data) => ({
      topics:     data.topics || [],
      formats:    data.formats || [],
      tech_level: data.tech_level,
    }),
    isDone: (profile, done) => done.has('interests') || !!profile?.topics?.length,
  },
  {
    key: 'goals',
    label: 'Set your goal & pace',
    blurb: 'What you want, how you use the app, daily commitment',
    icon: 'flag-outline',
    Component: GoalsStep,
    seed: (profile) => ({
      primary_goal:     profile?.primary_goal || '',
      daily_minutes:    profile?.daily_minutes ?? 15,
      life_stage:       profile?.life_stage || '',
      wants_reflection: profile?.wants_reflection || false,
      usage_patterns:   [],
    }),
    toFields: (data) => ({
      primary_goal:     data.primary_goal || null,
      daily_minutes:    data.daily_minutes,
      life_stage:       data.life_stage || null,
      wants_reflection: data.wants_reflection,
    }),
    isDone: (profile, done) => done.has('goals') || !!profile?.primary_goal,
  },
];

// ─── First action ───────────────────────────────────────────────────────────
// One concrete thing to do on landing, instead of a twelve-step tour fired
// 300ms after an eight-step form. Keyed on usage patterns when we have
// them (they're a direct answer), otherwise on the persona, which is the
// only signal that exists on a fresh account — the usage question now
// lives in the deferred Goals task.
//
// `target` is consumed by GettingStartedCard: {tab} alone switches tabs,
// {tab: 'Library', screen} goes into the Library stack.

const ACTION_BY_USAGE = {
  habits:     { label: 'Schedule your first habit', cta: 'Open Planner',   target: { tab: 'Library', screen: 'PlannerScreen' } },
  planning:   { label: 'Plan out your week',        cta: 'Open Planner',   target: { tab: 'Library', screen: 'PlannerScreen' } },
  building:   { label: 'Start your first build',    cta: 'Open Workshop',  target: { tab: 'Library', screen: 'ProjectsScreen' } },
  learning:   { label: 'Pick your first class',     cta: 'Open Academy',   target: { tab: 'Library', screen: 'ClassesStack' } },
  reflecting: { label: 'Plant your first idea',     cta: 'Open Garden',    target: { tab: 'Library', screen: 'IdeaGardenScreen' } },
  breaks:     { label: 'Play your first round',     cta: 'Open Training',  target: { tab: 'Training' } },
};

const ACTION_BY_PERSONA = {
  PERSONAL:     ACTION_BY_USAGE.habits,
  STUDENT:      ACTION_BY_USAGE.learning,
  BUSINESS:     ACTION_BY_USAGE.building,
  ENTREPRENEUR: ACTION_BY_USAGE.building,
};

// Onboarding's "I'm not sure yet". Beats usage patterns and persona both:
// someone who said they don't know what they want shouldn't be pointed at
// a habit tracker as step one. Cleared once they have a Wayfinder map.
const ACTION_EXPLORING = {
  label: 'Figure out what fits you',
  cta: 'Open Wayfinder',
  target: { tab: 'Library', screen: 'WayfinderScreen' },
};

export function firstActionFor(persona, usagePatterns, { exploring = false } = {}) {
  if (exploring) return ACTION_EXPLORING;
  for (const key of usagePatterns || []) {
    if (ACTION_BY_USAGE[key]) return ACTION_BY_USAGE[key];
  }
  return ACTION_BY_PERSONA[persona] || ACTION_BY_USAGE.habits;
}
