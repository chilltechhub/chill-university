-- supabase/migrations/20260921120000_plus_subscriptions.sql
--
-- Plus becomes something people can actually buy. Two jobs:
--
-- 1. CLOSE THE SELF-GRANT HOLE. `profiles_update_own` (20260912) lets a
--    signed-in user update any column of their own row, and `plan` /
--    `plan_expires_at` are columns of that row. Until now one PATCH with
--    {"plan":"plus"} was a free lifetime subscription, and is_plan_active()
--    — which unlock_feature() trusts — would agree with it. From here on the
--    plan columns can only be changed by the server: the service role (the
--    revenuecat-sync edge function) or the SQL editor. A client write to
--    them is silently put back rather than rejected, so an app that upserts
--    a whole profile row it read earlier keeps working.
--
-- 2. Record what the store told us. RevenueCat is the source of truth for
--    who has paid; revenuecat-sync asks it and writes the answer onto the
--    profile. plus_events is the log of every webhook it received, which is
--    what you read when someone says "I paid and it didn't unlock".
--
-- Apply with the SQL editor. Safe to re-run.

begin;

-- ─── Extra plan columns ──────────────────────────────────────────────────────

-- 'trial' | 'normal' | 'intro' | 'grace' — RevenueCat's period_type, plus
-- 'grace' while a renewal is failing but the store is still giving access.
-- Lets the app say "your free week ends Friday" instead of guessing.
alter table public.profiles
  add column if not exists plan_period text;

-- 'app_store' | 'play_store' | 'stripe' | 'promotional' — where to send
-- someone who wants to cancel. Only the store they bought from can do it.
alter table public.profiles
  add column if not exists plan_store text;

-- Whether it will renew. False after someone cancels: they keep Plus until
-- plan_expires_at, and the app can stop saying "renews on".
alter table public.profiles
  add column if not exists plan_will_renew boolean;

alter table public.profiles
  add column if not exists plan_updated_at timestamptz;

-- ─── Only the server writes the plan ─────────────────────────────────────────

create or replace function public.profiles_protect_plan()
returns trigger
language plpgsql
as $$
begin
  -- A PostgREST request runs as 'anon' or 'authenticated'. The edge
  -- function's service-role key, the SQL editor and SECURITY DEFINER
  -- functions all run as something else and pass straight through.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan            := 'free';
    new.plan_expires_at := null;
    new.plan_period     := null;
    new.plan_store      := null;
    new.plan_will_renew := null;
    new.plan_updated_at := null;
  else
    new.plan            := old.plan;
    new.plan_expires_at := old.plan_expires_at;
    new.plan_period     := old.plan_period;
    new.plan_store      := old.plan_store;
    new.plan_will_renew := old.plan_will_renew;
    new.plan_updated_at := old.plan_updated_at;
  end if;
  return new;
end;
$$;

comment on function public.profiles_protect_plan() is
  'Keeps profiles.plan* server-written only. Client writes to those columns are reverted, not rejected.';

drop trigger if exists profiles_protect_plan on public.profiles;
create trigger profiles_protect_plan
  before insert or update on public.profiles
  for each row execute function public.profiles_protect_plan();

-- ─── Webhook log ─────────────────────────────────────────────────────────────

create table if not exists public.plus_events (
  -- RevenueCat's event id. Primary key = the same event delivered twice is
  -- stored once (RevenueCat retries until it gets a 200).
  id           text primary key,
  type         text not null,
  app_user_id  text,
  user_id      uuid references auth.users (id) on delete set null,
  environment  text,            -- 'PRODUCTION' | 'SANDBOX'
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

create index if not exists plus_events_user_idx on public.plus_events (user_id, received_at desc);

-- RLS on with no policies: nobody but the service role reads or writes it.
alter table public.plus_events enable row level security;
revoke all on public.plus_events from anon, authenticated;

commit;
