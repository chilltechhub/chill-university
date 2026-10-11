// src/components/QuickToast.js
// A one-line "done" note that fades in under the top bar and goes away on
// its own. For confirmations that need no answer ("Captured", "Note saved").
//
// Those were Alert.alert pop-ups: one more tap to get rid of, and on web
// (src/logic/webAlertShim.js maps Alert onto window.alert) a blocking
// browser dialog that freezes the page until it's dismissed, which in an
// embedded preview that never shows the dialog looks exactly like the app
// hanging (2026-10-10: "froze after I scheduled...").
//
// showQuickToast(text) from anywhere; <QuickToast /> is mounted once, in App.js.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const HOLD_MS = 2200;
const listeners = new Set();

export function showQuickToast(text) {
  if (!text) return;
  listeners.forEach(fn => fn(text));
}

export default function QuickToast() {
  const { colors: c, typography: t } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(null);
  const fade = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  useEffect(() => {
    const show = (next) => {
      setText(next);
      clearTimeout(timer.current);
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true })
          .start(({ finished }) => { if (finished) setText(null); });
      }, HOLD_MS);
    };
    listeners.add(show);
    return () => { listeners.delete(show); clearTimeout(timer.current); };
  }, [fade]);

  if (!text) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.wrap,
        {
          top: insets.top + 64,
          opacity: fade,
          transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          backgroundColor: c.bg1, borderColor: c.border,
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={16} color={c.success || c.teal} />
      <Text style={{ fontSize: t.sm, color: c.text1, flexShrink: 1 }}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', alignSelf: 'center', maxWidth: '90%',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 0.5,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});
