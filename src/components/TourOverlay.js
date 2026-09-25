// src/components/TourOverlay.js
// The guide, the speech bubble, and the spotlight.
//
// ── What this used to be, and why it changed ────────────────────────────────
// A bordered tooltip card with a step counter, a title, a scrolling body and
// a button row — a text box that happened to have a small avatar bolted into
// its header. It read as a dialog, not as someone showing you around. The
// card chrome is gone: what's left is the character standing on the screen
// with a speech bubble coming off them.
//
// The spotlight was four opaque bands leaving a rectangular gap, plus a hard
// rectangular border. Everything got boxed the same way regardless of its
// real shape, so a pill-shaped chip or a circular button read as "there is a
// rectangle near this thing". It's now an SVG mask punched with the target's
// OWN corner radius (registered by TourSpot), stroked and glowed on the same
// geometry — a chip lights up as a pill, the FAB as a circle, a card as a
// rounded card.
//
// ── How the layers stack ────────────────────────────────────────────────────
// This is NOT a <Modal>, and that matters. A Modal renders in its own layer
// above the app, so the spotlight hole is only ever a picture of a hole —
// touches inside it are swallowed by the modal and never reach the button
// underneath. `passthrough` was dead on arrival while this was a Modal.
//
// So: a plain absolutely-positioned overlay with pointerEvents="box-none" at
// the root, letting explicit children decide what blocks. The SVG is purely
// visual (pointerEvents="none"). Four transparent Views absorb touches
// around the hole, plus one over the hole itself so a normal step's
// highlighted element is shown but not reachable. A `passthrough: true` step
// omits that last one, and the tap falls through to the real control.
//
// TourOverlay is mounted outside the SafeAreaView but inside
// NavigationContainer (App.js), so it still paints over every screen and
// still covers the status-bar area. What a Modal did give us for free was
// the Android hardware-back handler — re-added below.
//
// The guide block's placement is constraint-solved rather than fixed: it
// sits opposite the target (bottom of the screen for a target up top, top of
// the screen for one down low) so it can never cover the thing it's pointing
// at, and the bubble body scrolls internally while the controls never do — a
// tall target on Training used to push Next off the bottom edge.

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Dimensions, ScrollView, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, Mask, Rect, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { getGuide } from '../data/guides';
import PlayerCharacter from './PlayerCharacter';
import { optionOrder } from '../logic/optionOrder';

const PAD = 10;
const SCRIM = 'rgba(0,0,0,0.72)';
const MARGIN_V = 20;
const GUIDE_SIZE = 92;
const BUBBLE_MIN = 132;      // smallest the bubble is allowed to get
const TAIL_W = 18;
const TAIL_H = 12;
const TAB_BAR_H = Platform.OS === 'ios' ? 66 : 52;

