-- Wayfinder — purpose-first personalization and feature gating.
--
-- The app has grown far more surface than any one person needs on day one
-- (two Library wings, ~20 area screens, 20+ training games, the planner,
-- the classroom builder, Discover, the org layer...). Everything being
-- equally visible and equally available means a new account opens to a wall
-- of options with nothing marking "start here" — the exact "bogged down, no
-- clear focus" problem this migration exists to fix.
--
-- The model, mirrored client-side in src/logic/featureAccess.js:
--
--   purpose   — one chosen reason the person is here (profiles.purpose_key).
--               Everything the app surfaces is ranked against it.
--   objective — ONE active achievement at a time (public.user_objectives).
--               Its steps are the only "what do I do next" the app asks for.
--   gate      — every feature carries one in src/data/featureCatalog.js:
--                 open         always available
--                 locked       opens by finishing an objective, OR by passing
--                              a competence test (see below)
--                 experimental rough/unfinished, opt-in per account
--                 paid         needs profiles.plan = 'plus'
--   unlock    — a row in public.feature_unlocks. Append-only; never deleted
--               on a plan lapse, so a `paid` feature someone already earned
--               through an objective stays earned.
--
-- The test-out route ("show competence instead of grinding"): one attempt
-- per feature. Pass and the feature unlocks immediately. Fail and the test
-- route closes for good on that feature — the objective path becomes the
-- only way in. That asymmetry is the whole point: the test is a shortcut
-- offered on the honour of getting it right the first time, not a retryable
-- guessing game. public.feature_test_attempts is the record of both.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

-- ─── profiles: plan, experimental opt-in, chosen purpose ─────────────────────

-- 'free' | 'plus'. Nothing in the app writes this yet — there's no billing
-- integration — so it's set from the Supabase dashboard (or by whatever
-- store-receipt webhook lands later). The client treats any value other
-- than 'plus' as free, so an unexpected string fails closed.
alter table public.profiles
  add column if not exists plan text not null default 'free';

-- When a paid plan lapses. Null = no expiry on file. Checked alongside
-- `plan` so an expired 'plus' row stops granting paid features without
-- anything having to rewrite the plan column on a schedule.
alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

-- Opt-in to unfinished work. Off by default: an experimental screen is one
-- we'd be embarrassed to show unasked, and someone who never opted in
-- should never hit one by tapping around.
alter table public.profiles
  add column if not exists experimental_opt_in boolean not null default false;

-- The one purpose the whole app orients around — a key from PURPOSES in
-- src/data/objectives.js ('habits', 'build', 'learn', 'wellbeing', 'money',
-- 'career'). Null means never chosen, which the client reads as "ask".
alter table public.profiles
  add column if not exists purpose_key text;

-- Onboarding's Step 6 has always asked how someone intends to use the app
-- day to day (habits / building / learning / reflecting / planning / breaks)
-- and then dropped the answer on the floor — it never made it into the
-- upsert payload, so nothing could read it back. It is the most direct
-- signal there is for suggesting a purpose, so it gets a column and
-- MultiStepOnboarding.js now saves it.
alter table public.profiles
  add column if not exists usage_patterns text[];

-- ─── user_objectives — the one active achievement ────────────────────────────
--
-- One row per objective the account has ever started. At most one may be
-- 'active' at a time (enforced by the partial unique index below) — that
-- single-focus rule is the feature, not an implementation detail.
--
-- `steps` is a jsonb object of { [stepId]: true } for the steps checked
-- off so far, rather than a child table: the step list itself lives in code
-- (src/data/objectives.js) and changes with a build, so storing the
-- definitions here would just guarantee the two drift apart.

create table if not exists public.user_objectives (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  objective_id text not null,
  status       text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  steps        jsonb not null default '{}'::jsonb,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, objective_id)
);

create unique index if not exists user_objectives_one_active_idx
  on public.user_objectives (user_id)
  where status = 'active';

create index if not exists user_objectives_user_idx
  on public.user_objectives (user_id, status);

alter table public.user_objectives enable row level security;

drop policy if exists "user_objectives_select_own" on public.user_objectives;
create policy "user_objectives_select_own" on public.user_objectives
  for select using (auth.uid() = user_id);

