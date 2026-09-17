-- Wayfinder: one self-discovery map per account.
--
-- Holds what someone said they've done, what pulls them, what matters to
-- them, the experiments they've committed to and how those went, and their
-- own "who I'm becoming" statement. It's personal reflection — the most
-- private thing the app stores after date of birth — so it is owner-only:
-- no parent, organization, mentor or community RPC reads it.
--
-- Per account (auth user), not per persona profile: who you are doesn't
-- change when you switch profiles. So this is deliberately NOT in
-- profileScopedClient's SCOPED_TABLES and has no profile_id.
--
-- The app is local-first (src/api/wayfinderService.js) and keeps working if
-- this hasn't been applied — answers just stay on the device until it is.
--
-- Idempotent: safe to run twice from the SQL editor.

create table if not exists public.wayfinder_maps (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.wayfinder_maps enable row level security;

drop policy if exists "wayfinder_maps_select_own" on public.wayfinder_maps;
create policy "wayfinder_maps_select_own" on public.wayfinder_maps
  for select using (auth.uid() = user_id);

drop policy if exists "wayfinder_maps_insert_own" on public.wayfinder_maps;
create policy "wayfinder_maps_insert_own" on public.wayfinder_maps
  for insert with check (auth.uid() = user_id);

drop policy if exists "wayfinder_maps_update_own" on public.wayfinder_maps;
create policy "wayfinder_maps_update_own" on public.wayfinder_maps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wayfinder_maps_delete_own" on public.wayfinder_maps;
create policy "wayfinder_maps_delete_own" on public.wayfinder_maps
  for delete using (auth.uid() = user_id);

-- No anon access at all, policy or not.
revoke all on public.wayfinder_maps from anon;
grant select, insert, update, delete on public.wayfinder_maps to authenticated;
