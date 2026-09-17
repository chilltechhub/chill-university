// src/components/VaultExercise.js
// The hands-on half of a curriculum lesson: numbered steps with real
// explanation, a checklist that persists to the Vault, and the artifact it
// produces.
//
// Split out of TopicLessonPanel's ApplyChallenge because the module pages need
// considerably more than a list of checkboxes — steps carry their own detail,
// and the whole thing needs to read as instructions someone can follow away
// from the screen and come back to.
//
// Vault behaviour matches ApplyChallenge exactly: rows are keyed
// (profile_id, lesson_key), so the same lesson completed under two different
// profiles produces two genuinely separate documents. Completion means every
// box ticked — partial work stays a draft so a level's gate review can't be
// passed by opening things.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { supabase } from '../api/supabaseClient';
import { saveVaultDocument, listVaultDocuments } from '../api/personaService';
import { FONTS } from '../theme';

export default function VaultExercise({ lesson, levelId, color }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { active: activeProfile } = useProfiles();

  // Written lessons carry `exercise`; structural ones carry `action` +
  // `checklist`. Normalise so this component handles either.
  const exercise = lesson.exercise || null;
  const intro = exercise?.intro || lesson.action || null;
  const steps = exercise?.steps || null;
  const items = exercise?.checklist || lesson.checklist || [];
  const deliverableTitle = exercise?.deliverable || lesson.deliverable;

  const [checked, setChecked] = useState({});
  const [userId, setUserId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const st = makeStyles(c, t, s, r);
  const tracked = !!deliverableTitle && !!lesson.key;

  useEffect(() => {
    if (!tracked) { setHydrated(true); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!alive) return;
      if (!uid) { setHydrated(true); return; }
      setUserId(uid);
      const docs = await listVaultDocuments(uid, { track: levelId, profileId: activeProfile?.id });
      if (!alive) return;
      const mine = docs.find(d => d.lesson_key === lesson.key);
      if (mine?.payload?.checked) setChecked(mine.payload.checked);
      setHydrated(true);
    })();
    return () => { alive = false; };
  }, [tracked, lesson.key, levelId, activeProfile?.id]);

  const toggle = async (i) => {
    const next = { ...checked, [i]: !checked[i] };
    setChecked(next);
    if (!tracked || !userId) return;
    const allDone = items.length > 0 && items.every((_, idx) => next[idx]);
    setSaving(true);
    try {
      await saveVaultDocument(userId, {
        profileId: activeProfile?.id,
        track: levelId,
        lessonKey: lesson.key,
        title: deliverableTitle,
        payload: { checked: next },
        status: allDone ? 'complete' : 'draft',
      });
    } catch (e) {
      console.warn('[vault] save failed', e?.message);
    } finally { setSaving(false); }
  };

  const doneCount = items.reduce((n, _, i) => (checked[i] ? n + 1 : n), 0);
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <View style={[st.wrap, { borderColor: color + '55' }]}>
      <View style={st.headRow}>
        <Ionicons name="construct-outline" size={15} color={color} />
        <Text style={[st.headText, { color }]}>Do the work</Text>
      </View>

      {!!intro && <Text style={st.intro}>{intro}</Text>}

      {/* Numbered steps with their own detail — the instructions someone
          actually follows, as opposed to the checklist that records it. */}
      {steps?.length > 0 && (
        <View style={{ marginTop: 14 }}>
          {steps.map((step, i) => (
            <View key={i} style={st.stepRow}>
              <View style={[st.stepNum, { borderColor: color }]}>
                <Text style={[st.stepNumText, { color }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.stepTitle}>{step.title}</Text>
                {!!step.detail && <Text style={st.stepDetail}>{step.detail}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Checklist — what gets recorded */}
      {items.length > 0 && (
        <View style={{ marginTop: steps?.length ? 16 : 12 }}>
          <Text style={st.checkLabel}>Record your progress</Text>
          {!hydrated ? (
            <View style={st.loadingRow}>
              <ActivityIndicator size="small" color={color} />
              <Text style={st.loadingText}>Loading your saved work…</Text>
            </View>
          ) : items.map((label, i) => (
            <TouchableOpacity key={i} onPress={() => toggle(i)} activeOpacity={0.7} style={st.checkRow}>
              <Ionicons
                name={checked[i] ? 'checkbox' : 'square-outline'}
                size={19}
                color={checked[i] ? color : c.text4}
              />
              <Text style={[st.checkText, checked[i] && { textDecorationLine: 'line-through', color: c.text4 }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* The artifact */}
      {tracked && hydrated && (
        <View style={[st.vaultRow, { borderTopColor: c.border }]}>
          <Ionicons
            name={allDone ? 'shield-checkmark' : 'folder-open-outline'}
            size={15}
            color={allDone ? color : c.text4}
          />
          <Text style={[st.vaultText, { color: allDone ? color : c.text3 }]} numberOfLines={2}>
            {allDone
              ? `Vault: ${deliverableTitle} — complete`
              : `Vault: ${deliverableTitle} — ${doneCount}/${items.length}`}
          </Text>
          {saving && <ActivityIndicator size="small" color={c.text4} />}
        </View>
      )}
      {tracked && hydrated && !userId && (
        <Text style={st.signedOut}>
          Sign in to save this to your Vault — right now it only lives on this device.
        </Text>
      )}
    </View>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  wrap: {
    marginTop: 6, padding: 14, borderRadius: r.lg,
    backgroundColor: c.bg0, borderWidth: 1,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headText: {
    fontSize: 11, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  intro: { fontSize: 14, color: c.text2, lineHeight: 21 },

  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: '800', fontFamily: FONTS.mono },
  stepTitle: { fontSize: 14, fontWeight: '700', color: c.text1, lineHeight: 20 },
  stepDetail: { fontSize: 13, color: c.text3, lineHeight: 19, marginTop: 2 },

  checkLabel: {
    fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1, color: c.text4, marginBottom: 6,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 5 },
  checkText: { flex: 1, fontSize: 14, color: c.text2, lineHeight: 20 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8 },
  loadingText: { fontSize: 12, color: c.text4 },

  vaultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 12, paddingTop: 10, borderTopWidth: 0.5,
  },
  vaultText: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  signedOut: { fontSize: 11, color: c.text4, lineHeight: 16, marginTop: 6 },
});
