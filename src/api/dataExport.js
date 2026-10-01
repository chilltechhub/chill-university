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

// Native-only modules, loaded lazily so web never pulls them in.
function nativeFileModules() {
  if (Platform.OS === 'web') return null;
  try {
    return { fs: require('expo-file-system'), sharing: require('expo-sharing') };
  } catch {
    return null; // a build from before these were added
  }
}

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

// Tables are read a few at a time. One after another was ~34 round trips in a
// row, several seconds on a phone; all at once would be 34 requests fighting
// over one connection.
const BATCH = 6;
async function inBatches(items, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += BATCH) {
    out.push(...await Promise.all(items.slice(i, i + BATCH).map(fn)));
  }
  return out;
}

export async function buildMyDataExport() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to export your data.');

  const tables = {};
  tables.profiles = await readTable(supabase.from('profiles').select('*').eq('id', user.id));

  const userRows = await inBatches(USER_TABLES, t =>
    readTable(supabase.from(t).select('*').eq('user_id', user.id)));
  USER_TABLES.forEach((t, i) => { tables[t] = userRows[i]; });

  // Child tables need their parent's ids, so they go after.
  const childRows = await inBatches(CHILD_TABLES, ({ table, key, parent }) => {
    const ids = Array.isArray(tables[parent]) ? tables[parent].map(row => row.id).filter(Boolean) : [];
    return ids.length ? readTable(supabase.from(table).select('*').in(key, ids)) : [];
  });
  CHILD_TABLES.forEach(({ table }, i) => { tables[table] = childRows[i]; });

  return {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    tables,
  };
}

// Web downloads a .json file. Phones write the file to the cache folder and
// share the FILE (Save to Files, Drive, Mail…). It used to hand the whole
// JSON to the share sheet as one text message, which for a heavy account is
// megabytes across the bridge: a frozen or crashed share sheet, and "Save to
// Files" made a text snippet, not a file.
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

  const mods = nativeFileModules();
  if (mods && await mods.sharing.isAvailableAsync()) {
    const file = new mods.fs.File(mods.fs.Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(json);
    await mods.sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Export My Data',
    });
    return;
  }

  // Older build without the file modules: the text share still works for a
  // small account.
  await Share.share({ title: filename, message: json });
}
