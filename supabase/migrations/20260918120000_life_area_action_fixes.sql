-- Fixes to seeded area_actions rows, found while wiring the action panel.
-- Safe to re-run; each update only matches the original seeded value, so a
-- row already changed in the dashboard is left alone.

-- "Put two strength sessions in your week" pointed at the whole
-- physical_starter preset — water intake, sleep, meals and more, none of it
-- strength. It now adds the one planner item that matches: the weekly
-- "Plan week workouts" (planner_components, preset physical_starter).
update public.area_actions
   set payload = jsonb_build_object('component', 'Plan week workouts')
 where key = 'fit.strength-plan'
   and payload = jsonb_build_object('preset', 'physical_starter');

-- Every age, in every sub-section, should get a Today's action AND a full
-- deck. In Budget, Debt, Savings (18+) and Security (kids) the only Today's
-- pick for some ages was also the only 2-minute win, so picking it emptied
-- that deck slot. Four existing steps become Today's picks, and three new
-- steps cover kids and teens. scripts/gen-life-area-seed.mjs now fails on this.
update public.area_actions
   set featured = true
 where key in ('budget.subscriptions', 'save.employer-match', 'debt.ask-credit', 'debt.list-debts')
   and featured = false;

insert into public.area_actions
  (key, area_id, screen_tag, tier, title, why, body, handler, payload, age_bands, boost_personas, featured, sort_order)
values
  ('budget.spent-list', 'financial', 'BudgetSpendingScreen', 'step', 'Write down everything you spent money on this week', 'Seeing it all in one place is how you spot where it goes.', null, 'done', '{}'::jsonb, array['kid', 'teen']::text[], '{}'::text[], true, 98),
  ('debt.iou-list', 'financial', 'DebtCreditScreen', 'step', 'Make a list of anything you''ve borrowed, and who from', 'Then nothing gets forgotten, and friends know they can trust you.', null, 'done', '{}'::jsonb, array['kid']::text[], '{}'::text[], true, 120),
  ('security.kid-password', 'digital', 'SecurityScreen', 'step', 'Make a strong password for one account with a grown-up', 'Three or four random words together are easy to remember and hard to guess.', null, 'done', '{}'::jsonb, array['kid']::text[], '{}'::text[], true, 201)
on conflict (key) do nothing;

-- Relationships rows get their own tag, like Network's in 20260917140000.
-- RelationshipsScreen read EVERY Social note, so Communication and Social
-- Health logs showed up as relationship cards — and once Network & Community
-- moved into Social, so did its contacts. It now reads [RelationshipsScreen]
-- rows only. Its rows are the only untagged {"name":...} JSON left in Social
-- (Network's were tagged when they moved).
do $$
begin
  if to_regclass('public.area_notes') is not null then
    update public.area_notes
       set content = '[RelationshipsScreen] ' || content
     where area_id = 'social'
       and content like '{"name":%'
       and action_key is null;
  end if;
end $$;
