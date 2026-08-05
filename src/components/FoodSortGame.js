// src/components/FoodSortGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const FOODS = [
  { food:'🍎 Apple',       category:'Healthy',   emoji:'🍎', fact:'Apples contain fiber that helps digestion.' },
  { food:'🍔 Burger',      category:'Junk',      emoji:'🍔', fact:'Burgers are high in saturated fat and sodium.' },
  { food:'🥦 Broccoli',    category:'Healthy',   emoji:'🥦', fact:'Broccoli has more vitamin C than an orange!' },
  { food:'🍕 Pizza',       category:'Moderate',  emoji:'🍕', fact:'Pizza can be healthy with veggie toppings.' },
  { food:'🍭 Lollipop',    category:'Junk',      emoji:'🍭', fact:'Sugar spikes blood sugar quickly.' },
  { food:'🥕 Carrot',      category:'Healthy',   emoji:'🥕', fact:'Carrots boost night vision thanks to beta-carotene.' },
  { food:'🍟 Fries',       category:'Junk',      emoji:'🍟', fact:'Deep frying removes most nutrients from potatoes.' },
  { food:'🍇 Grapes',      category:'Healthy',   emoji:'🍇', fact:'Grapes contain antioxidants that fight disease.' },
  { food:'🌮 Taco',        category:'Moderate',  emoji:'🌮', fact:'Tacos can include healthy beans and veggies.' },
  { food:'🥤 Soda',        category:'Junk',      emoji:'🥤', fact:'A can of soda has about 10 teaspoons of sugar.' },
  { food:'🥑 Avocado',     category:'Healthy',   emoji:'🥑', fact:'Avocados are full of healthy monounsaturated fats.' },
  { food:'🍦 Ice Cream',   category:'Junk',      emoji:'🍦', fact:'Ice cream is mostly sugar and saturated fat.' },
  { food:'🐟 Fish',        category:'Healthy',   emoji:'🐟', fact:'Fish provides omega-3 fatty acids for brain health.' },
  { food:'🧃 Juice',       category:'Moderate',  emoji:'🧃', fact:'Juice has vitamins but often lacks fiber.' },
  { food:'🥚 Egg',         category:'Healthy',   emoji:'🥚', fact:'Eggs are a complete protein with all amino acids.' },
  { food:'🍰 Cake',        category:'Junk',      emoji:'🍰', fact:'Cake is mostly refined flour and sugar.' },
  { food:'🫘 Beans',       category:'Healthy',   emoji:'🫘', fact:'Beans are high in protein and fiber.' },
  { food:'🍫 Chocolate',   category:'Moderate',  emoji:'🍫', fact:'Dark chocolate has antioxidants — in small amounts!' },
  { food:'🥜 Peanuts',     category:'Healthy',   emoji:'🥜', fact:'Peanuts are protein-packed and heart-healthy.' },
  { food:'🥓 Bacon',       category:'Junk',      emoji:'🥓', fact:'Bacon is very high in sodium and processed fat.' },
];

const CAT_CONFIG = {
  Healthy:  { color: G.success, label: '✓ Healthy',  bg: G.success + '22' },
  Moderate: { color: G.warning, label: '~ Moderate', bg: G.warning + '22' },
  Junk:     { color: G.error,   label: '✗ Junk',     bg: G.error + '22' },
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function FoodSortGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [questions]  = useState(() => shuffle(FOODS).slice(0, 15));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'science', difficulty: 1, onGameEnd });
  const q = questions[idx];

  const handleAnswer = useCallback((cat) => {
    if (selected) return;
    setSelected(cat);
    const isCorrect = cat === q.category;
    const speed = (Date.now() - startTime) / 1000;
    const speedBonus = speed < 3 ? 5 : 0;
    game.answer(isCorrect, { speedBonus });
    setFeedback({ isCorrect, fact: q.fact, correct: q.category });

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      if (game.lives - (isCorrect ? 0 : 1) <= 0 || idx >= questions.length - 1) {
        game.endGame();
      } else {
        setIdx(i => i + 1);
      }
    }, 1800);
  }, [selected, q, startTime, game, idx, questions]);

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Nutrition Expert!"
      onPlayAgain={() => { game.reset(); setIdx(0); setSelected(null); setFeedback(null); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
      title="Food Sort" emoji="🍎" subject="Health & Nutrition"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={idx / questions.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{idx + 1} / {questions.length}</Text>

        {/* Random nutrition tip */}
        <View style={s.tipBanner}>
          <Text style={s.tipText}>💡 Calcium from milk and cheese makes your bones strong!</Text>
        </View>

        <View style={s.foodCard}>
          <Text style={s.foodEmoji}>{q.emoji}</Text>
          <Text style={s.foodName}>Is {q.food.replace(/^\S+\s/, '')} healthy or junk food?</Text>
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
              {feedback.isCorrect ? '✓ Correct!' : `✗ It\'s ${feedback.correct}!`}
            </Text>
            <Text style={s.feedbackFact}>{q.fact}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const s = StyleSheet.create({
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
