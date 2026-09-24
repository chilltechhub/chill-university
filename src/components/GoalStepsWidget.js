// src/components/GoalStepsWidget.js
// Home's checklist for the goal in flight: every step, ticked or not, with
// the one to do next marked. The Compass card above shows only that next
// step; this is the "where am I in this?" view people kept going to the
// Compass screen for.
//
// Tapping a step that has a screen goes there. Tapping the tick box marks
// it done when it's a step you tick yourself (auto/signal steps tick
// themselves when the thing actually happens).
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { goToScreen } from '../logic/appRoutes';
import WidgetCard from './widgets/WidgetCard';
import { resumeFirstGoalGuide } from '../logic/useGuidedFirstGoal';
import { useTour } from '../../context/TourContext';

export default function GoalStepsWidget() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  const { activeObjective, toggleStep, loading } = useAccess();
  const { active: tourActive } = useTour();

  if (loading) return null;
  const live = activeObjective?.active;

  if (!live) {
    return (
      <WidgetCard
        title="Your steps"
        icon="list-outline"
        empty={{
          text: 'No goal running. Start one from the Compass card and its steps show up here.',
          cta: 'Open the Compass',
          onPress: () => navigation.navigate('Compass'),
        }}
      />
    );
  }

  const { objective, steps = [], done, total, nextStep } = activeObjective;

  return (
    <WidgetCard
      title="Your steps"
      icon="list-outline"
      accent={accent.primary}
      action={`${done}/${total}`}
      onAction={() => navigation.navigate('Compass')}
    >
      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>{objective.label}</Text>

      {steps.map((step) => {
        const isNext = step.id === nextStep?.id;
        // Same rule as the Compass card: an auto step (a counter) marks
        // itself and can't be ticked by hand, in either direction.
        const canTick = !step.locked;
        return (
          <View key={step.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 }}>
            <TouchableOpacity
              onPress={() => canTick && toggleStep(step.id)}
              disabled={!canTick}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!step.done, disabled: !canTick }}
              accessibilityLabel={step.label}
            >
              <Ionicons
                name={step.done ? 'checkmark-circle' : isNext ? 'ellipse-outline' : 'ellipse-outline'}
                size={20}
                color={step.done ? c.success : isNext ? accent.primary : c.text4}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: t.sm,
                color: step.done ? c.text3 : c.text1,
                fontWeight: isNext ? t.bold : t.regular,
                textDecorationLine: step.done ? 'line-through' : 'none',
                lineHeight: 19,
              }}>
                {step.label}
              </Text>
              {isNext && !!step.hint && (
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 16 }}>{step.hint}</Text>
              )}
            </View>
            {isNext && step.screen && (
              <TouchableOpacity
                onPress={() => goToScreen(navigation, step.screen, step.params)}
                style={{ borderWidth: 1, borderColor: accent.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>Open</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* The guide walks these same steps — one way back to it if it was
          sent away (src/logic/useGuidedFirstGoal.js). */}
      {objective.intro && !tourActive && (
        <TouchableOpacity
          onPress={resumeFirstGoalGuide}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s.sm }}
          accessibilityRole="button"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={accent.primary} />
          <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>Walk me through it</Text>
        </TouchableOpacity>
      )}
    </WidgetCard>
  );
}
