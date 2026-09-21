// src/api/aiBridgeData.js
// The database side of "Fill with AI" (see src/logic/aiBridgeFormat.js).
//
//   loadSnapshot   reads the person's current items in the shape the prompt
//                  and the reply use, each with its row id (and the full row
//                  on `_row`, so a hard delete can be undone).
//   applyChanges   runs the changes they ticked, in order, and returns an
//                  undo log alongside what worked and what didn't.
//   undoChanges    plays that log backwards.
//
// Every write goes through the profile-scoped client, so a new project lands
// in the active profile exactly as if it had been made on its own screen.
// Deletes follow each screen's own rule: projects, ideas and vault items go
// to Recently Deleted (trashService.js); everything else is removed, and
// comes back only through Undo.

import { supabase } from './profileScopedClient';
import { isOnline } from './offlineCache';
import { todayStr } from '../logic/dateUtils';
import {
  AREA_IDS, PROJECT_STAGES, STAGE_FOR_STATUS, EXPORT_CAPS, LIMITS, repeatDates, addDaysIso,
} from '../logic/aiBridgeFormat';
import { BUILD_TYPES } from '../screens/library/projects';
import { PLANT_TYPES } from '../screens/library/ideagarden';
import { KINDS, rowKind } from '../screens/library/knowledge';
import { schedulePlanReminder, cancelPlanReminder, hasScheduledReminder } from '../logic/planReminderActions';
import { markManualReminder, setPlanReminder } from '../logic/hubNotifications';

// The Workshop's first build colour (blueprint.js light `accent`).
const PROJECT_COLOR = '#0f7f96';

const must = ({ data, error }) => { if (error) throw error; return data; };

const buildTypeFor = (name) => BUILD_TYPES.find(b => b.replace(/^\S+\s+/, '') === name) || null;
const typeNameFor = (category) => (BUILD_TYPES.includes(category) ? category.replace(/^\S+\s+/, '') : null);

// ─── Loading ────────────────────────────────────────────────────────────────

async function loadProjects(userId) {
  const projects = must(await supabase.from('projects').select('*')
    .eq('user_id', userId).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(EXPORT_CAPS.projects)) || [];
  const ids = projects.map(p => p.id);
  const [tasks, journal, research] = ids.length ? await Promise.all([
    supabase.from('project_tasks').select('*').in('project_id', ids).order('sort_order').order('created_at'),
    supabase.from('project_journal').select('*').in('project_id', ids).order('created_at'),
    supabase.from('project_research').select('*').in('project_id', ids).order('created_at'),
  ]).then(rs => rs.map(must)) : [[], [], []];
  const under = (rows, id) => (rows || []).filter(r => r.project_id === id).slice(0, LIMITS.children);
  return projects.map(p => ({
    id: p.id,
    title: p.title,
    goal: p.objective,
    type: typeNameFor(p.category),
    stage: STAGE_FOR_STATUS[p.status] || 'building',
    next_step: p.next_action,
    tasks: under(tasks, p.id).map(t => ({ id: t.id, title: t.title, done: !!t.completed, _row: t })),
    notes: under(journal, p.id).map(n => ({ id: n.id, title: n.title, body: n.body, type: n.type, _row: n })),
    links: under(research, p.id).map(l => ({ id: l.id, title: l.title, url: l.url, notes: l.notes, _row: l })),
    _row: p,
  }));
}

async function loadIdeas(userId) {
  const cores = must(await supabase.from('garden_cores').select('*, garden_petals(*)')
    .eq('user_id', userId).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(EXPORT_CAPS.ideas)) || [];
  return cores.map(({ garden_petals: petals, ...c }) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    stage: c.plant_type,
    petals: (petals || [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .slice(0, LIMITS.children)
      .map(p => ({ id: p.id, type: p.petal_type, title: p.title, body: p.body, done: !!p.completed, _row: p })),
    _row: c,
  }));
}

// Same visibility rule as the Knowledge Vault's own list.
const vaultVisible = (row) => (row.type === 'note'
  || (row.type === 'link' && ['inbox', 'active'].includes(row.status))
  || (row.type === 'resource' && row.status === 'active'));

