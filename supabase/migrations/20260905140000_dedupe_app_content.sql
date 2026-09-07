-- app_content's seed migration (20260828140000_remote_content_config.sql)
-- ends each insert with `on conflict do nothing`, which looks idempotent
-- but never was: app_content's only unique constraint is its `id` primary
-- key, a fresh gen_random_uuid() on every insert, so there was never
-- actually a conflict for Postgres to catch. Running that migration more
-- than once (easy to do across multiple sessions/devices working on this
-- repo) silently re-inserted every quote, tip, and Resources "Discover"
-- catalog entry each time — confirmed live: "MyFitnessPal" appears 3x in
-- a row under Physical in Resources → Discover.
--
-- This migration is safe to run any number of times:
--   1. Deletes duplicate rows, keeping the oldest survivor of each group
--      (grouped by type/key/title/body, nulls normalized via coalesce so
--      quotes — which always have key=NULL, title=NULL — dedupe correctly
--      too, not just the more obviously-affected resources).
--   2. Adds a real unique index on that same normalized group, so any
--      future re-run of the seed migration (or a hand-added duplicate)
--      is actually caught by `on conflict do nothing` from now on.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

delete from public.app_content a
using public.app_content b
where a.type = b.type
  and coalesce(a.key, '')   = coalesce(b.key, '')
  and coalesce(a.title, '') = coalesce(b.title, '')
  and coalesce(a.body, '')  = coalesce(b.body, '')
  and (a.created_at, a.id) > (b.created_at, b.id);

create unique index if not exists app_content_dedupe_idx
  on public.app_content (type, (coalesce(key, '')), (coalesce(title, '')), (coalesce(body, '')));
