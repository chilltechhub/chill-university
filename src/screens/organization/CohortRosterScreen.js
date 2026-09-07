// src/screens/organization/CohortRosterScreen.js
// One cohort (class/team/group) — roster with progress visibility, an
// invite code for a manager to share, and simple freeform assignment
// tracking. Reached only with route params from OrganizationScreen:
// { cohortId, cohortName, orgType, organizationId, isManager }.

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import {
  getCohortRoster, generateOrgInviteCode, assignContentToCohort,
  removeCohortMember, ORG_NOT_CONFIGURED,
} from '../../api/organizationService';
import { getOrgLabels } from '../../data/orgLabels';

function SectionLabel({ label, c, t, s }) {
  return <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm, marginTop: s.lg, paddingHorizontal: 2 }}>{label}</Text>;
}

export default function CohortRosterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cohortId, cohortName, orgType, organizationId, isManager } = route.params || {};
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const labels = getOrgLabels(orgType);

  const [roster, setRoster] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | not_configured | error
  const [errorDetail, setErrorDetail] = useState('');

  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [maxUses, setMaxUses] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    try {
      setRoster(await getCohortRoster(cohortId));
      setStatus('ready');
    } catch (e) {
      console.warn('CohortRosterScreen load', e);
      setErrorDetail(e?.message || String(e));
      setStatus(e?.message === ORG_NOT_CONFIGURED ? 'not_configured' : 'error');
    }
  }, [cohortId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doGenerateCode = async () => {
    setGenerating(true);
    try {
      const result = await generateOrgInviteCode({ organizationId, cohortId });
      setCode(result?.code || null);
      setExpiresAt(result?.expires_at || null);
      setMaxUses(result?.max_uses || null);
    } catch (e) {
      Alert.alert("Couldn't generate a code", e.message);
    }
    setGenerating(false);
  };

  const copyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', `Share this with anyone joining ${cohortName} — good for ${maxUses} people.`);
  };

  const doAssign = async () => {
    if (!newTitle.trim()) return;
    setAssigning(true);
    try {
      await assignContentToCohort({ cohortId, title: newTitle, description: newDesc.trim() || null });
      setNewTitle('');
      setNewDesc('');
      await load();
    } catch (e) {
      Alert.alert("Couldn't assign that", e.message);
    }
    setAssigning(false);
  };

  const confirmRemove = (member) => {
    Alert.alert(
      `Remove ${member.display_name}?`,
      `They'll no longer be part of ${cohortName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            try {
              await removeCohortMember(cohortId, member.user_id);
              setRoster((prev) => prev.filter((x) => x.user_id !== member.user_id));
            } catch (e) {
              Alert.alert("Couldn't remove them", e.message);
            }
          },
        },
      ]
    );
  };

  const daysLeft = expiresAt ? Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 86400000)) : 0;

  // Assignments this cohort has, derived from the roster's own completion
  // counts (all members share the same assignments_total once any exist).
  const assignmentsTotal = roster[0]?.assignments_total || 0;

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.teal} />
      </View>
    );
  }

  return (
    // Same fix as OrganizationScreen.js — this screen's assignment title/
    // description fields sit well down the ScrollView and would otherwise
    // end up hidden behind the keyboard on a real device.
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }} numberOfLines={1}>{cohortName}</Text>
          <Text style={{ fontSize: t.xs, color: c.text4, marginTop: 1 }}>{labels.cohort}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Leaderboard', { cohortId, cohortName })}
          style={{ padding: 8, backgroundColor: c.bg2, borderRadius: r.full }}
        >
          <Ionicons name="trophy-outline" size={18} color={c.gold} />
        </TouchableOpacity>
      </View>

      {status === 'not_configured' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl }}>
          <Text style={{ fontSize: 48, marginBottom: s.lg }}>🛠️</Text>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, textAlign: 'center' }}>Not set up yet</Text>
        </View>
      ) : status === 'error' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl }}>
          <Text style={{ fontSize: 48, marginBottom: s.lg }}>⚠️</Text>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>Couldn't load this {labels.cohort.toLowerCase()}</Text>
          {!!errorDetail && (
            <Text style={{ fontSize: t.xs, color: c.text4, textAlign: 'center', marginTop: 2 }}>{errorDetail}</Text>
          )}
          <TouchableOpacity onPress={load} style={{ marginTop: s.lg, backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.sm, paddingHorizontal: s.xl }}>
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
          {/* ── Roster ── */}
          <SectionLabel label={labels.memberPlural} c={c} t={t} s={s} />
          {roster.length === 0 ? (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: t.sm, color: c.text3 }}>Nobody's joined yet — share the invite code below.</Text>
            </View>
          ) : (
            roster.map((member) => (
              <TouchableOpacity
                key={member.user_id}
                onLongPress={isManager ? () => confirmRemove(member) : undefined}
                activeOpacity={isManager ? 0.7 : 1}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}
              >
                <Ionicons name={member.role_in_cohort === 'manager' ? 'ribbon-outline' : 'person-outline'} size={18} color={c.text3} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{member.display_name}</Text>
                  {member.role_in_cohort === 'manager' && (
                    <Text style={{ fontSize: t.xs, color: c.gold, marginTop: 1 }}>{labels.manager}</Text>
                  )}
                </View>
                {assignmentsTotal > 0 && (
                  <View style={{ backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: s.sm, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: c.text2 }}>{member.assignments_completed}/{member.assignments_total}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
          {isManager && roster.length > 0 && (
            <Text style={{ fontSize: 11, color: c.text4, marginTop: 2 }}>Long-press to remove someone.</Text>
          )}

          {/* ── Invite code (manager only) ── */}
          {isManager && (
            <>
              <SectionLabel label="Invite Code" c={c} t={t} s={s} />
              <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, alignItems: 'center' }}>
                <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md, textAlign: 'center' }}>
                  {labels.joinPrompt} — share this code.
                </Text>
                {code ? (
                  <>
                    <Text style={{ fontSize: 32, fontWeight: '800', letterSpacing: 6, color: c.gold, fontFamily: 'monospace', marginBottom: 4 }}>{code}</Text>
                    <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.md }}>
                      Good for {maxUses} {maxUses === 1 ? 'person' : 'people'} · {daysLeft > 0 ? `expires in ${daysLeft}d` : 'expired — generate a new one'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: s.sm }}>
                      <TouchableOpacity onPress={copyCode} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, backgroundColor: c.teal + '18', borderWidth: 1, borderColor: c.teal + '55' }}>
                        <Ionicons name="copy-outline" size={14} color={c.teal} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={doGenerateCode} disabled={generating} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border }}>
                        {generating ? <ActivityIndicator size="small" color={c.text3} /> : <Ionicons name="refresh" size={14} color={c.text3} />}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>New code</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={doGenerateCode}
                    disabled={generating}
                    style={{ backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl, alignItems: 'center', opacity: generating ? 0.6 : 1 }}
                  >
                    {generating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Generate Invite Code</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ── Assignments ── */}
          <SectionLabel label="Assignments" c={c} t={t} s={s} />
          {isManager && (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md }}>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Assignment title"
                placeholderTextColor={c.text4}
                style={{ fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.sm }}
              />
              <TextInput
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Details (optional)"
                placeholderTextColor={c.text4}
                multiline
                style={{ fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.md, minHeight: 60, textAlignVertical: 'top' }}
              />
              <TouchableOpacity
                onPress={doAssign}
                disabled={assigning || !newTitle.trim()}
                style={{ backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.md, alignItems: 'center', opacity: (assigning || !newTitle.trim()) ? 0.5 : 1 }}
              >
                {assigning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Assign to {labels.cohortPlural}</Text>}
              </TouchableOpacity>
            </View>
          )}
          {assignmentsTotal === 0 ? (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: t.sm, color: c.text3 }}>Nothing assigned yet.</Text>
            </View>
          ) : (
            <Text style={{ fontSize: t.xs, color: c.text4 }}>
              {roster.reduce((sum, m) => sum + (m.assignments_completed || 0), 0)} of {roster.length * assignmentsTotal} completions across the {labels.cohort.toLowerCase()}.
            </Text>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
