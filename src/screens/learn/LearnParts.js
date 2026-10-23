// src/screens/learn/LearnParts.js
// What Learn adds with the new tabs (docs/shake-up-plan-2026-10-21.md §2.1,
// P4): **My path** at the top, and the **Find** shelf that was the
// Library's Find page (Finds, Wayfinder, Career Explorer). Learn's root is
// still the games screen's file in its Learn layout (GamesScreen.js), so the
// pet that finds coins stays mounted from launch; the games themselves are
// the Practice route.
//
// My path is the goal or unit in flight, the same thing the top bar's chip
// shows (nextStep.js pathChip). Nothing in flight: your path's name, and
// the card opens My path (PathScreen, P6) to pick the next unit.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import { pathChip } from '../../logic/nextStep';
import { goToScreen } from '../../logic/appRoutes';
import TourSpot from '../../components/TourSpot';
import usePath from '../../logic/usePath';
import { PATH_KITS } from '../../data/pathKits';

export function MyPathCard() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent, shadows: sh } = useTheme();
  const { activeObjective } = useAccess();
  const { pathKey } = usePath();
  const o = activeObjective?.active ? activeObjective : null;
  const chip = pathChip(o && { active: true, complete: !!o.complete, label: o.objective?.label, done: o.done, total: o.total });
  const step = o?.nextStep;
  const myPath = () => goToScreen(navigation, 'PathScreen');
  const open = () => {
    if (o?.complete && o.objective?.unit) { goToScreen(navigation, 'UnitScreen', { unitId: o.objective.id }); return; }
    if (!o || o.complete || !step?.screen) { myPath(); return; }
    goToScreen(navigation, step.screen, step.params);
  };
  return (
    <TourSpot id="learn-path" style={{ width: '100%' }}>
      <View style={[{ width: '100%', padding: s.lg, borderRadius: r.xl, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md }, sh.sm]}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: accent.primary }}>MY PATH</Text>
        <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginTop: 4 }} numberOfLines={2}>
          {chip.empty ? PATH_KITS[pathKey]?.label || 'Pick where to start' : chip.label}
        </Text>
        {!chip.empty && !!step?.label && !o.complete && (
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }} numberOfLines={2}>Next: <Text style={{ fontWeight: t.bold, color: c.text1 }}>{step.label}</Text></Text>
        )}
        {chip.total > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.sm }}>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.bg2, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${chip.pct}%`, borderRadius: 3, backgroundColor: accent.primary }} />
            </View>
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3 }}>{chip.done} of {chip.total}</Text>
          </View>
        )}
        {chip.empty && (
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>One unit at a time. <Text style={{ fontWeight: t.bold, color: c.text2 }}>Pick the next one</Text> and its steps show up here.</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginTop: s.md }}>
          <TouchableOpacity onPress={open} accessibilityRole="button"
            accessibilityLabel={chip.empty ? 'Open my path' : o?.complete ? 'Finish it' : `Open the next step: ${step?.label || chip.label}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.md, paddingVertical: 9, borderRadius: r.lg, backgroundColor: accent.primary }}>
            <Ionicons name={chip.empty ? 'compass-outline' : 'arrow-forward'} size={15} color={accent.onPrimary} />
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.onPrimary }}>{chip.empty ? 'My path' : o?.complete ? 'Finish it' : 'Open'}</Text>
          </TouchableOpacity>
          {!chip.empty && (
            <TouchableOpacity onPress={myPath} accessibilityRole="button" accessibilityLabel="My path, every unit">
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>My path →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TourSpot>
  );
}

// The Library's old Find page. They stay Library routes (all 58 do), so
// search, links and back behave as before.
const FINDS = [
  { screen: 'KnowledgeScreen', params: { initialTab: 'discover' }, label: 'Finds', icon: 'sparkles-outline', desc: 'Tools and know-how that save you time or money' },
  { screen: 'WayfinderScreen', label: 'Wayfinder', icon: 'navigate-circle-outline', desc: 'Figure out what fits you' },
  { screen: 'CareerExplorationScreen', label: 'Career Explorer', icon: 'compass-outline', desc: 'Careers that could fit you' },
];

export function LearnFinds() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { isScreenVisible } = useAccess();
  const shown = FINDS.filter(f => isScreenVisible(f.screen));
  if (!shown.length) return null;
  return (
    <TourSpot id="learn-find" style={{ width: '100%' }}>
      <View style={{ width: '100%', marginTop: s.md, marginBottom: s.sm }}>
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Find</Text>
        <View style={{ borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden' }}>
          {shown.map((f, i) => (
            <TouchableOpacity key={f.screen} onPress={() => goToScreen(navigation, f.screen, f.params)} accessibilityRole="button" accessibilityLabel={`${f.label}. ${f.desc}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.md, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
              <Ionicons name={f.icon} size={20} color={accent.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{f.label}</Text>
                <Text style={{ fontSize: t.xs, color: c.text3 }} numberOfLines={1}>{f.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={c.text4} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TourSpot>
  );
}
