-- Parent/child account linking — read-only progress view. A child generates
-- a short-lived code from their own account; a parent enters it on theirs
-- to link. Once linked, the parent can see the child's level/XP/points/
-- streak — nothing else, and no controls over the child's account.
--
-- Replaces the old, never-finished prototype (src/screens/ParentHome.js,
-- ChildDashboard.js, AddChildByCode.js, ChildInviteCode.js — moved to
-- archive/) which referenced a `parent_children` join table AND a
-- `profiles.parent_id` column inconsistently, and columns that don't exist
-- on `profiles` (role, grade, goals_completed, missions_completed). This
-- migration settles on a single `parent_id` column (a child has at most
-- one linked parent) and follows the same SECURITY DEFINER pattern already
-- used by get_leaderboard() in 20260826_leaderboard.sql — the client never
-- queries `profiles` or the invite-codes table directly for this feature,
-- it only calls these three functions, so there's no broad RLS policy
-- exposing full profile rows (email-derived fields, settings, etc.) to a
-- linked parent.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`.

alter table public.profiles add column if not exists parent_id uuid references public.profiles(id) on delete set null;
create index if not exists idx_profiles_parent_id on public.profiles (parent_id);

create table if not exists public.family_invite_codes (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.profiles(id) on delete cascade,
  code       text not null unique,
  expires_at timestamptz not null,
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS enabled with zero policies — fully locked down from direct client
-- access. All reads/writes go through the SECURITY DEFINER functions below.
alter table public.family_invite_codes enable row level security;

-- Generates a fresh 6-character code for the calling user (as the child),
-- expiring in 15 minutes. Called from the child's own account.
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

  -- 6 chars from an unambiguous alphabet (no 0/O/1/I) — retry on the rare
  -- collision with the unique constraint.
  loop
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 32)::int + 1, 1), '')
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

comment on function public.generate_family_code() is
  'Generates a 15-minute invite code for the calling user (child side). SECURITY DEFINER so the invite-codes table needs no client-facing RLS policy at all.';

grant execute on function public.generate_family_code() to authenticated;

-- Redeems a code (parent side): links the code's child_id to the calling
-- user as parent_id, marks the code used, and returns the child's display
-- name so the UI can confirm who just got linked.
create or replace function public.redeem_family_code(p_code text)
returns table (child_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select fic.child_id into v_child_id
  from public.family_invite_codes fic
  where fic.code = upper(p_code)
    and fic.used = false
    and fic.expires_at > now()
  limit 1;

  if v_child_id is null then
    raise exception 'That code is invalid or has expired.';
  end if;

  if v_child_id = auth.uid() then
    raise exception 'You can''t link to your own account.';
  end if;

  update public.family_invite_codes set used = true where family_invite_codes.child_id = v_child_id and family_invite_codes.code = upper(p_code);
  update public.profiles set parent_id = auth.uid() where id = v_child_id;

  return query
    select p.id, coalesce(p.display_name, p.traveler_name, 'Traveler')
    from public.profiles p
    where p.id = v_child_id;
end;
$$;

comment on function public.redeem_family_code(text) is
  'Redeems a child-generated invite code, linking that child to the calling user (parent side). SECURITY DEFINER.';

grant execute on function public.redeem_family_code(text) to authenticated;

-- Read-only progress for every child linked to the calling user. Only
-- returns the columns needed for the progress view — never the full row.
create or replace function public.get_my_children()
returns table (
  id uuid,
  display_name text,
  level int,
  xp int,
  points int,
  streak_count int,
  last_active_date date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(p.display_name, p.traveler_name, 'Traveler') as display_name,
    coalesce(p.level, 1)  as level,
    coalesce(p.xp, 0)     as xp,
    coalesce(p.points, 0) as points,
    coalesce(p.streak_count, 0) as streak_count,
    p.last_active_date
  from public.profiles p
  where p.parent_id = auth.uid()
  order by p.display_name;
$$;

comment on function public.get_my_children() is
  'Read-only progress rows for every child linked to the calling user (parent side). SECURITY DEFINER — only level/xp/points/streak, never the full profiles row.';

grant execute on function public.get_my_children() to authenticated;

-- Either side of a link can break it — the parent unlinks a specific
-- child, or a child unlinks themselves from whoever their parent is.
create or replace function public.unlink_child(p_child_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set parent_id = null
  where id = p_child_id and parent_id = auth.uid();
$$;

grant execute on function public.unlink_child(uuid) to authenticated;

create or replace function public.unlink_my_parent()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set parent_id = null where id = auth.uid();
$$;

grant execute on function public.unlink_my_parent() to authenticated;
