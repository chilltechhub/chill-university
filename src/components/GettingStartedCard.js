// src/components/GettingStartedCard.js
//
// What replaced the back half of onboarding.
//
// The old flow asked ~20 questions across eight steps and then fired a
// twelve-step tour 300ms after landing — two walkthroughs stacked on each
// other, before the user had seen a single real screen. Now the wizard asks
// the two things the app can't render without, and this card carries the
// rest: one concrete first action, the remaining setup as a checklist, and
// the tour as an offer rather than an ambush.
//
// The setup rows open the SAME step components the wizard used to show
// (src/screens/onboarding/steps.js) as bottom sheets, so nothing was
// rewritten — the questions just moved to where their answers visibly do
// something. Each sheet seeds itself from the profile and writes back
// through onboardingService, which means Settings' own crest editor and
// Library-sections editor stay in sync with it in both directions.
//
// Dismissal is one flag for the whole card; individual rows disappear as
// they're completed, and the card retires itself once the list is empty.

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Button, Eyebrow } from './ui';
import { useTour } from '../../context/TourContext';
import { supabase } from '../api/supabaseClient';
import { saveOnboardingFields, applyPlannerPicks } from '../api/onboardingService';
import { SETUP_TASKS, firstActionFor } from '../logic/onboardingTasks';
import { generateRecommendations } from '../api/recommendationEngine';
import { pickFocusHub, buildRecommendations } from '../screens/onboarding/steps';
import { LIFE_AREAS } from '../screens/library/LifeAreaScreen';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { getWayfinderIntent } from '../api/wayfinderService';

// Which deferred tasks have been saved from here. Not derivable from the
// profile for all five (see the `planner` task's note in onboardingTasks),
// so it's tracked alongside the derived checks rather than instead of them.
const DONE_KEY = '@cth_setting_setupTasksDone';

