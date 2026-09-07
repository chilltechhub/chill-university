-- Self-service account deletion.
--
-- Every user-data table added in this project's own migrations already
-- references public.profiles(id) on delete cascade (family_linking,
-- institutional_layer, portfolio_entries, classroom_lesson_builder,
-- community_discover, …) — the one convention this schema has followed
-- consistently. That means deleting the auth.users row is enough to take
-- everything with it, *provided* public.profiles itself cascades from
-- auth.users — the standard "profiles.id references auth.users(id) on
-- delete cascade" setup every Supabase project starts from. This project
-- has no service-role Edge Function to call the Auth Admin API instead
-- (nothing here does — everything is a SECURITY DEFINER Postgres function,
-- same as leaderboard/family/organization), so this uses the same
-- documented workaround: a SECURITY DEFINER function, owned by a role with
-- full auth-schema privileges (whichever role runs this migration —
-- typically postgres/supabase_admin via the SQL editor), deletes straight
-- from auth.users.
--
-- Safety property that matters here: a function body runs inside the
-- caller's transaction, so if any table's FK turns out NOT to cascade
-- (RESTRICT/NO ACTION), the whole delete fails and rolls back atomically —
-- the user sees an error and nothing is touched, rather than ending up
-- with a half-deleted account. If that happens, the fix is finding and
-- correcting that one table's FK, not changing this function.
--
-- Out of scope for v1: Storage bucket files (e.g. remote_art_storage
-- uploads) aren't addressed by a table cascade and aren't cleaned up here.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
