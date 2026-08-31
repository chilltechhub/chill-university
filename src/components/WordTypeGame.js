// src/components/WordTypeGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { WORD_BANK, WORD_TYPE_COLORS } from '../data/gameContent/wordDetective';

const SESSION_LENGTH = 15;

const BLURBS = {
  'K-2': 'Simple sentences — noun, verb, adjective, adverb.',
  '3-5': 'Trickier sentences, plus pronouns, prepositions & conjunctions.',
  '6-8': 'Multi-use words, linking verbs & relative pronouns.',
  '9-12': 'Gerunds, participles, interjections & complex clause structure.',
};

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.word + q.sentence));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function WordTypeGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('word');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [asked, setAsked] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'language_arts', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    recentRef.current = [];
    const first = pickNext(WORD_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.word + first.sentence];
    setQ(first);
    setAsked(0);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const handleAnswer = useCallback((option) => {
    if (selected || !q) return;
    setSelected(option);
    const isCorrect = option === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    const speedBonus = speed < 3 ? 5 : 0;
    game.answer(isCorrect, { speedBonus });
    setFeedback({ isCorrect, explanation: q.explanation });

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
        const pool = WORD_BANK[levelForTier(nextAdaptiveState.tier)];
        const nextQ = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current.slice(-4), nextQ.word + nextQ.sentence];
        setQ(nextQ);
        setAsked(a => a + 1);
      }
    }, 1800);
  }, [selected, q, startTime, game, asked, adaptive]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Word Detective" emoji="📖" subjectLabel="Language Arts"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) {
    return (
      <GameOver
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak} title="Case Closed, Detective!"
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  if (!q) return null;

  return (
    <GameShell
      title="Word Detective"
      emoji="📖"
      subject={`Language Arts · ${levelForTier(adaptive.tier)}`}
      score={game.score}
      lives={game.lives}
      streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Question {asked + 1} of {SESSION_LENGTH}</Text>

        <View style={s.card}>
          <Text style={s.label}>What type of word is...</Text>
          <View style={s.wordBadge}>
            <Text style={s.word}>"{q.word}"</Text>
          </View>
          <Text style={s.sentence}>
            {q.sentence.split(q.word).map((part, i, arr) => (
              <Text key={i}>
                {part}
                {i < arr.length - 1 && (
                  <Text style={s.highlight}>{q.word}</Text>
                )}
              </Text>
            ))}
          </Text>
        </View>

        <View style={s.options}>
          {q.options.map(opt => {
            let bg = G.card;
            let border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '33'; border = G.success; }
              else if (opt === selected && !feedback?.isCorrect) { bg = G.error + '33'; border = G.error; }
            }
            return (
              <TouchableOpacity
                key={opt}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)}
                disabled={!!selected}
              >
                <View style={[s.optionDot, { backgroundColor: WORD_TYPE_COLORS[opt] || G.muted }]} />
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
  card:        { backgroundColor: G.card, borderRadius: 16, padding: 20, borderWidth: 0.5, borderColor: G.border, marginBottom: 16, alignItems: 'center' },
  label:       { fontSize: 13, color: G.muted, marginBottom: 12 },
  wordBadge:   { backgroundColor: G.goldL, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 14, borderWidth: 0.5, borderColor: G.gold },
  word:        { fontSize: 22, fontWeight: '700', color: G.gold },
  sentence:    { fontSize: 15, color: G.cream, textAlign: 'center', lineHeight: 22 },
  highlight:   { color: G.gold, fontWeight: '700' },
  options:     { gap: 10, marginBottom: 16 },
  option:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 16 },
  optionDot:   { width: 10, height: 10, borderRadius: 5 },
  optionText:  { fontSize: 16, fontWeight: '600', color: G.cream, textTransform: 'capitalize' },
  feedback:    { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackText:{ fontSize: 13, color: G.cream, lineHeight: 18 },
});
