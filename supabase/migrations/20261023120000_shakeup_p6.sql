-- Shake-up P6 (docs/shake-up-plan-2026-10-21.md §4.3, §5.1, §6.1).
--
-- HAND-APPLY in the Supabase SQL editor. Never `supabase db push`.
-- Additive only: three new tables (owner-only RLS) and record_action()
-- gaining the work kinds. The app works before this runs: it keeps Builds,
-- deliverables and ratings on the phone and these saves fail quietly.
--
--   builds             Studio Builds, uploaded once from the phone, then each save
--   deliverables       the overlay on a unit's work: status, aim-for, self-check,
--                      feedback (src/logic/deliverables.js)
--   life_area_ratings  every rating, append-only: the "then" in then vs now
--
-- All three are in the data export (src/api/dataExport.js).
--
-- Also: every unit opens the Showcase when it's finished (its last step is
-- handing the work in), so objective_unlocks gains a row per unit. The
-- complete_objective() gate reads only this table.

-- ── builds ─────────────────────────────────────────────────────────────────
create table if not exists public.builds (
  id          text not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id),
  constraint builds_id_len check (char_length(id) <= 80),
  constraint builds_kind_len check (char_length(kind) <= 40)
);
alter table public.builds enable row level security;
drop policy if exists builds_owner on public.builds;
create policy builds_owner on public.builds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── deliverables ───────────────────────────────────────────────────────────
create table if not exists public.deliverables (
  id           text not null,
  user_id      uuid not null references auth.users (id) on delete cascade,
  path_key     text,
  unit_key     text,
  kind         text not null,
  ref_id       text,
  title        text not null default '',
  status       text not null default 'todo',
  aim_for      date,
  rubric       jsonb not null default '{}'::jsonb,
  feedback     jsonb not null default '[]'::jsonb,
  snapshot_at  timestamptz,
  shown_at     timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, id),
  constraint deliverables_kind check (kind in ('build', 'checklist', 'reflection', 'test', 'project')),
  constraint deliverables_status check (status in ('todo', 'doing', 'handed', 'shown')),
  constraint deliverables_title_len check (char_length(title) <= 120),
  constraint deliverables_feedback_array check (jsonb_typeof(feedback) = 'array')
);
create index if not exists deliverables_user_status_idx on public.deliverables (user_id, status);
alter table public.deliverables enable row level security;
drop policy if exists deliverables_owner on public.deliverables;
create policy deliverables_owner on public.deliverables
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── life_area_ratings (append-only) ────────────────────────────────────────
create table if not exists public.life_area_ratings (
  id        bigserial primary key,
  user_id   uuid not null references auth.users (id) on delete cascade,
  area_id   text not null,
  rating    smallint not null,
  note      text not null default '',
  rated_at  timestamptz not null default now(),
  constraint life_area_ratings_rating check (rating between 1 and 5),
  constraint life_area_ratings_note_len check (char_length(note) <= 140)
);
create index if not exists life_area_ratings_user_area_idx on public.life_area_ratings (user_id, area_id, rated_at);
alter table public.life_area_ratings enable row level security;
-- Read and add your own. No update: a rating is a moment, kept. Delete stays
-- yours (your data, your call).
drop policy if exists life_area_ratings_select on public.life_area_ratings;
drop policy if exists life_area_ratings_insert on public.life_area_ratings;
drop policy if exists life_area_ratings_delete on public.life_area_ratings;
create policy life_area_ratings_select on public.life_area_ratings for select using (auth.uid() = user_id);
create policy life_area_ratings_insert on public.life_area_ratings for insert with check (auth.uid() = user_id);
create policy life_area_ratings_delete on public.life_area_ratings for delete using (auth.uid() = user_id);

-- ── record_action(): what pays (§6.1) ──────────────────────────────────────
-- Same rolling 24-hour cap (300). New kinds:
--   deliverable_handed_in 50 · deliverable_shown 30 · unit_done 100 ·
--   taste_logged 10 · build_mastered 40
-- A hand-in, a show, a unit and a mastered Build pay once, ever, per item
-- (like project_done); a taste pays once a day per Find. Feedback notes pay
-- nothing (self-reported, so paying would invite farming).
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
  v_once    boolean;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;
  if p_kind not in ('planner_done', 'task_done', 'project_step', 'project_done', 'area_action', 'goal_done', 'checkin', 'game', 'lesson', 'quest',
                    'deliverable_handed_in', 'deliverable_shown', 'unit_done', 'taste_logged', 'build_mastered') then
    raise exception 'Unknown action.';
  end if;

  v_xp_each := case p_kind
    when 'project_done'          then 100
    when 'unit_done'             then 100
    when 'goal_done'             then 50
    when 'deliverable_handed_in' then 50
    when 'build_mastered'        then 40
    when 'deliverable_shown'     then 30
    when 'project_step'          then 20
    when 'game'                  then 0
    when 'lesson'                then 0
    when 'quest'                 then 0
    else 10
  end;
  v_once := p_kind in ('project_done', 'deliverable_handed_in', 'deliverable_shown', 'unit_done', 'build_mastered');

  if v_xp_each > 0 then
    perform pg_advisory_xact_lock(hashtext('real_action:' || v_uid::text));
    select coalesce(sum(xp), 0) into v_earned
      from public.action_claims
     where user_id = v_uid and claimed_at > now() - interval '24 hours';

    if v_earned < v_xp_cap
       and not (p_ref is not null and exists (
         select 1 from public.action_claims
          where user_id = v_uid and kind = p_kind and ref = left(p_ref, 120)
            and (v_once or claimed_at > now() - interval '24 hours'))) then
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

-- ── objective_unlocks: a finished unit opens the Showcase ─────────────────
-- From src/data/units.js (unitObjective's `unlocks`): the same rows
-- scripts/gen-gating-seed.mjs emits for the units, added here so this file
-- is enough on its own.
insert into public.objective_unlocks (objective_id, feature_id) values
  ('unit-like-1', 'portfolio'),
  ('unit-like-2', 'portfolio'),
  ('unit-like-3', 'portfolio'),
  ('unit-like-4', 'portfolio'),
  ('unit-like-5', 'portfolio'),
  ('unit-next-1', 'portfolio'),
  ('unit-next-2', 'portfolio'),
  ('unit-next-3', 'portfolio'),
  ('unit-next-4', 'portfolio'),
  ('unit-next-5', 'portfolio'),
  ('unit-money-1', 'portfolio'),
  ('unit-money-2', 'portfolio'),
  ('unit-money-3', 'portfolio'),
  ('unit-money-4', 'portfolio'),
  ('unit-money-5', 'portfolio'),
  ('unit-career-1', 'portfolio'),
  ('unit-career-2', 'portfolio'),
  ('unit-career-3', 'portfolio'),
  ('unit-career-4', 'portfolio'),
  ('unit-career-5', 'portfolio'),
  ('unit-ged-1', 'portfolio'),
  ('unit-ged-2', 'portfolio'),
  ('unit-ged-3', 'portfolio'),
  ('unit-ged-4', 'portfolio'),
  ('unit-ged-5', 'portfolio'),
  ('unit-ground-physical', 'portfolio'),
  ('unit-ground-mental', 'portfolio'),
  ('unit-ground-social', 'portfolio'),
  ('unit-ground-financial', 'portfolio'),
  ('unit-ground-creative', 'portfolio'),
  ('unit-ground-professional', 'portfolio'),
  ('unit-ground-spiritual', 'portfolio'),
  ('unit-ground-digital', 'portfolio')
on conflict do nothing;
