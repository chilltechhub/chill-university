-- Role-Based Persona System — four switchable view modes over ONE unified
-- account: PERSONAL, STUDENT, BUSINESS, ENTREPRENEUR.
--
-- Deliberately NOT reusing any existing "role" column. `profiles.role` is a
-- loosely-typed, mostly-unset legacy field (the broken leaderboard
-- child-exclusion guard read it and matched nothing), and
-- `organization_members.role` already means something entirely different
-- (owner/admin/member permission level inside an org — see
-- 20260901120000_institutional_layer.sql). A third meaning stacked on the
-- same word is how that leaderboard bug happened. Hence `active_persona`.
--
-- XP / streaks / badges are NOT duplicated here. They already live on
-- `profiles` (xp, streak_count) and that stays the single source of truth —
-- switching persona changes which widgets and tracks render, never the
-- underlying progress. "Unified core, isolated views."
--
-- Apply in the Supabase SQL editor, or via `supabase db push`.

-- ─── 1. Active persona on the existing profile ───────────────────────────────

alter table public.profiles add column if not exists active_persona text;

-- BUSINESS and ENTREPRENEUR carry adult financial content (business credit,
-- SBA loan packaging, entity formation, tax strategy) and the consulting
-- funnel. This app has real minor accounts — family linking, is_minor,
-- date_of_birth, and a KWS parental-consent flow all exist because of that.
--
-- The age gate is enforced HERE, as a row-level check, rather than only in
-- the UI: a client bug, a stale build, or a hand-rolled API call cannot put
-- a minor into an adult persona. `is_minor` lives on this same row, so a
-- plain CHECK can see it.
--
-- Existing rows all have active_persona = null, so this validates instantly.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_active_persona_check'
  ) then
    alter table public.profiles add constraint profiles_active_persona_check check (
      active_persona is null
      or active_persona in ('PERSONAL', 'STUDENT')
      or (active_persona in ('BUSINESS', 'ENTREPRENEUR') and is_minor is not true)
    );
  end if;
end $$;

-- ─── 2. Per-persona widget layout ────────────────────────────────────────────
-- One row per (user, persona). Holds which dashboard widgets that user has
-- enabled in that mode, so switching modes restores their own layout rather
-- than a global default. Users can enable any widget in any mode — personas
-- set the DEFAULT layout, they do not restrict the catalog.

create table if not exists public.persona_configs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  persona        text not null check (persona in ('PERSONAL', 'STUDENT', 'BUSINESS', 'ENTREPRENEUR')),
  active_widgets jsonb not null default '[]'::jsonb,
  baseline       jsonb not null default '{}'::jsonb,  -- onboarding answers for this mode (GPA goal, revenue target, ...)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, persona)
);

create index if not exists idx_persona_configs_user on public.persona_configs (user_id);

alter table public.persona_configs enable row level security;

-- Own-row only. Unlike the institutional tables there is nothing shared here,
-- so plain policies are enough — no SECURITY DEFINER indirection needed.
drop policy if exists persona_configs_select_own on public.persona_configs;
create policy persona_configs_select_own on public.persona_configs
  for select using (auth.uid() = user_id);

drop policy if exists persona_configs_insert_own on public.persona_configs;
create policy persona_configs_insert_own on public.persona_configs
  for insert with check (auth.uid() = user_id);

drop policy if exists persona_configs_update_own on public.persona_configs;
create policy persona_configs_update_own on public.persona_configs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists persona_configs_delete_own on public.persona_configs;
create policy persona_configs_delete_own on public.persona_configs
  for delete using (auth.uid() = user_id);

-- ─── 3. The Vault ────────────────────────────────────────────────────────────
-- Every curriculum lesson ends in an action that produces an artifact, and the
-- artifacts accumulate into a lender-ready / investor-ready package. This is
-- that store.
--
-- PHASE 1 IS STRUCTURED WORKSHEET DATA ONLY — `payload` jsonb, holding what
-- the user typed into the lesson worksheet. There is deliberately NO file
-- upload, no storage bucket, no credit-report pull, and no bank-feed
-- connection here yet.
--
-- That boundary is the whole point: today a breach of this app exposes
-- someone's XP. The moment this table holds uploaded tax returns, credit
-- reports, and Plaid tokens, a breach exposes identity and financial data —
-- a different category of harm, needing a security review and an incident
-- plan that do not exist yet. `file_path` is reserved below so adding uploads
-- later is a migration rather than a redesign, but it stays unused for now.

create table if not exists public.vault_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  track         text not null,              -- 'L2', 'S1', ... which curriculum level produced it
  lesson_key    text not null,              -- e.g. 'entitySelection' — matches the class topic `key`
  title         text not null,              -- the deliverable name, e.g. 'Entity Selection Decision Matrix'
  status        text not null default 'draft' check (status in ('draft', 'complete')),
  payload       jsonb not null default '{}'::jsonb,
  file_path     text,                       -- reserved; unused in phase 1, see note above
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_key)
);

create index if not exists idx_vault_documents_user on public.vault_documents (user_id);
create index if not exists idx_vault_documents_track on public.vault_documents (user_id, track);

alter table public.vault_documents enable row level security;

drop policy if exists vault_documents_select_own on public.vault_documents;
create policy vault_documents_select_own on public.vault_documents
  for select using (auth.uid() = user_id);

drop policy if exists vault_documents_insert_own on public.vault_documents;
create policy vault_documents_insert_own on public.vault_documents
  for insert with check (auth.uid() = user_id);

drop policy if exists vault_documents_update_own on public.vault_documents;
create policy vault_documents_update_own on public.vault_documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists vault_documents_delete_own on public.vault_documents;
create policy vault_documents_delete_own on public.vault_documents
  for delete using (auth.uid() = user_id);

-- ─── 4. updated_at triggers ──────────────────────────────────────────────────

-- public.touch_updated_at() is already defined in
-- 20260828140000_remote_content_config.sql and reused by the institutional
-- layer the same way — not redefined here, so there is only ever one copy to
-- keep correct.

drop trigger if exists persona_configs_touch_updated_at on public.persona_configs;
create trigger persona_configs_touch_updated_at
  before update on public.persona_configs
  for each row execute function public.touch_updated_at();

drop trigger if exists vault_documents_touch_updated_at on public.vault_documents;
create trigger vault_documents_touch_updated_at
  before update on public.vault_documents
  for each row execute function public.touch_updated_at();
