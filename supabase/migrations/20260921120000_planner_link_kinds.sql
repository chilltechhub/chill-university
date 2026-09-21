-- Let a planner item link to a quest, an idea or a vault item, not only a
-- class, project or game.
--
-- Reminders in the Notification Center are planner items with a time (see
-- src/api/reminderService.js), and "remind me about this" now exists on
-- quests, ideas and vault items too. 20260905150000_planner_links.sql limited
-- link_type to the three kinds it shipped with; this widens the check.
--
--   quest  link_screen = the quest id (a string, like class/game links)
--   idea   link_id     = garden_cores.id
--   vault  link_id     = captures.id
--
-- Until this runs, the app retries a reminder without its link when the old
-- check rejects it (reminderService.js), so nothing fails; the reminder just
-- doesn't open its quest/idea/vault item from the Planner.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`). Safe to
-- run again.

alter table public.agenda_instances
  drop constraint if exists agenda_instances_link_type_check;

alter table public.agenda_instances
  add constraint agenda_instances_link_type_check
  check (link_type in ('class', 'project', 'game', 'quest', 'idea', 'vault'));
