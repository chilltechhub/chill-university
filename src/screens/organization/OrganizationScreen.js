// src/screens/organization/OrganizationScreen.js
// Entry point for the institutional layer — create or join an
// organization, see every organization you belong to and the cohorts
// (classes/teams/groups — see src/data/orgLabels.js) within each. See
// src/api/organizationService.js for the RPCs and
// supabase/migrations/20260901_institutional_layer.sql for the schema.

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import {
  getMyOrganizations, createOrganization, redeemOrgInviteCode, createCohort,
  ORG_NOT_CONFIGURED,
} from '../../api/organizationService';
import { ORG_TYPES, getOrgLabels, getRoleLabel } from '../../data/orgLabels';
import TourSpot from '../../components/TourSpot';

function SectionLabel({ label, c, t, s }) {
  return <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm, marginTop: s.lg, paddingHorizontal: 2 }}>{label}</Text>;
}

// getMyOrganizations() returns one row per (organization, visible cohort)
// pair — group into { ...org, cohorts: [...] } for rendering. An org with
// no visible cohorts still gets one row (cohort fields null), which
// becomes an org entry with an empty cohorts array.
function groupByOrganization(rows) {
  const byId = new Map();
  for (const row of rows) {
    if (!byId.has(row.organization_id)) {
      byId.set(row.organization_id, {
        id: row.organization_id,
        name: row.organization_name,
        type: row.organization_type,
        role: row.org_role,
        cohorts: [],
      });
    }
    if (row.cohort_id) {
      byId.get(row.organization_id).cohorts.push({
        id: row.cohort_id,
        name: row.cohort_name,
        isManager: row.is_cohort_manager,
        memberCount: row.member_count || 0,
      });
    }
  }
  return [...byId.values()];
}