async function loadVault(userId) {
  const rows = must(await supabase.from('captures').select('*')
    .eq('user_id', userId).in('type', ['note', 'link', 'resource'])
    .neq('status', 'archived').is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(EXPORT_CAPS.vault)) || [];
  return rows.filter(vaultVisible).map(r => {
    const tags = r.tags || [];
    return {
      id: r.id,
      kind: rowKind(r),
      title: r.title,
      body: r.body,
      url: r.url,
      tags: tags.filter(t => !AREA_IDS.includes(t)),
      area: tags.find(t => AREA_IDS.includes(t)) || null,
      _row: r,
    };
  });
}

async function loadPlanner(userId) {
  const today = todayStr();
  const rows = must(await supabase.from('agenda_instances').select('*')
    .eq('user_id', userId)
    .gte('date', addDaysIso(today, -7)).lte('date', addDaysIso(today, 60))
    .order('date').order('start_time').limit(EXPORT_CAPS.planner)) || [];
  return Promise.all(rows.map(async r => ({
    id: r.id,
    title: r.title,
    date: r.date,
    time: r.start_time ? String(r.start_time).slice(0, 5) : null,
    minutes: r.duration_minutes,
    area: r.area,
    notes: r.notes,
    done: !!r.completed,
    remind: await hasScheduledReminder(r.id),
    _row: r,
  })));
}

// Only the person's own actions (action_key null). The built-in pool is
// shared content; hiding or rewording it stays on the Life Area screens.
async function loadLifeAreaActions(userId, areaCatalog) {
  const rows = must(await supabase.from('user_area_actions').select('*')
    .eq('user_id', userId).is('action_key', null)
    .order('created_at').limit(EXPORT_CAPS.life_areas)) || [];
  const where = {};
  for (const a of areaCatalog) for (const s of a.sections) where[s.screen] = { area: a.id, section: s.title };
  return rows.filter(r => where[r.screen_tag]).map(r => ({
    id: r.id,
    area: where[r.screen_tag].area,
    section: where[r.screen_tag].section,
    screen: r.screen_tag,
    title: r.title,
    why: r.why,
    type: r.tier || 'habit',
    _row: r,
  }));
}

async function loadPortfolio(userId) {
  const rows = must(await supabase.from('portfolio_entries').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(EXPORT_CAPS.portfolio)) || [];
  return rows.map(r => ({ id: r.id, section: r.section, title: r.title, description: r.description, link: r.link, tag: r.tag, _row: r }));
}

export async function loadSnapshot(userId, targets, areaCatalog) {
  const loaders = {
    projects: () => loadProjects(userId),
    ideas: () => loadIdeas(userId),
    vault: () => loadVault(userId),
    planner: () => loadPlanner(userId),
    life_areas: () => loadLifeAreaActions(userId, areaCatalog),
    portfolio: () => loadPortfolio(userId),
  };
  const snap = {};
  await Promise.all(targets.map(async (k) => { snap[k] = await loaders[k](); }));
  return snap;
}

// ─── Writing, with an undo log ──────────────────────────────────────────────
// Undo entries: { type: 'insert', table, id, cascade }   -> delete it (and its children)
//               { type: 'update', table, id, old }       -> put the old values back
//               { type: 'soft_delete', table, id }       -> clear deleted_at
//               { type: 'hard_delete', table, row }      -> insert the row again

async function insertRows(table, rows, undo, cascade) {
  if (!rows.length) return [];
  const data = must(await supabase.from(table).insert(rows).select());
  for (const r of data || []) undo.push({ type: 'insert', table, id: r.id, cascade });
  return data || [];
}

async function updateRow(table, id, cols, oldRow, undo) {
  if (!Object.keys(cols).length) return;
  const old = {};
  for (const k of Object.keys(cols)) old[k] = oldRow ? (oldRow[k] ?? null) : null;
  must(await supabase.from(table).update(cols).eq('id', id));
  undo.push({ type: 'update', table, id, old });
}

async function softDelete(table, id, undo) {
  must(await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id));
  undo.push({ type: 'soft_delete', table, id });
}

async function hardDelete(table, id, row, undo) {
  must(await supabase.from(table).delete().eq('id', id));
  if (row) undo.push({ type: 'hard_delete', table, row });
}

const has = (f, k) => Object.prototype.hasOwnProperty.call(f, k);
const doneCols = (done) => ({ completed: !!done, completed_at: done ? new Date().toISOString() : null });

