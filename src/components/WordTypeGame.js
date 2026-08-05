// src/components/WordTypeGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const QUESTIONS = [
  { word: 'quickly',    sentence: 'The rabbit ran quickly through the garden.',   correct: 'adverb',    options: ['noun','verb','adverb','adjective'],    explanation: "'Quickly' describes HOW the rabbit ran — that makes it an adverb." },
  { word: 'happy',      sentence: 'The happy dog wagged its tail.',                correct: 'adjective', options: ['noun','verb','adverb','adjective'],    explanation: "'Happy' describes the dog — describing words are adjectives." },
  { word: 'playground', sentence: 'The children played at the playground.',        correct: 'noun',      options: ['noun','verb','adverb','adjective'],    explanation: "'Playground' is a place — places are nouns." },
  { word: 'jumped',     sentence: 'The frog jumped over the log.',                 correct: 'verb',      options: ['noun','verb','adverb','adjective'],    explanation: "'Jumped' is an action — action words are verbs." },
  { word: 'colorful',   sentence: 'She painted a colorful picture.',               correct: 'adjective', options: ['noun','verb','adverb','adjective'],    explanation: "'Colorful' describes the picture — adjective." },
  { word: 'teacher',    sentence: 'Our teacher reads us stories every day.',       correct: 'noun',      options: ['noun','verb','adverb','adjective'],    explanation: "'Teacher' is a person — people are nouns." },
  { word: 'slowly',     sentence: 'The turtle moved slowly across the path.',      correct: 'adverb',    options: ['noun','verb','adverb','adjective'],    explanation: "'Slowly' tells HOW the turtle moved — adverb." },
  { word: 'giggled',    sentence: 'The baby giggled at the funny face.',           correct: 'verb',      options: ['noun','verb','adverb','adjective'],    explanation: "'Giggled' is something the baby did — verb." },
  { word: 'ancient',    sentence: 'We visited an ancient castle.',                 correct: 'adjective', options: ['noun','verb','adverb','adjective'],    explanation: "'Ancient' describes the castle — adjective." },
  { word: 'mountain',   sentence: 'The mountain was covered in snow.',             correct: 'noun',      options: ['noun','verb','adverb','adjective'],    explanation: "'Mountain' is a place — noun." },
];

const OPTION_COLORS = {
  noun: '#2bb5a0', verb: '#c9a84c', adverb: '#8b4fc4', adjective: '#e05858',
};

export default function WordTypeGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'language_arts', difficulty: 1, onGameEnd });
  const q = QUESTIONS[idx];

  const handleAnswer = useCallback((option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    const speedBonus = speed < 3 ? 5 : 0;
    game.answer(isCorrect, { speedBonus });
    setFeedback({ isCorrect, explanation: q.explanation });

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      if (game.lives - (isCorrect ? 0 : 1) <= 0 || idx >= QUESTIONS.length - 1) {
        game.endGame();
      } else {
        setIdx(i => i + 1);
      }
    }, 1800);
  }, [selected, q, startTime, game, idx]);

  if (game.done) {
    return (
      <GameOver
        score={game.score}
        correct={game.correct}
        total={game.attempted}
        streak={game.bestStreak}
        title="Case Closed, Detective!"
        onPlayAgain={() => { game.reset(); setIdx(0); setSelected(null); setFeedback(null); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  return (
    <GameShell
      title="Word Detective"
      emoji="📖"
      subject="Language Arts"
      score={game.score}
      lives={game.lives}
      streak={game.streak}
      progress={idx / QUESTIONS.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Progress */}
        <Text style={s.progress}>Question {idx + 1} of {QUESTIONS.length}</Text>

        {/* Question card */}
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

        {/* Options */}
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
                <View style={[s.optionDot, { backgroundColor: OPTION_COLORS[opt] }]} />
                <Text style={s.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
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

const s = StyleSheet.create({
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
