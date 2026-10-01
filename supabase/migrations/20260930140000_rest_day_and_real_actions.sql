-- Streak rest day, and real-life actions that count. docs/audit-plan-2026-09-30.md,
-- 4.7 and 4.8. Decided 2026-09-30 (defaults D5, D6).
--
-- ── 1. Rest day ──────────────────────────────────────────────────────────────
-- Miss exactly one day and the streak survives, once in any 7 days. Automatic,
-- never bought. touch_streak() spends it when the next day with activity
-- comes in, and remembers when in profiles.streak_rest_on (the app reads that
-- to show the streak as still alive on the morning after a missed day).
--
-- ── 2. Real work counts ──────────────────────────────────────────────────────
-- Until now XP came only from games, lessons, quests and pet coins: finishing
-- a planner item, a project step, a life-area action or a whole goal moved
-- nothing, and the streak counted merely opening the app. record_action() is
-- the one door for "the person did something":
--   * planner_done, project_step, area_action, goal_done, checkin
--       5 XP each (XP only: points are the prize cards), at most 50 XP in any
--       24 hours, and the same item (p_ref) pays once per 24 hours, so ticking
--       a box on and off can't farm it.
--   * game, lesson, quest
--       no XP here (they pay their own way), streak only.
-- Every kind keeps the streak going (touch_streak). The app stops calling
-- touch_streak on launch, so a streak means a day something was done.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here). The app falls
-- back to the old touch_streak() while record_action() doesn't exist yet, so
-- app and SQL can ship in either order.

begin;

-- ─── Rest day column, server-written only ───────────────────────────────────
alter table public.profiles add column if not exists streak_rest_on date;

-- Same pattern as profiles_protect_server_fields (20260927120000), as its own
-- small trigger so that big function doesn't have to be restated here.
create or replace function public.profiles_protect_streak_rest()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.streak_rest_on := null;
  else
    new.streak_rest_on := old.streak_rest_on;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_streak_rest on public.profiles;
create trigger profiles_protect_streak_rest
  before insert or update on public.profiles
  for each row execute function public.profiles_protect_streak_rest();

-- ─── touch_streak with the rest day ─────────────────────────────────────────
create or replace function public.touch_streak(p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today    date := coalesce(p_today, current_date);
  v_last     date;
  v_streak   int;
  v_rest     date;
  v_rest_now boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  if v_today not between current_date - 1 and current_date + 1 then
    v_today := current_date;
  end if;

  select p.last_active_date, coalesce(p.streak_count, 0), p.streak_rest_on
    into v_last, v_streak, v_rest
    from public.profiles p where p.id = auth.uid()
    for update;

  if v_last is not null and v_today <= v_last then
    return jsonb_build_object('streak_count', greatest(v_streak, 1), 'last_active_date', v_last,
                              'streak_rest_on', v_rest, 'changed', false, 'rest_used', false);
  end if;

  if v_last = v_today - 1 then
    v_streak := greatest(v_streak, 1) + 1;
  elsif v_last = v_today - 2 and (v_rest is null or v_rest <= v_today - 7) then
    -- One missed day, and no rest day in the last week: yesterday was the rest day.
    v_streak := greatest(v_streak, 1) + 1;
    v_rest := v_today - 1;
    v_rest_now := true;
  else
    v_streak := 1;
  end if;

  update public.profiles
     set streak_count = v_streak,
         last_active_date = v_today,
         longest_streak = greatest(coalesce(longest_streak, 0), v_streak),
         streak_rest_on = v_rest
   where id = auth.uid();

  return jsonb_build_object('streak_count', v_streak, 'last_active_date', v_today,
                            'streak_rest_on', v_rest, 'changed', true, 'rest_used', v_rest_now);
end;
$$;

-- ─── Real actions ───────────────────────────────────────────────────────────
create table if not exists public.action_claims (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,
  ref        text,
  xp         int not null default 0,
  claimed_at timestamptz not null default now()
);
create index if not exists action_claims_user_time_idx
  on public.action_claims (user_id, claimed_at desc);
alter table public.action_claims enable row level security;
-- No client policies: only record_action() reads or writes it.
revoke all on public.action_claims from anon, authenticated;

create or replace function public.record_action(p_kind text, p_ref text default null, p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_xp_each int := 5;
  v_xp_cap  int := 50;
  v_earned  int;
  v_xp      int := 0;
  v_streak  jsonb;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;
  if p_kind not in ('planner_done', 'project_step', 'area_action', 'goal_done', 'checkin', 'game', 'lesson', 'quest') then
    raise exception 'Unknown action.';
  end if;

  if p_kind in ('planner_done', 'project_step', 'area_action', 'goal_done', 'checkin') then
    perform pg_advisory_xact_lock(hashtext('real_action:' || v_uid::text));
    select coalesce(sum(xp), 0) into v_earned
      from public.action_claims
     where user_id = v_uid and claimed_at > now() - interval '24 hours';

    if v_earned < v_xp_cap
       and not (p_ref is not null and exists (
         select 1 from public.action_claims
          where user_id = v_uid and kind = p_kind and ref = p_ref
            and claimed_at > now() - interval '24 hours')) then
      v_xp := least(v_xp_each, v_xp_cap - v_earned);
      insert into public.action_claims (user_id, kind, ref, xp) values (v_uid, p_kind, left(p_ref, 120), v_xp);
      perform public._award_progress(v_uid, v_xp, 0);
      v_earned := v_earned + v_xp;
    end if;
  end if;

  v_streak := public.touch_streak(p_today);

  return v_streak || jsonb_build_object('xp', v_xp, 'xp_left_today', greatest(0, v_xp_cap - v_earned));
end;
$$;

revoke all on function public.record_action(text, text, date) from public, anon;
grant execute on function public.record_action(text, text, date) to authenticated;

commit;
