// src/components/PlannerBacklog.js
// The two things a planner loses track of, shown on today's page:
//
//   Left from earlier — one-off plans from the last two weeks that were
//   neither done nor skipped. They used to sit on their own past day, so a
//   to-do missed on Tuesday was gone from view on Wednesday unless someone
//   paged back to look. (Missed habits don't carry over: tomorrow has its own.)
//
//   No day yet — open to-dos (the `tasks` table: Inbox "Create a Task",
//   imports) with no due date. Nothing in the Planner showed them; Home's
//   desk shows three. Giving one a day puts it in the Planner's Due list.
//
// Each list shows three and says how many more. One tap per decision.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/profileScopedClient';
import { completeInstance, skipInstance, AREAS } from '../api/plannerService';
import { moveToToday } from '../api/reminderService';
import { completeTask } from '../api/captureService';
import { todayStr, addDays, dateStr } from '../logic/dateUtils';
import MiniCalendar from './MiniCalendar';
import RichText from './RichText';

const LOOKBACK_DAYS = 14;
const SHOWN = 3;

function shortDay(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PlannerBacklog({ userId, onChange, c, t, s, r }) {
  const [missed, setMissed] = useState([]);
  const [undated, setUndated] = useState([]);
  const [open, setOpen] = useState({ missed: false, undated: false });
  const [busy, setBusy] = useState(null);
  const [picking, setPicking] = useState(null); // task getting a day from the calendar

  const load = useCallback(async () => {
    if (!userId) return;
    const today = todayStr();
    const [m, u] = await Promise.all([
      supabase.from('agenda_instances')
        .select('id, title, date, area, start_time')
        .eq('user_id', userId).eq('cadence', 'once')
        .eq('completed', false).eq('skipped', false)
        .gte('date', addDays(today, -LOOKBACK_DAYS)).lt('date', today)
        .order('date', { ascending: false }).limit(50),
      supabase.from('tasks')
        .select('id, title, created_at')
        .eq('user_id', userId).eq('completed', false).is('due_date', null)
        .order('created_at', { ascending: false }).limit(50),
    ]);
    if (m.error) console.warn('[backlog] missed', m.error.message);
    if (u.error) console.warn('[backlog] undated', u.error.message);
    setMissed(m.data || []);
    setUndated(u.data || []);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const act = async (key, fn) => {
    setBusy(key);
    try { await fn(); await load(); onChange?.(); }
    catch (e) { console.warn('[backlog]', e?.message); }
    setBusy(null);
  };

  const setTaskDay = (task, iso) => act(`t-${task.id}`, async () => {
    const { error } = await supabase.from('tasks').update({ due_date: iso }).eq('id', task.id);
    if (error) throw error;
  });

  if (!missed.length && !undated.length) return null;

  const chip = (label, onPress, { filled = false, color = c.teal, a11y } = {}) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y || label}
      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: r.full, borderWidth: 1,
        borderColor: color, backgroundColor: filled ? color : 'transparent' }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: filled ? c.onFill : color }}>{label}</Text>
    </TouchableOpacity>
  );

  const header = (text, count, key) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.sm }}>
      <RichText style={{ flex: 1, fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{text}</RichText>
      {count > SHOWN && (
        <TouchableOpacity onPress={() => setOpen(o => ({ ...o, [key]: !o[key] }))} accessibilityRole="button">
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>{open[key] ? 'Show less' : `All ${count}`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const row = (key, title, sub, actions) => (
    <View key={key} style={{ paddingVertical: s.sm, borderTopWidth: 0.5, borderTopColor: c.border }}>
      <Text style={{ fontSize: t.sm, fontWeight: '600', color: c.text1 }} numberOfLines={2}>{title}</Text>
      {!!sub && <Text style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>{sub}</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
        {busy === key ? <ActivityIndicator size="small" color={c.teal} /> : actions}
      </View>
    </View>
  );

  const missedShown = open.missed ? missed : missed.slice(0, SHOWN);
  const undatedShown = open.undated ? undated : undated.slice(0, SHOWN);
  const today = todayStr();

  return (
    <View style={{ marginHorizontal: s.lg, marginBottom: s.md, padding: s.md, borderRadius: r.lg,
      backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, gap: s.md }}>

      {missed.length > 0 && (
        <View>
          {header(`**${missed.length} left from earlier**`, missed.length, 'missed')}
          {missedShown.map(m => row(`m-${m.id}`, m.title,
            `${AREAS[m.area]?.label || 'Planner'} · ${shortDay(m.date)}`,
            <>
              {chip('Today', () => act(`m-${m.id}`, () => moveToToday([m.id])), { filled: true, a11y: `Move ${m.title} to today` })}
              {chip('Done', () => act(`m-${m.id}`, () => completeInstance(m.id, true)), { a11y: `Mark ${m.title} done` })}
              {chip('Drop', () => act(`m-${m.id}`, () => skipInstance(m.id)), { color: c.text3, a11y: `Drop ${m.title}` })}
            </>))}
          {missed.length > 1 && (
            <TouchableOpacity onPress={() => act('all', () => moveToToday(missed.map(m => m.id)))} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: s.sm }}>
              {busy === 'all' ? <ActivityIndicator size="small" color={c.teal} /> : <Ionicons name="arrow-forward-circle-outline" size={16} color={c.teal} />}
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.teal }}>Move all {missed.length} to today</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {undated.length > 0 && (
        <View>
          {header(`**${undated.length} to-do${undated.length === 1 ? '' : 's'}** with no day yet`, undated.length, 'undated')}
          {undatedShown.map(task => row(`t-${task.id}`, task.title, null,
            <>
              {chip('Today', () => setTaskDay(task, today), { filled: true, a11y: `Do ${task.title} today` })}
              {chip('Tomorrow', () => setTaskDay(task, addDays(today, 1)), { a11y: `Do ${task.title} tomorrow` })}
              {chip('Pick a day', () => setPicking(task), { a11y: `Pick a day for ${task.title}` })}
              {chip('Done', () => act(`t-${task.id}`, () => completeTask(task.id, true)), { color: c.text3, a11y: `Mark ${task.title} done` })}
            </>))}
        </View>
      )}

      <Modal visible={!!picking} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setPicking(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: s.lg }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg }}>
            <Text style={{ fontSize: t.md, fontWeight: '700', color: c.text1, marginBottom: s.sm }} numberOfLines={2}>
              {picking?.title}
            </Text>
            {picking && (
              <MiniCalendar value={new Date()} minIso={today} color={c.teal}
                colors={{ bg: c.bg0, text: c.text1, muted: c.text3 }}
                onChange={(d) => { const task = picking; setPicking(null); setTaskDay(task, dateStr(d)); }} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
