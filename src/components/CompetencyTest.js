// src/components/CompetencyTest.js
// The test-out runner — the "show competence instead of grinding" route.
//
// The rule it has to communicate, before anyone taps start: ONE attempt.
// Pass and the feature opens now. Fail and the test route closes for good
// and the objective becomes the only way in. That is a real consequence, so
// the screen says so twice — once on the intro, once on the confirm — and
// never dresses the last question up as "submit when ready".
//
// Three states in one modal (intro → questions → result) rather than three
// screens, because backing out mid-test has to be obviously free, and a
// navigation stack makes "did leaving count as an attempt?" a fair question.
// Nothing is recorded until the final confirm.
//
// Grading and the attempt record go through useAccess().submitTest(), which
// writes to public.record_test_attempt() — that's where the pass mark is
// applied and where the one-attempt rule is actually enforced.

import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { getTest } from '../data/competencyTests';
import { FONTS } from '../theme';

export default function CompetencyTest({ visible, featureId, feature, onClose, onPassed }) {
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const { submitTest } = useAccess();

  const [phase, setPhase]     = useState('intro'); // intro | quiz | result
  const [answers, setAnswers] = useState({});
  const [result, setResult]   = useState(null);
  const [saving, setSaving]   = useState(false);

  const test = getTest(featureId);
  const s = makeStyles(c, t, sp, r);

  const reset = () => { setPhase('intro'); setAnswers({}); setResult(null); setSaving(false); };

  const close = () => { reset(); onClose?.(); };

  if (!test) return null;

  const answered = test.questions.filter(q => answers[q.id] != null).length;
  const allAnswered = answered === test.questions.length;

  const confirmSubmit = () => {
    Alert.alert(
      'Lock in your answers?',
      `This is your one attempt at the ${test.title} check. ${test.passMark} of ${test.questions.length} right unlocks ${feature?.label || 'it'} now. Anything less and the objective path becomes the only way in.`,
      [
        { text: 'Keep checking', style: 'cancel' },
        { text: 'Lock it in', style: 'destructive', onPress: doSubmit },
      ]
    );
  };

  const doSubmit = async () => {
    setSaving(true);
    const graded = await submitTest(featureId, answers);
    setSaving(false);
    if (!graded) { close(); return; }
    setResult(graded);
    setPhase('result');
    if (graded.passed) onPassed?.(graded);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          {/* ── Header ── */}
          <View style={s.grabber} />
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.kicker}>Competence check</Text>
              <Text style={s.title}>{test.title}</Text>
            </View>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>

          {phase === 'intro' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.body}>{test.intro}</Text>

              <View style={s.warnBox}>
                <View style={s.warnRow}>
                  <Ionicons name="alert-circle-outline" size={18} color={c.warning} />
                  <Text style={s.warnTitle}>One attempt</Text>
                </View>
                <Text style={s.warnBody}>
                  Get {test.passMark} of {test.questions.length} right and {feature?.label || 'this'} opens
                  straight away. Get fewer and this check is spent — finishing the objective becomes the
                  only way in. Either way you'll see what you missed and why.
                </Text>
              </View>

              <Text style={s.fineprint}>
                Nothing is recorded until you lock in your answers. Backing out now costs nothing.
              </Text>

              <TouchableOpacity style={s.primaryBtn} onPress={() => setPhase('quiz')} activeOpacity={0.85}>
                <Text style={s.primaryBtnText}>Start the check</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={close} activeOpacity={0.7}>
                <Text style={s.ghostBtnText}>Not now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {phase === 'quiz' && (
            <>
              <ScrollView showsVerticalScrollIndicator={false}>
                {test.questions.map((q, qi) => (
                  <View key={q.id} style={s.qBlock}>
                    <Text style={s.qNumber}>Question {qi + 1} of {test.questions.length}</Text>
                    <Text style={s.qPrompt}>{q.prompt}</Text>
                    {q.options.map((opt, oi) => {
                      const picked = answers[q.id] === oi;
                      return (
                        <TouchableOpacity
                          key={oi}
                          style={[s.option, picked && s.optionPicked]}
                          onPress={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={picked ? 'radio-button-on' : 'radio-button-off'}
                            size={16}
                            color={picked ? c.teal : c.text4}
                          />
                          <Text style={[s.optionText, picked && { color: c.text1 }]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
                <View style={{ height: 8 }} />
              </ScrollView>

              <View style={s.footer}>
                <Text style={s.footerCount}>{answered}/{test.questions.length} answered</Text>
                <TouchableOpacity
                  style={[s.primaryBtn, !allAnswered && s.btnDisabled, { marginTop: 8 }]}
                  onPress={confirmSubmit}
                  disabled={!allAnswered || saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.primaryBtnText}>{allAnswered ? 'Lock in my answers' : 'Answer every question'}</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

          {phase === 'result' && result && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[s.verdict, { borderColor: result.passed ? c.teal : c.warning }]}>
                <Ionicons
                  name={result.passed ? 'checkmark-circle' : 'information-circle'}
                  size={34}
                  color={result.passed ? c.teal : c.warning}
                />
                <Text style={s.verdictTitle}>
                  {result.passed ? `${feature?.label || 'Unlocked'} is open` : 'Not this time'}
                </Text>
                <Text style={s.verdictScore}>{result.score} of {result.total} right</Text>
                <Text style={s.verdictBody}>
                  {result.passed
                    ? 'You skipped the objective and went straight through. It stays unlocked.'
                    : `The check is spent. ${feature?.label || 'This'} opens by finishing its objective now — the steps are in the Wayfinder.`}
                </Text>
              </View>

              <Text style={s.reviewHead}>What you answered</Text>
              {result.results.map((res, i) => (
                <View key={res.id} style={s.reviewRow}>
                  <Ionicons
                    name={res.correct ? 'checkmark-circle-outline' : 'close-circle-outline'}
                    size={16}
                    color={res.correct ? c.teal : c.error}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.reviewPrompt}>{i + 1}. {res.prompt}</Text>
                    {!res.correct && (
                      <Text style={s.reviewAnswer}>
                        You picked "{res.pickedLabel}" · the answer was "{res.correctLabel}"
                      </Text>
                    )}
                    <Text style={s.reviewExplain}>{res.explain}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={s.primaryBtn} onPress={close} activeOpacity={0.85}>
                <Text style={s.primaryBtnText}>{result.passed ? 'Take me there' : 'Got it'}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, paddingHorizontal: sp.xl, paddingTop: sp.md, paddingBottom: 34, maxHeight: '90%' },
  grabber:    { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: sp.lg },
  headerRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: sp.md },
  kicker:     { fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 2 },
  title:      { fontSize: t.lg, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1 },
  body:       { fontSize: t.sm, color: c.text2, lineHeight: 20, marginBottom: sp.lg },

  warnBox:    { backgroundColor: c.warningLight, borderRadius: r.md, borderWidth: 0.5, borderColor: c.warning, padding: sp.md, marginBottom: sp.md },
  warnRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  warnTitle:  { fontSize: t.sm, fontWeight: '800', color: c.warning, textTransform: 'uppercase', letterSpacing: 0.8 },
  warnBody:   { fontSize: t.xs, color: c.text2, lineHeight: 18 },

  fineprint:  { fontSize: t.xs, color: c.text4, marginBottom: sp.lg, fontStyle: 'italic' },

  qBlock:     { marginBottom: sp.xl },
  qNumber:    { fontSize: 10, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  qPrompt:    { fontSize: t.md, fontWeight: '700', color: c.text1, lineHeight: 21, marginBottom: sp.md },
  option:     { flexDirection: 'row', alignItems: 'center', gap: sp.sm, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: sp.md, marginBottom: sp.sm },
  optionPicked:{ borderColor: c.teal, backgroundColor: c.tealLight },
  optionText: { flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 19 },

  footer:     { borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: sp.md },
  footerCount:{ fontSize: t.xs, color: c.text4, textAlign: 'center' },

  verdict:    { alignItems: 'center', borderWidth: 1, borderRadius: r.lg, padding: sp.lg, marginBottom: sp.lg, backgroundColor: c.bg0 },
  verdictTitle:{ fontSize: t.lg, fontWeight: '800', color: c.text1, marginTop: sp.sm },
  verdictScore:{ fontSize: t.sm, fontFamily: FONTS.mono, color: c.text3, marginTop: 2, marginBottom: sp.sm },
  verdictBody:{ fontSize: t.sm, color: c.text2, textAlign: 'center', lineHeight: 20 },

  reviewHead: { fontSize: 10, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: sp.sm },
  reviewRow:  { flexDirection: 'row', gap: sp.sm, paddingVertical: sp.sm, borderBottomWidth: 0.5, borderBottomColor: c.border },
  reviewPrompt:{ fontSize: t.xs, fontWeight: '700', color: c.text1, lineHeight: 18 },
  reviewAnswer:{ fontSize: t.xs, color: c.error, marginTop: 3, lineHeight: 17 },
  reviewExplain:{ fontSize: t.xs, color: c.text3, marginTop: 3, lineHeight: 17, fontStyle: 'italic' },

  primaryBtn: { backgroundColor: c.teal, borderRadius: r.md, paddingVertical: sp.md, alignItems: 'center', marginTop: sp.lg },
  primaryBtnText: { color: '#fff', fontSize: t.sm, fontWeight: '800', letterSpacing: 0.5 },
  btnDisabled:{ backgroundColor: c.bg3 },
  ghostBtn:   { paddingVertical: sp.md, alignItems: 'center' },
  ghostBtnText:{ color: c.text3, fontSize: t.sm },
});
