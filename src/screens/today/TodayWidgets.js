// src/screens/today/TodayWidgets.js
// Today's own widgets (docs/shake-up-plan-2026-10-21.md §3.1, §3.3). Each is
// one card on the board, moved and hidden like any other; HomeScreen's
// `widgets` list draws them when DASHBOARD_V2 is on.
//
//   NextStepWidget  the one next step (src/logic/nextStep.js). A finished
//                   goal, the first goal or no goal at all hands over to
//                   CompassCard, which already does those well.
//   QuickAddWidget  "dentist thu 4pm" in one line
//   YourDayWidget   the Planner's Day: your focus, "2 of 5 done", check-in,
//                   time grid or list (a visible toggle now), what's due,
//                   events, phone events
//   StillOpenWidget what slipped from earlier days and to-dos with no day.
//                   Never "overdue"
//   DueSoonWidget   what's due in the next seven days

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../components/ui';
import RichText from '../../components/RichText';
import TourSpot from '../../components/TourSpot';
import CompassCard from '../../components/CompassCard';
import WidgetCard from '../../components/widgets/WidgetCard';
import PlannerQuickAdd from '../../components/PlannerQuickAdd';
import PlannerBacklog from '../../components/PlannerBacklog';
import useDayPlan from '../../logic/useDayPlan';
import { rowsOf } from '../../logic/dayPlan';
import { dueWhen } from '../../logic/nextStep';
import { toISO, addDays } from './plannerShared';
import DayView from './DayView';

// The card every Today widget sits on: the theme's surface and its lift.
function Surface({ children, edge, style }) {
  const { colors: c, spacing: s, style: ui, shadows } = useTheme();
  return (
    <View style={[{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, marginHorizontal: s.lg, borderWidth: ui.borderWidth, borderColor: c.border },
      edge && { borderLeftWidth: 3, borderLeftColor: edge }, ui.cardShadow && shadows[ui.cardShadow], style]}>
      {children}
    </View>
  );
}

export function NextStepWidget({ pick, dream, onAct }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  if (!pick || ['claim', 'first', 'path'].includes(pick.kind)) return <CompassCard />;
  const inProgress = !!pick.progress && pick.progress.done > 0;
  return (
    <Surface edge={inProgress ? accent.primary : null} style={{ padding: s.lg }}>
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary, letterSpacing: 0.4 }}>{pick.label}</Text>
      <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginTop: 4 }}>{pick.title}</Text>
      {(!!pick.why || !!pick.progress) && (
        <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4 }}>
          {[pick.why, pick.progress && `step ${Math.min(pick.progress.done + 1, pick.progress.total)} of ${pick.progress.total}`].filter(Boolean).join(' · ')}
        </Text>
      )}
      {/* The Dream echo: what this builds toward, in their words. */}
      {!!dream && (
        <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }} boldStyle={{ color: c.text2 }}>
          {`Builds toward: **${dream}**`}
        </RichText>
      )}
      <Button label={pick.action.label} size="sm" fullWidth={false} icon={pick.action.type === 'drill' ? 'game-controller-outline' : 'arrow-forward'}
        onPress={() => onAct(pick)} style={{ marginTop: s.md }} />
    </Surface>
  );
}

export function QuickAddWidget({ userId, area, onAdded }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  return (
    <Surface style={{ paddingVertical: s.sm }}>
      <PlannerQuickAdd userId={userId} date={new Date()} area={area} onAdded={onAdded} c={c} t={t} s={s} r={r} />
    </Surface>
  );
}

