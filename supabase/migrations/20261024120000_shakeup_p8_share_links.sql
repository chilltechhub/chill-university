-- Shake-up P8 (docs/shake-up-plan-2026-10-21.md §4.5): read-only share links.
--
-- HAND-APPLY in the Supabase SQL editor. Never `supabase db push`.
-- Additive only. The app works before this runs: the link button says the
-- link couldn't be made, and Take it home (a file) keeps working.
--
-- A link is a snapshot: the page as it was when it was shared (one piece of
-- work, or the Showcase), stored rendered, and shown read-only at
-- /s/<token> on the web build. 18+ only (is_restricted_account: under 18 by
-- birth date, or age unknown, can't make one). Revoking stops it at once.
--
-- Nobody touches the table directly: no insert/update/delete policies.
--   create_share_link()   signed-in adults; the server makes the token
--   revoke_share_link()   the owner
--   get_share_link()      anyone with the token, while it isn't revoked
-- The owner can list their own rows (select policy) to see and revoke them.
--
-- Rollback: revoke every link (update public.share_links set revoked_at =
-- now() where revoked_at is null). The table stays.

create table if not exists public.share_links (
  token       text primary key check (token ~ '^[0-9a-f]{64}$'),
  user_id     uuid not null references auth.users (id) on delete cascade,
  target_kind text not null check (target_kind in ('deliverable', 'showcase')),
  target_id   text check (target_id is null or char_length(target_id) <= 120),
  title       text not null default '' check (char_length(title) <= 120),
  html        text not null check (octet_length(html) <= 600000),
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index if not exists share_links_user_idx on public.share_links (user_id, created_at desc);

alter table public.share_links enable row level security;

drop policy if exists share_links_select_own on public.share_links;
create policy share_links_select_own on public.share_links
  for select to authenticated using (user_id = auth.uid());

-- No direct writes for anyone; the functions below are the only door.
revoke insert, update, delete on public.share_links from anon, authenticated;
revoke select on public.share_links from anon;

-- ── create ──────────────────────────────────────────────────────────────────
create or replace function public.create_share_link(
  p_kind text, p_target text, p_title text, p_html text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_live int;
begin
  if v_uid is null then
    raise exception 'Sign in to make a link.';
  end if;
  if public.is_restricted_account(v_uid) then
    raise exception 'Share links are for accounts 18 and over. You can still take the file home.';
  end if;
  if p_kind not in ('deliverable', 'showcase') then
    raise exception 'Unknown kind of link.';
  end if;
  if p_html is null or octet_length(p_html) > 600000 then
    raise exception 'That page is too big to share as a link.';
  end if;
  select count(*) into v_live from public.share_links where user_id = v_uid and revoked_at is null;
  if v_live >= 50 then
    raise exception 'You have 50 live links. Revoke one first.';
  end if;
  -- 64 hex characters from two random UUIDs: not guessable, no extension needed.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.share_links (token, user_id, target_kind, target_id, title, html)
  values (v_token, v_uid, p_kind, left(p_target, 120), left(coalesce(p_title, ''), 120), p_html);
  return v_token;
end;
$$;

-- ── revoke ──────────────────────────────────────────────────────────────────
create or replace function public.revoke_share_link(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  update public.share_links set revoked_at = now()
   where token = p_token and user_id = auth.uid() and revoked_at is null;
  return found;
end;
$$;

-- ── read (anyone with the token) ───────────────────────────────────────────
-- Returns nothing for an unknown or revoked token, the same either way, so
-- it says nothing about which links exist.
create or replace function public.get_share_link(p_token text)
returns table (title text, html text, target_kind text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select l.title, l.html, l.target_kind, l.created_at
    from public.share_links l
   where l.token = p_token
     and p_token ~ '^[0-9a-f]{64}$'
     and l.revoked_at is null;
$$;

revoke all on function public.create_share_link(text, text, text, text) from public, anon;
revoke all on function public.revoke_share_link(text) from public, anon;
revoke all on function public.get_share_link(text) from public;
grant execute on function public.create_share_link(text, text, text, text) to authenticated;
grant execute on function public.revoke_share_link(text) to authenticated;
grant execute on function public.get_share_link(text) to anon, authenticated;
