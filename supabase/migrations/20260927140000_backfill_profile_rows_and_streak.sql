-- docs/fix-plan.md, Phase 2.
--
-- 1. Bring back rows that were saved with no profile_id.
--    Two paths wrote them: the + button's New Project (it used the raw client,
--    not profileScopedClient) and anything saved offline (the queue replayed
--    without a profile_id). Scoped reads filter on profile_id, so these rows
--    exist but no profile ever shows them. Verified live on 2026-09-27: a +
--    button project was missing from every profile, and an offline capture
--    disappeared once it synced. The app no longer writes them (offlineWrite
--    stamps the active profile; the + button uses the scoped client); this
--    puts the existing ones in the owner's master profile, the same fallback
--    20260910160000_scope_content_to_profiles.sql used for pre-profile rows.
--
-- 2. touch_streak() counts the first recorded day. A new account starts with
--    last_active_date = today and streak_count = 0 (the signup row), so its
--    second day became a streak of 1 instead of 2.
--
-- Apply in the Supabase SQL editor after 20260927120000.

begin;

do $$
declare
  t text;
  n bigint;
  scoped text[] := array[
    'projects', 'captures', 'tasks', 'priority_tasks', 'area_notes',
    'garden_cores', 'portfolio_entries', 'daily_focus', 'timer_sessions',
    'daily_checkins', 'agenda_instances', 'calendar_events'
  ];
begin
  foreach t in array scoped loop
    if to_regclass('public.' || t) is null then
      raise notice '%: table not present, skipped', t;
      continue;
    end if;
    execute format(
      'update public.%I c
          set profile_id = pp.id
         from public.persona_profiles pp
        where pp.user_id = c.user_id
          and pp.is_master
          and c.profile_id is null',
      t
    );
    get diagnostics n = row_count;
    raise notice '%: % row(s) moved to the master profile', t, n;
  end loop;
end $$;

create or replace function public.touch_streak(p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today  date := coalesce(p_today, current_date);
  v_last   date;
  v_streak int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  if v_today not between current_date - 1 and current_date + 1 then
    v_today := current_date;
  end if;

  select p.last_active_date, coalesce(p.streak_count, 0)
    into v_last, v_streak
    from public.profiles p where p.id = auth.uid()
    for update;

  if v_last is not null and v_today <= v_last then
    return jsonb_build_object('streak_count', greatest(v_streak, 1), 'last_active_date', v_last, 'changed', false);
  end if;

  -- A recorded day counts as day one even if the count was never written.
  v_streak := case when v_last = v_today - 1 then greatest(v_streak, 1) + 1 else 1 end;
  update public.profiles
     set streak_count = v_streak,
         last_active_date = v_today,
         longest_streak = greatest(coalesce(longest_streak, 0), v_streak)
   where id = auth.uid();

  return jsonb_build_object('streak_count', v_streak, 'last_active_date', v_today, 'changed', true);
end;
$$;

commit;
