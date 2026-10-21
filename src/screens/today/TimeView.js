// src/screens/today/TimeView.js
// The day by time of day. Moved out of PlannerScreen.js for the shake-up
// (docs/shake-up-plan-2026-10-21.md P1).

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB_CLEARANCE } from '../../../context/FabPositionContext';
import { AREAS } from '../../api/plannerService';
import { fmt12, timeRange, hourRange, layoutDay } from '../../logic/plannerLayout';
import { HOUR_H, DAY_START, DAY_END, MIN_BOX_MINUTES, UNTIMED_PREVIEW, toISO } from './plannerShared';
import AgendaRow from './AgendaRow';

// ─── Time-based daily view ────────────────────────────────────────────────────
// Items that overlap sit side by side (layoutDay in plannerLayout.js) rather
// than stacked on one another, the hours stretch to fit anything early or
// late, and an empty slot is a button that adds something at that time.
export default function TimeView({ instances, date, onUpdate, onOpen, onAddAt, c, t, s, r }) {
  const scrollRef = useRef(null);
  const scrolled  = useRef(false);
  const [gridW, setGridW] = useState(0);
  const [allUntimed, setAllUntimed] = useState(false);
  const timed   = instances.filter(i => i.start_time);
  // Open ones first. A long list of all-day habits used to push the whole
  // hour grid off the screen, so only the first few show until asked.
  const untimed = instances.filter(i => !i.start_time)
    .sort((a, b) => Number(!!a.completed || !!a.skipped) - Number(!!b.completed || !!b.skipped));
  const shownUntimed = allUntimed ? untimed : untimed.slice(0, UNTIMED_PREVIEW);
  const { start: hStart, end: hEnd } = hourRange(timed, { start: DAY_START, end: DAY_END });
  const hours = Array.from({ length: hEnd - hStart }, (_, i) => hStart + i);
  const boxes = layoutDay(timed, { minMinutes: MIN_BOX_MINUTES });
  const isToday = toISO(date) === toISO(new Date());
  const yOf = (mins) => (mins / 60 - hStart) * HOUR_H;

  // Open on now (today) or the first thing planned, not always 6am. Not
  // while there are all-day items still to do: those are the top of the
  // list, and opening past them hid a new account's first habit.
  const openUntimed = untimed.filter(i => !i.completed && !i.skipped).length;
  const scrollToStart = (gridTop) => {
    if (scrolled.current) return;
    scrolled.current = true;
    if (openUntimed > 0) return;
    const now = new Date();
    const target = isToday ? now.getHours() * 60 + now.getMinutes() : boxes[0]?.top;
    if (target == null) return;
    const y = Math.max(0, gridTop + yOf(target) - HOUR_H);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 0);
  };

  // Something added "any time" goes in up top, above wherever the view
  // already scrolled to. Saving a habit and seeing nothing change read as
  // the save not working (found 2026-10-01), so go back up to show it.
  const prevUntimed = useRef(untimed.length);
  useEffect(() => {
    if (untimed.length > prevUntimed.current) scrollRef.current?.scrollTo({ y: 0, animated: true });
    prevUntimed.current = untimed.length;
  }, [untimed.length]);

  const hh = (h, m) => `${String(h).padStart(2, '0')}:${m}`;

  return (
    <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: FAB_CLEARANCE }}>
      {/* Untimed items at top */}
      {untimed.length > 0 && (
        <View style={{ padding: s.lg, paddingBottom: s.sm, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>{isToday ? 'Any time today' : 'Any time'}</Text>
          {shownUntimed.map(inst => (
            <AgendaRow key={inst.id} instance={inst} onUpdate={onUpdate} onOpen={onOpen} c={c} t={t} s={s} r={r} />
          ))}
          {untimed.length > UNTIMED_PREVIEW && (
            <TouchableOpacity onPress={() => setAllUntimed(v => !v)} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: s.sm }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.teal }}>
                {allUntimed ? 'Show fewer' : `Show all ${untimed.length}`}
              </Text>
              <Ionicons name={allUntimed ? 'chevron-up' : 'chevron-down'} size={13} color={c.teal} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {timed.length === 0 && (
        <Text style={{ fontSize: t.xs, color: c.text3, textAlign: 'center', paddingTop: s.md }}>
          Tap a time below to plan something then.
        </Text>
      )}

      {/* Hour grid */}
      <View style={{ position: 'relative', paddingLeft: 56, paddingRight: s.lg, marginTop: s.md }}
        onLayout={(e) => scrollToStart(e.nativeEvent.layout.y)}>
        {hours.map(h => (
          <View key={h} style={{ height: HOUR_H, borderTopWidth: 0.5, borderTopColor: c.border }}>
            <Text style={{ position: 'absolute', left: -52, top: -8, fontSize: 11, color: c.text3, width: 44, textAlign: 'right' }}>
              {h % 12 || 12}{h < 12 || h === 24 ? 'am' : 'pm'}
            </Text>
            {/* Each half hour is its own "add here" button. */}
            {['00', '30'].map(m => (
              <TouchableOpacity key={m} onPress={() => onAddAt(hh(h, m))}
                accessibilityRole="button" accessibilityLabel={`Add something at ${fmt12(hh(h, m))}`}
                style={{ height: HOUR_H / 2, borderBottomWidth: m === '00' ? 0.5 : 0, borderBottomColor: c.border + '66', borderStyle: 'dashed' }} />
            ))}
          </View>
        ))}

        {/* Current time line, only on today's page. Drawn under the items so
            it doesn't read as a line struck through a title; the dot in the
            hour gutter still marks the time. */}
        {isToday && <CurrentTimeLine startHour={hStart} endHour={hEnd} />}

        {/* Timed items, laid out in columns where they overlap */}
        <View pointerEvents="box-none" onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          style={{ position: 'absolute', left: 56, right: s.lg, top: 0, bottom: 0 }}>
          {gridW > 0 && boxes.map(({ item: inst, top, bottom, col, cols }) => {
            const area = AREAS[inst.area] || AREAS.physical;
            const colW = gridW / cols;
            const height = Math.max(((bottom - top) / 60) * HOUR_H - 2, 24);
            const done = inst.completed, skipped = inst.skipped;
            return (
              <TouchableOpacity key={inst.id} onPress={() => onOpen(inst)}
                accessibilityRole="button" accessibilityLabel={`${inst.title}, ${timeRange(inst.start_time, inst.duration_minutes)}. Show details`}
                style={{ position: 'absolute', top: yOf(top) + 1, height, left: col * colW, width: colW - 3,
                         backgroundColor: c.bg1, borderRadius: r.sm, overflow: 'hidden',
                         borderWidth: 0.5, borderColor: area.color + '88', borderLeftWidth: 3, borderLeftColor: area.color,
                         opacity: skipped ? 0.45 : 1 }}>
                <View style={{ flex: 1, backgroundColor: area.color + (done ? '14' : '2a'), paddingHorizontal: 6, paddingVertical: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {done && <Ionicons name="checkmark-circle" size={12} color={area.color} />}
                    <Text numberOfLines={height >= 52 ? 2 : 1}
                      style={{ flex: 1, fontSize: 12, fontWeight: t.bold, color: done ? c.text3 : c.text1, textDecorationLine: done || skipped ? 'line-through' : 'none' }}>
                      {inst.title}
                    </Text>
                  </View>
                  {height >= 34 && (
                    <Text numberOfLines={1} style={{ fontSize: 11, color: c.text2 }}>
                      {timeRange(inst.start_time, inst.duration_minutes)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
}

function CurrentTimeLine({ startHour, endHour }) {
  const now   = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const y     = (hours - startHour) * HOUR_H;
  if (y < 0 || y > (endHour - startHour) * HOUR_H) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 50, right: 0, top: y - 5, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#e05858' }} />
      <View style={{ flex: 1, height: 1.5, backgroundColor: '#e05858' }} />
    </View>
  );
}
