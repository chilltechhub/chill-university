// src/components/TodayCard.js
// Home's Today: one card instead of four (docs/consolidation-plan-2026-10-20.md
// §5). It is the Focus widget's slot, and it draws in whichever of the
// others this person's Home has: Today's Activities, On the Desk, Check-ins.
// What decides who has which (stages, picks, a saved layout) is untouched;
// only the drawing is combined. In Edit layout the cards come apart again
// so each can still be moved or hidden on its own.
//
// Top to bottom: the date, Right now (the one thing at this minute, from
// RightNowCard's own pick), today's focus, what's on today, the next thing
// on the desk, and one check-in if one's due.
//
// The TourSpots the separate cards carried are here too, so tours that
// point at the focus box, today's list or the desk still land.
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import TourSpot from './TourSpot';
import SleepyCat from './SleepyCat';
import { useRightNow } from './RightNowCard';

const NOW_ICON = { rest: 'moon-outline', now: 'radio-button-on', soon: 'alarm-outline', late: 'alert-circle-outline', today: 'today-outline', desk: 'albums-outline' };

export default function TodayCard({
  date, focus, onEditFocus, onCalendar,
  activities = [], desk = [], show = {},
  onOpenActivity, onPlan, onOpenDesk, onAddDesk,
  // The desk's own add box (Home owns its state): open, its text, submit.
  adding = false, addText = '', onAddText, onAddSubmit,
  checkInDue = [], onCheckIn,
  onNowOpen, onNowDone, onNowFocus,
  formatTime = (x) => x,
}) {
  const { colors: c, typography: t, spacing: s, radius: r, style: ui, accent } = useTheme();
  const pick = useRightNow(activities, desk);
  const tone = pick ? (pick.kind === 'late' ? c.error : pick.kind === 'rest' ? c.purple : accent.primary) : accent.primary;
  const nowRef = pick?.item?.ref;
  const canDone = nowRef && (nowRef._src === 'planner' || nowRef._src === 'task');
  const next = desk[0] || null;
  const due = checkInDue[0] || null;

  const label = { fontSize: t.xs, color: c.text3, ...ui.eyebrow, marginBottom: 4 };
  const divider = { height: 0.5, backgroundColor: c.border, marginVertical: s.md };

  return (
    <View style={{ marginHorizontal: s.lg, padding: s.lg, borderRadius: ui.cardRadius, backgroundColor: c.bg1, borderWidth: ui.borderWidth, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1, fontFamily: ui.titleFont }}>
          Today <Text style={{ fontSize: t.sm, fontWeight: t.medium, color: c.text3 }}>· {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </Text>
        <TouchableOpacity onPress={onCalendar} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open the calendar">
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: accent.primary }}>Calendar →</Text>
        </TouchableOpacity>
      </View>

      {/* Right now */}
      {!!pick && (
        <TouchableOpacity
          activeOpacity={0.85} disabled={!nowRef} onPress={() => nowRef && onNowOpen?.(nowRef, pick.kind)}
          accessibilityRole="button" accessibilityLabel={`Right now. ${pick.label}. ${pick.title}`}
          style={{ marginTop: s.md, flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, borderRadius: r.md, backgroundColor: c.bg0, borderLeftWidth: 3, borderLeftColor: tone }}
        >
          <Ionicons name={NOW_ICON[pick.kind]} size={18} color={tone} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: tone }}>{pick.label}</Text>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} numberOfLines={2}>{pick.title}</Text>
          </View>
          {canDone && (
            <TouchableOpacity onPress={() => onNowDone?.(nowRef)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Mark ${pick.title} done`}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: r.full, borderWidth: 1, borderColor: tone }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: tone }}>Done</Text>
            </TouchableOpacity>
          )}
          {pick.kind !== 'rest' && (
            <TouchableOpacity onPress={() => onNowFocus?.(nowRef || { title: pick.title }, pick.kind)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Focus on ${pick.title}`}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: r.full, backgroundColor: tone }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.onPrimary }}>Focus</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      )}

      {/* Focus */}
      <TourSpot id="home-focus-input">
        <TouchableOpacity onPress={onEditFocus} accessibilityRole="button" accessibilityLabel={focus ? `Today's focus: ${focus}. Change it` : "Set today's focus"}
          style={{ marginTop: s.md, flexDirection: 'row', alignItems: 'flex-start', gap: s.sm }}>
          <Ionicons name="bookmark" size={15} color={accent.primary} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, fontSize: t.md, color: focus ? c.text1 : c.text3, fontWeight: focus ? t.semibold : '400' }} numberOfLines={2}>
            {focus || "Set today's focus..."}
          </Text>
        </TouchableOpacity>
      </TourSpot>

      {/* What's on today */}
      {show.activities && (
        <TourSpot id="home-today-activities">
          <View style={divider} />
          <Text style={label}>On today</Text>
          {activities.length ? (
            <>
              {activities.slice(0, 3).map(item => (
                <TouchableOpacity key={item.id} onPress={() => onOpenActivity?.(item)} accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color || accent.primary }} />
                  <Text style={{ width: 62, fontSize: t.xs, fontWeight: t.bold, color: c.text2 }}>{item.time ? formatTime(item.time) : 'Any time'}</Text>
                  <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              ))}
              {activities.length > 3 && (
                <TouchableOpacity onPress={onCalendar} accessibilityRole="button">
                  <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>+{activities.length - 3} more today</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity onPress={onPlan} accessibilityRole="button" accessibilityLabel="Nothing planned for today. Open the Planner"
              style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <SleepyCat size={32} style={{ marginVertical: -6, marginLeft: -4 }} />
              <Text style={{ flex: 1, fontSize: t.sm, color: c.text2 }}>Nothing planned yet</Text>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>Plan →</Text>
            </TouchableOpacity>
          )}
        </TourSpot>
      )}

      {/* The next thing to pick up */}
      {show.desk && (
        <TourSpot id="home-desk">
          <View style={divider} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[label, { flex: 1 }]}>Next up</Text>
            <TouchableOpacity onPress={onAddDesk} hitSlop={8} accessibilityRole="button" accessibilityLabel="Add something to do">
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {adding && (
            <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
              <TextInput
                value={addText} onChangeText={onAddText} onSubmitEditing={onAddSubmit} autoFocus
                placeholder="What needs to get done?" placeholderTextColor={c.text4} accessibilityLabel="What needs to get done?"
                style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: ui.borderWidth, borderColor: c.border }}
              />
              <TouchableOpacity onPress={onAddSubmit} accessibilityRole="button" accessibilityLabel="Add it"
                style={{ backgroundColor: accent.primary, borderRadius: ui.buttonRadius, paddingHorizontal: s.md, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={18} color={accent.onPrimary} />
              </TouchableOpacity>
            </View>
          )}
          {next ? (
            <TouchableOpacity onPress={() => onOpenDesk?.(next)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <Ionicons name="arrow-forward-circle-outline" size={18} color={accent.primary} />
              <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }} numberOfLines={2}>{next.title}</Text>
              {desk.length > 1 && <Text style={{ fontSize: t.xs, color: c.text3 }}>+{desk.length - 1}</Text>}
            </TouchableOpacity>
          ) : (
            <Text style={{ fontSize: t.sm, color: c.text3 }}>Nothing waiting. Projects, notes and ideas with a next step land here.</Text>
          )}
        </TourSpot>
      )}

      {/* One check-in, if one is due */}
      {show.checkins && !!due && (
        <>
          <View style={divider} />
          <TouchableOpacity onPress={() => onCheckIn?.(due)} accessibilityRole="button"
            accessibilityLabel={`Check in on ${due.area.label}. ${due.days === null ? 'Not rated yet' : `${due.days} days since`}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
            <Ionicons name={due.area.icon || 'pulse-outline'} size={16} color={c.text2} />
            <Text style={{ flex: 1, fontSize: t.sm, color: c.text2 }}>
              Check in on <Text style={{ fontWeight: t.bold, color: c.text1 }}>{due.area.label}</Text>
              {due.days === null ? ' · not rated yet' : ` · ${due.days}d`}
              {checkInDue.length > 1 ? `  +${checkInDue.length - 1} more` : ''}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.text3} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
