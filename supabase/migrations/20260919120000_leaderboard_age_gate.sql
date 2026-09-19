-- Leaderboard: actually keep minors off it, and stop the position lookup from
-- reading anyone but the caller.
--
-- 1. Both functions in 20260826_leaderboard.sql excluded `role = 'child'`.
--    Nothing in the app ever writes that value (profiles.role is 'student' by
--    default), so every minor's name, points and level were listed to every
--    signed-in user. They now use is_restricted_account() from
--    20260906140000_community_discover.sql — the same rule Discover uses:
--    under 18 by birth date, or age unknown, is not shown to strangers.
--
-- 2. get_my_leaderboard_position(p_user_id) returned whatever uuid it was
--    given. It now always answers for auth.uid(). The parameter stays so the
--    app needs no change (and so create-or-replace keeps the same signature);
--    it is ignored. A restricted account still sees its own rank, counted
--    against the public list, it just isn't in that list.
--
-- 3. is_restricted_account() was executable by anyone holding the anon key,
--    which answers "is this uuid a minor?". Every caller is a SECURITY DEFINER
--    function or trigger, which runs it as the owner, so client roles don't
--    need it.
--
-- Safe to run more than once. Return types are unchanged, so no drop needed.

begin;

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
    where not public.is_restricted_account(p.id)
  )
  select id, display_name, points, xp, level, rank_position
  from ranked
  where points > 0
  order by rank_position
  limit greatest(p_limit, 0);
$$;

comment on function public.get_leaderboard(int) is
  'Top N players by points. Excludes under-18 and unknown-age accounts (is_restricted_account) and zero-point profiles. SECURITY DEFINER — only returns name/points/xp/level/rank_position, never the full profiles row.';

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
  with me as (
    select
      p.id,
      coalesce(p.display_name, p.traveler_name, p.username, 'Traveler') as display_name,
      coalesce(p.points, 0) as points,
      coalesce(p.xp, 0)     as xp,
      coalesce(p.level, 1)  as level
    from public.profiles p
    where p.id = auth.uid()
  )
  -- Same ordering as get_leaderboard's row_number(), so a public player's
  -- number here matches their row there.
  select
    me.id, me.display_name, me.points, me.xp, me.level,
    1 + (
      select count(*)
      from public.profiles o
      where o.id <> me.id
        and not public.is_restricted_account(o.id)
        and (
          coalesce(o.points, 0) > me.points
          or (coalesce(o.points, 0) = me.points and coalesce(o.xp, 0) > me.xp)
          or (coalesce(o.points, 0) = me.points and coalesce(o.xp, 0) = me.xp and o.id < me.id)
        )
    ) as rank_position
  from me;
$$;

comment on function public.get_my_leaderboard_position(uuid) is
  'The signed-in player''s own rank against the public leaderboard. p_user_id is ignored — it always answers for auth.uid().';

grant execute on function public.get_my_leaderboard_position(uuid) to authenticated;

revoke execute on function public.is_restricted_account(uuid) from public, anon, authenticated;

commit;
