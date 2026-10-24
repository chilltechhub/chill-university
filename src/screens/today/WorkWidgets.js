// src/screens/today/WorkWidgets.js
// Today's work widgets (docs/shake-up-plan-2026-10-21.md §3.3, P6).
//
//   DeliverableWidget  this unit's deliverable: what it is, where it stands,
//                      the aim-for date (never "overdue"), Open, Plan time,
//                      Share once it's handed in. Nothing in flight: the
//                      next unit on your path.
//   MoneyWidget        your money sheet (the `money` Build) in one line:
//                      what it's for, a month's amount, where it could get to.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import WidgetCard from '../../components/widgets/WidgetCard';
import useDeliverables from '../../logic/useDeliverables';
import usePath from '../../logic/usePath';
import { UNIT_BY_ID, unitsForPath } from '../../data/units';
import { inFlight, statusLabel, aimForLabel, deliverableStep } from '../../logic/deliverables';
import { StepBar, StatusChip, DueChip, pathLook } from '../../ui';
import { goToScreen } from '../../logic/appRoutes';
import { todayStr } from '../../logic/dateUtils';
import { shareText, milestoneText } from '../../logic/shareOut';
import { loadBuilds, cachedBuilds, onBuildsChange } from '../../api/buildService';
import { kindOf } from '../../logic/builds';

export function DeliverableWidget({ onPlan }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { activeObjectiveId, completedObjectiveIds = [] } = useAccess();
  const { list, ready } = useDeliverables();
  const { pathKey, startPoint } = usePath();
  const [note, setNote] = useState(null);

  const d = inFlight(list, activeObjectiveId);
  // The last one handed in, so "Due → done" shows for a day after.
  const justHanded = !d ? list.filter(x => x.snapshotAt && x.snapshotAt.slice(0, 10) === todayStr())[0] : null;
  const shown = d || justHanded;
  const unit = shown ? UNIT_BY_ID[shown.unitKey] : null;
  const nextUnit = !shown ? unitsForPath(pathKey, { startPoint }).find(u => !completedObjectiveIds.includes(u.id)
    && !list.some(x => x.unitKey === u.id && (x.status === 'handed' || x.status === 'shown'))) : null;
  const openUnit = (id) => goToScreen(navigation, 'UnitScreen', { unitId: id });

  if (!shown) {
    return (
      <WidgetCard title="Your work" icon="document-text-outline" loading={!ready}
        empty={nextUnit
          ? { text: `Next up: ${nextUnit.label}. ${nextUnit.promise}`, cta: 'Open it', onPress: () => openUnit(nextUnit.id) }
          : { text: 'Pick a path and its first unit shows here.', cta: 'My path', onPress: () => goToScreen(navigation, 'PathScreen') }} />
    );
  }

  const handed = shown.status === 'handed' || shown.status === 'shown';
  const steps = deliverableStep(shown, unit);
  const aim = aimForLabel(shown, todayStr());
  return (
    <WidgetCard title="Your work" icon={handed ? 'checkmark-done-outline' : 'document-text-outline'}
      action="My path →" onAction={() => goToScreen(navigation, 'PathScreen')}>
      <TouchableOpacity onPress={() => openUnit(shown.unitKey)} accessibilityRole="button" accessibilityLabel={`${shown.title}. ${statusLabel(shown)}. Open the unit`}>
        <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{shown.title}</Text>
        {!!unit?.label && unit.label !== shown.title && <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>{unit.label}</Text>}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          <StatusChip status={shown.status} label={statusLabel(shown)} />
          <DueChip label={aim} />
        </View>
      </TouchableOpacity>
      {!handed && (
        <StepBar done={steps?.done || 0} total={steps?.total || 0} color={pathLook(c, unit?.path).color} style={{ marginTop: s.sm }} />
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.md, marginTop: s.md }}>
        <TouchableOpacity onPress={() => openUnit(shown.unitKey)} accessibilityRole="button" accessibilityLabel={handed ? 'Open the unit' : 'Keep working on it'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.md, paddingVertical: 8, borderRadius: r.lg, backgroundColor: accent.primary }}>
          <Ionicons name="arrow-forward" size={14} color={accent.onPrimary} />
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.onPrimary }}>{handed ? 'Open' : 'Keep going'}</Text>
        </TouchableOpacity>
        {!handed && !!onPlan && (
          <TouchableOpacity onPress={onPlan} accessibilityRole="button" accessibilityLabel="Plan time for it" style={{ justifyContent: 'center' }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>Plan time</Text>
          </TouchableOpacity>
        )}
        {handed && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Share it" style={{ justifyContent: 'center' }}
            onPress={async () => { const res = await shareText({ title: 'Deskartes', message: milestoneText('handed', shown.title) }); setNote(res === 'copied' ? 'Copied' : null); }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>{note || 'Share it'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </WidgetCard>
  );
}

// Where a monthly amount could get to: monthly compounding, the same math
// as the money sheet itself (buildRender.js renderMoney).
export function moneyAt(monthly, ratePct, years) {
  const m = Math.max(0, Number(monthly) || 0);
  const i = (Number(ratePct) || 0) / 100 / 12;
  const n = Math.max(0, Math.round((Number(years) || 0) * 12));
  if (!n) return 0;
  return i ? m * ((Math.pow(1 + i, n) - 1) / i) : m * n;
}

const dollars = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

export function MoneyWidget() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { userId } = useDeliverables();
  const [builds, setBuilds] = useState(() => cachedBuilds(userId) || []);
  useEffect(() => {
    let alive = true;
    loadBuilds(userId).then(l => { if (alive) setBuilds(l); }).catch(() => {});
    const off = onBuildsChange((uid, l) => { if ((uid || null) === userId) setBuilds(l); });
    return () => { alive = false; off(); };
  }, [userId]);

  const sheet = builds.find(b => b.kind === 'money');
  const snap = useMemo(() => {
    if (!sheet) return null;
    const kind = kindOf(sheet);
    const opt = (partId) => {
      const part = kind?.parts.find(p => p.id === partId);
      return part?.options.find(o => o.id === sheet.picks?.[partId]) || part?.options.find(o => o.id === part.start) || {};
    };
    const monthly = Math.min(2000, Math.max(1, Number(sheet.answers?.monthly) || 50));
    const { rate = 5 } = opt('growth');
    const { years = 10 } = opt('time');
    return { goal: sheet.answers?.goal || 'My goal', monthly, rate, years, end: moneyAt(monthly, rate, years) };
  }, [sheet]);

  const open = () => (sheet
    ? goToScreen(navigation, 'BuildScreen', { buildId: sheet.id })
    : goToScreen(navigation, 'StudioScreen', { start: 'money', at: Date.now() }));

  return (
    <WidgetCard title="Money sheet" icon="wallet-outline" action={sheet ? 'Open →' : null} onAction={open}
      empty={!snap ? { text: 'Your money sheet shows here: what you save for, and where a little a month could get to.', cta: 'Make one', onPress: open } : null}>
      {!!snap && (
        <TouchableOpacity onPress={open} accessibilityRole="button" accessibilityLabel={`Money sheet: ${snap.goal}. Open it`}>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{snap.goal}</Text>
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }}>
            <Text style={{ fontWeight: t.bold, color: c.text1 }}>{dollars(snap.monthly)}</Text> a month · {snap.rate}% · {snap.years} years
          </Text>
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: s.xs || 4 }}>
            Could reach about <Text style={{ fontWeight: t.bold, color: c.text1 }}>{dollars(snap.end)}</Text>. Not a promise: rates change.
          </Text>
        </TouchableOpacity>
      )}
    </WidgetCard>
  );
}
