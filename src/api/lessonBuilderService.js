// src/api/lessonBuilderService.js
// Data layer for the Classroom Day Lesson Plan Builder (src/screens/
// LessonBuilder.js + src/screens/MyLessonPlans.js). Two things live here:
//
//   1. The content bank a teacher picks from while building a lesson —
//      `app_content` rows with type='lesson_activity', key = `${subject
//      slug}_${gradeBand}` (e.g. "Math_K-2"), meta.role one of the buckets
//      in BANK_ROLE_META (src/data/lessonPlanTemplates.js). This is the
//      "way more information" the user keeps adding — pure content, no
//      app build needed to grow it. See the seed migration for the shape.
//
//   2. A teacher's saved, assembled plans — `teacher_lesson_plans`, a
//      normal owner-scoped table (same RLS pattern as portfolio_entries),
//      read/written with the same cache-first + offline-queue helpers
//      every other per-user table in this app uses.
import { supabase } from './supabaseClient';
import { fetchContentPool } from './remoteConfigService';
import { cacheRead, cacheWrite, isOnline, queueWrite, offlineWrite } from './offlineCache';
import { subjectSlug } from '../data/classCatalog';
import { getFallbackBank } from '../data/lessonActivityFallback';

function bankKey(subjectTitle, gradeBand) {
  return `${subjectSlug(subjectTitle)}_${gradeBand}`;
}

// Returns { [role]: [{ id, title, body }] } for one subject + grade band.
// Every role from BANK_ROLE_META is guaranteed to have at least one item —
// falls back to the generic placeholder bank per-role, so a segment with
// no Supabase content yet still shows something pickable/editable rather
// than an empty picker.
export async function getActivityBank(subjectTitle, gradeBand) {
  const rows = await fetchContentPool('lesson_activity', bankKey(subjectTitle, gradeBand));
  const bank = {};
  rows.forEach((row) => {
    const role = row.meta?.role;
    if (!role) return;
    if (!bank[role]) bank[role] = [];
    bank[role].push({ id: row.id, title: row.title, body: row.body });
  });

  const fallback = getFallbackBank();
  Object.entries(fallback).forEach(([role, items]) => {
    if (!bank[role] || bank[role].length === 0) bank[role] = items;
  });
  return bank;
}

// ─── Saved plans (teacher_lesson_plans) ────────────────────────────────────

export async function listLessonPlans(userId) {
  const cacheKey = `teacher_lesson_plans_${userId}`;
  if (!(await isOnline())) return (await cacheRead(cacheKey)) || [];

  const { data, error } = await supabase
    .from('teacher_lesson_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[lessonBuilderService] listLessonPlans', error.message);
    return (await cacheRead(cacheKey)) || [];
  }
  await cacheWrite(cacheKey, data || []);
  return data || [];
}

// `plan` = { title, subject_title, grade_band, format, objectives,
//            materials, assessment, segments } — see LessonBuilder.js for
// exactly how that's assembled. Pass plan.id to update an existing saved
// plan instead of creating a new one.
export async function saveLessonPlan(userId, plan) {
  const row = { ...plan, user_id: userId };
  const { row: saved, queued } = await offlineWrite(supabase, 'teacher_lesson_plans', row, { type: 'UPSERT' });
  return { plan: saved, queued };
}

export async function deleteLessonPlan(id) {
  if (!(await isOnline())) {
    await queueWrite({ table: 'teacher_lesson_plans', type: 'DELETE', data: { id } });
    return { queued: true };
  }
  const { error } = await supabase.from('teacher_lesson_plans').delete().eq('id', id);
  if (error) throw error;
  return { queued: false };
}