// Children of a project or idea: creates in one insert per table, then
// edits, then deletes.
async function applyChildren(kids, { tables, parentKey, parentId, userId, toCreate, toUpdate }, undo) {
  const byTable = {};
  kids.filter(k => k.status === 'ok' && k.op === 'create').forEach((k, i) => {
    const t = tables[k.kind];
    (byTable[t] = byTable[t] || []).push({ user_id: userId, [parentKey]: parentId, ...toCreate(k, i) });
  });
  for (const [t, rows] of Object.entries(byTable)) await insertRows(t, rows, undo);
  for (const k of kids.filter(x => x.status === 'ok' && x.op === 'update')) {
    await updateRow(tables[k.kind], k.id, toUpdate(k), k.current._row, undo);
  }
  for (const k of kids.filter(x => x.status === 'ok' && x.op === 'delete')) {
    await hardDelete(tables[k.kind], k.id, k.current._row, undo);
  }
}

const PROJECT_TABLES = { task: 'project_tasks', note: 'project_journal', link: 'project_research' };
const PROJECT_CASCADE = [['project_tasks', 'project_id'], ['project_journal', 'project_id'], ['project_research', 'project_id'], ['project_milestones', 'project_id']];

function projectCols(f) {
  const c = {};
  if (has(f, 'title')) c.title = f.title;
  if (has(f, 'goal')) c.objective = f.goal;
  if (has(f, 'type')) c.category = buildTypeFor(f.type) || 'general';
  if (has(f, 'stage')) c.status = PROJECT_STAGES[f.stage] || 'active';
  if (has(f, 'next_step')) c.next_action = f.next_step;
  return c;
}

const plantColors = (stage) => {
  const pt = PLANT_TYPES.find(p => p.id === stage) || PLANT_TYPES.find(p => p.id === 'plant');
  return { color: pt.color, color_light: pt.light };
};

function vaultTags(tags, area) {
  return Array.from(new Set([...(area ? [area] : []), ...(tags || [])]));
}

