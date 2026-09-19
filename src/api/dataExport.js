// src/api/dataExport.js
// "Export My Data" in Settings — one JSON file of everything this account has
// stored, so the row does what its label says.
//
// Best-effort per table: a table or column that isn't on the live database
// (migration drift is real here — see the pending-migrations notes) records
// its error in the export instead of failing the whole thing. Every query is
// filtered to the signed-in user explicitly, on top of RLS, so a table that
// is readable more widely (org rosters, community feeds) still only exports
// this person's own rows.

import { Platform, Share } from 'react-native';
import { supabase } from './supabaseClient';

// Tables keyed directly on the account.
const USER_TABLES = [
  'persona_profiles', 'user_settings', 'captures', 'area_notes', 'projects',
  'tasks', 'priority_tasks', 'garden_cores', 'garden_vines', 'agenda_instances',
  'calendar_events', 'daily_focus', 'daily_checkins', 'user_planner_components',
  'life_areas', 'user_area_actions', 'portfolio_entries', 'vault_documents',
  'wayfinder_maps', 'user_objectives', 'feature_unlocks', 'user_missions',
  'subject_progress', 'timer_sessions', 'activity_log', 'project_research',
  'community_posts', 'organization_members',
];

// Tables keyed on a parent row instead of the user.
const CHILD_TABLES = [
  { table: 'project_tasks',      key: 'project_id', parent: 'projects' },
  { table: 'project_milestones', key: 'project_id', parent: 'projects' },
  { table: 'project_journal',    key: 'project_id', parent: 'projects' },
  { table: 'garden_petals',      key: 'core_id',    parent: 'garden_cores' },
  { table: 'garden_updates',     key: 'core_id',    parent: 'garden_cores' },
];

async function readTable(query) {
  const { data, error } = await query;
  return error ? { error: error.message } : (data || []);
}

export async function buildMyDataExport() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to export your data.');

  const tables = {};
  tables.profiles = await readTable(supabase.from('profiles').select('*').eq('id', user.id));

  for (const t of USER_TABLES) {
    tables[t] = await readTable(supabase.from(t).select('*').eq('user_id', user.id));
  }

  for (const { table, key, parent } of CHILD_TABLES) {
    const ids = Array.isArray(tables[parent]) ? tables[parent].map(row => row.id).filter(Boolean) : [];
    tables[table] = ids.length
      ? await readTable(supabase.from(table).select('*').in(key, ids))
      : [];
  }

  return {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    tables,
  };
}

// Web downloads a .json file; native opens the share sheet with the JSON as
// text (Save to Files / Mail / Notes all accept it). No new native packages.
export async function shareMyDataExport() {
  const data = await buildMyDataExport();
  const json = JSON.stringify(data, null, 2);
  const filename = `chill-data-${data.exported_at.slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({ title: filename, message: json });
}
