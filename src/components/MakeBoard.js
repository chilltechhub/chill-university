// src/components/MakeBoard.js
// The Make board (docs/shake-up-plan-2026-10-21.md §4.3, P6): your work in
// four columns, To do · Doing · Handed in · Shown. On a phone the columns
// are tabs, each with its count; tap a card to open its unit. Each card
// (P9, the visual kit) shows a thumbnail of the work on its path's colour,
// its status in words and its aim-for date, never red.
//
// To do also holds the unit you're on, before you've touched its work
// (a deliverable is only saved once it's started).

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import useDeliverables from '../logic/useDeliverables';
import { UNIT_BY_ID } from '../data/units';
import { deliverableForUnit } from '../api/deliverableService';
import { BOARD, STATUS_LABEL, boardOf, statusLabel, aimForLabel, feedbackLine } from '../logic/deliverables';
import { goToScreen } from '../logic/appRoutes';
import { todayStr } from '../logic/dateUtils';
import TourSpot from './TourSpot';
import RichText from './RichText';
import WorkThumb from './WorkThumb';
import { Segmented, StatusChip, DueChip, Tap, pathLook } from '../ui';

const EMPTY = {
  todo: 'Nothing waiting. Pick a unit on **My path**.',
  doing: 'Nothing on the go.',
  handed: 'What you hand in lands here.',
  shown: 'Show your work and it lands here, and on your Showcase.',
};

export default function MakeBoard() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { activeObjectiveId } = useAccess();
  const { list, ready } = useDeliverables();

  const board = useMemo(() => {
    const active = UNIT_BY_ID[activeObjectiveId];
    const all = active && !list.some(d => d.unitKey === active.id) ? [deliverableForUnit(list, active.id), ...list] : list;
    return boardOf(all);
  }, [list, activeObjectiveId]);
  const firstFull = BOARD.find(k => k !== 'todo' && board[k].length) || 'todo';
  const [col, setCol] = useState(null);
  const open = col || (board.doing.length ? 'doing' : board.todo.length ? 'todo' : firstFull);
  if (!ready) return null;

  return (
    <TourSpot id="make-board" style={{ marginHorizontal: s.lg }}>
      <View style={{ marginBottom: s.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: s.sm }}>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">Your work</Text>
          <TouchableOpacity onPress={() => goToScreen(navigation, 'PathScreen')} accessibilityRole="button" accessibilityLabel="My path">
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>My path →</Text>
          </TouchableOpacity>
        </View>
        <Segmented style={{ marginBottom: s.sm }} value={open} onChange={setCol}
          options={BOARD.map(k => ({ key: k, label: STATUS_LABEL[k], count: board[k].length }))} />
        {board[open].length ? board[open].slice(0, 6).map(d => {
          const unit = UNIT_BY_ID[d.unitKey];
          const aim = aimForLabel(d, todayStr());
          const look = pathLook(c, unit?.path);
          return (
            <Tap key={d.id} onPress={() => goToScreen(navigation, 'UnitScreen', { unitId: d.unitKey })}
              a11y={`${d.title}. ${statusLabel(d)}${aim ? `. ${aim}` : ''}${feedbackLine(d) ? `. ${feedbackLine(d)}` : ''}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, marginBottom: 6, borderRadius: r.lg, backgroundColor: c.bg1,
                borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: look.color }}>
              <WorkThumb deliverable={d} unit={unit} size={52} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }} numberOfLines={1}>{d.title}</Text>
                <Text style={{ fontSize: t.xs, color: c.text3 }} numberOfLines={1}>{[unit?.label !== d.title ? unit?.label : null, feedbackLine(d)].filter(Boolean).join(' · ') || (unit?.path === 'ground' ? 'Ground fix' : `Unit ${unit?.n || ''}`)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <StatusChip status={d.status} label={statusLabel(d)} />
                  <DueChip label={aim} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={15} color={c.text3} />
            </Tap>
          );
        }) : (
          <RichText style={{ fontSize: t.sm, color: c.text3, paddingVertical: s.sm }} boldStyle={{ color: c.text2 }}>{EMPTY[open]}</RichText>
        )}
      </View>
    </TourSpot>
  );
}
