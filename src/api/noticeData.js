// src/api/noticeData.js
// Everything notices.js needs, read in one parallel pass. Read-only.
//
// Each source is optional: a query that fails (offline, a column a database
// hasn't migrated yet) just contributes nothing, so one broken table can't
// blank the whole Notification Center.

import { Platform } from 'react-native';
import { supabase } from './profileScopedClient';
import { fetchContentPool } from './remoteConfigService';
import { todayStr, addDays } from '../logic/dateUtils';
import { getQuestProgress, QUEST_STEPS } from '../logic/questProgress';
import { getQuest } from '../data/quests';
import { listShared } from '../logic/shareIntake';

const AREA_KEYS = ['physical', 'mental', 'social', 'financial', 'professional', 'spiritual', 'creative', 'digital'];

const safe = async (fn, fallback) => {
  try { return await fn(); } catch (e) { console.warn('[notices]', e?.message || e); return fallback; }
};
const rows = (res) => { if (res.error) throw res.error; return res.data || []; };

export async function loadNoticeData(userId) {
  const today = todayStr();
  const [planner, tasks, projects, ideas, inboxCount, areas, quests, news, shared] = await Promise.all([
    userId ? safe(async () => rows(await supabase.from('agenda_instances')
      .select('id,title,date,start_time,duration_minutes,area,notes,completed,skipped,link_type,link_id,link_screen')
      .eq('user_id', userId).gte('date', addDays(today, -7)).lte('date', addDays(today, 7))
      .order('date').order('start_time').limit(300)), []) : [],

    userId ? safe(async () => rows(await supabase.from('tasks')
      .select('id,title,due_date,completed')
      .eq('user_id', userId).eq('completed', false).not('due_date', 'is', null).lte('due_date', today).limit(100)), []) : [],

    userId ? safe(async () => {
      const ps = rows(await supabase.from('projects')
        .select('id,title,status,next_action,created_at,updated_at')
        .eq('user_id', userId).eq('status', 'active').is('deleted_at', null).limit(60));
      if (!ps.length) return [];
      const ts = rows(await supabase.from('project_tasks').select('project_id,completed').in('project_id', ps.map(p => p.id)));
      return ps.map(p => {
        const mine = ts.filter(t => t.project_id === p.id);
        return { ...p, taskTotal: mine.length, taskDone: mine.filter(t => t.completed).length };
      });
    }, []) : [],

    userId ? safe(async () => rows(await supabase.from('garden_cores')
      .select('id,title,plant_type,project_id,created_at,updated_at')
      .eq('user_id', userId).is('deleted_at', null).limit(100)), []) : [],

    userId ? safe(async () => {
      const { count, error } = await supabase.from('captures').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('status', 'inbox').is('deleted_at', null);
      if (error) throw error;
      return count || 0;
    }, 0) : 0,

    userId ? safe(async () => rows(await supabase.from('life_areas')
      .select('label,last_check_date').eq('user_id', userId))
      .map(a => ({ key: String(a.label || '').toLowerCase(), label: a.label, last_check_date: a.last_check_date }))
      .filter(a => AREA_KEYS.includes(a.key)), []) : [],

    safe(async () => {
      const st = await getQuestProgress();
      return Object.entries(st.byId || {}).map(([id, p]) => {
        const q = getQuest(id);
        if (!q) return null;
        const doneNow = p.completedAt && (!p.restartedAt || p.step === 'done');
        return {
          id, title: q.title, step: p.step,
          stepLabel: QUEST_STEPS.find(s => s.key === p.step)?.label || p.step,
          done: !!doneNow,
        };
      }).filter(Boolean);
    }, []),

    safe(async () => (await fetchContentPool('announcement')).slice(0, 3)
      .map(r => ({ id: r.id, title: r.title, body: r.body, updated_at: r.updated_at })), []),

    safe(() => listShared(), []),
  ]);

  return { planner, tasks, projects, ideas, inboxCount, areas, quests, news, shared, loadedAt: Date.now(), platform: Platform.OS };
}
