-- Pet coins: one every 3 minutes (20 an hour), at most 50 in any 24 hours.
-- Replaces the 12-per-six-hours rule from 20260928120000. Decided 2026-09-30.
--
-- ── Why ──────────────────────────────────────────────────────────────────────
-- The pet's coins are a reward for being in the app. Under the old rule a
-- session earned its 12 in the first minute or two (coins appeared every few
-- seconds) and then nothing for six hours. Now the app puts down one coin when
-- the next one can pay, and the pet eats it: a steady +1 every 3 minutes while
-- the app is open, on any screen.
--
-- ── Rules ────────────────────────────────────────────────────────────────────
-- * At least 3 minutes between paid coins (10 s of slack for timers).
-- * At most 50 in the last 24 hours. A rolling window rather than midnight:
--   the server doesn't know the person's time zone, and a client-supplied
--   date could be switched back and forth for 100 in a day.
-- * Same award as before: 1 XP + 1 point, logged to activity_log.
--
-- The reply adds `next_in`: seconds until the next coin can pay (the 3-minute
-- gap, or, once 50 are used, until the oldest one leaves the window).
-- src/logic/useCoinRewards.js schedules the next coin from it. An older app
-- ignores it and keeps its own limit, so app and SQL can ship in either order.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here).

create or replace function public.collect_pet_coin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_gap    interval := interval '3 minutes';
  v_slack  interval := interval '10 seconds';
  v_daily  int := 50;
  v_count  int;
  v_last   timestamptz;
  v_oldest timestamptz;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  perform pg_advisory_xact_lock(hashtext('pet_coin:' || v_uid::text));
  select count(*), max(claimed_at), min(claimed_at)
    into v_count, v_last, v_oldest
    from public.reward_claims
   where user_id = v_uid and kind = 'pet_coin' and claimed_at > now() - interval '24 hours';

  -- Too soon after the last one.
  if v_last is not null and now() < v_last + v_gap - v_slack then
    return jsonb_build_object(
      'points', 0,
      'remaining', greatest(0, v_daily - v_count),
      'next_in', ceil(extract(epoch from (v_last + v_gap - now())))::int);
  end if;

  -- The day's 50 are used: the next one frees up when the oldest leaves the window.
  if v_count >= v_daily then
    return jsonb_build_object(
      'points', 0,
      'remaining', 0,
      'next_in', greatest(1, ceil(extract(epoch from (v_oldest + interval '24 hours' - now())))::int));
  end if;

  insert into public.reward_claims (user_id, kind, xp, points) values (v_uid, 'pet_coin', 1, 1);
  insert into public.activity_log (user_id, activity_type, subject, xp_earned, points_earned, metadata)
  values (v_uid, 'COIN_COLLECTED', 'general', 1, 1, '{}'::jsonb);
  perform public._award_progress(v_uid, 1, 1);

  return jsonb_build_object(
    'points', 1,
    'remaining', v_daily - v_count - 1,
    'next_in', extract(epoch from v_gap)::int);
end;
$$;

revoke all on function public.collect_pet_coin() from public, anon;
grant execute on function public.collect_pet_coin() to authenticated;
