// scripts/gen-life-area-seed.mjs
//
// Validates src/data/lifeAreaActions.js and emits the migration that creates
// the Life Area action tables and seeds them:
//
//   area_actions       — the action pool (public read, dashboard-edited)
//   area_resources     — research links per sub-section (public read, dashboard-edited)
//   user_area_actions  — each person's edits: hide, pin, rename, retime, or add their own
//
//   node scripts/gen-life-area-seed.mjs                  validate + write the migration
//   node scripts/gen-life-area-seed.mjs --check-links    also fetch every resource URL
//   node scripts/gen-life-area-seed.mjs --json <path>    also dump the content as JSON
//
// Seed rows insert with ON CONFLICT (key) DO NOTHING. Once this is applied the
// database is the source of truth: re-running never overwrites an edit made
// in the Supabase dashboard. To change a live row, edit it there.
//
// Exits non-zero on any content-rule violation. These are kid-facing rows, so
// the checks are the point — see the header of lifeAreaActions.js for the rules.

import { readFile, writeFile } from 'node:fs/promises';

const MIGRATION = 'supabase/migrations/20260917130000_life_area_actions.sql';

async function load(path) {
  const src = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  return import('data:text/javascript,' + encodeURIComponent(src));
}

const {
  AGE_BANDS, ACTION_TIERS, ACTION_HANDLERS, RESOURCE_KINDS,
  SUBSECTIONS, AREA_ACTIONS, AREA_RESOURCES,
} = await load('src/data/lifeAreaActions.js');

const args = process.argv.slice(2);
const checkLinks = args.includes('--check-links');
const jsonIdx = args.indexOf('--json');
const jsonOut = jsonIdx >= 0 ? args[jsonIdx + 1] : null;

const AREAS = ['physical', 'mental', 'social', 'financial', 'creative', 'professional', 'spiritual', 'digital'];
const PERSONAS = ['PERSONAL', 'STUDENT', 'BUSINESS', 'ENTREPRENEUR'];
const COSTS = ['free', 'freemium', 'paid'];

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

/* ─── Actions ─────────────────────────────────────────────────────────────── */

