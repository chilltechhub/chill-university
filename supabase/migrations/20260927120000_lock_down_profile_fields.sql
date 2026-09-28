-- Lock down the profile fields a signed-in user could rewrite on their own row,
-- and the RPCs that trusted the caller too much. docs/fix-plan.md, Phase 1.
--
-- ── Why ──────────────────────────────────────────────────────────────────────
-- `profiles_update_own` (20260912120000) lets a user update ANY column of their
-- own row. Only plan* was protected (profiles_protect_plan, 20260921120000).
-- Verified live on 2026-09-27 with test accounts, every one of these stuck:
--   is_admin = true            → moderation queue + admin_set_post_state
--   parent_consent_given = true → a 2016-born account skipped the under-13 block
--   kws_pv_status = 'verified'  → same, via the KWS path
--   date_of_birth = 1990-01-01  → a 15-year-old escaped every minor restriction
--   xp / points / level / streak → leaderboard at will
--   parent_id = <anyone>        → family link with no invite code
-- and increment_user_progress() credited ANY p_user_id, negative amounts too.
--
-- ── How ──────────────────────────────────────────────────────────────────────
-- Same pattern as profiles_protect_plan: a BEFORE trigger that only acts when
-- current_user is anon/authenticated. SECURITY DEFINER functions run as their
-- owner and the Edge Functions use the service role, so the family RPCs, the
-- KWS webhook/verify functions and the scoring RPCs below keep working.
-- Client writes to protected columns are reverted, not rejected — an old app
-- build that still sends them keeps saving everything else in the same write.
--
-- Two things the client used to write directly now go through functions:
--   touch_streak()          (was gamificationService.touchStreak's update)
--   record_parent_consent() (was MultiStepOnboarding.submitConsent's upsert)
-- The matching client changes fall back to the old write when the function is
-- missing (PGRST202), so app and database can ship in either order.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here). One
-- transaction: all of it lands or none of it does.

begin;

-- ─── Age of digital consent, server side ───────────────────────────────────
-- A copy of src/logic/ageOfConsent.js's AODC_BY_COUNTRY. Keep the two in step.
create or replace function public.age_of_digital_consent(p_country text)
returns int
language sql
immutable
as $$
  select case upper(coalesce(p_country, ''))
    when 'AT' then 14 when 'BG' then 14 when 'CY' then 14 when 'CZ' then 15
    when 'DE' then 16 when 'ES' then 14 when 'FR' then 15 when 'GR' then 15
    when 'HU' then 16 when 'IE' then 16 when 'IT' then 14 when 'LI' then 16
    when 'LT' then 14 when 'LU' then 16 when 'NL' then 16 when 'PL' then 16
    when 'SI' then 15 when 'SK' then 16
    else 13
  end;
$$;

-- ─── The trigger ────────────────────────────────────────────────────────────
create or replace function public.profiles_protect_server_fields()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_admin             := false;
    new.kws_pv_status        := 'none';
    new.kws_transaction_id   := null;
    new.kws_verified_at      := null;
    new.parent_email         := null;
    new.parent_id            := null;
    new.parent_consent_given := false;
    new.parent_consent_at    := null;
    new.xp                   := 0;
    new.points               := 0;
    new.total_points         := 0;
    new.level                := 1;
    new.rank                 := 20;
    new.streak_count         := 0;
    new.streak_days          := 0;
    new.longest_streak       := 0;
    new.last_active_date     := null;
  else
    new.is_admin             := old.is_admin;
    new.kws_pv_status        := old.kws_pv_status;
    new.kws_transaction_id   := old.kws_transaction_id;
    new.kws_verified_at      := old.kws_verified_at;
    new.parent_email         := old.parent_email;
    new.parent_id            := old.parent_id;
    new.parent_consent_given := old.parent_consent_given;
    new.parent_consent_at    := old.parent_consent_at;
    new.xp                   := old.xp;
    new.points               := old.points;
    new.total_points         := old.total_points;
    new.level                := old.level;
    new.rank                 := old.rank;
    new.streak_count         := old.streak_count;
    new.streak_days          := old.streak_days;
    new.longest_streak       := old.longest_streak;
    new.last_active_date     := old.last_active_date;

    -- Birth date and country are set once. Settings' one-time Birth Date row
    -- and onboarding's age gate both write them while they are still null.
    if old.date_of_birth is not null then
      new.date_of_birth := old.date_of_birth;
      new.country_code  := old.country_code;
    end if;

    -- A minor still waiting on a parent can't mark onboarding finished. Only
    -- the transition is blocked, so accounts already past onboarding are not
    -- touched by this migration.
    if new.onboarding_completed is true
       and coalesce(old.onboarding_completed, false) = false
       and new.date_of_birth is not null
       and new.date_of_birth > (current_date - make_interval(years => public.age_of_digital_consent(new.country_code)))
       and coalesce(new.parent_consent_given, false) = false then
      new.onboarding_completed := false;
    end if;
  end if;

  -- is_minor is the digital-consent flag (under 13 in the US, 13–16 in parts
  -- of the EU), never a client opinion: derived from birth date + country.
  if new.date_of_birth is not null then
    new.is_minor := new.date_of_birth > (current_date - make_interval(years => public.age_of_digital_consent(new.country_code)));
  elsif tg_op = 'UPDATE' then
    new.is_minor := old.is_minor;
  else
    new.is_minor := null;
  end if;

  return new;
end;
$$;

comment on function public.profiles_protect_server_fields() is
  'Keeps admin, consent/KWS, family link, progress and streak columns server-written; birth date and country set-once; is_minor derived. Client writes are reverted, not rejected.';

drop trigger if exists profiles_protect_server_fields on public.profiles;
create trigger profiles_protect_server_fields
  before insert or update on public.profiles
  for each row execute function public.profiles_protect_server_fields();

-- ─── Parent consent, only after KWS says the parent is verified ────────────
create or replace function public.record_parent_consent()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  update public.profiles
     set parent_consent_given = true, parent_consent_at = now()
   where id = auth.uid() and kws_pv_status = 'verified';
  if not found then
    raise exception 'A parent or guardian has not been verified yet.';
  end if;
end;
$$;

revoke execute on function public.record_parent_consent() from public, anon;
grant execute on function public.record_parent_consent() to authenticated;

-- ─── Daily streak, server side ──────────────────────────────────────────────
-- Same rule as the old client touchStreak: a gap of exactly one calendar day
-- continues the run, anything longer restarts at 1. The client's own date is
-- accepted so "today" stays the person's local day, but only within a day of
-- the server's, so it can't be used to backfill a streak.
create or replace function public.touch_streak(p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today  date := coalesce(p_today, current_date);
  v_last   date;
  v_streak int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  if v_today not between current_date - 1 and current_date + 1 then
    v_today := current_date;
  end if;

  select p.last_active_date, coalesce(p.streak_count, 0)
    into v_last, v_streak
    from public.profiles p where p.id = auth.uid()
    for update;

  if v_last is not null and v_today <= v_last then
    return jsonb_build_object('streak_count', v_streak, 'last_active_date', v_last, 'changed', false);
  end if;

  v_streak := case when v_last = v_today - 1 then v_streak + 1 else 1 end;
  update public.profiles
     set streak_count = v_streak,
         last_active_date = v_today,
         longest_streak = greatest(coalesce(longest_streak, 0), v_streak)
   where id = auth.uid();

  return jsonb_build_object('streak_count', v_streak, 'last_active_date', v_today, 'changed', true);
end;
$$;

revoke execute on function public.touch_streak(date) from public, anon;
grant execute on function public.touch_streak(date) to authenticated;

-- ─── Scoring ────────────────────────────────────────────────────────────────
-- increment_user_progress was created in the dashboard and was never in a
-- migration. Its behaviour, measured on a test account on 2026-09-27: returns
-- void; adds p_xp to xp and p_points to points for ANY p_user_id, negative
-- amounts included; recomputes level from total xp with the same table as
-- gamificationService.getLevel (checked at 99/100/449/450/999/3849/3850/
-- 10449/10450/50000 XP → 1/2/3/4/5/11/12/19/20/20); leaves total_points and
-- last_active_date alone. rank follows points through trigger_update_rank.

create or replace function public.level_for_xp(p_xp int)
returns int
language sql
immutable
as $$
  select least(20, 1 + (
    select count(*)::int
    from unnest(array[100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
                      3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450]) as t(threshold)
    where coalesce(p_xp, 0) >= t.threshold
  ));
$$;

-- The one writer of xp / points / level. Server-only: the app reaches it
-- through increment_user_progress (small, own account) or
-- claim_mission_reward (the mission's own reward, once per period).
create or replace function public._award_progress(p_user_id uuid, p_xp int, p_points int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set xp     = greatest(0, coalesce(xp, 0) + coalesce(p_xp, 0)),
         points = greatest(0, coalesce(points, 0) + coalesce(p_points, 0)),
         level  = public.level_for_xp(greatest(0, coalesce(xp, 0) + coalesce(p_xp, 0)))
   where id = p_user_id;
end;
$$;

revoke execute on function public._award_progress(uuid, int, int) from public, anon, authenticated;

-- Drop every overload first: the live function's exact argument types are not
-- in the repo, and CREATE OR REPLACE with different types would add a second
-- overload that PostgREST then can't choose between.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.proname = 'increment_user_progress' and p.pronamespace = 'public'::regnamespace
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

-- Gameplay awards. The largest a single action pays today is ~120 XP / 60
-- points (a finished game at the top difficulty tier); the caps leave room
-- and refuse anything past them rather than quietly trimming, so a client bug
-- shows up instead of hiding.
create function public.increment_user_progress(p_user_id uuid, p_xp int, p_points int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  if p_user_id is distinct from auth.uid() then
    raise exception 'You can only add progress to your own account.';
  end if;
  if coalesce(p_xp, 0) < 0 or coalesce(p_points, 0) < 0 then
    raise exception 'Progress can''t be taken away.';
  end if;
  if coalesce(p_xp, 0) > 300 or coalesce(p_points, 0) > 150 then
    raise exception 'That is more than one action earns.';
  end if;
  perform public._award_progress(auth.uid(), coalesce(p_xp, 0), coalesce(p_points, 0));
end;
$$;

revoke execute on function public.increment_user_progress(uuid, int, int) from public, anon;
grant execute on function public.increment_user_progress(uuid, int, int) to authenticated;

-- Mission payouts are recorded here, not on user_missions: the app can edit
-- and delete its own user_missions rows, so a flag there could be cleared and
-- claimed again. No client policies — only claim_mission_reward writes it.
create table if not exists public.mission_claims (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  mission_id      uuid not null,
  user_mission_id uuid,
  xp              int not null,
  points          int not null,
  claimed_at      timestamptz not null default now()
);
create index if not exists mission_claims_user_mission_idx on public.mission_claims (user_id, mission_id, claimed_at desc);
alter table public.mission_claims enable row level security;
revoke all on public.mission_claims from anon, authenticated;

-- Pays a finished mission's own listed reward (up to 1,500 XP / 3,000 points
-- today — far past increment_user_progress's cap), once per mission per day
-- (daily), week (weekly) or ever (longterm).
create or replace function public.claim_mission_reward(p_user_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_um     public.user_missions%rowtype;
  v_type   text;
  v_xp     int;
  v_points int;
  v_since  timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_um from public.user_missions
   where id = p_user_mission_id and user_id = auth.uid()
   for update;
  if v_um.id is null then
    raise exception 'No such mission.';
  end if;
  if v_um.status <> 'completed' or coalesce(v_um.current_value, 0) < coalesce(v_um.target_value, 1) then
    raise exception 'That mission isn''t finished.';
  end if;

  select coalesce(m.type, v_um.type), coalesce(m.xp_reward, 0), coalesce(m.point_reward, 0)
    into v_type, v_xp, v_points
    from public.missions m where m.id = v_um.mission_id;
  if not found then
    raise exception 'No such mission.';
  end if;

  v_since := case v_type
    when 'daily'  then date_trunc('day', now())
    when 'weekly' then date_trunc('week', now())
    else '-infinity'::timestamptz
  end;
  if exists (
    select 1 from public.mission_claims mc
    where mc.user_id = auth.uid() and mc.mission_id = v_um.mission_id and mc.claimed_at >= v_since
  ) then
    raise exception 'That mission''s reward has already been paid.';
  end if;

  insert into public.mission_claims (user_id, mission_id, user_mission_id, xp, points)
  values (auth.uid(), v_um.mission_id, v_um.id, v_xp, v_points);
  update public.user_missions set claimed_at = now() where id = v_um.id;
  perform public._award_progress(auth.uid(), v_xp, v_points);

  return jsonb_build_object('xp', v_xp, 'points', v_points);
end;
$$;

revoke execute on function public.claim_mission_reward(uuid) from public, anon;
grant execute on function public.claim_mission_reward(uuid) to authenticated;

-- ─── Family codes ───────────────────────────────────────────────────────────
-- (random() * 32)::int rounds, so index 33 (past the end of the 32-letter
-- alphabet) came up 1 time in 64 per letter: ~9% of codes were 5 letters, and
-- A and 9 came up half as often. floor() fixes both. A new code now voids the
-- child's older ones, so only the code on screen works.
create or replace function public.generate_family_code()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_expires timestamptz := now() + interval '15 minutes';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.family_invite_codes fic
     set used = true
   where fic.child_id = auth.uid() and fic.used = false;

  loop
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1), '')
      from generate_series(1, 6)
    );
    begin
      insert into public.family_invite_codes (child_id, code, expires_at)
      values (auth.uid(), v_code, v_expires);
      exit;
    exception when unique_violation then
      -- try again with a new code
    end;
  end loop;

  return query select v_code, v_expires;
end;
$$;

-- Redeeming no longer silently replaces a parent who is already linked.
create or replace function public.redeem_family_code(p_code text)
returns table (child_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id  uuid;
  v_parent_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select fic.child_id into v_child_id
  from public.family_invite_codes fic
  where fic.code = upper(trim(p_code))
    and fic.used = false
    and fic.expires_at > now()
  limit 1
  for update;

  if v_child_id is null then
    raise exception 'That code is invalid or has expired.';
  end if;

  if v_child_id = auth.uid() then
    raise exception 'You can''t link to your own account.';
  end if;

  select p.parent_id into v_parent_id from public.profiles p where p.id = v_child_id;
  if v_parent_id is not null and v_parent_id <> auth.uid() then
    raise exception 'That account is already linked to a parent. They need to unlink first.';
  end if;

  update public.family_invite_codes set used = true
   where family_invite_codes.child_id = v_child_id and family_invite_codes.code = upper(trim(p_code));
  update public.profiles set parent_id = auth.uid() where id = v_child_id;

  return query
    select p.id, coalesce(p.display_name, p.traveler_name, 'Traveler')
    from public.profiles p
    where p.id = v_child_id;
end;
$$;

-- ─── Organizations ──────────────────────────────────────────────────────────
-- Creating an organization is a Plus feature (featureCatalog 'organization');
-- until now only the app enforced that.
create or replace function public.create_organization(p_name text, p_type text)
returns table (id uuid, name text, type text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_plan_active(auth.uid()) then
    raise exception 'Creating an organization needs Plus.';
  end if;
  if p_type not in ('school', 'business', 'other') then
    raise exception 'Invalid organization type.';
  end if;
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Give it a name.';
  end if;

  insert into public.organizations (name, type, created_by)
  values (trim(p_name), p_type, auth.uid())
  returning organizations.id into v_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return query select o.id, o.name, o.type from public.organizations o where o.id = v_id;
end;
$$;

-- Only an owner/admin starts a cohort now. Any member used to be able to, and a
-- cohort's creator becomes its manager and can mint invite codes into the org —
-- so a student in a school's org could invite strangers into it.
create or replace function public.create_cohort(p_organization_id uuid, p_name text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Only an organization owner or admin can start a cohort.';
  end if;
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Give it a name.';
  end if;

  insert into public.cohorts (organization_id, name, created_by)
  values (p_organization_id, trim(p_name), auth.uid())
  returning cohorts.id into v_id;

  insert into public.cohort_managers (cohort_id, user_id) values (v_id, auth.uid());

  return query select c.id, c.name from public.cohorts c where c.id = v_id;
end;
$$;

-- Invite codes: capped at 200 uses and 30 days (a 1,000,000-use, 100-year
-- code was accepted before), and the same floor() fix as the family codes.
create or replace function public.generate_org_invite_code(
  p_organization_id uuid,
  p_cohort_id       uuid default null,
  p_role            text default 'member',
  p_max_uses        int  default 30,
  p_expires_days    int  default 7
)
returns table (code text, expires_at timestamptz, max_uses int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_role   text;
  v_is_admin   boolean;
  v_is_manager boolean;
  v_code       text;
  v_expires    timestamptz := now() + make_interval(days => least(greatest(coalesce(p_expires_days, 7), 1), 30));
  v_max_uses   int := least(greatest(coalesce(p_max_uses, 30), 1), 200);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_role not in ('admin', 'member') then
    raise exception 'Invalid role for an invite code.';
  end if;

  select om.role into v_org_role
  from public.organization_members om
  where om.organization_id = p_organization_id and om.user_id = auth.uid();

  v_is_admin := v_org_role in ('owner', 'admin');

  if p_cohort_id is not null then
    if not exists (
      select 1 from public.cohorts c
      where c.id = p_cohort_id and c.organization_id = p_organization_id
    ) then
      raise exception 'That cohort does not belong to this organization.';
    end if;

    v_is_manager := exists (
      select 1 from public.cohort_managers cm
      where cm.cohort_id = p_cohort_id and cm.user_id = auth.uid()
    );

    if not v_is_admin and not v_is_manager then
      raise exception 'You need to manage this cohort to invite people to it.';
    end if;
  else
    if not v_is_admin then
      raise exception 'Only an organization admin can create an organization-wide invite code.';
    end if;
  end if;

  if p_role = 'admin' and not v_is_admin then
    raise exception 'Only an organization admin can create an admin invite code.';
  end if;

  loop
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1), '')
      from generate_series(1, 6)
    );
    begin
      insert into public.organization_invite_codes
        (organization_id, cohort_id, role, code, expires_at, max_uses, created_by)
      values
        (p_organization_id, p_cohort_id, p_role, v_code, v_expires, v_max_uses, auth.uid());
      exit;
    exception when unique_violation then
      -- try again with a new code
    end;
  end loop;

  return query select v_code, v_expires, v_max_uses;
end;
$$;

-- Redeeming locks the code row, so two people redeeming the last use at the
-- same moment can't both get in. Otherwise identical to the
-- 20260903_fix_redeem_invite_ambiguous_column.sql version.
create or replace function public.redeem_org_invite_code(p_code text)
returns table (
  organization_id   uuid,
  organization_name text,
  organization_type text,
  cohort_id         uuid,
  cohort_name       text,
  role              text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row        public.organization_invite_codes%rowtype;
  v_has_org    boolean;
  v_has_cohort boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.organization_invite_codes oic
  where oic.code = upper(trim(p_code))
    and oic.expires_at > now()
    and oic.use_count < oic.max_uses
  limit 1
  for update;

  if v_row.id is null then
    raise exception 'That code is invalid, expired, or has reached its limit.';
  end if;

  v_has_org := exists (
    select 1 from public.organization_members om
    where om.organization_id = v_row.organization_id and om.user_id = auth.uid()
  );

  if v_row.cohort_id is null then
    if v_has_org then
      raise exception 'You already belong to this organization.';
    end if;
  else
    v_has_cohort := exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = v_row.cohort_id and cm.user_id = auth.uid()
    );
    if v_has_cohort then
      raise exception 'You already belong to this cohort.';
    end if;
  end if;

  if not v_has_org then
    insert into public.organization_members (organization_id, user_id, role)
    values (v_row.organization_id, auth.uid(), v_row.role)
    on conflict do nothing;
  end if;

  if v_row.cohort_id is not null then
    insert into public.cohort_members (cohort_id, user_id)
    values (v_row.cohort_id, auth.uid())
    on conflict do nothing;

    insert into public.cohort_assignment_progress (assignment_id, user_id)
    select ca.id, auth.uid()
    from public.cohort_assignments ca
    where ca.cohort_id = v_row.cohort_id
    on conflict do nothing;
  end if;

  update public.organization_invite_codes
  set use_count = use_count + 1
  where organization_invite_codes.id = v_row.id;

  return query
    select o.id, o.name, o.type, c.id, c.name, v_row.role
    from public.organizations o
    left join public.cohorts c on c.id = v_row.cohort_id
    where o.id = v_row.organization_id;
end;
$$;

-- Removing someone from the whole organization, not just a cohort. Before this,
-- "Remove" left them an org member (still able to see org cohorts they managed
-- and, until create_cohort changed above, start new ones), and an owner could
-- never leave or delete an org anyone else had joined.
create or replace function public.remove_org_member(p_organization_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_role    text;
  v_their_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select om.role into v_my_role from public.organization_members om
   where om.organization_id = p_organization_id and om.user_id = auth.uid();
  select om.role into v_their_role from public.organization_members om
   where om.organization_id = p_organization_id and om.user_id = p_user_id;

  if v_my_role not in ('owner', 'admin') then
    raise exception 'Only an organization owner or admin can remove people.';
  end if;
  if v_their_role is null then
    raise exception 'They are not in this organization.';
  end if;
  if v_their_role = 'owner' then
    raise exception 'The owner can''t be removed.';
  end if;
  if v_their_role = 'admin' and v_my_role <> 'owner' then
    raise exception 'Only the owner can remove an admin.';
  end if;

  delete from public.cohort_assignment_progress cap
  using public.cohort_assignments ca, public.cohorts c
  where cap.assignment_id = ca.id and ca.cohort_id = c.id
    and c.organization_id = p_organization_id and cap.user_id = p_user_id;

  delete from public.cohort_members cm
  using public.cohorts c
  where cm.cohort_id = c.id and c.organization_id = p_organization_id and cm.user_id = p_user_id;

  delete from public.cohort_managers gm
  using public.cohorts c
  where gm.cohort_id = c.id and c.organization_id = p_organization_id and gm.user_id = p_user_id;

  delete from public.organization_members om
  where om.organization_id = p_organization_id and om.user_id = p_user_id;
end;
$$;

revoke execute on function public.remove_org_member(uuid, uuid) from public, anon;
grant execute on function public.remove_org_member(uuid, uuid) to authenticated;

-- The owner can delete their organization (cohorts, codes and memberships go
-- with it through the existing on-delete-cascade foreign keys).
create or replace function public.delete_organization(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id and om.user_id = auth.uid() and om.role = 'owner'
  ) then
    raise exception 'Only the owner can delete an organization.';
  end if;
  delete from public.organizations where id = p_organization_id;
end;
$$;

revoke execute on function public.delete_organization(uuid) from public, anon;
grant execute on function public.delete_organization(uuid) to authenticated;

-- ─── Community links ────────────────────────────────────────────────────────
-- Only http(s) links. The feed hands post.link to Linking.openURL, and nothing
-- stopped a javascript: or app-scheme link. Otherwise identical to the
-- 20260906140000 version.
create or replace function public.publish_community_post(
  p_kind text, p_title text, p_body text default null,
  p_link text default null, p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_verdict text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if public.is_restricted_account(auth.uid()) then
    raise exception 'MINORS_CANNOT_PUBLISH';
  end if;
  if nullif(trim(coalesce(p_link, '')), '') is not null and trim(p_link) !~* '^https?://' then
    raise exception 'LINK_NOT_ALLOWED';
  end if;

  v_verdict := public.moderation_verdict(
    coalesce(p_title, '') || ' ' || coalesce(p_body, '') || ' ' || coalesce(p_link, '')
  );
  if v_verdict = 'block' then
    raise exception 'CONTENT_BLOCKED';
  end if;

  insert into public.community_posts (user_id, kind, title, body, link, tags, state)
  values (auth.uid(), p_kind, trim(p_title), nullif(trim(coalesce(p_body,'')), ''),
          nullif(trim(coalesce(p_link,'')), ''), coalesce(p_tags, '{}'),
          case when v_verdict = 'review' then 'hidden' else 'visible' end)
  returning id into v_id;
  return v_id;
end;
$$;

-- ─── Under-13 accounts that never closed ────────────────────────────────────
-- With kids' accounts off, an under-13 is asked to close their account; one who
-- just leaves the app keeps an email and birth date on file indefinitely.
-- This lists (p_dry_run => true, the default) or deletes accounts that are
-- under the consent age, have no parent consent, and are older than p_days.
-- It is NOT scheduled here: run the dry run first, then schedule it yourself
-- (see the end of this file). Deleting auth.users cascades to profiles and
-- everything keyed to it, the same path delete_my_account() uses.
create or replace function public.close_unconsented_minor_accounts(p_days int default 7, p_dry_run boolean default true)
returns table (user_id uuid, created_at timestamptz, date_of_birth date, country_code text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select p.id, u.created_at, p.date_of_birth, p.country_code
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.date_of_birth is not null
      and p.date_of_birth > (current_date - make_interval(years => public.age_of_digital_consent(p.country_code)))
      and coalesce(p.parent_consent_given, false) = false
      and u.created_at < now() - make_interval(days => greatest(p_days, 1));

  if not p_dry_run then
    delete from auth.users u
    using public.profiles p
    where p.id = u.id
      and p.date_of_birth is not null
      and p.date_of_birth > (current_date - make_interval(years => public.age_of_digital_consent(p.country_code)))
      and coalesce(p.parent_consent_given, false) = false
      and u.created_at < now() - make_interval(days => greatest(p_days, 1));
  end if;
end;
$$;

-- Server-only: never callable from the app.
revoke execute on function public.close_unconsented_minor_accounts(int, boolean) from public, anon, authenticated;

commit;

-- ─── After applying ─────────────────────────────────────────────────────────
-- 1. Dry run — who would be closed? (Review before scheduling anything.)
--      select * from public.close_unconsented_minor_accounts(7, true);
-- 2. If that list is right and pg_cron is enabled, schedule it daily:
--      select cron.schedule('close-unconsented-minors', '17 3 * * *',
--        $$ select public.close_unconsented_minor_accounts(7, false) $$);
