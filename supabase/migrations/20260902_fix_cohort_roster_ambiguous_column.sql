-- Fixes "column reference ... is ambiguous" in two functions from
-- 20260901_institutional_layer.sql: get_cohort_roster() (display_name) and
-- get_cohort_leaderboard() (id/display_name/points/xp/level/rank_position,
-- all six at once — every column its final SELECT returns). Both are
-- PL/pgSQL functions whose RETURNS TABLE output columns are exposed as
-- variables inside the function body; bare column names in a query that
-- happen to match those output names collide with the real table/CTE
-- columns of the same name. This only surfaces when the function actually
-- runs (opening a cohort's roster or leaderboard), not when it's created,
-- so the original migration applied cleanly but calling either failed.
--
-- Safe to run even if you haven't hit these yet — CREATE OR REPLACE just
-- overwrites the function definitions, no data is touched.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`.

create or replace function public.get_cohort_roster(p_cohort_id uuid)
returns table (
  user_id               uuid,
  display_name          text,
  role_in_cohort        text,
  joined_at             timestamptz,
  assignments_completed bigint,
  assignments_total     bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id   uuid;
  v_org_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select c.organization_id into v_org_id from public.cohorts c where c.id = p_cohort_id;
  if v_org_id is null then
    raise exception 'Cohort not found.';
  end if;

  select om.role into v_org_role
  from public.organization_members om
  where om.organization_id = v_org_id and om.user_id = auth.uid();

  if v_org_role not in ('owner', 'admin')
     and not exists (select 1 from public.cohort_members cm where cm.cohort_id = p_cohort_id and cm.user_id = auth.uid())
     and not exists (select 1 from public.cohort_managers gm where gm.cohort_id = p_cohort_id and gm.user_id = auth.uid())
  then
    raise exception 'Not a member of this cohort.';
  end if;

  return query
    select
      p.id,
      coalesce(p.display_name, p.traveler_name, p.username, 'Traveler'),
      case when exists (
        select 1 from public.cohort_managers gm where gm.cohort_id = p_cohort_id and gm.user_id = p.id
      ) then 'manager' else 'member' end,
      cme.joined_at,
      (
        select count(*) from public.cohort_assignment_progress cap
        join public.cohort_assignments ca on ca.id = cap.assignment_id
        where ca.cohort_id = p_cohort_id and cap.user_id = p.id and cap.status = 'completed'
      ),
      (
        select count(*) from public.cohort_assignments ca where ca.cohort_id = p_cohort_id
      )
    from public.cohort_members cme
    join public.profiles p on p.id = cme.user_id
    where cme.cohort_id = p_cohort_id
    order by coalesce(p.display_name, p.traveler_name, p.username, 'Traveler');
end;
$$;

comment on function public.get_cohort_roster(uuid) is
  'Member roster for a cohort with per-person assignment completion counts. Visible to anyone in the cohort. SECURITY DEFINER.';

grant execute on function public.get_cohort_roster(uuid) to authenticated;

create or replace function public.get_cohort_leaderboard(p_cohort_id uuid, p_limit int default 50)
returns table (
  id            uuid,
  display_name  text,
  points        int,
  xp            int,
  level         int,
  rank_position bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id   uuid;
  v_org_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select c.organization_id into v_org_id from public.cohorts c where c.id = p_cohort_id;
  if v_org_id is null then
    raise exception 'Cohort not found.';
  end if;

  select om.role into v_org_role
  from public.organization_members om
  where om.organization_id = v_org_id and om.user_id = auth.uid();

  if v_org_role not in ('owner', 'admin')
     and not exists (select 1 from public.cohort_members cm where cm.cohort_id = p_cohort_id and cm.user_id = auth.uid())
     and not exists (select 1 from public.cohort_managers gm where gm.cohort_id = p_cohort_id and gm.user_id = auth.uid())
  then
    raise exception 'Not a member of this cohort.';
  end if;

  return query
    with ranked as (
      select
        p.id,
        coalesce(p.display_name, p.traveler_name, p.username, 'Traveler') as display_name,
        coalesce(p.points, 0) as points,
        coalesce(p.xp, 0)     as xp,
        coalesce(p.level, 1)  as level,
        row_number() over (
          order by coalesce(p.points, 0) desc, coalesce(p.xp, 0) desc, p.id
        ) as rank_position
      from public.profiles p
      join public.cohort_members cme on cme.user_id = p.id
      where cme.cohort_id = p_cohort_id
    )
    select ranked.id, ranked.display_name, ranked.points, ranked.xp, ranked.level, ranked.rank_position
    from ranked
    order by ranked.rank_position
    limit greatest(p_limit, 0);
end;
$$;

comment on function public.get_cohort_leaderboard(uuid, int) is
  'Points leaderboard scoped to one cohort, visible only to its members/managers/org admins. SECURITY DEFINER.';

grant execute on function public.get_cohort_leaderboard(uuid, int) to authenticated;
