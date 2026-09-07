-- Portfolio "Add Entry" never persisted anything.
--
-- PortfolioScreen (src/screens/library/portfolio.js)'s addItem()/deleteItem()
-- only ever called React's setData() — no Supabase table backed them at
-- all. Every manually-added Experience/Skill/Research/Passion/Project entry
-- silently vanished on the next screen load or app restart (the Experience
-- section is explicitly reset to `[]` on every load — "starts empty, user
-- fills in" — with nothing to fill it back in from). This adds the missing
-- table and, in the same app change, wires addItem/deleteItem/loadAll to it.
--
-- Single-owner data (like tasks/notes/daily_focus), so this uses ordinary
-- owner-scoped RLS policies rather than the SECURITY DEFINER RPC pattern
-- this project reserves for cross-user access (family linking, leaderboard,
-- the institutional layer).
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.portfolio_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  section     text not null check (section in ('projects', 'skills', 'experience', 'research', 'passions')),
  title       text not null,
  description text,
  link        text,
  tag         text,
  created_at  timestamptz not null default now()
);

create index if not exists portfolio_entries_user_section_idx
  on public.portfolio_entries (user_id, section, created_at desc);

alter table public.portfolio_entries enable row level security;

create policy "portfolio_entries_select_own" on public.portfolio_entries
  for select using (auth.uid() = user_id);

create policy "portfolio_entries_insert_own" on public.portfolio_entries
  for insert with check (auth.uid() = user_id);

create policy "portfolio_entries_update_own" on public.portfolio_entries
  for update using (auth.uid() = user_id);

create policy "portfolio_entries_delete_own" on public.portfolio_entries
  for delete using (auth.uid() = user_id);
