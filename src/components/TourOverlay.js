// src/components/TourOverlay.js
// Renders the guided tour's dimmed backdrop + spotlight "hole" around the
// current step's target (from context/TourContext.js + TourSpot.js
// registrations) and the tooltip card with Back/Next/Skip. A single
// instance lives at the top of App.js so it can float above any screen.
//
// The "hole" is four opaque bands covering everything except the target
// rect (plus a little padding), rather than an SVG mask — simpler and
// robust at any target size/position with no extra math beyond clamping
// to the screen edges.
//
// Every band, plus a transparent absorber over the hole itself, captures
// touches (default pointerEvents, i.e. NOT 'none') — the highlighted
// element is only ever shown, never actually reachable, so the real
// screen underneath can't be tapped out from under an active tour. Only
// the tooltip's own Back/Next/Skip are live.
//
// The tooltip card's placement is clamped to the screen on every axis: it
// picks below/above the target (or a safe centered band with no target),
// then caps itself with `maxHeight` and lets only the body text scroll
// internally — the step label, title, and Back/Next/Skip footer are never
// inside that scroll area, so they can never end up pushed off-screen no
// matter how long a step's body copy runs (this is what was happening on
// the Training step: a tall target left too little room below it, and the
// uncapped card ran its Next button past the bottom edge, stranding
// whoever hit it).

import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';

const PAD = 8;
const SCRIM = 'rgba(0,0,0,0.72)';
const MARGIN_V = 24;
const MIN_CARD = 150;
const TAB_BAR_H = Platform.OS === 'ios' ? 66 : 52;
// Every non-tab screen sits below the persistent global TopBar (App.js) —
// its own back chevron lands a bit further down still, in whatever header
// that screen renders. Not pixel-exact (headers pad this differently
// screen to screen) but close enough for a visual "it's up here" cue.
const TOPBAR_H = 60;

export default function TourOverlay() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { active, currentStep, stepIndex, steps, isLastStep, targets, nextStep, backStep, skipTour } = useTour();
  const insets = useSafeAreaInsets();

  if (!active || !currentStep) return null;

  const { width: SW, height: SH } = Dimensions.get('window');

  // A real registered TourSpot, or — for the screen-tutorial's synthetic
  // "Navigation" step — a made-up rect over the tab bar / back button, so
  // it can still be spotlighted without either one needing to be a real
  // TourSpot itself.
  let target = currentStep.id ? targets[currentStep.id] : null;
  if (!target && currentStep.navHint === 'tabbar') {
    target = { x: 0, y: SH - TAB_BAR_H, width: SW, height: TAB_BAR_H };
  } else if (!target && currentStep.navHint === 'back') {
    target = { x: 4, y: insets.top + TOPBAR_H + 6, width: 70, height: 52 };
  }

  // Bands covering everything except the (padded) target rect. Null when
  // there's no target yet — e.g. the welcome/closing cards, or a step
  // whose screen hasn't finished registering its TourSpot.
  // A registered target can legitimately sit outside the current viewport —
  // TourSpot now scrolls its own target into view on web before this reads
  // it, but native has no such hook, and there's a real gap between "just
  // navigated to this screen" and that scroll landing. Treat anything left
  // off-screen (rather than let w/h go negative and silently draw nothing)
  // the same as "no target yet": full dim, no broken hole.
  let bands = null;
  let holeBox = null;
  if (target && target.x < SW && target.y < SH && target.x + target.width > 0 && target.y + target.height > 0) {
    const x = Math.max(0, target.x - PAD);
    const y = Math.max(0, target.y - PAD);
    const w = Math.min(SW - x, target.width + PAD * 2);
    const h = Math.min(SH - y, target.height + PAD * 2);
    holeBox = { x, y, w, h };
    bands = [
      { left: 0, top: 0, right: 0, height: y },                          // above
      { left: 0, top: y + h, right: 0, bottom: 0 },                      // below
      { left: 0, top: y, width: x, height: h },                          // left
      { left: x + w, top: y, right: 0, height: h },                      // right
    ];
  }

  // Tooltip goes below the target if there's room, above it if not, and
  // falls back to a safe top/bottom-margined band (scrollable if needed)
  // when neither side has enough — never a bare `top` with no ceiling on
  // how tall the card is allowed to grow.
  const cardStyle = { position: 'absolute', left: s.lg, right: s.lg };
  if (holeBox) {
    const spaceBelow = SH - MARGIN_V - (holeBox.y + holeBox.h + 16);
    const spaceAbove = holeBox.y - 16 - MARGIN_V;
    if (spaceBelow >= MIN_CARD) {
      cardStyle.top = holeBox.y + holeBox.h + 16;
      cardStyle.maxHeight = spaceBelow;
    } else if (spaceAbove >= MIN_CARD) {
      cardStyle.top = Math.max(MARGIN_V, holeBox.y - 16 - spaceAbove);
      cardStyle.maxHeight = spaceAbove;
    } else {
      cardStyle.top = MARGIN_V;
      cardStyle.maxHeight = SH - MARGIN_V * 2;
    }
  } else {
    const preferredTop = SH / 2 - 100;
    cardStyle.top = Math.max(MARGIN_V, Math.min(preferredTop, SH - MARGIN_V - MIN_CARD));
    cardStyle.maxHeight = SH - cardStyle.top - MARGIN_V;
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={skipTour}>
      <View style={StyleSheet.absoluteFill}>
        {bands
          ? bands.map((b, i) => <View key={i} style={[styles.band, b]} />)
          : <View style={[styles.band, { top: 0, left: 0, right: 0, bottom: 0 }]} />}

        {holeBox && (
          <>
            {/* Transparent — same job as a dim band, but see-through so the
                highlighted element still reads as "this one" without
                actually being reachable. */}
            <View style={{ position: 'absolute', left: holeBox.x, top: holeBox.y, width: holeBox.w, height: holeBox.h }} />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', left: holeBox.x, top: holeBox.y, width: holeBox.w, height: holeBox.h,
                borderRadius: r.md, borderWidth: 2, borderColor: c.gold,
              }}
            />
          </>
        )}

        <View style={[cardStyle, { backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden' }]}>
          <View style={{ paddingHorizontal: s.lg, paddingTop: s.lg, flexShrink: 0 }}>
            <Text style={{ fontSize: 11, color: c.text4, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
              STEP {stepIndex + 1} OF {steps.length}
            </Text>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{currentStep.title}</Text>
          </View>

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: s.lg, paddingTop: 6, paddingBottom: s.md }}>
            <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{currentStep.body}</Text>
          </ScrollView>

          <View style={{
            flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: s.lg, paddingBottom: s.lg, paddingTop: s.sm,
          }}>
            <TouchableOpacity onPress={skipTour} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 12, color: c.text4, fontWeight: '700' }}>Skip</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              {stepIndex > 0 && (
                <TouchableOpacity onPress={backStep} style={{ paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, borderWidth: 1, borderColor: c.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: c.text3 }}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={nextStep} style={{ paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, backgroundColor: c.teal }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>{isLastStep ? 'Done' : 'Next'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', backgroundColor: SCRIM },
});
