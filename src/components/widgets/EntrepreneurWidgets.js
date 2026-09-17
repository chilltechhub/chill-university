// src/components/widgets/EntrepreneurWidgets.js
//
// The ENTREPRENEUR dashboard: what's in the vault, how far through the
// ownership curriculum you are, and where you stand against the target you
// set at onboarding.
//
// `vaultStatus` and `founderQuest` were both real asks with real data behind
// them (vault_documents + the ownership curriculum). `capitalScorecard` had
// nothing — there is no capital, funding or revenue table in the schema — so
// it's re-specified as **Targets & Readiness**, built from the profile's own
// baseline (the revenue target or venture stage typed during onboarding) and
// the funding-readiness deliverables already tracked in the vault. Real
// numbers the user themselves entered, rather than a scorecard of nothing.

import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { listVaultDocuments } from '../../api/personaService';
import { LEVELS, levelDeliverableCount } from '../../data/ownershipCurriculum';
import WidgetCard, { StatRow, Bar } from './WidgetCard';

// One fetch of the user's vault documents serves all three widgets below;
// each grabs what it needs from the same rows rather than querying again.
function useVaultDocs(userId, profileId) {
  const [docs, setDocs] = useState(null);
  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setDocs([]); return; }
      try {
        const rows = await listVaultDocuments(userId, { profileId });
        if (alive) setDocs(rows || []);
      } catch (e) {
        console.warn('vault docs', e?.message);
        if (alive) setDocs([]);
      }
    })();
    return () => { alive = false; };
  }, [userId, profileId]));
  return docs;
}

// ─── Vault Status ────────────────────────────────────────────────────────────

export function VaultStatusWidget({ userId, profileId, onOpenVault }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const docs = useVaultDocs(userId, profileId);
  const complete = (docs || []).filter(d => d.status === 'complete').length;
  const drafts = (docs || []).filter(d => d.status === 'draft').length;

  return (
    <WidgetCard
      title="The vault" icon="folder-open-outline" accent={c.purple}
      action="Open →" onAction={onOpenVault}
      loading={docs === null}
      empty={docs?.length === 0 ? {
        text: "Nothing filed yet. Vault documents are the worksheets you complete as you work through the ownership curriculum — they're what a level actually advances on.",
        cta: 'Start a lesson', onPress: onOpenVault,
      } : null}
    >
      <StatRow label="Complete" value={complete} color={c.success} />
      <StatRow label="In draft" value={drafts} color={drafts ? c.gold : c.text4} />
      <Bar pct={docs?.length ? (complete / docs.length) * 100 : 0} color={c.purple} />
      <View style={{ marginTop: s.md }}>
        {(docs || []).slice(0, 3).map(d => (
          <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
            <Ionicons
              name={d.status === 'complete' ? 'checkmark-circle' : 'document-text-outline'}
              size={14}
              color={d.status === 'complete' ? c.success : c.text4}
            />
            <Text style={{ fontSize: t.sm, color: c.text2, flex: 1 }} numberOfLines={1}>{d.title}</Text>
          </View>
        ))}
      </View>
    </WidgetCard>
  );
}

// ─── Founder Quest ───────────────────────────────────────────────────────────
// Progress through the ownership curriculum, level by level. Deliverable
// counts come from the curriculum itself (levelDeliverableCount), completions
// from the vault — so a level is "done" when its artifacts exist, not when
// its lessons were merely opened. That's the curriculum's own rule.

export function FounderQuestWidget({ userId, profileId, onOpenClasses }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const docs = useVaultDocs(userId, profileId);

  const levels = (LEVELS || []).map(level => {
    const total = levelDeliverableCount(level) || 0;
    const complete = (docs || []).filter(d => d.track === level.id && d.status === 'complete').length;
    return { level, total, complete, pct: total ? Math.round((complete / total) * 100) : 0 };
  }).filter(l => l.total > 0);

  const started = levels.filter(l => l.complete > 0);
  // Show what's in flight, or the first level if nothing has started.
  const shown = started.length ? started.slice(0, 4) : levels.slice(0, 2);

  return (
    <WidgetCard
      title="Founder quest" icon="flag-outline" accent={c.purple}
      action="Academy →" onAction={onOpenClasses}
      loading={docs === null}
      empty={levels.length === 0 ? {
        text: "The ownership curriculum isn't loaded. Check Academy Classes for the entrepreneur track.",
        cta: 'Open Academy', onPress: onOpenClasses,
      } : null}
    >
      {!started.length && (
        <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.sm }}>
          Nothing started yet — here's what's first.
        </Text>
      )}
      {shown.map(({ level, total, complete, pct }) => (
        <View key={level.id} style={{ marginBottom: s.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: t.sm, color: c.text2 }} numberOfLines={1}>{level.short || level.title}</Text>
            <Text style={{ fontSize: t.xs, color: c.text4 }}>{complete}/{total}</Text>
          </View>
          <Bar pct={pct} color={level.color || c.purple} />
        </View>
      ))}
    </WidgetCard>
  );
}

// ─── Targets & Readiness ─────────────────────────────────────────────────────
// Was `capitalScorecard`. The baseline the user typed during onboarding
// (revenue target, venture stage) lives on their profile row's `baseline`
// jsonb — this shows it back alongside how much of the funding-readiness
// work is actually done. No invented figures: if they never set a target,
// the widget says so and offers to take one.

// Levels whose deliverables are what a lender or investor actually asks for.
const READINESS_TRACKS = ['L1', 'L2', 'S1', 'S2'];

export function TargetsReadinessWidget({ userId, profile, onOpenProfiles, onOpenClasses }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const docs = useVaultDocs(userId, profile?.id);
  const baseline = profile?.baseline || {};
  const target = baseline.revenue_target;
  const stage = baseline.venture_stage;

  const readinessTotal = (LEVELS || [])
    .filter(l => READINESS_TRACKS.includes(l.id))
    .reduce((n, l) => n + (levelDeliverableCount(l) || 0), 0);
  const readinessDone = (docs || [])
    .filter(d => READINESS_TRACKS.includes(d.track) && d.status === 'complete').length;

  const hasBaseline = !!(target || stage);

  return (
    <WidgetCard
      title="Targets & readiness" icon="trending-up-outline" accent={c.success}
      loading={docs === null}
      empty={!hasBaseline && readinessDone === 0 ? {
        text: "No target set for this profile yet. Set a monthly revenue target or venture stage and this tracks it against how much of your funding-readiness paperwork is done.",
        cta: 'Set a target', onPress: onOpenProfiles,
      } : null}
    >
      {target && <StatRow label="Monthly revenue target" value={`$${target}`} color={c.success} />}
      {stage && <StatRow label="Venture stage" value={String(stage)} />}
      {readinessTotal > 0 && (
        <View style={{ marginTop: s.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: t.sm, color: c.text3 }}>Funding readiness</Text>
            <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: t.bold }}>
              {readinessDone}/{readinessTotal}
            </Text>
          </View>
          <Bar pct={(readinessDone / readinessTotal) * 100} color={c.success} />
          <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>
            Completed vault deliverables across the foundation and startup levels.
          </Text>
        </View>
      )}
    </WidgetCard>
  );
}
