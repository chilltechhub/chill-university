// src/screens/WeeklyReviewScreen.js
// Weekly Review — "Rule of 3": a 3-screen wizard (Snapshot → Wins → Next 3)
// that closes the loop on a week of captures/projects/planner activity.
// Deliberately thin — it reuses plannerService's getCompletionRate and
// getInstances, captureService's getProjects/getCaptures/upsertTask,
// rather than standing up a parallel reporting layer. The only new state
// it writes is `last_weekly_review` on user_settings (same JSON-blob
// pattern HomeScreen already uses for affirmations/focus presets) and
// three ordinary `tasks` rows for next week's priorities.

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { supabase } from '../api/profileScopedClient';
import { AREAS, getCompletionRate, getInstances } from '../api/plannerService';
import { getProjects, getCaptures, upsertTask } from '../api/captureService';
import { CAPTURE_TYPES } from './CaptureInbox';
import { getKnowledgeWeek, markReviewed } from '../api/knowledgeUse';
import { FONTS } from '../theme';
import { dateStr } from '../logic/dateUtils';

const STEPS = ['Snapshot', 'Wins', 'Next 3'];
const STALE_DAYS = 14;
// Same icon/color map CaptureInbox and ImportScreen already share, rather
// than a third copy of it here.
const TYPE_MAP = Object.fromEntries(CAPTURE_TYPES.map(ct => [ct.key, ct]));

function toISO(d) { return dateStr(d); } // local calendar, not UTC
function nextMonday() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() + ((8 - day) % 7 || 7));
  return toISO(d);
}
function daysAgo(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function Stepper({ step, color, c, t }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 4 }}>
      {STEPS.map((label, i) => (
        <View key={label} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ height: 3, width: '100%', borderRadius: 2, backgroundColor: i <= step ? color : c.border, marginBottom: 4 }} />
          <Text style={{ fontSize: 11.5, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5, color: i <= step ? color : c.text3 }}>
            {label.toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StatCard({ value, label, color, c, t }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border, borderTopWidth: 3, borderTopColor: color }}>
      <Text style={{ fontSize: 24, fontFamily: FONTS.mono, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11.5, color: c.text3, textAlign: 'center', marginTop: 4, lineHeight: 13 }}>{label}</Text>
    </View>
  );
}

