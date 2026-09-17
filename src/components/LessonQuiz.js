// src/components/LessonQuiz.js
// A short knowledge check inside a long-form curriculum lesson — the "mini
// quiz" that sits between the reading and the hands-on work.
//
// Behaves like the guide walkthrough's quiz (TourContext.answerQuiz): the
// first answer stands, then right/wrong and the explanation are revealed.
// Letting someone retap until it goes green teaches nothing, and the
// explanation is where the actual lesson is — especially for the wrong
// answers, which are written to be the misconception people really hold.
//
// Deliberately local and unsaved. It's a check for the reader, not a grade,
// and it makes no network calls.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../theme';

export default function LessonQuiz({ questions = [], color }) {
  const { colors: c, radius: r } = useTheme();
  const [answers, setAnswers] = useState({});
  const st = makeStyles(c, r);

  if (!questions.length) return null;

  const answered = Object.keys(answers).length;
  const correct = questions.reduce((n, q, i) => (answers[i] === q.answerIndex ? n + 1 : n), 0);

  return (
    <View style={[st.wrap, { borderColor: color + '55' }]}>
      <View style={st.headRow}>
        <Ionicons name="help-circle-outline" size={15} color={color} />
        <Text style={[st.headText, { color }]}>Check your understanding</Text>
      </View>

      {questions.map((q, qi) => {
        const picked = answers[qi];
        const done = picked !== undefined;
        return (
          <View key={qi} style={[st.question, qi > 0 && st.questionGap]}>
            <Text style={st.qText}>{q.question}</Text>
            {q.options.map((opt, oi) => {
              const isAnswer = oi === q.answerIndex;
              const isPicked = oi === picked;
              let border = c.border, bg = c.bg1, icon = null, iconColor = c.text4;
              if (done && isAnswer) { border = color; bg = color + '1A'; icon = 'checkmark-circle'; iconColor = color; }
              else if (done && isPicked) { border = c.error; bg = c.error + '14'; icon = 'close-circle'; iconColor = c.error; }
              return (
                <TouchableOpacity
                  key={oi}
                  disabled={done}
                  activeOpacity={0.75}
                  onPress={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                  style={[st.option, { borderColor: border, backgroundColor: bg }]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: done, selected: isPicked }}
                >
                  <Text style={[st.optText, done && !isAnswer && !isPicked && { color: c.text4 }]}>{opt}</Text>
                  {icon && <Ionicons name={icon} size={17} color={iconColor} />}
                </TouchableOpacity>
              );
            })}
            {done && (
              <View style={st.explainBox}>
                <Text style={[st.verdict, { color: picked === q.answerIndex ? color : c.error }]}>
                  {picked === q.answerIndex ? 'Right.' : 'Not quite.'}
                </Text>
                <Text style={st.explainText}>{q.explain}</Text>
              </View>
            )}
          </View>
        );
      })}

      {answered === questions.length && (
        <Text style={[st.score, { color }]}>
          {correct} of {questions.length} — {correct === questions.length
            ? 'you have this one.'
            : 'the explanations above are the part worth rereading.'}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (c, r) => StyleSheet.create({
  wrap: { marginBottom: 16, padding: 14, borderRadius: r.lg, backgroundColor: c.bg0, borderWidth: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  headText: {
    fontSize: 11, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  question: {},
  questionGap: { marginTop: 16, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: c.border },
  qText: { fontSize: 14, fontWeight: '700', color: c.text1, lineHeight: 20, marginBottom: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: r.md, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
  },
  optText: { flex: 1, fontSize: 14, color: c.text2, lineHeight: 19 },
  explainBox: { marginTop: 4, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 },
  verdict: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  explainText: { fontSize: 13, color: c.text2, lineHeight: 19 },
  score: { marginTop: 12, fontSize: 13, fontWeight: '700' },
});
