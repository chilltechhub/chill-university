// src/data/lessonPlanTemplates.js
// The hardcoded LAYOUT for the Classroom Day Lesson Plan Builder
// (src/screens/LessonBuilder.js) — the fixed segment/timing scaffold every
// built lesson is assembled onto. This is intentionally NOT in Supabase:
// the shape of a class period doesn't change subject to subject, only the
// content that fills it does (that part lives in Supabase — see
// src/api/lessonBuilderService.js — because there's far more of it and it
// keeps growing).
//
// Each segment's `roles` says which content-bank buckets it pulls its
// picker options from (see BANK_ROLE_META below); a segment can draw from
// more than one role (the 90-min "Core Instruction" segment combines
// Learn + Watch, matching the two combined into one block in that format).

export const LESSON_FORMATS = {
  '45': {
    key: '45',
    label: '45-Minute Class Period',
    totalMinutes: 45,
    segments: [
      { key: 'warmup', label: 'Warm-Up / Hook', minutes: 5, roles: ['warmup'] },
      { key: 'concept', label: 'Direct Instruction (Learn)', minutes: 10, roles: ['concept'] },
      { key: 'watch', label: 'Guided Observation (Watch)', minutes: 10, roles: ['watch'] },
      { key: 'practice', label: 'Active Practice', minutes: 10, roles: ['practice'] },
      { key: 'apply', label: 'Hands-On Application', minutes: 10, roles: ['apply'] },
    ],
  },
  '90': {
    key: '90',
    label: '90-Minute Block',
    totalMinutes: 90,
    segments: [
      { key: 'warmup', label: 'Engage & Activate', minutes: 10, roles: ['warmup'] },
      { key: 'concept', label: 'Core Instruction (Learn + Watch)', minutes: 20, roles: ['concept', 'watch'] },
      { key: 'practice', label: 'Guided Practice', minutes: 15, roles: ['practice'] },
      { key: 'apply', label: 'Individual / Lab Work (Apply)', minutes: 35, roles: ['apply'] },
      { key: 'wrapup', label: 'Wrap-Up & Reflection', minutes: 10, roles: ['wrapup'] },
    ],
  },
};

export const LESSON_FORMAT_KEYS = Object.keys(LESSON_FORMATS); // ['45', '90']

// Metadata for every content-bank "role" a lesson_activity row can be
// tagged with. `objective`, `material`, and `assessment` aren't tied to a
// single timed segment — they render as their own pick-lists above/below
// the segment timeline, same as the old static LessonPlanCard's shape.
export const BANK_ROLE_META = {
  objective:  { label: 'Objectives',  icon: 'flag-outline' },
  material:   { label: 'Materials',   icon: 'briefcase-outline' },
  warmup:     { label: 'Warm-Up',     icon: 'flash-outline' },
  concept:    { label: 'Learn',       icon: 'bulb-outline' },
  watch:      { label: 'Watch',       icon: 'play-circle-outline' },
  practice:   { label: 'Practice',    icon: 'create-outline' },
  apply:      { label: 'Apply',       icon: 'construct-outline' },
  wrapup:     { label: 'Wrap-Up',     icon: 'checkmark-done-outline' },
  assessment: { label: 'Assessment',  icon: 'clipboard-outline' },
};

// Grade bands the builder offers — same 4 used everywhere else in Classes.
export const BUILDER_GRADE_BANDS = ['K-2', '3-5', '6-8', '9-12'];