drop policy if exists "user_objectives_insert_own" on public.user_objectives;
create policy "user_objectives_insert_own" on public.user_objectives
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_objectives_update_own" on public.user_objectives;
create policy "user_objectives_update_own" on public.user_objectives
  for update using (auth.uid() = user_id);

drop policy if exists "user_objectives_delete_own" on public.user_objectives;
create policy "user_objectives_delete_own" on public.user_objectives
  for delete using (auth.uid() = user_id);

-- ─── feature_unlocks — what this account has earned ──────────────────────────
--
-- Append-only by intent. `method` records how it was earned, because the UI
-- says so out loud ("You tested out of this" reads very differently from
-- "You finished Ship Your First Build"), and because a 'plan' unlock is the
-- only kind that should stop applying when a plan lapses.

create table if not exists public.feature_unlocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  feature_id  text not null,
  method      text not null check (method in ('objective', 'test', 'plan', 'experimental', 'granted')),
  unlocked_at timestamptz not null default now(),
  unique (user_id, feature_id)
);

create index if not exists feature_unlocks_user_idx
  on public.feature_unlocks (user_id);

alter table public.feature_unlocks enable row level security;

drop policy if exists "feature_unlocks_select_own" on public.feature_unlocks;
create policy "feature_unlocks_select_own" on public.feature_unlocks
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy on purpose. Unlocks are only ever written
-- through public.unlock_feature() below, which re-checks the gate itself —
-- otherwise the client could simply insert a row for every paid feature and
-- the gate would be decoration.

-- ─── feature_test_attempts — the test-out record ─────────────────────────────

create table if not exists public.feature_test_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  feature_id   text not null,
  passed       boolean not null,
  score        int not null default 0,
  total        int not null default 0,
  attempted_at timestamptz not null default now(),
  unique (user_id, feature_id)
);

alter table public.feature_test_attempts enable row level security;

drop policy if exists "feature_test_attempts_select_own" on public.feature_test_attempts;
create policy "feature_test_attempts_select_own" on public.feature_test_attempts
  for select using (auth.uid() = user_id);

-- Same reasoning as feature_unlocks: written only through
-- public.record_test_attempt(), so "one attempt, ever" is enforced by the
-- unique constraint above and not by the client's good manners.

-- ─── is_plan_active() — one definition of "paying right now" ─────────────────

create or replace function public.is_plan_active(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.plan = 'plus'
       and (p.plan_expires_at is null or p.plan_expires_at > now())
     from public.profiles p
     where p.id = p_user_id),
    false
  );
$$;

comment on function public.is_plan_active(uuid) is
  'True when the profile holds an unexpired plus plan. Mirrored client-side by planActive() in src/logic/featureAccess.js.';

grant execute on function public.is_plan_active(uuid) to authenticated;

-- ─── record_test_attempt() — the one-shot competence test ────────────────────
--
-- The question bank lives in code (src/data/competencyTests.js) because it
-- changes with a build, so the client grades the answers and sends the raw
-- tally. What this function will not delegate is the part that actually
-- matters: the pass mark is applied here, the attempt is written here, and
-- the unique constraint on (user_id, feature_id) means a second call raises
-- instead of quietly handing out a retry. So "one attempt, ever" holds even
-- against a client that would rather it didn't.
--
-- Returns the stored attempt row.

create or replace function public.record_test_attempt(
  p_feature_id text,
  p_score      int,
  p_total      int,
  p_pass_mark  int
)
returns public.feature_test_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passed  boolean;
  v_row     public.feature_test_attempts;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if p_total <= 0 or p_score < 0 or p_score > p_total then
    raise exception 'Nonsense score: % of %.', p_score, p_total;
  end if;

  -- p_pass_mark arrives from the client along with the question bank it came
  -- from, so on its own it would be trivially settable to zero. The real
  -- protection is the one-attempt rule below — you cannot farm a pass you
  -- only get to try once — but a floor costs nothing and closes the silliest
  -- version of the trick. Every bank in src/data/competencyTests.js sits well
  -- above this.
  if p_pass_mark < ceil(p_total / 2.0) then
    raise exception 'A pass mark of % out of % is not a check.', p_pass_mark, p_total;
  end if;

  if exists (
    select 1 from public.feature_test_attempts
    where user_id = auth.uid() and feature_id = p_feature_id
  ) then
    raise exception 'This test has already been attempted. The objective path is the way in now.';
  end if;

  v_passed := p_score >= p_pass_mark;

  insert into public.feature_test_attempts (user_id, feature_id, passed, score, total)
  values (auth.uid(), p_feature_id, v_passed, p_score, p_total)
  returning * into v_row;

  -- Passing IS the unlock — no second round-trip, and no window where the
  -- attempt is recorded but the reward isn't.
  if v_passed then
    insert into public.feature_unlocks (user_id, feature_id, method)
    values (auth.uid(), p_feature_id, 'test')
    on conflict (user_id, feature_id) do nothing;
  end if;

  return v_row;
