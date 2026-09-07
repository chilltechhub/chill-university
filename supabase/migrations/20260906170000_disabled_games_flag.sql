-- Admin-side "hide a broken game" kill switch — one more app_config row
-- (see 20260828140000_remote_content_config.sql for the table itself).
--
-- `value` is a JSON array of gameRegistry ids (src/services/gameRegistry.js
-- — e.g. 'survivemonth', 'bugsquash') to hide from the Home "Play" menu,
-- the Training grid, and the game swipe feed, everywhere at once, with no
-- app build. The app re-reads this on every launch (RemoteConfigContext)
-- and reacts immediately if it's already running when you change it —
-- src/components/GameFeed.js, src/screens/GamesScreen.js, and
-- src/screens/HomeScreen.js all filter their game lists against it live.
--
-- To hide a game: update the row's value in the Supabase Table Editor
-- (or SQL editor), e.g.:
--   update public.app_config
--   set value = '["survivemonth"]'::jsonb
--   where key = 'disabled_games';
-- To un-hide everything: set value back to '[]'::jsonb.
--
-- `enabled` on this row doesn't do anything special — useConfigValue()
-- reads `value` regardless of `enabled` (that flag only matters to
-- useFeatureFlag's boolean flags, like maintenance_mode). Leave it true.
insert into public.app_config (key, value, enabled, description) values
  ('disabled_games', '[]'::jsonb, true, 'Array of gameRegistry ids to hide everywhere (Home, Training grid, swipe feed) — e.g. ["survivemonth"]. Edit `value` directly to hide/unhide a broken game with no app build.')
on conflict (key) do nothing;
