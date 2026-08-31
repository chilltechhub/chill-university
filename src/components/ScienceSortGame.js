// src/components/ScienceSortGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { SCIENCE_TOPICS } from '../data/gameContent/scienceSort';

const SESSION_LENGTH = 15;

const BLURBS = {
  'K-2': 'Animal classes & states of matter.',
  '3-5': 'Living vs nonliving, vertebrates, rock types.',
  '6-8': 'Physical/chemical change, ecosystem roles, space objects.',
  '9-12': 'Cell organelles and Newton\'s laws of motion.',
};

function flatten(levelKey) {
  return SCIENCE_TOPICS[levelKey].flatMap(topic => topic.items.map(item => ({ ...item, topic })));
}

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.name));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function ScienceSortGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('classify');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [current, setCurrent] = useState(null);
  const [asked, setAsked] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'science', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(flatten(levelForTier(initial.tier)), []);
    recentRef.current = [first.name];
    setCurrent(first);
    setAsked(0);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const handleAnswer = useCallback((cat) => {
    if (selected || !current) return;
    setSelected(cat);
    const isCorrect = cat === current.correct;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 4 ? 5 : 0 });
    setFeedback({ isCorrect, explanation: current.explanation, correct: current.correct });

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
        const pool = flatten(levelForTier(nextAdaptiveState.tier));
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current.slice(-4), next.name];
        setCurrent(next);
        setAsked(a => a + 1);
      }
    }, 1800);
  }, [selected, current, startTime, game, asked, adaptive]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Science Sort" emoji="🔬" subjectLabel="Science"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Science Scholar!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!current) return null;
  const topic = current.topic;

  return (
    <GameShell
      title="Science Sort" emoji="🔬" subject={`Science · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{asked + 1} / {SESSION_LENGTH}</Text>

        <View style={s.topicBadge}>
          <Text style={s.topicText}>📚 {topic.title}</Text>
        </View>

        <View style={s.itemCard}>
          <Text style={s.itemEmoji}>{current.name.split(' ')[0]}</Text>
          <Text style={s.itemName}>{current.name.replace(/^\S+\s/, '')}</Text>
          <Text style={s.question}>{topic.question}</Text>
        </View>

        <View style={s.categories}>
          {topic.categories.map(cat => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (cat === current.correct) { bg = G.success + '22'; border = G.success; }
              else if (cat === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity
                key={cat}
                style={[s.catBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(cat)}
                disabled={!!selected}
              >
                <Text style={[s.catText, selected && cat === current.correct && { color: G.success },
                  selected && cat === selected && cat !== current.correct && { color: G.error }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? `✓ Correct! It's a ${feedback.correct}` : `✗ It's actually a ${feedback.correct}`}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  progress:     { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  topicBadge:   { backgroundColor: G.tealL, borderRadius: 10, padding: 8, alignItems: 'center', marginBottom: 12, borderWidth: 0.5, borderColor: G.teal },
  topicText:    { fontSize: 13, color: G.teal, fontWeight: '600' },
  itemCard:     { backgroundColor: G.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  itemEmoji:    { fontSize: 56, marginBottom: 10 },
  itemName:     { fontSize: 20, fontWeight: '700', color: G.cream, marginBottom: 6 },
  question:     { fontSize: 13, color: G.muted, textAlign: 'center' },
  categories:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  catBtn:       { flex: 1, minWidth: '44%', padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  catText:      { fontSize: 14, fontWeight: '600', color: G.cream },
  feedback:     { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 6 },
  feedbackText: { fontSize: 13, color: G.cream, lineHeight: 18 },
});
