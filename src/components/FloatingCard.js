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
//
// With a keyboard up the card sits just above it rather than centring in
// what's left, which is what kept throwing a short sheet up near the status
// bar while the cursor was at the bottom of the screen.
import React, { useRef, useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Keyboard, Platform, ScrollView, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Gap between the bottom of the card and the top of the keyboard. Small on
// purpose: the point is that what you're typing and the thing you're typing
// into are near each other.
const KEYBOARD_GAP = 10;

export default function FloatingCard({ visible, onClose, children, c, width = '90%', maxWidth = 440, maxHeight = '82%' }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const start = useRef({ x: 0, y: 0 });

  // Where the keyboard is, tracked directly rather than through
  // KeyboardAvoidingView. With `padding` behaviour and a centred card, the
  // card re-centres in whatever space is LEFT, which on a phone throws it up
  // near the status bar — a long way from the field the cursor is in. Sitting
  // it just above the keyboard instead keeps the two together.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => setKbHeight(e?.endCoordinates?.height || 0);
    const onHide = () => setKbHeight(0);
    const subs = [Keyboard.addListener(showEvt, onShow), Keyboard.addListener(hideEvt, onHide)];
    return () => subs.forEach(sub => sub.remove());
  }, []);

  // Closing resets it: on Android the hide event can land after the modal is
  // already gone, leaving the next opening positioned for a keyboard that
  // isn't there.
  useEffect(() => { if (!visible) setKbHeight(0); }, [visible]);

  const screenH = Dimensions.get('window').height;
  const open = kbHeight > 0;
  // With the keyboard up the card gets whatever is left above it, less the
  // gap — so it can still scroll internally instead of being clipped.
  const cardMaxHeight = open
    ? Math.max(180, screenH - kbHeight - KEYBOARD_GAP * 2)
    : maxHeight;

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

      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: open ? 'flex-end' : 'center',
          paddingBottom: open ? kbHeight + KEYBOARD_GAP : 0,
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            {
              width, maxWidth, maxHeight: cardMaxHeight,
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
              content taller than the card (Quick Capture's type chips +
              textarea + tags, on a short device, or anything at all with
              the keyboard up) still reaches its Save button.

              flexShrink is what makes that true, and it is not optional: a
              ScrollView with no flex inside a maxHeight column sizes itself
              to its content, overflows, and is then CLIPPED by the card's
              `overflow: hidden`. The card looked right and simply would not
              scroll — the bottom of a long sheet was unreachable.

              A horizontal ScrollView nested inside this vertical one (the
              type chips row) is a normal, supported combination. */}
          <ScrollView
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
