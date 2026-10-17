-- The Dream layer: one dream per account (docs/north-star.md).
--
-- The life someone wants in their own words, the 1-3 things in it they work
-- toward, their top values, what they won't trade, and who they're
-- becoming, plus their old versions (so it can change without losing the
-- "before"). Shape: src/logic/dream.js.
--
-- Personal reflection, like wayfinder_maps, so it is owner-only: no parent,
-- organization, mentor or community RPC reads it.
--
-- Per account (auth user), not per persona profile: who you are doesn't
-- change when you switch profiles. Deliberately NOT in profileScopedClient's
-- SCOPED_TABLES and has no profile_id.
--
-- The app is local-first (src/api/dreamService.js) and keeps working if this
-- hasn't been applied: the dream just stays on the device until it is.
--
-- Idempotent: safe to run twice from the SQL editor.

create table if not exists public.dreams (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dreams enable row level security;

drop policy if exists "dreams_select_own" on public.dreams;
create policy "dreams_select_own" on public.dreams
  for select using (auth.uid() = user_id);

drop policy if exists "dreams_insert_own" on public.dreams;
create policy "dreams_insert_own" on public.dreams
  for insert with check (auth.uid() = user_id);

drop policy if exists "dreams_update_own" on public.dreams;
create policy "dreams_update_own" on public.dreams
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "dreams_delete_own" on public.dreams;
create policy "dreams_delete_own" on public.dreams
  for delete using (auth.uid() = user_id);

-- No anon access at all, policy or not.
revoke all on public.dreams from anon;
grant select, insert, update, delete on public.dreams to authenticated;
