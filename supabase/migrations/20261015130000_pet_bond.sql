-- Pet bond: the pet levels up as you keep feeding it. Decided 2026-10-15.
-- Needs 20261015120000_pet_food.sql first (pet_care, point_spends, feed_pet).
--
-- ── Rules ────────────────────────────────────────────────────────────────────
-- * Bond = hearts refilled by a feed, doubled when the pet still had a heart
--   left (fed before it went fully hungry). Hearts drain 3 a day, so that's
--   also the daily cap. Bond never goes down.
-- * Levels by bond: 1 New friend (0), 2 Pal (10), 3 Buddy (30),
--   4 Great buddy (70), 5 Best buddy (140).
-- * Perks: Pal can name the pet; Buddy's coins pay 2 points, Best buddy's 3
--   (XP stays 1 a coin); Great buddy brings a gift of 10 points once every
--   20 hours. Best buddy is also a badge, shown by the app.
-- * A hungry pet (bowl empty) finds no coins. The app already doesn't put
--   any down; now the server refuses them too.
--
-- Numbers match src/logic/petBond.js — scripts/check-pet-hunger.mjs checks.
-- Safe to run more than once. The app works without it (bond and name stay
-- on the device, coins pay 1, no gifts).
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here).

alter table public.pet_care add column if not exists bond     int not null default 0;
alter table public.pet_care add column if not exists nickname text;
alter table public.pet_care add column if not exists gift_at  timestamptz;

-- Hearts left in a bowl that empties at p_full (4 max, one per 8 hours).
create or replace function public._pet_hearts(p_full timestamptz)
returns int
language sql
stable
as $$
  select case
    when p_full is null then 4
    else least(4, greatest(0, ceil(extract(epoch from (p_full - now())) / 28800.0)))::int
  end;
$$;

create or replace function public._pet_level(p_bond int)
returns int
language sql
immutable
as $$
  select case
    when p_bond >= 140 then 5
    when p_bond >= 70  then 4
    when p_bond >= 30  then 3
    when p_bond >= 10  then 2
    else 1
  end;
$$;

revoke all on function public._pet_hearts(timestamptz) from public, anon, authenticated;
revoke all on function public._pet_level(int) from public, anon, authenticated;

