-- Fixes "column reference organization_id is ambiguous" when joining an
-- organization/cohort with an invite code.
--
-- redeem_org_invite_code()'s RETURNS TABLE declares output columns named
-- organization_id and cohort_id. Its two membership inserts used those
-- same names as a bare, unqualified `on conflict (organization_id, user_id)`
-- / `on conflict (cohort_id, user_id)` conflict-target column list — and
-- unlike an ordinary column reference, a conflict-target column can't be
-- table-qualified (`on conflict (organization_members.organization_id, ...)`
-- isn't valid syntax), so there was no way to disambiguate it in place.
-- The fix is to drop the explicit column list: `on conflict do nothing`
-- with no target applies to any unique/exclusion constraint violation on
-- the table, which is exactly the constraint we were naming anyway — each
-- affected table has exactly one relevant unique constraint besides its
-- primary key, so behavior is unchanged.
--
-- assign_content_to_cohort() had the same pattern (`on conflict
-- (assignment_id, user_id)`) but no actual collision — assignment_id isn't
-- one of its own output columns. Normalized to the same unqualified form
-- anyway, for consistency and so this bug class can't resurface here later.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`.

create or replace function public.redeem_org_invite_code(p_code text)
returns table (
  organization_id   uuid,
  organization_name text,
  organization_type text,
  cohort_id         uuid,
  cohort_name       text,
  role              text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row       public.organization_invite_codes%rowtype;
  v_has_org   boolean;
  v_has_cohort boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.organization_invite_codes oic
  where oic.code = upper(p_code)
    and oic.expires_at > now()
    and oic.use_count < oic.max_uses
  limit 1;

  if v_row.id is null then
    raise exception 'That code is invalid, expired, or has reached its limit.';
  end if;

  v_has_org := exists (
    select 1 from public.organization_members om
    where om.organization_id = v_row.organization_id and om.user_id = auth.uid()
  );

  if v_row.cohort_id is null then
    if v_has_org then
      raise exception 'You already belong to this organization.';
    end if;
  else
    v_has_cohort := exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = v_row.cohort_id and cm.user_id = auth.uid()
    );
    if v_has_cohort then
      raise exception 'You already belong to this cohort.';
    end if;
  end if;

  if not v_has_org then
    insert into public.organization_members (organization_id, user_id, role)
    values (v_row.organization_id, auth.uid(), v_row.role)
    on conflict do nothing;
  end if;

  if v_row.cohort_id is not null then
    insert into public.cohort_members (cohort_id, user_id)
    values (v_row.cohort_id, auth.uid())
    on conflict do nothing;

    insert into public.cohort_assignment_progress (assignment_id, user_id)
    select ca.id, auth.uid()
    from public.cohort_assignments ca
    where ca.cohort_id = v_row.cohort_id
    on conflict do nothing;
  end if;

  update public.organization_invite_codes
  set use_count = use_count + 1
  where organization_invite_codes.id = v_row.id;

  return query
    select o.id, o.name, o.type, c.id, c.name, v_row.role
    from public.organizations o
    left join public.cohorts c on c.id = v_row.cohort_id
    where o.id = v_row.organization_id;
end;
$$;

comment on function public.redeem_org_invite_code(text) is
  'Redeems an organization/cohort invite code for the calling user. SECURITY DEFINER.';

grant execute on function public.redeem_org_invite_code(text) to authenticated;

create or replace function public.assign_content_to_cohort(
  p_cohort_id   uuid,
  p_title       text,
  p_description text default null,
  p_due_date    date default null
)
returns table (id uuid, title text, description text, due_date date, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_id     uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Give the assignment a title.';
  end if;
  if length(p_title) > 200 then
    raise exception 'Title is too long.';
  end if;
  if p_description is not null and length(p_description) > 2000 then
    raise exception 'Description is too long.';
  end if;

  select c.organization_id into v_org_id from public.cohorts c where c.id = p_cohort_id;
  if v_org_id is null then
    raise exception 'Cohort not found.';
  end if;

  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = v_org_id and om.user_id = auth.uid() and om.role in ('owner', 'admin')
  ) and not exists (
    select 1 from public.cohort_managers cm where cm.cohort_id = p_cohort_id and cm.user_id = auth.uid()
  ) then
    raise exception 'You need to manage this cohort to assign work to it.';
  end if;

  insert into public.cohort_assignments (cohort_id, assigned_by, title, description, due_date)
  values (p_cohort_id, auth.uid(), trim(p_title), nullif(trim(coalesce(p_description, '')), ''), p_due_date)
  returning cohort_assignments.id into v_id;

  insert into public.cohort_assignment_progress (assignment_id, user_id)
  select v_id, cme.user_id from public.cohort_members cme where cme.cohort_id = p_cohort_id
  on conflict do nothing;

  return query select ca.id, ca.title, ca.description, ca.due_date, ca.created_at
    from public.cohort_assignments ca where ca.id = v_id;
end;
$$;

comment on function public.assign_content_to_cohort(uuid, text, text, date) is
  'Manager-only: creates a freeform assignment for a cohort and pre-creates a not_started progress row for every current member. SECURITY DEFINER.';

grant execute on function public.assign_content_to_cohort(uuid, text, text, date) to authenticated;
