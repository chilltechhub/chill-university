-- Two-step sign-in, enforced by the database. docs/audit-plan-2026-09-30.md, 1.5.
--
-- ── Why ──────────────────────────────────────────────────────────────────────
-- Settings → Two-step sign-in enrolls an authenticator app. After that a
-- password sign-in only reaches aal1, and the app asks for the code before it
-- opens. But only the app checked: no policy or function looked at `aal`, so
-- someone who had just the password could sign in with it and call the REST
-- API directly (read everything, even delete_my_account()) without ever
-- entering a code. Found by the 2026-09-30 security audit (S1).
--
-- ── How ──────────────────────────────────────────────────────────────────────
-- A PostgREST pre-request function: PostgREST runs it before EVERY request
-- (tables, views and RPCs alike), so one check covers the lot, including the
-- SECURITY DEFINER functions that row policies can't reach. It refuses only
-- this case: a signed-in user who has a verified factor, on a session that
-- isn't aal2. Everyone else is untouched:
--   anon / service role (Edge Functions, KWS webhook)  → no auth.uid(), skipped
--   accounts without two-step sign-in                  → no verified factor, skipped
--   accounts with it, after the code step              → aal2, skipped
-- Enrolling works: until the first code is confirmed the factor is
-- 'unverified', and confirming it returns an aal2 session.
--
-- The refusal is SQLSTATE 42501 (403) with hint 'mfa_required'. The app
-- (context/UserProgressContext.js, src/api/offlineCache.js) treats a
-- password-only session on a two-step account as signed out, so it doesn't
-- send requests into this wall or drop queued writes against it.
--
-- Not covered: Storage and Realtime, which don't go through PostgREST. The app
-- stores nothing personal in Storage and uses no Realtime channels today.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here).
--
-- ── Before applying ──────────────────────────────────────────────────────────
-- The guard at the top refuses to run if some other pre-request function is
-- already configured, rather than silently replacing it.
--
-- ── Check it afterwards ──────────────────────────────────────────────────────
-- 1. Signed-in app on an account WITHOUT two-step: everything still loads.
-- 2. In the SQL editor, with the id of an account that HAS two-step on:
--      begin;
--      select set_config('request.jwt.claims',
--        json_build_object('sub', '<that user id>', 'role', 'authenticated', 'aal', 'aal1')::text, true);
--      select public.require_mfa_when_enrolled();   -- ERROR: Two-step sign-in required
--      select set_config('request.jwt.claims',
--        json_build_object('sub', '<that user id>', 'role', 'authenticated', 'aal', 'aal2')::text, true);
--      select public.require_mfa_when_enrolled();   -- returns nothing: allowed
--      rollback;
--
-- ── Undo ─────────────────────────────────────────────────────────────────────
--   alter role authenticator reset pgrst.db_pre_request;
--   notify pgrst, 'reload config';

begin;

do $$
declare
  v_existing text;
begin
  select substr(c, length('pgrst.db_pre_request=') + 1) into v_existing
  from pg_roles r, unnest(coalesce(r.rolconfig, '{}'::text[])) c
  where r.rolname = 'authenticator' and c like 'pgrst.db_pre_request=%';
  if v_existing is not null and v_existing <> 'public.require_mfa_when_enrolled' then
    raise exception 'authenticator already runs pre-request function %; combine the two before applying this', v_existing;
  end if;
end $$;

create or replace function public.require_mfa_when_enrolled()
returns void
language plpgsql
stable
security definer   -- reads auth.mfa_factors, which API roles can't
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;                                    -- anon, service role
  end if;
  if coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' then
    return;                                    -- code step done
  end if;
  if exists (
    select 1 from auth.mfa_factors f
    where f.user_id = v_uid and f.status = 'verified'
  ) then
    raise exception 'Two-step sign-in required'
      using errcode = '42501',
            hint    = 'mfa_required',
            detail  = 'This account has two-step sign-in on. Enter the code from your authenticator app first.';
  end if;
end;
$$;

-- PostgREST calls it as whichever role the request runs as. Every one of them
-- must be able to, or that role's requests all fail.
grant execute on function public.require_mfa_when_enrolled() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.require_mfa_when_enrolled';

commit;

-- Outside the transaction so PostgREST reloads with the new setting.
notify pgrst, 'reload config';
