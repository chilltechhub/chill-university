-- Multi-profile accounts — supersedes the single `active_persona` model from
-- 20260910120000_persona_system.sql.
--
-- The shift: a persona is no longer the thing you switch between, it's the
-- TYPE of a profile you create. One login can hold several profiles — two
-- jobs (two BUSINESS profiles), a personal life and a side personal, three
-- separate startups — each with its own name, targets, widgets and vault,
-- all under one auth user.
--
-- Written to be safe whether or not 20260910120000 was ever applied: every
-- statement is guarded. persona_configs is dropped because its two useful
-- columns (baseline, active_widgets) now live on the profile row itself,
-- where they belong — a config table keyed by (user, persona) cannot
-- represent "two BUSINESS profiles with different revenue targets", which is
-- the entire point of this change.
--
-- ── What does NOT change ─────────────────────────────────────────────────────
-- XP, level, points and streak stay on `profiles`, one shared set per human.
-- One person, one progression, spanning every profile they own. Switching
-- profiles never costs someone their streak, the leaderboard keeps working
-- untouched, and nothing about existing gamification data migrates.
--
-- Apply in the Supabase SQL editor, or via `supabase db push`.

-- ─── 1. Retire the single-persona model ──────────────────────────────────────

drop table if exists public.persona_configs cascade;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_active_persona_check') then
    alter table public.profiles drop constraint profiles_active_persona_check;
  end if;
end $$;

alter table public.profiles drop column if exists active_persona;

-- ─── 2. The profiles a user creates ──────────────────────────────────────────
-- Named persona_profiles, not "accounts": this app already has auth accounts
-- (a login) and family child accounts (genuinely separate logins linked by
-- profiles.parent_id). A third meaning would be the same mistake `role`
-- already made here. `profiles` was likewise taken — that's the one row per
-- human — so these are persona_profiles in the schema and "Profiles" in the UI.

create table if not exists public.persona_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  -- Which template this profile is built from — drives default widgets, the
  -- quest line, and which curriculum track it can reach.
  type           text not null check (type in ('PERSONAL', 'STUDENT', 'BUSINESS', 'ENTREPRENEUR')),
  name           text not null check (char_length(trim(name)) between 1 and 40),
  emoji          text,
  -- The profile created at signup. Cannot be deleted, and is the only one
  -- that can manage the others or see the cross-profile roll-up.
  is_master      boolean not null default false,
  sort_order     integer not null default 0,
  baseline       jsonb not null default '{}'::jsonb,   -- revenue target, GPA goal, ...
  active_widgets jsonb not null default '[]'::jsonb,
  archived_at    timestamptz,                          -- soft delete; keeps vault history intact
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_persona_profiles_user on public.persona_profiles (user_id, sort_order);

-- Exactly one master per user. Partial unique index rather than a constraint
-- so archived rows and non-masters don't collide.
create unique index if not exists idx_persona_profiles_one_master
  on public.persona_profiles (user_id) where is_master;

-- Guard rails on how many profiles one account can spin up. Not a business
-- rule about pricing — just a bound so a loop or a bad client can't create
-- ten thousand rows.
create or replace function public.enforce_profile_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_is_minor boolean;
begin
  -- Age gate. BUSINESS and ENTREPRENEUR carry adult financial content
  -- (business credit, SBA packaging, entity formation, tax strategy). This
  -- lives in a trigger rather than a CHECK because is_minor sits on a
  -- different table now, and a CHECK cannot see across rows.
  select p.is_minor into v_is_minor from public.profiles p where p.id = new.user_id;
  if new.type in ('BUSINESS', 'ENTREPRENEUR') and v_is_minor is true then
    raise exception 'Business and Entrepreneur profiles require an adult account.';
  end if;

  if TG_OP = 'INSERT' then
    select count(*) into v_count
      from public.persona_profiles
      where user_id = new.user_id and archived_at is null;
    if v_count >= 12 then
      raise exception 'Profile limit reached (12 active profiles).';
    end if;
  end if;

  -- The master profile is not deletable and not demotable — it is the one
  -- that manages the rest, so an account must never end up without one.
  if TG_OP = 'UPDATE' and old.is_master and (new.archived_at is not null or not new.is_master) then
    raise exception 'The master profile cannot be archived or demoted.';
  end if;

  return new;
end $$;

drop trigger if exists persona_profiles_enforce on public.persona_profiles;
create trigger persona_profiles_enforce
  before insert or update on public.persona_profiles
  for each row execute function public.enforce_profile_limits();

create or replace function public.block_master_delete()
returns trigger language plpgsql as $$
begin
  if old.is_master then
    raise exception 'The master profile cannot be deleted.';
  end if;
  return old;
end $$;

drop trigger if exists persona_profiles_block_master_delete on public.persona_profiles;
create trigger persona_profiles_block_master_delete
  before delete on public.persona_profiles
  for each row execute function public.block_master_delete();

