// src/components/UnlockSheet.js
// What you get instead of a dead tap on a locked feature.
//
// A lock is only fair if the way through is visible from the lock itself, so
// this sheet always answers three things in order:
//   1. what this feature actually is (no teasing — the blurb is the real one)
//   2. why it is shut, in words that aren't "upgrade to continue"
//   3. every route in, with the cheapest honest one first
//
// Routes, by gate:
//   locked       → start (or continue) the objective, and — when the feature
//                  is testable and the attempt is unspent — test out of it
//   experimental → one switch, with the roughness stated plainly
//   paid         → what the plan covers; claim it if already subscribed
//
// It deliberately does not sell. The paid panel says what the feature does
// and that it needs a plan, and stops there — a locked door that argues with
// you is worse than a locked door.

import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import CompetencyTest from './CompetencyTest';
import { goToScreen } from '../logic/appRoutes';
import { FONTS } from '../theme';

export default function UnlockSheet({ visible, featureId, onClose, onUnlocked }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const {
    accessFor, activeObjectiveId, startObjective, setExperimental,
    experimentalOn, isPlus, claimPlanFeature, doorSettings, setDoorSetting,
  } = useAccess();

  const [testOpen, setTestOpen] = useState(false);
  const s = makeStyles(c, t, sp, r);

  if (!featureId) return null;
  const access = accessFor(featureId);
  const feature = access.feature;
  if (!feature) return null;

  const goToCompass = () => {
    onClose?.();
    navigation.navigate('Compass');
  };

  const beginObjective = async (objectiveId) => {
    await startObjective(objectiveId);
    goToCompass();
  };

  const openFeature = () => {
    onClose?.();
    // This sheet is rendered from Home, the Library stack and the root
    // stack alike, so it can never assume where it is navigating from.
    if (feature.screen) goToScreen(navigation, feature.screen);
  };

  return (
    <>
      <Modal visible={visible && !testOpen} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.grabber} />

            <View style={s.headerRow}>
              <View style={[s.iconBox, { backgroundColor: toneColor(c, access) + '18' }]}>
                <Ionicons name={feature.icon || 'lock-closed-outline'} size={22} color={toneColor(c, access)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{feature.label}</Text>
                <Text style={[s.kicker, { color: toneColor(c, access) }]}>{access.headline}</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={c.text3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.blurb}>{feature.blurb}</Text>
              {!!access.reason && <Text style={s.reason}>{access.reason}</Text>}

              {/* ── Already open ── */}
              {access.available && (
                <TouchableOpacity style={s.primaryBtn} onPress={openFeature} activeOpacity={0.85}>
                  <Text style={s.primaryBtnText}>Open {feature.label}</Text>
                </TouchableOpacity>
              )}

              {/* ── Locked: the objective route ── */}
              {access.status === 'locked' && access.routes.objectives.length > 0 && (
                <View style={s.panel}>
                  <Text style={s.panelHead}>The way in</Text>
                  {access.routes.objectives.map(o => (
                    <View key={o.id} style={s.objectiveRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.objectiveLabel}>{o.label}</Text>
                        <Text style={s.objectivePromise}>{o.promise}</Text>
                        {o.active && (
                          <View style={s.progressWrap}>
                            <View style={s.progressTrack}>
                              <View style={[s.progressFill, { width: `${(o.done / Math.max(o.total, 1)) * 100}%` }]} />
                            </View>
                            <Text style={s.progressText}>{o.done}/{o.total}</Text>
                          </View>
                        )}
                      </View>
                      {o.active ? (
                        <TouchableOpacity style={s.smallBtn} onPress={goToCompass} activeOpacity={0.8}>
                          <Text style={s.smallBtnText}>Continue</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={s.smallBtn} onPress={() => beginObjective(o.id)} activeOpacity={0.8}>
                          <Text style={s.smallBtnText}>Start</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {/* Starting a second objective retires the first. Say so before
                      the tap, not in an alert afterwards. */}
                  {activeObjectiveId && !access.routes.objectives.some(o => o.active) && (
                    <Text style={s.swapNote}>
                      Starting one of these sets aside the objective you're on. One at a time is the point.
                    </Text>
                  )}
                </View>
              )}

              {/* ── Locked: the test-out route ── */}
              {access.status === 'locked' && access.routes.test && (
                <View style={[s.panel, access.routes.test.closed && s.panelSpent]}>
                  <Text style={s.panelHead}>Or skip it</Text>
                  {access.routes.test.available ? (
                    <>
                      <Text style={s.testBody}>
                        {access.routes.test.questions} questions on judgement, not trivia.
                        Get {access.routes.test.passMark} right and {feature.label} opens now.
                      </Text>
                      <Text style={s.testWarn}>
                        One attempt. Fall short and the objective becomes the only way in.
                      </Text>
                      <TouchableOpacity style={s.outlineBtn} onPress={() => setTestOpen(true)} activeOpacity={0.85}>
                        <Ionicons name="ribbon-outline" size={15} color={c.gold} />
                        <Text style={s.outlineBtnText}>Take the {access.routes.test.title} check</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={s.testBody}>
                      {access.routes.test.closed
                        ? `You took this check and got ${access.routes.test.attempt?.score}/${access.routes.test.attempt?.total}. It's spent — the objective is the way in now.`
                        : 'Already passed.'}
                    </Text>
                  )}
                </View>
              )}

              {/* ── A Settings switch that is also a key ── */}
              {access.status === 'locked' && access.routes.setting && (
                <View style={s.panel}>
                  <View style={s.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.panelHead}>{access.routes.setting.label}</Text>
                      <Text style={s.testBody}>
                        Already doing this for real? Switch it on and {feature.label} opens now. It's
                        the same switch in Settings, and turning it off closes it again.
                      </Text>
                    </View>
                    <Switch
                      value={doorSettings?.[access.routes.setting.key] === true}
                      onValueChange={(on) => { setDoorSetting(access.routes.setting.key, on); if (on) onUnlocked?.(featureId); }}
                      trackColor={{ false: c.bg3, true: c.teal }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              )}

              {/* ── Locked with no test on purpose ── */}
              {access.status === 'locked' && !access.routes.test && (
                <Text style={s.noTestNote}>
                  There's no shortcut for this one — doing the thing is the qualification.
                </Text>
              )}

              {/* ── Experimental ── */}
              {access.status === 'experimental' && (
                <View style={s.panel}>
                  <View style={s.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.panelHead}>Experimental features</Text>
                      <Text style={s.testBody}>
                        Turns on everything still being built, not just this one. Rough edges are the
                        point — you can switch it back off in Settings whenever.
                      </Text>
                    </View>
                    <Switch
                      value={experimentalOn}
                      onValueChange={async (on) => { await setExperimental(on); if (on) onUnlocked?.(featureId); }}
                      trackColor={{ false: c.bg3, true: c.purple }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              )}

              {/* ── Paid ── */}
              {access.status === 'paid' && (
                <View style={s.panel}>
                  <Text style={s.panelHead}>Part of Plus</Text>
                  <Text style={s.testBody}>{feature.why}</Text>
                  {isPlus ? (
                    <TouchableOpacity
                      style={s.outlineBtn}
                      onPress={async () => { await claimPlanFeature(featureId); onUnlocked?.(featureId); }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="star-outline" size={15} color={c.gold} />
                      <Text style={s.outlineBtnText}>Switch it on</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={s.outlineBtn}
                        onPress={() => { onClose?.(); navigation.navigate('Plus', { from: 'feature' }); }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="star" size={15} color={c.gold} />
                        <Text style={s.outlineBtnText}>See Plus</Text>
                      </TouchableOpacity>
                      <Text style={s.planNote}>
                        Your account is on the free plan. Everything else in the app works the same either way.
                      </Text>
                    </>
                  )}
                </View>
              )}

              <TouchableOpacity style={s.ghostBtn} onPress={goToCompass} activeOpacity={0.7}>
                <Ionicons name="navigate-outline" size={14} color={c.text3} />
                <Text style={s.ghostBtnText}>See everything in the Compass</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CompetencyTest
        visible={testOpen}
        featureId={featureId}
        feature={feature}
        onClose={() => setTestOpen(false)}
        onPassed={() => onUnlocked?.(featureId)}
      />
    </>
  );
}

function toneColor(c, access) {
  if (access.available) return c.teal;
  if (access.status === 'paid') return c.gold;
  if (access.status === 'experimental') return c.purple;
  return c.text3;
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, paddingHorizontal: sp.xl, paddingTop: sp.md, paddingBottom: 34, maxHeight: '88%' },
  grabber:    { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: sp.lg },

  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.lg },
  iconBox:    { width: 44, height: 44, borderRadius: r.md, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: t.lg, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1 },
  kicker:     { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginTop: 2 },

  blurb:      { fontSize: t.sm, color: c.text1, lineHeight: 20, marginBottom: sp.sm },
  reason:     { fontSize: t.xs, color: c.text3, lineHeight: 18, marginBottom: sp.lg },

  panel:      { backgroundColor: c.bg0, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: sp.md, marginBottom: sp.md },
  panelSpent: { opacity: 0.75 },
  panelHead:  { fontSize: 10, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: sp.sm },

  objectiveRow:{ flexDirection: 'row', alignItems: 'center', gap: sp.md, paddingVertical: sp.sm },
  objectiveLabel:{ fontSize: t.sm, fontWeight: '700', color: c.text1 },
  objectivePromise:{ fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 },
  progressWrap:{ flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginTop: 6 },
  progressTrack:{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.bg3, overflow: 'hidden' },
  progressFill:{ height: 4, borderRadius: 2, backgroundColor: c.teal },
  progressText:{ fontSize: 10, fontFamily: FONTS.mono, color: c.text3 },
  swapNote:   { fontSize: t.xs, color: c.text4, fontStyle: 'italic', marginTop: sp.sm, lineHeight: 17 },

  testBody:   { fontSize: t.xs, color: c.text2, lineHeight: 18 },
  testWarn:   { fontSize: t.xs, color: c.warning, lineHeight: 18, marginTop: 6, fontWeight: '600' },
  noTestNote: { fontSize: t.xs, color: c.text4, fontStyle: 'italic', lineHeight: 18, marginBottom: sp.md },
  planNote:   { fontSize: t.xs, color: c.text3, lineHeight: 18, marginTop: sp.sm },

  switchRow:  { flexDirection: 'row', alignItems: 'center', gap: sp.md },

  smallBtn:   { backgroundColor: c.teal, borderRadius: r.sm, paddingHorizontal: sp.md, paddingVertical: sp.sm },
  smallBtnText:{ color: '#fff', fontSize: t.xs, fontWeight: '800' },

  primaryBtn: { backgroundColor: c.teal, borderRadius: r.md, paddingVertical: sp.md, alignItems: 'center', marginBottom: sp.md },
  primaryBtnText: { color: '#fff', fontSize: t.sm, fontWeight: '800', letterSpacing: 0.5 },

  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.gold, borderRadius: r.md, paddingVertical: sp.md, marginTop: sp.md },
  outlineBtnText: { color: c.gold, fontSize: t.xs, fontWeight: '800' },

  ghostBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: sp.md },
  ghostBtnText:{ color: c.text3, fontSize: t.xs },
});
