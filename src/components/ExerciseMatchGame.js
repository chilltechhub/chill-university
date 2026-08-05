// src/components/ExerciseMatchGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const QUESTIONS = [
  { exercise:'🏃 Running',     benefit:'Improves heart health and endurance',    category:'Cardio',    muscle:'Heart & Lungs',  options:['Improves heart health and endurance','Builds arm muscles','Increases flexibility','Improves balance'] },
  { exercise:'💪 Push-Ups',    benefit:'Strengthens chest, arms, and shoulders', category:'Strength',  muscle:'Chest & Arms',   options:['Strengthens chest, arms, and shoulders','Burns belly fat','Improves posture','Increases speed'] },
  { exercise:'🧘 Yoga',        benefit:'Increases flexibility and reduces stress',category:'Flexibility',muscle:'Whole Body',    options:['Increases flexibility and reduces stress','Builds big muscles','Improves sprinting speed','Increases bone density'] },
  { exercise:'🏊 Swimming',    benefit:'Low-impact full body workout',           category:'Cardio',    muscle:'Full Body',      options:['Low-impact full body workout','Only works leg muscles','Increases weight','Reduces coordination'] },
  { exercise:'🦵 Squats',      benefit:'Builds leg and glute strength',          category:'Strength',  muscle:'Legs & Glutes',  options:['Builds leg and glute strength','Improves breathing','Reduces flexibility','Builds arm strength'] },
  { exercise:'🚴 Cycling',     benefit:'Burns calories and builds leg muscles',  category:'Cardio',    muscle:'Legs & Heart',   options:['Burns calories and builds leg muscles','Improves grip strength','Reduces heart rate','Builds upper body'] },
  { exercise:'🤸 Stretching',  benefit:'Prevents injury and improves range of motion',category:'Flexibility',muscle:'All Muscles',options:['Prevents injury and improves range of motion','Builds explosive strength','Burns most calories','Increases muscle mass quickly'] },
  { exercise:'🏋️ Deadlifts',  benefit:'Strengthens back, legs, and core',       category:'Strength',  muscle:'Back & Legs',    options:['Strengthens back, legs, and core','Improves breathing capacity','Increases reaction time','Reduces body fat only'] },
  { exercise:'⛹️ Basketball',  benefit:'Improves coordination and teamwork',     category:'Sport',     muscle:'Full Body',      options:['Improves coordination and teamwork','Only builds upper body','Reduces heart health','Decreases stamina'] },
  { exercise:'🧗 Climbing',    benefit:'Builds grip strength and problem solving',category:'Strength', muscle:'Arms & Core',    options:['Builds grip strength and problem solving','Only improves flexibility','Reduces bone density','Hurts back muscles'] },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

const CAT_COLORS = {
  Cardio:      G.teal,
  Strength:    '#e05858',
  Flexibility: G.gold,
  Sport:       '#8b4fc4',
};

export default function ExerciseMatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [questions] = useState(() => shuffle(QUESTIONS));
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [opts, setOpts]       = useState(() => shuffle(QUESTIONS[0].options));
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'general', difficulty: 1, onGameEnd });
  const q = questions[idx];

  const handleAnswer = useCallback((opt) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt === q.benefit;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 4 ? 5 : 0 });
    setFeedback({ isCorrect, correct: q.benefit, category: q.category, muscle: q.muscle });

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      const nextIdx = idx + 1;
      if (game.lives - (isCorrect ? 0 : 1) <= 0 || nextIdx >= questions.length) {
        game.endGame();
      } else {
        setIdx(nextIdx);
        setOpts(shuffle(questions[nextIdx].options));
      }
    }, 1800);
  }, [selected, q, startTime, game, idx, questions]);

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Fitness Expert!"
      onPlayAgain={() => { game.reset(); setIdx(0); setSelected(null); setFeedback(null); setOpts(shuffle(questions[0].options)); }}
      onQuit={() => navigation.goBack()}
    />
  );

  const catColor = CAT_COLORS[q.category] || G.teal;

  return (
    <GameShell
      title="Exercise Match" emoji="💪" subject="Health & Fitness"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={idx / questions.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{idx + 1} / {questions.length}</Text>

        <View style={s.exerciseCard}>
          <Text style={s.exerciseEmoji}>{q.exercise.split(' ')[0]}</Text>
          <Text style={s.exerciseName}>{q.exercise.replace(/^\S+\s/, '')}</Text>
          <View style={[s.catBadge, { borderColor: catColor, backgroundColor: catColor + '22' }]}>
            <Text style={[s.catText, { color: catColor }]}>{q.category}</Text>
          </View>
          <Text style={s.question}>What is the main benefit?</Text>
        </View>

        <View style={s.options}>
          {opts.map(opt => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (opt === q.benefit) { bg = G.success + '22'; border = G.success; }
              else if (opt === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity
                key={opt}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)}
                disabled={!!selected}
              >
                <Text style={s.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : '✗ Not quite!'}
            </Text>
            <Text style={s.feedbackText}>{feedback.correct}</Text>
            <Text style={s.muscleText}>🎯 Works: {feedback.muscle}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const s = StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  progress:     { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  exerciseCard: { backgroundColor: G.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  exerciseEmoji:{ fontSize: 52, marginBottom: 8 },
  exerciseName: { fontSize: 20, fontWeight: '700', color: G.cream, marginBottom: 8 },
  catBadge:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  catText:      { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  question:     { fontSize: 13, color: G.muted },
  options:      { gap: 10, marginBottom: 16 },
  option:       { borderWidth: 1, borderRadius: 12, padding: 14 },
  optionText:   { fontSize: 14, color: G.cream, lineHeight: 18 },
  feedback:     { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackText: { fontSize: 13, color: G.cream, lineHeight: 18, marginBottom: 6 },
  muscleText:   { fontSize: 12, color: G.teal, fontWeight: '600' },
});
