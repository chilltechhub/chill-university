-- Real work earns the most XP.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- record_action() (20260930140000) paid 5 XP per real action, 50 a day, while
-- one game round paid 100+. The app rewarded screen time over doing things.
-- The app now caps game XP at 100 a day (src/logic/gameXpCap.js); this side
-- raises what real work pays:
--
--   planner_done, task_done, area_action, checkin   10
--   project_step                                    20
--   goal_done                                       50
--   project_done  (new: a project marked Done)     100, once per project ever
--
-- The rolling-24h cap goes from 50 to 300. The same item still pays once a
-- day; game / lesson / quest still count for the streak only.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does
-- not match the live database, so `supabase db push` is not safe here). Until
-- it runs, the app's project_done call gets "Unknown action." back, logs it,
-- and carries on.

begin;

create or replace function public.record_action(p_kind text, p_ref text default null, p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_xp_each int;
  v_xp_cap  int := 300;
  v_earned  int;
  v_xp      int := 0;
  v_streak  jsonb;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;
  if p_kind not in ('planner_done', 'task_done', 'project_step', 'project_done', 'area_action', 'goal_done', 'checkin', 'game', 'lesson', 'quest') then
    raise exception 'Unknown action.';
  end if;

  v_xp_each := case p_kind
    when 'project_done' then 100
    when 'goal_done'    then 50
    when 'project_step' then 20
    when 'game'         then 0
    when 'lesson'       then 0
    when 'quest'        then 0
    else 10
  end;

  if v_xp_each > 0 then
    perform pg_advisory_xact_lock(hashtext('real_action:' || v_uid::text));
    select coalesce(sum(xp), 0) into v_earned
      from public.action_claims
     where user_id = v_uid and claimed_at > now() - interval '24 hours';

    if v_earned < v_xp_cap
       -- The same item pays once a day; a shipped project pays once, ever
       -- (moving it back to In progress and Done again pays nothing).
       and not (p_ref is not null and exists (
         select 1 from public.action_claims
          where user_id = v_uid and kind = p_kind and ref = left(p_ref, 120)
            and (p_kind = 'project_done' or claimed_at > now() - interval '24 hours'))) then
      v_xp := least(v_xp_each, v_xp_cap - v_earned);
      insert into public.action_claims (user_id, kind, ref, xp) values (v_uid, p_kind, left(p_ref, 120), v_xp);
      perform public._award_progress(v_uid, v_xp, 0);
      v_earned := v_earned + v_xp;
    end if;
  end if;

  v_streak := public.touch_streak(p_today);

  return v_streak || jsonb_build_object('xp', v_xp, 'xp_left_today', greatest(0, v_xp_cap - coalesce(v_earned, 0)));
end;
$$;

revoke all on function public.record_action(text, text, date) from public, anon;
grant execute on function public.record_action(text, text, date) to authenticated;

commit;
