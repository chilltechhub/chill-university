-- Round prizes and pet coins, credited and limited here instead of on the
-- device (docs/fix-plan.md 4.8, decided 2026-09-28).
--
-- 1. claim_round_prize — the prize card a player picks at the end of a round
--    is now what the round pays. Before, the card's number was shown as
--    "points earned" but never saved, while each answer and the finished game
--    paid points of their own. Answers and finished games now pay XP only
--    (src/logic/gamificationService.js). A round with no correct answers pays
--    nothing, and a card can't be worth more than RoundCompleteScreen's
--    rollPrizes can roll for that many right answers.
-- 2. collect_pet_coin — the pet on Training / Profile eats coins by itself:
--    1 XP + 1 point each, at most 12 per six-hour window. That limit used to
--    live in the device's storage, so signing out and in, or a second device,
--    started it over.
--
-- Needs 20260927120000_lock_down_profile_fields.sql (_award_progress).

create table if not exists public.reward_claims (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('round_prize', 'pet_coin')),
  xp         int not null default 0,
  points     int not null default 0,
  detail     jsonb,
  claimed_at timestamptz not null default now()
);
create index if not exists reward_claims_user_kind_idx
  on public.reward_claims (user_id, kind, claimed_at desc);
alter table public.reward_claims enable row level security;
-- No client policies: only the two functions below write or read it.
revoke all on public.reward_claims from anon, authenticated;

-- ─── Round prize ────────────────────────────────────────────────────────────
-- rollPrizes (src/components/RoundCompleteScreen.js): correct answers are
-- scaled down to at most 15 (with total to 15); the best card is at most
-- tier 4 × (5 × correct + 5) × 1.7 (best card) × 1.15 (jitter) ≈ 39.1 per
-- correct answer + 39.1, rounded to 5. So 40 per correct answer plus 45 is
-- the most a card can honestly show; nothing when none were right.
-- One claim per 2 seconds: a round is at least a question plus the 1.2 s
-- reveal, so anything faster isn't a round.
create or replace function public.claim_round_prize(p_points int, p_correct int, p_total int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct int;
  v_max     int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  if coalesce(p_points, 0) < 0 or coalesce(p_correct, 0) < 0 or coalesce(p_total, 0) < coalesce(p_correct, 0) then
    raise exception 'That round doesn''t add up.';
  end if;

  v_correct := case
    when coalesce(p_correct, 0) <= 0 then 0
    when coalesce(p_total, 0) > 15 then greatest(1, round(p_correct * 15.0 / p_total)::int)
    else coalesce(p_correct, 0)
  end;
  v_max := case when v_correct <= 0 then 0 else v_correct * 40 + 45 end;
  if p_points > v_max then
    raise exception 'That prize is bigger than the round allows.';
  end if;
  if coalesce(p_points, 0) = 0 then
    return jsonb_build_object('points', 0);
  end if;

  perform pg_advisory_xact_lock(hashtext('round_prize:' || auth.uid()::text));
  if exists (
    select 1 from public.reward_claims
    where user_id = auth.uid() and kind = 'round_prize' and claimed_at > now() - interval '2 seconds'
  ) then
    raise exception 'One prize per round.';
  end if;

  insert into public.reward_claims (user_id, kind, points, detail)
  values (auth.uid(), 'round_prize', p_points, jsonb_build_object('correct', p_correct, 'total', p_total));
  insert into public.activity_log (user_id, activity_type, subject, xp_earned, points_earned, metadata)
  values (auth.uid(), 'ROUND_PRIZE', 'general', 0, p_points, jsonb_build_object('correct', p_correct, 'total', p_total));
  perform public._award_progress(auth.uid(), 0, p_points);

  return jsonb_build_object('points', p_points);
end;
$$;

revoke execute on function public.claim_round_prize(int, int, int) from public, anon;
grant execute on function public.claim_round_prize(int, int, int) to authenticated;

-- ─── Pet coins ──────────────────────────────────────────────────────────────
-- Windows start every six hours on the UTC clock, the same boundaries the
-- app's useCoinRewards counts in (floor(epoch / 6 h)).
create or replace function public.collect_pet_coin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := to_timestamp((floor(extract(epoch from now()) / 21600) * 21600)::double precision);
  v_count  int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  perform pg_advisory_xact_lock(hashtext('pet_coin:' || auth.uid()::text));
  select count(*) into v_count
    from public.reward_claims
   where user_id = auth.uid() and kind = 'pet_coin' and claimed_at >= v_window;
  if v_count >= 12 then
    return jsonb_build_object('points', 0, 'remaining', 0);
  end if;

  insert into public.reward_claims (user_id, kind, xp, points) values (auth.uid(), 'pet_coin', 1, 1);
  insert into public.activity_log (user_id, activity_type, subject, xp_earned, points_earned, metadata)
  values (auth.uid(), 'COIN_COLLECTED', 'general', 1, 1, '{}'::jsonb);
  perform public._award_progress(auth.uid(), 1, 1);

  return jsonb_build_object('points', 1, 'remaining', 12 - v_count - 1);
end;
$$;

revoke execute on function public.collect_pet_coin() from public, anon;
grant execute on function public.collect_pet_coin() to authenticated;
