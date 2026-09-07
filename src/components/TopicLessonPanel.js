// src/components/TopicLessonPanel.js
// The "go deeper" layer for one Academy Classes topic — Learn concept
// cards, an interactive Practice quiz, and an Apply mini-project checklist.
// Rendered inside ClassTopicScreen.js under a topic's existing description
// + video links (those stay exactly as they were — this is purely additive).
// A topic with no `learn`/`practice`/`apply` in its meta renders nothing,
// so older/not-yet-enriched topics look exactly like before.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function LearnCards({ learn, color, c, t, s, r }) {
  return (
    <View style={{ marginTop: 8 }}>
      {learn.map((card, i) => (
        <View key={i} style={{ marginBottom: 8, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 }}>
          {card.heading ? (
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: color, marginBottom: 3 }}>{card.heading}</Text>
          ) : null}
          <Text style={{ fontSize: t.sm, lineHeight: 19, color: c.text2 }}>{card.body}</Text>
        </View>
      ))}
    </View>
  );
}

function PracticeQuiz({ practice, color, c, t, s, r }) {
  const [answers, setAnswers] = useState({}); // index -> chosen option index

  const choose = (qIndex, optIndex) => {
    if (answers[qIndex] !== undefined) return; // lock after first pick
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const correctCount = practice.reduce((n, q, i) => (answers[i] === q.answerIndex ? n + 1 : n), 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <View style={{ marginTop: 8 }}>
      {practice.map((q, qi) => {
        const picked = answers[qi];
        const isAnswered = picked !== undefined;
        return (
          <View key={qi} style={{ marginBottom: 10, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: 6 }}>{q.question}</Text>
            {(q.options || []).map((opt, oi) => {
              const isCorrect = oi === q.answerIndex;
              const isPicked = oi === picked;
              let bg = 'transparent';
              let borderColor = c.border;
              if (isAnswered && isCorrect) { bg = '#3AC86022'; borderColor = '#3AC860'; }
              else if (isAnswered && isPicked && !isCorrect) { bg = '#E0585822'; borderColor = '#E05858'; }
              return (
                <TouchableOpacity
                  key={oi}
                  onPress={() => choose(qi, oi)}
                  disabled={isAnswered}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 8, paddingHorizontal: 10, borderRadius: r.sm,
                    borderWidth: 1, borderColor, backgroundColor: bg, marginTop: 6,
                  }}
                >
                  <Ionicons
                    name={isAnswered && isCorrect ? 'checkmark-circle' : isAnswered && isPicked ? 'close-circle' : 'ellipse-outline'}
                    size={16}
                    color={isAnswered && isCorrect ? '#3AC860' : isAnswered && isPicked ? '#E05858' : c.text4}
                  />
                  <Text style={{ fontSize: t.sm, color: c.text2, flex: 1 }}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
            {isAnswered && q.explanation ? (
              <Text style={{ fontSize: 12, color: c.text3, marginTop: 6, fontStyle: 'italic' }}>{q.explanation}</Text>
            ) : null}
          </View>
        );
      })}
      {practice.length > 0 && (
        <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>
          {answeredCount === practice.length
            ? `Score: ${correctCount}/${practice.length}`
            : `${answeredCount}/${practice.length} answered`}
        </Text>
      )}
    </View>
  );
}

function ApplyChallenge({ apply, color, c, t, s, r }) {
  const [checked, setChecked] = useState({});
  const items = apply.checklist || [];
  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <View style={{ marginTop: 8, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 }}>
      <Text style={{ fontSize: t.sm, lineHeight: 19, color: c.text2, marginBottom: items.length ? 8 : 0 }}>{apply.prompt}</Text>
      {items.map((label, i) => (
        <TouchableOpacity key={i} onPress={() => toggle(i)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          <Ionicons name={checked[i] ? 'checkbox' : 'square-outline'} size={17} color={checked[i] ? color : c.text4} />
          <Text style={{ fontSize: t.sm, color: c.text2, flex: 1, textDecorationLine: checked[i] ? 'line-through' : 'none' }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const TABS = [
  { key: 'learn', label: 'Learn', icon: 'bulb-outline' },
  { key: 'practice', label: 'Practice', icon: 'create-outline' },
  { key: 'apply', label: 'Apply', icon: 'construct-outline' },
];

export default function TopicLessonPanel({ topic, color, c, t, s, r }) {
  const hasLearn = topic.learn?.length > 0;
  const hasPractice = topic.practice?.length > 0;
  const hasApply = !!topic.apply?.prompt;
  const available = TABS.filter(tab =>
    (tab.key === 'learn' && hasLearn) ||
    (tab.key === 'practice' && hasPractice) ||
    (tab.key === 'apply' && hasApply)
  );

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(available[0]?.key);

  if (available.length === 0) return null;

  return (
    <View style={{ marginTop: s.sm }}>
      <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="school-outline" size={15} color={color} />
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color }}>
          Full lesson: Learn · Practice · Apply {open ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {available.map(tabDef => (
              <TouchableOpacity
                key={tabDef.key}
                onPress={() => setTab(tabDef.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: r.full,
                  backgroundColor: tab === tabDef.key ? color : 'transparent',
                  borderWidth: 1, borderColor: color,
                }}
              >
                <Ionicons name={tabDef.icon} size={13} color={tab === tabDef.key ? '#fff' : color} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: tab === tabDef.key ? '#fff' : color }}>{tabDef.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'learn' && hasLearn && <LearnCards learn={topic.learn} color={color} c={c} t={t} s={s} r={r} />}
          {tab === 'practice' && hasPractice && <PracticeQuiz practice={topic.practice} color={color} c={c} t={t} s={s} r={r} />}
          {tab === 'apply' && hasApply && <ApplyChallenge apply={topic.apply} color={color} c={c} t={t} s={s} r={r} />}
        </View>
      )}
    </View>
  );
}
