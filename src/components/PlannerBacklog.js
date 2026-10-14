// src/components/PlannerBacklog.js
// The two things a planner loses track of, shown on today's page:
//
//   Left from earlier — one-off plans from the last two weeks that were
//   neither done nor skipped. They used to sit on their own past day, so a
//   to-do missed on Tuesday was gone from view on Wednesday unless someone
//   paged back to look. (Missed habits don't carry over: tomorrow has its own.)
//
//   Past their day — open to-dos whose due date has gone by. The
//   Notification Center's "from earlier" card counts them, so the review it
//   opens has them too.
//
//   No day yet — open to-dos (the `tasks` table: Inbox "Create a Task",
//   imports) with no due date. Nothing in the Planner showed them; Home's
//   desk shows three. Giving one a day puts it in the Planner's Due list.
//
// Closed, it's one card: how many, plus Review & reschedule and Move all to
// today. Twenty-four rows with three buttons each was a wall to face every
// morning (2026-10-14). Open, each list shows three and says how many more.
// One tap per decision.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/profileScopedClient';
import { completeInstance, skipInstance, rescheduleInstance, AREAS } from '../api/plannerService';
import { moveToToday } from '../api/reminderService';
import { completeTask } from '../api/captureService';
import { todayStr, addDays, dateStr } from '../logic/dateUtils';
import MiniCalendar from './MiniCalendar';
import RichText from './RichText';
import { tapHaptic } from '../logic/haptics';

const LOOKBACK_DAYS = 14;
const SHOWN = 3;