export default function OrganizationScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [orgs, setOrgs] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | not_configured | error
  const [errorDetail, setErrorDetail] = useState('');

  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('school');
  const [creating, setCreating] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const [newCohortName, setNewCohortName] = useState({}); // { [orgId]: text }
  const [creatingCohortFor, setCreatingCohortFor] = useState(null); // orgId in flight

  const load = useCallback(async () => {
    try {
      const rows = await getMyOrganizations();
      setOrgs(groupByOrganization(rows));
      setStatus('ready');
    } catch (e) {
      console.warn('OrganizationScreen load', e);
      setErrorDetail(e?.message || String(e));
      setStatus(e?.message === ORG_NOT_CONFIGURED ? 'not_configured' : 'error');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      await createOrganization(newOrgName, newOrgType);
      setNewOrgName('');
      await load();
    } catch (e) {
      Alert.alert("Couldn't create that", e.message);
    }
    setCreating(false);
  };

  const doRedeem = async () => {
    if (!codeInput.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemOrgInviteCode(codeInput);
      setCodeInput('');
      await load();
      const label = result?.cohort_name || result?.organization_name || 'it';
      Alert.alert('Joined!', `You're now part of ${label}.`);
    } catch (e) {
      Alert.alert("Couldn't join", e.message);
    }
    setRedeeming(false);
  };

  const doCreateCohort = async (org) => {
    const name = (newCohortName[org.id] || '').trim();
    if (!name) return;
    setCreatingCohortFor(org.id);
    try {
      await createCohort(org.id, name);
      setNewCohortName((prev) => ({ ...prev, [org.id]: '' }));
      await load();
    } catch (e) {
      Alert.alert("Couldn't create that", e.message);
    }
    setCreatingCohortFor(null);
  };

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.teal} />
      </View>
    );
  }

  return (
    // Without this, a text input near the bottom of the ScrollView below
    // (the "Join with a Code" field, reported directly) ends up hidden
    // behind the keyboard on a real device — nothing shifts the layout up
    // to compensate. Same fix LoginScreen.js/ResetPasswordScreen.js use.
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>🏫 Organization</Text>
      </View>

      {status === 'not_configured' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl }}>
          <Text style={{ fontSize: 48, marginBottom: s.lg }}>🛠️</Text>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>Organizations aren't set up yet</Text>
          <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
            This needs a one-time database migration applied on the backend first.
          </Text>
        </View>
      ) : status === 'error' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl }}>
          <Text style={{ fontSize: 48, marginBottom: s.lg }}>⚠️</Text>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>Couldn't load your organizations</Text>
          {!!errorDetail && (
            <Text style={{ fontSize: t.xs, color: c.text4, textAlign: 'center', marginTop: 2 }}>{errorDetail}</Text>
          )}
          <TouchableOpacity onPress={load} style={{ marginTop: s.lg, backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.sm, paddingHorizontal: s.xl }}>
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
          {/* ── My organizations ── */}
          <SectionLabel label="My Organizations" c={c} t={t} s={s} />
          {orgs.length === 0 ? (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20 }}>
                A teacher or manager sets one up below, then shares a join code — got a code? Enter it under "Join with a Code."
              </Text>
            </View>
          ) : (
            orgs.map((org) => {
              const labels = getOrgLabels(org.type);
              const isAdmin = org.role === 'owner' || org.role === 'admin';
              return (
                <View key={org.id} style={{ backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md, overflow: 'hidden' }}>
                  <View style={{ padding: s.lg, borderBottomWidth: org.cohorts.length ? 0.5 : 0, borderBottomColor: c.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{org.name}</Text>
                      <View style={{ backgroundColor: c.gold + '22', borderRadius: r.full, paddingHorizontal: s.sm, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: c.gold }}>{getRoleLabel(org.type, org.role)}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: t.xs, color: c.text4, marginTop: 2 }}>{labels.org}</Text>
                  </View>

                  {org.cohorts.map((cohort) => (
                    <TouchableOpacity
                      key={cohort.id}
                      onPress={() => navigation.navigate('CohortRoster', { cohortId: cohort.id, cohortName: cohort.name, orgType: org.type, organizationId: org.id, isManager: cohort.isManager })}
                      activeOpacity={0.85}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}
                    >
                      <Ionicons name={cohort.isManager ? 'ribbon-outline' : 'people-outline'} size={18} color={c.text3} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{cohort.name}</Text>
                        <Text style={{ fontSize: t.xs, color: c.text4, marginTop: 1 }}>
                          {labels.cohort} · {cohort.memberCount} {cohort.memberCount === 1 ? labels.member.toLowerCase() : labels.memberPlural.toLowerCase()}{cohort.isManager ? ` · you ${labels.manager.toLowerCase()}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={c.text4} />
                    </TouchableOpacity>
                  ))}

                  {isAdmin && (
                    <View style={{ flexDirection: 'row', gap: s.sm, padding: s.lg }}>
                      <TextInput
                        value={newCohortName[org.id] || ''}
                        onChangeText={(v) => setNewCohortName((prev) => ({ ...prev, [org.id]: v }))}
                        placeholder={`New ${labels.cohort.toLowerCase()} name`}
                        placeholderTextColor={c.text4}
                        style={{ flex: 1, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.sm }}
                      />
                      <TouchableOpacity
                        onPress={() => doCreateCohort(org)}
                        disabled={creatingCohortFor === org.id || !(newCohortName[org.id] || '').trim()}
                        style={{ backgroundColor: c.teal, borderRadius: r.md, paddingHorizontal: s.lg, alignItems: 'center', justifyContent: 'center', opacity: (creatingCohortFor === org.id || !(newCohortName[org.id] || '').trim()) ? 0.5 : 1 }}
                      >
                        {creatingCohortFor === org.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>+ {labels.cohort}</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* ── Create an organization ── */}
          <SectionLabel label="Create an Organization" c={c} t={t} s={s} />
          <TourSpot id="organization-create">
          <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
            <TextInput
              value={newOrgName}
              onChangeText={setNewOrgName}
              placeholder="Organization name"
              placeholderTextColor={c.text4}
              style={{ fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.md }}
            />
            <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.md }}>
              {ORG_TYPES.map((ot) => (
                <TouchableOpacity
                  key={ot.key}
                  onPress={() => setNewOrgType(ot.key)}
                  style={{
                    flex: 1, alignItems: 'center', padding: s.sm, borderRadius: r.md,
                    borderWidth: 1, borderColor: newOrgType === ot.key ? c.teal : c.border,
                    backgroundColor: newOrgType === ot.key ? c.tealLight : c.bg0,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{ot.emoji}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: newOrgType === ot.key ? c.teal : c.text2, marginTop: 2 }}>{ot.label}</Text>
                  <Text style={{ fontSize: 10, color: c.text4, marginTop: 1, textAlign: 'center' }}>{ot.blurb}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={doCreateOrg}
              disabled={creating || !newOrgName.trim()}
              style={{ backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.md, alignItems: 'center', opacity: (creating || !newOrgName.trim()) ? 0.5 : 1 }}
            >
              {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Create Organization</Text>}
            </TouchableOpacity>
          </View>
          </TourSpot>

          {/* ── Join with a code ── */}
          <SectionLabel label="Join with a Code" c={c} t={t} s={s} />
          <TourSpot id="organization-join">
          <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
            <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md }}>
              Got a code from a teacher or manager? Enter it here.
            </Text>
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <TextInput
                value={codeInput}
                onChangeText={(v) => setCodeInput(v.toUpperCase())}
                placeholder="XXXXXX"
                placeholderTextColor={c.text4}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                style={{ flex: 1, fontSize: t.md, letterSpacing: 2, textAlign: 'center', color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
              />
              <TouchableOpacity
                onPress={doRedeem}
                disabled={redeeming || !codeInput.trim()}
                style={{ backgroundColor: c.teal, borderRadius: r.md, paddingHorizontal: s.lg, alignItems: 'center', justifyContent: 'center', opacity: (redeeming || !codeInput.trim()) ? 0.5 : 1 }}
              >
                {redeeming ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Join</Text>}
              </TouchableOpacity>
            </View>
          </View>
          </TourSpot>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
