// src/components/TechLabGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { TECH_BANK } from '../data/gameContent/techLab';

const SESSION_LENGTH = 14;

const BLURBS = {
  'K-2': 'Computer parts and basic online safety.',
  '3-5': 'Passwords, algorithms, hardware vs. software.',
  '6-8': 'Coding basics, binary, and engineering design.',
  '9-12': 'Cybersecurity, APIs, and machine learning.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.prompt));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function TechLabGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('tech');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [asked, setAsked] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'technology', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(TECH_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.prompt];
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
    const isCorrect = opt === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 4 ? 5 : 0 });
    setFeedback({ isCorrect, explanation: q.explanation, correct: q.correct });

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
        const pool = TECH_BANK[levelForTier(nextAdaptiveState.tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current.slice(-4), next.prompt];
        setQ(next);
        setOpts(shuffle(next.options));
        setAsked(a => a + 1);
      }
    }, 1900);
  }, [selected, q, startTime, game, asked, adaptive]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Tech Lab" emoji="💻" subjectLabel="Technology"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Tech Whiz!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!q) return null;

  return (
    <GameShell
      title="Tech Lab" emoji="💻" subject={`Technology · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Question {asked + 1} of {SESSION_LENGTH}</Text>

        <View style={s.card}>
          <Text style={s.prompt}>{q.prompt}</Text>
        </View>

        <View style={s.options}>
          {opts.map(opt => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '22'; border = G.success; }
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
              {feedback.isCorrect ? '✓ Correct!' : `✗ It's "${feedback.correct}"`}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:      { padding: 16, paddingBottom: 40 },
  progress:    { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card:        { backgroundColor: G.card, borderRadius: 16, padding: 22, borderWidth: 0.5, borderColor: G.border, marginBottom: 16, alignItems: 'center' },
  prompt:      { fontSize: 17, color: G.cream, textAlign: 'center', lineHeight: 24, fontWeight: '600' },
  options:     { gap: 10, marginBottom: 16 },
  option:      { borderWidth: 1, borderRadius: 12, padding: 16 },
  optionText:  { fontSize: 14, color: G.cream, lineHeight: 18 },
  feedback:    { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackText:{ fontSize: 13, color: G.cream, lineHeight: 18 },
});
