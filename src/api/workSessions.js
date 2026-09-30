// src/api/workSessions.js
// Time on the calendar to work on a project: the same days each week, at one
// time, for a few weeks. Each session is a planner row (agenda_instances)
// linked to the project, so it shows in the Planner and the calendar, opens
// the project when tapped, and gets the Planner's Done / Snooze buttons. A
// phone reminder is optional, the same as any reminder (reminderService.js).
//
// "Fill with AI" writes the same rows through buildSessionRows, so a plan
// made by a chatbot and one set by hand on the project look the same.

import { Platform } from 'react-native';
import { supabase } from './profileScopedClient';
import { todayStr, addDays } from '../logic/dateUtils';
import { sessionDates } from '../logic/aiBridgeFormat';
import { schedulePlanReminder } from '../logic/planReminderActions';
import { markManualReminder } from '../logic/hubNotifications';

// Which life area a build's work time counts toward, by its type (the
// category without its emoji). Anything else is professional.
const AREA_FOR_TYPE = {
  Art: 'creative', Writing: 'creative', Music: 'creative', DIY: 'creative',
  Finance: 'financial', Personal: 'mental', Travel: 'social', Science: 'mental',
};

export function areaForProject(project) {
  const type = String(project?.category || '').replace(/^\S+\s+/, '');
  return AREA_FOR_TYPE[type] || 'professional';
}

/**
 * opts: { days: [0-6], time 'HH:MM' | null, minutes, weeks, start 'YYYY-MM-DD',
 *         label, area }
 * Returns the planner rows, not yet saved.
 */
export function buildSessionRows(userId, project, opts) {
  const start = opts.start || addDays(todayStr(), 1);
  return sessionDates({ days: opts.days, weeks: opts.weeks, start }).map(date => ({
    user_id: userId,
    title: (opts.label || `Work on ${project.title}`).slice(0, 120),
    area: opts.area || areaForProject(project),
    cadence: 'weekly',
    type: 'checklist',
    date,
    start_time: opts.time || null,
    duration_minutes: opts.minutes || null,
    notes: project.next_action ? `Next step: ${project.next_action}` : null,
    completed: false,
    skipped: false,
    link_type: 'project',
    link_id: project.id,
    link_screen: null,
  }));
}

// Phone reminders for saved session rows, `lead` minutes before. Web has no
// local notifications, so this is a no-op there.
export async function remindSessions(rows, lead) {
  if (Platform.OS === 'web' || typeof lead !== 'number') return 0;
  let n = 0;
  for (const row of rows) {
    if (!row.start_time) continue;
    if (await schedulePlanReminder(row, lead)) { n++; await markManualReminder(row.id); }
  }
  return n;
}

// Saves a block of sessions. Resolves { rows, notified }.
export async function scheduleWorkSessions(userId, project, opts) {
  if (!userId) throw new Error('Sign in to schedule work time.');
  const rows = buildSessionRows(userId, project, opts);
  if (!rows.length) throw new Error('Pick at least one day.');
  const { data, error } = await supabase.from('agenda_instances').insert(rows).select();
  if (error) throw error;
  const notified = opts.remind === false || opts.remind == null ? 0 : await remindSessions(data || [], opts.remind);
  return { rows: data || [], notified };
}

// This project's work time from today on, soonest first.
export async function listProjectSessions(projectId, limit = 30) {
  const { data, error } = await supabase.from('agenda_instances')
    .select('id,title,date,start_time,duration_minutes,completed,skipped')
    .eq('link_type', 'project').eq('link_id', projectId)
    .gte('date', todayStr())
    .order('date').order('start_time')
    .limit(limit);
  if (error) throw error;
  return (data || []).filter(r => !r.skipped);
}
