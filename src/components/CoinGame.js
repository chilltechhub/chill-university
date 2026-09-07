// src/components/CoinGame.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import { useUIPrefs } from '../../context/UIPrefsContext';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';
import { roundLength } from '../logic/difficultyAdapter';

const TIER_CONFIG = {
  'K-2': { coins: [10, 5, 1],                          costFn: level => Math.floor(Math.random() * (15 + level * 4)) + 5,    startLevel: 1 },
  '3-5': { coins: [25, 10, 5, 1],                      costFn: level => Math.floor(Math.random() * (30 + level * 10)) + 10,  startLevel: 3 },
  '6-8': { coins: [100, 50, 25, 10, 5, 1],             costFn: level => Math.floor(Math.random() * (50 + level * 20)) + 20,  startLevel: 6 },
  '9-12':{ coins: [2000, 1000, 500, 100, 25, 10],      costFn: level => Math.floor(Math.random() * (200 + level * 60)) + 100, startLevel: 8 },
};

const BLURBS = {
  'K-2': 'Pennies, nickels & dimes — small amounts.',
  '3-5': 'Adds quarters — the classic coin mix.',
  '6-8': 'Half-dollars & dollar coins, bigger totals.',
  '9-12': '$5, $10 & $20 bills — real purchase-sized totals.',
};

// K-2/3-5/6-8 stay in cents; 9-12 deals in dollar-bill-sized amounts, so
// show those as real currency ($12.50) instead of a wall of cents (1250¢).
function formatCents(cents) {
  if (cents < 100) return `${cents}¢`;
  return `$${(cents / 100).toFixed(2)}`;
}

const generateQuestion = (level, tierKey) => {
  const cfg = TIER_CONFIG[tierKey] || TIER_CONFIG['3-5'];
  const maxCoins = Math.min(3 + level, 10);
  const cost = cfg.costFn(level);
  const exactMatch = level <= 3 ? Math.random() < 0.6 : Math.random() < 0.4;
  let amount;
  if (exactMatch) {
    amount = cost;
  } else {
    const diff = Math.floor(Math.random() * (5 + level * 2)) + 1;
    amount = Math.random() < 0.5 ? cost - diff : cost + diff;
  }
  if (amount < 0) amount = cost;

  const coins = cfg.coins;
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

  const names = ['Billy','Sally','Tom','Lucy','Mike','Emma','Jake','Olivia','Noah','Ava'];
  const items = ['popsicle','toy','candy','sticker','balloon','pencil','eraser','comic book','yo-yo','bookmark'];
  const name = names[Math.floor(Math.random() * names.length)];
  const item = items[Math.floor(Math.random() * items.length)];
  return { cost, coins: coinSet, amount, name, item };
};

const COIN_CONFIG = {
  2000:{ label: '$20', color: '#ffb3e6', bg: '#2a0a1a' },
  1000:{ label: '$10', color: '#ffd27f', bg: '#2a1a00' },
  500: { label: '$5',  color: '#b3e6b3', bg: '#0a2a10' },
  100:{ label: '$1',  color: '#8fd3ff', bg: '#0a1a2a' },
  50: { label: '50¢', color: '#c9f2c9', bg: '#0a2a10' },
  25: { label: '25¢', color: '#C0C0C0', bg: '#2a2a2a' },
  10: { label: '10¢', color: '#FFA500', bg: '#2a1a00' },
  5:  { label: '5¢',  color: '#FFD700', bg: '#2a2000' },
  1:  { label: '1¢',  color: '#CD7F32', bg: '#1a1000' },
};

