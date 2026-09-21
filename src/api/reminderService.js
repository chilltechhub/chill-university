// src/api/reminderService.js
// A reminder is a planner item with a time — plus, on a phone, a
// notification before it. Keeping reminders in agenda_instances rather than
// a table of their own means they sync across devices, show in the Planner
// and the calendar, and get the Planner's Done / Snooze / Tomorrow buttons
// for free.
//
// A reminder can point at the thing it's about (a project, quest, idea or
// vault item) through the planner's link columns, so the notification and
// the Planner row both open it.

import { Platform } from 'react-native';
import { supabase } from './profileScopedClient';
import { todayStr, addDays } from '../logic/dateUtils';
import { repeatDates } from '../logic/aiBridgeFormat';
import { linkFieldsFor } from '../logic/openTarget';
import { schedulePlanReminder, hasScheduledReminder } from '../logic/planReminderActions';
import { markManualReminder } from '../logic/hubNotifications';

const LINK_COLS = ['link_type', 'link_id', 'link_screen'];

// Inserts, and if the database still has the old three-kind link check
// (before 20260921120000_planner_link_kinds.sql) or no link columns at all,
// tries again without the link rather than losing the reminder.
async function insertInstances(rows) {
  let res = await supabase.from('agenda_instances').insert(rows).select();
  if (res.error && rows.some(r => r.link_type)) {
    const linkProblem = res.error.code === '23514' || res.error.code === 'PGRST204' || /link_/.test(res.error.message || '');
    if (linkProblem) {
      const bare = rows.map(r => Object.fromEntries(Object.entries(r).filter(([k]) => !LINK_COLS.includes(k))));
      res = await supabase.from('agenda_instances').insert(bare).select();
      if (!res.error) return { data: res.data, linkDropped: true };
    }
  }
  if (res.error) throw res.error;
  return { data: res.data || [], linkDropped: false };
}

/**
 * { title, date 'YYYY-MM-DD', time 'HH:MM' | null, repeat null|'daily'|'weekly'|'monthly',
 *   area, target (openTarget.js) | null, notes, notify, lead (minutes before) }
 * Resolves { rows, notified, linkDropped }.
 */
export async function createReminder(userId, opts) {
  if (!userId) throw new Error('Sign in to save reminders.');
  const link = linkFieldsFor(opts.target);
  const rows = repeatDates(opts.date, opts.repeat).map(date => ({
    user_id: userId,
    title: opts.title.trim(),
    area: opts.area || 'physical',
    cadence: opts.repeat || 'daily',
    type: 'checklist',
    date,
    start_time: opts.time || null,
    duration_minutes: null,
    notes: opts.notes?.trim() || null,
    completed: false,
    skipped: false,
    ...(link.link_type ? link : {}),
  }));
  const { data, linkDropped } = await insertInstances(rows);
  let notified = 0;
  if (opts.notify && opts.time && Platform.OS !== 'web') {
    for (const row of data) {
      // A row whose link was dropped still gets its target in the
      // notification, so tapping it opens the right thing anyway.
      const withLink = linkDropped ? { ...row, ...link } : row;
      if (await schedulePlanReminder(withLink, opts.lead ?? 0)) {
        notified++;
        await markManualReminder(row.id);
      }
    }
  }
  return { rows: data, notified, linkDropped };
}

// Timed plans from now through `days` ahead, each with whether a phone
// reminder is set for it.
export async function listUpcoming(userId, days = 7) {
  if (!userId) return [];
  const today = todayStr();
  const { data, error } = await supabase.from('agenda_instances')
    .select('id,title,date,start_time,area,notes,completed,skipped,cadence,link_type,link_id,link_screen')
    .eq('user_id', userId).gte('date', today).lte('date', addDays(today, days))
    .not('start_time', 'is', null)
    .order('date').order('start_time').limit(120);
  if (error) throw error;
  const now = new Date();
  const live = (data || []).filter((i) => {
    if (i.completed || i.skipped) return false;
    if (i.date !== today) return true;
    const [h, m] = String(i.start_time).split(':').map(Number);
    return h * 60 + m >= now.getHours() * 60 + now.getMinutes() - 30;
  });
  return Promise.all(live.map(async i => ({ ...i, reminderOn: await hasScheduledReminder(i.id) })));
}

// "Move to today" on the slipped-plans notice. Resolves the old dates so the
// center can offer Undo.
export async function moveToToday(ids) {
  const { data: before, error: readErr } = await supabase.from('agenda_instances').select('id,date').in('id', ids);
  if (readErr) throw readErr;
  const { error } = await supabase.from('agenda_instances').update({ date: todayStr() }).in('id', ids);
  if (error) throw error;
  return before || [];
}

export async function restoreDates(before) {
  for (const { id, date } of before) {
    const { error } = await supabase.from('agenda_instances').update({ date }).eq('id', id);
    if (error) throw error;
  }
}
