-- Fixes the Supabase Security Advisor CRITICAL findings:
--   - "Security Definer View" on public.profile_full
--   - "RLS Disabled in Public" on games, formats, topics, avatars,
--     profile_topics, profile_formats, child_invite_codes, self_care_history
--
-- None of these tables/views existed in a prior migration in this repo (they
-- were created directly against the live database), so this is the first
-- time they're captured in version control.

-- ---------------------------------------------------------------------------
-- 1. profile_full: this view selects email + full profile fields from
--    `profiles` with no filter. Flagged as a security-definer view, meaning
--    it evaluates using the VIEW OWNER's privileges rather than the calling
--    user's — bypassing whatever RLS is on `profiles` itself. Any
--    authenticated caller querying `profile_full` could read every user's
--    email/bio/profile data.
--
--    Fix: security_invoker makes the view respect the querying user's own
--    permissions (and therefore `profiles`' existing RLS policy) instead of
--    the owner's. This is additive protection — it does not change what
--    profiles' own policy already restricts, it just stops profile_full from
--    circumventing it.
alter view public.profile_full set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- 2. Static/reference lookup tables: read-only catalogs with no per-row
--    owner (avatars, games, formats, topics). Every signed-in user is meant
--    to read these (avatar picker, game registry, topic/format pickers);
--    nothing in the client ever writes to them, so no INSERT/UPDATE/DELETE
--    policy is added — writes stay possible only via the service_role key
--    (dashboard/migrations), which always bypasses RLS regardless of policy.

alter table public.avatars enable row level security;
create policy "avatars are readable by authenticated users"
  on public.avatars for select
  to authenticated
  using (true);

alter table public.games enable row level security;
create policy "games are readable by authenticated users"
  on public.games for select
  to authenticated
  using (true);

alter table public.formats enable row level security;
create policy "formats are readable by authenticated users"
  on public.formats for select
  to authenticated
  using (true);

alter table public.topics enable row level security;
create policy "topics are readable by authenticated users"
  on public.topics for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 3. Owner-scoped junction tables: each row belongs to exactly one profile
--    (profile_id). Users may read/add/remove only their own picks.

alter table public.profile_topics enable row level security;
create policy "users manage their own topic picks"
  on public.profile_topics for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

alter table public.profile_formats enable row level security;
create policy "users manage their own format picks"
  on public.profile_formats for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Dead tables: no longer referenced by any shipped screen (the only
--    references to child_invite_codes are in archive/src/screens/
--    AddChildByCode.js and ChildInviteCode.js, both replaced by the new
--    family-linking system). self_care_history has no owner column
--    (no user_id/profile_id) and no references anywhere in the app, so RLS
--    cannot yet be scoped per-user on it even if something starts using it.
--
--    Enabling RLS with zero policies denies ALL direct client access (both
--    anon and authenticated keys) while leaving service_role/dashboard
--    access untouched. This is safe today because nothing in the shipped
--    app queries either table. If either table is revived for a real
--    feature, add the owner column (self_care_history) and real
--    owner-scoped policies (child_invite_codes: child_id = auth.uid(), or
--    better, route access through a SECURITY DEFINER RPC like the app's
--    other invite/redeem flows) before re-exposing them to the client.

alter table public.child_invite_codes enable row level security;
alter table public.self_care_history enable row level security;
