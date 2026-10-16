-- Pet bowl lasts one day. Decided 2026-10-15.
-- Needs 20261015120000_pet_food.sql and 20261015130000_pet_bond.sql first.
--
-- ── Why ──────────────────────────────────────────────────────────────────────
-- A full bowl lasted 32 hours (4 hearts × 8 h), so someone could skip a day
-- and the pet was still fine. Now it's 4 hearts × 6 h = 24 hours: feed it once
-- a day and it never goes hungry. That's the daily habit the pet is for.
--
-- ── What changes ─────────────────────────────────────────────────────────────
-- * A heart lasts 6 hours (was 8). A snack adds 6 h, a meal fills to 24 h.
-- * "Already full" is more than 18 hours left (3 hearts' worth).
-- * A new pet starts with 24 hours, not 32.
-- * Bowls filled under the old rules are cut back to 24 hours from now, so
--   no one keeps a 32-hour bowl.
-- Prices, bond, coins and gifts are unchanged. pet_status and feed_pet below
-- are the 20261015130000 versions with only the hours changed.
--
-- Numbers match src/logic/petHunger.js — scripts/check-pet-hunger.mjs checks.
-- Safe to run more than once.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here).

-- Hearts left in a bowl that empties at p_full (4 max, one per 6 hours).
create or replace function public._pet_hearts(p_full timestamptz)
returns int
language sql
stable
as $$
  select case
    when p_full is null then 4
    else least(4, greatest(0, ceil(extract(epoch from (p_full - now())) / 21600.0)))::int
  end;
$$;

revoke all on function public._pet_hearts(timestamptz) from public, anon, authenticated;

-- ─── pet_status() — a new pet starts with a full day ────────────────────────
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
    values (v_uid, now() + interval '24 hours')
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

-- ─── feed_pet() — 6-hour hearts, 24-hour bowl ───────────────────────────────
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

  if p_food = 'snack' then v_cost := 5;  v_hours := 6;
  elsif p_food = 'meal' then v_cost := 15; v_hours := 24;
  else raise exception 'Unknown food: %', p_food;
  end if;

  perform pg_advisory_xact_lock(hashtext('feed_pet:' || v_uid::text));

  select full_until, bond into v_full, v_bond from public.pet_care where user_id = v_uid;
  v_full := coalesce(v_full, now());
  v_bond := coalesce(v_bond, 0);

  select coalesce(points, 0) into v_earned from public.profiles where id = v_uid;
  select coalesce(sum(points), 0) into v_spent from public.point_spends where user_id = v_uid;

  -- Already full: more than 18 hours left means all four hearts are there.
  if v_full > now() + interval '18 hours' then
    return jsonb_build_object('ok', false, 'reason', 'full', 'full_until', v_full,
      'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent), 'bond', v_bond);
  end if;

  if v_earned - v_spent < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'points', 'full_until', v_full,
      'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent), 'bond', v_bond);
  end if;

  v_next   := least(now() + interval '24 hours', greatest(now(), v_full) + make_interval(hours => v_hours));
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

-- ─── Bowls filled under the 32-hour rule: no more than a day left ───────────
update public.pet_care
   set full_until = now() + interval '24 hours', updated_at = now()
 where full_until > now() + interval '24 hours';
