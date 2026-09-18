-- Age gating and content fixes that go with the app-side changes on
-- feature/life-areas-action-first. Independent of 20260917130000_life_area_actions.sql;
-- run either first. Safe to re-run: every statement is idempotent or a no-op
-- once applied.
--
-- 1. Business/Entrepreneur profiles: a real under-18 test.
--    enforce_profile_limits() blocked adult personas only when
--    profiles.is_minor was true. is_minor is the DIGITAL-CONSENT flag —
--    isMinorRequiringConsent() sets it for anyone under the age of digital
--    consent, which is 13 in the US. So a 15-year-old could create a Business
--    profile. It now asks is_restricted_account() (20260906140000), which
--    already makes the right test: consent flag, then birth date under 18,
--    then unknown age fails safe.
--
-- 2. area_notes rows filed under the wrong life area.
--    Mindfulness (SelfCareScreen) wrote 'spiritual'; it belongs to Mental.
--    Network & Community wrote 'professional' with no tag; it belongs to
--    Social, and now tags its rows [NetworkScreen].
--
-- 3. Discover (app_content featured_resource).
--    The CDC link was a 404. And nothing filtered by age, so a ten-year-old
--    saw Bumble BFF, Meetup and BetterHelp. Rows get meta.age_bands; the app
--    (knowledge.js) hides a row outside the viewer's band. Edit these in the
--    dashboard to change who sees what — no app update.
--
-- 4. Life Area tips (app_content area_tip).
--    "Aim for 7-9 hours" is the adult figure — kids need 9-12, teens 8-10.
--    One tip told readers which fund to buy and another pointed at an 18+
--    commercial service; both now explain the mechanism instead. Real-world
--    money figures are stamped (reviewed 2026). Debt, investing and
--    public-posting tips get meta.age_bands.

-- ─── 1. Adult personas need an adult account ────────────────────────────────

create or replace function public.enforce_profile_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  -- Age gate. BUSINESS and ENTREPRENEUR carry adult financial content
  -- (business credit, SBA packaging, entity formation, tax strategy).
  -- is_restricted_account() is under 18 by birth date, or age unknown — NOT
  -- is_minor alone, which is the under-13 consent flag. Checked on insert
  -- and when the type changes, so renaming an existing profile never trips it.
  if new.type in ('BUSINESS', 'ENTREPRENEUR')
     and (TG_OP = 'INSERT' or new.type is distinct from old.type)
     and public.is_restricted_account(new.user_id) then
    raise exception 'Business and Entrepreneur profiles require an adult account.';
  end if;

  if TG_OP = 'INSERT' then
    select count(*) into v_count
      from public.persona_profiles
      where user_id = new.user_id and archived_at is null;
    if v_count >= 12 then
      raise exception 'Profile limit reached (12 active profiles).';
    end if;
  end if;

  -- The master profile is not deletable and not demotable — it is the one
  -- that manages the rest, so an account must never end up without one.
  if TG_OP = 'UPDATE' and old.is_master and (new.archived_at is not null or not new.is_master) then
    raise exception 'The master profile cannot be archived or demoted.';
  end if;

  return new;
end $$;

-- ─── 2. area_notes: right area, right tag ───────────────────────────────────

