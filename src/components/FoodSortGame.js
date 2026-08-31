// src/components/FoodSortGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { FOOD_BANK, NUTRITION_TIPS } from '../data/gameContent/foodSort';

const SESSION_LENGTH = 15;

const BLURBS = {
  'K-2': 'Obvious healthy vs junk food picks.',
  '3-5': 'Adds "moderate" foods — pizza, cheese, juice.',
  '6-8': 'Sneaky ones — granola bars, trail mix, sports drinks.',
  '9-12': 'Nutrition science — glycemic index, processed protein, additives.',
};

function getCatConfig(G) {
  return {
    Healthy:  { color: G.success, label: '✓ Healthy',  bg: G.success + '22' },
    Moderate: { color: G.warning, label: '~ Moderate', bg: G.warning + '22' },
    Junk:     { color: G.error,   label: '✗ Junk',     bg: G.error + '22' },
  };
}

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.food));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function FoodSortGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const CAT_CONFIG = getCatConfig(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('junk');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [asked, setAsked] = useState(0);
  const [tip] = useState(() => NUTRITION_TIPS[Math.floor(Math.random() * NUTRITION_TIPS.length)]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'health', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(FOOD_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.food];
    setQ(first);
    setAsked(0);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const handleAnswer = useCallback((cat) => {
    if (selected || !q) return;
    setSelected(cat);
    const isCorrect = cat === q.category;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 3 ? 5 : 0 });
    setFeedback({ isCorrect, fact: q.fact, correct: q.category });

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
        const pool = FOOD_BANK[levelForTier(nextAdaptiveState.tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current.slice(-4), next.food];
        setQ(next);
        setAsked(a => a + 1);
      }
    }, 1800);
  }, [selected, q, startTime, game, asked, adaptive]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Food Sort" emoji="🍎" subjectLabel="Health"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Nutrition Expert!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!q) return null;

  return (
    <GameShell
      title="Food Sort" emoji="🍎" subject={`Health & Nutrition · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{asked + 1} / {SESSION_LENGTH}</Text>

        <View style={s.tipBanner}>
          <Text style={s.tipText}>{tip}</Text>
        </View>

        <View style={s.foodCard}>
          <Text style={s.foodEmoji}>{q.emoji}</Text>
          <Text style={s.foodName}>Is {q.food.replace(/^\S+\s/, '')} healthy, moderate, or junk food?</Text>
        </View>

        <View style={s.options}>
          {Object.entries(CAT_CONFIG).map(([cat, cfg]) => {
            let bg = cfg.bg, border = cfg.color;
            if (selected && cat !== q.category) { bg = G.card; border = G.border; }
            if (selected && cat === q.category) { bg = G.success + '33'; border = G.success; }
            return (
              <TouchableOpacity
                key={cat}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(cat)}
                disabled={!!selected}
              >
                <Text style={[s.optionText, { color: cfg.color }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : `✗ It's ${feedback.correct}!`}
            </Text>
            <Text style={s.feedbackFact}>{q.fact}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  progress:     { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tipBanner:    { backgroundColor: G.goldL, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: G.gold },
  tipText:      { fontSize: 12, color: G.gold, lineHeight: 16 },
  foodCard:     { backgroundColor: G.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  foodEmoji:    { fontSize: 60, marginBottom: 14 },
  foodName:     { fontSize: 17, fontWeight: '600', color: G.cream, textAlign: 'center' },
  options:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  option:       { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  optionText:   { fontSize: 14, fontWeight: '700' },
  feedback:     { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackFact: { fontSize: 13, color: G.cream, lineHeight: 18 },
});
