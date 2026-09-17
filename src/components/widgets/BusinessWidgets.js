// src/components/widgets/BusinessWidgets.js
//
// The BUSINESS dashboard.
//
// personas.js asked for `orgSnapshot`, `systemAudit` and `sopTracker`. Only
// the first had anything behind it — there is no audit table and no SOP
// table anywhere in the schema, so the other two would have been dials wired
// to constants. They're re-specified here against data that actually exists,
// and named for what they really measure:
//
//   systemAudit  -> Systems Check   — your own ratings for the digital and
//                                     professional life areas
//   sopTracker   -> Recurring Ops   — the weekly/monthly planner components
//                                     you're subscribed to, which is what a
//                                     documented recurring process IS here
//
// If you want the originals as real features, each needs its own table and
// an authoring screen; that's a product feature, not a widget.

import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../api/supabaseClient';
import { getUserSubscriptions, AREAS } from '../../api/plannerService';
import WidgetCard, { StatRow, Bar } from './WidgetCard';

// ─── Org Snapshot ────────────────────────────────────────────────────────────
// Real, but empty for anyone not in an organization — which is most people.
// The empty state says exactly that rather than showing a zero.

export function OrgSnapshotWidget({ userId, onOpenOrg }) {
  const { colors: c, typography: t } = useTheme();
  const [org, setOrg] = useState(undefined); // undefined = loading, null = none

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setOrg(null); return; }
      try {
        const { data } = await supabase
          .from('organization_members')
          .select('role, organizations(id, name)')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        if (!data?.organizations) { setOrg(null); return; }
        const { count } = await supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', data.organizations.id);
        if (alive) setOrg({ name: data.organizations.name, role: data.role, members: count ?? null });
      } catch (e) {
        console.warn('orgSnapshot', e?.message);
        if (alive) setOrg(null);
      }
    })();
    return () => { alive = false; };
  }, [userId]));

  return (
    <WidgetCard
      title="Organization" icon="business-outline" accent={c.gold}
      loading={org === undefined}
      empty={org === null ? {
        text: "You're not part of an organization yet. Join one with an invite code to see its roster and shared assignments here.",
        cta: 'Organizations', onPress: onOpenOrg,
      } : null}
    >
      {org && (
        <>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>{org.name}</Text>
          <StatRow label="Your role" value={String(org.role || 'member')} />
          {org.members !== null && <StatRow label="Members" value={org.members} />}
        </>
      )}
    </WidgetCard>
  );
}

// ─── Systems Check ───────────────────────────────────────────────────────────
// Was `systemAudit`. Your own check-in ratings for the two areas that map to
// "how are my systems doing" — digital (tools, security, screen time) and
// professional (career, process, projects).

const SYSTEM_AREA_IDS = ['digital', 'professional'];

export function SystemsCheckWidget({ areas, onOpenLibrary }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const rows = (areas || []).filter(a => SYSTEM_AREA_IDS.includes(a.area.id));
  const rated = rows.filter(a => a.rating > 0);

  return (
    <WidgetCard
      title="Systems check" icon="pulse-outline" accent={c.tech || c.teal}
      action="Library →" onAction={onOpenLibrary}
      empty={rated.length === 0 ? {
        text: "Rate your Digital and Professional areas to get a read on how your systems and processes are holding up.",
        cta: 'Check in', onPress: onOpenLibrary,
      } : null}
    >
      {rated.map(({ area, rating, days }) => (
        <View key={area.id} style={{ marginBottom: s.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: t.sm, color: c.text2 }}>{area.emoji} {area.label}</Text>
            <Text style={{ fontSize: t.sm, color: area.color, fontWeight: t.bold }}>{rating}%</Text>
          </View>
          <Bar pct={rating} color={area.color} />
          <Text style={{ fontSize: 10, color: c.text4, marginTop: 2 }}>
            {days === null ? 'never checked' : days === 0 ? 'checked today' : `checked ${days}d ago`}
          </Text>
        </View>
      ))}
    </WidgetCard>
  );
}

// ─── Recurring Ops ───────────────────────────────────────────────────────────
// Was `sopTracker`. The weekly and monthly planner components you're
// subscribed to — the recurring processes you've actually committed to,
// which is the honest version of an SOP tracker on this schema.

export function RecurringOpsWidget({ userId, onOpenPlanner }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const [ops, setOps] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setOps([]); return; }
      try {
        const subs = await getUserSubscriptions(userId);
        if (alive) setOps(subs.filter(x => x.cadence === 'weekly' || x.cadence === 'monthly'));
      } catch (e) {
        console.warn('recurringOps', e?.message);
        if (alive) setOps([]);
      }
    })();
    return () => { alive = false; };
  }, [userId]));

  return (
    <WidgetCard
      title="Recurring ops" icon="repeat-outline" accent={c.gold}
      action="Planner →" onAction={onOpenPlanner}
      loading={ops === null}
      empty={ops?.length === 0 ? {
        text: "No recurring processes set up. Weekly and monthly planner items show here as your standing operating rhythm.",
        cta: 'Add one', onPress: onOpenPlanner,
      } : null}
    >
      {(ops || []).slice(0, 5).map(op => {
        const def = AREAS[op.area] || { color: c.teal, emoji: '•' };
        return (
          <View key={op.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
            <Ionicons name="ellipse" size={7} color={def.color} />
            <Text style={{ fontSize: t.sm, color: c.text2, flex: 1 }} numberOfLines={1}>{op.title}</Text>
            <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'capitalize' }}>{op.cadence}</Text>
          </View>
        );
      })}
      {(ops || []).length > 5 && (
        <Text style={{ fontSize: t.xs, color: c.text4, marginTop: s.sm }}>+{ops.length - 5} more</Text>
      )}
    </WidgetCard>
  );
}
