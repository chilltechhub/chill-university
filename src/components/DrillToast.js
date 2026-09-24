// src/components/DrillToast.js
// "Drill done", the moment it happens, with what comes next.
//
// Finishing a daily drill used to be silent: the count moved somewhere you
// weren't looking (if it moved at all, see src/logic/drills.js). This shows
// at the top of the screen, over a game if that's where it happened, and
// never blocks anything: it goes away on its own, or on a tap. The "next"
// line comes from the same plan the drills list and Home widget use
// (src/logic/useDrillPlan.js), so all three always point at the same drill.

import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import useDrillPlan from '../logic/useDrillPlan';

const SHOW_MS = 5000;

export default function DrillToast() {
  const { colors: c, typography: t } = useTheme();
  const insets = useSafeAreaInsets();
  const { drillEvents, dismissDrillEvent } = useUserProgress();
  const { next, doneCount, total } = useDrillPlan();
  const event = drillEvents?.[0];
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) return undefined;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => dismissDrillEvent());
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event) return null;

  const pts = event.reward?.points || 0;
  const nextLine = next
    ? `Next: ${next.title}. ${next.how}`
    : total > 0 && doneCount >= total
      ? "That's all of today's drills. New ones at midnight."
      : null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]} pointerEvents="box-none">
      <Animated.View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, opacity: fade }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={dismissDrillEvent}
          accessibilityRole="alert"
          style={{
            backgroundColor: c.bg1, borderRadius: 14, padding: 12,
            borderWidth: 1, borderColor: c.gold, flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
          }}
        >
          <Text style={{ fontSize: 20 }}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text1 }}>
              Drill done: {event.title}{pts ? `  +${pts} pts` : ''}
            </Text>
            {!!nextLine && (
              <Text style={{ fontSize: t.xs, color: c.text2, marginTop: 2, lineHeight: 16 }}>{nextLine}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