const APPLY = {
  async projects(userId, ch, undo) {
    if (ch.op === 'delete') return softDelete('projects', ch.id, undo);
    let projectId = ch.id;
    if (ch.op === 'create') {
      const f = ch.fields;
      const buildType = buildTypeFor(f.type);
      const emoji = buildType ? buildType.split(' ')[0] : '🏗️';
      const [row] = await insertRows('projects', [{
        user_id: userId, title: f.title, objective: f.goal || null,
        emoji, color: PROJECT_COLOR, cover_color: PROJECT_COLOR, banner_emoji: emoji,
        category: buildType || 'general', status: PROJECT_STAGES[f.stage] || 'active',
        next_action: f.next_step || null, sort_order: 0,
      }], undo, PROJECT_CASCADE);
      projectId = row.id;
      must(await supabase.from('project_milestones').insert({
        user_id: userId, project_id: projectId, title: '🏗️ Build started', type: 'project_created', date: todayStr(),
      }));
    } else {
      const cols = projectCols(ch.fields);
      if (Object.keys(cols).length) await updateRow('projects', ch.id, { ...cols, updated_at: new Date().toISOString() }, ch.current._row, undo);
    }
    await applyChildren(ch.children, {
      tables: PROJECT_TABLES, parentKey: 'project_id', parentId: projectId, userId,
      toCreate: (k, i) => (k.kind === 'task'
        ? { title: k.fields.title, priority: 3, sort_order: i, ...doneCols(k.fields.done) }
        : k.kind === 'note'
          ? { title: k.fields.title || null, body: k.fields.body || k.fields.title, type: k.fields.type || 'note' }
          : { title: k.fields.title, type: 'link', url: k.fields.url, notes: k.fields.notes || null }),
      toUpdate: (k) => {
        const f = k.fields;
        const c = {};
        if (has(f, 'title')) c.title = f.title;
        if (k.kind === 'task' && has(f, 'done')) Object.assign(c, doneCols(f.done));
        if (k.kind === 'note') { if (has(f, 'body')) c.body = f.body; if (has(f, 'type')) c.type = f.type || 'note'; }
        if (k.kind === 'link') { if (has(f, 'url')) c.url = f.url; if (has(f, 'notes')) c.notes = f.notes; }
        return c;
      },
    }, undo);
  },

  async ideas(userId, ch, undo) {
    if (ch.op === 'delete') return softDelete('garden_cores', ch.id, undo);
    let coreId = ch.id;
    if (ch.op === 'create') {
      const stage = ch.fields.stage || 'plant';
      const [row] = await insertRows('garden_cores', [{
        user_id: userId, title: ch.fields.title, description: ch.fields.description || null,
        plant_type: stage, is_project: false, project_status: 'idea', ...plantColors(stage),
        pos_x: 0.15 + Math.random() * 0.7, pos_y: 0.15 + Math.random() * 0.55,
        updated_at: new Date().toISOString(),
      }], undo, [['garden_petals', 'core_id']]);
      coreId = row.id;
    } else {
      const f = ch.fields;
      const c = {};
      if (has(f, 'title')) c.title = f.title;
      if (has(f, 'description')) c.description = f.description;
      if (has(f, 'stage') && f.stage) Object.assign(c, { plant_type: f.stage, ...plantColors(f.stage) });
      if (Object.keys(c).length) await updateRow('garden_cores', ch.id, { ...c, updated_at: new Date().toISOString() }, ch.current._row, undo);
    }
    const start = (ch.current?.petals || []).length;
    await applyChildren(ch.children, {
      tables: { petal: 'garden_petals' }, parentKey: 'core_id', parentId: coreId, userId,
      toCreate: (k, i) => ({
        title: k.fields.title, body: k.fields.body || null, petal_type: k.fields.type || 'idea',
        sort_order: start + i, completed: !!k.fields.done,
      }),
      toUpdate: (k) => {
        const f = k.fields;
        const c = {};
        if (has(f, 'title')) c.title = f.title;
        if (has(f, 'body')) c.body = f.body;
        if (has(f, 'type') && f.type) c.petal_type = f.type;
        if (has(f, 'done')) c.completed = !!f.done;
        return c;
      },
    }, undo);
  },

  async vault(userId, ch, undo) {
    if (ch.op === 'delete') return softDelete('captures', ch.id, undo);
    const f = ch.fields;
    if (ch.op === 'create') {
      const meta = KINDS[f.kind] || KINDS.note;
      await insertRows('captures', [{
        user_id: userId, type: meta.type, status: meta.status,
        title: f.title || null, body: f.body || null, url: f.url || null,
        url_meta: { kind: f.kind, via: 'ai' },
        tags: vaultTags(f.tags, f.area), source: 'import',
      }], undo);
      return;
    }
    const row = ch.current._row;
    const c = {};
    if (has(f, 'title')) c.title = f.title;
    if (has(f, 'body')) c.body = f.body;
    if (has(f, 'url')) c.url = f.url;
    if (has(f, 'kind') && f.kind) {
      const meta = KINDS[f.kind];
      c.type = meta.type;
      c.url_meta = { ...(row.url_meta || {}), kind: f.kind };
      // Same rule as the Vault's own edit sheet: status only moves when the
      // row's type does, or a routed item would drop back into the Inbox.
      if (meta.type !== row.type) c.status = meta.status;
    }
    if (has(f, 'tags') || has(f, 'area')) {
      c.tags = vaultTags(has(f, 'tags') ? f.tags : ch.current.tags, has(f, 'area') ? f.area : ch.current.area);
    }
    await updateRow('captures', ch.id, c, row, undo);
  },

  async planner(userId, ch, undo) {
    if (ch.op === 'delete') {
      await cancelPlanReminder(ch.id);
      return hardDelete('agenda_instances', ch.id, ch.current._row, undo);
    }
    const f = ch.fields;
    const lead = f.remind === true ? 15 : f.remind;
    if (ch.op === 'create') {
      const rows = await insertRows('agenda_instances', repeatDates(f.date, f.repeat).map(date => ({
        user_id: userId, title: f.title, area: f.area || 'physical', cadence: f.repeat || 'daily',
        type: 'checklist', date, start_time: f.time || null, duration_minutes: f.minutes || null,
        notes: f.notes || null, skipped: false, ...doneCols(f.done),
      })), undo);
      if (typeof lead === 'number' && f.time) {
        for (const row of rows) if (await schedulePlanReminder(row, lead)) await markManualReminder(row.id);
      }
      return;
    }
    const c = {};
    if (has(f, 'title')) c.title = f.title;
    if (has(f, 'date')) c.date = f.date;
    if (has(f, 'time')) c.start_time = f.time;
    if (has(f, 'minutes')) c.duration_minutes = f.minutes;
    if (has(f, 'area') && f.area) c.area = f.area;
    if (has(f, 'notes')) c.notes = f.notes;
    if (has(f, 'done')) Object.assign(c, doneCols(f.done));
    await updateRow('agenda_instances', ch.id, c, ch.current._row, undo);
    // Keep the phone reminder in step: set or cleared when asked, and moved
    // when the plan's day or time moved.
    const next = { ...ch.current._row, ...c };
    if (f.remind === false || c.completed) await setPlanReminder(next, false);
    else if (typeof lead === 'number') { if (await schedulePlanReminder(next, lead)) await markManualReminder(ch.id); }
    else if ((has(f, 'date') || has(f, 'time')) && ch.current.remind) await schedulePlanReminder(next, 15);
  },

  async life_areas(userId, ch, undo) {
    const f = ch.fields;
    if (ch.kind === 'note') {
      await insertRows('area_notes', [{
        user_id: userId, area_id: f.area,
        content: f.screen ? `[${f.screen}][Note] ${f.text}` : f.text,
        created_at: new Date().toISOString(),
      }], undo);
      return;
    }
    if (ch.op === 'delete') return hardDelete('user_area_actions', ch.id, ch.current._row, undo);
    if (ch.op === 'create') {
      await insertRows('user_area_actions', [{
        user_id: userId, screen_tag: f.screen, action_key: null,
        title: f.title, why: f.why || null, tier: f.type || 'habit',
      }], undo);
      return;
    }
    const c = {};
    if (has(f, 'title')) c.title = f.title;
    if (has(f, 'why')) c.why = f.why;
    if (has(f, 'type') && f.type) c.tier = f.type;
    if (has(f, 'screen')) c.screen_tag = f.screen;
    if (Object.keys(c).length) await updateRow('user_area_actions', ch.id, { ...c, updated_at: new Date().toISOString() }, ch.current._row, undo);
  },

  async portfolio(userId, ch, undo) {
    if (ch.op === 'delete') return hardDelete('portfolio_entries', ch.id, ch.current._row, undo);
    const f = ch.fields;
    if (ch.op === 'create') {
      await insertRows('portfolio_entries', [{
        user_id: userId, section: f.section, title: f.title,
        description: f.description || null, link: f.link || null, tag: f.tag || null,
      }], undo);
      return;
    }
    const c = {};
    for (const k of ['section', 'title', 'description', 'link', 'tag']) if (has(f, k)) c[k] = f[k];
    if (c.section === null) delete c.section;
    await updateRow('portfolio_entries', ch.id, c, ch.current._row, undo);
  },
};