end;
$$;

comment on function public.record_test_attempt(text, int, int, int) is
  'Records the single allowed test-out attempt for a feature and unlocks it on a pass. Raises on a second attempt.';

grant execute on function public.record_test_attempt(text, int, int, int) to authenticated;

-- ─── unlock_feature() — the only writer of feature_unlocks ───────────────────
--
-- p_method says which gate the caller claims to have cleared, and each one
-- is re-checked here:
--   'objective'    — the named objective must actually be completed
--   'plan'         — is_plan_active() must be true
--   'experimental' — profiles.experimental_opt_in must be true
--   'granted'      — rejected; reserved for admin SQL, never the client
--   'test'         — rejected; only record_test_attempt() may grant one
--
-- Idempotent: unlocking something already unlocked returns the existing row.

create or replace function public.unlock_feature(
  p_feature_id   text,
  p_method       text,
  p_objective_id text default null
)
returns public.feature_unlocks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.feature_unlocks;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if p_method not in ('objective', 'plan', 'experimental') then
    raise exception 'Unlock method % cannot be claimed from the app.', p_method;
  end if;

  if p_method = 'objective' then
    if p_objective_id is null then
      raise exception 'An objective unlock has to say which objective.';
    end if;
    if not exists (
      select 1 from public.user_objectives
      where user_id = auth.uid()
        and objective_id = p_objective_id
        and status = 'completed'
    ) then
      raise exception 'Objective % is not finished yet.', p_objective_id;
    end if;
  end if;

  if p_method = 'plan' and not public.is_plan_active(auth.uid()) then
    raise exception 'That one needs an active plan.';
  end if;

  if p_method = 'experimental' and not exists (
    select 1 from public.profiles
    where id = auth.uid() and experimental_opt_in = true
  ) then
    raise exception 'Experimental features are switched off for this account.';
  end if;

  insert into public.feature_unlocks (user_id, feature_id, method)
  values (auth.uid(), p_feature_id, p_method)
  on conflict (user_id, feature_id) do nothing;

  select * into v_row
  from public.feature_unlocks
  where user_id = auth.uid() and feature_id = p_feature_id;

  return v_row;
end;
$$;

comment on function public.unlock_feature(text, text, text) is
  'Grants a feature after re-checking the gate it claims to have cleared. The only path the app has into feature_unlocks.';

grant execute on function public.unlock_feature(text, text, text) to authenticated;

-- ─── complete_objective() — finish the one active achievement ────────────────
--
-- Marks it done and unlocks everything it was carrying in one transaction,
-- so the app can never end up with a completed objective whose rewards
-- silently didn't land. p_unlock_ids comes from the objective's `unlocks`
-- list in src/data/objectives.js.

create or replace function public.complete_objective(
  p_objective_id text,
  p_unlock_ids   text[] default '{}'
)
returns public.user_objectives
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row       public.user_objectives;
  v_feature   text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  update public.user_objectives
     set status = 'completed', completed_at = now()
   where user_id = auth.uid()
     and objective_id = p_objective_id
     and status = 'active'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'No active objective % to complete.', p_objective_id;
  end if;

  foreach v_feature in array coalesce(p_unlock_ids, '{}'::text[]) loop
    insert into public.feature_unlocks (user_id, feature_id, method)
    values (auth.uid(), v_feature, 'objective')
    on conflict (user_id, feature_id) do nothing;
  end loop;

  return v_row;
end;
$$;

comment on function public.complete_objective(text, text[]) is
  'Completes the active objective and grants its unlocks atomically.';

grant execute on function public.complete_objective(text, text[]) to authenticated;
