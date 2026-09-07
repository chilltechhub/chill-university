// src/screens/WorkModeScreen.js
// Work Mode v1 — Start → Timer → Scratchpad → Finish.
//
// A single focused screen wrapping commandCenterService's existing
// timer/session functions (saveTimerSession et al. — see
// src/api/commandCenterService.js) in real UI. Timer and Scratchpad share
// one "active session" phase rather than separate steps: you want your
// running time visible while you jot notes, not hidden behind a second
// screen. Reachable from a build's Workshop page (pre-filled with that
// project's next_action, see next-action surfacing) and from Home's
// "On the Desk" next-up card.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { offlineWrite } from '../api/offlineCache';
import { saveTimerSession } from '../api/commandCenterService';
import { AREAS } from '../api/plannerService';
import { FONTS } from '../theme';

const STEPS = [
  { key: 'start',      label: 'START' },
  { key: 'timer',      label: 'TIMER' },
  { key: 'scratchpad', label: 'SCRATCHPAD' },
  { key: 'finish',     label: 'FINISH' },
];

function fmtDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fmtSummary(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

// Small stepper across the top — purely wayfinding. "Timer" and
// "Scratchpad" both light up together during the active phase since
// they're the same screen, not a wizard step you leave one for the other.
function Stepper({ phase, c, t }) {
  const activeKeys = phase === 'active' ? ['timer', 'scratchpad'] : [phase];
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 4 }}>
      {STEPS.map(step => {
        const isActive = activeKeys.includes(step.key);
        return (
          <View key={step.key} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ height: 3, width: '100%', borderRadius: 2, backgroundColor: isActive ? c.teal : c.border, marginBottom: 4 }} />
            <Text style={{ fontSize: 8.5, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5, color: isActive ? c.teal : c.text4 }}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function WorkModeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const project = route.params?.project || null;

  const [userId, setUserId] = useState(null);
  const [phase,  setPhase]  = useState('start'); // start | active | finish

  const [focusText,  setFocusText]  = useState(project?.next_action || route.params?.presetTitle || '');
  const [areaKey,    setAreaKey]    = useState(route.params?.lifeAreaId || null);
  const [scratchpad, setScratchpad] = useState('');
  const [saving,     setSaving]     = useState(false);

  // Duration is tracked from real timestamps (accumulated + a running-since
  // marker), not by counting 1s ticks — a backgrounded/throttled tab or app
  // would otherwise under-count. `tick` just forces a re-render once a
  // second so the displayed clock keeps moving; it never feeds the math.
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [runningSince, setRunningSince] = useState(null);
  const [, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  useEffect(() => {
    if (runningSince) {
      intervalRef.current = setInterval(() => setTick(x => x + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [runningSince]);

  const elapsedSeconds = accumulatedSeconds + (runningSince ? Math.floor((Date.now() - runningSince) / 1000) : 0);

  const startSession = () => {
    if (!focusText.trim()) return;
    setPhase('active');
    setRunningSince(Date.now());
  };

  const togglePause = () => {
    if (runningSince) {
      setAccumulatedSeconds(prev => prev + Math.floor((Date.now() - runningSince) / 1000));
      setRunningSince(null);
    } else {
      setRunningSince(Date.now());
    }
  };

  const goToFinish = () => {
    if (runningSince) {
      setAccumulatedSeconds(prev => prev + Math.floor((Date.now() - runningSince) / 1000));
      setRunningSince(null);
    }
    setPhase('finish');
  };

  const discard = useCallback(() => {
    Alert.alert('Discard this session?', "The time won't be logged and your notes won't be saved.", [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }, [navigation]);

  const saveAndClose = async () => {
    if (!userId) { navigation.goBack(); return; }
    setSaving(true);
    try {
      // saveTimerSession's third arg is a FK into the (separate, user-defined)
      // life_areas table used by the old Library Command Center — not the
      // fixed AREAS taxonomy this screen's chips pick from, so there's no
      // valid id to pass here. areaKey still tags the finish summary and
      // routes a project-less scratchpad note below.
      await saveTimerSession(userId, elapsedSeconds, null);
      const notes = scratchpad.trim();
      if (notes) {
        const now = new Date().toISOString();
        if (project) {
          await offlineWrite(supabase, 'project_journal', {
            user_id: userId, project_id: project.id,
            title: focusText.trim() || 'Work session', body: notes, type: 'note',
          });
        } else {
          await supabase.from('area_notes').insert({
            user_id: userId, area_id: areaKey || 'general',
            content: `${focusText.trim() ? focusText.trim() + '\n' : ''}${notes}`,
            created_at: now,
          });
        }
      }
      navigation.goBack();
    } catch (e) {
      console.warn('WorkMode: save session', e.message || e);
      Alert.alert("Couldn't save the session", 'Try again — nothing was lost, you\'re still on the finish screen.');
    }
    setSaving(false);
  };

  const color = project?.color || c.teal;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 14, gap: 10 }}>
        <TouchableOpacity onPress={() => (phase === 'start' ? navigation.goBack() : discard())} style={{ padding: 4 }}>
          <Ionicons name={phase === 'start' ? 'arrow-back' : 'close'} size={22} color={c.text2} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text3, letterSpacing: 1 }}>WORK MODE</Text>
      </View>

      <Stepper phase={phase} c={c} t={t} />

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 48, flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {phase === 'start' && (
          <View>
            {project && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.lg, borderLeftWidth: 3, borderLeftColor: color }}>
                <Text style={{ fontSize: 22 }}>{project.emoji || '🚀'}</Text>
                <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }} numberOfLines={1}>{project.title}</Text>
              </View>
            )}

            <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>What are you working on?</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.lg, lineHeight: 19 }}>
              One session, one focus. Name the thing, start the clock, and jot notes as you go.
            </Text>

            <TextInput
              style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.lg }}
              value={focusText} onChangeText={setFocusText}
              placeholder="e.g. Bench-test the new inverter" placeholderTextColor={c.text4}
              autoFocus
            />

            <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.bold, marginBottom: s.sm }}>
              Life area (optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.xl }}>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                {Object.entries(AREAS).map(([key, area]) => (
                  <TouchableOpacity key={key} onPress={() => setAreaKey(prev => prev === key ? null : key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full,
                      borderWidth: 1, borderColor: areaKey === key ? area.color : c.border,
                      backgroundColor: areaKey === key ? area.color + '18' : c.bg1,
                    }}>
                    <Text style={{ fontSize: 14 }}>{area.emoji}</Text>
                    <Text style={{ fontSize: t.xs, fontWeight: '600', color: areaKey === key ? area.color : c.text3 }}>{area.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity onPress={startSession} disabled={!focusText.trim()}
              style={{ backgroundColor: color, borderRadius: r.md, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: focusText.trim() ? 1 : 0.5 }}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Start Focus Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'active' && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', marginBottom: 4 }} numberOfLines={2}>{focusText}</Text>
            <Text style={{ fontSize: 56, fontFamily: FONTS.mono, fontWeight: '700', color: c.text1, textAlign: 'center', marginVertical: s.md }}>
              {fmtDuration(elapsedSeconds)}
            </Text>

            <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.xl, justifyContent: 'center' }}>
              <TouchableOpacity onPress={togglePause}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: 18, paddingVertical: 11 }}>
                <Ionicons name={runningSince ? 'pause' : 'play'} size={16} color={c.text1} />
                <Text style={{ color: c.text1, fontWeight: t.semibold, fontSize: t.sm }}>{runningSince ? 'Pause' : 'Resume'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToFinish}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: color, borderRadius: r.md, paddingHorizontal: 18, paddingVertical: 11 }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Finish</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: t.bold, marginBottom: s.sm }}>
              Scratchpad
            </Text>
            <TextInput
              style={{ flex: 1, minHeight: 180, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, textAlignVertical: 'top' }}
              value={scratchpad} onChangeText={setScratchpad}
              placeholder="Notes, decisions, blockers — whatever's worth remembering when this session's done." placeholderTextColor={c.text4}
              multiline
            />
          </View>
        )}

        {phase === 'finish' && (
          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: color + '18', borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center', marginBottom: s.lg }}>
              <Ionicons name="checkmark-done" size={30} color={color} />
            </View>
            <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>Session complete</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.xl, textAlign: 'center' }} numberOfLines={2}>{focusText}</Text>

            <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, alignItems: 'center', marginBottom: s.xl, width: '100%', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: 32, fontFamily: FONTS.mono, fontWeight: '800', color }}>{fmtSummary(elapsedSeconds)}</Text>
              <Text style={{ fontSize: t.xs, color: c.text4, marginTop: 2 }}>logged{areaKey ? ` · ${AREAS[areaKey]?.label}` : ''}</Text>
              {scratchpad.trim() ? (
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.md, lineHeight: 17, textAlign: 'left', alignSelf: 'stretch' }} numberOfLines={4}>
                  {scratchpad.trim()}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity onPress={saveAndClose} disabled={saving}
              style={{ backgroundColor: color, borderRadius: r.md, paddingVertical: 16, alignItems: 'center', width: '100%', opacity: saving ? 0.7 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Save &amp; Close</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPhase('active')} disabled={saving} style={{ marginTop: s.md, padding: s.sm }}>
              <Text style={{ color: c.text3, fontSize: t.sm }}>Not done yet — back to timer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
