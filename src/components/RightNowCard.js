// src/components/RightNowCard.js
// Home's "Right now": the one thing that matters at this minute, picked
// from today's schedule and your quiet hours (src/logic/rightNow.js). It
// re-picks every minute and when the app comes back to the front, so at
// 9:55 it says "Next · in 5 min" and at 10:00 "Now". Nothing worth saying
// (no plans, nothing late, empty desk) → nothing drawn.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { pickRightNow } from '../logic/rightNow';
import { getPrefs } from '../logic/noticeStore';
import useAppActive from '../logic/useAppActive';

const ICON = { rest: 'moon-outline', now: 'radio-button-on', soon: 'alarm-outline', late: 'alert-circle-outline', today: 'today-outline', desk: 'albums-outline' };

// The pick itself, shared with Home's Calm view (CalmHome.js), which shows
// the same thing as its headline.
export function useRightNow(activities = [], desk = []) {
  const [now, setNow] = useState(() => new Date());
  const [quiet, setQuiet] = useState(null);
  const active = useAppActive();

  useEffect(() => { getPrefs().then(p => setQuiet(p?.quiet || null)).catch(() => {}); }, []);
  useEffect(() => {
    if (!active) return undefined;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, [active]);

  return useMemo(() => pickRightNow({
    items: activities.map(a => ({
      id: a.id, title: a.title, time: a.time || null, duration: a.raw?.duration_minutes || null,
      late: a._src === 'due' && /late/i.test(a.notes || ''), due: a._src === 'due' || a._src === 'task',
      src: a._src, ref: a,
    })),
    desk: desk.map(d => ({ id: d.id, title: d.title, ref: d })),
    now, quiet,
  }), [activities, desk, now, quiet]);
}

export default function RightNowCard({ activities = [], desk = [], onOpen, onDone, onFocus, ui = {} }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const pick = useRightNow(activities, desk);

  if (!pick) return null;
  const tone = pick.kind === 'late' ? c.error : pick.kind === 'rest' ? c.purple : c.teal;
  const ref = pick.item?.ref;
  const canDone = ref && (ref._src === 'planner' || ref._src === 'task');

  return (
    <TouchableOpacity activeOpacity={0.85} disabled={!ref} onPress={() => ref && onOpen?.(ref, pick.kind)}
      accessibilityRole="button" accessibilityLabel={`Right now. ${pick.label}. ${pick.title}`}
      style={{ marginHorizontal: s.lg, marginBottom: s.md, padding: s.md, borderRadius: ui.cardRadius ?? 12,
        backgroundColor: c.bg1, borderWidth: ui.borderWidth ?? 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: tone,
        flexDirection: 'row', alignItems: 'center', gap: s.md }}>
      <Ionicons name={ICON[pick.kind]} size={20} color={tone} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: t.bold, color: tone }}>{pick.label}</Text>
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} numberOfLines={2}>{pick.title}</Text>
      </View>
      {canDone && (
        <TouchableOpacity onPress={() => onDone?.(ref)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Mark ${pick.title} done`}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: tone }}>
          <Text style={{ fontSize: 12, fontWeight: t.bold, color: tone }}>Done</Text>
        </TouchableOpacity>
      )}
      {pick.kind !== 'rest' && (
        <TouchableOpacity onPress={() => onFocus?.(ref || { title: pick.title }, pick.kind)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Focus on ${pick.title}`}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: tone }}>
          <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.onFill }}>Focus</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
