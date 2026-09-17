-- Scope user content to a Profile.
--
-- Until now every content row was keyed to a user. With several Profiles per
-- login, that means a founder's personal projects show up inside their night
-- job and their startup — which is exactly what people don't want. This adds
-- profile_id to the root content tables and backfills everything that already
-- exists to the owner's master profile, so nothing disappears.
--
-- ── Root entities only ───────────────────────────────────────────────────────
-- Child tables (project_tasks, project_research, project_milestones,
-- project_journal, garden_vines, garden_petals, garden_updates) are NOT given
-- a profile_id. They hang off a parent that has one, so they inherit scoping
-- through the foreign key. Duplicating it onto children would create two
-- sources of truth that can disagree — a task whose project says one profile
-- and whose own column says another.
--
-- ── What stays shared, deliberately ──────────────────────────────────────────
--   profiles (xp, level, points, streak)   one human, one progression
--   user_missions, missions, subject_progress
--   user_settings                          app preferences, not content
--   life_areas                             the eight wellness areas belong to
--                                          the person, not to a job
--   activity_log, user_recommendations
--
-- ── Planner and calendar are a hybrid ────────────────────────────────────────
-- agenda_instances and calendar_events DO get a profile_id — they are owned by
-- the profile that created them — but the app deliberately offers an "all
-- profiles" view over them, because a person has only one actual day and
-- needs to see conflicts across every context. Ownership is per profile;
-- visibility is a choice. See PlannerScreen / CalendarModal.
--
-- Apply in the Supabase SQL editor, or via `supabase db push`.

-- ─── 1. Every existing account needs a master profile ────────────────────────
-- The backfill below has nowhere to put existing rows otherwise. The app also
-- creates a master lazily on first launch, but doing it here means every
-- account already has one the moment this migration lands, rather than only
-- the accounts that happen to open the app.
--
-- PERSONAL because it is the safe default and the only type valid for every
-- account, minors included.

insert into public.persona_profiles (user_id, type, name, emoji, is_master, sort_order)
select p.id, 'PERSONAL', 'Personal', '🌿', true, 0
from public.profiles p
where not exists (
  select 1 from public.persona_profiles pp
  where pp.user_id = p.id and pp.is_master
);

-- Point each account at its master unless it already has an active profile.
update public.profiles p
set active_profile_id = pp.id
from public.persona_profiles pp
where pp.user_id = p.id
  and pp.is_master
  and p.active_profile_id is null;

-- ─── 2. Add profile_id to each root content table, and backfill ──────────────
-- Guarded per table: this repo's schema has grown in pieces and not every
-- deployment necessarily has every table. A missing table is skipped rather
-- than failing the whole migration.

do $$
declare
  t text;
  root_tables text[] := array[
    'projects',
    'captures',
    'tasks',
    'priority_tasks',
    'area_notes',
    'garden_cores',
    'portfolio_entries',
    'daily_focus',
    'timer_sessions',
    'daily_checkins',
    'agenda_instances',
    'calendar_events'
  ];
begin
  foreach t in array root_tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping %, table not present', t;
      continue;
    end if;

    -- Column
    execute format(
      'alter table public.%I add column if not exists profile_id uuid references public.persona_profiles(id) on delete cascade',
      t
    );

    -- Backfill to the owner's master profile. Existing content belongs to the
    -- profile the person has always been using, which is the master by
    -- definition — nothing should vanish from view because of this migration.
    execute format(
      'update public.%I c
         set profile_id = pp.id
        from public.persona_profiles pp
       where pp.user_id = c.user_id
         and pp.is_master
         and c.profile_id is null',
      t
    );

    -- Index: every scoped read filters on this.
    execute format(
      'create index if not exists idx_%s_profile on public.%I (profile_id)',
      t, t
    );
  end loop;
end $$;

-- ─── 3. Roll-up now counts real content, not just vault documents ────────────
-- The master's "All profiles" overview is more useful showing how much actual
-- work lives in each profile.

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
  projects_count  bigint,
  tasks_count     bigint,
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
    (select count(*) from public.vault_documents vd where vd.profile_id = pp.id),
    (select count(*) from public.vault_documents vd where vd.profile_id = pp.id and vd.status = 'complete'),
    (select count(*) from public.projects pr where pr.profile_id = pp.id),
    (select count(*) from public.tasks tk where tk.profile_id = pp.id),
    greatest(
      (select max(vd.updated_at) from public.vault_documents vd where vd.profile_id = pp.id),
      pp.updated_at
    )
  from public.persona_profiles pp
  where pp.user_id = auth.uid()
    and pp.archived_at is null
  order by pp.is_master desc, pp.sort_order, pp.created_at;
$$;

revoke all on function public.get_profile_rollup() from public;
grant execute on function public.get_profile_rollup() to authenticated;
