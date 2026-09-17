-- Home dashboard "widget" layout — lets a user reorder and show/hide each
-- dashboard section, iOS home-screen style. Stored as one JSON array of
-- { key, hidden } in display order (jsonb, read/written as a plain JS array,
-- no manual JSON.stringify/parse — see last_weekly_review for the same
-- pattern). See src/screens/HomeScreen.js and src/components/WidgetBoard.js.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

alter table public.user_settings
  add column if not exists home_widget_layout jsonb;
