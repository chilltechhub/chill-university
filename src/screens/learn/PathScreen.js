// src/screens/learn/PathScreen.js
// My path (docs/shake-up-plan-2026-10-21.md §4.1, P6): the path as a
// course. The unit you're on at the top, then every unit in order with where
// it stands (Done · Handed in · Doing · Up next · Later). "The ground" as
// the shakiest circle puts a Ground fix first (§8.1).
//
// Goals became this view (the Compass alias, with the new tabs). The old
// goals list is still one tap away: navigate('Compass') goes there
// directly, without the alias.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import { FAB_CLEARANCE } from '../../../context/FabPositionContext';
import usePath from '../../logic/usePath';
import useDeliverables from '../../logic/useDeliverables';
import { unitsForPath, GROUND_AREAS } from '../../data/units';
import { PATH_KITS } from '../../data/pathKits';
import { deliverableForUnit } from '../../api/deliverableService';
import { STATUS_LABEL } from '../../logic/deliverables';
import TourSpot from '../../components/TourSpot';

const PICKS = ['like', 'next', 'money', 'career'];

export default function PathScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { activeObjectiveId, completedObjectiveIds = [] } = useAccess();
  const { pathKey, startPoint, groundFirst, setPath } = usePath();
  const { list } = useDeliverables();
  const kit = PATH_KITS[pathKey];

  // Where each unit stands. Handed in without the unit finished happens for
  // the welcome's page (unit 1 of What do I like?): it counts as passed.
  const stateOf = (u) => {
    const d = deliverableForUnit(list, u.id);
    if (completedObjectiveIds.includes(u.id)) return 'done';
    if (activeObjectiveId === u.id) return 'active';
    if (d.status === 'handed' || d.status === 'shown') return 'handed';
    return d.status;
  };
  const units = useMemo(() => unitsForPath(pathKey, { startPoint }), [pathKey, startPoint]);
  const ground = useMemo(() => unitsForPath('ground'), []);
  const groundDone = ground.some(u => ['done', 'handed'].includes(stateOf(u)));
  const groundActive = ground.find(u => stateOf(u) === 'active');
  const showGround = groundFirst && !groundDone;
  const current = (showGround && groundActive)
    || units.find(u => stateOf(u) === 'active')
    || (showGround ? null : units.find(u => !['done', 'handed'].includes(stateOf(u))));
  const passed = units.filter(u => ['done', 'handed'].includes(stateOf(u))).length;

  const open = (u) => navigation.navigate('UnitScreen', { unitId: u.id });
  const label = (st, u) => {
    if (st === 'done') return 'Done';
    if (st === 'active') return 'On it';
    if (st === 'handed') return 'Handed in';
    if (st === 'doing') return STATUS_LABEL.doing;
    return u === current ? 'Up next' : 'Later';
  };

  const card = { padding: s.lg, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg0 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: FAB_CLEARANCE }}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back to Learn" hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={18} color={accent.primary} />
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>Learn</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: accent.primary }}>MY PATH</Text>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginTop: 2 }} accessibilityRole="header">{kit.label}</Text>
        <Text style={{ fontSize: t.md, color: c.text2, marginTop: 4, marginBottom: s.md }}>{kit.blurb}</Text>

        {/* The ground first */}
        {showGround && (
          <View style={[card, { borderColor: accent.primary, borderWidth: 1 }]}>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Steady ground first</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>Pick the part that feels <Text style={{ fontWeight: t.bold, color: c.text2 }}>shakiest</Text>. One small fix, then your path.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: s.sm }}>
              {ground.map((u, i) => {
                const on = stateOf(u) === 'active';
                return (
                  <TouchableOpacity key={u.id} onPress={() => open(u)} accessibilityRole="button" accessibilityLabel={u.label}
                    style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: on ? accent.primary : c.border, backgroundColor: on ? accent.primary + '18' : 'transparent' }}>
                    <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: on ? accent.primary : c.text2 }}>{GROUND_AREAS[i][1]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* The unit you're on */}
        {current && (
          <TourSpot id="path-current" style={{ width: '100%' }}>
            <TouchableOpacity onPress={() => open(current)} accessibilityRole="button" accessibilityLabel={`Open ${current.label}`}
              style={[card, { borderColor: accent.primary, borderWidth: 1 }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: c.text3 }}>
                {current.path === 'ground' ? 'GROUND FIX' : `UNIT ${units.indexOf(current) + 1} OF ${units.length}`}
              </Text>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginTop: 2 }}>{current.label}</Text>
              <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }}>{current.promise}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: s.sm, paddingHorizontal: s.md, paddingVertical: 9, borderRadius: r.lg, backgroundColor: accent.primary }}>
                <Ionicons name="arrow-forward" size={15} color={accent.onPrimary} />
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.onPrimary }}>{stateOf(current) === 'active' ? 'Keep going' : 'Open'}</Text>
              </View>
            </TouchableOpacity>
          </TourSpot>
        )}
        {!current && !showGround && (
          <View style={card}>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Every unit is done.</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>Pick another path below, or keep making on Make.</Text>
          </View>
        )}

        {/* Every unit */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: s.sm, marginBottom: s.sm }}>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>The units</Text>
          <Text style={{ fontSize: t.xs, color: c.text3 }}>{passed} of {units.length} done</Text>
        </View>
        <View style={{ borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden', marginBottom: s.lg }}>
          {units.map((u, i) => {
            const st = stateOf(u);
            const ticked = st === 'done' || st === 'handed';
            return (
              <TouchableOpacity key={u.id} onPress={() => open(u)} accessibilityRole="button" accessibilityLabel={`${u.label}. ${label(st, u)}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.md, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ticked ? accent.primary : c.bg2 }}>
                  {ticked ? <Ionicons name="checkmark" size={15} color={accent.onPrimary} /> : <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.text2 }}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{u.label}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3 }} numberOfLines={1}>{u.deliverable.title}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: t.bold, color: st === 'active' || u === current ? accent.primary : c.text3 }}>{label(st, u)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Another path */}
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>Switch path</Text>
        <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.sm }}>Your work stays. Units you finished stay done.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.lg }}>
          {PICKS.map(k => {
            const on = k === pathKey;
            return (
              <TouchableOpacity key={k} onPress={() => setPath(k)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${PATH_KITS[k].label}${on ? ', your path' : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.md, paddingVertical: 9, borderRadius: r.lg, borderWidth: 1, borderColor: on ? accent.primary : c.border, backgroundColor: on ? accent.primary + '18' : c.bg1 }}>
                <Ionicons name={PATH_KITS[k].icon} size={15} color={on ? accent.primary : c.text2} />
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: on ? accent.primary : c.text1 }}>{PATH_KITS[k].label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.lg }}>
          <TouchableOpacity onPress={() => navigation.navigate('Compass')} accessibilityRole="button" accessibilityLabel="All goals">
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>All goals →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Credits')} accessibilityRole="button" accessibilityLabel="Sources and credits">
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text3 }}>Sources and credits</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