function shortDay(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// `openAt` changes → open the review (Notification Center → Review & reschedule).
export default function PlannerBacklog({ userId, onChange, openAt = 0, c, t, s, r }) {
  const [missed, setMissed] = useState([]);
  const [undated, setUndated] = useState([]);
  const [late, setLate] = useState([]);
  const [open, setOpen] = useState({ missed: false, undated: false, late: false });
  const [busy, setBusy] = useState(null);
  const [picking, setPicking] = useState(null); // { kind: 'task' | 'plan', item } getting a day from the calendar
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const today = todayStr();
    const [m, u, lt] = await Promise.all([
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
      supabase.from('tasks')
        .select('id, title, due_date')
        .eq('user_id', userId).eq('completed', false).lt('due_date', today)
        .order('due_date', { ascending: false }).limit(50),
    ]);
    if (m.error) console.warn('[backlog] missed', m.error.message);
    if (u.error) console.warn('[backlog] undated', u.error.message);
    setMissed(m.data || []);
    setUndated(u.data || []);
    if (lt.error) console.warn('[backlog] late', lt.error.message);
    setLate(lt.data || []);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const act = async (key, fn) => {
    tapHaptic();
    setBusy(key);
    try { await fn(); await load(); onChange?.(); }
    catch (e) { console.warn('[backlog]', e?.message); }
    setBusy(null);
  };

  const setTaskDay = (task, iso) => act(`t-${task.id}`, async () => {
    const { error } = await supabase.from('tasks').update({ due_date: iso }).eq('id', task.id);
    if (error) throw error;
  });
  const setPlanDay = (plan, iso) => act(`m-${plan.id}`, () => rescheduleInstance(plan.id, iso));

  useEffect(() => { if (openAt) setReviewing(true); }, [openAt]);

  if (!missed.length && !undated.length && !late.length) return null;

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

  const moveAll = missed.length > 1 && (
    <TouchableOpacity onPress={() => act('all', () => moveToToday(missed.map(m => m.id)))} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
      {busy === 'all' ? <ActivityIndicator size="small" color={c.teal} /> : <Ionicons name="arrow-forward-circle-outline" size={16} color={c.teal} />}
      <Text style={{ fontSize: 13, fontWeight: '700', color: c.teal }}>Move all {missed.length} to today</Text>
    </TouchableOpacity>
  );

  const lateShown = open.late ? late : late.slice(0, SHOWN);
  const fromEarlier = missed.length + late.length;
  const summary = [
    fromEarlier ? `**${fromEarlier} from earlier**` : null,
    undated.length ? `**${undated.length}** with no day` : null,
  ].filter(Boolean).join(' · ');

  if (!reviewing) {
    return (
      <View style={{ marginHorizontal: s.lg, marginBottom: s.md, padding: s.md, borderRadius: r.lg,
        backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, gap: s.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
          <Ionicons name="time-outline" size={18} color={c.gold} />
          <RichText style={{ flex: 1, fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{summary}</RichText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: s.md }}>
          <TouchableOpacity onPress={() => setReviewing(true)} accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: r.full, backgroundColor: c.teal }}>
            <Ionicons name="list-outline" size={15} color={c.onFill} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: c.onFill }}>Review & reschedule</Text>
          </TouchableOpacity>
          {moveAll}
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginHorizontal: s.lg, marginBottom: s.md, padding: s.md, borderRadius: r.lg,
      backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, gap: s.md }}>
      <TouchableOpacity onPress={() => setReviewing(false)} accessibilityRole="button" accessibilityLabel="Close the review"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>Done reviewing</Text>
        <Ionicons name="chevron-up" size={14} color={c.text3} />
      </TouchableOpacity>

      {missed.length > 0 && (
        <View>
          {header(`**${missed.length} left from earlier**`, missed.length, 'missed')}
          {missedShown.map(m => row(`m-${m.id}`, m.title,
            `${AREAS[m.area]?.label || 'Planner'} · ${shortDay(m.date)}`,
            <>
              {chip('Today', () => act(`m-${m.id}`, () => moveToToday([m.id])), { filled: true, a11y: `Move ${m.title} to today` })}
              {chip('Tomorrow', () => setPlanDay(m, addDays(today, 1)), { a11y: `Move ${m.title} to tomorrow` })}
              {chip('Pick a day', () => setPicking({ kind: 'plan', item: m }), { a11y: `Pick a day for ${m.title}` })}
              {chip('Done', () => act(`m-${m.id}`, () => completeInstance(m.id, true)), { a11y: `Mark ${m.title} done` })}
              {chip('Drop', () => act(`m-${m.id}`, () => skipInstance(m.id)), { color: c.text3, a11y: `Drop ${m.title}` })}
            </>))}
          {moveAll}
        </View>
      )}

      {late.length > 0 && (
        <View>
          {header(`**${late.length} to-do${late.length === 1 ? '' : 's'}** past their day`, late.length, 'late')}
          {lateShown.map(task => row(`t-${task.id}`, task.title, `Was due ${shortDay(task.due_date)}`,
            <>
              {chip('Today', () => setTaskDay(task, today), { filled: true, a11y: `Do ${task.title} today` })}
              {chip('Tomorrow', () => setTaskDay(task, addDays(today, 1)), { a11y: `Do ${task.title} tomorrow` })}
              {chip('Pick a day', () => setPicking({ kind: 'task', item: task }), { a11y: `Pick a day for ${task.title}` })}
              {chip('Done', () => act(`t-${task.id}`, () => completeTask(task.id, true)), { color: c.text3, a11y: `Mark ${task.title} done` })}
            </>))}
        </View>
      )}

      {undated.length > 0 && (
        <View>
          {header(`**${undated.length} to-do${undated.length === 1 ? '' : 's'}** with no day yet`, undated.length, 'undated')}
          {undatedShown.map(task => row(`t-${task.id}`, task.title, null,
            <>
              {chip('Today', () => setTaskDay(task, today), { filled: true, a11y: `Do ${task.title} today` })}
              {chip('Tomorrow', () => setTaskDay(task, addDays(today, 1)), { a11y: `Do ${task.title} tomorrow` })}
              {chip('Pick a day', () => setPicking({ kind: 'task', item: task }), { a11y: `Pick a day for ${task.title}` })}
              {chip('Done', () => act(`t-${task.id}`, () => completeTask(task.id, true)), { color: c.text3, a11y: `Mark ${task.title} done` })}
            </>))}
        </View>
      )}

      <Modal visible={!!picking} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setPicking(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: s.lg }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg }}>
            <Text style={{ fontSize: t.md, fontWeight: '700', color: c.text1, marginBottom: s.sm }} numberOfLines={2}>
              {picking?.item?.title}
            </Text>
            {picking && (
              <MiniCalendar value={new Date()} minIso={today} color={c.teal}
                colors={{ bg: c.bg0, text: c.text1, muted: c.text3 }}
                onChange={(d) => {
                  const { kind, item } = picking;
                  setPicking(null);
                  if (kind === 'plan') setPlanDay(item, dateStr(d));
                  else setTaskDay(item, dateStr(d));
                }} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
