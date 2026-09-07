-- Age gate + parental consent for onboarding (K-12 users are minors more
-- often than not, so this needs to be a real gate, not an afterthought).
--
-- Flow this supports (see src/screens/Onboarding.js and
-- supabase/functions/kws-verify, supabase/functions/kws-webhook):
--   1. User enters date of birth + country during onboarding.
--   2. App computes is_minor client-side against a per-country age-of-
--      digital-consent table (src/logic/ageOfConsent.js) — not legal
--      advice, see that file's own disclaimer.
--   3. If minor, the user enters a parent/guardian email. The app calls
--      the kws-verify Edge Function, which calls Kids Web Services'
--      Parent Verification (PV) API to email the parent a verification
--      link, passing the user's own id as KWS's externalPayload so the
--      webhook below can find this row again. Status starts at 'pending'.
--   4. KWS calls the kws-webhook Edge Function (server-to-server, HMAC-
--      signed) once the parent verifies they're an adult, matches the
--      row by that externalPayload, and flips kws_pv_status to
--      'verified', stamping kws_verified_at and kws_transaction_id.
--   5. Only once verified does the app show its own in-app consent
--      screen (what we collect, link to the privacy policy) and set
--      parent_consent_given/parent_consent_at — KWS's Parent Verification
--      Service confirms the parent is an adult, it does not itself collect
--      consent (see Epic's own docs), so that last step is ours to keep.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`.

alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists country_code text; -- ISO 3166-1 alpha-2, e.g. 'US'
alter table public.profiles add column if not exists is_minor boolean;

alter table public.profiles add column if not exists parent_email text;
alter table public.profiles add column if not exists kws_pv_status text not null default 'none';
alter table public.profiles add column if not exists kws_transaction_id text;
alter table public.profiles add column if not exists kws_verified_at timestamptz;

alter table public.profiles add column if not exists parent_consent_given boolean not null default false;
alter table public.profiles add column if not exists parent_consent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_kws_pv_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_kws_pv_status_check
      check (kws_pv_status in ('none', 'pending', 'verified', 'failed'));
  end if;
end $$;

-- The webhook finds the right row via the externalPayload it round-trips
-- (we set it to the user's id when starting verification — see
-- kws-verify), not via this column. kws_transaction_id is bookkeeping/
-- idempotency only: KWS retries the webhook with exponential backoff on
-- any non-2xx response, so a repeat delivery should be a harmless no-op.
create index if not exists idx_profiles_kws_transaction_id
  on public.profiles (kws_transaction_id)
  where kws_transaction_id is not null;