export default function GettingStartedCard({ onNavigate }) {
  const themeCtx = useTheme();
  const { colors: c, typography: t, spacing: s, radius: r, isDark, style: ui, accent } = themeCtx;
  // The step components expect the shorthand bundle, not the raw context.
  const theme = { c, t, s, r, sh: themeCtx.shadows, isDark };

  const { startTour, setPersonalization } = useTour();
  const { activeType } = useProfiles(); // persona key of the active profile
  const [dismissed, setDismissed] = useSetting(SETTING_KEYS.GETTING_STARTED_DISMISSED, false);

  const [profile, setProfile] = useState(null);
  const [done, setDone] = useState(new Set());
  const [ready, setReady] = useState(false);
  // Guests reach Home without ever passing through onboarding (see
  // LoginScreen's guest button), and every task here writes to `profiles`
  // keyed by a user id they don't have. A checklist that can only fail is
  // worse than no checklist.
  const [signedIn, setSignedIn] = useState(false);
  // Onboarding's "I'm not sure yet" — see firstActionFor.
  const [exploring, setExploring] = useState(false);

  // Open sheet: the task being answered, plus its working copy of `data`.
  const [openTask, setOpenTask] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: { user } }, rawDone, wantsWayfinder] = await Promise.all([
        supabase.auth.getUser(),
        AsyncStorage.getItem(DONE_KEY),
        getWayfinderIntent(),
      ]);
      if (rawDone) { try { setDone(new Set(JSON.parse(rawDone))); } catch {} }
      setExploring(wantsWayfinder);
      setSignedIn(!!user);
      if (!user) { setReady(true); return; }
      const { data } = await supabase
        .from('profiles')
        .select('suit_color, badge, traveler_name, topics, formats, tech_level, primary_goal, daily_minutes, life_stage, wants_reflection, theme, active_life_areas')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data || {});
    } catch (e) {
      console.warn('getting started: load', e?.message);
    } finally {
      setReady(true);
    }
  }, []);

  // Refresh on focus so a crest set from Settings ticks the row off here too.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remaining = SETUP_TASKS.filter(task => !task.isDone(profile, done));
  // No usage_patterns on a fresh account — that question is itself one of
  // the deferred tasks — so the persona carries the choice here.
  const action = firstActionFor(activeType, [], { exploring });

  // Nothing left to nudge about, no account to save it to, or the user
  // said no. Any of those, gone.
  if (!ready || !signedIn || dismissed || remaining.length === 0) return null;

  const openSheet = (task) => {
    setDraft(task.seed(profile));
    setOpenTask(task);
  };

  const closeSheet = () => setOpenTask(null);

  const setDraftField = (key, value) => setDraft(prev => ({ ...prev, [key]: value }));

  const markDone = async (key) => {
    const next = new Set(done);
    next.add(key);
    setDone(next);
    try {
      await AsyncStorage.setItem(DONE_KEY, JSON.stringify([...next]));
    } catch (e) { console.warn('getting started: mark done', e?.message); }
  };

  const saveSheet = async () => {
    if (!openTask) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const fields = openTask.toFields(draft);
      if (Object.keys(fields).length) await saveOnboardingFields(user.id, fields);

      // The one task whose answers don't live on `profiles`.
      if (openTask.key === 'planner') await applyPlannerPicks(user.id, draft.planner_picks);

      // Two answers feed things computed elsewhere. Onboarding used to do
      // this once at the end because it had every answer in hand; now that
      // they arrive one at a time, whatever depends on them has to be
      // recomputed as each lands — otherwise the recommendations and the
      // tour stay frozen at what was knowable on day one.
      if (openTask.key === 'interests' || openTask.key === 'goals') {
        const merged = { ...(profile || {}), ...fields, usage_patterns: draft.usage_patterns || [] };
        try {
          const areaLabels = LIFE_AREAS
            .filter(a => (merged.active_life_areas || []).includes(a.id))
            .map(a => a.label);
          setPersonalization({
            areaLabels,
            focusHub: pickFocusHub(merged),
            recommendations: buildRecommendations(merged),
          });
        } catch (e) { console.warn('getting started: personalization', e?.message); }
        try {
          await generateRecommendations(user.id, merged);
        } catch (e) { console.warn('getting started: recommendations', e?.message); }
      }

      await markDone(openTask.key);
      setOpenTask(null);
      load();
    } catch (e) {
      console.warn('getting started: save', e?.message);
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const card = {
    backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.lg,
    marginHorizontal: s.lg, marginBottom: s.md,
    borderWidth: ui.borderWidth, borderColor: c.border,
  };

  return (
    <>
      <View style={[card, { borderTopWidth: 2, borderTopColor: accent.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md }}>
          <Eyebrow style={{ marginBottom: 0 }}>Getting started</Eyebrow>
          <TouchableOpacity
            onPress={() => setDismissed(true)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss getting started"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={18} color={c.text4} />
          </TouchableOpacity>
        </View>

        {/* ── One concrete thing to do, chosen from the persona ── */}
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>
          {action.label}
        </Text>
        <Button label={action.cta} onPress={() => onNavigate?.(action.target)} style={{ marginTop: s.sm }} />

        {/* ── The rest of setup, one row at a time ── */}
        <Eyebrow style={{ marginTop: s.lg, marginBottom: s.sm }}>
          Finish your setup · {remaining.length} left
        </Eyebrow>
        {remaining.map(task => (
          <TouchableOpacity
            key={task.key}
            onPress={() => openSheet(task)}
            accessibilityRole="button"
            accessibilityLabel={`${task.label}. ${task.blurb}`}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: s.md,
              backgroundColor: c.bg0, borderRadius: ui.buttonRadius, padding: s.md, marginBottom: s.sm,
              borderWidth: ui.borderWidth, borderColor: c.border,
            }}>
            <Ionicons name={task.icon} size={18} color={accent.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{task.label}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>{task.blurb}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.text4} />
          </TouchableOpacity>
        ))}

        {/* ── The tour, offered ── */}
        <TouchableOpacity
          onPress={startTour}
          accessibilityRole="button"
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            paddingVertical: 10, marginTop: 2,
          }}>
          <Ionicons name="compass-outline" size={16} color={c.text3} />
          <Text style={{ fontSize: t.sm, color: c.text3, fontWeight: t.semibold }}>Take the 2-min tour</Text>
        </TouchableOpacity>
      </View>

      {/* ── Task sheet — the wizard's own step components, unmodified ── */}
      <Modal visible={!!openTask} animationType="slide" transparent onRequestClose={closeSheet}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingBottom: 40, maxHeight: '85%',
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 12, marginBottom: s.sm }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s.xl }}>
              <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>{openTask?.label}</Text>
              <TouchableOpacity
                onPress={closeSheet}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={c.text3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {openTask && (
                <openTask.Component data={draft} set={setDraftField} theme={theme} />
              )}
            </ScrollView>

            <View style={{ paddingHorizontal: s.xl, paddingTop: s.md }}>
              <Button label="Save" onPress={saveSheet} busy={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