export default function TourOverlay() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const {
    active, currentStep, stepIndex, steps, isLastStep, targets,
    nextStep, backStep, skipTour, quizAnswer, answerQuiz,
  } = useTour();
  const { activeType } = useProfiles();
  const insets = useSafeAreaInsets();
  const guide = getGuide(activeType);

  // Was Modal's onRequestClose. Hardware back should close the tour, not
  // navigate the screen out from under it.
  useEffect(() => {
    if (!active || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { skipTour(); return true; });
    return () => sub.remove();
  }, [active, skipTour]);

  if (!active || !currentStep) return null;

  const { width: SW, height: SH } = Dimensions.get('window');

  // A real registered TourSpot, or — for the Home walkthrough's synthetic
  // tab-bar step — a made-up rect over the tab bar, so it can be spotlighted
  // without the bar itself needing to be a TourSpot.
  //
  // The 'back' navHint that used to live here is gone. It was appended to
  // every non-tab screen's tutorial and drew a guessed rectangle in the
  // top-left whether or not that screen had a back button there — the
  // "highlights the back button for no reason" problem. Navigation is taught
  // once, on Home, against the real tab bar.
  let target = currentStep.id ? targets[currentStep.id] : null;
  if (!target && currentStep.navHint === 'tabbar') {
    target = { x: 0, y: SH - TAB_BAR_H, width: SW, height: TAB_BAR_H, radius: 0 };
  }

  // A registered target can legitimately sit outside the viewport (TourSpot
  // scrolls it into view on web, but there's a gap before that lands, and
  // native has no such hook). Treat an off-screen rect as "no target yet":
  // full dim, no broken hole — rather than letting w/h go negative and
  // silently drawing nothing.
  let hole = null;
  if (target && target.x < SW && target.y < SH
      && target.x + target.width > 0 && target.y + target.height > 0) {
    const x = Math.max(0, target.x - PAD);
    const y = Math.max(0, target.y - PAD);
    const w = Math.min(SW - x, target.width + PAD * 2);
    const h = Math.min(SH - y, target.height + PAD * 2);
    // The target's own corner radius, grown by the padding so the outline
    // stays concentric with the real element instead of hugging tighter at
    // the corners. Clamped to half the short side, which is what turns a
    // pill or a circular button into a real pill or circle.
    const rawR = (target.radius ?? r.md) + PAD;
    const radius = Math.max(0, Math.min(rawR, Math.min(w, h) / 2));
    hole = { x, y, w, h, radius };
  }

  // ── Where the guide stands ──────────────────────────────────────────────
  // On whichever side of the target has more room, so they never stand in
  // front of what they're pointing at. This used to be "opposite the
  // target's centre", which for a tall card just below the middle (Home's
  // stage card) put the bubble in a strip two lines high above it, with
  // more room going spare below. No target puts them at the bottom.
  //
  // Standing room at the bottom stops short of the tab bar. Without this the
  // character's feet overlap a dimmed tab bar, which reads as a layering
  // mistake rather than as someone standing on the screen.
  const bottomInset = insets.bottom + TAB_BAR_H + MARGIN_V;
  const roomAbove = hole ? (hole.y - 16) - (insets.top + MARGIN_V) : 0;
  const roomBelow = (SH - bottomInset) - (hole ? hole.y + hole.h + 16 : SH * 0.42);
  // `placement: 'top'` pins a step up top whatever the target: a note shown
  // inside a game, where the bottom half is the answers.
  const atTop = currentStep.placement === 'top' || (hole ? roomAbove > roomBelow : false);
  const available = atTop ? (hole ? roomAbove : SH * 0.5) : roomBelow;
  // Tight on both sides, or a non-blocking note sitting over live content:
  // a smaller guide, so the words get the room and less of the screen is
  // covered.
  const guideSize = currentStep.nonBlocking || available < BUBBLE_MIN + GUIDE_SIZE + TAIL_H + 40 ? 48 : GUIDE_SIZE;

  const blockStyle = {
    position: 'absolute',
    left: s.lg,
    right: s.lg,
    // Cap the whole block (bubble + character) so the controls can't be
    // pushed off-screen by long copy; the bubble body scrolls instead.
    maxHeight: Math.max(BUBBLE_MIN + guideSize + TAIL_H, available),
    ...(atTop
      ? { top: insets.top + MARGIN_V }
      : { bottom: bottomInset }),
  };

  // Touch absorbers: everything except the hole. A passthrough step leaves
  // the hole itself live so the highlighted control can actually be pressed.
  // A `nonBlocking` step is a note, not a lesson: no dim, nothing absorbed,
  // so the screen under it stays fully usable (the guide saying "add a note
  // if you like" while the note box is right there to type in).
  const blocking = !currentStep.nonBlocking;
  const absorbers = !blocking ? [] : hole
    ? [
        { left: 0, top: 0, right: 0, height: hole.y },
        { left: 0, top: hole.y + hole.h, right: 0, bottom: 0 },
        { left: 0, top: hole.y, width: hole.x, height: hole.h },
        { left: hole.x + hole.w, top: hole.y, right: 0, height: hole.h },
      ]
    : [{ left: 0, top: 0, right: 0, bottom: 0 }];

  // Bubble tail — a small triangle on the underside of the bubble, sitting
  // above the character's head so the speech reads as coming from them.
  const tailLeft = guideSize / 2 - TAIL_W / 2;
  const tailPath = 'M0,0 L' + TAIL_W + ',0 L' + (TAIL_W / 2) + ',' + TAIL_H + ' Z';

  return (
    // box-none: this container never eats a touch itself — only the absorber
    // children below do, which is what leaves the hole live for passthrough.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* ── Visual layer: dim + shaped hole + glow. No touch handling. ── */}
        {blocking && (
        <Svg width={SW} height={SH} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Mask id="tour-hole">
              <Rect x="0" y="0" width={SW} height={SH} fill="#fff" />
              {hole && (
                <Rect
                  x={hole.x} y={hole.y} width={hole.w} height={hole.h}
                  rx={hole.radius} ry={hole.radius} fill="#000"
                />
              )}
            </Mask>
          </Defs>

          <Rect x="0" y="0" width={SW} height={SH} fill={SCRIM} mask="url(#tour-hole)" />

          {hole && (
            <>
              {/* Soft outer glow, then the crisp edge — same geometry, so the
                  emphasis traces the feature rather than boxing it. */}
              <Rect
                x={hole.x - 3} y={hole.y - 3} width={hole.w + 6} height={hole.h + 6}
                rx={hole.radius + 3} ry={hole.radius + 3}
                fill="none" stroke={c.gold} strokeWidth={6} opacity={0.18}
              />
              <Rect
                x={hole.x} y={hole.y} width={hole.w} height={hole.h}
                rx={hole.radius} ry={hole.radius}
                fill="none" stroke={c.gold} strokeWidth={2} opacity={0.95}
              />
            </>
          )}
        </Svg>
        )}

        {/* ── Touch layer ── */}
        {absorbers.map((a, i) => <View key={i} style={[styles.absorb, a]} />)}
        {blocking && hole && !currentStep.passthrough && (
          <View style={{ position: 'absolute', left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />
        )}

        {/* ── The guide ── */}
        <View style={blockStyle} pointerEvents="box-none">
          <View style={{
            backgroundColor: c.bg1, borderRadius: 20, borderWidth: 1, borderColor: c.teal + '55',
            paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm, flexShrink: 1,
          }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.teal, marginBottom: 2 }}>
              {guide.name}
            </Text>
            {!!currentStep.title && (
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>
                {currentStep.title}
              </Text>
            )}
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 2 }}>
              {!!currentStep.body && (
                <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{currentStep.body}</Text>
              )}

              {/* ── Mini quiz ────────────────────────────────────────────
                  A step can check understanding instead of just asserting
                  it. First tap stands (see answerQuiz), then the right
                  answer and the reason are revealed — being told WHY the
                  wrong option is wrong is the part that teaches. */}
              {currentStep.quiz && (
                <View style={{ marginTop: currentStep.body ? s.md : 0 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: s.sm }}>
                    {currentStep.quiz.question}
                  </Text>
                  {optionOrder(currentStep.quiz.question, currentStep.quiz.options.length).map((i) => {
                    const opt = currentStep.quiz.options[i];
                    const answered = quizAnswer !== null;
                    const isRight = i === currentStep.quiz.answerIndex;
                    const isPicked = quizAnswer === i;
                    const border = !answered ? c.border : isRight ? c.success : isPicked ? c.error : c.border;
                    const tint = !answered ? 'transparent' : isRight ? c.success + '18' : isPicked ? c.error + '18' : 'transparent';
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => answerQuiz(i)}
                        disabled={answered}
                        accessibilityRole="button"
                        style={{
                          flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                          borderWidth: 1, borderColor: border, backgroundColor: tint,
                          borderRadius: r.md, paddingVertical: 9, paddingHorizontal: 11, marginBottom: 6,
                        }}>
                        {answered && (isRight || isPicked) && (
                          <Ionicons
                            name={isRight ? 'checkmark-circle' : 'close-circle'}
                            size={15}
                            color={isRight ? c.success : c.error}
                            style={{ marginTop: 1 }}
                          />
                        )}
                        <Text style={{ flex: 1, fontSize: t.sm, color: answered && !isRight && !isPicked ? c.text4 : c.text2, lineHeight: 19 }}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {quizAnswer !== null && !!currentStep.quiz.explain && (
                    <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 19, marginTop: 4 }}>
                      {currentStep.quiz.explain}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Controls — outside the ScrollView, so they can never be
                scrolled out of reach no matter how long the copy runs. */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              marginTop: s.sm, paddingTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border,
            }}>
              <TouchableOpacity onPress={skipTour} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ fontSize: 12, color: c.text4, fontWeight: t.bold }}>{currentStep.skipLabel || 'Skip'}</Text>
              </TouchableOpacity>

              {/* Step dots — position without the arithmetic of "3 OF 5". */}
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {steps.map((_, i) => (
                  <View key={i} style={{
                    width: i === stepIndex ? 14 : 5, height: 5, borderRadius: 3,
                    backgroundColor: i === stepIndex ? c.teal : i < stepIndex ? (c.tealDim || c.teal + '66') : c.bg2,
                  }} />
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
                {stepIndex > 0 && (
                  <TouchableOpacity onPress={backStep} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ fontSize: 12, color: c.text4, fontWeight: t.bold }}>Back</Text>
                  </TouchableOpacity>
                )}
                {/* A passthrough step is completed by doing the thing, not by
                    pressing Next — so it doesn't offer one. */}
                {/* An unanswered quiz withholds Next — otherwise the
                    obvious move is to skip past the question, which defeats
                    the point of asking it. */}
                {(!currentStep.passthrough || currentStep.allowNext) && !(currentStep.quiz && quizAnswer === null) && (
                  <TouchableOpacity onPress={nextStep} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ fontSize: 13, color: c.teal, fontWeight: '800' }}>
                      {isLastStep ? 'Done' : 'Next ›'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Tail + character, tucked under the bubble */}
          <View style={{ height: TAIL_H, marginLeft: tailLeft }} pointerEvents="none">
            <Svg width={TAIL_W} height={TAIL_H}>
              <Path d={tailPath} fill={c.bg1} stroke={c.teal + '55'} strokeWidth={1} />
            </Svg>
          </View>
          <View style={{ height: guideSize, justifyContent: 'flex-end' }} pointerEvents="none">
            <PlayerCharacter outfit={guide.outfit} size={guideSize} style={{ alignSelf: 'flex-start' }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absorb: { position: 'absolute' },
});