alter table public.persona_profiles enable row level security;

drop policy if exists persona_profiles_select_own on public.persona_profiles;
create policy persona_profiles_select_own on public.persona_profiles
  for select using (auth.uid() = user_id);

drop policy if exists persona_profiles_insert_own on public.persona_profiles;
create policy persona_profiles_insert_own on public.persona_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists persona_profiles_update_own on public.persona_profiles;
create policy persona_profiles_update_own on public.persona_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists persona_profiles_delete_own on public.persona_profiles;
create policy persona_profiles_delete_own on public.persona_profiles
  for delete using (auth.uid() = user_id);

-- ─── 3. Which profile is currently active ────────────────────────────────────
-- Replaces profiles.active_persona. Nullable: an account that predates this,
-- or one mid-signup, simply has no active profile yet and the client falls
-- back to the master.

alter table public.profiles
  add column if not exists active_profile_id uuid references public.persona_profiles(id) on delete set null;

-- ─── 4. Vault documents belong to a profile, not just a user ─────────────────
-- Two startups under one login must not share an Entity Selection Matrix.

create table if not exists public.vault_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  track         text not null,
  lesson_key    text not null,
  title         text not null,
  status        text not null default 'draft' check (status in ('draft', 'complete')),
  payload       jsonb not null default '{}'::jsonb,
  file_path     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.vault_documents
  add column if not exists profile_id uuid references public.persona_profiles(id) on delete cascade;

-- Re-key from (user, lesson) to (profile, lesson). The old constraint is why
-- this has to change: it would let a founder fill in one operating-agreement
-- worksheet and have it silently appear finished under their other startup.
alter table public.vault_documents drop constraint if exists vault_documents_user_id_lesson_key_key;
create unique index if not exists idx_vault_documents_profile_lesson
  on public.vault_documents (profile_id, lesson_key) where profile_id is not null;

create index if not exists idx_vault_documents_profile on public.vault_documents (profile_id);
create index if not exists idx_vault_documents_user on public.vault_documents (user_id);

alter table public.vault_documents enable row level security;

drop policy if exists vault_documents_select_own on public.vault_documents;
create policy vault_documents_select_own on public.vault_documents
  for select using (auth.uid() = user_id);

drop policy if exists vault_documents_insert_own on public.vault_documents;
create policy vault_documents_insert_own on public.vault_documents
  for insert with check (auth.uid() = user_id);

drop policy if exists vault_documents_update_own on public.vault_documents;
create policy vault_documents_update_own on public.vault_documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists vault_documents_delete_own on public.vault_documents;
create policy vault_documents_delete_own on public.vault_documents
  for delete using (auth.uid() = user_id);

-- ─── 5. Master roll-up ───────────────────────────────────────────────────────
-- One row per active profile with its vault counts, for the master profile's
-- "All profiles" overview. A function rather than a view so it is scoped to
-- the caller by auth.uid() and can never return another account's rows.

-- Dropped rather than replaced: `create or replace` cannot change a function's
-- OUT parameters, and this one's column list has grown. Postgres raises
-- 42P13 ("cannot change return type of existing function") instead, which
-- also makes the migration non-re-runnable. Dropping first keeps it
-- idempotent in either order.
drop function if exists public.get_profile_rollup();

create or replace function public.get_profile_rollup()
returns table (
  profile_id      uuid,
  name            text,
  type            text,
  emoji           text,
  is_master       boolean,
  sort_order      integer,
  baseline        jsonb,
  docs_total      bigint,
  docs_complete   bigint,
  last_activity   timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pp.id,
    pp.name,
    pp.type,
    pp.emoji,
    pp.is_master,
    pp.sort_order,
    pp.baseline,
    count(vd.id)                                        as docs_total,
    count(vd.id) filter (where vd.status = 'complete')  as docs_complete,
    max(vd.updated_at)                                  as last_activity
  from public.persona_profiles pp
  left join public.vault_documents vd on vd.profile_id = pp.id
  where pp.user_id = auth.uid()
    and pp.archived_at is null
  group by pp.id
  order by pp.is_master desc, pp.sort_order, pp.created_at;
$$;

revoke all on function public.get_profile_rollup() from public;
grant execute on function public.get_profile_rollup() to authenticated;

-- ─── 6. updated_at ───────────────────────────────────────────────────────────
-- public.touch_updated_at() comes from 20260828140000_remote_content_config.sql.

drop trigger if exists persona_profiles_touch_updated_at on public.persona_profiles;
create trigger persona_profiles_touch_updated_at
  before update on public.persona_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists vault_documents_touch_updated_at on public.vault_documents;
create trigger vault_documents_touch_updated_at
  before update on public.vault_documents
  for each row execute function public.touch_updated_at();
