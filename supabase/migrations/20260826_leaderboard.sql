-- Leaderboard: two SECURITY DEFINER functions instead of a broad RLS
-- policy on `profiles`. This means every player can see everyone else's
-- name/points/xp/level for ranking purposes, WITHOUT needing a policy that
-- exposes the rest of the profiles row (email-derived username beyond what
-- we choose to return, role, parent_id, grade, settings, etc). Child
-- accounts (role = 'child') are excluded from both functions entirely.
--
-- `position` is a reserved SQL keyword (POSITION(... IN ...)), so the rank
-- column is named `rank_position` instead.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push` if you
-- use the CLI locally with this project linked. Nothing in the app applies
-- it automatically.

create or replace function public.get_leaderboard(p_limit int default 50)
returns table (
  id uuid,
  display_name text,
  points int,
  xp int,
  level int,
  rank_position bigint
)
language sql
security definer
set search_path = public
stable
as $$
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
    where coalesce(p.role, 'user') <> 'child'
  )
  select id, display_name, points, xp, level, rank_position
  from ranked
  where points > 0
  order by rank_position
  limit greatest(p_limit, 0);
$$;

comment on function public.get_leaderboard(int) is
  'Top N players by points. Excludes child-role accounts and zero-point profiles. SECURITY DEFINER — only returns name/points/xp/level/rank_position, never the full profiles row.';

grant execute on function public.get_leaderboard(int) to authenticated;

create or replace function public.get_my_leaderboard_position(p_user_id uuid)
returns table (
  id uuid,
  display_name text,
  points int,
  xp int,
  level int,
  rank_position bigint
)
language sql
security definer
set search_path = public
stable
as $$
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
    where coalesce(p.role, 'user') <> 'child'
  )
  select id, display_name, points, xp, level, rank_position
  from ranked
  where id = p_user_id;
$$;

comment on function public.get_my_leaderboard_position(uuid) is
  'One player''s own rank_position/points, ranked against the same population as get_leaderboard (so numbers always line up), even when they are outside the top N.';

grant execute on function public.get_my_leaderboard_position(uuid) to authenticated;

-- Speeds up the ORDER BY inside both functions as the table grows. Safe to
-- run even if it already exists.
create index if not exists idx_profiles_points_desc on public.profiles (points desc);
