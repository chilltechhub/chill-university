// src/api/trashService.js
// Recently Deleted — one shared trash for Projects, Ideas, Notes, and
// Research. Nothing is hard-deleted from the app anymore; a delete just
// stamps deleted_at and the item drops out of every normal list. It then
// lives in the Capture Inbox's "Deleted" tab for RETENTION_DAYS, where it
// can be restored or purged early. purgeExpired() sweeps anything older
// than that — call it whenever the Deleted tab is opened, since there's no
// server-side cron doing it for us.

import { supabase } from './supabaseClient';

export const RETENTION_DAYS = 7;

function cutoffISO() {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d.toISOString();
}

const TABLE = { project: 'projects', idea: 'garden_cores', note: 'captures', research: 'captures' };

// ─── One combined, chronological list ──────────────────────────────────────

export async function getRecentlyDeleted(userId) {
  const [{ data: projects }, { data: cores }, { data: captures }] = await Promise.all([
    supabase.from('projects').select('id, title, emoji, color, status, deleted_at')
      .eq('user_id', userId).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('garden_cores').select('id, title, plant_type, color, deleted_at')
      .eq('user_id', userId).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('captures').select('id, title, body, type, deleted_at')
      .eq('user_id', userId).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ]);
  const items = [
    ...(projects || []).map(p => ({ kind: 'project', ...p })),
    ...(cores || []).map(c => ({ kind: 'idea', ...c })),
    ...(captures || []).map(cap => ({ kind: cap.type === 'link' ? 'research' : 'note', ...cap })),
  ];
  return items.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
}

// ─── Restore ────────────────────────────────────────────────────────────────

export async function restoreItem(kind, id) {
  const { error } = await supabase.from(TABLE[kind]).update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
}

// ─── Permanent delete — real removal, including dependent rows ────────────

export async function permanentlyDelete(kind, id) {
  if (kind === 'project') {
    await Promise.all([
      supabase.from('project_tasks').delete().eq('project_id', id),
      supabase.from('project_journal').delete().eq('project_id', id),
      supabase.from('project_research').delete().eq('project_id', id),
      supabase.from('project_milestones').delete().eq('project_id', id),
    ]);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  } else if (kind === 'idea') {
    await Promise.all([
      supabase.from('garden_petals').delete().eq('core_id', id),
      supabase.from('garden_updates').delete().eq('core_id', id),
      supabase.from('garden_vines').delete().or(`core_a.eq.${id},core_b.eq.${id}`),
    ]);
    const { error } = await supabase.from('garden_cores').delete().eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('captures').delete().eq('id', id);
    if (error) throw error;
  }
}

// ─── Sweep anything past the retention window ──────────────────────────────

export async function purgeExpired(userId) {
  const cutoff = cutoffISO();
  const [{ data: projects }, { data: cores }, { data: captures }] = await Promise.all([
    supabase.from('projects').select('id').eq('user_id', userId).not('deleted_at', 'is', null).lt('deleted_at', cutoff),
    supabase.from('garden_cores').select('id').eq('user_id', userId).not('deleted_at', 'is', null).lt('deleted_at', cutoff),
    supabase.from('captures').select('id').eq('user_id', userId).not('deleted_at', 'is', null).lt('deleted_at', cutoff),
  ]);
  await Promise.all([
    ...(projects || []).map(p => permanentlyDelete('project', p.id)),
    ...(cores || []).map(c => permanentlyDelete('idea', c.id)),
    ...(captures || []).map(cap => permanentlyDelete('note', cap.id)),
  ]);
}
