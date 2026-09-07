-- Institutional layer — organizations, cohorts, and simple assignment
-- tracking, so one person (a teacher or a manager) can be responsible for
-- many member accounts (students or employees) instead of the app only
-- working one individual at a time.
--
-- One adaptive data model throughout — "organization", "cohort", "manager",
-- "member" — not separate school/business schemas. The app relabels these
-- per organizations.type in src/data/orgLabels.js (school -> Class/Teacher/
-- Student, business -> Team/Manager/Employee, other -> Group/Lead/Member);
-- nothing in this migration needs to know about that.
--
-- Follows the same shape as 20260828_family_linking.sql and
-- 20260826_leaderboard.sql: every new table is RLS-enabled with ZERO
-- policies (fully locked from direct client access) and all reads/writes
-- go through the SECURITY DEFINER functions below, each returning an
-- explicit column allowlist rather than a full row.
--
-- One real difference from family linking's invite codes: a family code is
-- single-use (one parent, one child). A class or team needs the SAME code
-- reusable by many people, so organization_invite_codes carries
-- max_uses/use_count instead of a used boolean, and defaults to a 7-day
-- expiry instead of 15 minutes.
--
-- V1 scope is foundation only: create/join an organization, cohort rosters
-- with progress visibility, a cohort-scoped leaderboard (the existing
-- get_leaderboard() is global — wrong for a class or team, who shouldn't
-- rank against strangers), and freeform assignment tracking (a manager
-- writes a title/description/due-date, members mark it not_started /
-- in_progress / completed). Assigning *real* existing content — a Planner
-- habit, a Workshop project template, a Career Explorer path — is an
-- intentional fast-follow, not built here.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`.
-- Nothing in the app applies it automatically.

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('school', 'business', 'other')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- profiles.role is NOT reused for this — it's a loosely-typed, mostly-unset
-- leftover from a removed prototype, and one person can hold a different
-- role in different organizations (a manager in one, a plain member in
-- another), so this needs a real per-membership row.
create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.cohorts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists public.cohort_members (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (cohort_id, user_id)
);

-- Lets a plain org member run their own class/team without needing
-- org-wide admin rights — an org owner/admin implicitly manages every
-- cohort in their org (checked in the functions below), so this table is
-- the only mechanism for "this specific member manages this specific
-- cohort". Zero-payload join table, composite key, no surrogate id.
create table if not exists public.cohort_managers (
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

create table if not exists public.organization_invite_codes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- null = "join the organization, no specific cohort"; set = "join
  -- straight into this cohort". Consistency (cohort really belongs to
  -- organization_id) is checked in generate_org_invite_code(), not here —
  -- not cheaply expressible as a table constraint across two tables.
  cohort_id       uuid references public.cohorts(id) on delete cascade,
  role            text not null default 'member' check (role in ('admin', 'member')),
  code            text not null unique,
  expires_at      timestamptz not null,
  max_uses        int not null default 30 check (max_uses > 0),
  use_count       int not null default 0 check (use_count >= 0),
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists public.cohort_assignments (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references public.cohorts(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  title       text not null,
  description text,
  due_date    date,
  created_at  timestamptz not null default now()
);

-- One row per (assignment, member), PRE-CREATED the moment an assignment
-- is made (in assign_content_to_cohort) and backfilled for anyone who
-- joins the cohort afterward (in redeem_org_invite_code). This is a
-- deliberate trade: a small, bounded number of extra rows (cohorts are
-- dozens of people, not thousands) buys a hard invariant — every
-- (assignment, member) pair always has a row — which is what lets
-- update_assignment_status() be a plain UPDATE ... WHERE user_id =
-- auth.uid() with no upsert branching, and lets roster/completion-count
-- queries skip "no row = not started" special-casing everywhere.
create table if not exists public.cohort_assignment_progress (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.cohort_assignments(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (assignment_id, user_id)
);

-- Reuses the trigger function already defined in
-- 20260828_remote_content_config.sql — this is the one new table here
-- where a column (status) is genuinely mutated after insert, so it's the
-- one that needs it.
drop trigger if exists cohort_assignment_progress_touch_updated_at on public.cohort_assignment_progress;
create trigger cohort_assignment_progress_touch_updated_at
  before update on public.cohort_assignment_progress
  for each row execute function public.touch_updated_at();

create index if not exists idx_organization_members_org  on public.organization_members (organization_id);
create index if not exists idx_organization_members_user on public.organization_members (user_id);
create index if not exists idx_cohorts_org                on public.cohorts (organization_id);
create index if not exists idx_cohort_members_cohort       on public.cohort_members (cohort_id);
create index if not exists idx_cohort_members_user         on public.cohort_members (user_id);
create index if not exists idx_cohort_managers_user         on public.cohort_managers (user_id);
create index if not exists idx_org_invite_codes_org          on public.organization_invite_codes (organization_id);
create index if not exists idx_cohort_assignments_cohort     on public.cohort_assignments (cohort_id);
create index if not exists idx_cohort_assignment_progress_assignment on public.cohort_assignment_progress (assignment_id);
create index if not exists idx_cohort_assignment_progress_user       on public.cohort_assignment_progress (user_id);

-- RLS enabled with zero policies on every table above — fully locked from
-- direct client access. All access goes through the functions below.
alter table public.organizations               enable row level security;
alter table public.organization_members         enable row level security;
alter table public.cohorts                      enable row level security;
alter table public.cohort_members               enable row level security;
alter table public.cohort_managers              enable row level security;
alter table public.organization_invite_codes    enable row level security;
alter table public.cohort_assignments           enable row level security;
alter table public.cohort_assignment_progress   enable row level security;

-- ─── Functions ──────────────────────────────────────────────────────────────

-- Creates a new organization and makes the caller its owner.
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

comment on function public.create_organization(text, text) is
  'Creates an organization and makes the calling user its owner. SECURITY DEFINER.';

grant execute on function public.create_organization(text, text) to authenticated;

-- Mints an invite code. Org owner/admin can mint an org-wide or any-cohort
-- code; a plain member who manages a specific cohort (cohort_managers) can
-- mint a code straight into that cohort without org-admin rights. Only an
-- org owner/admin can mint a code that grants the 'admin' role.
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
  v_expires    timestamptz := now() + make_interval(days => greatest(p_expires_days, 1));
  v_max_uses   int := greatest(p_max_uses, 1);
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
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 32)::int + 1, 1), '')
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

comment on function public.generate_org_invite_code(uuid, uuid, text, int, int) is
  'Mints a reusable invite code for an organization or a specific cohort within it. SECURITY DEFINER.';

grant execute on function public.generate_org_invite_code(uuid, uuid, text, int, int) to authenticated;

-- Redeems an invite code: joins the caller to the organization (if not
-- already a member) and, if the code targets a cohort, to that cohort too
-- — backfilling cohort_assignment_progress rows for any assignments that
-- already existed there, so the pre-created-rows invariant holds for late
-- joiners as well.
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
  v_row       public.organization_invite_codes%rowtype;
  v_has_org   boolean;
  v_has_cohort boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.organization_invite_codes oic
  where oic.code = upper(p_code)
    and oic.expires_at > now()
    and oic.use_count < oic.max_uses
  limit 1;

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
    -- Bare `on conflict (organization_id, user_id)` here is ambiguous in
    -- PL/pgSQL: this function's RETURNS TABLE declares an output column
    -- named organization_id (and, below, cohort_id) — colliding with the
    -- same names used as an unqualified conflict-target column list, which
    -- can't be table-qualified the way a normal column reference can. The
    -- unqualified `on conflict do nothing` sidesteps it entirely: each
    -- table has exactly one relevant unique constraint besides its primary
    -- key, so behavior is identical.
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

comment on function public.redeem_org_invite_code(text) is
  'Redeems an organization/cohort invite code for the calling user. SECURITY DEFINER.';

grant execute on function public.redeem_org_invite_code(text) to authenticated;

-- Any org member can start a cohort (that's what makes cohort_managers
-- meaningful — if this required admin rights, that table would be
-- redundant with org-level admin). The creator becomes its manager.
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
  ) then
    raise exception 'Join the organization first.';
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

comment on function public.create_cohort(uuid, text) is
  'Creates a cohort within an organization the caller belongs to, and makes the caller its manager. SECURITY DEFINER.';

grant execute on function public.create_cohort(uuid, text) to authenticated;

-- One row per (organization, visible cohort) for the calling user. Org
-- owner/admin see every cohort in their org; a plain member sees only
-- cohorts they belong to or manage. An org with no visible cohorts still
-- returns one row (cohort fields null) so a freshly-created org shows up.
create or replace function public.get_my_organizations()
returns table (
  organization_id   uuid,
  organization_name text,
  organization_type text,
  org_role          text,
  cohort_id         uuid,
  cohort_name       text,
  is_cohort_manager boolean,
  member_count      bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.id,
    o.name,
    o.type,
    om.role,
    co.id,
    co.name,
    (
      om.role in ('owner', 'admin')
      or exists (select 1 from public.cohort_managers cm where cm.cohort_id = co.id and cm.user_id = auth.uid())
    ) as is_cohort_manager,
    (select count(*) from public.cohort_members cme where cme.cohort_id = co.id) as member_count
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  left join public.cohorts co on co.organization_id = o.id
    and (
      om.role in ('owner', 'admin')
      or exists (select 1 from public.cohort_members x where x.cohort_id = co.id and x.user_id = auth.uid())
      or exists (select 1 from public.cohort_managers y where y.cohort_id = co.id and y.user_id = auth.uid())
    )
  where om.user_id = auth.uid()
  order by o.created_at, co.created_at;
$$;

comment on function public.get_my_organizations() is
  'Every organization the calling user belongs to, with the cohorts they can see in each. SECURITY DEFINER.';

grant execute on function public.get_my_organizations() to authenticated;

-- Visible to the whole cohort, not just its manager — a roster with
-- per-person completion counts is no more sensitive than the cohort
-- leaderboard, which every member of it can already see. Manager-only
-- ACTIONS (assigning work, generating codes, removing members) are gated
-- separately in their own functions below.
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
    -- Bare `display_name` here is ambiguous in PL/pgSQL: RETURNS TABLE's
    -- output columns are exposed as variables inside the function body, and
    -- one of them is also named display_name — colliding with the table
    -- column of the same name. Fully qualifying (or, as here, repeating the
    -- qualified expression) resolves it.
    order by coalesce(p.display_name, p.traveler_name, p.username, 'Traveler');
end;
$$;

comment on function public.get_cohort_roster(uuid) is
  'Member roster for a cohort with per-person assignment completion counts. Visible to anyone in the cohort. SECURITY DEFINER.';

grant execute on function public.get_cohort_roster(uuid) to authenticated;

-- Manager-only: creates an assignment and pre-creates a not_started
-- progress row for every current cohort member (see the table comment
-- above for why).
create or replace function public.assign_content_to_cohort(
  p_cohort_id   uuid,
  p_title       text,
  p_description text default null,
  p_due_date    date default null
)
returns table (id uuid, title text, description text, due_date date, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_id     uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Give the assignment a title.';
  end if;
  if length(p_title) > 200 then
    raise exception 'Title is too long.';
  end if;
  if p_description is not null and length(p_description) > 2000 then
    raise exception 'Description is too long.';
  end if;

  select c.organization_id into v_org_id from public.cohorts c where c.id = p_cohort_id;
  if v_org_id is null then
    raise exception 'Cohort not found.';
  end if;

  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = v_org_id and om.user_id = auth.uid() and om.role in ('owner', 'admin')
  ) and not exists (
    select 1 from public.cohort_managers cm where cm.cohort_id = p_cohort_id and cm.user_id = auth.uid()
  ) then
    raise exception 'You need to manage this cohort to assign work to it.';
  end if;

  insert into public.cohort_assignments (cohort_id, assigned_by, title, description, due_date)
  values (p_cohort_id, auth.uid(), trim(p_title), nullif(trim(coalesce(p_description, '')), ''), p_due_date)
  returning cohort_assignments.id into v_id;

  insert into public.cohort_assignment_progress (assignment_id, user_id)
  select v_id, cme.user_id from public.cohort_members cme where cme.cohort_id = p_cohort_id
  on conflict do nothing;

  return query select ca.id, ca.title, ca.description, ca.due_date, ca.created_at
    from public.cohort_assignments ca where ca.id = v_id;
end;
$$;

comment on function public.assign_content_to_cohort(uuid, text, text, date) is
  'Manager-only: creates a freeform assignment for a cohort and pre-creates a not_started progress row for every current member. SECURITY DEFINER.';

grant execute on function public.assign_content_to_cohort(uuid, text, text, date) to authenticated;

-- Updates only the caller's own progress row. Zero rows updated IS the
-- authorization failure — "not assigned to this" — no separate check
-- needed, which is the direct payoff of pre-creating rows above.
create or replace function public.update_assignment_status(p_assignment_id uuid, p_status text)
returns table (assignment_id uuid, status text, completed_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_status not in ('not_started', 'in_progress', 'completed') then
    raise exception 'Invalid status.';
  end if;

  update public.cohort_assignment_progress cap
  set status = p_status,
      completed_at = case when p_status = 'completed' then now() else null end
  where cap.assignment_id = p_assignment_id and cap.user_id = auth.uid();

  if not found then
    raise exception 'You are not assigned to this.';
  end if;

  return query
    select cap.assignment_id, cap.status, cap.completed_at
    from public.cohort_assignment_progress cap
    where cap.assignment_id = p_assignment_id and cap.user_id = auth.uid();
end;
$$;

comment on function public.update_assignment_status(uuid, text) is
  'Updates the calling user''s own status on one assignment. SECURITY DEFINER.';

grant execute on function public.update_assignment_status(uuid, text) to authenticated;

-- A separate function from get_leaderboard() rather than a bolted-on
-- parameter — the authorization requirements genuinely differ (proving
-- cohort membership vs. none at all today), and this leaves the existing,
-- already-live get_leaderboard() completely untouched. No points > 0
-- filter here (unlike get_leaderboard) — a small class/team should show
-- everyone from day one, not just whoever's scored yet.
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
    -- Same ambiguity as get_cohort_roster's original bug (see its comment
    -- above) — bare names here would collide with this function's own
    -- RETURNS TABLE output columns, which share every one of these names.
    -- Qualifying with the CTE's name resolves it.
    select ranked.id, ranked.display_name, ranked.points, ranked.xp, ranked.level, ranked.rank_position
    from ranked
    order by ranked.rank_position
    limit greatest(p_limit, 0);
end;
$$;

comment on function public.get_cohort_leaderboard(uuid, int) is
  'Points leaderboard scoped to one cohort, visible only to its members/managers/org admins. SECURITY DEFINER.';

grant execute on function public.get_cohort_leaderboard(uuid, int) to authenticated;

-- Feeds Home's "On the Desk" rail — every open (not completed) assignment
-- across every cohort the caller belongs to, soonest due date first.
create or replace function public.get_my_open_assignments(p_limit int default 5)
returns table (
  assignment_id uuid,
  title         text,
  due_date      date,
  cohort_id     uuid,
  cohort_name   text,
  status        text
)
language sql
security definer
set search_path = public
stable
as $$
  select ca.id, ca.title, ca.due_date, c.id, c.name, cap.status
  from public.cohort_assignment_progress cap
  join public.cohort_assignments ca on ca.id = cap.assignment_id
  join public.cohorts c on c.id = ca.cohort_id
  where cap.user_id = auth.uid() and cap.status <> 'completed'
  order by ca.due_date nulls last, ca.created_at desc
  limit greatest(p_limit, 0);
$$;

comment on function public.get_my_open_assignments(int) is
  'The calling user''s own open assignments across every cohort they belong to, for Home''s "On the Desk" rail. SECURITY DEFINER.';

grant execute on function public.get_my_open_assignments(int) to authenticated;

-- Self-service leave. An owner can't leave while others remain (no
-- ownership-transfer mechanism in V1 — raises a clear error instead of
-- silently orphaning the org) unless they're the only member, in which
-- case leaving deletes the organization entirely (an "undo my mistaken
-- org creation" escape hatch, not a general delete-org feature).
create or replace function public.leave_organization(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role        text;
  v_other_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select om.role into v_role
  from public.organization_members om
  where om.organization_id = p_organization_id and om.user_id = auth.uid();

  if v_role is null then
    raise exception 'You are not in this organization.';
  end if;

  if v_role = 'owner' then
    select count(*) into v_other_count
    from public.organization_members om
    where om.organization_id = p_organization_id and om.user_id <> auth.uid();

    if v_other_count > 0 then
      raise exception 'Transfer ownership before leaving — not supported yet.';
    end if;

    delete from public.organizations where id = p_organization_id;
    return;
  end if;

  delete from public.cohort_assignment_progress cap
  using public.cohort_assignments ca, public.cohorts c
  where cap.assignment_id = ca.id and ca.cohort_id = c.id
    and c.organization_id = p_organization_id and cap.user_id = auth.uid();

  delete from public.cohort_members cm
  using public.cohorts c
  where cm.cohort_id = c.id and c.organization_id = p_organization_id and cm.user_id = auth.uid();

  delete from public.cohort_managers gm
  using public.cohorts c
  where gm.cohort_id = c.id and c.organization_id = p_organization_id and gm.user_id = auth.uid();

  delete from public.organization_members om
  where om.organization_id = p_organization_id and om.user_id = auth.uid();
end;
$$;

comment on function public.leave_organization(uuid) is
  'Removes the calling user from an organization (and every cohort in it). Deletes the org outright if they were its only member. SECURITY DEFINER.';

grant execute on function public.leave_organization(uuid) to authenticated;

-- Manager-only: removes someone from a cohort specifically, not the
-- parent organization — an explicit V1 limitation (org-wide member
-- management is a fast-follow, not built here).
create or replace function public.remove_cohort_member(p_cohort_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select c.organization_id into v_org_id from public.cohorts c where c.id = p_cohort_id;
  if v_org_id is null then
    raise exception 'Cohort not found.';
  end if;

  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = v_org_id and om.user_id = auth.uid() and om.role in ('owner', 'admin')
  ) and not exists (
    select 1 from public.cohort_managers cm where cm.cohort_id = p_cohort_id and cm.user_id = auth.uid()
  ) then
    raise exception 'You need to manage this cohort to remove someone from it.';
  end if;

  delete from public.cohort_assignment_progress cap
  using public.cohort_assignments ca
  where cap.assignment_id = ca.id and ca.cohort_id = p_cohort_id and cap.user_id = p_user_id;

  delete from public.cohort_members where cohort_id = p_cohort_id and user_id = p_user_id;
  delete from public.cohort_managers where cohort_id = p_cohort_id and user_id = p_user_id;
end;
$$;

comment on function public.remove_cohort_member(uuid, uuid) is
  'Manager-only: removes someone from a cohort (not the parent organization). SECURITY DEFINER.';

grant execute on function public.remove_cohort_member(uuid, uuid) to authenticated;
