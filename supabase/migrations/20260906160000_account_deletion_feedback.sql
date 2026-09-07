-- Optional exit feedback, captured on the way out the door.
--
-- Deliberately NOT tied to the user in any way that could identify them
-- later — no user_id column, no FK to public.profiles. Two reasons: (1) it
-- needs to survive the delete_my_account() cascade that's about to wipe
-- everything else the user owns (see 20260906150000_delete_account.sql) —
-- a column that referenced profiles(id) would just get deleted right along
-- with the account, and (2) this is explicitly the most private shape for
-- data someone is submitting on their way to deleting their whole account.
--
-- Same zero-policy-RLS + SECURITY DEFINER pattern as everywhere else in
-- this schema: the table is locked to direct client access, and the one
-- narrow function below is the only way in. There's no read function —
-- this is meant to be queried directly in the Supabase SQL editor, not
-- surfaced back into the app.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.account_deletion_feedback (
  id         uuid primary key default gen_random_uuid(),
  reason     text,
  details    text,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;

create or replace function public.submit_deletion_feedback(p_reason text, p_details text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.account_deletion_feedback (reason, details)
  values (p_reason, nullif(trim(coalesce(p_details, '')), ''));
end;
$$;

revoke all on function public.submit_deletion_feedback(text, text) from public;
grant execute on function public.submit_deletion_feedback(text, text) to authenticated;
