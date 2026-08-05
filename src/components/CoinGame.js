// src/components/CoinGame.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

// Keep original question generation logic — it's solid
const generateQuestion = (level) => {
  const maxCoins = Math.min(3 + level, 10);
  const cost = Math.floor(Math.random() * (30 + level * 10)) + 10;
  const exactMatch = level <= 3 ? Math.random() < 0.6 : Math.random() < 0.4;
  let amount;
  if (exactMatch) {
    amount = cost;
  } else {
    const diff = Math.floor(Math.random() * (5 + level * 2)) + 1;
    amount = Math.random() < 0.5 ? cost - diff : cost + diff;
  }
  if (amount < 0) amount = cost;

  const coins = [25, 10, 5, 1];
  const coinSet = [];
  let remaining = amount;
  if (level <= 3) {
    for (let coin of coins) {
      while (remaining >= coin && coinSet.length < maxCoins) {
        coinSet.push(coin); remaining -= coin;
      }
      if (remaining === 0) break;
    }
  } else {
    while (remaining > 0 && coinSet.length < maxCoins) {
      const coin = coins[Math.floor(Math.random() * coins.length)];
      if (coin <= remaining) { coinSet.push(coin); remaining -= coin; }
    }
  }

  const names = ['Billy','Sally','Tom','Lucy','Mike','Emma','Jake','Olivia'];
  const items = ['popsicle','toy','candy','sticker','balloon','pencil','eraser'];
  const name = names[Math.floor(Math.random() * names.length)];
  const item = items[Math.floor(Math.random() * items.length)];
  return { cost, coins: coinSet, amount, name, item };
};

const COIN_CONFIG = {
  25: { label: '25¢', color: '#C0C0C0', bg: '#2a2a2a' },
  10: { label: '10¢', color: '#FFA500', bg: '#2a1a00' },
  5:  { label: '5¢',  color: '#FFD700', bg: '#2a2000' },
  1:  { label: '1¢',  color: '#CD7F32', bg: '#1a1000' },
};

