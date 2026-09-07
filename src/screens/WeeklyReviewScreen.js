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
import { supabase } from '../api/supabaseClient';
import { AREAS, getCompletionRate, getInstances } from '../api/plannerService';
import { getProjects, upsertTask } from '../api/captureService';
import { FONTS } from '../theme';
import { dateStr } from '../logic/dateUtils';

const STEPS = ['Snapshot', 'Wins', 'Next 3'];

function toISO(d) { return dateStr(d); } // local calendar, not UTC
function nextMonday() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() + ((8 - day) % 7 || 7));
  return toISO(d);
}

function Stepper({ step, color, c, t }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 4 }}>
      {STEPS.map((label, i) => (
        <View key={label} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ height: 3, width: '100%', borderRadius: 2, backgroundColor: i <= step ? color : c.border, marginBottom: 4 }} />
          <Text style={{ fontSize: 8.5, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5, color: i <= step ? color : c.text4 }}>
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
      <Text style={{ fontSize: 9.5, color: c.text4, textAlign: 'center', marginTop: 4, lineHeight: 13 }}>{label}</Text>
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

  // Wins
  const [winCandidates, setWinCandidates] = useState([]);
  const [selectedWins, setSelectedWins] = useState([]);
  const [customWin, setCustomWin] = useState('');

  // Next 3
  const [priorities, setPriorities] = useState(['', '', '']);

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
      navigation.goBack();
    } catch (e) {
      console.warn('WeeklyReview: finish', e.message || e);
    }
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 14, gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name={step === 0 ? 'arrow-back' : 'close'} size={22} color={c.text2} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text3, letterSpacing: 1 }}>WEEKLY REVIEW</Text>
      </View>
      <Stepper step={step} color={color} c={c} t={t} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={color} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 48, flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View>
              <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>{showEmojis ? '📊 ' : ''}Your week, at a glance</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.lg, lineHeight: 19 }}>The last 7 days, pulled straight from your planner, inbox, and builds.</Text>

              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                <StatCard value={completionRate !== null ? `${completionRate}%` : '—'} label="AVG DAILY COMPLETION" color={c.teal} c={c} t={t} />
                <StatCard value={`${instanceStats.done}/${instanceStats.total}`} label="PLANNER ITEMS DONE" color={c.gold} c={c} t={t} />
              </View>
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.xl }}>
                <StatCard value={`${captureStats.processed}/${captureStats.added}`} label="CAPTURES PROCESSED" color="#8b4fc4" c={c} t={t} />
                <StatCard value={`${projectStats.withNextAction}/${projectStats.active}`} label="BUILDS WITH A NEXT STEP" color="#c9a84c" c={c} t={t} />
              </View>

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
                <Text style={{ fontSize: t.sm, color: c.text4, marginBottom: s.md }}>Nothing completed this week yet — add your own win below.</Text>
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
                          <Text style={{ fontSize: t.xs, color: c.text4 }}>{item.source}</Text>
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
                <TouchableOpacity onPress={addCustomWin} disabled={!customWin.trim() || selectedWins.length >= 3}
                  style={{ backgroundColor: color, borderRadius: r.md, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', opacity: (!customWin.trim() || selectedWins.length >= 3) ? 0.5 : 1 }}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: t.xs, color: c.text4, textAlign: 'center', marginBottom: s.md }}>{selectedWins.length}/3 selected</Text>
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
