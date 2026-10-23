// src/screens/today/TodayControls.js
// Today's one fixed piece (docs/shake-up-plan-2026-10-21.md §3.1): the
// control row. Everything under it is a widget; this stays because it is
// how you reach the Planner's features, not content. Adding works with
// every widget hidden.
//
//   Full: ‹ the day › · Calm · ⋯ · + Add, then Day/Week/Month · filter
//   Calm: the same, with the filter and ⋯ behind one "Options" link, and
//         the day only off today (Calm's Day is today)
//
// The TourSpot ids planner-add and planner-views are the guide's (six
// guide scripts and SPOT_FOR name them); keep them.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TourSpot from '../../components/TourSpot';
import MoreMenu from '../../components/MoreMenu';
import { VIEWS, VIEW_SHORT } from './plannerShared';

export default function TodayControls({ planner: p, calm, menuItems, onToggleCalm, onAdd, accent, shadows, c, t, s, r }) {
  const views = (
    <TourSpot id="planner-views">
      <View style={{ flexDirection: 'row', padding: 3, borderRadius: r.md, backgroundColor: c.bg2 }}>
        {VIEWS.map(v => {
          const on = p.view === v;
          return (
            <TouchableOpacity key={v} onPress={() => p.setView(v)}
              accessibilityRole="button" accessibilityLabel={`${v} view`} accessibilityState={{ selected: on }}
              style={[{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: r.sm, backgroundColor: on ? c.bg1 : 'transparent' }, on && shadows.sm]}>
              <Text style={{ fontSize: t.xs, fontWeight: on ? t.bold : t.semibold, color: on ? c.text1 : c.text3 }}>{VIEW_SHORT[v]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </TourSpot>
  );
  const day = (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
      <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={p.prev} hitSlop={8} style={{ padding: 4 }}>
        <Ionicons name="chevron-back" size={18} color={c.text3} />
      </TouchableOpacity>
      {/* Tapping the day goes back to today. */}
      <TouchableOpacity onPress={p.goToday} accessibilityRole="button" style={{ flexShrink: 1, minWidth: 0, paddingHorizontal: 2 }}
        accessibilityLabel={p.showsToday ? p.periodLabel() : `${p.periodLabel()}. Back to today`}>
        <Text numberOfLines={1} style={{ fontSize: calm ? t.sm : t.md, fontWeight: t.bold, color: c.text1 }}>{p.shortPeriodLabel()}</Text>
        {!p.showsToday && <Text style={{ fontSize: 11, fontWeight: t.bold, color: accent.primary }}>Back to today</Text>}
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Next" accessibilityRole="button" onPress={p.next} hitSlop={8} style={{ padding: 4 }}>
        <Ionicons name="chevron-forward" size={18} color={c.text3} />
      </TouchableOpacity>
    </View>
  );
  const add = (
    <TourSpot id="planner-add">
      <TouchableOpacity onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add to your day"
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: accent.primary, borderRadius: r.lg, paddingHorizontal: s.md, paddingVertical: 7 }, shadows.sm]}>
        <Ionicons name="add" size={16} color={accent.onPrimary} />
        <Text style={{ fontSize: t.xs, color: accent.onPrimary, fontWeight: t.bold }}>Add</Text>
      </TouchableOpacity>
    </TourSpot>
  );

  if (calm) {
    return (
      <View style={{ paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm, gap: s.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
          {views}
          <View style={{ flex: 1 }} />
          <MoreMenu items={menuItems} text="Options" label="Options: filter, phone calendar, layout and more" />
          {add}
        </View>
        {(p.view !== 'Daily' || !p.isToday) && day}
      </View>
    );
  }

  const areaCount = p.activeAreas.size;
  return (
    <View style={{ paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm, gap: s.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
        {day}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onToggleCalm} hitSlop={8} accessibilityRole="button" accessibilityLabel="Calm view: the same day, fewer cards"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: s.sm, paddingVertical: 4 }}>
          <Ionicons name="leaf-outline" size={13} color={c.text3} />
          <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3 }}>Calm</Text>
        </TouchableOpacity>
        <MoreMenu items={menuItems} label="More: what's next, phone calendar, layout and more" />
        {add}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
        {views}
        <View style={{ flex: 1 }} />
        {/* Life areas, in a sheet. The count says a filter is on. */}
        <TouchableOpacity onPress={p.openFilter} accessibilityRole="button"
          accessibilityLabel={areaCount ? `Filter: ${areaCount} life area${areaCount > 1 ? 's' : ''}` : 'Filter by life area'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
            borderColor: areaCount ? c.gold : c.border, backgroundColor: areaCount ? c.gold + '22' : 'transparent' }}>
          <Ionicons name="funnel-outline" size={14} color={areaCount ? c.gold : c.text3} />
          <Text style={{ fontSize: 11, fontWeight: t.bold, color: areaCount ? c.gold : c.text3 }}>{areaCount ? areaCount : 'All areas'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
