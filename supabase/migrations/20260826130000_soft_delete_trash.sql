-- Soft delete / "Recently Deleted" for Projects, Ideas, Notes, and Research.
--
-- Deleting any of these no longer removes the row immediately — it's stamped
-- with deleted_at and hidden from every normal list. It then shows up in the
-- Capture Inbox's "Deleted" tab for 7 days, where it can be restored or
-- purged early. The app itself sweeps anything past 7 days (no pg_cron
-- needed) whenever that tab is opened.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`) before
-- using delete/restore anywhere — the app code already expects these
-- columns to exist.

alter table public.projects     add column if not exists deleted_at timestamptz;
alter table public.garden_cores add column if not exists deleted_at timestamptz;
alter table public.captures     add column if not exists deleted_at timestamptz;

create index if not exists projects_deleted_at_idx     on public.projects (deleted_at);
create index if not exists garden_cores_deleted_at_idx on public.garden_cores (deleted_at);
create index if not exists captures_deleted_at_idx     on public.captures (deleted_at);
