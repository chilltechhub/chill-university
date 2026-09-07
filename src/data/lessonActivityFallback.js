// src/data/lessonActivityFallback.js
// A true last-resort content bank for the Lesson Builder — generic
// placeholder items for every role in BANK_ROLE_META, used only when
// Supabase has nothing yet for a given subject/grade (e.g. the seed
// migration hasn't been applied, or the very first launch is offline with
// nothing cached). Real content lives in Supabase's `lesson_activity` rows
// (see supabase/migrations/*_classroom_lesson_builder.sql) — this is not a
// second copy of that content, just enough so the builder never shows a
// totally empty, unusable segment.

const FALLBACK_BANK = {
  objective:  [{ title: 'Lesson objective', body: 'Add what students should be able to do by the end of this lesson.' }],
  material:   [{ title: 'Materials', body: "List what you'll need for this lesson." }],
  warmup:     [{ title: 'Warm-up idea', body: "Open with a quick question or hook related to today's topic." }],
  concept:    [{ title: 'Concept', body: "Explain the core idea of today's lesson here." }],
  watch:      [{ title: 'Watch', body: 'Link or describe a video that reinforces the concept.' }],
  practice:   [{ title: 'Practice', body: 'Add a quick question or task to check understanding.' }],
  apply:      [{ title: 'Apply', body: 'Describe a hands-on challenge that puts the concept into practice.' }],
  wrapup:     [{ title: 'Wrap-up', body: 'Close with a reflection or share-out.' }],
  assessment: [{ title: 'Assessment', body: "Describe how you'll know students got it." }],
};

// Same shape for every subject/grade — deliberately generic. Returns a
// fresh copy each call so a caller mutating one role's array (e.g. to
// stamp on ids) never leaks into the shared constant.
export function getFallbackBank() {
  const copy = {};
  Object.entries(FALLBACK_BANK).forEach(([role, items]) => {
    copy[role] = items.map(item => ({ ...item }));
  });
  return copy;
}
