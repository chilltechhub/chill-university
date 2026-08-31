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

import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';

const PAD = 8;
const SCRIM = 'rgba(0,0,0,0.72)';

export default function TourOverlay() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { active, currentStep, stepIndex, steps, isLastStep, targets, nextStep, backStep, skipTour } = useTour();

  if (!active || !currentStep) return null;

  const { width: SW, height: SH } = Dimensions.get('window');
  const target = currentStep.id ? targets[currentStep.id] : null;

  // Bands covering everything except the (padded) target rect. Null when
  // there's no target yet — e.g. the welcome/closing cards, or a step
  // whose screen hasn't finished registering its TourSpot.
  let bands = null;
  let holeBox = null;
  if (target) {
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

  // Tooltip goes below the target if there's room, otherwise above it;
  // dead-centered when there's no target to anchor to.
  const cardStyle = { position: 'absolute', left: s.lg, right: s.lg };
  if (holeBox) {
    const belowY = holeBox.y + holeBox.h + 16;
    if (belowY + 180 < SH) cardStyle.top = belowY;
    else cardStyle.top = Math.max(60, holeBox.y - 196);
  } else {
    cardStyle.top = SH / 2 - 100;
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

        <View style={[cardStyle, { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border }]}>
          <Text style={{ fontSize: 11, color: c.text4, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
            STEP {stepIndex + 1} OF {steps.length}
          </Text>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: 6 }}>{currentStep.title}</Text>
          <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginBottom: s.lg }}>{currentStep.body}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
