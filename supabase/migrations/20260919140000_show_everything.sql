-- "Show everything" (question 3 in docs/access-system.md) saved on the
-- account instead of only on the phone. Until this runs, the app keeps the
-- choice on the device and nothing breaks.
--
-- Safe to run more than once.

alter table public.profiles
  add column if not exists show_everything boolean not null default false;

comment on column public.profiles.show_everything is
  'The "Show everything now" switch: every stage of the app open from day one. Visibility only; it opens no locked door.';
