-- Discover — the community layer behind the Library's Discover section.
--
-- Follows the same shape as 20260826_leaderboard.sql and
-- 20260901120000_institutional_layer.sql: every table is RLS-enabled with
-- ZERO policies (so no client can touch it directly) and all reads/writes go
-- through the SECURITY DEFINER functions below, each returning an explicit
-- column allowlist rather than a full row.
--
-- ─── Child safety ──────────────────────────────────────────────────────────
-- This app has minors in it, so cross-user visibility is deliberately narrow:
--
--   * Minors are never SURFACED to other users. get_fellow_scholars and every
--     feed exclude them, so a child's name/level can't be browsed by a
--     stranger. Same rule get_leaderboard already applies.
--   * Minors cannot PUBLISH to a public feed, and cannot contact a mentor.
--     Both RPCs raise instead. They can still read.
--   * There is no direct messaging anywhere in here. The only user-to-user
--     channel is a mentor request, which is a single structured row an adult
--     mentor receives — not a chat.
--   * Every feed supports report + block, which Apple requires of any app
--     with user-generated content (App Review 1.2).
--
-- The age test is is_restricted_account() below, and it FAILS SAFE: is_minor,
-- then date_of_birth, then restricted. It deliberately does NOT use
-- role = 'child' the way get_leaderboard does — nothing in this app ever writes
-- that value to profiles.role (the only observed value is 'student'), so that
-- check protects nobody today and get_leaderboard should be revisited.
--
-- Consequence worth knowing: an account with neither is_minor nor
-- date_of_birth is treated as a minor, so it can read everything but cannot
-- post or be listed. Onboarding records both, so this only affects accounts
-- predating that step. Backfill them before launch:
--   update public.profiles
--      set is_minor = (date_of_birth > current_date - interval '18 years')
--    where is_minor is null and date_of_birth is not null;
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`. Nothing in
-- the app applies it automatically — until it is applied, every Discover
-- screen shows a "not set up yet" state instead of failing (same pattern as
-- LEADERBOARD_NOT_CONFIGURED).

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- One table for all three post-shaped sections rather than three near-identical
-- ones. `kind` is the discriminator the feed screens filter on:
--   breakthrough — "I figured something out" / a discovery worth sharing
--   showcase     — finished work put forward for Top Talent
--   project      — an open project looking for collaborators
create table if not exists public.community_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('breakthrough', 'showcase', 'project')),
  title      text not null check (char_length(trim(title)) between 1 and 140),
  body       text check (char_length(body) <= 2000),
  link       text check (link is null or link ~* '^https?://'),
  tags       text[] not null default '{}',
  -- Soft moderation states. 'hidden' is what an accumulation of reports flips a
  -- post to; nothing is ever hard-deleted by the report flow, so a false
  -- report is reversible.
  state      text not null default 'visible' check (state in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists community_posts_kind_created_idx
  on public.community_posts (kind, created_at desc) where state = 'visible';
create index if not exists community_posts_user_idx
  on public.community_posts (user_id, created_at desc);

create table if not exists public.community_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null check (char_length(reason) <= 500),
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)   -- one report per person per post
);

-- A block is one-directional and hides the blocked user's posts from the
-- blocker's feeds. Deliberately not symmetric: blocking someone shouldn't tell
-- them they've been blocked by making their own feed change.
create table if not exists public.community_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Mentors: mentorService.js was already written against these two tables, but
-- they were created by hand in the dashboard and have no migration — so their
-- RLS state is unknown and unversioned. Created here if missing, and locked
-- down either way.
create table if not exists public.mentors (
  id           uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  bio          text check (char_length(bio) <= 1000),
  subjects     text[] not null default '{}',
  hourly_rate  numeric(10,2),
  rating       numeric(3,2) default 0,
  rating_count int default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.mentor_requests (
  id           uuid primary key default gen_random_uuid(),
  mentor_id    uuid not null references public.mentors(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message      text check (char_length(message) <= 1000),
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now()
);

alter table public.community_posts   enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_blocks  enable row level security;
alter table public.mentors           enable row level security;
alter table public.mentor_requests   enable row level security;
-- Intentionally no policies on any of the above: everything goes through the
-- SECURITY DEFINER functions below.

-- ─── Shared helper ──────────────────────────────────────────────────────────

-- True when this account must not be surfaced to, or allowed to broadcast to,
-- other users. Kept as one function so the rule cannot drift between callers.
create or replace function public.is_restricted_account(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    -- Known minor.
    when p.is_minor is true then true
    -- is_minor wasn't always collected. Fall back to date_of_birth, which
    -- onboarding records alongside it.
    when p.date_of_birth is not null
      then p.date_of_birth > (current_date - interval '18 years')
    -- Age genuinely unknown: fail SAFE. An account we can't age-check is not
    -- surfaced to strangers and cannot broadcast — it can still read
    -- everything. NOTE this deliberately differs from get_leaderboard, which
    -- keys off role = 'child'; nothing in the app ever writes that value, so
    -- that check protects nobody and this one does not rely on it.
    else true
  end
  from public.profiles p where p.id = p_user_id;
$$;

comment on function public.is_restricted_account(uuid) is
  'True when an account must not be surfaced to other users or allowed to broadcast. Fails safe: unknown age counts as restricted.';

-- profiles.topics is written as an array by onboarding but read elsewhere as a
-- comma string, and the column type isn't pinned by any migration. Casting to
-- text at the call site and parsing here handles both shapes: a text[] casts to
-- '{a,b}' (quoted where needed) and a plain text column casts to itself.
create or replace function public.topics_array(p_topics text)
returns text[]
language sql
immutable
as $$
  select coalesce(array(
    select btrim(btrim(lower(x)), '"')
    from unnest(regexp_split_to_array(btrim(coalesce(p_topics, ''), '{}'), ',')) as x
    where btrim(btrim(lower(x)), '"') <> ''
  ), '{}'::text[]);
$$;

-- How many of `a` also appear in `b`. Taking both sides as plain array
-- parameters keeps the comparison in the ANY(array) form; writing it inline as
-- `x = any((select ...))` makes Postgres choose ANY(subquery) instead and fail
-- with "operator does not exist: text = text[]".
create or replace function public.shared_topic_count(a text[], b text[])
returns int
language sql
immutable
as $$
  select count(*)::int from unnest(coalesce(a, '{}'::text[])) x
  where x = any(coalesce(b, '{}'::text[]));
$$;

-- ─── Automated moderation ───────────────────────────────────────────────────
--
-- App Review 1.2 and Play's UGC policy both want a filter that acts BEFORE
-- content is visible, not only a report button after the fact. This runs inside
-- publish_community_post, so it applies to the RPC itself and can't be skipped
-- by calling the API directly.
--
-- Two severities, because "reject" and "quarantine" are different tools:
--   block  — refuse the insert outright; the author is told and can edit.
--   review — accept it but land it as state='hidden', so it is never publicly
--            visible until an admin approves it from the moderation queue.
--
-- A table rather than a hardcoded array, so terms can be added the moment
-- something gets through, with no redeploy.
--
-- HONEST LIMITATION: a keyword list is a floor, not a ceiling. It does not
-- survive deliberate evasion (leetspeak, spacing, unicode lookalikes) and has
-- no notion of context. It satisfies "there is an automated filter" for review
-- purposes; for real coverage, call a moderation API (OpenAI's moderations
-- endpoint is free; Perspective API is free at low volume) from an edge
-- function and write its verdict into the same state column this uses.
create table if not exists public.moderation_blocklist (
  pattern    text primary key,
  severity   text not null default 'block' check (severity in ('block', 'review')),
  is_regex   boolean not null default false,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.moderation_blocklist enable row level security;

-- Seeded with two categories that are unambiguous and safe to enumerate:
-- ordinary profanity, and contact-exfiltration patterns. Slur and hate-speech
-- terms are deliberately NOT listed here — add them directly to this table for
-- your own audience, or defer that class to a moderation API, which handles
-- variants far better than a literal list ever will.
--
-- The contact patterns matter more than the swear words for an app with minors
-- in it: an adult steering a child off-platform is the actual risk a reviewer
-- probes for, and nothing the app controls can see what happens after that.
insert into public.moderation_blocklist (pattern, severity, is_regex, note) values
  ('fuck',    'review', false, 'profanity — quarantine, not an auto-reject'),
  ('shit',    'review', false, 'profanity'),
  ('bitch',   'review', false, 'profanity'),
  ('asshole', 'review', false, 'profanity'),
  ('cunt',    'block',  false, 'severe profanity'),
  ('[[:digit:]]{3}[-. ]?[[:digit:]]{3}[-. ]?[[:digit:]]{4}',           'review', true, 'phone number'),
  ('[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,}',               'review', true, 'email address'),
  ('(snap|snapchat|kik|whatsapp|telegram|discord)[[:space:]]*(me|:|@)','review', true, 'off-platform contact request'),
  ('(dm|pm|text|message)[[:space:]]+me[[:space:]]+(on|at)',            'review', true, 'off-platform contact request'),
  ('add[[:space:]]+me[[:space:]]+on',                                  'review', true, 'off-platform contact request')
on conflict (pattern) do nothing;

-- Returns 'block', 'review' or 'ok' for a chunk of user text. 'block' wins when
-- both severities match.
create or replace function public.moderation_verdict(p_text text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select case when bool_or(b.severity = 'block') then 'block' else 'review' end
      from public.moderation_blocklist b
      where case
              when b.is_regex then lower(coalesce(p_text, '')) ~ b.pattern
              -- Word-ish boundaries so "class" doesn't trip on a substring.
              else lower(coalesce(p_text, '')) ~ ('(^|[^[:alnum:]])' || b.pattern || '([^[:alnum:]]|$)')
            end
    ),
    'ok'
  );
$$;

comment on function public.moderation_verdict(text) is
  'block | review | ok for a piece of user text, per moderation_blocklist. Keyword-level only — read the table comment before relying on it alone.';

-- ─── Admin ──────────────────────────────────────────────────────────────────

-- No global admin concept existed — organization_members.role is org-scoped and
-- unrelated to this. This is the smallest thing that supports a review queue.
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Everything awaiting a human decision: auto-quarantined posts, reported posts,
-- and anything an admin previously hid. Oldest first, so the queue is worked as
-- a queue and a 24-hour review commitment is actually meetable.
create or replace function public.get_moderation_queue(p_limit int default 100)
returns table (
  id uuid, kind text, title text, body text, link text, tags text[],
  state text, created_at timestamptz,
  author_id uuid, author_name text,
  report_count int, report_reasons text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'NOT_AN_ADMIN';
  end if;

  return query
  select
    cp.id, cp.kind, cp.title, cp.body, cp.link, cp.tags, cp.state, cp.created_at,
    cp.user_id as author_id,
    coalesce(p.traveler_name, p.display_name, p.username, 'Traveler') as author_name,
    (select count(*)::int from public.community_reports r where r.post_id = cp.id) as report_count,
    (select coalesce(array_agg(distinct r.reason), '{}') from public.community_reports r where r.post_id = cp.id) as report_reasons
  from public.community_posts cp
  join public.profiles p on p.id = cp.user_id
  where cp.state = 'hidden'
     or exists (select 1 from public.community_reports r where r.post_id = cp.id)
  order by cp.created_at asc
  limit greatest(p_limit, 0);
end;
$$;

grant execute on function public.get_moderation_queue(int) to authenticated;

-- Approve ('visible') or take down ('removed'). Clearing the reports on approve
-- stops an approved post from sitting in the queue forever.
create or replace function public.admin_set_post_state(p_post_id uuid, p_state text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'NOT_AN_ADMIN';
  end if;
  if p_state not in ('visible', 'removed') then
    raise exception 'INVALID_STATE';
  end if;

  update public.community_posts set state = p_state where id = p_post_id;

  if p_state = 'visible' then
    delete from public.community_reports where post_id = p_post_id;
  end if;
end;
$$;

grant execute on function public.admin_set_post_state(uuid, text) to authenticated;

-- ─── Kudos ──────────────────────────────────────────────────────────────────
--
-- The one interaction Fellow Scholars allows. Deliberately a counter and
-- nothing else — no text, no thread, no channel to abuse — which is exactly why
-- it stays available to every account, minors included.
create table if not exists public.community_kudos (
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user, created_at),
  check (from_user <> to_user)
);

create index if not exists community_kudos_to_user_idx on public.community_kudos (to_user);
-- Leading from_user then to_user supports the once-per-day lookup in send_kudos.
create index if not exists community_kudos_pair_recent_idx on public.community_kudos (from_user, to_user, created_at desc);

alter table public.community_kudos enable row level security;

-- Rate-limited to once per recipient per 24h, so it stays a signal instead of
-- something to farm. Returns the recipient's new total.
create or replace function public.send_kudos(p_to_user uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_total int;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_to_user = auth.uid() then raise exception 'CANNOT_KUDOS_SELF'; end if;

  if exists (
    select 1 from public.community_kudos k
    where k.from_user = auth.uid() and k.to_user = p_to_user
      and k.created_at > now() - interval '24 hours'
  ) then
    raise exception 'ALREADY_SENT_TODAY';
  end if;

  insert into public.community_kudos (from_user, to_user) values (auth.uid(), p_to_user);
  select count(*)::int into v_total from public.community_kudos where to_user = p_to_user;
  return v_total;
end;
$$;

grant execute on function public.send_kudos(uuid) to authenticated;

-- ─── Feeds ──────────────────────────────────────────────────────────────────

create or replace function public.get_community_feed(p_kind text default null, p_limit int default 50)
returns table (
  id uuid, kind text, title text, body text, link text, tags text[],
  created_at timestamptz,
  author_id uuid, author_name text, author_level int, author_badge text, author_color text,
  is_mine boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    cp.id, cp.kind, cp.title, cp.body, cp.link, cp.tags, cp.created_at,
    cp.user_id as author_id,
    coalesce(p.traveler_name, p.display_name, p.username, 'Traveler') as author_name,
    coalesce(p.level, 1)  as author_level,
    p.badge               as author_badge,
    p.suit_color          as author_color,
    (cp.user_id = auth.uid()) as is_mine
  from public.community_posts cp
  join public.profiles p on p.id = cp.user_id
  -- p_kind null = every kind, which is what the unified feed's "All Posts"
  -- tab reads. Splitting one small community across three separate screens
  -- made each look emptier than the community actually is.
  where (p_kind is null or cp.kind = p_kind)
    and cp.state = 'visible'
    -- Authors who are minors are never listed publicly, even if a post of
    -- theirs predates that rule.
    and not public.is_restricted_account(cp.user_id)
    -- Anyone the viewer has blocked disappears from their feed.
    and not exists (
      select 1 from public.community_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = cp.user_id
    )
  order by cp.created_at desc
  limit greatest(p_limit, 0);
$$;

comment on function public.get_community_feed(text, int) is
  'Visible posts of one kind, newest first. Excludes minors, blocked users and hidden posts. SECURITY DEFINER — returns only post fields plus the author public identity.';

grant execute on function public.get_community_feed(text, int) to authenticated;

-- Top Talent: showcase posts ranked by their author's standing rather than
-- recency, so the section means "exceptional work" and not "latest work".
create or replace function public.get_top_talent(p_limit int default 30)
returns table (
  id uuid, title text, body text, link text, tags text[], created_at timestamptz,
  author_id uuid, author_name text, author_level int, author_points int,
  author_badge text, author_color text, is_mine boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    cp.id, cp.title, cp.body, cp.link, cp.tags, cp.created_at,
    cp.user_id as author_id,
    coalesce(p.traveler_name, p.display_name, p.username, 'Traveler') as author_name,
    coalesce(p.level, 1)  as author_level,
    coalesce(p.points, 0) as author_points,
    p.badge as author_badge, p.suit_color as author_color,
    (cp.user_id = auth.uid()) as is_mine
  from public.community_posts cp
  join public.profiles p on p.id = cp.user_id
  where cp.kind = 'showcase'
    and cp.state = 'visible'
    and not public.is_restricted_account(cp.user_id)
    and not exists (
      select 1 from public.community_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = cp.user_id
    )
  order by coalesce(p.points, 0) desc, cp.created_at desc
  limit greatest(p_limit, 0);
$$;

grant execute on function public.get_top_talent(int) to authenticated;

-- Fellow Scholars: people whose declared topics overlap the caller's. No posts
-- involved, and no contact channel — this is discovery, not messaging.
-- get_fellow_scholars gained two columns (kudos_received, kudos_sent_recently).
-- CREATE OR REPLACE cannot change a function's return type — Postgres raises
-- "cannot change return type of existing function" — and an earlier version of
-- this migration has already been applied to at least one project. Dropping
-- first makes the whole file safely re-runnable.
drop function if exists public.get_fellow_scholars(int);

create or replace function public.get_fellow_scholars(p_limit int default 40)
returns table (
  id uuid, display_name text, level int, badge text, suit_color text,
  topics text, shared_topics int, kudos_received int, kudos_sent_recently boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select public.topics_array(topics::text) as my_topics
    from public.profiles where id = auth.uid()
  )
  select
    p.id,
    coalesce(p.traveler_name, p.display_name, p.username, 'Traveler') as display_name,
    coalesce(p.level, 1) as level,
    p.badge, p.suit_color, p.topics::text as topics,
    -- Passing the CTE through as a function argument, rather than unnesting a
    -- correlated `p.topics` inside a select-list subquery, keeps this a plain
    -- scalar expression — no LATERAL semantics to depend on and no ANY()
    -- parse ambiguity.
    public.shared_topic_count(
      public.topics_array(p.topics::text),
      (select my_topics from me)
    ) as shared_topics,
    (select count(*)::int from public.community_kudos k where k.to_user = p.id) as kudos_received,
    exists (
      select 1 from public.community_kudos k
      where k.from_user = auth.uid() and k.to_user = p.id
        and k.created_at > now() - interval '24 hours'
    ) as kudos_sent_recently
  from public.profiles p
  where p.id <> auth.uid()
    and not public.is_restricted_account(p.id)
    and coalesce(p.onboarding_completed, false)
    and not exists (
      select 1 from public.community_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = p.id
    )
  order by shared_topics desc, coalesce(p.points, 0) desc
  limit greatest(p_limit, 0);
$$;

grant execute on function public.get_fellow_scholars(int) to authenticated;

-- ─── Writes ─────────────────────────────────────────────────────────────────

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
  -- The gate that keeps minors from broadcasting to strangers.
  if public.is_restricted_account(auth.uid()) then
    raise exception 'MINORS_CANNOT_PUBLISH';
  end if;

  -- Automated filter, before the row exists. 'block' never reaches the table;
  -- 'review' is written straight to state='hidden', so it is never publicly
  -- visible and lands in the admin queue instead.
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

grant execute on function public.publish_community_post(text, text, text, text, text[]) to authenticated;

create or replace function public.delete_my_community_post(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.community_posts
     set state = 'removed'
   where id = p_post_id and user_id = auth.uid();
$$;

grant execute on function public.delete_my_community_post(uuid) to authenticated;

-- Reporting. Three distinct reporters auto-hide a post pending review, so
-- obviously bad content stops spreading without waiting on a human — while a
-- single malicious report cannot take anything down.
create or replace function public.report_community_post(p_post_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;

  insert into public.community_reports (post_id, reporter_id, reason)
  values (p_post_id, auth.uid(), left(coalesce(p_reason, 'unspecified'), 500))
  on conflict (post_id, reporter_id) do nothing;

  update public.community_posts cp
     set state = 'hidden'
   where cp.id = p_post_id
     and cp.state = 'visible'
     and (select count(*) from public.community_reports r where r.post_id = p_post_id) >= 3;
end;
$$;

grant execute on function public.report_community_post(uuid, text) to authenticated;

create or replace function public.block_community_user(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.community_blocks (blocker_id, blocked_id)
  select auth.uid(), p_user_id
  where auth.uid() is not null and auth.uid() <> p_user_id
  on conflict do nothing;
$$;

grant execute on function public.block_community_user(uuid) to authenticated;

create or replace function public.unblock_community_user(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.community_blocks
   where blocker_id = auth.uid() and blocked_id = p_user_id;
$$;

grant execute on function public.unblock_community_user(uuid) to authenticated;

-- ─── Mentors ────────────────────────────────────────────────────────────────

create or replace function public.get_mentors(p_subject text default null, p_limit int default 50)
returns table (
  id uuid, display_name text, bio text, subjects text[],
  hourly_rate numeric, rating numeric, rating_count int, already_requested boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id, m.display_name, m.bio, m.subjects, m.hourly_rate, m.rating, m.rating_count,
    exists (
      select 1 from public.mentor_requests mr
      where mr.mentor_id = m.id and mr.requester_id = auth.uid()
    ) as already_requested
  from public.mentors m
  where m.is_active
    -- A mentor is an adult by definition; this also stops a minor's profile
    -- ever being listed here if a mentors row were somehow created for one.
    and not public.is_restricted_account(m.id)
    and (p_subject is null or m.subjects @> array[p_subject])
    and not exists (
      select 1 from public.community_blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = m.id
    )
  order by m.rating desc nulls last, m.rating_count desc
  limit greatest(p_limit, 0);
$$;

grant execute on function public.get_mentors(text, int) to authenticated;

create or replace function public.request_mentor(p_mentor_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  -- A minor cannot open a channel to an adult stranger. If mentorship for
  -- students is wanted later, it belongs in the family/organization layer
  -- where a parent or teacher is already accountable for the relationship —
  -- not in an open marketplace.
  if public.is_restricted_account(auth.uid()) then
    raise exception 'MINORS_CANNOT_REQUEST_MENTORS';
  end if;

  -- A mentor request is the one message that reaches another person, so it
  -- gets the same filter the public feeds do. There is no quarantine state for
  -- a request — it either sends or it doesn't.
  if public.moderation_verdict(coalesce(p_message, '')) = 'block' then
    raise exception 'CONTENT_BLOCKED';
  end if;

  insert into public.mentor_requests (mentor_id, requester_id, message)
  values (p_mentor_id, auth.uid(), left(coalesce(p_message, ''), 1000))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.request_mentor(uuid, text) to authenticated;

-- ─── Mentor request notification ────────────────────────────────────────────
--
-- Fires the mentor-request-notify edge function after a request is inserted, so
-- the mentor actually learns it exists. Without this, request_mentor() wrote a
-- row nobody would ever read: there is no mentor-side screen, nothing polls the
-- table, and the app has no messaging. The request went into a black hole.
--
-- Split config deliberately:
--   * app_config holds the endpoint URL and the on/off switch. Non-secret, and
--     app_config is readable by every client — see the warning at the top of
--     20260828140000_remote_content_config.sql.
--   * The shared secret that proves a call came from this database lives in
--     Supabase Vault, never in app_config.
--
-- Setup:
--   1. supabase functions deploy mentor-request-notify --no-verify-jwt
--   2. supabase secrets set RESEND_API_KEY=... MENTOR_NOTIFY_SECRET=<random>
--   3. select vault.create_secret('<same random>', 'mentor_notify_secret');
--   4. insert into public.app_config (key, value, enabled, description) values (
--        'mentor_notify',
--        jsonb_build_object('url', 'https://<project-ref>.supabase.co/functions/v1/mentor-request-notify'),
--        true,
--        'Emails a mentor when they receive a request.'
--      ) on conflict (key) do update set value = excluded.value, enabled = excluded.enabled;
--
-- Until step 4 runs with enabled=true the trigger is a no-op: requests save
-- exactly as they do today, no error and no partial send. That keeps this
-- migration applyable before any email provider exists.
--
-- The function is deployed --no-verify-jwt and authenticates solely on the
-- x-trigger-secret header, which is why no service-role key is needed here.
--
-- Requires pg_net, which Supabase ships. Fire-and-forget: a mail provider being
-- down must never roll back somebody's mentor request.
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.notify_mentor_request()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_cfg     jsonb;
  v_enabled boolean;
  v_url     text;
  v_secret  text;
begin
  select value, enabled into v_cfg, v_enabled
  from public.app_config where key = 'mentor_notify';

  if coalesce(v_enabled, false) is not true then
    return new; -- not configured yet; saving the request is still the point
  end if;

  v_url := v_cfg->>'url';
  if v_url is null then return new; end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'mentor_notify_secret' limit 1;

  perform extensions.net.http_post(
    url     := v_url,
    body    := jsonb_build_object('request_id', new.id),
    headers := jsonb_build_object(
      'content-type',     'application/json',
      'x-trigger-secret', coalesce(v_secret, '')
    )
  );
  return new;
exception when others then
  -- Never let a notification failure take the request down with it.
  raise warning 'notify_mentor_request failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists mentor_request_notify on public.mentor_requests;
create trigger mentor_request_notify
  after insert on public.mentor_requests
  for each row execute function public.notify_mentor_request();
