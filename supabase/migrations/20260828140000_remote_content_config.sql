-- Remote content + feature flags — ship app updates without an app-store
-- build. Two tables:
--
--   app_config  — feature flags & small app-wide settings. The app fetches
--                 this once at launch (RemoteConfigContext) and re-checks
--                 it lets you turn a feature on/off, or flip maintenance
--                 mode, for every user instantly by editing a row here.
--
--   app_content — a generic pool of editable content, one row per item,
--                 grouped by `type`. The app already reads a few tables
--                 like this (missions, planner_components) — this extends
--                 the same pattern to quotes, tips, announcements, and the
--                 Resources "Discover" catalog. Add/edit/deactivate rows
--                 any time; the app picks it up on next fetch, no build.
--
-- Both tables are public-read (anon + authenticated) and admin-write only —
-- there is no insert/update/delete policy, so RLS blocks writes from the
-- app entirely. Edit content via the Supabase Table Editor / SQL editor.
-- NEVER put secrets in app_config.value — it is readable by every client.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push` if you
-- use the CLI locally with this project linked. Nothing in the app applies
-- it automatically.

-- ── app_config: feature flags & remote settings ─────────────────────────────

create table if not exists public.app_config (
  key         text primary key,
  value       jsonb,
  enabled     boolean not null default true,
  description text,
  updated_at  timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "app_config readable by everyone" on public.app_config;
create policy "app_config readable by everyone"
  on public.app_config for select
  to anon, authenticated
  using (true);

-- Keeps updated_at honest without every writer having to remember it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_config_touch_updated_at on public.app_config;
create trigger app_config_touch_updated_at
  before update on public.app_config
  for each row execute function public.touch_updated_at();

-- Seed flags — flip `enabled` in the dashboard to change behavior for
-- every user with no build. `value` carries any extra data a flag needs.
insert into public.app_config (key, value, enabled, description) values
  ('show_leaderboard',    null,                                                true,  'Shows the "View Leaderboard" button on the Training screen.'),
  ('maintenance_mode',    jsonb_build_object('message', 'Chill is getting a quick tune-up. Back in a few minutes.'), false, 'When enabled, blocks the whole app behind a maintenance screen showing value.message.'),
  ('min_supported_build', jsonb_build_object('build', 1),                                                    true,  'Reserved for a future forced-update gate — not enforced by the app yet.')
on conflict (key) do nothing;

-- ── app_content: quotes, tips, announcements, featured resources, etc. ─────

create table if not exists public.app_content (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,           -- 'quote' | 'tip' | 'announcement' | 'featured_resource' | ...
  key        text,                    -- optional grouping (e.g. life-area id for tips/resources)
  title      text,
  body       text,
  meta       jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  active     boolean not null default true,
  starts_at  timestamptz,             -- optional scheduling window, mainly for announcements
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_content_type_idx on public.app_content (type, active, sort_order);
create index if not exists app_content_type_key_idx on public.app_content (type, key);

alter table public.app_content enable row level security;

-- Only ever exposes rows that are active AND currently inside their
-- scheduling window (or have no window at all) — the client doesn't need
-- to duplicate that date logic, the query just won't return the row yet.
drop policy if exists "app_content readable when active" on public.app_content;
create policy "app_content readable when active"
  on public.app_content for select
  to anon, authenticated
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
  );

drop trigger if exists app_content_touch_updated_at on public.app_content;
create trigger app_content_touch_updated_at
  before update on public.app_content
  for each row execute function public.touch_updated_at();

-- Seed: the daily-quotes pool, migrated from the hardcoded list that used
-- to live in HomeScreen.js. meta.author holds the attribution.
insert into public.app_content (type, key, title, body, meta, sort_order) values
  ('quote', NULL, NULL, 'The secret of getting ahead is getting started.', jsonb_build_object('author', 'Mark Twain'), 0),
  ('quote', NULL, NULL, 'It does not matter how slowly you go as long as you do not stop.', jsonb_build_object('author', 'Confucius'), 1),
  ('quote', NULL, NULL, 'Knowledge is power.', jsonb_build_object('author', 'Francis Bacon'), 2),
  ('quote', NULL, NULL, 'An investment in knowledge pays the best interest.', jsonb_build_object('author', 'Benjamin Franklin'), 3),
  ('quote', NULL, NULL, 'The beautiful thing about learning is nobody can take it away from you.', jsonb_build_object('author', 'B.B. King'), 4),
  ('quote', NULL, NULL, 'Education is the most powerful weapon which you can use to change the world.', jsonb_build_object('author', 'Nelson Mandela'), 5),
  ('quote', NULL, NULL, 'Live as if you were to die tomorrow. Learn as if you were to live forever.', jsonb_build_object('author', 'Mahatma Gandhi'), 6),
  ('quote', NULL, NULL, 'The more that you read, the more things you will know.', jsonb_build_object('author', 'Dr. Seuss'), 7),
  ('quote', NULL, NULL, 'Develop a passion for learning. If you do, you will never cease to grow.', jsonb_build_object('author', 'Anthony J. D''Angelo'), 8),
  ('quote', NULL, NULL, 'The mind is not a vessel to be filled but a fire to be kindled.', jsonb_build_object('author', 'Plutarch'), 9),
  ('quote', NULL, NULL, 'Learning never exhausts the mind.', jsonb_build_object('author', 'Leonardo da Vinci'), 10),
  ('quote', NULL, NULL, 'Wisdom is not a product of schooling but of the lifelong attempt to acquire it.', jsonb_build_object('author', 'Albert Einstein'), 11),
  ('quote', NULL, NULL, 'The only way to do great work is to love what you do.', jsonb_build_object('author', 'Steve Jobs'), 12),
  ('quote', NULL, NULL, 'Success is the sum of small efforts repeated day in and day out.', jsonb_build_object('author', 'Robert Collier'), 13),
  ('quote', NULL, NULL, 'Real knowledge is to know the extent of one''s ignorance.', jsonb_build_object('author', 'Confucius'), 14)
on conflict do nothing;

-- Seed: the Resources → Discover catalog, migrated from the hardcoded
-- CATALOG in resourcetools.js. `key` is the life-area id used for the
-- filter chips; meta.url/emoji feed the card, meta.legacy_id is just kept
-- for traceability back to the old hardcoded ids.
insert into public.app_content (type, key, title, body, meta, sort_order) values
  ('featured_resource', 'general', 'Wikipedia', 'The free encyclopedia', jsonb_build_object('url', 'https://www.wikipedia.org', 'emoji', '🌐', 'legacy_id', 'g1'), 0),
  ('featured_resource', 'general', 'Wolfram Alpha', 'Computational knowledge engine', jsonb_build_object('url', 'https://www.wolframalpha.com', 'emoji', '🔢', 'legacy_id', 'g2'), 1),
  ('featured_resource', 'general', 'Khan Academy', 'Free courses on every subject', jsonb_build_object('url', 'https://www.khanacademy.org', 'emoji', '📚', 'legacy_id', 'g3'), 2),
  ('featured_resource', 'general', 'Coursera', 'University courses online', jsonb_build_object('url', 'https://www.coursera.org', 'emoji', '🎓', 'legacy_id', 'g4'), 3),
  ('featured_resource', 'general', 'edX', 'Free courses from top universities', jsonb_build_object('url', 'https://www.edx.org', 'emoji', '🏛️', 'legacy_id', 'g5'), 4),
  ('featured_resource', 'general', 'Google Scholar', 'Search academic papers & citations', jsonb_build_object('url', 'https://scholar.google.com', 'emoji', '🔎', 'legacy_id', 'g6'), 5),
  ('featured_resource', 'general', 'Archive.org', 'Free books, media & web history', jsonb_build_object('url', 'https://archive.org', 'emoji', '🗄️', 'legacy_id', 'g7'), 6),
  ('featured_resource', 'general', 'Duolingo', 'Learn a new language for free', jsonb_build_object('url', 'https://www.duolingo.com', 'emoji', '🦉', 'legacy_id', 'g8'), 7),
  ('featured_resource', 'general', 'TED', 'Ideas worth spreading, in talk form', jsonb_build_object('url', 'https://www.ted.com', 'emoji', '🎤', 'legacy_id', 'g9'), 8),
  ('featured_resource', 'general', 'Notion', 'Notes, docs & project management', jsonb_build_object('url', 'https://www.notion.so', 'emoji', '📝', 'legacy_id', 'g10'), 9),
  ('featured_resource', 'general', 'Claude', 'AI assistant for research & writing', jsonb_build_object('url', 'https://claude.ai', 'emoji', '🤖', 'legacy_id', 'g11'), 10),
  ('featured_resource', 'general', 'Grammarly', 'Writing & grammar assistant', jsonb_build_object('url', 'https://www.grammarly.com', 'emoji', '✍️', 'legacy_id', 'g12'), 11),
  ('featured_resource', 'general', 'YouTube', 'Video tutorials on anything', jsonb_build_object('url', 'https://www.youtube.com', 'emoji', '🎬', 'legacy_id', 'g13'), 12),
  ('featured_resource', 'general', 'Google Sheets', 'Free spreadsheets', jsonb_build_object('url', 'https://sheets.google.com', 'emoji', '📊', 'legacy_id', 'g14'), 13),
  ('featured_resource', 'physical', 'MyFitnessPal', 'Track meals, calories & macros', jsonb_build_object('url', 'https://www.myfitnesspal.com', 'emoji', '🍎', 'legacy_id', 'p1'), 14),
  ('featured_resource', 'physical', 'Strava', 'Track runs, rides & workouts', jsonb_build_object('url', 'https://www.strava.com', 'emoji', '🏃', 'legacy_id', 'p2'), 15),
  ('featured_resource', 'physical', 'Mayo Clinic', 'Trusted medical information', jsonb_build_object('url', 'https://www.mayoclinic.org', 'emoji', '🩺', 'legacy_id', 'p3'), 16),
  ('featured_resource', 'physical', 'Sleep Foundation', 'Sleep science & better rest', jsonb_build_object('url', 'https://www.sleepfoundation.org', 'emoji', '😴', 'legacy_id', 'p4'), 17),
  ('featured_resource', 'physical', 'CDC: Physical Activity', 'Exercise guidelines & health tips', jsonb_build_object('url', 'https://www.cdc.gov/physical-activity/index.html', 'emoji', '🏋️', 'legacy_id', 'p5'), 18),
  ('featured_resource', 'physical', 'WebMD', 'Symptoms, conditions & health news', jsonb_build_object('url', 'https://www.webmd.com', 'emoji', '💊', 'legacy_id', 'p6'), 19),
  ('featured_resource', 'mental', 'Headspace', 'Guided meditation & mindfulness', jsonb_build_object('url', 'https://www.headspace.com', 'emoji', '🧘', 'legacy_id', 'm1'), 20),
  ('featured_resource', 'mental', 'Calm', 'Sleep, meditation & relaxation', jsonb_build_object('url', 'https://www.calm.com', 'emoji', '🌙', 'legacy_id', 'm2'), 21),
  ('featured_resource', 'mental', 'BetterHelp', 'Online therapy & counseling', jsonb_build_object('url', 'https://www.betterhelp.com', 'emoji', '💬', 'legacy_id', 'm3'), 22),
  ('featured_resource', 'mental', 'Psychology Today', 'Find therapists & mental health articles', jsonb_build_object('url', 'https://www.psychologytoday.com', 'emoji', '🧠', 'legacy_id', 'm4'), 23),
  ('featured_resource', 'mental', 'NAMI', 'Mental health support & education', jsonb_build_object('url', 'https://www.nami.org', 'emoji', '🤝', 'legacy_id', 'm5'), 24),
  ('featured_resource', 'mental', '7 Cups', 'Free emotional support & listening', jsonb_build_object('url', 'https://www.7cups.com', 'emoji', '👂', 'legacy_id', 'm6'), 25),
  ('featured_resource', 'social', 'Meetup', 'Find local groups & events', jsonb_build_object('url', 'https://www.meetup.com', 'emoji', '👥', 'legacy_id', 's1'), 26),
  ('featured_resource', 'social', 'Nextdoor', 'Connect with your local neighborhood', jsonb_build_object('url', 'https://nextdoor.com', 'emoji', '🏘️', 'legacy_id', 's2'), 27),
  ('featured_resource', 'social', 'Eventbrite', 'Discover events near you', jsonb_build_object('url', 'https://www.eventbrite.com', 'emoji', '🎟️', 'legacy_id', 's3'), 28),
  ('featured_resource', 'social', 'Bumble BFF', 'Make new friends', jsonb_build_object('url', 'https://bumble.com/bff', 'emoji', '🐝', 'legacy_id', 's4'), 29),
  ('featured_resource', 'social', 'InterNations', 'Global community & expat network', jsonb_build_object('url', 'https://www.internations.org', 'emoji', '🌍', 'legacy_id', 's5'), 30),
  ('featured_resource', 'financial', 'NerdWallet', 'Personal finance advice & tools', jsonb_build_object('url', 'https://www.nerdwallet.com', 'emoji', '💳', 'legacy_id', 'f1'), 31),
  ('featured_resource', 'financial', 'Investopedia', 'Learn investing & finance terms', jsonb_build_object('url', 'https://www.investopedia.com', 'emoji', '📈', 'legacy_id', 'f2'), 32),
  ('featured_resource', 'financial', 'YNAB', 'Zero-based budgeting tool', jsonb_build_object('url', 'https://www.ynab.com', 'emoji', '🧾', 'legacy_id', 'f3'), 33),
  ('featured_resource', 'financial', 'Credit Karma', 'Free credit score & monitoring', jsonb_build_object('url', 'https://www.creditkarma.com', 'emoji', '📉', 'legacy_id', 'f4'), 34),
  ('featured_resource', 'financial', 'Investor.gov', 'Official U.S. investor education', jsonb_build_object('url', 'https://www.investor.gov', 'emoji', '🏦', 'legacy_id', 'f5'), 35),
  ('featured_resource', 'financial', 'Bankrate', 'Compare rates & financial products', jsonb_build_object('url', 'https://www.bankrate.com', 'emoji', '💵', 'legacy_id', 'f6'), 36),
  ('featured_resource', 'creative', 'Skillshare', 'Creative classes on everything', jsonb_build_object('url', 'https://www.skillshare.com', 'emoji', '🎨', 'legacy_id', 'c1'), 37),
  ('featured_resource', 'creative', 'Behance', 'Showcase & discover creative work', jsonb_build_object('url', 'https://www.behance.net', 'emoji', '🖼️', 'legacy_id', 'c2'), 38),
  ('featured_resource', 'creative', 'Domestika', 'Courses for creative professionals', jsonb_build_object('url', 'https://www.domestika.org', 'emoji', '✏️', 'legacy_id', 'c3'), 39),
  ('featured_resource', 'creative', 'MasterClass', 'Learn from the best in their field', jsonb_build_object('url', 'https://www.masterclass.com', 'emoji', '🎬', 'legacy_id', 'c4'), 40),
  ('featured_resource', 'creative', 'Pinterest', 'Visual inspiration & mood boards', jsonb_build_object('url', 'https://www.pinterest.com', 'emoji', '📌', 'legacy_id', 'c5'), 41),
  ('featured_resource', 'creative', 'SoundCloud', 'Share & discover music', jsonb_build_object('url', 'https://soundcloud.com', 'emoji', '🎵', 'legacy_id', 'c6'), 42),
  ('featured_resource', 'professional', 'LinkedIn', 'Professional networking', jsonb_build_object('url', 'https://www.linkedin.com', 'emoji', '💼', 'legacy_id', 'pr1'), 43),
  ('featured_resource', 'professional', 'LinkedIn Learning', 'Career & business courses', jsonb_build_object('url', 'https://www.linkedin.com/learning', 'emoji', '📖', 'legacy_id', 'pr2'), 44),
  ('featured_resource', 'professional', 'Glassdoor', 'Company reviews & salaries', jsonb_build_object('url', 'https://www.glassdoor.com', 'emoji', '🏢', 'legacy_id', 'pr3'), 45),
  ('featured_resource', 'professional', 'Indeed', 'Job search', jsonb_build_object('url', 'https://www.indeed.com', 'emoji', '🔍', 'legacy_id', 'pr4'), 46),
  ('featured_resource', 'professional', 'freeCodeCamp', 'Learn to code for free', jsonb_build_object('url', 'https://www.freecodecamp.org', 'emoji', '💻', 'legacy_id', 'pr5'), 47),
  ('featured_resource', 'professional', 'The Muse', 'Career advice & job search', jsonb_build_object('url', 'https://www.themuse.com', 'emoji', '🚀', 'legacy_id', 'pr6'), 48),
  ('featured_resource', 'spiritual', 'Bible Gateway', 'Read scripture in any translation', jsonb_build_object('url', 'https://www.biblegateway.com', 'emoji', '📖', 'legacy_id', 'sp1'), 49),
  ('featured_resource', 'spiritual', 'Insight Timer', 'Free meditation & mindfulness', jsonb_build_object('url', 'https://insighttimer.com', 'emoji', '⏱️', 'legacy_id', 'sp2'), 50),
  ('featured_resource', 'spiritual', 'Tricycle', 'Buddhist teachings & practice', jsonb_build_object('url', 'https://tricycle.org', 'emoji', '☸️', 'legacy_id', 'sp3'), 51),
  ('featured_resource', 'spiritual', 'YouVersion Bible App', 'Bible reading plans', jsonb_build_object('url', 'https://www.bible.com', 'emoji', '✨', 'legacy_id', 'sp4'), 52),
  ('featured_resource', 'spiritual', 'Plum Village', 'Mindfulness practice community', jsonb_build_object('url', 'https://plumvillage.org', 'emoji', '🪷', 'legacy_id', 'sp5'), 53),
  ('featured_resource', 'digital', 'Have I Been Pwned', 'Check if your data was breached', jsonb_build_object('url', 'https://haveibeenpwned.com', 'emoji', '🔓', 'legacy_id', 'd1'), 54),
  ('featured_resource', 'digital', '1Password', 'Password manager', jsonb_build_object('url', 'https://1password.com', 'emoji', '🔑', 'legacy_id', 'd2'), 55),
  ('featured_resource', 'digital', 'EFF', 'Digital rights & privacy advocacy', jsonb_build_object('url', 'https://www.eff.org', 'emoji', '🛡️', 'legacy_id', 'd3'), 56),
  ('featured_resource', 'digital', 'Proton Mail', 'Private, encrypted email', jsonb_build_object('url', 'https://proton.me', 'emoji', '✉️', 'legacy_id', 'd4'), 57),
  ('featured_resource', 'digital', 'Freedom', 'Block distractions & apps', jsonb_build_object('url', 'https://freedom.to', 'emoji', '⏳', 'legacy_id', 'd5'), 58)
on conflict do nothing;

-- Seed: one disabled sample announcement, showing the shape to fill in.
-- Flip `active` to true (and set start/end dates if you want it timed) to
-- put a banner in front of every user without a build.
insert into public.app_content (type, key, title, body, meta, sort_order, active) values
  ('announcement', 'sample', '🎉 New feature dropped', 'Describe what changed here — this banner is off by default (active=false). Flip it on any time.', jsonb_build_object('tone', 'info'), 0, false)
on conflict do nothing;