export function YourDayWidget({ planner: p, focus, onEditFocus, onOpen, onAdd, onQuickAdded }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  return (
    <Surface style={{ paddingTop: s.sm, paddingBottom: s.sm, overflow: 'hidden' }}>
      <DayView
        key={`today-${p.anchor.toDateString()}-${p.showingAll ? 'all' : 'one'}`}
        embedded
        userId={p.userId} date={p.anchor} onAdd={onAdd}
        reviewAt={p.reviewAt} quickArea={p.defaultArea} onQuickAdded={onQuickAdded}
        activeAreas={p.activeAreas} timeMode={p.timeMode} onOpen={onOpen}
        showingAll={p.showingAll} refreshKey={p.refreshKey}
        renderHeader={({ completed, total }) => (
          <View style={{ marginBottom: s.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.bold, color: c.text2 }}>
                {p.isToday ? 'Your day' : p.anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              {/* Done / total, in words: no percent, no colour pressure. */}
              {total > 0 && <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3 }}>{completed} of {total} done</Text>}
              {/* The grid ↔ list choice, visible now (it hid in ⋯). */}
              <View style={{ flexDirection: 'row', padding: 2, borderRadius: r.sm, backgroundColor: c.bg2 }}>
                {[[true, 'time-outline', 'By time'], [false, 'list', 'As a list']].map(([mode, icon, label]) => (
                  <TouchableOpacity key={label} onPress={() => p.setTimeMode(mode)} accessibilityRole="button" accessibilityLabel={label}
                    accessibilityState={{ selected: p.timeMode === mode }}
                    style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: r.sm - 2, backgroundColor: p.timeMode === mode ? c.bg1 : 'transparent' }}>
                    <Ionicons name={icon} size={14} color={p.timeMode === mode ? accent.primary : c.text3} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Today's focus: one line on what today is for (a first goal's
                "Set a focus for today" step is done here). */}
            {p.isToday && (
              <TourSpot id="home-focus-input">
                <TouchableOpacity onPress={onEditFocus} accessibilityRole="button"
                  accessibilityLabel={focus ? `Today's focus: ${focus}. Change it` : "Set today's focus"}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s.sm }}>
                  <Ionicons name="locate-outline" size={14} color={focus ? accent.primary : c.text3} />
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: t.sm, color: focus ? c.text1 : c.text3, fontWeight: focus ? t.semibold : t.regular }}>
                    {focus || 'Tap to pick one thing today is for'}
                  </Text>
                </TouchableOpacity>
              </TourSpot>
            )}
          </View>
        )}
        c={c} t={t} s={s} r={r}
      />
    </Surface>
  );
}

export function StillOpenWidget({ planner: p }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  if (!p.userId) {
    return (
      <WidgetCard title="Still open" icon="time-outline" empty={{ text: 'What you were halfway through shows here once your plans are on an account.' }} />
    );
  }
  return (
    <Surface style={{ paddingVertical: s.sm }}>
      <PlannerBacklog userId={p.userId} onChange={p.bump} openAt={p.reviewAt} c={c} t={t} s={s} r={r} />
    </Surface>
  );
}

export function DueSoonWidget({ planner: p, onOpenDay }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const from = toISO(new Date());
  const to = toISO(addDays(new Date(), 6));
  const { items, loading } = useDayPlan({ from, to }, { userId: p.userId, refreshKey: p.refreshKey, events: false, enabled: !!p.userId });
  const due = useMemo(() => rowsOf(items, 'due').filter(d => !d.completed).sort((a, b) => String(a.date).localeCompare(String(b.date))), [items]);
  return (
    <WidgetCard title="Due this week" icon="flag-outline" loading={!!p.userId && loading}
      empty={!p.userId
        ? { text: 'Deadlines from your projects and classes show here once you have an account.' }
        : !due.length ? { text: 'Nothing due in the next seven days.' } : null}>
      {due.slice(0, 6).map(d => (
        <TouchableOpacity key={`${d.kind}-${d.id}`} onPress={() => onOpenDay(d.date)} accessibilityRole="button"
          accessibilityLabel={`${d.title}. ${dueWhen(d.date, from)}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 7, borderTopWidth: 0.5, borderTopColor: c.border }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{d.title}</Text>
          <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>{dueWhen(d.date, from)}</Text>
        </TouchableOpacity>
      ))}
    </WidgetCard>
  );
}
