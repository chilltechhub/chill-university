-- life_areas is missing last_check_date, so every rating check-in
-- (LifeAreaScreen.js's saveRating, and commandCenterService.js's
-- updateLifeAreaProgress) fails its upsert/update with PGRST204
-- ("Could not find the 'last_check_date' column of 'life_areas' in the
-- schema cache"). The numeric rating never actually saves — only the
-- separate "[Rating] ..." history note in area_notes succeeds, since
-- that's a different table with no such column. LibraryScreen.js already
-- reads this column back (`saved?.last_check_date`), so the column was
-- always the intended shape — it just never got created.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

alter table public.life_areas
  add column if not exists last_check_date date;
