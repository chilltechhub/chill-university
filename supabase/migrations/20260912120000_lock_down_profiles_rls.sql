-- CRITICAL: public.profiles has no working row-level security.
--
-- Confirmed 2026-09-12 via a plain unauthenticated REST call (just the
-- public anon key, which ships inside the app bundle and is not a secret):
--   GET .../rest/v1/profiles?select=id,email,date_of_birth,is_minor,traveler_name
-- returned real rows for arbitrary users, including live email addresses.
-- profile_full (already patched for its own SECURITY DEFINER bypass in
-- 20260907120000_fix_rls_and_security_definer_view.sql) shows the same
-- exposure, because that fix only helps if the underlying table it reads
-- from is itself locked down — it wasn't. This app has real minor accounts
-- (family linking, is_minor, date_of_birth, a KWS consent flow), so this is
-- not a theoretical risk.
--
-- ── Audit performed before writing this (not guessed) ────────────────────────
-- Every direct client-side read/write of profiles was traced across the
-- codebase (~12 files, ~20 call sites: LibraryScreen, portfolio.js,
-- MultiStepOnboarding, profileAccountsService, SettingsScreen, LoginScreen,
-- OnboardingScreen, gamificationService, kwsVerification, ProfileScreen,
-- ResetPasswordScreen, ProfileQuickSetup). Every one of them is already
-- scoped to auth.uid() = id — own row only, never someone else's.
--
-- Every genuine CROSS-user need already goes through a SECURITY DEFINER RPC
-- that explicitly allowlists safe columns, not direct table access:
--   - Leaderboard        -> get_leaderboard / get_my_leaderboard_position
--   - Family linking     -> get_my_children / redeem_family_code / etc.
--     (familyService.js has zero direct profiles calls)
--   - Community feeds    -> get_community_feed / get_top_talent /
--     get_fellow_scholars / get_mentors (community_discover migration)
--   - Organization/cohort -> get_cohort_roster / get_cohort_leaderboard
--   - Moderation queue    -> get_moderation_queue joins profiles server-side
-- None of these depend on a client-side SELECT against profiles, so a
-- strict own-row policy does not touch any of them.
--
-- gamificationService.js's getUserProfile(userId) takes an arbitrary id and
-- would be a real problem if it were reachable with someone else's id — it
-- has zero call sites anywhere in the app today. Dead code, safe to ignore
-- here; worth deleting separately.
--
-- ── The one edge case this does NOT special-case, and why that's fine ────────
-- LoginScreen.js's signup upsert (creating the initial profiles row) fires
-- before checking whether a session exists yet, and its own comment calls
-- it a "safety net for trigger" — implying a database trigger was meant to
-- be the real profile-creation mechanism. No such trigger exists in any
-- migration in this repo (same "created by hand in the dashboard, never
-- versioned" pattern already called out for the `mentors` table). If this
-- project requires email confirmation, that specific upsert runs
-- unauthenticated and this policy will reject it.
--
-- That is an acceptable, graceful degradation, not a break: goAfterAuth
-- already treats a missing profiles row as `needsOnboarding = true`
-- (`!profile` check), and MultiStepOnboarding.js performs its own
-- `profiles` upsert once the user is actually authenticated post-signup —
-- which succeeds under this policy same as any other own-row write. Worst
-- case is the row is created a little later than today, not a broken
-- signup. If you *do* want the original safety-net timing back, the fix is
-- adding a real `on_auth_user_created` trigger (SECURITY DEFINER, runs
-- before any client request, bypasses RLS by design) — not loosening this
-- policy.
--
-- ── What this does not change ─────────────────────────────────────────────
-- No DELETE policy: nothing in the app deletes a profiles row directly.
-- delete_my_account() (20260906150000_delete_account.sql) removes it via
-- deleting the auth.users row, which cascades as the function owner and
-- bypasses RLS regardless of policy — this migration doesn't touch that.
--
-- Drops every existing policy on profiles first (names unknown — this
-- table predates every migration in this repo, so whatever's there now,
-- including if it's nothing, or something permissive) rather than adding
-- on top of an unknown starting state.
--
-- REVIEW BEFORE RUNNING — this is exactly what the audit above found the
-- app needs; run it in the Supabase SQL editor once you've read it, or via
-- `supabase db push`.

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