export default function WeeklyReviewScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const color = c.teal;

  const [userId, setUserId] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Snapshot
  const [completionRate, setCompletionRate] = useState(null);
  const [instanceStats, setInstanceStats] = useState({ done: 0, total: 0 });
  const [captureStats, setCaptureStats] = useState({ added: 0, processed: 0 });
  const [projectStats, setProjectStats] = useState({ active: 0, withNextAction: 0 });
  const [staleCaptures, setStaleCaptures] = useState([]);

  // Wins
  const [winCandidates, setWinCandidates] = useState([]);
  const [selectedWins, setSelectedWins] = useState([]);
  const [customWin, setCustomWin] = useState('');

  // Knowledge: saved vs used this week, and takeaways waiting to be tried
  const [knowledge, setKnowledge] = useState({ saved: 0, used: 0, toTry: [] });
  const [triedIds, setTriedIds] = useState([]);

  // Next 3
  const [priorities, setPriorities] = useState(['', '', '']);
  // Picks for the top 3 from the week's own data (2026-10-15): what
  // slipped, each project's next step, late or undated to-dos, last
  // review's priorities still open, habits that dropped off.
  const [suggestions, setSuggestions] = useState([]);
  const [usedSuggestions, setUsedSuggestions] = useState([]);
  const useSuggestion = (sg) => {
    const slot = priorities.findIndex(p => !p.trim());
    if (slot < 0 || usedSuggestions.includes(sg.id)) return;
    setPriorities(prev => prev.map((p, i) => (i === slot ? sg.title : p)));
    setUsedSuggestions(prev => [...prev, sg.id]);
  };

  // A takeaway into the first empty priority (its when/then line if it has one).
  const tryTakeaway = (row) => {
    const text = (row.url_meta?.use_when || row.url_meta?.takeaway || '').trim();
    const slot = priorities.findIndex(p => !p.trim());
    if (!text || slot < 0 || triedIds.includes(row.id)) return;
    setPriorities(prev => prev.map((p, i) => (i === slot ? text : p)));
    setTriedIds(prev => [...prev, row.id]);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    setLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();
      const weekAgoDate = toISO(weekAgo);
      const todayDate = toISO(now);

      // Completion rate — average of getCompletionRate across every daily
      // area rather than a bespoke aggregate query, per plannerService's
      // existing (per-area) shape.
      const rates = (await Promise.all(
        Object.keys(AREAS).map(area => getCompletionRate(uid, area, 'daily', 7))
      )).filter(r => r !== null);
      setCompletionRate(rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null);

      // This week's instances, for the raw done/total count and win candidates
      const instances = await getInstances(uid, { weekStart: weekAgoDate, weekEnd: todayDate });
      const doneInstances = instances.filter(i => i.completed);
      setInstanceStats({ done: doneInstances.length, total: instances.filter(i => !i.skipped).length });

      // Captures added vs processed this week
      const { data: capRows } = await supabase
        .from('captures').select('id, title, status, created_at')
        .eq('user_id', uid).gte('created_at', weekAgoISO).is('deleted_at', null);
      const capList = capRows || [];
      setCaptureStats({ added: capList.length, processed: capList.filter(cp => cp.status !== 'inbox').length });

      // Stale inbox items — unprocessed captures sitting untouched 14+
      // days, oldest first. A different, older-scoped question than the
      // "this week" stat above: something can be perfectly fine at the
      // 7-day mark and still be exactly what's turning the inbox into a
      // backlog by week three, so it needs its own look further back.
      const allInbox = await getCaptures(uid, { status: 'inbox' });
      const staleCutoff = new Date(now); staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS);
      const stale = allInbox
        .filter(cp => new Date(cp.created_at) < staleCutoff)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setStaleCaptures(stale);

      // Projects — active count, and how many already have a next action
      // queued (ties back into next-action surfacing).
      const projects = await getProjects(uid, 'active');
      setProjectStats({ active: projects.length, withNextAction: projects.filter(p => p.next_action).length });

      // Win candidates: completed instances + processed captures this week
      const candidates = [
        ...doneInstances.map(i => ({ id: 'inst_' + i.id, title: i.title, source: AREAS[i.area]?.label || 'Planner' })),
        ...capList.filter(cp => cp.status !== 'inbox').map(cp => ({ id: 'cap_' + cp.id, title: cp.title || 'Untitled', source: 'Capture' })),
      ].slice(0, 20);
      setWinCandidates(candidates);

      setKnowledge(await getKnowledgeWeek(uid));

      // ── Suggestions for next week's top 3 ──
      const out = [];
      const add = (id, title, source, icon) => {
        const tt = String(title || '').trim();
        if (tt && !out.some(x => x.title.toLowerCase() === tt.toLowerCase())) out.push({ id, title: tt, source, icon });
      };
      // Last review's priorities that are still open tasks.
      const [{ data: settingsRow }, { data: openTasks }] = await Promise.all([
        supabase.from('user_settings').select('last_weekly_review').eq('user_id', uid).maybeSingle(),
        supabase.from('tasks').select('id, title, due_date').eq('user_id', uid).eq('completed', false)
          .order('due_date', { ascending: true, nullsFirst: false }).limit(40),
      ]);
      const open = openTasks || [];
      (settingsRow?.last_weekly_review?.next_three || []).forEach(title => {
        if (open.some(tk => tk.title?.trim().toLowerCase() === String(title).trim().toLowerCase())) add(`last_${title}`, title, 'Still open from last week', 'return-down-forward-outline');
      });
      // One-off plans that slipped this week.
      instances.filter(i => !i.completed && !i.skipped && i.date < todayDate && (!i.cadence || i.cadence === 'once'))
        .slice(0, 3).forEach(i => add(`slip_${i.id}`, i.title, 'Slipped this week', 'time-outline'));
      // Each active project's next step, most recently touched first.
      [...projects].filter(p => p.next_action)
        .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
        .slice(0, 3).forEach(p => add(`proj_${p.id}`, p.next_action, `Next step · ${p.title}`, 'hammer-outline'));
      // To-dos past their day, then ones with no day.
      open.filter(tk => tk.due_date && tk.due_date < todayDate).slice(0, 2).forEach(tk => add(`late_${tk.id}`, tk.title, 'Past its day', 'alert-circle-outline'));
      open.filter(tk => !tk.due_date).slice(0, 2).forEach(tk => add(`nod_${tk.id}`, tk.title, 'To-do with no day yet', 'checkbox-outline'));
      // Daily habits kept less than half the time (3+ days on the books).
      const byHabit = new Map();
      instances.filter(i => i.cadence === 'daily' && !i.skipped && i.date <= todayDate).forEach(i => {
        const h = byHabit.get(i.title) || { done: 0, total: 0 };
        h.total += 1; if (i.completed) h.done += 1;
        byHabit.set(i.title, h);
      });
      [...byHabit.entries()].filter(([, h]) => h.total >= 3 && h.done / h.total < 0.5).slice(0, 2)
        .forEach(([title, h]) => add(`habit_${title}`, `Get back to: ${title}`, `Habit · ${h.done} of ${h.total} days`, 'repeat-outline'));
      setSuggestions(out.slice(0, 7));
    } catch (e) { console.warn('WeeklyReview: load', e.message || e); }
    setLoading(false);
  };

  const toggleWin = (item) => {
    setSelectedWins(prev => {
      const exists = prev.find(w => w.id === item.id);
      if (exists) return prev.filter(w => w.id !== item.id);
      if (prev.length >= 3) return prev; // Rule of 3 — cap at three
      return [...prev, item];
    });
  };

  const addCustomWin = () => {
    if (!customWin.trim() || selectedWins.length >= 3) return;
    setSelectedWins(prev => [...prev, { id: 'custom_' + Date.now(), title: customWin.trim(), source: 'You' }]);
    setCustomWin('');
  };

  const finish = async () => {
    if (!userId) { navigation.goBack(); return; }
    setSaving(true);
    try {
      const due = nextMonday();
      const filled = priorities.map(p => p.trim()).filter(Boolean);
      for (const title of filled) {
        await upsertTask(userId, { title, category: 'personal', priority: 1, due_date: due });
      }
      // Best-effort record of the review itself — the 3 tasks just created
      // above are the part that actually matters, so a failure writing
      // this snapshot (e.g. the migration adding this column hasn't been
      // run yet) shouldn't block finishing. It's still surfaced explicitly
      // rather than left to fail silently, since supabase-js resolves
      // {error} instead of throwing on a rejected write.
      const { error: settingsError } = await supabase.from('user_settings').upsert({
        user_id: userId,
        last_weekly_review: {
          date: toISO(new Date()),
          completion_rate: completionRate,
          wins: selectedWins.map(w => w.title),
          next_three: filled,
        },
      });
      if (settingsError) console.warn('WeeklyReview: last_weekly_review not saved', settingsError.message);
      // A takeaway picked for next week has been seen: Home's "Remember
      // this?" waits its normal gap before asking about it again.
      triedIds.forEach(id => markReviewed(id).catch(() => {}));
      navigation.goBack();
    } catch (e) {
      console.warn('WeeklyReview: finish', e.message || e);
    }
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 14, gap: 10 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={step === 0 ? 'Back' : 'Close'} onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name={step === 0 ? 'arrow-back' : 'close'} size={22} color={c.text2} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text3, letterSpacing: 1 }}>WEEKLY REVIEW</Text>
      </View>
      <Stepper step={step} color={color} c={c} t={t} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={color} />
      ) : (
        <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 48, flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View>
              <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>{showEmojis ? '📊 ' : ''}Your week, at a glance</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.lg, lineHeight: 19 }}>The last 7 days, pulled straight from your planner, inbox, and builds.</Text>

              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                <StatCard value={completionRate !== null ? `${completionRate}%` : '—'} label="AVG DAILY COMPLETION" color={c.teal} c={c} t={t} />
                <StatCard value={`${instanceStats.done}/${instanceStats.total}`} label="PLANNER ITEMS DONE" color={c.gold} c={c} t={t} />
              </View>
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                <StatCard value={`${captureStats.processed}/${captureStats.added}`} label="CAPTURES PROCESSED" color="#8b4fc4" c={c} t={t} />
                <StatCard value={`${projectStats.withNextAction}/${projectStats.active}`} label="PROJECTS WITH A NEXT STEP" color="#c9a84c" c={c} t={t} />
              </View>
              {/* Saving isn't learning; using is. Both, side by side. */}
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                <StatCard value={knowledge.saved} label="THINGS SAVED TO YOUR VAULT" color={c.purple || '#8b4fc4'} c={c} t={t} />
                <StatCard value={knowledge.used} label="TIMES YOU USED WHAT YOU KNOW" color={c.success || c.teal} c={c} t={t} />
              </View>

              {/* Stale inbox items — the "this week" stat above can't see
                  these (it's scoped to the last 7 days), so a growing
                  backlog would otherwise never surface anywhere. */}
              {staleCaptures.length > 0 ? (
                <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.xl, borderWidth: 1, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.warning }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>
                    {showEmojis ? '🗂 ' : ''}{staleCaptures.length} item{staleCaptures.length === 1 ? '' : 's'} sitting untouched {STALE_DAYS}+ days
                  </Text>
                  <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.sm }}>
                    Oldest first — archive, tag, or act on them before they pile up.
                  </Text>
                  {staleCaptures.slice(0, 5).map(item => {
                    const meta = TYPE_MAP[item.type] || TYPE_MAP.note;
                    return (
                      <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 5 }}>
                        <Ionicons name={meta.icon} size={15} color={meta.color} />
                        <Text style={{ flex: 1, fontSize: t.xs, color: c.text2 }} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                        <Text style={{ fontSize: t.xs, color: c.text3 }}>{daysAgo(item.created_at)}d</Text>
                      </View>
                    );
                  })}
                  {staleCaptures.length > 5 && (
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>+{staleCaptures.length - 5} more</Text>
                  )}
                  <TouchableOpacity onPress={() => navigation.navigate('CaptureInbox')} style={{ marginTop: s.sm, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.bold }}>Review Inbox →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginBottom: s.xl }}>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>
                    {showEmojis ? '✅ ' : ''}Inbox is current — nothing's been sitting more than {STALE_DAYS} days.
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={() => setStep(1)}
                style={{ backgroundColor: color, borderRadius: r.md, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>{showEmojis ? '🏆 ' : ''}Your 3 biggest wins</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.lg, lineHeight: 19 }}>
                Pick up to three from this week — or add your own. Small wins count.
              </Text>

              {winCandidates.length === 0 ? (
                <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md }}>Nothing completed this week yet — add your own win below.</Text>
              ) : (
                <View style={{ marginBottom: s.md }}>
                  {winCandidates.map(item => {
                    const picked = !!selectedWins.find(w => w.id === item.id);
                    return (
                      <TouchableOpacity key={item.id} onPress={() => toggleWin(item)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: picked ? color + '18' : c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 1, borderColor: picked ? color : c.border }}>
                        <Ionicons name={picked ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={picked ? color : c.text4} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: t.sm, fontWeight: t.medium, color: c.text1 }} numberOfLines={1}>{item.title}</Text>
                          <Text style={{ fontSize: t.xs, color: c.text3 }}>{item.source}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.xl }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border }}
                  value={customWin} onChangeText={setCustomWin}
                  placeholder="Add your own win..." placeholderTextColor={c.text4}
                  editable={selectedWins.length < 3} onSubmitEditing={addCustomWin}
                />
                <TouchableOpacity accessibilityLabel="Add" accessibilityRole="button" onPress={addCustomWin} disabled={!customWin.trim() || selectedWins.length >= 3}
                  style={{ backgroundColor: color, borderRadius: r.md, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', opacity: (!customWin.trim() || selectedWins.length >= 3) ? 0.5 : 1 }}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: t.xs, color: c.text3, textAlign: 'center', marginBottom: s.md }}>{selectedWins.length}/3 selected</Text>
              <TouchableOpacity onPress={() => setStep(2)}
                style={{ backgroundColor: color, borderRadius: r.md, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>{showEmojis ? '🎯 ' : ''}Your top 3 for next week</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.lg, lineHeight: 19 }}>
                Just three. They'll land as tasks due next Monday.
              </Text>

              {priorities.map((val, i) => (
                <TextInput key={i}
                  style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.sm }}
                  value={val}
                  onChangeText={txt => setPriorities(prev => prev.map((p, idx) => idx === i ? txt : p))}
                  placeholder={`Priority ${i + 1}`} placeholderTextColor={c.text4}
                />
              ))}

              {suggestions.length > 0 && (
                <View style={{ marginTop: s.md }}>
                  <Text style={{ fontSize: t.sm, color: c.text2, marginBottom: s.sm }}>
                    <Text style={{ fontWeight: t.bold, color: c.text1 }}>From your week.</Text> Tap one to make it a priority:
                  </Text>
                  {suggestions.map(sg => {
                    const used = usedSuggestions.includes(sg.id);
                    const full = !priorities.some(p => !p.trim());
                    return (
                      <TouchableOpacity key={sg.id} onPress={() => useSuggestion(sg)} disabled={used || full} accessibilityRole="button"
                        accessibilityLabel={`${sg.title}. ${sg.source}. Make it a priority.`}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: used ? color + '18' : c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 1, borderColor: used ? color : c.border, opacity: full && !used ? 0.5 : 1 }}>
                        <Ionicons name={used ? 'checkmark-circle' : sg.icon} size={18} color={used ? color : c.text2} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }} numberOfLines={2}>{sg.title}</Text>
                          <Text style={{ fontSize: t.xs, color: c.text3 }} numberOfLines={1}>{sg.source}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {knowledge.toTry.length > 0 && (
                <View style={{ marginTop: s.md }}>
                  <Text style={{ fontSize: t.sm, color: c.text2, marginBottom: s.sm }}>
                    <Text style={{ fontWeight: t.bold, color: c.text1 }}>Use what you know.</Text> Tap one to make it a priority:
                  </Text>
                  {knowledge.toTry.map(row => {
                    const picked = triedIds.includes(row.id);
                    return (
                      <TouchableOpacity key={row.id} onPress={() => tryTakeaway(row)} disabled={picked} accessibilityRole="button"
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: picked ? color + '18' : c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 1, borderColor: picked ? color : c.border }}>
                        <Ionicons name={picked ? 'checkmark-circle' : 'bulb-outline'} size={18} color={picked ? color : c.gold} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }} numberOfLines={2}>{row.url_meta.use_when || row.url_meta.takeaway}</Text>
                          {row.url_meta.from === 'journal' ? (
                            <Text style={{ fontSize: t.xs, color: c.text3 }}>From your journal</Text>
                          ) : row.title && row.title !== (row.url_meta.use_when || row.url_meta.takeaway) ? (
                            <Text style={{ fontSize: t.xs, color: c.text3 }} numberOfLines={1}>From {row.title}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity onPress={finish} disabled={saving}
                style={{ backgroundColor: color, borderRadius: r.md, paddingVertical: 16, alignItems: 'center', marginTop: s.lg, opacity: saving ? 0.7 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Finish Review</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