do $$
begin
  if to_regclass('public.area_notes') is not null then
    update public.area_notes
       set area_id = 'mental'
     where area_id = 'spiritual'
       and content like '%[SelfCareScreen]%';

    -- Network rows are the only professional notes stored as bare JSON
    -- starting {"name": — NetworkScreen was the only writer of that shape.
    update public.area_notes
       set area_id = 'social',
           content = '[NetworkScreen] ' || content
     where area_id = 'professional'
       and content like '{"name":%';
  end if;
end $$;

-- ─── 3. Discover: dead link, and who each resource is for ───────────────────
-- Same lists as DISCOVER_AGE_BANDS in src/data/knowledgeCatalogs.js, which is
-- the fallback when a row has no tag.

update public.app_content
   set meta = meta || jsonb_build_object('url', 'https://www.cdc.gov/physical-activity-basics/guidelines/index.html')
 where type = 'featured_resource'
   and meta->>'url' = 'https://www.cdc.gov/physical-activity/index.html';

-- 18+: the service's own terms require an adult, or it's adult by nature.
update public.app_content
   set meta = meta || jsonb_build_object('age_bands', jsonb_build_array('young_adult', 'adult', 'professional'))
 where type = 'featured_resource'
   and meta->>'legacy_id' in ('g11', 'p1', 'm3', 's1', 's2', 's4', 's5', 'f4')
   and not (meta ? 'age_bands');

-- 13+: an account, public posting, strangers, or a job board.
update public.app_content
   set meta = meta || jsonb_build_object('age_bands', jsonb_build_array('teen', 'young_adult', 'adult', 'professional'))
 where type = 'featured_resource'
   and meta->>'legacy_id' in ('g13', 'p2', 'm6', 's3', 'c2', 'c5', 'c6', 'pr1', 'pr2', 'pr3', 'pr4', 'pr6')
   and not (meta ? 'age_bands');

-- ─── 4. Tips: accurate for every age, and aged where they need to be ────────
-- Matched on the original wording, so a tip already edited in the dashboard
-- is left alone.

update public.app_content set body = 'Aim for the sleep your age needs: 9–12 hours for kids, 8–10 for teens, 7 or more for adults'
 where type = 'area_tip' and key = 'SleepRecoveryScreen' and body = 'Aim for 7-9 hours consistently';

update public.app_content
   set body = '50/30/20 is a common starting split: 50% needs, 30% wants, 20% savings (reviewed 2026)'
 where type = 'area_tip' and key = 'BudgetSpendingScreen' and body = '50/30/20 rule: 50% needs, 30% wants, 20% savings';

update public.app_content
   set body = 'Many guides suggest an emergency fund of 3–6 months of essential expenses (reviewed 2026)'
 where type = 'area_tip' and key = 'SavingsInvestingScreen' and body = 'Emergency fund target: 3-6 months of expenses';

update public.app_content
   set body = 'Time in the market tends to beat timing it — missing a few strong days can cost years of gains'
 where type = 'area_tip' and key = 'SavingsInvestingScreen' and body = 'Invest consistently — time in market beats timing the market';

update public.app_content
   set body = 'An index fund holds hundreds of companies, so one failing barely moves the total'
 where type = 'area_tip' and key = 'SavingsInvestingScreen' and body = 'Start with low-cost index funds if unsure where to begin';

update public.app_content
   set body = 'Check your credit report free at AnnualCreditReport.com — the official site'
 where type = 'area_tip' and key = 'DebtCreditScreen' and body = 'Check your credit score free at Credit Karma or your bank app';

-- 18+: budgeting splits, emergency funds, investing, debt payoff, credit reports.
update public.app_content
   set meta = meta || jsonb_build_object('age_bands', jsonb_build_array('young_adult', 'adult', 'professional'))
 where type = 'area_tip'
   and not (meta ? 'age_bands')
   and (
        (key = 'BudgetSpendingScreen'   and body like '50/30/20%')
     or (key = 'SavingsInvestingScreen' and (body like 'Many guides suggest an emergency fund%'
                                          or body like 'Time in the market%'
                                          or body like 'An index fund holds%'))
     or (key = 'DebtCreditScreen')
   );

-- 13+: subscriptions, public posting, running a business.
update public.app_content
   set meta = meta || jsonb_build_object('age_bands', jsonb_build_array('teen', 'young_adult', 'adult', 'professional'))
 where type = 'area_tip'
   and not (meta ? 'age_bands')
   and (
        (key = 'BudgetSpendingScreen'   and body like 'Review subscriptions%')
     or (key = 'ContentMediaScreen')
     or (key = 'BusinessVenturesScreen' and body like 'Revenue solves%')
   );
