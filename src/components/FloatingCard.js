// src/components/FloatingCard.js
// A small, draggable floating popup — for quick-create sheets (New Note,
// New Project, ...) that benefit from staying visible over the screen
// instead of a full-width bottom sheet blocking it. Visually modeled on
// CalendarModal's centered "notebook" popup (a card, not full-bleed), with
// one thing nothing in this app had yet: you can drag it wherever you want
// while it's open, so you can see what you're adding a note *about*.
//
// Reuses WidgetBoard.js's exact gesture split — the pan gesture runs on the
// JS thread (`.runOnJS(true)`) so the reorder-style math stays plain,
// debuggable JS, while the actual on-screen motion is still driven by
// Reanimated shared values, so dragging stays smooth. Same reasoning here:
// nothing about repositioning a card needs worklet semantics.
//
// Only the handle bar starts a drag — not the whole card — so scrolling a
// long note or tapping a button inside it never gets mistaken for a
// reposition.
import React, { useRef, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function FloatingCard({ visible, onClose, children, c, width = '90%', maxWidth = 440, maxHeight = '82%' }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const start = useRef({ x: 0, y: 0 });

  // Re-center every time it opens — a card left in a corner from last time
  // would otherwise reopen there too, which reads as broken, not helpful.
  useEffect(() => {
    if (visible) { translateX.value = 0; translateY.value = 0; }
  }, [visible]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => { start.current = { x: translateX.value, y: translateY.value }; })
    .onUpdate((e) => {
      translateX.value = start.current.x + e.translationX;
      translateY.value = start.current.y + e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value, { damping: 22, stiffness: 220 });
      translateY.value = withSpring(translateY.value, { damping: 22, stiffness: 220 });
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Light backdrop, deliberately — enough to show this has focus,
          not so much the screen behind it disappears. Tapping it still
          closes, same as every other popup in the app. */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' }} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            {
              width, maxWidth, maxHeight,
              backgroundColor: c.bg1, borderRadius: 18, overflow: 'hidden',
              borderWidth: 0.5, borderColor: c.border,
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 20,
            },
            aStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border }} />
            </View>
          </GestureDetector>
          {/* Scrolls internally rather than clipping against maxHeight —
              content taller than 82% of the screen (Quick Capture's type
              chips + textarea + tags, on a short device) still reaches its
              Save button instead of getting cut off. A horizontal
              ScrollView nested inside this vertical one (the type chips
              row) is a normal, supported combination. */}
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
