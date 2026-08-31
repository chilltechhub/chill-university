// src/components/ExerciseMatchGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { EXERCISE_BANK, EXERCISE_CAT_COLORS } from '../data/gameContent/exerciseMatch';

const SESSION_LENGTH = 14;

const BLURBS = {
  'K-2': 'Common exercises and their obvious benefits.',
  '3-5': 'Core work, rowing, burpees — less obvious matches.',
  '6-8': 'Exercise science — aerobic vs anaerobic, overload, recovery.',
  '9-12': 'Sports physiology — VO2 max, periodization, muscle fiber types.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.exercise));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function ExerciseMatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('exercise');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [asked, setAsked] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'health', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(EXERCISE_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.exercise];
    setQ(first);
    setOpts(shuffle(first.options));
    setAsked(0);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const handleAnswer = useCallback((opt) => {
    if (selected || !q) return;
    setSelected(opt);
    const isCorrect = opt === q.benefit;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 4 ? 5 : 0 });
    setFeedback({ isCorrect, correct: q.benefit, category: q.category, muscle: q.muscle });

    const nextAdaptiveState = nextAdaptiveTier(adaptive, isCorrect);
    setAdaptive(nextAdaptiveState);

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      const willEnd = game.lives - (isCorrect ? 0 : 1) <= 0 || asked + 1 >= SESSION_LENGTH;
      if (willEnd) {
        game.endGame();
      } else {
        const pool = EXERCISE_BANK[levelForTier(nextAdaptiveState.tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current.slice(-4), next.exercise];
        setQ(next);
        setOpts(shuffle(next.options));
        setAsked(a => a + 1);
      }
    }, 1800);
  }, [selected, q, startTime, game, asked, adaptive]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Exercise Match" emoji="💪" subjectLabel="Health & Fitness"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Fitness Expert!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!q) return null;
  const catColor = EXERCISE_CAT_COLORS[q.category] || G.teal;

  return (
    <GameShell
      title="Exercise Match" emoji="💪" subject={`Health & Fitness · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{asked + 1} / {SESSION_LENGTH}</Text>

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

const makeStyles = (G) => StyleSheet.create({
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
