// src/components/TodayReview.js
// Home's "Today's review": about a minute, only when something is due.
//   · one of your Vault takeaways, on its spaced schedule (RememberThis),
//     unless Today's Wisdom is on Home and already shows it
//   · game questions you missed, back after 1 / 3 / 7 days
//     (src/logic/questionRotation.js); they come up in your next round
// Nothing due → nothing drawn. It sits under the Home cards, so it never
// competes with the goal card for the one thing to do.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import RememberThis from './RememberThis';
import { getTakeawayRows, pickRemember } from '../api/knowledgeUse';
import { reviewDueCount, onReviewsChange } from '../logic/questionRotation';
import { goToScreen } from '../logic/appRoutes';

export default function TodayReview({ userId, navigation, skipTakeaway = false, ui = {} }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const [takeaway, setTakeaway] = useState(false);
  const [questions, setQuestions] = useState(0);

  useFocusEffect(useCallback(() => {
    let live = true;
    setQuestions(reviewDueCount());
    if (skipTakeaway || !userId) { setTakeaway(false); return undefined; }
    getTakeawayRows(userId)
      .then(rows => { if (live) setTakeaway(!!pickRemember(rows)); })
      .catch(() => { if (live) setTakeaway(false); });
    return () => { live = false; };
  }, [userId, skipTakeaway]));
  useEffect(() => onReviewsChange(() => setQuestions(reviewDueCount())), []);

  if (!takeaway && !questions) return null;

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius ?? 12, padding: s.lg, marginHorizontal: s.lg, marginTop: s.md,
      borderLeftWidth: 3, borderLeftColor: c.gold, borderWidth: ui.borderWidth ?? 0.5, borderColor: c.border, gap: s.md }}>
      <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.gold, ...(ui.eyebrow || {}) }}>Today's review · about a minute</Text>
      {takeaway && <RememberThis userId={userId} navigation={navigation} ui={ui}>{null}</RememberThis>}
      {questions > 0 && (
        <TouchableOpacity onPress={() => goToScreen(navigation, 'Training')} accessibilityRole="button"
          accessibilityLabel={`${questions} missed question${questions === 1 ? '' : 's'} due. Play a round.`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
          <Ionicons name="refresh-circle-outline" size={20} color={c.teal} />
          <Text style={{ flex: 1, fontSize: t.sm, color: c.text2 }}>
            <Text style={{ fontWeight: t.bold, color: c.text1 }}>{questions} question{questions === 1 ? '' : 's'}</Text> you missed {questions === 1 ? 'is' : 'are'} due. They come back in your next round.
          </Text>
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.teal }}>Play</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
