-- docs/metrics.sql
-- Launch funnel from data the app already stores. No tracking SDK: paste into
-- the Supabase SQL editor (it runs as the service role, past RLS).
-- Purchases, trials, refunds and revenue live in the RevenueCat dashboard;
-- plus_events here is the webhook log once revenuecat-sync is deployed.
--
-- NOT covered (nothing records them yet): paywall views, which `from` opened
-- the paywall, and Fill with AI uses. See docs/monetization-audit.md.

-- The first goal each account type starts with (FIRST_GOALS in
-- src/data/experienceStages.js). Keep in sync if those ids change.
with first_goals(id) as (
  values ('first-steps'), ('first-study-session'), ('first-ops-check'), ('first-founder-step')
),

-- 1. Activation: signups by week, and how many finished their first goal.
--    Plan target: investigate if this sits under ~30–40%.
signups as (
  select id as user_id, date_trunc('week', created_at)::date as week, created_at
  from public.profiles
  where created_at > now() - interval '90 days'
),
activated as (
  select distinct uo.user_id
  from public.user_objectives uo
  join first_goals fg on fg.id = uo.objective_id
  where uo.completed_at is not null
)
select s.week,
       count(*)                                         as signups,
       count(a.user_id)                                 as finished_first_goal,
       round(100.0 * count(a.user_id) / nullif(count(*), 0), 1) as activation_pct
from signups s
left join activated a using (user_id)
group by s.week
order by s.week desc;

-- 2. Returning: D1 and D7, counted as "earned points that day" (activity_log
--    logs games, drills, planner items). A lower bound: opening the app and
--    only reading doesn't show up here.
with signups as (
  select id as user_id, created_at::date as day0
  from public.profiles
  where created_at > now() - interval '90 days'
    and created_at < now() - interval '8 days'   -- old enough to have a D7
),
active_days as (
  select distinct user_id, created_at::date as day
  from public.activity_log
)
select count(*)                                                        as cohort,
       round(100.0 * count(*) filter (where exists (select 1 from active_days d where d.user_id = s.user_id and d.day = s.day0 + 1)) / nullif(count(*), 0), 1) as d1_pct,
       round(100.0 * count(*) filter (where exists (select 1 from active_days d where d.user_id = s.user_id and d.day between s.day0 + 7 and s.day0 + 8)) / nullif(count(*), 0), 1) as d7_pct
from signups s;

-- 3. Plus: who has it right now, by period (trial / normal / grace).
select coalesce(plan_period, 'none') as period, count(*)
from public.profiles
where plan = 'plus'
  and (plan_expires_at is null or plan_expires_at > now())
group by 1
order by 2 desc;

-- 4. Plus webhook events by type, last 30 days (empty until revenuecat-sync
--    is deployed and the webhook is set in RevenueCat).
select type, environment, count(*)
from public.plus_events
where received_at > now() - interval '30 days'
group by 1, 2
order by 3 desc;