function CoinDisplay({ coins }) {
  return (
    <View style={s.coinSection}>
      <Text style={s.coinTitle}>Your Coins</Text>
      <View style={s.coinsGrid}>
        {coins.map((val, i) => {
          const cfg = COIN_CONFIG[val] || COIN_CONFIG[1];
          return (
            <View key={i} style={[s.coin, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
              <Text style={s.coinEmoji}>🪙</Text>
              <Text style={[s.coinLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function CoinGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [level, setLevel]         = useState(1);
  const [levelCorrect, setLC]     = useState(0);
  const [question, setQuestion]   = useState(() => generateQuestion(1));
  const [feedback, setFeedback]   = useState(null);
  const [retryMode, setRetryMode] = useState(false);
  const [retryInput, setRetryInput] = useState('');
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'math', difficulty: level > 5 ? 2 : 1, onGameEnd });

  useEffect(() => { setStartTime(Date.now()); }, [question]);

  const nextQuestion = (currentLevel, currentLC) => {
    const newLC = currentLC + 1;
    if (newLC >= 10) {
      if (currentLevel >= 10) { game.endGame(); return; }
      setLevel(l => l + 1);
      setLC(0);
      setTimeout(() => setQuestion(generateQuestion(currentLevel + 1)), 200);
    } else {
      setLC(newLC);
      setTimeout(() => setQuestion(generateQuestion(currentLevel)), 200);
    }
    setRetryMode(false);
    setRetryInput('');
    setFeedback(null);
  };

  const handleAnswer = (userAnswer) => {
    if (feedback) return;
    const hasEnough = question.amount >= question.cost;
    const isCorrect = userAnswer === hasEnough;
    const pts = game.answer(isCorrect, { speedBonus: (Date.now() - startTime) < 4000 ? 5 : 0 });

    const diff = question.amount - question.cost;
    const msg = isCorrect
      ? diff === 0 ? 'Exact amount — perfect!'
        : diff > 0 ? `${diff}¢ more than needed ✓`
        : 'Not enough ✓ (correct answer)'
      : diff >= 0 ? 'Actually has enough — try again'
        : 'Actually doesn\'t have enough — try again';

    setFeedback({ isCorrect, msg });

    if (isCorrect) {
      setTimeout(() => nextQuestion(level, levelCorrect), 1800);
    } else {
      setTimeout(() => { setFeedback(null); setRetryMode(true); }, 1800);
    }
  };

  const handleRetry = () => {
    const counted = parseInt(retryInput, 10);
    const isCorrect = counted === question.amount;
    game.answer(isCorrect);
    setFeedback({ isCorrect, msg: isCorrect ? `✓ ${question.amount}¢ — correct!` : `✗ It was ${question.amount}¢` });
    setTimeout(() => nextQuestion(level, levelCorrect), 1800);
  };

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Coin Master!"
      onPlayAgain={() => { game.reset(); setLevel(1); setLC(0); setQuestion(generateQuestion(1)); setFeedback(null); setRetryMode(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  const hasEnough = question.amount >= question.cost;

  return (
    <GameShell
      title="Coin Game" emoji="🪙" subject="Math · Money"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={levelCorrect / 10}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>Level {level} · {levelCorrect}/10</Text>
        </View>

        <View style={s.questionCard}>
          <Text style={s.tipText}>💡 Count the coins first, then decide!</Text>
          <Text style={s.question}>
            <Text style={s.name}>{question.name}</Text> wants to buy a {question.item} for{' '}
            <Text style={s.highlight}>{question.cost}¢</Text>.
            Does {question.name} have enough money?
          </Text>
        </View>

        <CoinDisplay coins={question.coins} />

        {!retryMode && !feedback && (
          <View style={s.yesNo}>
            <TouchableOpacity style={s.yesBtn} onPress={() => handleAnswer(true)}>
              <Text style={s.yesBtnText}>✓ Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.noBtn} onPress={() => handleAnswer(false)}>
              <Text style={s.noBtnText}>✗ No</Text>
            </TouchableOpacity>
          </View>
        )}

        {retryMode && !feedback && (
          <View style={s.retryCard}>
            <Text style={s.retryLabel}>Count the coins and type the total:</Text>
            <TextInput
              style={s.retryInput}
              value={retryInput}
              onChangeText={setRetryInput}
              keyboardType="numeric"
              placeholder="Total in ¢"
              placeholderTextColor={G.faint}
            />
            <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
              <Text style={s.retryBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : '✗ Not quite!'}
            </Text>
            <Text style={s.feedbackMsg}>{feedback.msg}</Text>
            <Text style={s.feedbackDetail}>
              {question.name} has <Text style={{ color: G.gold }}>{question.amount}¢</Text> and the item costs{' '}
              <Text style={{ color: G.gold }}>{question.cost}¢</Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const s = StyleSheet.create({
  scroll:        { padding: 16, paddingBottom: 40 },
  levelBadge:    { backgroundColor: G.goldL, borderRadius: 10, padding: 8, alignItems: 'center', marginBottom: 12, borderWidth: 0.5, borderColor: G.gold },
  levelText:     { fontSize: 12, color: G.gold, fontWeight: '700' },
  questionCard:  { backgroundColor: G.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: G.border, marginBottom: 14 },
  tipText:       { fontSize: 12, color: G.gold, marginBottom: 10 },
  question:      { fontSize: 16, color: G.cream, lineHeight: 24 },
  name:          { fontWeight: '700', color: G.teal },
  highlight:     { fontWeight: '700', color: G.gold },
  coinSection:   { backgroundColor: G.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  coinTitle:     { fontSize: 12, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  coinsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  coin:          { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  coinEmoji:     { fontSize: 22 },
  coinLabel:     { fontSize: 11, fontWeight: '700', marginTop: 2 },
  yesNo:         { flexDirection: 'row', gap: 12 },
  yesBtn:        { flex: 1, backgroundColor: G.success + '22', borderWidth: 1.5, borderColor: G.success, borderRadius: 14, padding: 18, alignItems: 'center' },
  yesBtnText:    { fontSize: 18, fontWeight: '700', color: G.success },
  noBtn:         { flex: 1, backgroundColor: G.error + '22', borderWidth: 1.5, borderColor: G.error, borderRadius: 14, padding: 18, alignItems: 'center' },
  noBtnText:     { fontSize: 18, fontWeight: '700', color: G.error },
  retryCard:     { backgroundColor: G.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: G.border },
  retryLabel:    { fontSize: 14, color: G.cream, marginBottom: 12 },
  retryInput:    { backgroundColor: G.bg, borderWidth: 1, borderColor: G.border, borderRadius: 10, padding: 14, fontSize: 18, color: G.cream, marginBottom: 12, textAlign: 'center' },
  retryBtn:      { backgroundColor: G.teal, borderRadius: 10, padding: 14, alignItems: 'center' },
  retryBtnText:  { fontSize: 15, fontWeight: '700', color: G.bg },
  feedback:      { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  feedbackMsg:   { fontSize: 14, color: G.cream, marginBottom: 6 },
  feedbackDetail:{ fontSize: 13, color: G.muted },
});
