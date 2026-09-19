// src/components/widgets/QuestWidget.js
//
// The next quest (src/data/quests.js) for this account type, on Home.
//
// Quests live in Classes, but not every type has Classes on its map early
// (Personal meets it at "Every open tool"). The quests themselves are the
// learn-how-to-learn starting point for everyone, so this card brings the
// next one to Home once the stage that adds it opens (experienceStages.js).
// Its one number, "2 of 4 done", is counted from finished quests, not
// guessed.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { questsInOrder } from '../../data/quests';
import { useQuestProgress, QUEST_STEPS } from '../../logic/questProgress';
import WidgetCard, { Bar } from './WidgetCard';

export default function QuestWidget({ type, onOpenQuest, onOpenAll }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { byId, finished, ready } = useQuestProgress();
  const quests = questsInOrder(type);
  const doneCount = quests.filter(q => finished.has(q.id)).length;

  // A quest already started comes before a fresh one.
  const open = quests.filter(q => !finished.has(q.id));
  const next = open.find(q => byId[q.id]?.step && byId[q.id].step !== 'spark') || open[0];
  const stepLabel = next && byId[next.id]?.step
    ? QUEST_STEPS.find(st => st.key === byId[next.id].step)?.label
    : null;

  return (
    <WidgetCard
      title="Quests" icon="compass-outline" accent={next?.color || c.teal}
      action="All quests →" onAction={onOpenAll}
      loading={!ready}
    >
      {next ? (
        <TouchableOpacity onPress={() => onOpenQuest(next.id)} activeOpacity={0.85} accessibilityRole="button">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
            <View style={{ width: 40, height: 40, borderRadius: r.md, backgroundColor: next.color + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={next.icon} size={20} color={next.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} numberOfLines={1}>{next.title}</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 1 }} numberOfLines={1}>
                {stepLabel && stepLabel !== 'The idea' ? `Up next: ${stepLabel}` : `${next.minutes} min · ${next.tagline}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.text4} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="ribbon-outline" size={18} color={c.success} />
          <Text style={{ fontSize: t.sm, color: c.text2, flex: 1 }}>Every quest done. More are on the way.</Text>
        </View>
      )}
      <View style={{ marginTop: s.md }}>
        <Text style={{ fontSize: 11, color: c.text4, marginBottom: 4 }}>{doneCount} of {quests.length} done</Text>
        <Bar pct={quests.length ? (doneCount / quests.length) * 100 : 0} color={next?.color || c.success} />
      </View>
    </WidgetCard>
  );
}
