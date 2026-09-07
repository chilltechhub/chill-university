-- Migrates the Academy Classes SUBJECT list (Math, Language Arts, Science, ...)
-- into app_content — see 20260828140000_remote_content_config.sql for the
-- table + RLS policy. Topic-level content was already migrated
-- (20260828_class_and_area_content.sql, type='class_topic'); this is the one
-- layer above it that was still 100% hardcoded in Classes.js: the subject
-- cards themselves, including which of the four not-yet-built subjects
-- (Technology & Engineering, Foreign Language, Health & Fitness, Business &
-- Finance) show "SOON" and can't be tapped into.
--
-- type = 'class_subject', key = null, one row per subject.
--   title -> subject card title
--   body  -> subject card description
--   meta.icon        -> Ionicons name
--   meta.color       -> card accent hex
--   meta.comingSoon  -> true hides the sublist and shows a "SOON" badge
--                       instead of navigating anywhere. Flip to false (and
--                       fill in that subject's class_topic rows) to launch
--                       one of the four unbuilt subjects with no app build.
--
-- Apply once via the Supabase SQL editor or `supabase db push`. See
-- src/screens/Classes.js for the fetch + fallback (same never-blank-if-
-- Supabase-is-unreachable pattern as every other app_content consumer).

insert into public.app_content (type, key, title, body, meta, sort_order) values
  ('class_subject', null, 'Math', 'Numbers, algebra, geometry & more', jsonb_build_object('icon', 'calculator', 'color', '#4A90E2', 'comingSoon', false), 0),
  ('class_subject', null, 'Language Arts', 'Reading, writing & communication', jsonb_build_object('icon', 'book', 'color', '#E05858', 'comingSoon', false), 1),
  ('class_subject', null, 'Science', 'Explore the natural world', jsonb_build_object('icon', 'flask', 'color', '#3AC860', 'comingSoon', false), 2),
  ('class_subject', null, 'Social Sciences', 'History, geography & society', jsonb_build_object('icon', 'people', 'color', '#E0A830', 'comingSoon', false), 3),
  ('class_subject', null, 'Art & Music', 'Express your creativity', jsonb_build_object('icon', 'color-palette', 'color', '#8B4FC4', 'comingSoon', false), 4),
  ('class_subject', null, 'Home Economics & Workshop', 'Practical life skills', jsonb_build_object('icon', 'home', 'color', '#E07A30', 'comingSoon', false), 5),
  ('class_subject', null, 'Technology & Engineering', 'Build the future', jsonb_build_object('icon', 'laptop', 'color', '#5A9AE0', 'comingSoon', true), 6),
  ('class_subject', null, 'Foreign Language', 'Connect with the world', jsonb_build_object('icon', 'language', 'color', '#3498DB', 'comingSoon', true), 7),
  ('class_subject', null, 'Health & Fitness', 'Mind and body wellness', jsonb_build_object('icon', 'fitness', 'color', '#E05858', 'comingSoon', true), 8),
  ('class_subject', null, 'Business & Finance', 'Economics & entrepreneurship', jsonb_build_object('icon', 'briefcase', 'color', '#3AC860', 'comingSoon', true), 9)
on conflict do nothing;
