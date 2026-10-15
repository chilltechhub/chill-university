-- Pet hunger + pet food: the first thing points buy. Decided 2026-10-15.
--
-- ── Why ──────────────────────────────────────────────────────────────────────
-- Points were only ever a score: earned, shown, never spent. The pet now gets
-- hungry over time (4 hearts, one empties every 8 hours) and food costs points,
-- so there's a reason to come back each day and a use for the points.
--
-- ── Rules ────────────────────────────────────────────────────────────────────
-- * profiles.points stays the lifetime total. Rank and point unlocks read it,
--   so spending must never lower it. Spends go in point_spends instead, and
--   what's spendable is profiles.points minus their sum.
-- * pet_care.full_until is the moment the last heart runs out. A snack adds
--   one heart (8 h), a meal fills all four (32 h), never past full.
-- * Hungry (0 hearts) is the worst it gets: no sickness, no running away.
--   The app stops putting coins down until it's fed.
-- * The clock starts full the first time the app asks with a pet on screen
--   (p_has_pet), so someone who earns their pet days after signing up
--   doesn't meet a starving one.
--
-- Costs and hours match src/logic/petHunger.js — keep the two in step.
--
-- The app works without this file (it keeps hunger and spends on the device
-- and calls nothing here), so app and SQL can ship in either order.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here).

create table if not exists public.pet_care (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_until timestamptz not null,
  fed_count  int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.pet_care enable row level security;
revoke all on public.pet_care from anon, authenticated;

create table if not exists public.point_spends (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  item       text not null,
  points     int not null check (points > 0),
  created_at timestamptz not null default now()
);

create index if not exists point_spends_user_idx on public.point_spends (user_id);

alter table public.point_spends enable row level security;
revoke all on public.point_spends from anon, authenticated;

-- ─── pet_status() — read the bowl and the wallet ─────────────────────────────
create or replace function public.pet_status(p_has_pet boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_full   timestamptz;
  v_earned int;
  v_spent  int;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  select full_until into v_full from public.pet_care where user_id = v_uid;
  if v_full is null and p_has_pet then
    insert into public.pet_care (user_id, full_until)
    values (v_uid, now() + interval '32 hours')
    on conflict (user_id) do nothing;
    select full_until into v_full from public.pet_care where user_id = v_uid;
  end if;

  select coalesce(points, 0) into v_earned from public.profiles where id = v_uid;
  select coalesce(sum(points), 0) into v_spent from public.point_spends where user_id = v_uid;

  return jsonb_build_object(
    'full_until', v_full,
    'spent', v_spent,
    'wallet', greatest(0, coalesce(v_earned, 0) - v_spent));
end;
$$;

revoke all on function public.pet_status(boolean) from public, anon;
grant execute on function public.pet_status(boolean) to authenticated;

-- ─── feed_pet() — buy one food and feed it ───────────────────────────────────
-- Replies { ok, full_until, spent, wallet } or { ok: false, reason } where
-- reason is 'full' or 'points'. Raises only for a food it doesn't know.
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
  v_earned int;
  v_spent  int;
  v_next   timestamptz;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  if p_food = 'snack' then v_cost := 5;  v_hours := 8;
  elsif p_food = 'meal' then v_cost := 15; v_hours := 32;
  else raise exception 'Unknown food: %', p_food;
  end if;

  -- One feed at a time per person: two quick taps can't spend twice.
  perform pg_advisory_xact_lock(hashtext('feed_pet:' || v_uid::text));

  select full_until into v_full from public.pet_care where user_id = v_uid;
  v_full := coalesce(v_full, now());

  select coalesce(points, 0) into v_earned from public.profiles where id = v_uid;
  select coalesce(sum(points), 0) into v_spent from public.point_spends where user_id = v_uid;

  -- Already full: more than 24 hours left means all four hearts are there.
  if v_full > now() + interval '24 hours' then
    return jsonb_build_object('ok', false, 'reason', 'full',
      'full_until', v_full, 'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent));
  end if;

  if v_earned - v_spent < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'points',
      'full_until', v_full, 'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent));
  end if;

  v_next := least(now() + interval '32 hours', greatest(now(), v_full) + make_interval(hours => v_hours));

  insert into public.point_spends (user_id, item, points) values (v_uid, 'pet_' || p_food, v_cost);
  insert into public.pet_care (user_id, full_until, fed_count, updated_at)
  values (v_uid, v_next, 1, now())
  on conflict (user_id) do update
    set full_until = excluded.full_until,
        fed_count  = public.pet_care.fed_count + 1,
        updated_at = now();

  v_spent := v_spent + v_cost;
  return jsonb_build_object('ok', true,
    'full_until', v_next, 'spent', v_spent, 'wallet', greatest(0, v_earned - v_spent));
end;
$$;

revoke all on function public.feed_pet(text) from public, anon;
grant execute on function public.feed_pet(text) to authenticated;
