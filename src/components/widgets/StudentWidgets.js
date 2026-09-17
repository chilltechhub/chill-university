// src/components/widgets/StudentWidgets.js
//
// What a STUDENT profile gets on Home instead of the generic dashboard:
// today's scheduled study time, and how each subject is actually going.
//
// Both read real tables — agenda_instances for the blocks, subject_progress
// for the coursework. Neither invents a number when there isn't one.

import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { getInstances, AREAS } from '../../api/plannerService';
import WidgetCard, { StatRow, Bar } from './WidgetCard';

const todayStr = () => new Date().toISOString().slice(0, 10);

// The areas a study block plausibly falls under. Deliberately not every
// area — "today's study blocks" that included a gym session would be a
// worse answer than one that occasionally misses an oddly-filed block.
const STUDY_AREAS = ['mental', 'professional'];

// ─── Study Blocks ────────────────────────────────────────────────────────────

export function StudyBlocksWidget({ userId, onOpenPlanner }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const [blocks, setBlocks] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (!userId) { setBlocks([]); return; }
      try {
        const rows = await getInstances(userId, { date: todayStr() });
        if (alive) setBlocks((rows || []).filter(r => STUDY_AREAS.includes(r.area) && !r.skipped));
      } catch (e) {
        console.warn('studyBlocks', e?.message);
        if (alive) setBlocks([]);
      }
    })();
    return () => { alive = false; };
  }, [userId]));

  const done = (blocks || []).filter(b => b.completed).length;
  const minutes = (blocks || []).reduce(
    (n, b) => n + (b.duration_minutes || b.planner_components?.duration_minutes || 0), 0,
  );

  return (
    <WidgetCard
      title="Study blocks · today" icon="time-outline" accent={c.teal}
      action="Planner →" onAction={onOpenPlanner}
      loading={blocks === null}
      empty={blocks?.length === 0 ? {
        text: "Nothing scheduled for today. Block out some study time and it'll show here with the rest of your day.",
        cta: 'Schedule study time', onPress: onOpenPlanner,
      } : null}
    >
      <StatRow label="Done" value={`${done} of ${blocks?.length || 0}`} color={done === blocks?.length ? c.success : c.text1} />
      {minutes > 0 && <StatRow label="Scheduled" value={`${minutes} min`} />}
      <View style={{ marginTop: s.sm }}>
        {(blocks || []).slice(0, 4).map(b => {
          const def = AREAS[b.area] || { color: c.teal };
          return (
            <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
              <Ionicons
                name={b.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={15}
                color={b.completed ? c.success : def.color}
              />
              <Text
                style={{ fontSize: t.sm, color: b.completed ? c.text4 : c.text2, flex: 1, textDecorationLine: b.completed ? 'line-through' : 'none' }}
                numberOfLines={1}>
                {b.title}
              </Text>
              {b.start_time && <Text style={{ fontSize: t.xs, color: c.text4 }}>{String(b.start_time).slice(0, 5)}</Text>}
            </View>
          );
        })}
      </View>
    </WidgetCard>
  );
}

// ─── Class Progress ──────────────────────────────────────────────────────────
// subjectProgress comes from UserProgressContext, which already loads it
// alongside the profile (getUserProfile selects subject_progress(*)) — so
// this widget costs no extra query.

export function ClassProgressWidget({ subjectProgress, onOpenClasses }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const subjects = Object.values(subjectProgress || {})
    .filter(sp => (sp.xp || 0) > 0)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5);

  // Relative bars: without a defined "total XP per subject" anywhere in the
  // schema, the only honest scale is against the user's own best subject.
  const top = subjects[0]?.xp || 1;

  return (
    <WidgetCard
      title="Subjects" icon="ribbon-outline" accent={c.tech || c.teal}
      action="Academy →" onAction={onOpenClasses}
      empty={subjects.length === 0 ? {
        text: "No subject progress yet. Finish a lesson or a round of practice and each subject starts tracking here.",
        cta: 'Open Academy', onPress: onOpenClasses,
      } : null}
    >
      {subjects.map(sp => (
        <View key={sp.subject} style={{ marginBottom: s.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: t.sm, color: c.text2, textTransform: 'capitalize' }} numberOfLines={1}>
              {String(sp.subject).replace(/[_-]/g, ' ')}
            </Text>
            <Text style={{ fontSize: t.xs, color: c.text4 }}>
              {sp.xp} XP{sp.level ? ` · L${sp.level}` : ''}
            </Text>
          </View>
          <Bar pct={(sp.xp / top) * 100} color={c.tech || c.teal} />
        </View>
      ))}
      <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>
        Bars are relative to your strongest subject.
      </Text>
    </WidgetCard>
  );
}
