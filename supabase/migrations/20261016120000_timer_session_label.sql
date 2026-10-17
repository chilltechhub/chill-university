-- Work Mode sessions keep their name. Decided 2026-10-16 (coherence pass).
--
-- ── Why ──────────────────────────────────────────────────────────────────────
-- Work Mode asks "What are you working on?" and then saved only the minutes,
-- so Insights could say how long someone focused but never on what.
--
-- ── What changes ─────────────────────────────────────────────────────────────
-- * timer_sessions gets a nullable `label` (what the session was for).
-- The app writes it when the column is there and leaves it out when it isn't
-- (src/api/commandCenterService.js retries without it on PGRST204), so app and
-- database can ship in either order. Existing rows stay as they are.
-- Safe to run more than once.
--
-- Apply by hand in the Supabase SQL editor (the CLI's migration history does not
-- match the live database — `supabase db push` is not safe here).

alter table public.timer_sessions add column if not exists label text;
