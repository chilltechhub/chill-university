-- Next-action surfacing (v1 execution feature #1).
--
-- A project can carry dozens of open tasks/notes/research items with no
-- single "what do I actually do next" signal — the Workshop and Home's
-- "On the Desk" rail both had to guess by just listing several things at
-- once. This adds one nullable field per project: the single next physical
-- step, set from ProjectDetail (src/screens/library/ProjectDetail.js) and
-- surfaced on the Workshop hero/build cards (src/screens/library/projects.js)
-- and Home's single-item "Next Up" card (src/screens/HomeScreen.js).
--
-- Standalone tasks (public.tasks) aren't touched — a task's own title is
-- already its one actionable step, so there's nothing to add there.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

alter table public.projects
  add column if not exists next_action text;