function CoinDisplay({ coins, s }) {
  return (
    <View style={s.coinSection}>
      <Text style={s.coinTitle}>Your Coins</Text>
      <View style={s.coinsGrid}>
        {coins.map((val, i) => {
          const cfg = COIN_CONFIG[val] || COIN_CONFIG[1];
          return (
            <View key={i} style={[s.coin, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
              <Text style={s.coinEmoji}>{val >= 500 ? '💵' : '🪙'}</Text>
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
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level: skillLevel, setLevel: setSkillLevel } = useGradeLevel('coin');
  const [started, setStarted] = useState(false);

  const [level, setLevel]         = useState(1);
  const [levelCorrect, setLC]     = useState(0);
  // Rounds cleared THIS run — see the matching comment in FactorCraftGame.js
  // and roundLength() in difficultyAdapter.js.
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [roundMisses, setRoundMisses] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null); // { correct, total, roundNumber, nextLevel, isFinal }
  const [question, setQuestion]   = useState(null);
  const [feedback, setFeedback]   = useState(null);
  const [retryMode, setRetryMode] = useState(false);
  const [retryInput, setRetryInput] = useState('');
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'math', difficulty: level > 6 ? 3 : level > 3 ? 2 : 1, skillLevel, onGameEnd, manualScoring: true });

  useEffect(() => { if (question) setStartTime(Date.now()); }, [question]);

  const beginRun = () => {
    const cfg = TIER_CONFIG[skillLevel] || TIER_CONFIG['3-5'];
    setLevel(cfg.startLevel);
    setLC(0);
    setRoundsCompleted(0);
    setRoundMisses(0);
    setRoundComplete(null);
    setQuestion(generateQuestion(cfg.startLevel, skillLevel));
    setFeedback(null);
    setRetryMode(false);
    setRetryInput('');
    setStarted(true);
  };

  const nextQuestion = (currentLevel, currentLC, wasCorrect) => {
    const newLC = currentLC + 1;
    const needForLevel = roundLength(roundsCompleted);
    if (!wasCorrect) setRoundMisses(m => m + 1);
    if (newLC >= needForLevel) {
      // Round cleared — pause on a prize pick instead of moving straight to
      // the next level; no points land until it's claimed.
      setRoundComplete({
        correct: needForLevel, total: needForLevel + roundMisses + (wasCorrect ? 0 : 1),
        roundNumber: roundsCompleted + 1, nextLevel: currentLevel + 1, isFinal: currentLevel >= 10,
      });
    } else {
      setLC(newLC);
      setTimeout(() => setQuestion(generateQuestion(currentLevel, skillLevel)), 200);
    }
    setRetryMode(false);
    setRetryInput('');
    setFeedback(null);
  };

  const handleClaimPrize = useCallback(() => {
    const { nextLevel, isFinal } = roundComplete;
    setRoundComplete(null);
    if (isFinal) {
      game.endGame();
      return;
    }
    setLevel(nextLevel);
    setLC(0);
    setRoundMisses(0);
    setRoundsCompleted(rc => rc + 1);
    setTimeout(() => setQuestion(generateQuestion(nextLevel, skillLevel)), 200);
  }, [game, roundComplete, skillLevel]);

  const handleAnswer = (userAnswer) => {
    if (feedback || !question) return;
    const hasEnough = question.amount >= question.cost;
    const isCorrect = userAnswer === hasEnough;
    game.answer(isCorrect, { speedBonus: (Date.now() - startTime) < 4000 ? 5 : 0 });

    const diff = question.amount - question.cost;
    const msg = isCorrect
      ? diff === 0 ? 'Exact amount — perfect!'
        : diff > 0 ? `${formatCents(diff)} more than needed ✓`
        : 'Not enough ✓ (correct answer)'
      : diff >= 0 ? 'Actually has enough — try again'
        : 'Actually doesn\'t have enough — try again';

    setFeedback({ isCorrect, msg });
    const outOfLives = game.lives - (isCorrect ? 0 : 1) <= 0;

    if (isCorrect) {
      setTimeout(() => nextQuestion(level, levelCorrect, true), 1800);
    } else if (outOfLives) {
      setTimeout(() => game.endGame(), 1800);
    } else {
      setTimeout(() => { setFeedback(null); setRetryMode(true); }, 1800);
    }
  };

  const handleRetry = () => {
    const counted = parseInt(retryInput, 10);
    const isCorrect = counted === question.amount;
    game.answer(isCorrect);
    setFeedback({ isCorrect, msg: isCorrect ? `✓ ${formatCents(question.amount)} — correct!` : `✗ It was ${formatCents(question.amount)}` });
    const outOfLives = game.lives - (isCorrect ? 0 : 1) <= 0;
    if (!isCorrect && outOfLives) {
      setTimeout(() => game.endGame(), 1800);
    } else {
      setTimeout(() => nextQuestion(level, levelCorrect, isCorrect), 1800);
    }
  };

  if (!started) {
    return (
      <GradeSelectCard gameId="coin"
        title="Coin Game" emoji="🪙" subjectLabel="Math · Money"
        blurbs={BLURBS} level={skillLevel} onSelectLevel={setSkillLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="coin"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Coin Master!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="coin" disableFactToast
        title="Coin Game" emoji="🪙" subject={`Math · Money · ${skillLevel}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={level > 6 ? 3 : level > 3 ? 2 : 1}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  if (!question) return null;

  return (
    <GameShell gameId="coin"
      title="Coin Game" emoji="🪙" subject={`Math · Money · ${skillLevel}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={levelCorrect / roundLength(roundsCompleted)}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>Level {level} · {levelCorrect}/{roundLength(roundsCompleted)}</Text>
        </View>

        <View style={s.questionCard}>
          <Text style={s.tipText}>{showEmojis ? '💡 ' : ''}Count the coins first, then decide!</Text>
          <Text style={s.question}>
            <Text style={s.name}>{question.name}</Text> wants to buy a {question.item} for{' '}
            <Text style={s.highlight}>{formatCents(question.cost)}</Text>.
            Does {question.name} have enough money?
          </Text>
        </View>

        <CoinDisplay coins={question.coins} s={s} />

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
              {question.name} has <Text style={{ color: G.gold }}>{formatCents(question.amount)}</Text> and the item costs{' '}
              <Text style={{ color: G.gold }}>{formatCents(question.cost)}</Text>
            </Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
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
