-- Connect the Planner to Classes, Projects, and Training (v1).
--
-- The Planner could schedule a life-area habit, but had no way to say
-- *what specific thing* it was for — a "Study" block on the calendar
-- couldn't point at the actual class topic; a "Build" block couldn't point
-- at the actual project. This adds one optional link per agenda item.
--
-- `link_type` says which of the three it is; `link_screen` carries the
-- screen name to navigate to for a class link (see src/data/classCatalog.js)
-- or the game id for a training link (see src/services/gameRegistry.js —
-- ids are stable strings, not uuids, hence link_screen doing double duty
-- there rather than a second link_id column); `link_id` carries the
-- projects.id row for a project link. Exactly one of link_screen/link_id is
-- meaningful per link_type; the other stays null. No FK on link_id — it can
-- point at a deleted project, and a dangling link should just fail
-- gracefully in the app (it does: PlannerScreen's "Open" action shows an
-- alert if the lookup comes back empty) rather than cascading a delete
-- through someone's agenda.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

alter table public.agenda_instances
  add column if not exists link_type   text check (link_type in ('class','project','game')),
  add column if not exists link_screen text,
  add column if not exists link_id     uuid;

create index if not exists idx_agenda_instances_link_id
  on public.agenda_instances (link_id) where link_id is not null;
