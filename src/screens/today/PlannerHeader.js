// src/screens/today/PlannerHeader.js
// The Planner's header: the title with Fill with AI, Add and the ⋯ menu, then
// one row with the view, the day and the life-area filter. Moved out of
// PlannerScreen.js for the shake-up (docs/shake-up-plan-2026-10-21.md P1).
// The TourSpot ids planner-add and planner-views are the guide's; keep them.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TourSpot from '../../components/TourSpot';
import FillWithAIButton from '../../components/FillWithAIButton';
import MoreMenu from '../../components/MoreMenu';
import { VIEWS, VIEW_SHORT } from './plannerShared';

export default function PlannerHeader({
  view, onView, isToday, label, shortLabel, onPrev, onNext, onToday,
  onAdd, menuItems, areaCount, onFilter, showEmojis, showFillWithAI = true, c, t, s, r,
}) {
  return (
    <View style={{ backgroundColor: c.headerBg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      {/* Title + actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, flex: 1 }}>{showEmojis ? '📓 ' : ''}Planner</Text>
        <View style={{ flexDirection: 'row', gap: s.sm }}>
          {showFillWithAI && <FillWithAIButton target="planner" />}
          <TourSpot id="planner-add">
          <TouchableOpacity
            onPress={onAdd}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.teal, borderRadius: r.lg, paddingHorizontal: s.md, paddingVertical: 6 }}>
            <Ionicons name="add" size={16} color={c.onFill} />
            <Text style={{ fontSize: t.xs, color: c.onFill, fontWeight: t.bold }}>Add</Text>
          </TouchableOpacity>
          </TourSpot>
          {/* Three unlabeled icons (a chart, a clock, a grid) used to sit
              here; nobody could tell what they did. Named, in one menu. */}
          <MoreMenu items={menuItems} />
        </View>
      </View>

      {/* One row: the view, the day and the filter. They were three rows
          (view chips, the date, a strip of eight life-area chips), so the
          first task started 40% down the screen. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.lg, paddingBottom: s.sm }}>
        <TourSpot id="planner-views">
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: c.border, borderRadius: 20, overflow: 'hidden' }}>
          {VIEWS.map(v => (
            <TouchableOpacity key={v} onPress={() => onView(v)}
              accessibilityRole="button" accessibilityLabel={`${v} view`} accessibilityState={{ selected: view === v }}
              style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: view === v ? c.teal : 'transparent' }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: view === v ? c.onFill : c.text3 }}>{VIEW_SHORT[v]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        </TourSpot>

        {/* Period nav. Tapping the date returns to today. */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
          <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={onPrev} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={16} color={c.text3} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', minWidth: 0 }} onPress={onToday}
            accessibilityRole="button" accessibilityLabel={isToday ? label : `${label}. Back to today`}>
            <Text numberOfLines={1} style={{ fontSize: t.sm, fontWeight: t.semibold, color: isToday ? c.teal : c.text1 }}>{shortLabel}</Text>
            {!isToday && <Text style={{ fontSize: 11, fontWeight: t.bold, color: c.teal }}>Back to today</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Next" accessibilityRole="button" onPress={onNext} style={{ padding: 4 }}>
            <Ionicons name="chevron-forward" size={16} color={c.text3} />
          </TouchableOpacity>
        </View>

        {/* Life areas, in a sheet. The count says a filter is on. */}
        <TouchableOpacity onPress={onFilter}
          accessibilityRole="button"
          accessibilityLabel={areaCount ? `Filter: ${areaCount} life area${areaCount > 1 ? 's' : ''}` : 'Filter by life area'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
                   borderColor: areaCount ? c.gold : c.border, backgroundColor: areaCount ? c.gold + '22' : 'transparent' }}>
          <Ionicons name="funnel-outline" size={14} color={areaCount ? c.gold : c.text3} />
          {areaCount > 0 && <Text style={{ fontSize: 11, fontWeight: t.bold, color: c.gold }}>{areaCount}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