const seen = new Set();
for (const a of AREA_ACTIONS) {
  const id = a.key;
  if (!/^[a-z0-9]+\.[a-z0-9-]+$/.test(id)) err(`${id}: key must be prefix.slug, lower-case`);
  if (seen.has(id)) err(`${id}: duplicate key`);
  seen.add(id);
  if (!SUBSECTIONS[a.screen_tag]) err(`${id}: unknown screen_tag ${a.screen_tag}`);
  if (!AREAS.includes(a.area_id)) err(`${id}: bad area_id ${a.area_id}`);
  if (!ACTION_TIERS.includes(a.tier)) err(`${id}: bad tier ${a.tier}`);
  if (!ACTION_HANDLERS.includes(a.handler)) err(`${id}: bad handler ${a.handler}`);
  if (!a.age_bands.length || a.age_bands.some(b => !AGE_BANDS.includes(b))) err(`${id}: bad age_bands`);
  if (a.boost_personas.some(p => !PERSONAS.includes(p))) err(`${id}: bad boost_personas`);
  if (a.title.length > 80) err(`${id}: title over 80 chars`);

  if (a.tier === 'learn') {
    if (!a.body) err(`${id}: learn needs a body`);
    const words = (a.body || '').split(/\s+/).length;
    if (words < 40 || words > 110) err(`${id}: body is ${words} words, want 40-110 (a one-minute read)`);
  } else if (!a.why) {
    err(`${id}: non-learn actions need a why line`);
  }

  const p = a.payload || {};
  if (a.handler === 'timer' && !(p.minutes > 0)) err(`${id}: timer needs payload.minutes`);
  if (a.handler === 'link' && !/^https:\/\//.test(p.url || '')) err(`${id}: link needs an https payload.url`);
  if (a.handler === 'screen' && !p.screen) err(`${id}: screen needs payload.screen`);
  if (a.handler === 'reminder' && !/^\d{2}:\d{2}$/.test(p.time || '')) err(`${id}: reminder needs payload.time HH:MM`);
  if (a.handler === 'routine' && !p.preset) err(`${id}: routine needs payload.preset`);
}

/* ─── Coverage: every sub-section has something for every age ─────────────── */
// The promise is that no sub-section disappears for anyone — content scales by
// age instead. So each (sub-section, band) needs a Today's-action candidate
// and at least one of each deck slot.

for (const screen of Object.keys(SUBSECTIONS)) {
  const pool = AREA_ACTIONS.filter(a => a.screen_tag === screen);
  if (!pool.length) { err(`${screen}: no actions`); continue; }
  for (const band of AGE_BANDS) {
    const mine = pool.filter(a => a.age_bands.includes(band));
    const missing = [];
    if (!mine.some(a => a.featured)) missing.push('featured');
    for (const tier of ['quick', 'learn', 'habit']) if (!mine.some(a => a.tier === tier)) missing.push(tier);
    if (missing.length) err(`${screen} / ${band}: missing ${missing.join(', ')}`);
  }
}

/* ─── Content rules ───────────────────────────────────────────────────────── */

const textOf = (a) => [a.title, a.why, a.body].filter(Boolean).join(' ');
const sentences = (s) => s.split(/(?<=[.!?])\s+/);

for (const a of AREA_ACTIONS) {
  const text = textOf(a);

  // Real-world % and $ figures get stamped; illustrative arithmetic opens with
  // "Imagine". Checked per SENTENCE — a whole-string check passes a bare
  // figure sitting next to a stamped one.
  for (const s of sentences(text)) {
    if (/[%$]/.test(s) && !/\(reviewed 2026\)/.test(s) && !/\bImagine\b/.test(s)) {
      err(`${a.key}: unstamped figure: "${s.trim()}"`);
    }
  }

  if (/\bCTH\b|chill ?tech/i.test(text)) err(`${a.key}: our own brand name in user-facing content`);

  // Money content teaches the mechanism; it never tells someone what to do.
  if (a.area_id === 'financial' && /\byou should\b|\byou need to\b|\byou must\b/i.test(text)) {
    err(`${a.key}: personal financial instruction ("you should…")`);
  }
}

/* ─── Resources ───────────────────────────────────────────────────────────── */

const rSeen = new Set();
for (const r of AREA_RESOURCES) {
  const id = r.key;
  if (rSeen.has(id)) err(`${id}: duplicate resource key`);
  rSeen.add(id);
  if (!SUBSECTIONS[r.screen_tag]) err(`${id}: unknown screen_tag ${r.screen_tag}`);
  if (!/^https:\/\//.test(r.url)) err(`${id}: url must be https`);
  if (!RESOURCE_KINDS.includes(r.kind)) err(`${id}: bad kind ${r.kind}`);
  if (!COSTS.includes(r.cost)) err(`${id}: bad cost ${r.cost}`);
  if (!r.age_bands.length || r.age_bands.some(b => !AGE_BANDS.includes(b))) err(`${id}: bad age_bands`);
  if (!r.description) err(`${id}: needs a description`);
}
for (const screen of Object.keys(SUBSECTIONS)) {
  if (!AREA_RESOURCES.some(r => r.screen_tag === screen)) err(`${screen}: no resources`);
}
// Crisis lines are for everyone.
for (const r of AREA_RESOURCES.filter(r => r.kind === 'hotline' && ['988', 'crisis-text', 'find-helpline'].some(k => r.key.endsWith(k)))) {
  if (r.age_bands.length !== AGE_BANDS.length) err(`${r.key}: crisis lines must be in every age band`);
}

/* ─── Links ───────────────────────────────────────────────────────────────── */

const linkReport = [];
if (checkLinks) {
  const urls = [...new Set([
    ...AREA_RESOURCES.map(r => r.url),
    ...AREA_ACTIONS.filter(a => a.handler === 'link').map(a => a.payload.url),
  ])];
  const check = async (url) => {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Mozilla/5.0 (link check)', Accept: 'text/html,*/*' },
      });
      return { url, status: res.status, final: res.url };
    } catch (e) {
      return { url, status: 0, final: String(e.cause?.code || e.name) };
    }
  };
  for (let i = 0; i < urls.length; i += 8) {
    linkReport.push(...await Promise.all(urls.slice(i, i + 8).map(check)));
  }
  for (const l of linkReport) {
    if (l.status >= 200 && l.status < 400) continue;
    // Cloudflare-style bot walls answer 403/429 to scripts but serve people fine.
    if (l.status === 403 || l.status === 429) warnings.push(`bot-blocked, check by hand: ${l.url}`);
    else err(`dead link (${l.status} ${l.final}): ${l.url}`);
  }
}

/* ─── Report ──────────────────────────────────────────────────────────────── */

const byTier = Object.fromEntries(ACTION_TIERS.map(t => [t, AREA_ACTIONS.filter(a => a.tier === t).length]));
console.log(`${AREA_ACTIONS.length} actions across ${Object.keys(SUBSECTIONS).length} sub-sections`, byTier);
console.log(`${AREA_RESOURCES.length} resources`);
if (checkLinks) console.log(`${linkReport.length} links checked`);
warnings.forEach(w => console.warn('warn:', w));
if (errors.length) {
  errors.forEach(e => console.error('error:', e));
  console.error(`\n${errors.length} error(s) — migration not written.`);
  process.exit(1);
}

/* ─── SQL ─────────────────────────────────────────────────────────────────── */

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs) => (xs.length ? `array[${xs.map(q).join(', ')}]::text[]` : `'{}'::text[]`);
const js = (o) => `${q(JSON.stringify(o))}::jsonb`;
const bandCheck = `age_bands <@ array[${AGE_BANDS.map(q).join(', ')}]::text[] and cardinality(age_bands) > 0`;

const actionRows = AREA_ACTIONS.map(a => `  (${[
  q(a.key), q(a.area_id), q(a.screen_tag), q(a.tier), q(a.title), q(a.why), q(a.body),
  q(a.handler), js(a.payload), arr(a.age_bands), arr(a.boost_personas), a.featured, a.sort_order,
].join(', ')})`).join(',\n');

const resourceRows = AREA_RESOURCES.map(r => `  (${[
  q(r.key), q(r.area_id), q(r.screen_tag), q(r.title), q(r.description), q(r.url),
  q(r.source), q(r.kind), q(r.cost), arr(r.age_bands), r.sort_order,
].join(', ')})`).join(',\n');

const sql = `-- Life Area actions, research resources, and each person's edits to them.
--
-- GENERATED by scripts/gen-life-area-seed.mjs from src/data/lifeAreaActions.js.
-- Don't hand-edit the seed below; edit live rows in the Supabase dashboard.
--
-- Three tables:
--
--   area_actions       The action pool behind every Life Area sub-section:
--                      Today's action, the 2-minute / 1-minute-read / habit
--                      deck, and the one-off steps. Public read, admin write —
--                      the same contract as app_content, so you add, reword or
--                      switch off an action from the Table Editor and every
--                      app picks it up on its next fetch. No build.
--
--   area_resources     Links for going deeper, per sub-section. Same contract.
--
--   user_area_actions  A person's own edits: hide one, pin one, reword it,
--                      change its time, or add their own. Owner-only.
--                      Per ACCOUNT, not per profile — like life_areas, the
--                      eight areas belong to the person, not to a job — so it
--                      is deliberately absent from SCOPED_TABLES.
--
-- age_bands is a HARD filter using the five bands ageCategoryFromDob() already
-- writes to profiles.age_category. boost_personas only re-ranks. Every
-- sub-section has content for every band; nothing is hidden by age, it scales.
--
-- Also adds action_key + metrics to area_notes so a completed action is
-- logged as a structured row, not only as tagged text. Existing readers,
-- which filter on the [ScreenTag] text convention, keep working unchanged.
--
-- Seeds use ON CONFLICT (key) DO NOTHING: re-running never overwrites a
-- dashboard edit. Apply in the Supabase SQL editor or with \`supabase db push\`.

-- Same definition as 20260828140000_remote_content_config.sql; repeated so
-- this file stands alone.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── area_actions ───────────────────────────────────────────────────────────

create table if not exists public.area_actions (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique,
  area_id        text not null check (area_id in (${AREAS.map(q).join(', ')})),
  screen_tag     text not null,
  tier           text not null check (tier in (${ACTION_TIERS.map(q).join(', ')})),
  title          text not null,
  why            text,
  body           text,
  handler        text not null default 'done' check (handler in (${ACTION_HANDLERS.map(q).join(', ')})),
  payload        jsonb not null default '{}'::jsonb,
  age_bands      text[] not null default array[${AGE_BANDS.map(q).join(', ')}]::text[]
                   check (${bandCheck}),
  boost_personas text[] not null default '{}'::text[],
  featured       boolean not null default false,
  conditions     jsonb,              -- reserved: metric-driven selection, e.g. {"metric":"hours","op":"<","value":6,"window":7}
  sort_order     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists area_actions_screen_idx on public.area_actions (screen_tag, active, sort_order);
create index if not exists area_actions_area_idx   on public.area_actions (area_id, active);

alter table public.area_actions enable row level security;

drop policy if exists "area_actions readable when active" on public.area_actions;
create policy "area_actions readable when active"
  on public.area_actions for select
  to anon, authenticated
  using (active = true);

drop trigger if exists area_actions_touch_updated_at on public.area_actions;
create trigger area_actions_touch_updated_at
  before update on public.area_actions
  for each row execute function public.touch_updated_at();

-- ─── area_resources ─────────────────────────────────────────────────────────

create table if not exists public.area_resources (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  area_id      text not null check (area_id in (${AREAS.map(q).join(', ')})),
  screen_tag   text not null,
  title        text not null,
  description  text,
  url          text not null check (url like 'https://%'),
  source       text,
  kind         text not null default 'guide' check (kind in (${RESOURCE_KINDS.map(q).join(', ')})),
  cost         text not null default 'free' check (cost in (${COSTS.map(q).join(', ')})),
  age_bands    text[] not null default array[${AGE_BANDS.map(q).join(', ')}]::text[]
                 check (${bandCheck}),
  verified_on  date,
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists area_resources_screen_idx on public.area_resources (screen_tag, active, sort_order);

alter table public.area_resources enable row level security;

drop policy if exists "area_resources readable when active" on public.area_resources;
create policy "area_resources readable when active"
  on public.area_resources for select
  to anon, authenticated
  using (active = true);

drop trigger if exists area_resources_touch_updated_at on public.area_resources;
create trigger area_resources_touch_updated_at
  before update on public.area_resources
  for each row execute function public.touch_updated_at();

-- ─── user_area_actions ──────────────────────────────────────────────────────
-- One row per edit. action_key set = an edit to a pool action (hide, pin,
-- reword, retime). action_key null = the person's own action, which needs a
-- title. Custom actions always log as 'done'; payload overrides are merged
-- client-side for the keys a person may change (time, minutes) only.

create table if not exists public.user_area_actions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  screen_tag  text not null,
  action_key  text references public.area_actions(key) on update cascade on delete cascade,
  title       text check (title is null or length(title) between 1 and 120),
  why         text check (why is null or length(why) <= 240),
  tier        text check (tier is null or tier in (${ACTION_TIERS.map(q).join(', ')})),
  payload     jsonb,
  hidden      boolean not null default false,
  pinned      boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint user_area_actions_custom_needs_title
    check (action_key is not null or title is not null),
  -- A plain constraint, not a partial index: PostgREST upserts with
  -- on_conflict=user_id,action_key can't target a partial index. NULLs are
  -- distinct, so custom actions (null action_key) stay unlimited.
  constraint user_area_actions_one_edit unique (user_id, action_key)
);

create index if not exists user_area_actions_screen_idx
  on public.user_area_actions (user_id, screen_tag);

alter table public.user_area_actions enable row level security;

drop policy if exists "user_area_actions_select_own" on public.user_area_actions;
create policy "user_area_actions_select_own" on public.user_area_actions
  for select using (auth.uid() = user_id);
drop policy if exists "user_area_actions_insert_own" on public.user_area_actions;
create policy "user_area_actions_insert_own" on public.user_area_actions
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_area_actions_update_own" on public.user_area_actions;
create policy "user_area_actions_update_own" on public.user_area_actions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_area_actions_delete_own" on public.user_area_actions;
create policy "user_area_actions_delete_own" on public.user_area_actions
  for delete using (auth.uid() = user_id);

revoke all on public.user_area_actions from anon;
grant select, insert, update, delete on public.user_area_actions to authenticated;

drop trigger if exists user_area_actions_touch_updated_at on public.user_area_actions;
create trigger user_area_actions_touch_updated_at
  before update on public.user_area_actions
  for each row execute function public.touch_updated_at();

-- ─── area_notes: structured completion logging ──────────────────────────────
-- Guarded: area_notes predates this repo's migrations, so don't assume it.

do $$
begin
  if to_regclass('public.area_notes') is not null then
    alter table public.area_notes add column if not exists action_key text;
    alter table public.area_notes add column if not exists metrics jsonb;
    create index if not exists area_notes_action_idx
      on public.area_notes (user_id, action_key, created_at desc)
      where action_key is not null;
  end if;
end $$;

-- ─── Seed: ${AREA_ACTIONS.length} actions ${'─'.repeat(52)}

insert into public.area_actions
  (key, area_id, screen_tag, tier, title, why, body, handler, payload, age_bands, boost_personas, featured, sort_order)
values
${actionRows}
on conflict (key) do nothing;

-- ─── Seed: ${AREA_RESOURCES.length} resources ${'─'.repeat(50)}

insert into public.area_resources
  (key, area_id, screen_tag, title, description, url, source, kind, cost, age_bands, sort_order)
values
${resourceRows}
on conflict (key) do nothing;
`;

await writeFile(new URL(`../${MIGRATION}`, import.meta.url), sql);
console.log(`wrote ${MIGRATION}`);

if (jsonOut) {
  await writeFile(jsonOut, JSON.stringify({ SUBSECTIONS, AREA_ACTIONS, AREA_RESOURCES, linkReport }, null, 1));
  console.log(`wrote ${jsonOut}`);
}
