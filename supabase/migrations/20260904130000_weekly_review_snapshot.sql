-- Weekly Review (v1 execution feature #5, "Rule of 3").
--
-- Stores the most recent review as one JSON blob — date, average
-- completion rate, the 3 selected wins, and the 3 priorities set for next
-- week (those 3 also land as real `tasks` rows separately; this is just
-- the record of the review itself). See src/screens/WeeklyReviewScreen.js.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

alter table public.user_settings
  add column if not exists last_weekly_review jsonb;