-- ─── pet_status() — now with bond, name and the last gift ───────────────────
create or replace function public.pet_status(p_has_pet boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_row    public.pet_care%rowtype;
  v_earned int;
  v_spent  int;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_row from public.pet_care where user_id = v_uid;
  if not found and p_has_pet then
    insert into public.pet_care (user_id, full_until)
    values (v_uid, now() + interval '32 hours')
    on conflict (user_id) do nothing;
    select * into v_row from public.pet_care where user_id = v_uid;
  end if;

  select coalesce(points, 0) into v_earned from public.profiles where id = v_uid;
  select coalesce(sum(points), 0) into v_spent from public.point_spends where user_id = v_uid;

  return jsonb_build_object(
    'full_until', v_row.full_until,
    'spent', v_spent,
    'wallet', greatest(0, coalesce(v_earned, 0) - v_spent),
    'bond', coalesce(v_row.bond, 0),
    'nickname', v_row.nickname,
    'gift_at', v_row.gift_at);
end;
$$;

revoke all on function public.pet_status(boolean) from public, anon;
grant execute on function public.pet_status(boolean) to authenticated;

-- ─── feed_pet() — same as before, plus bond ─────────────────────────────────
create or replace function public.feed_pet(p_food text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_cost   int;
  v_hours  int;
  v_full   timestamptz;
  v_bond   int;
  v_earned int;
  v_spent  int;
  v_next   timestamptz;
  v_before int;
  v_after  int;
  v_gain   int;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  if p_food = 'snack' then v_cost := 5;  v_hours := 8;
  elsif p_food = 'meal' then v_cost := 15; v_hours := 32;
  else raise exception 'Unknown food: %', p_food;
  end if;

  perform pg_advisory_xact_lock(hashtext('feed_pet:' || v_uid::text));

  select full_until, bond into v_full, v_bond from public.pet_care where user_id = v_uid;
  v_full := coalesce(v_full, now());
  v_bond := coalesce(v_bond, 0);

  select coalesce(points, 0) into v_earned from public.profiles where id = v_uid;
  select coalesce(sum(points), 0) into v_spent from public.point_spends where user_id = v_uid;

  -- Already full: more than 24 hours left means all four hearts are there.
  if v_full > now() + interval '24 hours' then
    return jsonb_build_object('ok', false, 'reason', 'full', 'full_until', v_full,
      'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent), 'bond', v_bond);
  end if;

  if v_earned - v_spent < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'points', 'full_until', v_full,
      'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent), 'bond', v_bond);
  end if;

  v_next   := least(now() + interval '32 hours', greatest(now(), v_full) + make_interval(hours => v_hours));
  v_before := public._pet_hearts(v_full);
  v_after  := public._pet_hearts(v_next);
  v_gain   := greatest(0, v_after - v_before) * (case when v_before > 0 then 2 else 1 end);

  insert into public.point_spends (user_id, item, points) values (v_uid, 'pet_' || p_food, v_cost);
  insert into public.pet_care (user_id, full_until, fed_count, bond, updated_at)
  values (v_uid, v_next, 1, v_gain, now())
  on conflict (user_id) do update
    set full_until = excluded.full_until,
        fed_count  = public.pet_care.fed_count + 1,
        bond       = public.pet_care.bond + v_gain,
        updated_at = now();

  v_spent := v_spent + v_cost;
  return jsonb_build_object('ok', true, 'full_until', v_next,
    'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent),
    'bond', v_bond + v_gain, 'gained', v_gain);
end;
$$;

revoke all on function public.feed_pet(text) from public, anon;
grant execute on function public.feed_pet(text) to authenticated;

-- ─── set_pet_name() — Pal and up ────────────────────────────────────────────
-- Trimmed, spaces squeezed, 16 characters. Empty clears it (the species name
-- shows again).
create or replace function public.set_pet_name(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_bond int;
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 16);
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;
  select bond into v_bond from public.pet_care where user_id = v_uid;
  if public._pet_level(coalesce(v_bond, 0)) < 2 then
    return jsonb_build_object('ok', false, 'reason', 'level');
  end if;
  update public.pet_care set nickname = nullif(v_name, ''), updated_at = now() where user_id = v_uid;
  return jsonb_build_object('ok', true, 'nickname', nullif(v_name, ''));
end;
$$;

revoke all on function public.set_pet_name(text) from public, anon;
grant execute on function public.set_pet_name(text) to authenticated;

-- ─── claim_pet_gift() — Great buddy and up, once every 20 hours ─────────────
create or replace function public.claim_pet_gift()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_bond int;
  v_last timestamptz;
  v_pts  int := 10;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  perform pg_advisory_xact_lock(hashtext('pet_gift:' || v_uid::text));
  select bond, gift_at into v_bond, v_last from public.pet_care where user_id = v_uid;

  if public._pet_level(coalesce(v_bond, 0)) < 4 then
    return jsonb_build_object('points', 0, 'reason', 'level');
  end if;
  if v_last is not null and now() < v_last + interval '20 hours' then
    return jsonb_build_object('points', 0, 'reason', 'soon', 'gift_at', v_last,
      'next_in', ceil(extract(epoch from (v_last + interval '20 hours' - now())))::int);
  end if;

  update public.pet_care set gift_at = now(), updated_at = now() where user_id = v_uid;
  insert into public.activity_log (user_id, activity_type, subject, xp_earned, points_earned, metadata)
  values (v_uid, 'PET_GIFT', 'general', 0, v_pts, '{}'::jsonb);
  perform public._award_progress(v_uid, 0, v_pts);

  return jsonb_build_object('points', v_pts, 'gift_at', now());
end;
$$;

revoke all on function public.claim_pet_gift() from public, anon;
grant execute on function public.claim_pet_gift() to authenticated;

-- ─── collect_pet_coin() — pays by bond level, and not while hungry ──────────
-- Same timing rules as 20260930130000 (one every 3 minutes, 50 in 24 hours).
-- New: a coin pays 1, 2 or 3 points by bond level (XP stays 1), the reply
-- says `xp` too, and an empty bowl pays nothing ('hungry').
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
  v_full   timestamptz;
  v_bond   int;
  v_level  int;
  v_value  int;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  perform pg_advisory_xact_lock(hashtext('pet_coin:' || v_uid::text));

  select full_until, bond into v_full, v_bond from public.pet_care where user_id = v_uid;
  if v_full is not null and v_full <= now() then
    return jsonb_build_object('points', 0, 'xp', 0, 'reason', 'hungry', 'remaining', null,
      'next_in', extract(epoch from v_gap)::int);
  end if;
  v_level := public._pet_level(coalesce(v_bond, 0));
  v_value := case when v_level >= 5 then 3 when v_level >= 3 then 2 else 1 end;

  select count(*), max(claimed_at), min(claimed_at)
    into v_count, v_last, v_oldest
    from public.reward_claims
   where user_id = v_uid and kind = 'pet_coin' and claimed_at > now() - interval '24 hours';

  if v_last is not null and now() < v_last + v_gap - v_slack then
    return jsonb_build_object(
      'points', 0, 'xp', 0,
      'remaining', greatest(0, v_daily - v_count),
      'next_in', ceil(extract(epoch from (v_last + v_gap - now())))::int);
  end if;

  if v_count >= v_daily then
    return jsonb_build_object(
      'points', 0, 'xp', 0,
      'remaining', 0,
      'next_in', greatest(1, ceil(extract(epoch from (v_oldest + interval '24 hours' - now())))::int));
  end if;

  insert into public.reward_claims (user_id, kind, xp, points) values (v_uid, 'pet_coin', 1, v_value);
  insert into public.activity_log (user_id, activity_type, subject, xp_earned, points_earned, metadata)
  values (v_uid, 'COIN_COLLECTED', 'general', 1, v_value, '{}'::jsonb);
  perform public._award_progress(v_uid, 1, v_value);

  return jsonb_build_object(
    'points', v_value, 'xp', 1,
    'remaining', v_daily - v_count - 1,
    'next_in', extract(epoch from v_gap)::int);
end;
$$;

revoke all on function public.collect_pet_coin() from public, anon;
grant execute on function public.collect_pet_coin() to authenticated;