// resolved: resolveChanges() output. selected: Set of change keys.
// Returns { applied, failed: [{ key, message }], undo }.
export async function applyChanges(userId, resolved, selected, onProgress) {
  if (!(await isOnline())) throw new Error('You’re offline. Connect to the internet, then try again.');
  const todo = resolved.filter(r => r.status === 'ok' && selected.has(r.key));
  const undo = [];
  const failed = [];
  let applied = 0;
  for (let i = 0; i < todo.length; i++) {
    const ch = todo[i];
    try {
      await APPLY[ch.target](userId, ch, undo);
      applied++;
    } catch (e) {
      failed.push({ key: ch.key, message: e?.message || 'Something went wrong.' });
    }
    onProgress?.(i + 1, todo.length);
  }
  return { applied, failed, undo };
}

export async function undoChanges(undo) {
  const failed = [];
  for (const u of [...undo].reverse()) {
    try {
      if (u.type === 'insert') {
        if (u.table === 'agenda_instances') await cancelPlanReminder(u.id);
        for (const [table, key] of u.cascade || []) must(await supabase.from(table).delete().eq(key, u.id));
        must(await supabase.from(u.table).delete().eq('id', u.id));
      } else if (u.type === 'update') {
        must(await supabase.from(u.table).update(u.old).eq('id', u.id));
      } else if (u.type === 'soft_delete') {
        must(await supabase.from(u.table).update({ deleted_at: null }).eq('id', u.id));
      } else if (u.type === 'hard_delete') {
        must(await supabase.from(u.table).insert(u.row));
      }
    } catch (e) {
      failed.push(e?.message || 'Something went wrong.');
    }
  }
  return { failed };
}
